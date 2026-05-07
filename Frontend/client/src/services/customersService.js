import { fetchAxios as fetch } from '../lib/axiosConfig';
const API_URL = '/api/customers';

const customersService = {
    getAll: async () => {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch customers');
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch customer');
        return response.json();
    },

    create: async (customerData) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData),
        });
        if (!response.ok) throw new Error('Failed to create customer');
        return response.json();
    },

    update: async (id, customerData) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData),
        });
        if (!response.ok) throw new Error('Failed to update customer');
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete customer');
        return true;
    },

    payAccount: async (id, amount, method = 'cash') => {
        const response = await fetch(`${API_URL}/${id}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, method }),
        });
        if (!response.ok) throw new Error('Failed to process payment');
        return response.json();
    },
};

export default customersService;
