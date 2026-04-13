import React, { useState } from 'react'
import {
    UserPlus, Users, Shield, Search, Eye, EyeOff, CheckCircle,
    Briefcase, User as UserIcon, AlertCircle, Pencil,
    LayoutDashboard, Lock, Power, Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import useUsers from '../hooks/useUsers'

const AdminDashboard = ({ user }) => {
    const navigate = useNavigate()
    const [showForm, setShowForm] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [editingUser, setEditingUser] = useState(null)

    // Use custom hook for user management
    const {
        users,
        loading,
        error,
        setError,
        createUser,
        updateUser,
        deleteUser,
        toggleActive
    } = useUsers()

    const [formData, setFormData] = useState({
        national_id: '',
        email: '',
        first_name: '',
        surname: '',
        password: '',
        role: ''
    })

    const roles = [
        { value: 'lims', label: 'LIMS Officer' },
        { value: 'zlc', label: 'ZLC Officer' },
        { value: 'surveyor', label: 'Surveyor' },
        { value: 'valuation', label: 'Valuation Officer' },
        { value: 'resettlement', label: 'Resettlement Officer' },
        { value: 'director', label: 'Director' },
        { value: 'finance', label: 'Finance Officer' },
        { value: 'admin', label: 'Administrator' }
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccessMessage('')

        try {
            if (editingUser) {
                // Edit existing user
                const updateData = { ...formData }
                if (!updateData.password) delete updateData.password
                await updateUser(editingUser.id, updateData)
                setSuccessMessage(`User ${formData.national_id} updated successfully!`)
            } else {
                // Create new user
                await createUser(formData)
                setSuccessMessage(`User ${formData.national_id} registered successfully!`)
            }

            setTimeout(() => {
                setShowForm(false)
                setSuccessMessage('')
                setEditingUser(null)
                resetForm()
            }, 1500)
        } catch (err) {
            console.error('Registration/Update error:', err)
            const responseData = err.response?.data
            let errorMessage = 'Failed to save user.'

            if (responseData) {
                if (typeof responseData === 'object') {
                    const errors = Object.entries(responseData)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ')
                    errorMessage = errors || JSON.stringify(responseData)
                } else {
                    errorMessage = responseData.error || responseData.detail || 'Validation error'
                }
            }
            setError(errorMessage)
        }
    }

    const resetForm = () => {
        setFormData({ national_id: '', email: '', first_name: '', surname: '', password: '', role: '' })
    }

    const handleEdit = (user) => {
        setEditingUser(user)
        setFormData({
            national_id: user.national_id,
            first_name: user.name.split(' ')[0],
            surname: user.name.split(' ').slice(1).join(' '),
            email: user.email,
            role: user.role,
            password: ''
        })
        setShowForm(true)
    }

    const handleToggleActive = async (user) => {
        try {
            await toggleActive(user.id)
            setSuccessMessage('User status updated successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err) {
            console.error('Toggle active error:', err)
            setError('Failed to update user status.')
            setTimeout(() => setError(''), 3000)
        }
    }

    const handleDelete = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteUser(user.id)
            setSuccessMessage(`User ${user.national_id} deleted successfully.`)
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err) {
            console.error('Delete user error:', err)
            setError('Failed to delete user.')
            setTimeout(() => setError(''), 3000)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate stats
    const totalStaff = users.length
    const activeStaff = users.filter(u => u.is_active).length
    const inactiveStaff = users.filter(u => !u.is_active).length
    const adminsCount = users.filter(u => u.role === 'admin').length
    const officersCount = totalStaff - adminsCount

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-gray-500 mt-1">Manage system access and staff accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/audit-logs"
                        className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 shadow-xl font-bold px-5 py-2.5 text-base border-2 border-red-700 animate-pulse"
                    >
                        <LayoutDashboard size={20} />
                        Audit Logs
                    </a>
                    <a
                        href="/reports"
                        className="btn bg-yellow-500 text-gray-900 hover:bg-yellow-400 flex items-center gap-2 shadow-lg font-bold px-4 py-2 border-2 border-yellow-600"
                    >
                        <LayoutDashboard size={18} />
                        View Reports
                    </a>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <Shield size={16} className="text-emerald-600" />
                        <span className="font-semibold text-sm text-emerald-900">Administrator Access</span>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2 border border-green-200">
                    <CheckCircle size={18} />
                    <span>{successMessage}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats using extracted component */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Staff" value={totalStaff} icon={Users} bg="bg-blue-50" color="text-blue-600" />
                <StatCard title="Administrators" value={adminsCount} icon={Shield} bg="bg-purple-50" color="text-purple-600" />
                <StatCard title="Field Officers" value={officersCount} icon={Briefcase} bg="bg-emerald-50" color="text-emerald-600" />
            </div>

            {/* Main Content */}
            <div className="card border-0 shadow-lg ring-1 ring-gray-100">
                <div className="p-5 border-b flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50 rounded-t-xl items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null)
                            resetForm()
                            setShowForm(true)
                        }}
                        className="btn btn-primary gap-2 w-full sm:w-auto shadow-sm"
                    >
                        <UserPlus size={18} /> Add New Staff
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Loading staff accounts...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No staff members found.</td></tr>
                            ) : (
                                filteredUsers.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mr-3 border-2 border-white shadow-sm">
                                                    {userItem.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{userItem.name}</span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${userItem.is_active
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                            }`}>
                                                            {userItem.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">#{userItem.national_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${userItem.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {userItem.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{userItem.email}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(userItem)}
                                                    className={`p-1.5 rounded transition-colors ${userItem.is_active
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-red-600 hover:bg-red-50'
                                                        }`}
                                                    title={userItem.is_active ? 'Disable User' : 'Enable User'}
                                                >
                                                    <Power size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(userItem)}
                                                    className="text-gray-400 hover:text-emerald-600 transition-colors p-1"
                                                    title="Edit User"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(userItem)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingUser ? "Edit Staff Member" : "Register New Staff"}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {successMessage && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle size={16} /> {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input
                                required
                                className="input"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Surname</label>
                            <input
                                required
                                className="input"
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">National ID</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                required
                                className="input pl-10"
                                value={formData.national_id}
                                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                                placeholder="00-0000000X-00"
                                disabled={!!editingUser}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@titledeeds.gov.zw"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                required
                                className="input pl-10 appearance-none bg-white"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="">Select Role...</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {editingUser ? 'Reset Password (optional)' : 'Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input pl-10 pr-10"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? "Leave empty to keep current" : "••••••••"}
                                required={!editingUser}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {editingUser ? 'Save Changes' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default AdminDashboard
