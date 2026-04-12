import api from './api'

/**
 * User Service
 * Handles all user/staff management API calls
 * Used primarily by AdminDashboard
 */
class UserService {
    /**
     * Fetch all staff users
     * @returns {Promise<Array>} List of staff users
     */
    async fetchUsers() {
        const response = await api.get('/admin/staff/')
        return response.data
    }

    /**
     * Create new staff user
     * @param {Object} userData - User data (username, email, first_name, last_name, password, role)
     * @returns {Promise<Object>} Created user data
     */
    async createUser(userData) {
        const response = await api.post('/admin/staff/', userData)
        return response.data
    }

    /**
     * Update existing staff user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user data
     */
    async updateUser(userId, userData) {
        const response = await api.put(`/admin/staff/${userId}/`, userData)
        return response.data
    }

    /**
     * Delete staff user
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        await api.delete(`/admin/staff/${userId}/`)
    }

    /**
     * Toggle user active status
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Response with updated status
     */
    async toggleActive(userId) {
        const response = await api.post(`/admin/staff/${userId}/toggle_active/`)
        return response.data
    }
}

// Export singleton instance
export default new UserService()
