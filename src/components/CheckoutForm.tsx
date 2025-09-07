"use client"

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StripeCardElementOptions } from '@stripe/stripe-js';
import useCart, { CartItem } from '@/hooks/useCart';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import Image from 'next/image';

// Continent mapping by country code
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

// Define CartProduct types
type CartProductBase = {
  id: string;
  name: string;
  imageUrls: string[];
  price: number;
  slug: string;
};

type CartProduct = CartProductBase & {
  cartItem: CartItem;
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cart: cartItems, initialized: cartInitialized } = useCart();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  // Location data
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  // Order summary
  const [shippingCost, setShippingCost] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Cart products state
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loadingCartProducts, setLoadingCartProducts] = useState(false);

  const [vatValid, setVatValid] = useState<boolean | null>(null);
  const [vatChecking, setVatChecking] = useState(false);
  
  // Backend calculated values
  const [backendTotal, setBackendTotal] = useState(0);

  // Add this effect for VAT validation
  useEffect(() => {
    if (!country || !vatNumber || vatNumber.trim().length < 4) {
      setVatValid(null);
      return;
    }

    // Debounce validation
    const handler = setTimeout(async () => {
      setVatChecking(true);
      try {
        const response = await fetch(`/api/validate-vat?country=${country}&vat=${encodeURIComponent(vatNumber)}`);
        if (response.ok) {
          const { valid } = await response.json();
          setVatValid(valid);
        } else {
          setVatValid(false);
        }
      } catch {
        setVatValid(false);
      } finally {
        setVatChecking(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [vatNumber, country]);

  // Initialize countries
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (country) {
      const countryStates = State.getStatesOfCountry(country);
      setStates(countryStates);
      setState(countryStates[0]?.isoCode || '');
      setCity('');
    }
  }, [country]);

  // Update cities when state changes
  useEffect(() => {
    if (country && state) {
      const selectedState = states.find(s => s.isoCode === state);
      if (selectedState) {
        setStateName(selectedState.name);
        const stateCities = City.getCitiesOfState(country, state);
        setCities(stateCities);
        setCity(stateCities[0]?.name || '');
      }
    }
  }, [country, state, states]);

  // Fetch product details for cart items
  useEffect(() => {
    if (!cartInitialized || !cartItems || Object.keys(cartItems).length === 0) {
      setCartProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoadingCartProducts(true);
      try {
        // Get unique product IDs
        const productIds = [...new Set(
          Object.values(cartItems).map(item => item.productId)
        )];

        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: productIds }),
        });

        if (!res.ok) throw new Error('Failed to fetch products');

        const productsData: CartProductBase[] = await res.json();

        // Map cart items to products
        const productsWithCartInfo = Object.values(cartItems).map(item => {
          const product = productsData.find(p => p.id === item.productId);
          if (!product) return null;

          return {
            ...product,
            cartItem: item
          } as CartProduct;
        }).filter(Boolean) as CartProduct[];

        setCartProducts(productsWithCartInfo);
      } catch (error) {
        console.error('Error fetching cart products', error);
      } finally {
        setLoadingCartProducts(false);
      }
    };

    fetchProducts();
  }, [cartInitialized, cartItems]);

  // Calculate subtotal from cart products
  const subtotal = useMemo(() => {
    if (!cartProducts.length) return 0;

    return cartProducts.reduce((total, product) => {
      const basePrice = product.price;
      const storagePrice = product.cartItem.storage?.price || 0;
      const quantity = product.cartItem.quantity || 1;
      return total + (basePrice + storagePrice) * quantity;
    }, 0);
  }, [cartProducts]);

  // Calculate tax and shipping
  useEffect(() => {
    if (!country || !state || subtotal <= 0) {
      // Reset values if conditions aren't met
      if (shippingCost !== 0) setShippingCost(0);
      if (taxRate !== 0) setTaxRate(0);
      if (taxAmount !== 0) setTaxAmount(0);
      return;
    }

    const calculateTaxAndShipping = async () => {
      setIsCalculating(true);
      setError('');

      try {
        // Calculate shipping cost
        const shipping = calculateShippingCost(country, shippingMethod);
        setShippingCost(shipping);

        // Fetch tax rate from API with VAT number
        const response = await fetch(
          `/api/tax?country=${country}&state=${state}&subtotal=${subtotal}&vat=${encodeURIComponent(vatNumber)}`
        );

        if (!response.ok) {
          throw new Error('Tax calculation failed');
        }

        const data = await response.json();
        setTaxRate(data.rate || 0);
        setTaxAmount(data.amount || 0);
      } catch (error) {
        console.error('Calculation error:', error);
        setError('Failed to calculate taxes. Using fallback rates.');
        const fallbackRate = getFallbackTaxRate(country);
        setTaxRate(fallbackRate);
        setTaxAmount(subtotal * fallbackRate);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateTaxAndShipping();
  }, [country, state, shippingMethod, subtotal, vatNumber, shippingCost, taxAmount, taxRate]);

  // Global shipping calculator
  const calculateShippingCost = (countryCode: string, method: string): number => {
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
    const continentCode = COUNTRY_TO_CONTINENT[countryCode] || COUNTRY_TO_CONTINENT.DEFAULT;
    if (continentRates[continentCode]) {
      return continentRates[continentCode][method] || continentRates[continentCode].standard;
    }

    // Fallback to Asia rates
    return continentRates.AS.standard;
  };

  // Global fallback tax rates
  const getFallbackTaxRate = (countryCode: string): number => {
    const taxRates: Record<string, number> = {
      // North America
      US: 0.08,
      CA: 0.13,
      MX: 0.16,

      // Europe
      GB: 0.20,
      DE: 0.19,
      FR: 0.20,
      IT: 0.22,
      ES: 0.21,

      // Asia
      CN: 0.13,
      JP: 0.10,
      IN: 0.18,
      PK: 0.16,
      SG: 0.07,
      KR: 0.10,

      // Oceania
      AU: 0.10,
      NZ: 0.15,

      // South America
      BR: 0.17,
      AR: 0.21,

      // Africa
      ZA: 0.15,
      NG: 0.07
    };

    return taxRates[countryCode] || 0.10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Validate required fields
      const requiredFields = [firstName, lastName, email, phone, address, city, state, postalCode];
      if (requiredFields.some(field => !field.trim())) {
        throw new Error('Please fill in all required fields');
      }

      // Create payment intent
      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          vatNumber,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret, shippingCost, taxAmount, taxRate, total } = await response.json();
      
      // Update UI with backend-calculated values
      setShippingCost(shippingCost);
      setTaxAmount(taxAmount);
      setTaxRate(taxRate);
      setBackendTotal(total);

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email,
            phone,
            address: {
              line1: address,
              line2: address2,
              city,
              state,
              postal_code: postalCode,
              country,
            },
          },
        }
      });

      if (result.error) throw result.error;
      if (!result.paymentIntent) throw new Error('No payment intent received');

      // Handle payment status
      switch (result.paymentIntent.status) {
        case 'succeeded':
          router.push('/thank-you');
          break;
        case 'requires_action':
          const actionResult = await stripe.confirmCardPayment(clientSecret);
          if (actionResult.error) throw actionResult.error;
          router.push('/thank-you');
          break;
        default:
          throw new Error(`Unhandled status: ${result.paymentIntent.status}`);
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message || 'Payment failed');
      } else {
        setError('Payment failed');
      }
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': { color: '#aab7c4' },
      },
      invalid: { color: '#9e2146' },
    },
  };

  const shippingMethods = [
    { id: 'standard', name: 'Standard Shipping (5-7 days)', price: 5.99 },
    { id: 'express', name: 'Express Shipping (2-3 days)', price: 12.99 },
    { id: 'overnight', name: 'Overnight Shipping', price: 24.99 }
  ];

  // Calculate total using backend values
  const total = useMemo(() => {
    return backendTotal > 0 ? backendTotal : (subtotal + shippingCost + taxAmount);
  }, [subtotal, shippingCost, taxAmount, backendTotal]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {!cartInitialized ? (
        <div className="w-full text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block mb-1">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block mb-1">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block mb-1">Email *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block mb-1">Phone *</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* VAT Number Field */}
            <div>
              <label htmlFor="vatNumber" className="block mb-1">VAT Number (Optional)</label>
              <input
                type="text"
                id="vatNumber"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="For business customers"
              />
            </div>
            <div className="mt-1">
              {vatChecking ? (
                <div className="flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span>Checking VAT number...</span>
                </div>
              ) : vatValid === false ? (
                <div className="text-red-500 text-sm">
                  Invalid VAT number. Please check or remove for consumer rates.
                </div>
              ) : vatValid ? (
                <div className="text-green-600 text-sm">
                  Valid VAT number. Business rates applied.
                </div>
              ) : null}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3">Shipping Address</h3>
              <div>
                <label htmlFor="address" className="block mb-1">Street Address *</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-3">
                <label htmlFor="address2" className="block mb-1">Apt, Suite, etc. (Optional)</label>
                <input
                  type="text"
                  id="address2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label htmlFor="country" className="block mb-1">Country *</label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="state" className="block mb-1">State/Province *</label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!country}
                  >
                    <option value="" disabled>Select a state</option>
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block mb-1">City *</label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!state}
                  >
                    <option value="" disabled>Select a city</option>
                    {cities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="postalCode" className="block mb-1">Postal Code *</label>
                <input
                  type="text"
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3">Shipping Method</h3>
              <div className="space-y-2">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex items-center">
                    <input
                      type="radio"
                      id={method.id}
                      name="shippingMethod"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={() => setShippingMethod(method.id)}
                      className="mr-2"
                      required
                    />
                    <label htmlFor={method.id} className="flex-1">
                      {method.name} - ${method.price.toFixed(2)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block mb-1">Order Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Special instructions, delivery preferences, etc."
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3">Payment Information</h3>
              <div>
                <label className="block mb-1">Card Details *</label>
                <div className="border p-3 rounded bg-white">
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 p-3 bg-red-50 rounded border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || !stripe || isCalculating || subtotal === 0}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-300"
            >
              {isProcessing
                ? 'Processing Payment...'
                : isCalculating
                  ? 'Calculating Taxes...'
                  : `Pay Now $${total.toFixed(2)}`}
            </button>
          </form>

          <div className="w-full lg:w-96 bg-gray-50 p-6 rounded-lg h-fit border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>

            {/* Cart Items Display */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {loadingCartProducts ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : cartProducts.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                cartProducts.map((product) => {
                  const item = product.cartItem;
                  const basePrice = product.price;
                  const storagePrice = item.storage?.price || 0;
                  const itemPrice = basePrice + storagePrice;
                  const totalItemPrice = itemPrice * (1);

                  return (
                    <div
                      key={`${product.id}-${item.color.name}${item.storage ? `-${item.storage.storage}` : ''}`}
                      className="flex items-center gap-3 border-b pb-3 last:border-0"
                    >
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain rounded-md"
                        unoptimized={false}
                        priority={false}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Color: {item.color.name}
                          {item.storage && `, Storage: ${item.storage.storage}`}
                        </p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-medium">${totalItemPrice.toFixed(2)}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Order Calculation Summary */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>
                  Tax ({taxRate > 0 ? (taxRate * 100).toFixed(2) + '%' : 'Calculated'})
                </span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium mb-2">Shipping to:</h4>
              <p className="text-sm">
                {address}{address2 && `, ${address2}`}<br />
                {city}, {stateName} {postalCode}<br />
                {countries.find(c => c.isoCode === country)?.name}
                {vatNumber && <><br />VAT: {vatNumber}</>}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutForm;