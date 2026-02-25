import { Request, Response } from "express";
import { storage } from "../storage";

const STORE_KEYS = [
  "store_name",
  "store_address",
  "store_phone",
  "store_email",
  "store_tax_id",
  "store_currency",
] as const;

export const storeController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllStoreSettings();
    const obj: Record<string, string> = {};
    for (const r of rows) {
      obj[r.key] = r.value ?? "";
    }
    res.json(obj);
  },

  update: async (req: Request, res: Response) => {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Body must contain settings object" });
    }
    for (const key of STORE_KEYS) {
      if (settings[key] !== undefined) {
        await storage.setStoreSetting(key, String(settings[key]));
      }
    }
    const rows = await storage.getAllStoreSettings();
    const obj: Record<string, string> = {};
    for (const r of rows) {
      obj[r.key] = r.value ?? "";
    }
    res.json(obj);
  },
};
