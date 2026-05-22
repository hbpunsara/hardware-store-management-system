import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Ensure DB import doesn't fail during tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb';

import { salesController } from '../controllers/sales.controller';

jest.mock('../storage', () => ({
  storage: {
    getSale: jest.fn(),
    createSale: jest.fn(),
    updateSaleStatus: jest.fn(),
    updateSaleEmailedAt: jest.fn(),
    getCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    addLoyaltyPoints: jest.fn(),
    getSalesStats: jest.fn(),
  }
}));

import { storage } from '../storage';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as any;
}

describe('salesController', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  test('create returns 400 when items missing', async () => {
    const req: any = { body: { subtotal: 100 } };
    const res = mockRes();
    await salesController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Sale must contain items' });
  });

  test('voidSale returns 400 for invalid id', async () => {
    const req: any = { params: { id: 'abc' }, body: { managerPin: '1234' } };
    const res = mockRes();
    await salesController.voidSale(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid sale ID' });
  });

  test('voidSale returns 403 for invalid manager pin', async () => {
    const req: any = { params: { id: '1' }, body: { managerPin: '0000' } };
    const res = mockRes();
    await salesController.voidSale(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Manager PIN' });
  });

  test('emailInvoice returns 400 when email missing', async () => {
    const req: any = { params: { id: '1' }, body: {} };
    const res = mockRes();
    await salesController.emailInvoice(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
  });
});
