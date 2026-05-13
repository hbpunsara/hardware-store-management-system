import { fetchAxios as fetch } from '../lib/axiosConfig';
export const salesService = {
  async getAll() {
    const response = await fetch("/api/sales");
    if (!response.ok) throw new Error("Failed to fetch sales");
    return response.json();
  },

  async getById(id) {
    const response = await fetch(`/api/sales/${id}`);
    if (!response.ok) throw new Error("Failed to fetch sale");
    return response.json();
  },

  async create(sale) {
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    });
    if (!response.ok) throw new Error("Failed to create sale");
    return response.json();
  },

  async getTodaySummary() {
    const response = await fetch("/api/sales/today-summary");
    if (!response.ok) throw new Error("Failed to fetch today's summary");
    return response.json();
  },

  async voidSale(id, managerPin) {
    const response = await fetch(`/api/sales/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerPin }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to void sale");
    return data;
  },

  async emailInvoice(id, email) {
    const response = await fetch(`/api/sales/${id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to email invoice");
    return data;
  },

  async printReceipt(receiptData) {
    const response = await fetch("/api/printer/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptData }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Hardware printing failed");
    return data;
  }
};

export default salesService;
