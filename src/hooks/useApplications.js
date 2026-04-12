import { useState, useEffect } from 'react'
import applicationService from '../services/applicationService'

/**
 * Custom hook for managing applications data
 * Implements Single Responsibility Principle - only handles application state
 * 
 * @returns {Object} Applications state and methods
 */
const useApplications = () => {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    /**
     * Fetch applications from API
     */
    const fetchApplications = async () => {
        setLoading(true)
        setError('')

        try {
            const data = await applicationService.fetchApplications()

            if (Array.isArray(data)) {
                const mappedData = data
                    .filter(app => app && typeof app === 'object')
                    .map(app => ({
                        ...app,
                        id: app?.id || Math.random(),
                        farmer: `${app?.farmer_name || 'Unknown'} ${app?.farmer_surname || 'Applicant'}`,
                        farm_name: app?.farm_name || 'Unnamed Farm',
                        district: app?.district || 'N/A',
                        status: app?.status || 'PENDING',
                        officer_comments: app?.officer_comments || '',
                        national_id: app?.national_id || 'N/A',
                        telephone: app?.telephone || 'N/A',
                        email: app?.email || 'N/A',
                        date: app?.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'
                    }))
                setApplications(mappedData)
            } else {
                setApplications([])
            }
        } catch (err) {
            console.error('Fetch applications error:', err)
            setError('Failed to load applications.')
            setApplications([])
        } finally {
            setLoading(false)
        }
    }

    /**
     * Refresh applications (alias for fetchApplications for clarity)
     */
    const refreshApplications = fetchApplications

    // Fetch on mount
    useEffect(() => {
        fetchApplications()
    }, [])

    return {
        applications,
        loading,
        error,
        fetchApplications,
        refreshApplications,
        setError
    }
}

export default useApplications
