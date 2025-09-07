import { NextRequest, NextResponse } from 'next/server';
import { calculateTaxRate } from '@/lib/taxCalculator';

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || '';
  const region = req.nextUrl.searchParams.get('state') || '';
  const subtotal = parseFloat(req.nextUrl.searchParams.get('subtotal') || '0');
  const vat = req.nextUrl.searchParams.get('vat') || '';
  
  if (!country || !region) {
    return NextResponse.json(
      { error: 'Missing required parameters: country and state' },
      { status: 400 }
    );
  }

  try {
    // Get tax rate and validation status
    const { rate, isValid } = await calculateTaxRate(country, region, vat);
    const taxAmount = subtotal * rate;
    
    return NextResponse.json({
      rate,
      amount: taxAmount,
      vatValid: isValid,
      details: {
        country,
        region,
        vat,
        source: 'sales-tax'
      }
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    
    // Fallback rate based on country
    const fallbackRate = getFallbackTaxRate(country);
    const taxAmount = subtotal * fallbackRate;
    
    return NextResponse.json({
      rate: fallbackRate,
      amount: taxAmount,
      vatValid: false,
      details: {
        country,
        region,
        vat,
        source: 'fallback',
        error: 'Using fallback tax rate'
      }
    });
  }
}

// Fallback tax rates for error scenarios
function getFallbackTaxRate(countryCode: string): number {
  const taxRates: Record<string, number> = {
    US: 0.08,
    CA: 0.13,
    MX: 0.16,
    GB: 0.20,
    DE: 0.19,
    FR: 0.20,
    IT: 0.22,
    ES: 0.21,
    CN: 0.13,
    JP: 0.10,
    IN: 0.18,
    PK: 0.16,
    SG: 0.07,
    KR: 0.10,
    AU: 0.10,
    NZ: 0.15,
    BR: 0.17,
    AR: 0.21,
    ZA: 0.15,
    NG: 0.07
  };

  return taxRates[countryCode] || 0.10;
}