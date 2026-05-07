import { fetchAxios as fetch } from '../lib/axiosConfig';
const API_URL = '/api/quotes';

const quotesService = {
    getAll: async () => {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch quotes');
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch quote');
        return response.json();
    },

    create: async (quoteData) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteData),
        });
        if (!response.ok) throw new Error('Failed to create quote');
        return response.json();
    },

    updateStatus: async (id, status) => {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update quote status');
        return response.json();
    }
};

export default quotesService;
