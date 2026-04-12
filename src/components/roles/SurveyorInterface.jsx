import React, { useState } from 'react'
import { X, Check, MapPin, DollarSign } from 'lucide-react'
import axios from 'axios'

const SurveyorInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [viewMode, setViewMode] = useState('main') // 'main', 'confirm', 'request'
    const [officialFarmName, setOfficialFarmName] = useState(selectedApp.farm_name || '')
    const [officialHectarage, setOfficialHectarage] = useState(selectedApp.farm_extent || '')
    const [surveyFeePaid, setSurveyFeePaid] = useState(false)
    const [surveyFeeAmount, setSurveyFeeAmount] = useState('')
    const [processing, setProcessing] = useState(false)

    const handleConfirmSurvey = async () => {
        if (!officialFarmName.trim() || !officialHectarage) {
            onError('Please provide official farm name and hectarage')
            return
        }

        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/confirm_survey_completed/`, {
                official_farm_name: officialFarmName,
                official_hectarage: parseFloat(officialHectarage),
                survey_fee_paid: surveyFeePaid
            })
            onSuccess('Survey confirmed successfully')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to confirm survey')
        } finally {
            setProcessing(false)
        }
    }

    const handleRequestSurvey = async () => {
        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/request_survey/`, {
                survey_fee_amount: surveyFeeAmount ? parseFloat(surveyFeeAmount) : null
            })
            onSuccess('Survey requested - Farmer will be notified')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to request survey')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">Surveyor General - Survey Verification</h3>
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
                            <p className="text-xs text-gray-500 uppercase font-bold">Current Farm Name</p>
                            <p className="font-semibold">{selectedApp.farm_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Current Extent (Ha)</p>
                            <p className="font-semibold">{selectedApp.farm_extent}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">District</p>
                            <p className="font-semibold">{selectedApp.district}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <MapPin size={18} />
                            Surveyor General Task
                        </h4>
                        <p className="text-sm text-blue-800">
                            Check if the farm has been surveyed. If surveyed, provide the official farm name and exact hectarage.
                            The values you enter will be used for valuation and on the title deed.
                        </p>
                    </div>

                    {viewMode === 'main' && (
                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold"
                                onClick={() => setViewMode('confirm')}
                            >
                                <Check size={20} className="inline mr-2" />
                                Farm Is Surveyed
                            </button>
                            <button
                                className="btn bg-orange-600 text-white hover:bg-orange-700 flex-1 py-3 font-bold"
                                onClick={() => setViewMode('request')}
                            >
                                <X size={20} className="inline mr-2" />
                                Request Survey
                            </button>
                        </div>
                    )}

                    {viewMode === 'confirm' && (
                        <>
                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Official Farm Name (From Survey)</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={officialFarmName}
                                    onChange={(e) => setOfficialFarmName(e.target.value)}
                                    placeholder="Enter official surveyed farm name"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Official Hectarage (From Survey)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    className="input w-full"
                                    value={officialHectarage}
                                    onChange={(e) => setOfficialHectarage(e.target.value)}
                                    placeholder="Enter exact hectarage from survey"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="survey_fee_paid"
                                    checked={surveyFeePaid}
                                    onChange={(e) => setSurveyFeePaid(e.target.checked)}
                                    className="w-5 h-5"
                                />
                                <label htmlFor="survey_fee_paid" className="font-semibold cursor-pointer">
                                    Survey fee has been paid
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                                    onClick={() => setViewMode('main')}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn bg-green-600 text-white hover:bg-green-700 flex-1 py-3 font-bold"
                                    onClick={handleConfirmSurvey}
                                    disabled={!officialFarmName.trim() || !officialHectarage || processing}
                                >
                                    {processing ? 'Processing...' : 'Confirm Survey Completed'}
                                </button>
                            </div>
                        </>
                    )}

                    {viewMode === 'request' && (
                        <>
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <h4 className="font-bold text-yellow-900">Request Survey</h4>
                                <p className="text-sm text-yellow-800">
                                    The farmer will be notified to apply for a survey. They can track the application once surveyed.
                                </p>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-2">Survey Fee Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input w-full"
                                    value={surveyFeeAmount}
                                    onChange={(e) => setSurveyFeeAmount(e.target.value)}
                                    placeholder="Enter survey fee amount if known"
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1 py-3 font-bold"
                                    onClick={() => setViewMode('main')}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn bg-orange-600 text-white hover:bg-orange-700 flex-1 py-3 font-bold"
                                    onClick={handleRequestSurvey}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Send Survey Request'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SurveyorInterface
