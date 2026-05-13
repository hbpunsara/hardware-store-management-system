import { fetchAxios as fetch } from '../lib/axiosConfig';
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

  async getProductForecasting() {
    const response = await fetch("/api/reports/product-forecasting");
    if (!response.ok) throw new Error("Failed to fetch product forecasting");
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
  },

  async getWeeklyTrend() {
    const response = await fetch("/api/reports/weekly-trend");
    if (!response.ok) throw new Error("Failed to fetch weekly trend");
    return response.json();
  },

  async trainML() {
    const response = await fetch("/api/ml/train", {
      method: "POST"
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to train ML models");
    }
    return response.json();
  }
};

export default reportsService;
