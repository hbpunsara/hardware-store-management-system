import { fetchAxios as fetch } from '../lib/axiosConfig';
import { apiRequest } from "../lib/queryClient";

const inventoryService = {
    getAdjustments: async () => {
        const res = await apiRequest("GET", "/api/inventory/adjustments");
        return res.json();
    },

    createAdjustment: async (data) => {
        const res = await apiRequest("POST", "/api/inventory/adjustments", data);
        return res.json();
    }
};

export default inventoryService;
