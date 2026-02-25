export const storeService = {
  async getAll() {
    const response = await fetch("/api/store-settings");
    if (!response.ok) throw new Error("Failed to fetch store settings");
    return response.json();
  },

  async update(settings) {
    const response = await fetch("/api/store-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error("Failed to update store settings");
    return response.json();
  },
};

export default storeService;
