import { Request, Response } from "express";
import { storage } from "../storage";

const STORE_KEYS = [
  "store_name",
  "store_address",
  "store_phone",
  "store_email",
  "store_tax_id",
  "store_currency",
  "receipt_header",
  "receipt_footer",
  "receipt_print_logo",
  "tax_rate",
  "tax_show_breakdown",
  "tax_inclusive",
  "printer_default",
  "printer_paper_size",
  "sync_sales",
  "sync_inventory",
  "sync_employees",
  "sync_finance",
  "sync_offline_fallback",
  "security_session_timeout",
  "security_password_policy",
  "notify_low_stock",
  "notify_daily_sales",
  "notify_employee_login",
  "notify_updates",
  "notify_payroll",
  "database_backup_frequency",
  "database_keep_backups",
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
