import React, { useState } from 'react'
import { X, Check, MapPin, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const ZLCInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [showDispute, setShowDispute] = useState(false)
    const [disputeType, setDisputeType] = useState('')
    const [disputeDetails, setDisputeDetails] = useState('')
    const [processing, setProcessing] = useState(false)

    const handleVerifyClear = async () => {
        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/verify_zlc_clear/`)
            onSuccess('ZLC verification completed - No disputes found')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to verify ZLC')
        } finally {
            setProcessing(false)
        }
    }

    const handleFlagDispute = async () => {
        if (!disputeType || !disputeDetails.trim()) {
            onError('Please select dispute type and provide details')
            return
        }

        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/flag_zlc_dispute/`, {
                dispute_type: disputeType,
                dispute_details: disputeDetails
            })
            onSuccess(`Dispute flagged: ${disputeType.replace('_', ' ')}`)
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to flag dispute')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">ZLC - Dispute Verification</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Applicant</p>
                            <p className="font-semibold">{selectedApp.farmer}</p>
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
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <MapPin size={18} />
                            ZLC Verification Task
                        </h4>
                        <p className="text-sm text-blue-800">
                            Check if there are any logged disputes against this farm. Types of disputes include boundary disputes,
                            double allocations, or illegal settlers.
                        </p>
                    </div>

                    {!showDispute ? (
                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold"
                                onClick={handleVerifyClear}
                                disabled={processing}
                            >
                                <Check size={20} className="inline mr-2" />
                                {processing ? 'Processing...' : 'No Disputes - Clear'}
                            </button>
                            <button
                                className="btn bg-red-600 text-white hover:bg-red-700 flex-1 py-3 font-bold"
                                onClick={() => setShowDispute(true)}
                                disabled={processing}
                            >
                                <AlertTriangle size={20} className="inline mr-2" />
                                Flag Dispute
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                <h4 className="font-bold text-red-900">Flag Dispute</h4>
                                <p className="text-sm text-red-800">
                                    Specify the nature and details of the dispute found against this farm.
                                </p>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Dispute Type</label>
                                <select
                                    className="input w-full"
                                    value={disputeType}
                                    onChange={(e) => setDisputeType(e.target.value)}
                                >
                                    <option value="">-- Select Dispute Type --</option>
                                    <option value="boundary">Boundary Dispute</option>
                                    <option value="double_allocation">Double Allocation</option>
                                    <option value="illegal_settler">Illegal Settler</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Dispute Details</label>
                                <textarea
                                    className="input w-full h-32"
                                    placeholder="Provide detailed information about the dispute..."
                                    value={disputeDetails}
                                    onChange={(e) => setDisputeDetails(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                                    onClick={() => setShowDispute(false)}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex-1 py-3 font-bold"
                                    onClick={handleFlagDispute}
                                    disabled={!disputeType || !disputeDetails.trim() || processing}
                                >
                                    {processing ? 'Processing...' : 'Confirm Dispute Flag'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ZLCInterface
