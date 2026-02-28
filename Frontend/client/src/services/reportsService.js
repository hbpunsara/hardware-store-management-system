export const reportsService = {
  async getOverview() {
    const response = await fetch("/api/reports/overview");
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },

  async getForecasting() {
    const response = await fetch("/api/reports/forecasting");
    if (!response.ok) throw new Error("Failed to fetch forecasting");
    return response.json();
  },

  async getBasketAnalysis() {
    const response = await fetch("/api/reports/basket-analysis");
    if (!response.ok) throw new Error("Failed to fetch basket analysis");
    return response.json();
  },

  async getInsights() {
    const response = await fetch("/api/reports/insights");
    if (!response.ok) throw new Error("Failed to fetch insights");
    return response.json();
  }
};

export default reportsService;
