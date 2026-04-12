import React, { useState } from 'react'
import { X, Check, AlertTriangle, FileText, User } from 'lucide-react'
import axios from 'axios'

const LIMSInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [showRejection, setShowRejection] = useState(false)
    const [rejectionType, setRejectionType] = useState('')
    const [processing, setProcessing] = useState(false)

    const handleVerify = async () => {
        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/verify_lims/`)
            onSuccess('Application verified successfully!')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to verify application')
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionType) {
            onError('Please select a rejection type')
            return
        }

        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/reject_lims/`, {
                rejection_type: rejectionType
            })
            onSuccess(`Application rejected: ${rejectionType.replace('_', ' ')}`)
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to reject application')
        } finally {
            setProcessing(false)
        }
    }

    const getRejectionMessage = () => {
        const messages = {
            'double_allocation': 'Please visit your district office to correct the double allocation issue.',
            'deceased': 'Please visit the district office to start a succession process.',
            'not_found': 'Your farm could not be found in our database. Please visit the district office.'
        }
        return messages[rejectionType] || ''
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-2xl font-bold text-emerald-700">
                        {showRejection ? 'Reject Application - LIMS' : 'LIMS Verification'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {!showRejection ? (
                    <div className="space-y-6">
                        {/* Application Details */}
                        <div>
                            <h4 className="text-emerald-700 font-bold mb-3 flex items-center gap-2">
                                <User size={18} /> Applicant Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Full Name</p>
                                    <p className="font-semibold">{selectedApp.farmer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">National ID</p>
                                    <p className="font-semibold">{selectedApp.farmer_details?.national_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Farm Name</p>
                                    <p className="font-semibold">{selectedApp.farm_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">District</p>
                                    <p className="font-semibold">{selectedApp.district}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Farm ID</p>
                                    <p className="font-semibold text-emerald-600">{selectedApp.farm_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Extent (Ha)</p>
                                    <p className="font-semibold">{selectedApp.farm_extent}</p>
                                </div>
                            </div>
                        </div>

                        {/* LIMS Verification Instructions */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <h4 className="font-bold text-blue-900 mb-2">LIMS Verification Task</h4>
                            <p className="text-sm text-blue-800">
                                Verify that the farm with ID <strong>{selectedApp.farm_id}</strong> exists in the LIMS database.
                                Check for double allocations, deceased farm owners, or missing records.
                            </p>
                        </div>

                        {/* Documents */}
                        <div>
                            <h4 className="text-emerald-700 font-bold mb-3 flex items-center gap-2">
                                <FileText size={18} /> Submitted Documents
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {selectedApp.tenure_document && (
                                    <a href={selectedApp.tenure_document} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 border rounded-xl hover:border-emerald-500 hover:shadow transition">
                                        <FileText size={20} className="text-emerald-600" />
                                        <span className="text-sm font-semibold">Tenure Document</span>
                                    </a>
                                )}
                                {selectedApp.national_id_copy && (
                                    <a href={selectedApp.national_id_copy} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 border rounded-xl hover:border-emerald-500 hover:shadow transition">
                                        <FileText size={20} className="text-emerald-600" />
                                        <span className="text-sm font-semibold">National ID Copy</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white">
                            <button
                                className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold disabled:bg-gray-300"
                                onClick={handleVerify}
                                disabled={processing}
                            >
                                <Check size={20} className="inline mr-2" />
                                {processing ? 'Processing...' : 'Verify - Farm Found'}
                            </button>
                            <button
                                className="btn bg-red-600 text-white hover:bg-red-700 flex-1 py-3 font-bold"
                                onClick={() => setShowRejection(true)}
                                disabled={processing}
                            >
                                <X size={20} className="inline mr-2" />
                                Reject Application
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                Rejecting Application for {selectedApp.farmer}
                            </h4>
                            <p className="text-sm text-red-800">
                                Please select the reason why this application cannot proceed.
                            </p>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-2">Rejection Reason</label>
                            <select
                                className="input w-full"
                                value={rejectionType}
                                onChange={(e) => setRejectionType(e.target.value)}
                            >
                                <option value="">-- Select Reason --</option>
                                <option value="double_allocation">Double Allocation</option>
                                <option value="deceased">Farm Owner Deceased</option>
                                <option value="not_found">Farm Not Found in Database</option>
                            </select>
                        </div>

                        {rejectionType && (
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <p className="text-xs font-bold text-yellow-900 uppercase mb-1">
                                    Response Message to Farmer:
                                </p>
                                <p className="text-sm text-yellow-800 italic">
                                    "{getRejectionMessage()}"
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                                onClick={() => setShowRejection(false)}
                                disabled={processing}
                            >
                                Back to Details
                            </button>
                            <button
                                className={`btn flex-1 py-3 font-bold ${rejectionType ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                onClick={handleReject}
                                disabled={!rejectionType || processing}
                            >
                                {processing ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LIMSInterface
