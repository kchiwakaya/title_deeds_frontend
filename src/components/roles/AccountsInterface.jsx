import React, { useState } from 'react'
import { X, Check, DollarSign, FileText } from 'lucide-react'
import axios from 'axios'

const AccountsInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [processing, setProcessing] = useState(false)

    const handleConfirmFee = async (feePaid) => {
        setProcessing(true)
        try {
            const endpoint = feePaid ? 'confirm_application_fee' : 'mark_fee_unpaid'
            await axios.post(`/api/applications/${selectedApp.id}/${endpoint}/`)
            onSuccess(feePaid ? 'Application fee confirmed as paid' : 'Fee marked as unpaid - will be added to purchase price')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to process fee confirmation')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">Accounts - Fee Confirmation</h3>
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
                            <p className="text-xs text-gray-500 uppercase font-bold">Application ID</p>
                            <p className="font-semibold text-emerald-600">#{selectedApp.id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Application Fee</p>
                            <p className="font-semibold text-green-600">$10.00</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <DollarSign size={18} />
                            Fee Confirmation Task
                        </h4>
                        <p className="text-sm text-blue-800">
                            Verify if the applicant has paid the $10.00 title deed application fee in cash.
                            If not paid, the fee will be added to the final purchase price.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <button
                            className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold disabled:bg-gray-300"
                            onClick={() => handleConfirmFee(true)}
                            disabled={processing}
                        >
                            <Check size={20} className="inline mr-2" />
                            {processing ? 'Processing...' : 'Fee Paid - Confirmed'}
                        </button>
                        <button
                            className="btn bg-orange-600 text-white hover:bg-orange-700 flex-1 py-3 font-bold"
                            onClick={() => handleConfirmFee(false)}
                            disabled={processing}
                        >
                            <X size={20} className="inline mr-2" />
                            Fee Not Paid
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AccountsInterface
