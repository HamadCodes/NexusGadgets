import { NextRequest, NextResponse } from 'next/server';
import { validateVATNumber } from '@/lib/taxCalculator';

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || '';
  const vat = req.nextUrl.searchParams.get('vat') || '';
  
  if (!country || !vat) {
    return NextResponse.json(
      { error: 'Missing required parameters: country and vat' },
      { status: 400 }
    );
  }

  try {
    const isValid = await validateVATNumber(country, vat);
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('VAT validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate VAT number' },
      { status: 500 }
    );
  }
}