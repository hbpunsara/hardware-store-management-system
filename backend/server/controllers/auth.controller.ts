import { Request, Response } from "express";
import { storage } from "../storage";

export const authController = {
  login: async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  },

  logout: (_req: Request, res: Response) => {
    res.json({ message: "Logged out successfully" });
  },

  me: async (req: Request, res: Response) => {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  },

  forceLogout: async (req: Request, res: Response) => {
    try {
      const { db } = require("../db");
      const { storeSettings } = require("../../shared/schema");
      const { sql } = require("drizzle-orm");
      
      const currentVersionResult = await (db as any).select().from(storeSettings).where(sql`key = 'global_token_version'`);
      let version = 1;
      if (currentVersionResult.length > 0) {
        version = parseInt(currentVersionResult[0].value) + 1;
        await (db as any).update(storeSettings)
          .set({ value: version.toString() })
          .where(sql`key = 'global_token_version'`);
      } else {
        await (db as any).insert(storeSettings)
          .values({ key: "global_token_version", value: "1" });
      }
      res.json({ message: "All sessions revoked", tokenVersion: version });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to force logout" });
    }
  },
};
