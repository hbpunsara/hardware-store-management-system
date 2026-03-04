import { Request, Response } from "express";
import { storage } from "../storage";
import { products } from "../../shared/schema";

function toProductRow(row: typeof products.$inferSelect) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    supplier: row.supplier ?? undefined,
  };
}

export const productController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllProducts();
    res.json(rows.map(toProductRow));
  },

  getById: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const row = await storage.getProduct(id);
    if (!row) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(toProductRow(row));
  },

  create: async (req: Request, res: Response) => {
    try {
      const { sku, name, category, price, stock, supplier } = req.body;
      if (!sku || !name || !category || price == null) {
        return res.status(400).json({ message: "Missing required fields: sku, name, category, price" });
      }
      const priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: "Price must be a valid positive number" });
      }
      const insertData = {
        sku: String(sku).trim(),
        name: String(name).trim(),
        category: String(category),
        price: priceNum,
        stock: Number(stock) || 0,
        supplier: supplier ? String(supplier) : null,
      };
      const row = await storage.createProduct(insertData);
      res.status(201).json(toProductRow(row));
    } catch (err: unknown) {
      const msg = (err as { code?: string; detail?: string }).detail ?? (err as Error).message;
      if ((err as { code?: string }).code === "23505") {
        return res.status(400).json({ message: "A product with this SKU already exists" });
      }
      console.error("Create product error:", err);
      res.status(500).json({ message: msg || "Failed to create product" });
    }
  },

  update: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const { sku, name, category, price, stock, supplier } = req.body;
    const updateData = {};
    if (sku != null) (updateData as Record<string, unknown>).sku = String(sku);
    if (name != null) (updateData as Record<string, unknown>).name = String(name);
    if (category != null) (updateData as Record<string, unknown>).category = String(category);
    if (price != null) (updateData as Record<string, unknown>).price = String(price);
    if (stock != null) (updateData as Record<string, unknown>).stock = Number(stock);
    if (supplier !== undefined) (updateData as Record<string, unknown>).supplier = supplier ? String(supplier) : null;
    const row = await storage.updateProduct(id, updateData);
    if (!row) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(toProductRow(row));
  },

  delete: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const success = await storage.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  },

  search: async (req: Request, res: Response) => {
    const q = (req.query.q as string)?.trim() || "";
    let rows;
    if (!q) {
      rows = await storage.getAllProducts();
    } else {
      rows = await storage.searchProducts(q);
    }
    res.json(rows.map(toProductRow));
  },
};
