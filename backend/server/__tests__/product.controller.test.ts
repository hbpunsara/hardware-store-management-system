import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { productController } from '../controllers/product.controller';

// Mock the storage module
jest.mock('../storage', () => ({
  storage: {
    getProduct: jest.fn(),
    createProduct: jest.fn(),
    getAllProducts: jest.fn(),
    searchProducts: jest.fn(),
    deleteProduct: jest.fn(),
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

describe('productController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('getById returns 400 for invalid id', async () => {
    const req: any = { params: { id: 'abc' } };
    const res = mockRes();
    await productController.getById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid product id' });
  });

  test('getById returns 404 when not found', async () => {
    (storage.getProduct as any).mockResolvedValue(undefined);
    const req: any = { params: { id: '999' } };
    const res = mockRes();
    await productController.getById(req, res);
    expect(storage.getProduct).toHaveBeenCalledWith(999);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
  });

  test('getById returns product when found', async () => {
    const fakeRow = { id: 1, sku: 'SKU1', name: 'Widget', category: 'Tools', price: '12.50', stock: 5, supplier: null };
    (storage.getProduct as any).mockResolvedValue(fakeRow);
    const req: any = { params: { id: '1' } };
    const res = mockRes();
    await productController.getById(req, res);
    expect(res.json).toHaveBeenCalledWith({ id: 1, sku: 'SKU1', name: 'Widget', category: 'Tools', price: 12.5, stock: 5, supplier: undefined });
  });

  test('create returns 201 on success', async () => {
    const createInput = { sku: 'SKU2', name: 'Bolt', category: 'Hardware', price: 1.5 };
    const createdRow = { id: 2, ...createInput, stock: 0, supplier: null };
    (storage.createProduct as any).mockResolvedValue(createdRow);
    const req: any = { body: createInput };
    const res = mockRes();
    await productController.create(req, res);
    expect(storage.createProduct).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  test('create returns 400 for duplicate SKU (23505)', async () => {
    (storage.createProduct as any).mockRejectedValue({ code: '23505', detail: 'duplicate key' });
    const req: any = { body: { sku: 'DUP', name: 'Dup', category: 'X', price: 1 } };
    const res = mockRes();
    await productController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'A product with this SKU already exists' });
  });
});
