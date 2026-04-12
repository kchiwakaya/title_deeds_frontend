import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { AlertCircle, Lock, User as UserIcon, Loader2, ArrowLeft, CreditCard } from 'lucide-react'

const Login = ({ setUser }) => {
    const navigate = useNavigate()
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e) => {
        if (e) e.preventDefault()
        setIsLoading(true)
        setError('')
        try {
            const response = await api.post('/login/', credentials)
            const userData = response.data
            setUser(userData)
            // Save to localStorage for session persistence
            localStorage.setItem('user', JSON.stringify(userData))
            navigate('/dashboard')
        } catch (err) {
            console.error('Login error:', err)
            if (err.response?.status === 429) {
                const retryAfter = err.response.headers['retry-after']
                const waitText = retryAfter ? `Please wait ${retryAfter} seconds` : 'Please wait a moment'
                setError(`Too many login attempts. ${waitText} and try again.`)
            } else {
                setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-16 px-4">
            <div className="card p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-500 mt-1 text-sm">Sign in to access your portal</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-icon">
                            <AlertCircle size={18} />
                        </div>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">National ID / Username</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className="input pl-10"
                                type="text"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                placeholder="ID Number or Username"
                                required
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">Farmers: Use your National ID</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className="input pl-10"
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div className="flex justify-end mt-1">
                            <Link to="/forgot-password" size="sm" className="text-xs text-amber-600 hover:text-amber-700 font-bold">
                                Forgot Password?
                            </Link>
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
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t text-center space-y-3">
                    <p className="text-gray-600 text-sm">
                        Don't have an account? {' '}
                        <Link to="/signup" className="text-amber-600 font-semibold hover:underline hover:text-amber-700">
                            Register here
                        </Link>
                    </p>
                    <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login
