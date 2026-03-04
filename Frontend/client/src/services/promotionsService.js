export const promotionsService = {
    getAll: async () => {
        const response = await fetch('/api/promotions');
        if (!response.ok) throw new Error("Failed to fetch promotions");
        return response.json();
    },

    getActive: async () => {
        const response = await fetch('/api/promotions/active');
        if (!response.ok) throw new Error("Failed to fetch active promotions");
        return response.json();
    },

    getByCode: async (code) => {
        const response = await fetch(`/api/promotions/code/${code}`);
        if (!response.ok) throw new Error("Failed to fetch promo code");
        return response.json();
    },

    create: async (data) => {
        const response = await fetch('/api/promotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create promotion");
        return response.json();
    },

    update: async (id, data) => {
        const response = await fetch(`/api/promotions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update promotion");
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`/api/promotions/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Failed to delete promotion");
        return response.json();
    }
};
