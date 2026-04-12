import React, { useState } from 'react'
import { X, Check, Building, FileText } from 'lucide-react'
import axios from 'axios'

const EstatesInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [showCorrection, setShowCorrection] = useState(false)
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    const handleVerify = async () => {
        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/verify_estates/`, { notes })
            onSuccess('Form verified successfully')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to verify form')
        } finally {
            setProcessing(false)
        }
    }

    const handleRequestCorrection = async () => {
        if (!notes.trim()) {
            onError('Please provide correction notes')
            return
        }

        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/request_correction_estates/`, { notes })
            onSuccess('Correction request sent to applicant')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to request correction')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">Estates - Form Verification</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Applicant Details */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-bold text-gray-700 mb-3">Applicant Information</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Name</p>
                                <p className="font-semibold">{selectedApp.farmer}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">National ID</p>
                                <p className="font-semibold">{selectedApp.farmer_details?.national_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Contact</p>
                                <p className="font-semibold">{selectedApp.farmer_details?.telephone}</p>
                            </div>
                            <div className="col-span-full">
                                <p className="text-xs text-gray-500 uppercase font-bold">Address</p>
                                <p className="font-semibold">{selectedApp.farmer_details?.contact_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Farm Details */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-bold text-gray-700 mb-3">Farm Details</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Farm Name</p>
                                <p className="font-semibold">{selectedApp.farm_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">District</p>
                                <p className="font-semibold">{selectedApp.district}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Extent (Ha)</p>
                                <p className="font-semibold">{selectedApp.farm_extent}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Building size={18} />
                            Estates Verification Task
                        </h4>
                        <p className="text-sm text-blue-800">
                            Ensure all form details are correctly entered. Verify contact information, farm details, and document submissions are complete and accurate.
                        </p>
                    </div>

                    {!showCorrection ? (
                        <>
                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Verification Notes (Optional)</label>
                                <textarea
                                    className="input w-full h-24"
                                    placeholder="Add any notes about this verification..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold"
                                    onClick={handleVerify}
                                    disabled={processing}
                                >
                                    <Check size={20} className="inline mr-2" />
                                    {processing ? 'Processing...' : 'Verify Form - Details Correct'}
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex-1 py-3 font-bold"
                                    onClick={() => setShowCorrection(true)}
                                    disabled={processing}
                                >
                                    <X size={20} className="inline mr-2" />
                                    Request Corrections
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Correction Instructions (Required)</label>
                                <textarea
                                    className="input w-full h-32"
                                    placeholder="Describe what needs to be corrected..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                                    onClick={() => setShowCorrection(false)}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex-1 py-3 font-bold"
                                    onClick={handleRequestCorrection}
                                    disabled={!notes.trim() || processing}
                                >
                                    {processing ? 'Processing...' : 'Send Correction Request'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default EstatesInterface
