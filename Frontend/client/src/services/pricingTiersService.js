import { fetchAxios as fetch } from '../lib/axiosConfig';
const API_URL = '/api/pricing-tiers';

export const pricingTiersService = {
    getAll: async () => {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch pricing tiers');
        return res.json();
    },

    update: async (data) => {
        const res = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update pricing tier');
        return res.json();
    }
};
