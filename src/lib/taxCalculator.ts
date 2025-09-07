import SalesTax from 'sales-tax';

// Set tax origin country from environment variable
const TAX_ORIGIN = process.env.TAX_ORIGIN_COUNTRY || 'US';
SalesTax.setTaxOriginCountry(TAX_ORIGIN);

// Enable VAT fraud checking
SalesTax.toggleEnabledTaxNumberFraudCheck(true);

// Global fallback tax rates
const FALLBACK_TAX_RATES: Record<string, number> = {
  US: 0.08, CA: 0.13, MX: 0.16, GB: 0.20, DE: 0.19, 
  FR: 0.20, IT: 0.22, ES: 0.21, CN: 0.13, JP: 0.10,
  IN: 0.18, PK: 0.16, SG: 0.07, KR: 0.10, AU: 0.10,
  NZ: 0.15, BR: 0.17, ZA: 0.15, DEFAULT: 0.10
};

export async function calculateTaxRate(
  country: string,
  region: string,
  vatNumber?: string
): Promise<{ rate: number; isValid: boolean }> {
  try {
    // Validate VAT number if provided
    let isValid = false;
    if (vatNumber && country) {
      try {
        isValid = await SalesTax.validateTaxNumber(country, vatNumber);
      } catch (validationError) {
        console.error('VAT validation error:', validationError);
        isValid = false;
      }
    }

    // Get tax rate
    const tax = await SalesTax.getSalesTax(country, region, vatNumber);
    const taxRate = tax.charge.direct ? tax.rate : 0;
    
    return { rate: taxRate, isValid };
  } catch (error) {
    console.error('SalesTax module error:', error);
    return {
      rate: FALLBACK_TAX_RATES[country] || FALLBACK_TAX_RATES.DEFAULT,
      isValid: false
    };
  }
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return subtotal * taxRate;
}

// Separate function to validate VAT number
export async function validateVATNumber(country: string, vatNumber: string): Promise<boolean> {
  try {
    if (!country || !vatNumber) {
      return false;
    }
    return await SalesTax.validateTaxNumber(country, vatNumber);
  } catch (error) {
    console.error('VAT validation error:', error);
    return false;
  }
}