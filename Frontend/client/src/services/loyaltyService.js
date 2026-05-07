import api from '../lib/axiosConfig';

// Get base API URL from environment variables, fallback to relative path 
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const redeemPoints = async (customerId, points) => {
    const response = await api.post(`${API_URL}/loyalty/redeem`, { customerId, points });
    return response.data;
};

export const getCustomerLoyaltyLedger = async (customerId) => {
    const response = await api.get(`${API_URL}/customers/${customerId}/loyalty`);
    return response.data;
};
