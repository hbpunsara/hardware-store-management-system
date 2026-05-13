import { describe, test, expect } from '@jest/globals';
import { posEngine } from '../lib/posEngine';

describe('POS Calculation Engine', () => {
  test('should calculate tax and discount correctly', () => {
    const input = {
      items: [
        { price: 1000, quantity: 2 }, // 2000
        { price: 500, quantity: 1 }   // 500
      ],
      taxRate: 0.15, // 15%
      discountPercent: 0.10 // 10%
    };

    const result = posEngine.calculate(input);

    // Subtotal: 2500
    expect(result.subtotal).toBe(2500);
    // Discount: 2500 * 0.10 = 250
    expect(result.discountTotal).toBe(250);
    // Taxable: 2500 - 250 = 2250
    // Tax: 2250 * 0.15 = 337.5
    expect(result.taxTotal).toBe(337.5);
    // Total: 2250 + 337.5 = 2587.5
    expect(result.total).toBe(2587.5);
  });

  test('should handle zero tax and discount', () => {
    const input = {
      items: [{ price: 100, quantity: 5 }],
      taxRate: 0,
      discountPercent: 0
    };

    const result = posEngine.calculate(input);

    expect(result.subtotal).toBe(500);
    expect(result.discountTotal).toBe(0);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(500);
  });
});
