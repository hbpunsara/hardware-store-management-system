import { Request, Response } from "express";
import { storage } from "../storage";

function toTransactionRow(row: { id: number; date: string; description: string; category: string; type: string; amount: number | string; method: string; customerId: number | null }) {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    category: row.category,
    type: row.type,
    amount: Number(row.amount),
    method: row.method,
    customerId: row.customerId,
  };
}

export const transactionsController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllTransactions();
    res.json(rows.map(toTransactionRow));
  },

  create: async (req: Request, res: Response) => {
    const { date, description, category, type, amount, method } = req.body;
    if (!date || !description || !category || !type || amount == null || !method) {
      return res.status(400).json({ message: "Missing required fields: date, description, category, type, amount, method" });
    }
    const row = await storage.createTransaction({
      date: String(date),
      description: String(description),
      category: String(category),
      type: String(type),
      amount: Number(amount),
      method: String(method),
    });
    res.status(201).json(toTransactionRow(row));
  },
};
