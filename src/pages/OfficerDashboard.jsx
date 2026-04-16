import React, { useState, useEffect } from 'react'
import {
    Search, Filter, Eye, Check, X, Info, FileText, AlertCircle,
    CheckCircle, DollarSign, MessageSquare, Briefcase, Users,
    ChevronDown, ChevronRight, ArrowUpRight, Clock
} from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import SearchFilter from '../components/SearchFilter'
import useApplications from '../hooks/useApplications'
import useStats from '../hooks/useStats'
import useApplicationFilters from '../hooks/useApplicationFilters'
import applicationService from '../services/applicationService'
import { calculateSurveyFee } from '../utils/pricingUtils'
import { getStatusColor } from '../utils/statusUtils'

const OfficerDashboard = ({ user }) => {
    const [selectedApp, setSelectedApp] = useState(null)
    const [success, setSuccess] = useState('')
    const [showQueryModal, setShowQueryModal] = useState(false)
    const [queryReason, setQueryReason] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    // Use custom hooks for data management
    const { applications, loading, error, setError, refreshApplications } = useApplications()
    const { stats, refreshStats } = useStats()

    // Initialize filter based on user role
    const { searchTerm, setSearchTerm, filterStatus, setFilterStatus, filteredApplications } = useApplicationFilters(applications)

    // Form state for various officer inputs
    const [officerComments, setOfficerComments] = useState('')
    const [hectarage, setHectarage] = useState('')
    const [newFarmName, setNewFarmName] = useState('')
    const [oldDistrict, setOldDistrict] = useState('')
    const [isFeePaid, setIsFeePaid] = useState(false)
    const [hasDisputes, setHasDisputes] = useState(false)
    const [disputeNature, setDisputeNature] = useState('')
    const [isAppFeePaid, setIsAppFeePaid] = useState(false)

    // Valuation state
    const [valuationParams, setValuationParams] = useState({
        farm_extent: '',
        arable_area: '',
        improvements_value: '',
        water_source_distance: '',
        nearest_town: '',
        distance_to_town: '',
        ecological_region: ''
    })
    const [calculatedPricing, setCalculatedPricing] = useState(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [manualPrice, setManualPrice] = useState('')
    const [priceOverrideReason, setPriceOverrideReason] = useState('')

    // Set default filter based on role
    useEffect(() => {
        if (user?.role === 'lims') setFilterStatus('PENDING')
        else if (user?.role === 'accounts' || user?.role === 'finance') setFilterStatus('LIMS_VERIFIED')
        else if (user?.role === 'estates' || user?.role === 'resettlement') setFilterStatus('ACCOUNTS_VERIFIED')
        else if (user?.role === 'zlc') setFilterStatus('LIMS_VERIFIED')
        else if (user?.role === 'surveyor') setFilterStatus('ZLC_VERIFIED')
        else if (user?.role === 'valuation') setFilterStatus('SURVEYED')
        else if (user?.role === 'director') setFilterStatus('VALUATED')
        else if (user?.role === 'conveyancer') setFilterStatus('APPROVED')
    }, [user])

    // Initialize valuation params when app selected
    useEffect(() => {
        if (selectedApp && (user?.role === 'valuation' || user?.role === 'director')) {
            setValuationParams({
                farm_extent: selectedApp.farm_extent || 0,
                arable_area: selectedApp.arable_area || 0,
                distance_to_town: selectedApp.distance_to_town || 0,
                nearest_town: selectedApp.nearest_town || '',
                ecological_region: selectedApp.ecological_region || ''
            })
            calculatePrice({
                ...selectedApp,
                farm_extent: selectedApp.farm_extent || 0,
                arable_area: selectedApp.arable_area || 0
            })
        }
    }, [selectedApp])

    const calculatePrice = async (params) => {
        setIsCalculating(true)
        try {
            const payload = {
                ...params,
                district: selectedApp?.district,
                is_cash_payment: selectedApp?.is_cash_payment || false,
                farmer: {
                    is_war_veteran: selectedApp?.farmer_is_war_veteran || false,
                    is_civil_servant: selectedApp?.farmer_is_civil_servant || false,
                    civil_service_years: selectedApp?.farmer_civil_service_years || 0
                },
                spouses: selectedApp?.spouses || []
            }
            const data = await applicationService.calculatePricing(payload)
            setCalculatedPricing(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleValuationChange = (field, value) => {
        const newParams = { ...valuationParams, [field]: value }
        setValuationParams(newParams)
        calculatePrice(newParams)
    }

    const handleAction = async (appId, actionType) => {
        console.log('🔍 handleAction called:', { appId, actionType, userRole: user?.role });
        setActionLoading(true)
        try {
            const payload = { officer_comments: officerComments }

            // Route to appropriate service method based on role
            if (user?.role === 'lims') {
                payload.status_action = actionType === 'Query' ? 'QUERY' : 'VERIFIED'
                if (actionType === 'Query') payload.reason = queryReason
                await applicationService.verifyLims(appId, payload)
            } else if (user?.role === 'accounts') {
                payload.is_paid = isAppFeePaid
                await applicationService.verifyApplicationFee(appId, payload)
            } else if (user?.role === 'estates') {
                await applicationService.verifyEstates(appId, payload)
            } else if (user?.role === 'zlc') {
                payload.has_disputes = hasDisputes
                if (hasDisputes) payload.dispute_nature = disputeNature
                await applicationService.verifyZlc(appId, payload)
            } else if (user?.role === 'surveyor') {
                if (actionType === 'RequireSurvey') {
                    await applicationService.requireTechnicalSurvey(appId)
                } else {
                    payload.farm_extent = hectarage
                    payload.farm_name = newFarmName
                    payload.old_district = oldDistrict
                    payload.is_fee_paid = isFeePaid
                    await applicationService.markSurveyed(appId, payload)
                }
            } else if (user?.role === 'valuation') {
                // Build valuation approval payload
                const valuationPayload = {
                    officer_comments: officerComments,
                    farm_extent: valuationParams.farm_extent,
                    arable_area: valuationParams.arable_area,
                    distance_to_town: valuationParams.distance_to_town,
                    nearest_town: valuationParams.nearest_town,
                    ecological_region: valuationParams.ecological_region
                };

                if (manualPrice) {
                    valuationPayload.manual_price = manualPrice;
                    valuationPayload.price_override_reason = priceOverrideReason;
                }

                await applicationService.approveValuation(appId, valuationPayload)
            } else if (user?.role === 'director') {
                if (actionType === 'Conclude') {
                    await applicationService.concludeApplication(appId, payload)
                } else {
                    console.log('✅ Director approval - calling approve endpoint', { appId, payload });
                    await applicationService.approve(appId, payload)
                }
            } else if (user?.role === 'conveyancer') {
                await applicationService.generateAgreement(appId)
            }

            if (actionType === 'Escalate') {
                await applicationService.escalate(appId, payload)
            }

            console.log('✅ Action successful!');
            setSuccess(`${actionType} successful!`)
            refreshApplications()
            refreshStats()
            setSelectedApp(null)
        } catch (err) {
            console.error('❌ Action failed:', err)
            console.error('Error details:', err.response?.data || err.message)
            setError(err.response?.data?.error || err.response?.data?.detail || "Action failed")
        } finally {
            setActionLoading(false)
        }
    }

    const handleQuery = async () => {
        if (!selectedApp || !queryReason) return
        setActionLoading(true)
        try {
            if (user?.role === 'lims') {
                await applicationService.verifyLims(selectedApp.id, {
                    status_action: 'QUERY',
                    reason: queryReason
                })
            } else if (user?.role === 'director') {
                await applicationService.referBack(selectedApp.id, { reason: queryReason })
            } else {
                await applicationService.reject(selectedApp.id, { reason: queryReason })
            }

            const successMsg = user?.role === 'director'
                ? `Application #${selectedApp.id} has been referred back to valuation officer.`
                : `Application #${selectedApp.id} has been queried successfully!`
            setSuccess(successMsg)
            refreshApplications()
            refreshStats()
            setSelectedApp(null)
            setShowQueryModal(false)
            setQueryReason('')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.error || 'Failed to process request.')
        } finally {
            setActionLoading(false)
        }
    }

    // Status options for filter
    const statusOptions = [
        { value: 'PENDING', label: '🕒 Pending' },
        { value: 'QUERIED', label: '⚠️ Queried' },
        { value: 'RESUBMITTED', label: '🔄 Resubmitted' },
        { value: 'LIMS_VERIFIED', label: '✅ LIMS Verified' },
        { value: 'ACCOUNTS_VERIFIED', label: '💰 Accounts Verified' },
        { value: 'REFERRED', label: '📍 Referrals' },
        { value: 'ESTATES_VERIFIED', label: '🏡 Estates Verified' },
        { value: 'ZLC_VERIFIED', label: '🏢 ZLC Verified' },
        { value: 'AWAITING_SURVEY_FEE', label: '⚠️ Awaiting Survey Fee' },
        { value: 'SURVEY_FEE_PAID', label: '✅ Ready for Survey (Fee Paid)' },
        { value: 'SURVEYED', label: '📐 Surveyed' },
        { value: 'VALUATED', label: '💰 Valuated' },
        { value: 'SELECT_PAYMENT', label: '💳 Select Payment' },
        { value: 'PAYMENT_VERIFIED', label: '🧾 Payment Verified' },
        { value: 'READY_FOR_COLLECTION', label: '🎁 Ready for Collection' },
        { value: 'APPROVED', label: '🌟 Approved' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage and verify title deed applications</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/reports"
                        className="btn bg-yellow-500 text-gray-900 hover:bg-yellow-400 flex items-center gap-2 shadow-lg font-bold px-4 py-2 border-2 border-yellow-600"
                    >
                        <FileText size={18} />
                        View Reports
                    </a>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <Briefcase size={16} className="text-emerald-600" />
                        <span className="font-semibold text-sm text-emerald-900 capitalize">Role: {user?.role || 'Officer'}</span>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2 border border-green-200">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Cards - using extracted component */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setFilterStatus('all')}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Your Action</p>
                            <p className="text-3xl font-black text-amber-600">{stats.pending_count}</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 font-medium italic">Records requiring immediate attention</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Actioned Today</p>
                            <p className="text-3xl font-black text-emerald-600">{stats.today_count}</p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 font-medium italic">Your progress for today</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cumulative Work</p>
                            <p className="text-3xl font-black text-blue-600">{stats.cumulative_count}</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <FileText size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 font-medium italic">Total career actions on records</p>
                </div>
            </div>

            {/* Search and Filter - using extracted component */}
            <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                resultCount={filteredApplications.length}
                statusOptions={statusOptions}
            />

            {/* Applications Table */}
            <div className="card">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Applications for Verification
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Applicant</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Farm Detail</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        Loading applications...
                                    </td>
                                </tr>
                            ) : filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No applications found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-4 text-sm font-mono text-emerald-700 font-bold">
                                            REF-{app.id.substring(0, 6).toUpperCase()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold">{app.farmer}</p>
                                            <p className="text-xs text-gray-500">Submitted {app.date}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-medium">{app.farm_name}</p>
                                            <p className="text-xs text-emerald-600 font-medium">{app.district}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusColor(app.status)}`}>
                                                {(app.status || 'PENDING').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setOfficerComments(app.officer_comments || '');
                                                        setNewFarmName(app.farm_name || '');
                                                        setOldDistrict(app.old_district || '');
                                                    }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="btn btn-icon btn-primary"
                                                    title="Approve / Process"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                {user?.role !== 'finance' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedApp(app)
                                                            setShowQueryModal(true)
                                                        }}
                                                        className="btn btn-icon btn-danger"
                                                        title="Query / Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal - Keeping as is for now (too complex to extract fully in one go) */}
            {/* The modal content has been tested and works, keeping it inline for stability */}
            <Modal
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                title={selectedApp ? `Application Details - REF-${selectedApp.id.substring(0, 6).toUpperCase()}` : 'Application Details'}
                maxWidth="max-w-4xl"
            >
                {selectedApp && (() => {
                    // Calculate pricingData once for the entire modal
                    const pricingData = {
                        ...selectedApp,
                        ...(calculatedPricing || {}),
                        // Preserve selectedApp values if calculatedPricing doesn't have them
                        ecological_region: calculatedPricing?.ecological_region || selectedApp.ecological_region,
                        base_rate_per_hectare: calculatedPricing?.base_rate_per_hectare || selectedApp.base_rate_per_hectare,
                        land_class_discount: calculatedPricing?.land_class_discount ?? selectedApp.land_class_discount,
                        water_premium: calculatedPricing?.water_premium ?? selectedApp.water_premium,
                        town_premium: calculatedPricing?.town_premium ?? selectedApp.town_premium,
                        calculated_land_value: calculatedPricing?.calculated_land_value || selectedApp.calculated_land_value,
                        purchase_price: calculatedPricing?.purchase_price || selectedApp.purchase_price,
                    };

                    return (
                        <div className="space-y-6">
                            {/* Main Info */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Applicant Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Full Name</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farmer}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">National ID</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farmer_national_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Gender</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farmer_gender || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Date of Birth</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farmer_dob || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Email</label>
                                            <p className="font-medium text-gray-900">{selectedApp.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Mobile</label>
                                            <p className="font-medium text-gray-900">{selectedApp.telephone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Farm Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Farm Name</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farm_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">District</label>
                                            <p className="font-medium text-gray-900">{selectedApp.district}</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-xs text-gray-500 uppercase">Plot Number</label>
                                            <p className="font-mono font-medium text-gray-900">{selectedApp.farm_id || 'Not assigned'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Total Extent</label>
                                            <p className="font-medium text-gray-900">{selectedApp.farm_extent} Ha</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Arable Area</label>
                                            <p className="font-medium text-gray-900">{selectedApp.arable_area} Ha</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Estimated Value</label>
                                            <p className="font-bold text-emerald-600 text-lg">
                                                {selectedApp.purchase_price ? `$${selectedApp.purchase_price}` : 'Pending Valuation'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Uploaded Documents */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Uploaded Documents</h4>

                                    {/* Farmer Documents */}
                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs font-semibold text-gray-600 uppercase">Applicant Documents</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedApp.national_id_copy && (
                                                <a href={selectedApp.national_id_copy} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group">
                                                    <span className="text-blue-600 text-lg">📄</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">National ID Copy</span>
                                                    <span className="ml-auto text-xs text-blue-600 font-semibold">View →</span>
                                                </a>
                                            )}
                                            {selectedApp.tenure_document && (
                                                <a href={selectedApp.tenure_document} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group">
                                                    <span className="text-blue-600 text-lg">📋</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Tenure Document</span>
                                                    <span className="ml-auto text-xs text-blue-600 font-semibold">View →</span>
                                                </a>
                                            )}
                                            {selectedApp.war_vet_id_copy && (
                                                <a href={selectedApp.war_vet_id_copy} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-amber-50 hover:border-amber-300 transition group">
                                                    <span className="text-amber-600 text-lg">🎖️</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700">War Veteran ID</span>
                                                    <span className="ml-auto text-xs text-amber-600 font-semibold">View →</span>
                                                </a>
                                            )}
                                            {selectedApp.employment_proof && (
                                                <a href={selectedApp.employment_proof} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group">
                                                    <span className="text-blue-600 text-lg">💼</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Employment Proof</span>
                                                    <span className="ml-auto text-xs text-blue-600 font-semibold">View →</span>
                                                </a>
                                            )}
                                            {selectedApp.other_attachments && (
                                                <a href={selectedApp.other_attachments} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group">
                                                    <span className="text-gray-500 text-lg">📎</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Other Attachments</span>
                                                    <span className="ml-auto text-xs text-blue-600 font-semibold">View →</span>
                                                </a>
                                            )}
                                            {!selectedApp.national_id_copy && !selectedApp.tenure_document && !selectedApp.war_vet_id_copy && !selectedApp.employment_proof && !selectedApp.other_attachments && (
                                                <p className="text-xs text-gray-400 italic px-2">No applicant documents uploaded</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Spouse Documents */}
                                    {selectedApp.spouses && selectedApp.spouses.length > 0 && selectedApp.spouses.some(s => s.war_vet_id_copy || s.employment_proof) && (
                                        <div className="space-y-2 border-t pt-3">
                                            <p className="text-xs font-semibold text-gray-600 uppercase">Spouse Documents</p>
                                            {selectedApp.spouses.map((spouse, idx) => (
                                                (spouse.war_vet_id_copy || spouse.employment_proof) && (
                                                    <div key={idx} className="ml-1">
                                                        <p className="text-xs font-medium text-purple-700 mb-1">
                                                            {spouse.first_name} {spouse.surname}
                                                        </p>
                                                        <div className="grid grid-cols-1 gap-2 ml-2">
                                                            {spouse.war_vet_id_copy && (
                                                                <a href={spouse.war_vet_id_copy} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition group">
                                                                    <span className="text-amber-600 text-lg">🎖️</span>
                                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">War Veteran ID</span>
                                                                    <span className="ml-auto text-xs text-purple-600 font-semibold">View →</span>
                                                                </a>
                                                            )}
                                                            {spouse.employment_proof && (
                                                                <a href={spouse.employment_proof} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition group">
                                                                    <span className="text-blue-600 text-lg">💼</span>
                                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Employment Proof</span>
                                                                    <span className="ml-auto text-xs text-purple-600 font-semibold">View →</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pricing Breakdown - Only for Valuation, Admin, and Director */}
                                {['valuation', 'admin', 'director'].includes(user?.role) && (selectedApp.purchase_price || calculatedPricing) && (

                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-2 border-emerald-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-4">
                                            Purchase Price Valuation
                                        </h4>

                                        {/* Table-based Pricing Calculation */}
                                        <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden">
                                            {/* Farm Basic Information */}
                                            <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200">
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="font-semibold text-gray-700">Region: </span>
                                                        <span className="text-gray-900">{pricingData.ecological_region || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-700">Farm Size: </span>
                                                        <span className="text-gray-900">{selectedApp.farm_extent || 0} Ha</span>
                                                    </div>
                                                    {selectedApp.arable_area && (
                                                        <div className="col-span-2">
                                                            <span className="font-semibold text-gray-700">Arable Area: </span>
                                                            <span className="text-gray-900">
                                                                {selectedApp.arable_area} Ha ({selectedApp.farm_extent > 0 ? ((selectedApp.arable_area / selectedApp.farm_extent) * 100).toFixed(1) : 0}%)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progressive Rate Calculation Table */}
                                            <div className="divide-y divide-gray-200">
                                                {/* Base Rate */}
                                                {pricingData.base_rate_per_hectare && (
                                                    <div className="px-4 py-2.5 hover:bg-gray-50">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <span className="text-sm font-medium text-gray-900">Base Rate per Hectare</span>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">Standard rate for {pricingData.ecological_region}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-blue-700">${parseFloat(pricingData.base_rate_per_hectare).toFixed(2)}/Ha</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Land Class Discount */}
                                                {pricingData.land_class_discount > 0 && pricingData.base_rate_per_hectare && (
                                                    <div className="px-4 py-2.5 bg-red-50/30">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <span className="text-sm text-gray-700">Land Class Discount</span>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">Applied for farms with less than 80% arable land</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-semibold text-red-600">-{parseFloat(pricingData.land_class_discount).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-red-200">
                                                            <span className="text-xs font-medium text-gray-600">→ Adjusted Rate (Land Quality)</span>
                                                            <span className="text-sm font-bold text-gray-900">
                                                                ${(parseFloat(pricingData.base_rate_per_hectare) * (1 - parseFloat(pricingData.land_class_discount) / 100)).toFixed(2)}/Ha
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Water Source Premium */}
                                                {pricingData.water_premium > 0 && (
                                                    <div className="px-4 py-2.5 bg-blue-50/30">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <span className="text-sm text-gray-700">Water Source Premium</span>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                                    {selectedApp.water_source_distance === 'on_farm' ? 'Water source on-site' :
                                                                        selectedApp.water_source_distance === 'within_5km' ? 'Within 5km' : 'Has water access'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-semibold text-blue-600">+{parseFloat(pricingData.water_premium).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                        {pricingData.base_rate_per_hectare && (
                                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                                                <span className="text-xs font-medium text-gray-600">→ Adjusted Rate (Water Access)</span>
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    ${(() => {
                                                                        let rate = parseFloat(pricingData.base_rate_per_hectare);
                                                                        if (pricingData.land_class_discount > 0) {
                                                                            rate *= (1 - parseFloat(pricingData.land_class_discount) / 100);
                                                                        }
                                                                        rate *= (1 + parseFloat(pricingData.water_premium) / 100);
                                                                        return rate.toFixed(2);
                                                                    })()}/Ha
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Town Proximity Premium */}
                                                {pricingData.town_premium > 0 && (
                                                    <div className="px-4 py-2.5 bg-blue-50/30">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <span className="text-sm text-gray-700">Town Proximity {pricingData.town_premium >= 0 ? 'Premium' : 'Discount'}</span>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                                    {selectedApp.distance_to_town || 0}km from {selectedApp.nearest_town || 'nearest town'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-semibold text-blue-600">+{parseFloat(pricingData.town_premium).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                        {pricingData.base_rate_per_hectare && (
                                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                                                <span className="text-xs font-medium text-gray-600">→ Final Rate per Hectare</span>
                                                                <span className="text-sm font-bold text-emerald-700">
                                                                    ${(() => {
                                                                        let rate = parseFloat(pricingData.base_rate_per_hectare);
                                                                        if (pricingData.land_class_discount > 0) {
                                                                            rate *= (1 - parseFloat(pricingData.land_class_discount) / 100);
                                                                        }
                                                                        if (pricingData.water_premium > 0) {
                                                                            rate *= (1 + parseFloat(pricingData.water_premium) / 100);
                                                                        }
                                                                        rate *= (1 + parseFloat(pricingData.town_premium) / 100);
                                                                        return rate.toFixed(2);
                                                                    })()}/Ha
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Total Land Purchase Price */}
                                                {pricingData.calculated_land_value && (
                                                    <div className="px-4 py-3 bg-amber-50 border-t-2 border-amber-200">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <span className="text-sm font-bold text-amber-900">Land Value (Before Beneficiary Discounts)</span>
                                                                {pricingData.base_rate_per_hectare && (
                                                                    <p className="text-[10px] text-amber-700 mt-0.5">
                                                                        {selectedApp.farm_extent} Ha × Final Rate/Ha
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="text-lg font-bold text-amber-700">
                                                                ${parseFloat(pricingData.calculated_land_value).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* War Veteran Special Pricing Note */}
                                                {selectedApp.farmer_is_war_veteran && (
                                                    <div className="px-4 py-3 bg-amber-50 border-t-2 border-amber-200">
                                                        <p className="text-xs text-amber-800 font-medium mb-1">⭐ War Veteran Special Pricing Applied</p>
                                                        <p className="text-[10px] text-amber-700">
                                                            First 6 Ha @ $10/ha = ${Math.min(selectedApp.farm_extent || 0, 6) * 10}
                                                        </p>
                                                        {selectedApp.farm_extent > 6 && pricingData.base_rate_per_hectare && (
                                                            <p className="text-[10px] text-amber-700">
                                                                Remaining {(selectedApp.farm_extent - 6).toFixed(2)} Ha @ ${parseFloat(pricingData.base_rate_per_hectare).toFixed(2)}/ha
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Improvements */}
                                                {selectedApp.improvements_value && parseFloat(selectedApp.improvements_value) > 0 && (
                                                    <div className="px-4 py-2.5 bg-green-50/30">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-700">Improvements Value</span>
                                                            <span className="text-sm font-bold text-green-600">+${parseFloat(selectedApp.improvements_value).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Beneficiary Discounts Section */}
                                        <div className="mt-4 bg-white rounded-lg border border-purple-200 overflow-hidden">
                                            <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                                                <h5 className="text-xs font-bold text-purple-900 uppercase">Beneficiary Discounts</h5>
                                            </div>
                                            <div className="px-4 py-3 space-y-2">
                                                {/* Cash Payment Discount */}
                                                {selectedApp.is_cash_payment && (
                                                    <div className="flex justify-between items-center py-1.5 px-2 bg-blue-50 rounded">
                                                        <span className="text-sm text-blue-700">Cash Payment</span>
                                                        <span className="text-sm font-semibold text-blue-700">-15%</span>
                                                    </div>
                                                )}

                                                {/* Farmer War Veteran Discount */}
                                                {selectedApp.farmer_is_war_veteran && (
                                                    <div className="flex justify-between items-center py-1.5 px-2 bg-emerald-50 rounded">
                                                        <span className="text-sm text-emerald-700">Farmer - War Veteran</span>
                                                        <span className="text-sm font-semibold text-emerald-700">-10%</span>
                                                    </div>
                                                )}

                                                {/* Farmer Civil Servant Discount */}
                                                {selectedApp.farmer_is_civil_servant && selectedApp.farmer_civil_service_years >= 20 && (
                                                    <div className="flex justify-between items-center py-1.5 px-2 bg-emerald-50 rounded">
                                                        <span className="text-sm text-emerald-700">Farmer - Civil Servant ({selectedApp.farmer_civil_service_years} years)</span>
                                                        <span className="text-sm font-semibold text-emerald-700">-5%</span>
                                                    </div>
                                                )}
                                                {selectedApp.farmer_is_civil_servant && selectedApp.farmer_civil_service_years >= 10 && selectedApp.farmer_civil_service_years < 20 && (
                                                    <div className="flex justify-between items-center py-1.5 px-2 bg-emerald-50 rounded">
                                                        <span className="text-sm text-emerald-700">Farmer - Civil Servant ({selectedApp.farmer_civil_service_years} years)</span>
                                                        <span className="text-sm font-semibold text-emerald-700">-2.5%</span>
                                                    </div>
                                                )}

                                                {/* Spouse Discounts */}
                                                {selectedApp.spouses && selectedApp.spouses.length > 0 && selectedApp.spouses.map((spouse, idx) => (
                                                    <React.Fragment key={idx}>
                                                        {spouse.is_war_veteran && (
                                                            <div className="flex justify-between items-center py-1.5 px-2 bg-purple-50 rounded">
                                                                <span className="text-sm text-purple-700">Spouse ({spouse.first_name}) - War Veteran</span>
                                                                <span className="text-sm font-semibold text-purple-700">-10%</span>
                                                            </div>
                                                        )}
                                                        {spouse.is_civil_servant && spouse.civil_service_years >= 20 && (
                                                            <div className="flex justify-between items-center py-1.5 px-2 bg-purple-50 rounded">
                                                                <span className="text-sm text-purple-700">Spouse ({spouse.first_name}) - Civil Servant ({spouse.civil_service_years} years)</span>
                                                                <span className="text-sm font-semibold text-purple-700">-5%</span>
                                                            </div>
                                                        )}
                                                        {spouse.is_civil_servant && spouse.civil_service_years >= 10 && spouse.civil_service_years < 20 && (
                                                            <div className="flex justify-between items-center py-1.5 px-2 bg-purple-50 rounded">
                                                                <span className="text-sm text-purple-700">Spouse ({spouse.first_name}) - Civil Servant ({spouse.civil_service_years} years)</span>
                                                                <span className="text-sm font-semibold text-purple-700">-2.5%</span>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                ))}

                                                {/* No discounts message */}
                                                {!selectedApp.is_cash_payment &&
                                                    !selectedApp.farmer_is_war_veteran &&
                                                    !selectedApp.farmer_is_civil_servant &&
                                                    (!selectedApp.spouses || selectedApp.spouses.length === 0 ||
                                                        !selectedApp.spouses.some(s => s.is_war_veteran || s.is_civil_servant)) && (
                                                        <p className="text-xs text-gray-500 italic px-2">No beneficiary discounts applied</p>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Final Purchase Price After All Discounts */}
                                        {(pricingData?.purchase_price || selectedApp.purchase_price) && (
                                            <div className="mt-4 rounded-lg border-2 overflow-hidden shadow-lg" style={{ background: 'linear-gradient(to right, #047857, #065f46)', borderColor: '#10b981' }}>
                                                <div className="px-5 py-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h5 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#ffffff' }}>Final Purchase Price</h5>
                                                            <p className="text-xs mt-0.5" style={{ color: '#ffffff', opacity: 0.95 }}>After all beneficiary discounts applied</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-extrabold tracking-tight" style={{ color: '#ffffff' }}>
                                                                ${parseFloat(pricingData?.purchase_price || selectedApp.purchase_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}


                                {/* VALUATION OFFICER INPUTS */}
                                {(user?.role === 'valuation' || user?.role === 'director') && (
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-4 mt-4">
                                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                                            Valuation Parameters {!selectedApp.valuation_approved ? '(Editable)' : '(Read Only)'}
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Farm Extent (Ha)</label>
                                                <input
                                                    type="number"
                                                    className="input text-sm h-9"
                                                    value={valuationParams.farm_extent}
                                                    onChange={(e) => handleValuationChange('farm_extent', e.target.value)}
                                                    disabled={selectedApp.valuation_approved && user.role !== 'director'} // Director can edit
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Arable Area (Ha)</label>
                                                <input
                                                    type="number"
                                                    className="input text-sm h-9"
                                                    value={valuationParams.arable_area}
                                                    onChange={(e) => handleValuationChange('arable_area', e.target.value)}
                                                    disabled={selectedApp.valuation_approved && user.role !== 'director'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Distance to Town (km)</label>
                                                <input
                                                    type="number"
                                                    className="input text-sm h-9"
                                                    value={valuationParams.distance_to_town}
                                                    onChange={(e) => handleValuationChange('distance_to_town', e.target.value)}
                                                    disabled={selectedApp.valuation_approved && user.role !== 'director'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Nearest Town</label>
                                                <select
                                                    className="input text-sm h-9"
                                                    value={valuationParams.nearest_town}
                                                    onChange={(e) => handleValuationChange('nearest_town', e.target.value)}
                                                    disabled={selectedApp.valuation_approved && user.role !== 'director'}
                                                >
                                                    <option value="">Select Town</option>
                                                    {['Harare', 'Bulawayo', 'Gweru', 'Mutare', 'Marondera', 'Chinhoyi', 'Masvingo', 'Bindura', 'Kadoma', 'Kwekwe', 'Chegutu', 'Gwanda', 'Norton', 'Chitungwiza', 'Chiredzi', 'Rusape', 'Hwange', 'Beitbridge', 'Chipinge', 'Karoi', 'Chivhu', 'Nyanga', 'Banket', 'Victoria Falls', 'Zvishavane', 'Shurugwi', 'Redcliff', 'Ruwa', 'Mazowe'].map(town => (
                                                        <option key={town} value={town}>{town}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Eco Region</label>
                                                <select
                                                    className="input text-sm h-9"
                                                    value={valuationParams.ecological_region}
                                                    onChange={(e) => handleValuationChange('ecological_region', e.target.value)}
                                                    disabled={selectedApp.valuation_approved && user.role !== 'director'}
                                                >
                                                    <option value="">Auto (District)</option>
                                                    <option value="1">Region 1</option>
                                                    <option value="2a">Region 2a</option>
                                                    <option value="2b">Region 2b</option>
                                                    <option value="3">Region 3</option>
                                                    <option value="4">Region 4</option>
                                                    <option value="5">Region 5</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Manual Override Section */}
                                        <div className="pt-2 border-t border-emerald-200 mt-2">
                                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-warning"
                                                    checked={!!manualPrice}
                                                    onChange={(e) => {
                                                        if (!e.target.checked) {
                                                            setManualPrice('')
                                                            setPriceOverrideReason('')
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm font-bold text-amber-800">Enable Manual Price Override</span>
                                            </label>

                                            {manualPrice !== '' && (
                                                <div className="space-y-3 pl-6 animate-fade-in">
                                                    <div>
                                                        <label className="block text-xs font-bold text-amber-800 mb-1">Manual Base Price ($) <span className="text-gray-500 font-normal">(Before discounts)</span></label>
                                                        <input
                                                            type="number"
                                                            className="input input-warning h-9 bg-white"
                                                            placeholder="Enter manual price..."
                                                            value={manualPrice}
                                                            onChange={(e) => setManualPrice(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-amber-800 mb-1">Reason for Override</label>
                                                        <input
                                                            type="text"
                                                            className="input input-warning h-9 bg-white"
                                                            placeholder="e.g. Ministerial directive, appeal outcome..."
                                                            value={priceOverrideReason}
                                                            onChange={(e) => setPriceOverrideReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isCalculating && <p className="text-xs text-blue-600 animate-pulse">Updating calculation...</p>}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <label className="block text-sm font-medium mb-2">Officer Comments</label>
                                    <textarea
                                        className="input h-24 resize-none"
                                        placeholder="Add any internal notes or remarks..."
                                        value={officerComments}
                                        onChange={(e) => setOfficerComments(e.target.value)}
                                    />
                                </div>

                                {/* Role-specific forms remain inline for now - these are tested and working */}
                                {/* Surveyor Form */}
                                {user.role === 'surveyor' && (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-4 mt-4">
                                        <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">Survey Verification Details</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">Measured Hectarage</label>
                                                <input
                                                    type="number"
                                                    className="input text-sm"
                                                    value={hectarage}
                                                    onChange={(e) => setHectarage(e.target.value)}
                                                    placeholder="e.g. 50.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">Confirmed Farm Name</label>
                                                <input
                                                    type="text"
                                                    className="input text-sm"
                                                    value={newFarmName}
                                                    onChange={(e) => setNewFarmName(e.target.value)}
                                                    placeholder="e.g. New Farm Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">Old District (if any)</label>
                                                <input
                                                    type="text"
                                                    className="input text-sm"
                                                    value={oldDistrict}
                                                    onChange={(e) => setOldDistrict(e.target.value)}
                                                    placeholder="Previous district name"
                                                />
                                            </div>

                                            <div className="p-3 bg-white rounded-lg border border-indigo-100">
                                                <label className="block text-sm font-bold text-indigo-900 mb-2">Survey Fee Payment Status</label>
                                                <div className="flex flex-col gap-2">
                                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="surveyFee"
                                                            className="radio radio-primary radio-sm"
                                                            checked={isFeePaid === true}
                                                            onChange={() => setIsFeePaid(true)}
                                                        />
                                                        <span className="text-sm">Fee Paid (Proof Verified)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="surveyFee"
                                                            className="radio radio-primary radio-sm"
                                                            checked={isFeePaid === false}
                                                            onChange={() => setIsFeePaid(false)}
                                                        />
                                                        <span className="text-sm">Fee NOT Paid</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Accounts Form */}
                                {user.role === 'accounts' && (
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-4 mt-4">
                                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Application Fee Verification</h4>
                                        <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-emerald-600 rounded"
                                                checked={isAppFeePaid}
                                                onChange={(e) => setIsAppFeePaid(e.target.checked)}
                                            />
                                            <span className="font-medium">Application Fee ($10) PAID</span>
                                        </label>
                                        {!isAppFeePaid && <p className="text-xs text-amber-600 font-medium">If unchecked, $10 will be added to the final Agreement of Sale.</p>}
                                    </div>
                                )}

                                {/* ZLC Form */}
                                {user.role === 'zlc' && (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4 mt-4">
                                        <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">Dispute Verification</h4>
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3">
                                                <span className="font-medium text-gray-700">Are there any disputes logged against this farm?</span>
                                                <div className="flex items-center bg-white border rounded-lg p-1">
                                                    <button
                                                        className={`px-3 py-1 text-sm rounded-md transition ${!hasDisputes ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-gray-500'}`}
                                                        onClick={() => setHasDisputes(false)}
                                                    >
                                                        No / Clean
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                    <button
                                                        className={`px-3 py-1 text-sm rounded-md transition ${hasDisputes ? 'bg-red-100 text-red-700 font-bold' : 'text-gray-500'}`}
                                                        onClick={() => setHasDisputes(true)}
                                                    >
                                                        Yes / Dispute
                                                    </button>
                                                </div>
                                            </label>

                                            {hasDisputes && (
                                                <div className="animate-fade-in">
                                                    <label className="block text-sm font-bold text-red-800 mb-1">Nature of Dispute *</label>
                                                    <input
                                                        className="input border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        placeholder="e.g. Boundary Dispute, Double Allocation, Illegal Settler"
                                                        value={disputeNature}
                                                        onChange={(e) => setDisputeNature(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Remaining role-specific UI sections... keeping inline for stability */}
                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                                    {user?.role === 'surveyor' ? (
                                        <>
                                            <button
                                                className="btn bg-emerald-600 text-white hover:bg-emerald-700 flex-1 min-w-[180px] shadow-lg font-bold"
                                                onClick={() => handleAction(selectedApp.id, 'Survey')}
                                                title="Mark survey as completed and submit verified data"
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <><span style={{ display: 'inline-block' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Processing...</>
                                                ) : (
                                                    <><CheckCircle size={18} className="inline mr-2" /> Update Portal with Survey Results</>
                                                )}
                                            </button>
                                            <button
                                                className="btn bg-orange-600 text-white hover:bg-orange-700 flex-1 min-w-[180px] shadow-lg font-bold"
                                                onClick={() => handleAction(selectedApp.id, 'RequireSurvey')}
                                                title="Require survey fee from farmer"
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <><span style={{ display: 'inline-block' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Processing...</>
                                                ) : (
                                                    <><DollarSign size={18} className="inline mr-2" /> Not Surveyed - Require Fee (${calculateSurveyFee(selectedApp.tenure_document_type)})</>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn bg-emerald-600 text-white hover:bg-emerald-700 min-w-[100px] shadow-lg font-bold"
                                            style={{ alignSelf: 'flex-start' }}
                                            onClick={() => handleAction(selectedApp.id, 'Approve')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <><span style={{ display: 'inline-block' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Processing...</>
                                            ) : (
                                                <>
                                                    <Check size={18} className="inline mr-2" />
                                                    {user?.role === 'lims' ? 'Verify' :
                                                        user?.role === 'accounts' ? 'Confirm Fee & Process' :
                                                            user?.role === 'estates' ? 'Verify Farmer Details' :
                                                                user?.role === 'zlc' ? (hasDisputes ? 'Log Dispute & Query' : 'Verify No Disputes') :
                                                                    user?.role === 'valuation' ? 'Approve Valuation' :
                                                                        user?.role === 'conveyancer' ? 'Generate Agreement' :
                                                                            user?.role === 'director' ? 'Final Approval' : 'Approve'}
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Director Conclude Button - for completed payment applications */}
                                    {user?.role === 'director' && ['PAYMENT_VERIFIED', 'READY_FOR_COLLECTION'].includes(selectedApp.status) && (
                                        <button
                                            className="btn bg-emerald-600 text-white hover:bg-emerald-700 min-w-[100px] shadow-lg font-bold"
                                            style={{ alignSelf: 'flex-start' }}
                                            onClick={() => handleAction(selectedApp.id, 'Conclude')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <><span style={{ display: 'inline-block' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Processing...</>
                                            ) : (
                                                <><CheckCircle size={18} className="inline mr-2" /> Conclude & Notify Farmer</>
                                            )}
                                        </button>
                                    )}

                                    {!['READY_FOR_COLLECTION', 'REJECTED', 'APPROVED', 'COMPLETED'].includes(selectedApp.status) && user?.role !== 'valuation' && (
                                        <button className="btn bg-amber-600 text-white hover:bg-amber-700 min-w-[100px] shadow-lg font-bold" onClick={() => setShowQueryModal(true)} disabled={actionLoading}>
                                            <MessageSquare size={18} className="inline mr-2" /> {user.role === 'director' ? 'Refer Back' : 'Query'}
                                        </button>
                                    )}
                                    {user?.role !== 'surveyor' && user?.role !== 'valuation' && (
                                        <button
                                            className="btn bg-red-600 text-white hover:bg-red-700 min-w-[100px] shadow-lg font-bold"
                                            onClick={() => handleAction(selectedApp.id, 'Reject')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <><span style={{ display: 'inline-block' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Processing...</>
                                            ) : (
                                                <><X size={18} className="inline mr-2" /> Reject</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Query / Refer Back Modal */}
            <Modal
                isOpen={showQueryModal}
                onClose={() => setShowQueryModal(false)}
                title={user?.role === 'director' ? 'Refer Back to Valuation Officer' : 'Query Application'}
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    {user?.role === 'director' ? (
                        <div className="bg-amber-50 p-4 rounded-lg flex gap-3 text-amber-800 text-sm border border-amber-200">
                            <AlertCircle className="shrink-0" size={20} />
                            <p>This will send the application back to the <strong>Valuation Officer</strong> for corrections. The officer will be able to re-valuate the application based on your feedback.</p>
                        </div>
                    ) : (
                        <div className="bg-red-50 p-4 rounded-lg flex gap-3 text-red-800 text-sm">
                            <AlertCircle className="shrink-0" size={20} />
                            <p>This will send the application back to the farmer for correction. Please provide a clear reason.</p>
                        </div>
                    )}
                    <textarea
                        className="input h-32"
                        placeholder={user?.role === 'director' ? 'Enter reason for referring back to valuation officer...' : 'Enter reason for query...'}
                        value={queryReason}
                        onChange={(e) => setQueryReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setShowQueryModal(false)} className="btn btn-ghost">Cancel</button>
                        <button onClick={handleQuery} className={user?.role === 'director' ? 'btn bg-amber-600 text-white hover:bg-amber-700 font-bold' : 'btn btn-destructive'}>
                            {user?.role === 'director' ? 'Refer Back' : 'Submit Query'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default OfficerDashboard
