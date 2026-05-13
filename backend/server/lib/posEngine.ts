/**
 * POS Calculation Engine
 * Handles Tax and Discount calculations
 */

export interface POSInput {
  items: Array<{ price: number; quantity: number }>;
  taxRate: number; // e.g. 0.08 for 8%
  discountPercent: number; // e.g. 0.10 for 10%
}

export interface POSResult {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

export const posEngine = {
  calculate(input: POSInput): POSResult {
    const { items, taxRate, discountPercent } = input;

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountTotal = Math.round(subtotal * discountPercent * 100) / 100;
    
    const taxableAmount = subtotal - discountTotal;
    const taxTotal = Math.round(taxableAmount * taxRate * 100) / 100;

    const total = Math.round((taxableAmount + taxTotal) * 100) / 100;

    return {
      subtotal,
      discountTotal,
      taxTotal,
      total
    };
  }
};
