export const returnsService = {
    async getBySaleId(saleId) {
        const response = await fetch(`/api/returns/sale/${saleId}`);
        if (!response.ok) throw new Error("Failed to fetch returns for this sale");
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`/api/returns/${id}`);
        if (!response.ok) throw new Error("Failed to fetch return details");
        return response.json();
    },

    async create(returnData) {
        const response = await fetch("/api/returns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(returnData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to process return");
        return data;
    }
};

export default returnsService;
