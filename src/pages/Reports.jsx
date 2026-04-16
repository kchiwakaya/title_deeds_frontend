import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Calendar, Download, X, ChevronLeft, ChevronRight, Eye, Printer, FileSpreadsheet } from 'lucide-react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import Breadcrumb from '../components/Breadcrumb'
import { getStatusColor, formatStatus } from '../utils/statusUtils'

const Reports = ({ user }) => {
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Drill-down state
    const [drillDown, setDrillDown] = useState(null) // { label, status } or null
    const [drillDownData, setDrillDownData] = useState(null)
    const [drillDownLoading, setDrillDownLoading] = useState(false)
    const [drillDownPage, setDrillDownPage] = useState(1)

    // Status filter state
    const [statusFilter, setStatusFilter] = useState('')

    const allStatuses = [
        { value: '', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'QUERIED', label: 'Queried' },
        { value: 'RESUBMITTED', label: 'Resubmitted' },
        { value: 'LIMS_VERIFIED', label: 'LIMS Verified' },
        { value: 'REFERRED', label: 'Referred' },
        { value: 'RESETTLEMENT_VERIFIED', label: 'Resettlement Verified' },
        { value: 'ACCOUNTS_VERIFIED', label: 'Accounts Verified' },
        { value: 'ESTATES_VERIFIED', label: 'Estates Verified' },
        { value: 'ZLC_VERIFIED', label: 'ZLC Verified' },
        { value: 'AWAITING_SURVEY_FEE', label: 'Awaiting Survey Fee' },
        { value: 'SURVEY_FEE_PAID', label: 'Survey Fee Paid' },
        { value: 'SURVEYED', label: 'Surveyed' },
        { value: 'VALUATED', label: 'Valuated' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'SELECT_PAYMENT', label: 'Select Payment' },
        { value: 'AGREEMENT_OF_SALE', label: 'Agreement of Sale' },
        { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
        { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
        { value: 'READY_FOR_COLLECTION', label: 'Ready for Collection' },
        { value: 'REJECTED', label: 'Rejected' },
    ]

    // Filtered applications table state
    const [filteredApps, setFilteredApps] = useState(null)
    const [filteredLoading, setFilteredLoading] = useState(false)
    const [filteredPage, setFilteredPage] = useState(1)
    const [filteredTotal, setFilteredTotal] = useState(0)
    const [filteredTotalPages, setFilteredTotalPages] = useState(1)

    useEffect(() => {
        fetchReport()
    }, [])

    // Fetch filtered applications when status filter changes
    useEffect(() => {
        if (statusFilter) {
            fetchFilteredApps(1)
        } else {
            setFilteredApps(null)
            setFilteredTotal(0)
            setFilteredTotalPages(1)
        }
    }, [statusFilter])

    const fetchFilteredApps = async (page = 1) => {
        try {
            setFilteredLoading(true)
            setFilteredPage(page)
            const params = { page, page_size: 25, role: user?.role || '' }
            if (statusFilter) params.status = statusFilter
            const endpoint = user?.role === 'director'
                ? '/api/reports/director-applications/'
                : '/api/reports/role-applications/'
            const response = await axios.get(endpoint, { params })
            setFilteredApps(response.data.results)
            setFilteredTotal(response.data.count)
            setFilteredTotalPages(response.data.total_pages)
        } catch (err) {
            console.error('Filter fetch error:', err)
        } finally {
            setFilteredLoading(false)
        }
    }

    const fetchReport = async () => {
        try {
            setLoading(true)
            let endpoint = ''

            if (user?.role === 'director') endpoint = '/api/reports/director/'
            else if (user?.role === 'lims') endpoint = '/api/reports/lims/'
            else if (user?.role === 'resettlement') endpoint = '/api/reports/resettlement/'
            else if (user?.role === 'zlc') endpoint = '/api/reports/zlc/'
            else if (user?.role === 'surveyor') endpoint = '/api/reports/surveyor/'
            else if (user?.role === 'valuation') endpoint = '/api/reports/valuation/'
            else if (user?.role === 'finance') endpoint = '/api/reports/finance/'

            if (endpoint) {
                const response = await axios.get(endpoint)
                setReportData(response.data)
            }
        } catch (err) {
            console.error('Report fetch error:', err)
            setError('Failed to load report data')
        } finally {
            setLoading(false)
        }
    }

    const fetchDrillDown = async (statusFilter = '', label = 'All Applications', page = 1) => {
        try {
            setDrillDownLoading(true)
            setDrillDown({ label, status: statusFilter })
            setDrillDownPage(page)

            const params = { page, page_size: 25, role: user?.role || '' }
            if (statusFilter) params.status = statusFilter

            // Director uses existing endpoint, others use role-applications
            const endpoint = user?.role === 'director'
                ? '/api/reports/director-applications/'
                : '/api/reports/role-applications/'

            const response = await axios.get(endpoint, { params })
            setDrillDownData(response.data)
        } catch (err) {
            console.error('Drill-down fetch error:', err)
        } finally {
            setDrillDownLoading(false)
        }
    }

    const closeDrillDown = () => {
        setDrillDown(null)
        setDrillDownData(null)
        setDrillDownPage(1)
    }

    const handlePageChange = (newPage) => {
        if (drillDown) {
            fetchDrillDown(drillDown.status, drillDown.label, newPage)
        }
    }

    const handleExport = () => {
        if (!drillDownData || !drillDownData.results.length) return

        const worksheetData = drillDownData.results.map(app => ({
            'Reference': `REF-${app.id.substring(0, 6).toUpperCase()}`,
            'Farm Name': app.farm_name,
            'Farmer': app.farmer_name,
            'District': app.district,
            'Status': formatStatus(app.status),
            'Date': new Date(app.created_at).toLocaleDateString(),
            'Price (USD)': app.purchase_price || '',
            'Farm Extent (Ha)': app.farm_extent || '',
            'Survey Fee (USD)': app.survey_fee || '',
        }))

        const worksheet = XLSX.utils.json_to_sheet(worksheetData)

        // Auto-size columns
        const colWidths = Object.keys(worksheetData[0]).map(key => ({
            wch: Math.max(key.length, ...worksheetData.map(r => String(r[key]).length)) + 2
        }))
        worksheet['!cols'] = colWidths

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')
        XLSX.writeFile(workbook, `${drillDown.label.replace(/\s+/g, '_')}_Report.xlsx`)
    }

    const handleExportAll = async (filterOverride) => {
        try {
            const activeFilter = filterOverride !== undefined ? filterOverride : statusFilter
            // Fetch all applications for this role (large page)
            const params = { page: 1, page_size: 10000, role: user?.role || '' }
            if (activeFilter) params.status = activeFilter
            const endpoint = user?.role === 'director'
                ? '/api/reports/director-applications/'
                : '/api/reports/role-applications/'

            const response = await axios.get(endpoint, { params })
            const apps = response.data.results

            if (!apps || apps.length === 0) {
                alert('No applications to export')
                return
            }

            const worksheetData = apps.map(app => ({
                'Reference': `REF-${app.id.substring(0, 6).toUpperCase()}`,
                'Farm Name': app.farm_name,
                'Farmer': app.farmer_name,
                'District': app.district,
                'Status': formatStatus(app.status),
                'Date': new Date(app.created_at).toLocaleDateString(),
                'Price (USD)': app.purchase_price || '',
                'Farm Extent (Ha)': app.farm_extent || '',
                'Survey Fee (USD)': app.survey_fee || '',
            }))

            const worksheet = XLSX.utils.json_to_sheet(worksheetData)
            const colWidths = Object.keys(worksheetData[0]).map(key => ({
                wch: Math.max(key.length, ...worksheetData.map(r => String(r[key]).length)) + 2
            }))
            worksheet['!cols'] = colWidths

            // Add summary sheet if reportData available
            const workbook = XLSX.utils.book_new()
            if (reportData?.summary) {
                const summaryRows = Object.entries(reportData.summary)
                    .filter(([k]) => k !== 'status_breakdown')
                    .map(([k, v]) => ({
                        'Metric': k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        'Value': typeof v === 'number' ? v : String(v),
                    }))
                const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
                summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
                XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')

            const roleName = (user?.role || 'officer').toUpperCase()
            const filterLabel = activeFilter ? `_${activeFilter}` : ''
            const date = new Date().toISOString().split('T')[0]
            XLSX.writeFile(workbook, `${roleName}${filterLabel}_Report_${date}.xlsx`)
        } catch (err) {
            console.error('Export error:', err)
            alert('Failed to export. Please try again.')
        }
    }

    const handlePrintAll = async () => {
        try {
            const params = { page: 1, page_size: 10000, role: user?.role || '' }
            if (statusFilter) params.status = statusFilter
            const endpoint = user?.role === 'director'
                ? '/api/reports/director-applications/'
                : '/api/reports/role-applications/'
            const response = await axios.get(endpoint, { params })
            const apps = response.data.results
            if (!apps || apps.length === 0) { alert('No applications to print'); return }

            const filterLabel = statusFilter ? ` — ${formatStatus(statusFilter)}` : ''
            const printWindow = window.open('', '_blank')
            if (!printWindow) return
            printWindow.document.write(`
                <!DOCTYPE html><html><head>
                <title>${(user?.role || 'Officer').toUpperCase()} Report${filterLabel}</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 20px; }
                    h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
                    th { background: #f3f4f6; font-weight: bold; }
                    tr:nth-child(even) { background: #f9fafb; }
                    @media print { button { display: none; } }
                </style>
                </head><body>
                <h1>${(user?.role || 'Officer').toUpperCase()} Report${filterLabel}</h1>
                <p>Generated: ${new Date().toLocaleString()} &bull; Total: ${apps.length} applications</p>
                <table><thead><tr>
                    <th>ID</th><th>Farm Name</th><th>Farmer</th><th>District</th><th>Status</th><th>Date</th><th>Price</th>
                </tr></thead><tbody>
                ${apps.map(a => `<tr><td>REF-${a.id.substring(0, 6).toUpperCase()}</td><td>${a.farm_name}</td><td>${a.farmer_name}</td><td>${a.district}</td><td>${formatStatus(a.status)}</td><td>${new Date(a.created_at).toLocaleDateString()}</td><td>${a.purchase_price ? '$' + a.purchase_price.toLocaleString() : '-'}</td></tr>`).join('')}
                </tbody></table>
                <script>window.onload = () => window.print()<\/script>
                </body></html>
            `)
            printWindow.document.close()
        } catch (err) {
            console.error('Print error:', err)
            alert('Failed to print. Please try again.')
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow || !drillDownData) return

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${drillDown.label}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
                    h1 { color: #1e3a8a; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block; }
                    .status.PENDING { background: #fefce8; color: #854d0e; }
                    .status.APPROVED { background: #f0fdf4; color: #166534; }
                    .status.REJECTED { background: #fef2f2; color: #991b1b; }
                    @media print { button { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>${drillDown.label} Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                <p>Total Records: ${drillDownData.count}</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Farm Name</th><th>Farmer</th><th>District</th><th>Status</th><th>Date</th><th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${drillDownData.results.map(app => `
                            <tr>
                                <td>REF-${app.id.substring(0, 6).toUpperCase()}</td>
                                <td>${app.farm_name}</td>
                                <td>${app.farmer_name}</td>
                                <td>${app.district}</td>
                                <td><span class="status ${app.status}">${formatStatus(app.status)}</span></td>
                                <td>${new Date(app.created_at).toLocaleDateString()}</td>
                                <td>${app.purchase_price ? `$${app.purchase_price.toLocaleString()}` : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>window.onload = () => window.print()</script>
            </body>
            </html>
        `

        printWindow.document.write(content)
        printWindow.document.close()
    }

    const colorMap = {
        emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', iconBg: '#d1fae5' },
        blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', iconBg: '#dbeafe' },
        green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', iconBg: '#dcfce7' },
        amber: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', iconBg: '#fef3c7' },
        red: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', iconBg: '#fee2e2' },
        purple: { bg: '#faf5ff', border: '#d8b4fe', text: '#9333ea', iconBg: '#f3e8ff' },
        indigo: { bg: '#eef2ff', border: '#c7d2fe', text: '#4f46e5', iconBg: '#e0e7ff' },
    }

    const StatCard = ({ icon: Icon, label, value, color = 'emerald', onClick = null }) => {
        const c = colorMap[color] || colorMap.emerald
        return (
            <div
                style={{
                    background: `linear-gradient(135deg, ${c.bg}, white)`,
                    border: `2px solid ${c.border}`,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                }}
                onClick={onClick}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)'; if (onClick) e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: '1.875rem', fontWeight: 700, color: c.text, marginTop: '0.5rem' }}>{value}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: c.iconBg, borderRadius: '0.75rem' }}>
                        <Icon size={32} style={{ color: c.text }} />
                    </div>
                </div>
                {onClick && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 500, color: c.text }}>
                        <Eye size={14} style={{ marginRight: '0.25rem' }} />
                        Click to view details
                    </div>
                )}
            </div>
        )
    }

    // Modal drill-down component
    const DrillDownModal = () => {
        if (!drillDown) return null

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDrillDown}>
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

                {/* Modal */}
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-white">{drillDown.label}</h3>
                            <p className="text-blue-100 text-sm mt-0.5">
                                {drillDownData ? `${drillDownData.count} application${drillDownData.count !== 1 ? 's' : ''} found` : 'Loading...'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#10b981', color: 'white', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #059669', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                title="Export to Excel"
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                            >
                                <FileSpreadsheet size={16} />
                                Export Excel
                            </button>
                            <button
                                onClick={handlePrint}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f59e0b', color: 'white', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #d97706', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                title="Print Report"
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d97706'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f59e0b'}
                            >
                                <Printer size={16} />
                                Print
                            </button>
                            <button
                                onClick={closeDrillDown}
                                style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'white', color: '#1e3a8a', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', fontWeight: 700 }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#1e3a8a' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        {drillDownLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="ml-3 text-gray-500">Loading applications...</p>
                            </div>
                        ) : drillDownData && drillDownData.results.length > 0 ? (
                            <table className="w-full">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Farm Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Farmer</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {drillDownData.results.map((app) => (
                                        <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-3.5 text-sm text-gray-500 font-mono">REF-{app.id.substring(0, 6).toUpperCase()}</td>
                                            <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{app.farm_name}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-700">{app.farmer_name}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-700">{app.district}</td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                                                    {formatStatus(app.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-gray-500">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-right font-medium text-gray-900">
                                                {app.purchase_price ? `$${app.purchase_price.toLocaleString()}` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-16 text-center text-gray-500">
                                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                                <p>No applications found</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {drillDownData && drillDownData.total_pages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                            <p className="text-sm text-gray-600">
                                Page {drillDownData.page} of {drillDownData.total_pages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(drillDownData.page - 1)}
                                    disabled={drillDownData.page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(drillDownData.page + 1)}
                                    disabled={drillDownData.page >= drillDownData.total_pages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', path: '/officer-dashboard' }, { label: 'Reports' }]} />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">
                            {user?.role === 'director' ? 'Comprehensive System Overview' : `${user?.role?.toUpperCase()} Officer Report`}
                        </p>
                    </div>
                    <button
                        onClick={handleExportAll}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: 'white', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                    >
                        <FileSpreadsheet size={18} />
                        Export All to Excel
                    </button>
                </div>

                {/* Status Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Filter by Status:</label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem 2rem 0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white', color: '#374151', cursor: 'pointer', minWidth: '200px' }}
                    >
                        {allStatuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handleExportAll()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: 'white', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                        >
                            <FileSpreadsheet size={16} />
                            Export Excel
                        </button>
                        <button
                            onClick={handlePrintAll}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                            <Printer size={16} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Filtered Results Table */}
                {statusFilter && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                {formatStatus(statusFilter)} Applications
                                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>({filteredTotal} found)</span>
                            </h3>
                        </div>
                        {filteredLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
                        ) : filteredApps && filteredApps.length > 0 ? (
                            <>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Farm Name</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Farmer</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>District</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApps.map((app, idx) => (
                                                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>REF-{app.id.substring(0, 6).toUpperCase()}</td>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>{app.farm_name}</td>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: '#374151' }}>{app.farmer_name}</td>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: '#374151' }}>{app.district}</td>
                                                    <td style={{ padding: '0.75rem 1.25rem' }}>
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                                                            {formatStatus(app.status)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{new Date(app.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#1f2937', textAlign: 'right' }}>{app.purchase_price ? `$${app.purchase_price.toLocaleString()}` : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredTotalPages > 1 && (
                                    <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {filteredPage} of {filteredTotalPages}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => fetchFilteredApps(filteredPage - 1)}
                                                disabled={filteredPage <= 1}
                                                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white', color: '#374151', cursor: filteredPage <= 1 ? 'not-allowed' : 'pointer', opacity: filteredPage <= 1 ? 0.5 : 1 }}
                                            >
                                                <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Previous
                                            </button>
                                            <button
                                                onClick={() => fetchFilteredApps(filteredPage + 1)}
                                                disabled={filteredPage >= filteredTotalPages}
                                                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white', color: '#374151', cursor: filteredPage >= filteredTotalPages ? 'not-allowed' : 'pointer', opacity: filteredPage >= filteredTotalPages ? 0.5 : 1 }}
                                            >
                                                Next <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                                No applications found with this status
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error mb-6">{error}</div>
                )}

                {/* Director Comprehensive Report */}
                {user?.role === 'director' && reportData?.summary && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={FileText}
                                label="Total Applications"
                                value={reportData.summary.total_applications}
                                color="blue"
                                onClick={() => fetchDrillDown('', 'All Applications')}
                            />
                            <StatCard icon={DollarSign} label="Total Revenue" value={`$${reportData.summary.total_revenue.toLocaleString()}`} color="green" />
                            <StatCard icon={TrendingUp} label="Pending Payments" value={`$${reportData.summary.pending_payments.toLocaleString()}`} color="amber" />
                            <StatCard icon={Calendar} label="Recent (7 days)" value={reportData.summary.recent_7_days} color="purple" />
                        </div>

                        {/* Status Breakdown */}
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <BarChart3 size={20} className="mr-2 text-emerald-600" />
                                Status Breakdown
                                <span className="ml-2 text-xs font-normal text-gray-400">(click a status to view applications)</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {reportData.summary.status_breakdown.map(item => (
                                    <div
                                        key={item.status}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all group"
                                        onClick={() => fetchDrillDown(item.status, `${formatStatus(item.status)} Applications`)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.count}</span>
                                        <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-center ${getStatusColor(item.status)}`}>
                                            {formatStatus(item.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Users size={20} className="mr-2 text-blue-600" />
                                    Top Officer Performance
                                </h3>
                                <div className="space-y-3">
                                    {reportData.officer_performance.map((officer, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-700">{officer.officer__username}</span>
                                            <span className="text-sm font-bold text-blue-600">{officer.actions_count} actions</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    {reportData.payment_methods.map((method, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-700">{method.payment_plan}</span>
                                            <span className="text-sm font-bold text-gray-600">{method.count} applications</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Districts</h3>
                                <div className="space-y-3">
                                    {reportData.districts.map((district, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-700">{district.district}</span>
                                            <span className="text-sm font-bold text-gray-600">{district.count} applications</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-amber-900 mb-2">⚠️ Attention Required</h3>
                                <p className="text-amber-800">
                                    <span className="font-bold">{reportData.summary.long_pending_count}</span> applications have been pending for more than 30 days
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* LIMS Officer Report */}
                {user?.role === 'lims' && reportData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard icon={FileText} label="Pending Verification" value={reportData.summary.pending_verification} color="amber"
                            onClick={() => fetchDrillDown('PENDING', 'Pending Verification')} />
                        <StatCard icon={Users} label="Verified Applications" value={reportData.summary.verified_count} color="green"
                            onClick={() => fetchDrillDown('LIMS_VERIFIED', 'Verified Applications')} />
                        <StatCard icon={TrendingUp} label="Referred to Resettlement" value={reportData.summary.referred_to_resettlement} color="blue"
                            onClick={() => fetchDrillDown('REFERRED', 'Referred to Resettlement')} />
                        <StatCard icon={FileText} label="Queried Applications" value={reportData.summary.queried_count} color="red"
                            onClick={() => fetchDrillDown('QUERIED', 'Queried Applications')} />
                        <StatCard icon={BarChart3} label="My Total Actions" value={reportData.summary.my_actions} color="purple" />
                    </div>
                )}

                {/* Resettlement Officer Report */}
                {user?.role === 'resettlement' && reportData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard icon={FileText} label="Pending Verification" value={reportData.summary.pending_verification} color="amber"
                            onClick={() => fetchDrillDown('REFERRED', 'Pending Verification')} />
                        <StatCard icon={Users} label="Verified Count" value={reportData.summary.verified_count} color="green"
                            onClick={() => fetchDrillDown('RESETTLEMENT_VERIFIED', 'Verified Applications')} />
                    </div>
                )}

                {/* ZLC Officer Report */}
                {user?.role === 'zlc' && reportData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard icon={FileText} label="Pending Verification" value={reportData.summary.pending_verification} color="amber"
                            onClick={() => fetchDrillDown('RESETTLEMENT_VERIFIED', 'Pending Verification')} />
                        <StatCard icon={Users} label="Verified Count" value={reportData.summary.verified_count} color="green"
                            onClick={() => fetchDrillDown('ZLC_VERIFIED', 'Verified Applications')} />
                    </div>
                )}

                {/* Surveyor Report */}
                {user?.role === 'surveyor' && reportData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard icon={FileText} label="Pending Survey" value={reportData.summary.pending_survey} color="amber"
                            onClick={() => fetchDrillDown('ZLC_VERIFIED', 'Pending Survey')} />
                        <StatCard icon={DollarSign} label="Awaiting Survey Fee" value={reportData.summary.awaiting_survey_fee} color="red"
                            onClick={() => fetchDrillDown('AWAITING_SURVEY_FEE', 'Awaiting Survey Fee')} />
                        <StatCard icon={TrendingUp} label="Survey Fee Paid" value={reportData.summary.survey_fee_paid} color="green"
                            onClick={() => fetchDrillDown('SURVEY_FEE_PAID', 'Survey Fee Paid')} />
                        <StatCard icon={Users} label="Completed Surveys" value={reportData.summary.completed_surveys} color="blue"
                            onClick={() => fetchDrillDown('SURVEYED', 'Completed Surveys')} />
                        <StatCard icon={DollarSign} label="Total Survey Fees" value={`$${reportData.summary.total_survey_fees.toLocaleString()}`} color="emerald" />
                    </div>
                )}

                {/* Valuation Officer Report */}
                {user?.role === 'valuation' && reportData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={FileText} label="Pending Valuation" value={reportData.summary.pending_valuation} color="amber"
                            onClick={() => fetchDrillDown('SURVEYED', 'Pending Valuation')} />
                        <StatCard icon={Users} label="Valuated Count" value={reportData.summary.valuated_count} color="green"
                            onClick={() => fetchDrillDown('VALUATED', 'Valuated Applications')} />
                        <StatCard icon={TrendingUp} label="Price Overrides" value={reportData.summary.price_overrides} color="blue" />
                        <StatCard icon={DollarSign} label="Avg Purchase Price" value={`$${reportData.summary.avg_purchase_price.toLocaleString()}`} color="purple" />
                    </div>
                )}

                {/* Finance Officer Report */}
                {user?.role === 'finance' && reportData?.summary && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <StatCard icon={FileText} label="Pending Verification" value={reportData.summary.pending_verification} color="amber"
                                onClick={() => fetchDrillDown('AGREEMENT_OF_SALE', 'Pending Verification')} />
                            <StatCard icon={Users} label="Payment Verified" value={reportData.summary.payment_verified} color="green"
                                onClick={() => fetchDrillDown('PAYMENT_VERIFIED', 'Payment Verified')} />
                            <StatCard icon={DollarSign} label="Total Revenue" value={`$${reportData.summary.total_revenue.toLocaleString()}`} color="emerald" />
                            <StatCard icon={TrendingUp} label="Outstanding Payments" value={`$${reportData.summary.outstanding_payments.toLocaleString()}`} color="red" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard icon={DollarSign} label="Cash Revenue" value={`$${reportData.summary.cash_revenue.toLocaleString()}`} color="blue" />
                            <StatCard icon={DollarSign} label="Mortgage Revenue" value={`$${reportData.summary.mortgage_revenue.toLocaleString()}`} color="purple" />
                            <StatCard icon={DollarSign} label="Survey Fees" value={`$${reportData.summary.survey_fees_collected.toLocaleString()}`} color="indigo" />
                        </div>
                    </>
                )}

                {/* Drill-Down Modal — shown for ALL roles */}
                <DrillDownModal />
            </div>
        </div>
    )
}

export default Reports
