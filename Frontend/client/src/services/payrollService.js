import { fetchAxios as fetch } from '../lib/axiosConfig';
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
    },

    async deleteMonth(month) {
        const res = await fetch(`${API_URL}/payroll/delete-month`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month }),
        });
        if (!res.ok) throw new Error("Failed to delete payroll month");
        return res.json();
    },

    async update(id, data) {
        const res = await fetch(`${API_URL}/payroll/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Update failed");
        return res.json();
    },

    getPayslipUrl(id) {
        return `${API_URL}/payroll/${id}/payslip-pdf`;
    },

    // ── Employee Salary Config ──
    async getSalaryConfig(employeeId) {
        const res = await fetch(`${API_URL}/employees/${employeeId}/salary-config`);
        if (!res.ok) throw new Error("Failed to fetch salary config");
        return res.json();
    },

    async updateSalaryInfo(employeeId, data) {
        const res = await fetch(`${API_URL}/employees/${employeeId}/salary-info`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update salary info");
        return res.json();
    },

    async addSalaryComponent(employeeId, data) {
        const res = await fetch(`${API_URL}/employees/${employeeId}/salary-components`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to add component");
        return res.json();
    },

    async updateSalaryComponent(compId, data) {
        const res = await fetch(`${API_URL}/salary-components/${compId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update component");
        return res.json();
    },

    async deleteSalaryComponent(compId) {
        const res = await fetch(`${API_URL}/salary-components/${compId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete component");
        return res.json();
    }
};

export default payrollService;
