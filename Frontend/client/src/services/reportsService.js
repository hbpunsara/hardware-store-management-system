export const reportsService = {
  async getOverview() {
    const response = await fetch("/api/reports/overview");
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },
};

export default reportsService;
