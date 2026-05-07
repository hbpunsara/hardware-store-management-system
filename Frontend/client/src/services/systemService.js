import { fetchAxios as fetch } from '../lib/axiosConfig';
/**
 * systemService — wraps GET /api/system/status
 * Returns: { online: boolean, pendingSyncItems: number }
 */
export const systemService = {
  async getStatus() {
    const response = await fetch("/api/system/status");
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to fetch system status");
    }
    return response.json();
  },
  async getBackups() {
    const response = await fetch("/api/system/backups");
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to fetch backups");
    }
    return response.json();
  },
  async createBackup(type = "Manual") {
    const response = await fetch("/api/system/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to create backup");
    }
    return response.json();
  },
};

export default systemService;
