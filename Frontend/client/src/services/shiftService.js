import { fetchAxios as fetch } from '../lib/axiosConfig';
export const shiftService = {
    getActiveShift: async () => {
        try {
            const response = await fetch("/api/shifts/active");
            if (response.status === 404) return null;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch active shift");
            }
            return response.json();
        } catch (error) {
            throw new Error(error.message || "Failed to fetch active shift");
        }
    },

    startShift: async (startingFloat) => {
        try {
            const response = await fetch("/api/shifts/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startingFloat })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to start shift");
            }
            return response.json();
        } catch (error) {
            throw new Error(error.message || "Failed to start shift");
        }
    },

    endShift: async (actualCash, expectedCash) => {
        try {
            const response = await fetch("/api/shifts/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actualCash, expectedCash })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to end shift");
            }
            return response.json();
        } catch (error) {
            throw new Error(error.message || "Failed to end shift");
        }
    }
};
