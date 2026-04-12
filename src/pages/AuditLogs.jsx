import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, FileText, User, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb'

const AuditLogs = ({ user }) => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // Filters
    const [filters, setFilters] = useState({
        page: 1,
        page_size: 50,
        date_from: '',
        date_to: '',
        officer: '',
        action_type: '',
        application_id: ''
    })

    useEffect(() => {
        fetchLogs()
    }, [filters.page])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError('')

            // Build query params
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })

            const response = await axios.get(`/api/reports/audit-logs/?${params.toString()}`)
            setLogs(response.data.results)
            setTotalCount(response.data.count)
            setTotalPages(response.data.total_pages)
        } catch (err) {
            console.error('Fetch logs error:', err)
            setError('Failed to load audit logs')
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
    }

    const applyFilters = () => {
        fetchLogs()
    }

    const clearFilters = () => {
        setFilters({
            page: 1,
            page_size: 50,
            date_from: '',
            date_to: '',
            officer: '',
            action_type: '',
            application_id: ''
        })
        setTimeout(() => fetchLogs(), 100)
    }

    const handleExport = async () => {
        try {
            // Build query params excluding pagination
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value && key !== 'page' && key !== 'page_size') params.append(key, value)
            })

            // Trigger download
            const response = await axios.get(`/api/reports/export-audit-logs/?${params.toString()}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export error:', err)
            setError('Failed to export audit logs')
        }
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getActionBadgeColor = (actionType) => {
        if (actionType.includes('VERIFIED') || actionType.includes('APPROVED')) return 'bg-green-100 text-green-800 border-green-200'
        if (actionType.includes('REJECTED') || actionType.includes('QUERIED')) return 'bg-red-100 text-red-800 border-red-200'
        if (actionType.includes('REFERRED')) return 'bg-blue-100 text-blue-800 border-blue-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Admin Dashboard', path: '/admin-dashboard' }, { label: 'Audit Logs' }]} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-gray-600 mt-1">System-wide activity tracking • Total: {totalCount} logs</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLogs}
                            className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Filter size={20} className="mr-2 text-emerald-600" />
                        Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                className="input"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                className="input"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Officer Username</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search by username..."
                                value={filters.officer}
                                onChange={(e) => handleFilterChange('officer', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. LIMS_VERIFIED"
                                value={filters.action_type}
                                onChange={(e) => handleFilterChange('action_type', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="Enter ID..."
                                value={filters.application_id}
                                onChange={(e) => handleFilterChange('application_id', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={applyFilters}
                            className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                {error && (
                    <div className="alert alert-error mb-6">{error}</div>
                )}

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Officer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Application</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Comments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                                                <p className="text-gray-600">Loading audit logs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-gray-500">
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{log.officer.name}</div>
                                                    <div className="text-xs text-gray-500">@{log.officer.username} • {log.officer.role}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action_type)}`}>
                                                    {log.action_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">#{log.application.id}</div>
                                                    <div className="text-xs text-gray-500">{log.application.farm_name}</div>
                                                    <div className="text-xs text-gray-500">{log.application.farmer_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {log.comments || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Page {filters.page} of {totalPages} • Showing {logs.length} of {totalCount} logs
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={filters.page === 1}
                                    className="btn bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={filters.page === totalPages}
                                    className="btn bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuditLogs
