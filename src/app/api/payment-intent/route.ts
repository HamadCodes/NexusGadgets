import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { calculateTaxRate, calculateTaxAmount } from '@/lib/taxCalculator';
import authOptions from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Continent mapping by country code (must match frontend)
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // North America
  US: 'NA', CA: 'NA', MX: 'NA',

  // Europe
  GB: 'EU', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU', BE: 'EU', AT: 'EU',
  IE: 'EU', PT: 'EU', GR: 'EU', FI: 'EU', SE: 'EU', DK: 'EU', PL: 'EU', CH: 'EU',

  // Asia
  CN: 'AS', JP: 'AS', IN: 'AS', PK: 'AS', SG: 'AS', KR: 'AS', TH: 'AS', MY: 'AS',
  VN: 'AS', ID: 'AS', PH: 'AS', BD: 'AS', SA: 'AS', AE: 'AS', TR: 'AS', IL: 'AS',

  // Oceania
  AU: 'OC', NZ: 'OC', FJ: 'OC', PG: 'OC',

  // South America
  BR: 'SA', AR: 'SA', CL: 'SA', CO: 'SA', PE: 'SA', VE: 'SA', EC: 'SA',

  // Africa
  ZA: 'AF', NG: 'AF', EG: 'AF', KE: 'AF', ET: 'AF', GH: 'AF', DZ: 'AF', MA: 'AF',

  // Default to Asia
  DEFAULT: 'AS'
};

// Shipping calculator - MUST MATCH FRONTEND LOGIC
function calculateShippingCost(countryCode: string, method: string): number {
  // Base shipping costs by country
  const shippingCosts: Record<string, Record<string, number>> = {
    // North America
    US: { standard: 5.99, express: 12.99, overnight: 24.99 },
    CA: { standard: 10.99, express: 19.99, overnight: 34.99 },
    MX: { standard: 12.99, express: 22.99, overnight: 39.99 },

    // Europe
    GB: { standard: 7.99, express: 14.99, overnight: 29.99 },
    DE: { standard: 8.99, express: 16.99, overnight: 31.99 },
    FR: { standard: 8.99, express: 16.99, overnight: 31.99 },
    IT: { standard: 8.99, express: 16.99, overnight: 31.99 },
    ES: { standard: 8.99, express: 16.99, overnight: 31.99 },

    // Asia
    CN: { standard: 10.99, express: 19.99, overnight: 34.99 },
    JP: { standard: 11.99, express: 21.99, overnight: 37.99 },
    IN: { standard: 9.99, express: 17.99, overnight: 32.99 },
    PK: { standard: 7.99, express: 14.99, overnight: 29.99 },
    SG: { standard: 8.99, express: 16.99, overnight: 31.99 },
    KR: { standard: 9.99, express: 17.99, overnight: 32.99 },

    // Oceania
    AU: { standard: 12.99, express: 22.99, overnight: 39.99 },
    NZ: { standard: 12.99, express: 22.99, overnight: 39.99 },

    // South America
    BR: { standard: 13.99, express: 24.99, overnight: 42.99 },
    AR: { standard: 13.99, express: 24.99, overnight: 42.99 },

    // Africa
    ZA: { standard: 14.99, express: 24.99, overnight: 44.99 },
    NG: { standard: 14.99, express: 24.99, overnight: 44.99 },
  };

  // Continent-based shipping rates
  const continentRates: Record<string, Record<string, number>> = {
    NA: { standard: 7.99, express: 15.99, overnight: 29.99 },
    EU: { standard: 8.99, express: 16.99, overnight: 31.99 },
    AS: { standard: 10.99, express: 19.99, overnight: 34.99 },
    SA: { standard: 12.99, express: 22.99, overnight: 39.99 },
    AF: { standard: 14.99, express: 24.99, overnight: 44.99 },
    OC: { standard: 12.99, express: 22.99, overnight: 39.99 },
  };

  // First try exact country match
  if (shippingCosts[countryCode]) {
    return shippingCosts[countryCode][method] || shippingCosts[countryCode].standard;
  }

  // Try continent-based rates
  const continentCode = COUNTRY_TO_CONTINENT[countryCode] || 'AS';
  if (continentRates[continentCode]) {
    return continentRates[continentCode][method] || continentRates[continentCode].standard;
  }

  // Fallback to Asia rates
  return continentRates.AS.standard;
}

// Define interfaces for cart items and products
interface CartItem {
  productId: string;
  color?: string;
  storage?: { storage: string; price: number };
  quantity: number;
}

interface Product {
  _id: ObjectId;
  price: number;
  // Add other properties as needed
}

interface User {
  _id: ObjectId;
  cart: CartItem[];
}

interface RequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  notes?: string;
  vatNumber?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    // Parse request body
    const requestBody: RequestBody = await req.json();
    
    // Destructure request body
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      address2,
      city,
      state,
      postalCode,
      country,
      shippingMethod,
      notes,
      vatNumber = '',
    } = requestBody;

    // Get client IP and user agent
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // Get user's cart
    const user = await db.collection<User>('users').findOne(
      { _id: userId },
      { projection: { cart: 1 } }
    );
    
    if (!user || !user.cart || user.cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate subtotal (in cents)
    let subtotalCents = 0;
    const productIds = user.cart.map((item: CartItem) => new ObjectId(item.productId));
    const products = await db.collection<Product>('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    for (const cartItem of user.cart) {
      const product = products.find(p => p._id.equals(new ObjectId(cartItem.productId)));
      if (!product) continue;
      
      let itemPrice = product.price * 100;
      if (cartItem.storage) {
        itemPrice += cartItem.storage.price * 100;
      }
      subtotalCents += itemPrice * (cartItem.quantity || 1);
    }

    // Calculate shipping cost (in cents)
    const shippingDollars = calculateShippingCost(country, shippingMethod);
    const shippingCostCents = Math.round(shippingDollars * 100);
    
    // Calculate tax rate and validation status
    const { rate: taxRate, isValid: vatValid } = await calculateTaxRate(country, state, vatNumber);
    const taxAmountCents = calculateTaxAmount(subtotalCents, taxRate);

    const totalCents = subtotalCents + shippingCostCents + taxAmountCents;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.ceil(totalCents),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      shipping: {
        name: `${firstName} ${lastName}`,
        phone,
        address: {
          line1: address,
          line2: address2 || undefined,
          city,
          state,
          postal_code: postalCode,
          country,
        },
      },
      metadata: {
        userId: session.user.id,
        clientIp,
        userAgent,
        shippingMethod,
        notes: notes || '',
        vatNumber: vatNumber || '',
        vatValid: vatValid.toString(),
        cart: JSON.stringify(user.cart.map((item: CartItem) => ({
          productId: item.productId.toString(),
          color: item.color,
          storage: item.storage,
          quantity: item.quantity || 1
        }))),
        subtotal: (subtotalCents / 100).toString(),
        shippingCost: (shippingCostCents / 100).toString(),
        taxAmount: (taxAmountCents / 100).toString(),
        taxRate: taxRate.toString(),
        total: (totalCents / 100).toString(),
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      taxRate,
      taxAmount: taxAmountCents / 100,
      shippingCost: shippingCostCents / 100,
      total: (totalCents / 100),
      vatValid
    });
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}