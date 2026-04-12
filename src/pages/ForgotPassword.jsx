import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { AlertCircle, User as UserIcon, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

const ForgotPassword = () => {
    const [identifier, setIdentifier] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccessMessage('')
        
        try {
            // Determine if input is email or username (national_id)
            const isEmail = identifier.includes('@')
            const payload = isEmail ? { email: identifier } : { username: identifier }
            
            const response = await api.post('/password-reset/', payload)
            setSuccessMessage(response.data.status)
        } catch (err) {
            console.error('Password reset request error:', err)
            if (err.response?.status === 429) {
                const retryAfter = err.response.headers['retry-after']
                const waitText = retryAfter ? `Please wait ${retryAfter} seconds` : 'Please wait a moment'
                setError(`Too many requests. ${waitText} and try again.`)
            } else {
                setError(err.response?.data?.error || 'An error occurred. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-16">
            <div className="card p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-gray-500 mt-1 text-sm">Enter your username or email address</p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="alert alert-error mb-4">
                        <div className="alert-icon">
                            <AlertCircle size={18} />
                        </div>
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-start gap-3 mb-4 border border-emerald-200">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Form */}
                {!successMessage && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username or Email</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="input pl-10"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter username or email"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full h-11 text-base font-semibold mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t text-center space-y-3">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700">
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
