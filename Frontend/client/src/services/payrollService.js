const API_URL = "/api";

export const payrollService = {
    async getAll(month) {
        const url = month ? `${API_URL}/payroll?month=${encodeURIComponent(month)}` : `${API_URL}/payroll`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch payrolls");
        return res.json();
    },

    async calculateAll(month) {
        const res = await fetch(`${API_URL}/payroll/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month }),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Failed to calculate payrolls");
        }
        return res.json();
    },

    async processAll(month) {
        const res = await fetch(`${API_URL}/payroll/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month }),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Failed to process payrolls");
        }
        return res.json();
    }
};

export default payrollService;
