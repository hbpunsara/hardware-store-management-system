export const userService = {
  async getAll() {
    const response = await fetch("/api/users");
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  async create(user) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to create user");
    return data;
  },

  async update(id, updates) {
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to update user");
    return data;
  },
};

export default userService;

