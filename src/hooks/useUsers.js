import { useState, useEffect } from 'react'
import userService from '../services/userService'

/**
 * Custom hook for managing users/staff data
 * Used by AdminDashboard
 * 
 * @returns {Object} Users state and CRUD methods
 */
const useUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    /**
     * Fetch users from API
     */
    const fetchUsers = async () => {
        setLoading(true)
        setError('')

        try {
            const data = await userService.fetchUsers()
            const mappedUsers = data.map(u => ({
                id: u.id,
                national_id: u.national_id,
                name: u.name || `${u.first_name || ''} ${u.surname || ''}`.trim() || u.national_id,
                email: u.email,
                role: u.role,
                is_active: u.is_active,
                created: 'Recent'
            }))
            setUsers(mappedUsers)
        } catch (err) {
            console.error('Fetch users error:', err)
            setError('Failed to load registered staff.')
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    /**
     * Create new user
     * @param {Object} userData - New user data
     */
    const createUser = async (userData) => {
        await userService.createUser(userData)
        await fetchUsers() // Refresh list
    }

    /**
     * Update existing user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     */
    const updateUser = async (userId, userData) => {
        await userService.updateUser(userId, userData)
        await fetchUsers() // Refresh list
    }

    /**
     * Delete user
     * @param {number} userId - User ID
     */
    const deleteUser = async (userId) => {
        await userService.deleteUser(userId)
        // Remove from local state immediately
        setUsers(users.filter(u => u.id !== userId))
    }

    /**
     * Toggle user active status
     * @param {number} userId - User ID
     */
    const toggleActive = async (userId) => {
        await userService.toggleActive(userId)
        await fetchUsers() // Refresh list
    }

    // Fetch on mount
    useEffect(() => {
        fetchUsers()
    }, [])

    return {
        users,
        loading,
        error,
        setError,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        toggleActive
    }
}

export default useUsers
