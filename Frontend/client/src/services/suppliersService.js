import { apiRequest } from "../lib/queryClient";

const suppliersService = {
    getAll: async () => {
        const res = await apiRequest("GET", "/api/suppliers");
        return res.json();
    },

    getById: async (id) => {
        const res = await apiRequest("GET", `/api/suppliers/${id}`);
        return res.json();
    },

    create: async (data) => {
        const res = await apiRequest("POST", "/api/suppliers", data);
        return res.json();
    },

    update: async (id, data) => {
        const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
        return res.json();
    },

    delete: async (id) => {
        await apiRequest("DELETE", `/api/suppliers/${id}`);
        return true;
    }
};

export default suppliersService;
