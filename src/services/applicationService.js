import api from './api'

/**
 * Application Service
 * Handles all application-related API calls
 * Implements Dependency Inversion Principle by abstracting API details
 */
class ApplicationService {
    /**
     * Fetch all applications
     * @returns {Promise<Array>} List of applications
     */
    async fetchApplications() {
        const response = await api.get('/applications/')
        return response.data
    }

    /**
     * Fetch dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    async fetchStats() {
        const response = await api.get('/applications/dashboard_stats/')
        return response.data
    }

    /**
     * LIMS verification
     * @param {number} appId - Application ID
     * @param {Object} data - Verification data
     * @returns {Promise<Object>} Response data
     */
    async verifyLims(appId, data) {
        const response = await api.post(`/applications/${appId}/verify_lims/`, data)
        return response.data
    }

    /**
     * Accounts verification (application fee)
     * @param {number} appId - Application ID
     * @param {Object} data - Verification data
     * @returns {Promise<Object>} Response data
     */
    async verifyApplicationFee(appId, data) {
        const response = await api.post(`/applications/${appId}/verify_application_fee/`, data)
        return response.data
    }

    /**
     * Estates verification
     * @param {number} appId - Application ID
     * @param {Object} data - Verification data
     * @returns {Promise<Object>} Response data
     */
    async verifyEstates(appId, data) {
        const response = await api.post(`/applications/${appId}/verify_estates/`, data)
        return response.data
    }

    /**
     * ZLC verification
     * @param {number} appId - Application ID
     * @param {Object} data - Verification data including dispute info
     * @returns {Promise<Object>} Response data
     */
    async verifyZlc(appId, data) {
        const response = await api.post(`/applications/${appId}/verify_zlc/`, data)
        return response.data
    }

    /**
     * Mark application as requiring technical survey
     * @param {number} appId - Application ID
     * @returns {Promise<Object>} Response data
     */
    async requireTechnicalSurvey(appId) {
        const response = await api.post(`/applications/${appId}/technical_survey/`)
        return response.data
    }

    /**
     * Mark application as surveyed
     * @param {number} appId - Application ID
     * @param {Object} data - Survey data (farm_extent, farm_name, old_district, is_fee_paid)
     * @returns {Promise<Object>} Response data
     */
    async markSurveyed(appId, data) {
        const response = await api.post(`/applications/${appId}/mark_surveyed/`, data)
        return response.data
    }

    /**
     * Approve valuation
     * @param {number} appId - Application ID
     * @param {Object} data - Valuation data (optional manual_price, price_override_reason, ecological_region)
     * @returns {Promise<Object>} Response data
     */
    async approveValuation(appId, data) {
        const response = await api.post(`/applications/${appId}/set_valuation/`, data)
        return response.data
    }

    /**
     * Director approval (triggers payment flow)
     * @param {number} appId - Application ID
     * @param {Object} data - Approval data
     * @returns {Promise<Object>} Response data
     */
    async approve(appId, data) {
        const response = await api.post(`/applications/${appId}/approve/`, data)
        return response.data
    }

    /**
     * Generate Agreement of Sale (Conveyancer)
     * @param {number} appId - Application ID
     * @returns {Promise<Object>} Response data
     */
    async generateAgreement(appId) {
        const response = await api.post(`/applications/${appId}/generate_agreement/`)
        return response.data
    }

    /**
     * Escalate application
     * @param {number} appId - Application ID
     * @param {Object} data - Escalation data
     * @returns {Promise<Object>} Response data
     */
    async escalate(appId, data) {
        const response = await api.post(`/applications/${appId}/escalate/`, data)
        return response.data
    }

    /**
     * Reject application
     * @param {number} appId - Application ID
     * @param {Object} data - Rejection data with reason
     * @returns {Promise<Object>} Response data
     */
    async reject(appId, data) {
        const response = await api.post(`/applications/${appId}/reject_application/`, data)
        return response.data
    }

    /**
     * Conclude application (Director concludes and notifies farmer)
     * @param {number} appId - Application ID
     * @param {Object} data - Optional officer comments
     * @returns {Promise<Object>} Response data
     */
    async concludeApplication(appId, data) {
        const response = await api.post(`/applications/${appId}/conclude-application/`, data)
        return response.data
    }

    /**
     * Director refers application back to valuation officer for corrections
     * @param {number} appId - Application ID
     * @param {Object} data - Referral data with reason
     * @returns {Promise<Object>} Response data
     */
    async referBack(appId, data) {
        const response = await api.post(`/applications/${appId}/refer-back/`, data)
        return response.data
    }

    /**
     * Calculate pricing for an application
     * @param {Object} params - Pricing parameters
     * @returns {Promise<Object>} Calculated pricing data
     */
    async calculatePricing(params) {
        const response = await api.post('/applications/calculate-pricing/', params)
        return response.data
    }
}

// Export singleton instance
export default new ApplicationService()
