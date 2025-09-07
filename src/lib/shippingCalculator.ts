export function calculateShippingCost(country: string, method: string): number {
  const shippingCosts: Record<string, Record<string, number>> = {
    US: { standard: 5.99, express: 12.99, overnight: 24.99 },
    CA: { standard: 10.99, express: 19.99, overnight: 34.99 },
    MX: { standard: 12.99, express: 22.99, overnight: 39.99 },
    GB: { standard: 7.99, express: 14.99, overnight: 29.99 },
    DE: { standard: 8.99, express: 16.99, overnight: 31.99 },
    FR: { standard: 8.99, express: 16.99, overnight: 31.99 },
    AU: { standard: 12.99, express: 22.99, overnight: 39.99 },
    JP: { standard: 11.99, express: 21.99, overnight: 37.99 },
    CN: { standard: 10.99, express: 19.99, overnight: 34.99 },
    IN: { standard: 9.99, express: 17.99, overnight: 32.99 },
    BR: { standard: 13.99, express: 24.99, overnight: 42.99 },
    default: { standard: 14.99, express: 24.99, overnight: 44.99 }
  };

  const countryCosts = shippingCosts[country] || shippingCosts.default;
  return countryCosts[method] || countryCosts.standard;
}