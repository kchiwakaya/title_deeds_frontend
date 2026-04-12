import React, { useState } from 'react'
import { X, Calculator } from 'lucide-react'
import axios from 'axios'

const ValuationInterface = ({ selectedApp, onClose, onSuccess, onError }) => {
    const [valuationAmount, setValuationAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    const handleSetValuation = async () => {
        if (!valuationAmount || parseFloat(valuationAmount) <= 0) {
            onError('Please enter a valid valuation amount')
            return
        }

        setProcessing(true)
        try {
            await axios.post(`/api/applications/${selectedApp.id}/set_valuation/`, {
                valuation_amount: parseFloat(valuationAmount),
                notes
            })
            onSuccess('Valuation set successfully')
        } catch (err) {
            onError(err.response?.data?.error || 'Failed to set valuation')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold text-emerald-700">Valuation Officer - Set Valuation</h3>
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
                            <p className="font-semibold">{selectedApp.official_farm_name || selectedApp.farm_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Hectarage</p>
                            <p className="font-semibold text-emerald-600">{selectedApp.official_hectarage || selectedApp.farm_extent} Ha</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">District</p>
                            <p className="font-semibold">{selectedApp.district}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Calculator size={18} />
                            Valuation Task
                        </h4>
                        <p className="text-sm text-blue-800">
                            Manually determine the land value based on the location, hectarage, and soil type.
                            Enter the valuation amount that will be used to calculate the final purchase price.
                        </p>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Valuation Amount (USD) *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                            <input
                                type="number"
                                step="0.01"
                                className="input w-full pl-8"
                                value={valuationAmount}
                                onChange={(e) => setValuationAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            This value will be used to calculate the total purchase price
                        </p>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Valuation Notes (Optional)</label>
                        <textarea
                            className="input w-full h-24"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about the valuation methodology or considerations..."
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
                            onClick={handleSetValuation}
                            disabled={!valuationAmount || processing}
                        >
                            {processing ? 'Processing...' : 'Confirm Valuation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ValuationInterface
