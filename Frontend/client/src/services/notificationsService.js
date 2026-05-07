import { fetchAxios as fetch } from '../lib/axiosConfig';
export const notificationsService = {
  /**
   * GET /api/notifications
   * Returns an array of { id, title, message, type, isRead, createdAt, time }
   */
  async getAll() {
    const response = await fetch("/api/notifications");
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to fetch notifications");
    }
    return response.json();
  },

  /**
   * PATCH /api/notifications/:id/read
   * Marks a single notification as read.
   */
  async markRead(id) {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to mark notification as read");
    }
    // 204 or JSON body — handle both
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  /**
   * DELETE /api/notifications
   * Clears (deletes) all notifications.
   */
  async clearAll() {
    const response = await fetch("/api/notifications", {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to clear notifications");
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },
};

export default notificationsService;
