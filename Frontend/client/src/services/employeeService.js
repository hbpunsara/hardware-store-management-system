import { fetchAxios as fetch } from '../lib/axiosConfig';
export const employeeService = {
  async getAll() {
    const response = await fetch("/api/employees");
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
  },

  async create(employee) {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });
    if (!response.ok) throw new Error("Failed to create employee");
    return response.json();
  },

  async update(id, data) {
    const response = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update employee");
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete employee");
    return true;
  },
};

export default employeeService;
