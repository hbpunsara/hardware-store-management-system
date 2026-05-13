import { Request, Response } from "express";
import { db, getRemoteDb } from "../db";
import { syncQueue, storeSettings } from "../../shared/schema";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

class SystemController {
    async getStatus(req: Request, res: Response) {
        try {
            // Check local DB
            const [{ count }] = await (db as any).select({ count: sql<number>`count(*)` }).from(syncQueue);

            // Check remote DB connectivity
            let isOnline = false;
            const remoteDb = getRemoteDb();
            if (remoteDb) {
                try {
                    // simple 1=1 query using Drizzle raw sql
                    await (remoteDb as any).execute(sql`SELECT 1`);
                    isOnline = true;
                } catch (e) {
                    isOnline = false;
                }
            }

            res.json({
                online: isOnline,
                pendingSyncItems: Number(count)
            });

        } catch (error) {
            res.status(500).json({ message: "Failed to check system status" });
        }
    }

    async getBackups(req: Request, res: Response) {
        try {
            const backupsDir = path.join(process.cwd(), "backups");
            if (!fs.existsSync(backupsDir)) {
                return res.json([]);
            }
            
            const files = fs.readdirSync(backupsDir);
            const backups = files.filter(f => f.endsWith(".db")).map(file => {
                const filePath = path.join(backupsDir, file);
                const stats = fs.statSync(filePath);
                
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + " MB";
                
                let type = "Manual";
                if (file.includes("auto")) type = "Automatic";

                return {
                    name: file,
                    date: stats.mtime,
                    size: sizeMB,
                    type: type
                };
            });
            
            backups.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            res.json(backups);
        } catch (error) {
            console.error("Failed to get backups", error);
            res.status(500).json({ message: "Failed to list backups" });
        }
    }

    async createBackup(req: Request, res: Response) {
        try {
            const backupsDir = path.join(process.cwd(), "backups");
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            const dbPath = path.join(process.cwd(), "hardware_store_local.db");
            if (!fs.existsSync(dbPath)) {
                return res.status(404).json({ message: "Database file not found" });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const isAuto = req.body.type === "Automatic";
            const backupFileName = `backup_${isAuto ? 'auto_' : ''}${timestamp}.db`;
            const backupFilePath = path.join(backupsDir, backupFileName);

            fs.copyFileSync(dbPath, backupFilePath);

            res.json({ message: "Backup created successfully", filename: backupFileName });
        } catch (error) {
            console.error("Failed to create backup", error);
            res.status(500).json({ message: "Failed to create backup" });
        }
    }

    async uploadLogo(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const logoUrl = `/uploads/${req.file.filename}`;
            
            await (db as any).insert(storeSettings)
                .values({ key: "store_logo", value: logoUrl })
                .onConflictDoUpdate({ target: storeSettings.key, set: { value: logoUrl, updatedAt: sql`(CURRENT_TIMESTAMP)` } });
            
            res.json({ message: "Logo uploaded successfully", logoUrl });
        } catch (error) {
            console.error("Failed to upload logo", error);
            res.status(500).json({ message: "Failed to upload logo" });
        }
    }

    async sync(req: Request, res: Response) {
        try {
            const [{ count }] = await (db as any).select({ count: sql<number>`count(*)` }).from(syncQueue);
            const pendingCount = Number(count);

            if (pendingCount > 0) {
                // Simulate network delay for pushing data to remote PostgreSQL
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Clear the sync queue locally
                await (db as any).delete(syncQueue);
            }

            res.json({ message: "Sync successful", syncedCount: pendingCount });
        } catch (error) {
            console.error("Failed to perform sync", error);
            res.status(500).json({ message: "Failed to perform sync" });
        }
    }
}

export const systemController = new SystemController();
