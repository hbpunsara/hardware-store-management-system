import { fetchAxios as fetch } from '../lib/axiosConfig';
export const authService = {
  async login(credentials) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error("Invalid credentials");
    return response.json();
  },

  async logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to logout");
  },

  async getCurrentUser() {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    return response.json();
  },
};

export default authService;
