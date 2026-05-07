import { fetchAxios as fetch } from '../lib/axiosConfig';
export const transactionService = {
  async getAll() {
    const response = await fetch("/api/transactions");
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async create(transaction) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error("Failed to create transaction");
    return response.json();
  },
};

export default transactionService;
