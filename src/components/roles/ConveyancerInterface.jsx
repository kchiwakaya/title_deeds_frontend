import React, { useState } from 'react'
import { X, FileSignature, DollarSign } from 'lucide-react'
import axios from 'axios'

const ConveyancerInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    // Calculate total amount due
    const calculateTotal = () => {
        let total = parseFloat(selectedApp.valuation_amount) || 0

        // Add application fee if not paid
        if (!selectedApp.application_fee_paid) {
            total += 10
        }

        // Add survey fee if not paid
        if (!selectedApp.survey_fee_paid && selectedApp.survey_fee_amount) {
            total += parseFloat(selectedApp.survey_fee_amount)
        }

        return total.toFixed(2)
    }

    const handlePrepareAgreement = async () => {
        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/prepare_agreement/`, {
                notes
            })
            onSuccess('Agreement prepared and application approved!')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to prepare agreement')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">Conveyancer - Agreement Preparation</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Application Summary */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Applicant</p>
                            <p className="font-semibold">{selectedApp.farmer}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">National ID</p>
                            <p className="font-semibold">{selectedApp.farmer_details?.national_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Official Farm Name</p>
                            <p className="font-semibold text-emerald-600">{selectedApp.official_farm_name || selectedApp.farm_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Hectarage</p>
                            <p className="font-semibold">{selectedApp.official_hectarage || selectedApp.farm_extent} Ha</p>
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <DollarSign size={18} />
                            Financial Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Land Valuation:</span>
                                <span className="font-bold">${parseFloat(selectedApp.valuation_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Application Fee:</span>
                                <span className="font-semibold">
                                    {selectedApp.application_fee_paid ? (
                                        <span className="text-green-600">$10.00 (Paid)</span>
                                    ) : (
                                        <span className="text-red-600">$10.00 (Unpaid - Added)</span>
                                    )}
                                </span>
                            </div>
                            {selectedApp.survey_fee_amount && (
                                <div className="flex justify-between text-gray-700">
                                    <span>Survey Fee:</span>
                                    <span className="font-semibold">
                                        {selectedApp.survey_fee_paid ? (
                                            <span className="text-green-600">${parseFloat(selectedApp.survey_fee_amount).toFixed(2)} (Paid)</span>
                                        ) : (
                                            <span className="text-red-600">${parseFloat(selectedApp.survey_fee_amount).toFixed(2)} (Unpaid - Added)</span>
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-blue-300 text-lg font-bold text-blue-900">
                                <span>Total Amount Due:</span>
                                <span>${calculateTotal()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                        <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                            <FileSignature size={18} />
                            Conveyancer Task
                        </h4>
                        <p className="text-sm text-emerald-800">
                            Review all financial details and prepare the purchase agreement. Once confirmed, the application  will be marked as <strong>APPROVED</strong> and ready for title deed issuance upon payment.
                        </p>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Agreement Notes (Optional)</label>
                        <textarea
                            className="input w-full h-24"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about the agreement..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <button
                            className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold"
                            onClick={handlePrepareAgreement}
                            disabled={processing}
                        >
                            <FileSignature size={20} className="inline mr-2" />
                            {processing ? 'Processing...' : 'Prepare Agreement & Approve'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConveyancerInterface
