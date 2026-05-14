import { Request, Response } from "express";
import { storage } from "../storage";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const authController = {
  login: async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days session
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  },

  logout: (_req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({ message: "Logged out successfully" });
  },

  me: async (req: Request, res: Response) => {
    // With cookie-based auth, req.user is set by the middleware
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
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
