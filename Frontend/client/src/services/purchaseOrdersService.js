import { fetchAxios as fetch } from '../lib/axiosConfig';
import { apiRequest } from "../lib/queryClient";

const purchaseOrdersService = {
    getAll: async () => {
        const res = await apiRequest("GET", "/api/purchase-orders");
        return res.json();
    },

    getById: async (id) => {
        const res = await apiRequest("GET", `/api/purchase-orders/${id}`);
        return res.json();
    },

    create: async (data) => {
        const res = await apiRequest("POST", "/api/purchase-orders", data);
        return res.json();
    },

    updateStatus: async (id, status) => {
        const res = await apiRequest("PUT", `/api/purchase-orders/${id}/status`, { status });
        return res.json();
    }
};

export default purchaseOrdersService;
