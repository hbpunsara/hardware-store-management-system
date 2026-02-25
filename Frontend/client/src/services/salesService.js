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
};

export default salesService;
