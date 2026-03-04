import axios from 'axios';

// Get base API URL from environment variables, fallback to relative path 
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const redeemPoints = async (customerId, points) => {
    const response = await axios.post(`${API_URL}/loyalty/redeem`, { customerId, points });
    return response.data;
};

export const getCustomerLoyaltyLedger = async (customerId) => {
    const response = await axios.get(`${API_URL}/customers/${customerId}/loyalty`);
    return response.data;
};
