import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../services/api'
import { UserPlus, Loader2, AlertCircle, Phone, CreditCard, Mail, Lock, User } from 'lucide-react'

const Signup = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError('')
        setFieldErrors({})
        try {
            await api.post('/register/', data)
            alert("Registration successful! Please login.")
            navigate('/login')
        } catch (err) {
            console.error(err)
            const backendError = err.response?.data
            if (backendError && typeof backendError === 'object') {
                // Collect field-level errors from the backend response
                const newFieldErrors = {}
                let hasFieldError = false

                for (const [field, messages] of Object.entries(backendError)) {
                    const msg = Array.isArray(messages) ? messages[0] : messages
                    if (['first_name', 'surname', 'national_id', 'email', 'password'].includes(field)) {
                        newFieldErrors[field] = msg
                        hasFieldError = true
                    }
                }

                if (hasFieldError) {
                    setFieldErrors(newFieldErrors)
                    // Find the first error message to display at the top
                    const firstErrorField = Object.keys(newFieldErrors)[0]
                    const firstErrorMessage = newFieldErrors[firstErrorField]
                    
                    if (firstErrorMessage.includes('match')) {
                        setError('Registration rejected — the details you entered do not match Registrar General records. Please check the highlighted fields below.')
                    } else {
                        setError(`Registration failed: ${firstErrorMessage}`)
                    }
                } else if (backendError.error) {
                    setError(backendError.error)
                } else if (backendError.non_field_errors) {
                    const nfe = backendError.non_field_errors
                    setError(Array.isArray(nfe) ? nfe[0] : nfe)
                } else {
                    setError('Registration failed. Please check your details and try again.')
                }
            } else {
                setError('Registration failed. Please check your details and try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="card p-6">
                <div className="text-center mb-8">
                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="text-emerald-700" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Farmer Signup</h2>
                    <p className="text-gray-600 mt-2">Create your digital land profile</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <div className="alert-icon">
                            <AlertCircle size={20} />
                        </div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* National ID */}
                    <div>
                        <label className="block text-sm font-medium mb-1">National ID</label>
                        <input
                            className={`input ${errors.national_id || fieldErrors.national_id ? 'border-red-600' : ''}`}
                            {...register('national_id', { 
                                required: 'National ID is required',
                                pattern: {
                                    value: /^\d{2}-?\d{6,9}[A-Z]-?\d{2}$|^\d{8,12}[A-Z]\d{2}$/i,
                                    message: 'Invalid format (e.g., 32188288T50)'
                                }
                            })}
                            placeholder="XX-XXXXXXX-X-XX"
                        />
                        {errors.national_id && (
                            <p className="field-error">
                                <AlertCircle size={14} />
                                {errors.national_id.message}
                            </p>
                        )}

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input
                                className={`input ${fieldErrors.first_name ? 'border-red-600' : ''}`}
                                {...register('first_name', { required: 'Required' })}
                                placeholder="First Name"
                            />

                        </div>

                        {/* Surname */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Surname</label>
                            <input
                                className={`input ${fieldErrors.surname ? 'border-red-600' : ''}`}
                                {...register('surname', { required: 'Required' })}
                                placeholder="Surname"
                            />

                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone Number</label>
                            <input
                                className="input"
                                {...register('phone_number', { required: 'Required' })}
                                placeholder="+263..."
                            />
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                className={`input ${fieldErrors.email ? 'border-red-600' : ''}`}
                                type="email"
                                {...register('email', { required: 'Required' })}
                                placeholder="your@email.com"
                            />

                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            className={`input ${errors.password ? 'border-red-600' : ''}`}
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Min 8 characters' }
                            })}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="field-error">
                                <AlertCircle size={14} />
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            className={`input ${errors.confirm_password ? 'border-red-600' : ''}`}
                            type="password"
                            {...register('confirm_password', {
                                required: 'Please confirm password',
                                validate: (val) => {
                                    if (watch('password') !== val) {
                                        return "Passwords do not match";
                                    }
                                }
                            })}
                            placeholder="••••••••"
                        />
                        {errors.confirm_password && (
                            <p className="field-error">
                                <AlertCircle size={14} />
                                {errors.confirm_password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full mt-6 py-3 text-base flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t text-center">
                    <p className="text-gray-600 text-sm">
                        Already have an account? {' '}
                        <Link to="/login" className="text-amber-600 font-bold hover:underline hover:text-amber-700">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Signup
