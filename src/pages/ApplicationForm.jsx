import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Upload, Landmark, User, MapPin, FileCheck, Users, AlertCircle } from 'lucide-react'
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb'
import { locationMapping, provinces } from '../data/locationMapping'
import applicationService from '../services/applicationService'

const ApplicationForm = ({ user }) => {
    const [step, setStep] = useState(1)
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const editId = searchParams.get('id')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [spouses, setSpouses] = useState([{ surname: '', first_name: '', national_id: '' }])
    const [error, setError] = useState('')
    const [fetching, setFetching] = useState(false)
    const [appStatus, setAppStatus] = useState(null) // tracks status of the app being edited
    const [existingApp, setExistingApp] = useState(null) // raw API data for existing-file hints
    const [isVerified, setIsVerified] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [isLandVerified, setIsLandVerified] = useState(false)
    const [verifyingProperty, setVerifyingProperty] = useState(false)
    const [isSurveyed, setIsSurveyed] = useState(true) // Default to true until checked
    const [priceData, setPriceData] = useState(null)
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)
    const [pipelineResult, setPipelineResult] = useState(null) // 4-step verification result
    const [surveyDiagramLink, setSurveyDiagramLink] = useState(null)

    // Derived workflow flags from pipeline result
    // true  → RG passed but NOT in Lands DB → farmer enters farm details manually + must upload tenure doc
    // false → found in Lands DB (and optionally SG) → fields pre-filled, tenure upload skipped
    const farmsDbVerified = pipelineResult?.lands_db?.status === 'found'
    const isManualFarmEntry = isVerified && !farmsDbVerified

    // Auto-populate user data from registration
    useEffect(() => {
        if (user && !editId) {
            reset({
                first_name: user.first_name || '',
                surname: user.surname || '',
                national_id: user.national_id || '',
                email: user.email || ''
            })
        }
    }, [user, editId, reset])

    React.useEffect(() => {
        const init = async () => {
            if (editId) {
                setFetching(true)
                try {
                    const response = await axios.get(`/api/applications/${editId}/`)
                    const app = response.data
                    setAppStatus(app.status) // remember original status
                    setExistingApp(app)       // store for existing-file hints

                    // Prepare spouse fields for react-hook-form
                    const spouseFields = {}
                    const backendSpouses = app.spouses_data || app.spouses;
                    if (backendSpouses && backendSpouses.length > 0) {
                        setSpouses(backendSpouses)
                        backendSpouses.forEach((s, i) => {
                            spouseFields[`spouse_${i}_surname`] = s.surname || ''
                            spouseFields[`spouse_${i}_first_name`] = s.first_name || ''
                            spouseFields[`spouse_${i}_national_id`] = s.national_id || ''
                            spouseFields[`spouse_${i}_citizenship`] = s.citizenship || ''
                            spouseFields[`spouse_${i}_is_war_veteran`] = s.is_war_veteran || false
                            spouseFields[`spouse_${i}_is_civil_servant`] = s.is_civil_servant || false
                            spouseFields[`spouse_${i}_civil_service_years`] = s.civil_service_years || ''
                        })
                    }

                    setIsLandVerified(true);
                    setIsSurveyed(app.is_surveyed);
                    setSurveyDiagramLink(app.survey_diagram_link);

                    reset({
                        // --- Personal ---
                        title:              app.farmer_title || '',
                        sex:                app.farmer_sex || '',
                        surname:            app.farmer_surname || '',
                        first_name:         app.farmer_name || '',
                        other_names:        app.farmer_other_names || '',
                        date_of_birth:      app.date_of_birth || '',
                        marital_status:     app.farmer_marital_status || '',
                        national_id:        app.national_id || '',
                        citizenship:        app.farmer_citizenship || '',
                        telephone:          app.telephone || '',
                        contact_address:    app.farmer_contact_address || '',

                        // --- Farmer categories ---
                        is_war_veteran:          app.farmer_is_war_veteran || false,
                        war_vet_number:          app.farmer_war_vet_number || '',
                        is_uniformed_forces:     app.farmer_is_uniformed_forces || false,
                        force_number:            app.farmer_force_number || '',
                        years_of_service:        app.farmer_years_of_service ?? null,
                        is_business_person:      app.farmer_is_business_person || false,
                        is_youth:                app.farmer_is_youth || false,
                        is_civil_servant:        app.farmer_is_civil_servant || false,
                        ec_number:               app.farmer_ec_number || '',
                        civil_service_years:     app.farmer_civil_service_years ?? null,
                        is_mp_senator:           app.farmer_is_mp_senator || false,
                        is_disabled:             app.farmer_is_disabled || false,
                        is_zepdra:               app.farmer_is_zepdra || false,
                        is_councilor:            app.farmer_is_councilor || false,
                        is_traditional_chief:    app.farmer_is_traditional_chief || false,
                        is_ordinary:             app.farmer_is_ordinary || false,
                        is_other:                app.farmer_is_other || false,
                        other_category_specify:  app.farmer_other_category_specify || '',

                        // --- Farm ---
                        farm_name:              app.farm_name || '',
                        province:               app.province || (Object.keys(locationMapping).find(p => locationMapping[p].districts.includes(app.district)) || ''),
                        district:               app.district || '',
                        plot_number:            app.farm_id || '',
                        farm_extent:            app.farm_extent || '',
                        arable_area:            app.arable_area || '',
                        tenure_document_type:   app.tenure_document_type || '',
                        nearest_town:           app.nearest_town || '',
                        distance_to_town:       app.distance_to_town || '',
                        water_source_type:      Array.isArray(app.water_source_type) ? app.water_source_type[0] : (app.water_source_type || ''),
                        water_source_distance:  app.water_source_distance || '',
                        improvements_description: app.improvements_description || '',

                        ...spouseFields,
                    })
                } catch (err) {
                    console.error('Error fetching application:', err)
                    setError('Failed to load application data. It may have been deleted.')
                } finally {
                    setFetching(false)
                }
            } else {
                const checkExistingApplication = async () => {
                    try {
                        const response = await axios.get('/api/applications/')
                        if (response.data.length > 0) {
                            navigate('/dashboard', { state: { error: 'You already have an active application.' } })
                        }
                    } catch (err) {
                        console.error('Error checking application status:', err)
                    }
                }
                checkExistingApplication()
            }
        }
        init()
    }, [editId, navigate, reset])

    const validateFileFormat = (value) => {
        if (!value || value.length === 0) return true;
        const file = value[0];
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return 'Invalid file format. Only PDF, JPG, and PNG are allowed.';
        }
        return true;
    };

    // Automatically trigger identity verification on load for new applications
    useEffect(() => {
        if (!editId && !isVerified && !verifying && !fetching) {
            handleVerifyID();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, isVerified, fetching]);

    const handleVerifyID = async () => {
        setVerifying(true);
        setError('');
        setPipelineResult(null);
        try {
            // Trigger the full 3-step verification pipeline in backend
            const verifyRes = await axios.post('/api/users/profile/verify/');
            const pipeline = verifyRes.data?.pipeline || {};
            setPipelineResult(pipeline);

            // Fetch updated profile data (bio-data from RG)
            const profileRes = await axios.get('/api/users/profile/update/');
            const data = profileRes.data;

            // Base form values from profile
            const updatedValues = {
                ...watch(),
                date_of_birth: data.date_of_birth,
                sex: data.gender,
                marital_status: data.marital_status,
                title: data.title,
                contact_address: data.residential_address,
                is_war_veteran: data.is_war_veteran,
                war_vet_number: data.war_vet_number,
            };

            // Auto-prefill farm fields from Lands DB record (if found)
            const landsRecord = pipeline?.lands_db?.record;
            if (landsRecord) {
                if (landsRecord.farm_name)    updatedValues.farm_name   = landsRecord.farm_name;
                if (landsRecord.district)     updatedValues.district    = landsRecord.district;
                if (landsRecord.province)     updatedValues.province    = landsRecord.province;
                if (landsRecord.farm_id)      updatedValues.plot_number = String(landsRecord.farm_id);
                if (landsRecord.extent_ha)    updatedValues.farm_extent = String(landsRecord.extent_ha);
                if (landsRecord.tenure_type)  updatedValues.tenure_document_type = landsRecord.tenure_type;
            }

            // Mark land as verified / surveyed from SG result
            const sgResult = pipeline?.surveyor_general;
            if (sgResult && sgResult.status === 'found') {
                setIsLandVerified(true);
                setIsSurveyed(sgResult.is_surveyed);
                setSurveyDiagramLink(sgResult.diagram_url);
            }

            reset(updatedValues);
            setIsVerified(true);
        } catch (err) {
            console.error('Verification error:', err);
            // Store partial pipeline result from error response so UI can show step failures
            const respData = err.response?.data;
            if (respData?.pipeline) {
                setPipelineResult(respData.pipeline);
            }
            let errorMsg = 'Verification failed. Please refer to the Registrar General office.';
            if (respData) {
                if (typeof respData === 'string') {
                    errorMsg = respData;
                } else if (respData.error) {
                    errorMsg = respData.error;
                } else if (respData.detail) {
                    errorMsg = respData.detail;
                } else if (respData.message) {
                    errorMsg = respData.message;
                } else {
                    const vals = Object.values(respData);
                    if (vals.length > 0) {
                        const first = vals[0];
                        if (Array.isArray(first)) errorMsg = first.join(' ');
                        else if (typeof first === 'string') errorMsg = first;
                        else errorMsg = JSON.stringify(respData);
                    }
                }
            }
            setError(errorMsg);
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyProperty = async () => {
        setVerifyingProperty(true);
        setError('');
        try {
            const data = await applicationService.lookupProperty();
            
            reset({
                ...watch(),
                property_description: data.property_description,
                farm_name: data.property_description, 
                farm_extent: data.size_hectares,
                district: data.district
            });
            
            setIsLandVerified(true);
            setIsSurveyed(data.is_surveyed);
        } catch (err) {
            console.error('Property lookup error:', err);
            setError(err.response?.data?.error || 'No property record found for your National ID.');
        } finally {
            setVerifyingProperty(false);
        }
    };

    const handleCalculatePricing = async () => {
        setIsCalculatingPrice(true);
        try {
            const formData = watch();
            const params = {
                farm_extent: formData.farm_extent,
                arable_area: formData.arable_area,
                is_war_veteran: formData.is_war_veteran,
                is_cash_payment: formData.payment_method !== 'Mortgage'
            };
            const data = await applicationService.calculatePricing(params);
            setPriceData(data);
        } catch (err) {
            console.error('Pricing calculation error:', err);
        } finally {
            setIsCalculatingPrice(false);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()

            // 1. Process Spouses - convert flat spouse fields back into an array
            const spousesArray = spouses.map((_, index) => ({
                surname: data[`spouse_${index}_surname`],
                first_name: data[`spouse_${index}_first_name`],
                national_id: data[`spouse_${index}_national_id`],
                is_war_veteran: data[`spouse_${index}_is_war_veteran`],
                is_civil_servant: data[`spouse_${index}_is_civil_servant`],
                civil_service_years: data[`spouse_${index}_civil_service_years`] === "" ? null : data[`spouse_${index}_civil_service_years`],
            })).filter(s => s.surname || s.first_name || s.national_id);

            // 2. Append all other fields to FormData
            Object.keys(data).forEach(key => {
                // Skip the temporary flat text spouse fields (they go in spousesArray)
                // BUT include spouse files
                const isSpouseFile = key.startsWith('spouse_') && data[key] && data[key][0] instanceof File;
                if (key.startsWith('spouse_') && !isSpouseFile) return;

                if (data[key] && data[key][0] instanceof File) {
                    formData.append(key, data[key][0])
                } else if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key])
                }
            })

            // 3. Append spouses as JSON string (serializer is updated to handle this)
            formData.append('spouses', JSON.stringify(spousesArray));

            // 4. Send to API (POST for new, PATCH for update)
            if (editId) {
                await axios.patch(`/api/applications/${editId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                // Only trigger resubmit status change if app was QUERIED (not for PENDING edits)
                if (appStatus === 'QUERIED') {
                    await axios.post(`/api/applications/${editId}/resubmit_application/`)
                }
            } else {
                await axios.post('/api/applications/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            setError("");
            navigate('/dashboard')
        } catch (err) {
            console.error('Submission error:', err.response?.data || err.message)

            // 403 — farmer tried to edit a locked application (e.g. already in processing)
            if (err.response?.status === 403) {
                const reason = err.response?.data?.error || 'You are not allowed to edit this application at its current stage.'
                navigate('/dashboard', { state: { error: reason } })
                return
            }

            let errorMsg = "Failed to submit application. Please check your network and try again.";
            if (err.response?.data) {
                if (typeof err.response.data === 'string' && err.response.data.includes('<!DOCTYPE html>')) {
                    errorMsg = "A server error occurred (500). Please check the backend terminal for the exact 'DataError' traceback.";
                } else if (typeof err.response.data === 'object' && !Array.isArray(err.response.data)) {
                    // Prefer a top-level `error` field if present, otherwise join all fields
                    errorMsg = err.response.data.error
                        || Object.entries(err.response.data).map(([k, v]) => {
                            const val = (typeof v === 'object') ? JSON.stringify(v) : v;
                            return `${k}: ${val}`;
                        }).join(', ');
                } else if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                }
            }
            setError(errorMsg)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false)
        }
    }

    const nextStep = () => {
        if (step < 4) setStep(step + 1)
    }
    const prevStep = () => setStep(s => s - 1)

    const addSpouse = () => {
        setSpouses([...spouses, { surname: '', first_name: '', national_id: '' }])
    }

    const removeSpouse = (index) => {
        setSpouses(spouses.filter((_, i) => i !== index))
    }

    const steps = [
        { title: 'Personal', icon: <User size={18} /> },
        { title: 'Farm', icon: <MapPin size={18} /> },
        { title: 'Spouse', icon: <Users size={18} /> },
        { title: 'Documents', icon: <Upload size={18} /> }
    ]

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Breadcrumb items={[
                { label: 'Home', link: '/' },
                { label: 'Dashboard', link: '/dashboard' },
                { label: editId ? 'Edit Application' : 'New Application' }
            ]} />

            {fetching ? (
                <div className="card p-20 text-center">
                    <div className="text-emerald-600 font-bold animate-pulse">Loading application data...</div>
                </div>
            ) : (
                <>
                    {/* Progress Stepper */}
                    <div className="flex justify-between items-center mb-12 relative px-4">
                        {steps.map((s, i) => (
                            <div key={i} className={`flex flex-col items-center z-10 ${step > i ? 'text-emerald-600' : 'text-gray-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${step === i + 1 ? 'border-emerald-600 bg-emerald-50 text-emerald-600 scale-110' : (step > i + 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200')}`}>
                                    {step > i + 1 ? <FileCheck size={20} /> : s.icon}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">{s.title}</span>
                            </div>
                        ))}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
                        <div className="absolute top-5 left-0 h-0.5 bg-emerald-600 -z-0 transition-all" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}></div>
                    </div>

                    <div className="card p-10">
                        {error && (
                            <div className="alert alert-error">
                                <div className="alert-icon">
                                    <AlertCircle size={20} />
                                </div>
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="space-y-8 bg-white p-8 rounded-xl shadow-sm border mt-6">
                            {/* Step 1: Personal Details */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-bold">Personal Profile</h3>
                                        {verifying ? (
                                            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-200 animate-pulse">
                                                <FileCheck size={16} className="animate-spin" /> Verifying with Registrar General...
                                            </div>
                                        ) : isVerified ? (
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                                    <FileCheck size={16} /> Identity Verified
                                                </div>
                                                {pipelineResult?.war_veterans?.farmer?.is_veteran && (
                                                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                                        🪖 War Veteran Status Confirmed
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* === End Pipeline Panel === */}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Title *</label>
                                            <select {...register('title', { required: true })} className="input">
                                                <option value="">Select...</option>
                                                <option value="Mr">Mr</option>
                                                <option value="Mrs">Mrs</option>
                                                <option value="Miss">Miss</option>
                                                <option value="Ms">Ms</option>
                                                <option value="Dr">Dr</option>
                                                <option value="Engineer">Engineer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Gender *</label>
                                            <select 
                                                {...register('sex', { required: true })} 
                                                className={`input ${isVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                disabled={isVerified}
                                            >
                                                <option value="">Select...</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Surname *</label>
                                            <input {...register('surname', { required: 'Surname is required' })} readOnly className="input bg-gray-100 cursor-not-allowed" placeholder="Enter Surname" />
                                            <p className="text-xs text-gray-500 mt-1">{isVerified ? 'Verified from Registrar General' : 'Auto-filled from your registration'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">First Name *</label>
                                            <input {...register('first_name', { required: 'First name is required' })} readOnly className="input bg-gray-100 cursor-not-allowed" placeholder="Enter First Name" />
                                            <p className="text-xs text-gray-500 mt-1">{isVerified ? 'Verified from Registrar General' : 'Auto-filled from your registration'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Other Names</label>
                                            <input {...register('other_names')} className="input" placeholder="Middle names" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                                            <input
                                                type="date"
                                                {...register('date_of_birth', {
                                                    required: 'Date of birth is required',
                                                    validate: {
                                                        minimumAge: (value) => {
                                                            if (!value) return true;
                                                            const birthDate = new Date(value);
                                                            const today = new Date();
                                                            let age = today.getFullYear() - birthDate.getFullYear();
                                                            const monthDiff = today.getMonth() - birthDate.getMonth();
                                                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                                                age--;
                                                            }
                                                            return age >= 18 || 'You must be at least 18 years old to apply';
                                                        }
                                                    }
                                                })}
                                                readOnly={isVerified}
                                                className={`input ${isVerified ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.date_of_birth ? 'border-red-600' : ''}`}
                                            />
                                            {errors.date_of_birth && (
                                                <p className="field-error">
                                                    <AlertCircle size={14} />
                                                    {errors.date_of_birth.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Marital Status *</label>
                                            <select {...register('marital_status', { required: true })} className="input">
                                                <option value="">Select...</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Divorced">Divorced</option>
                                                <option value="Widowed">Widowed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">National ID *</label>
                                            <div className="relative">
                                                <input {...register('national_id', { required: 'National ID is required' })} readOnly={isVerified} className={`input ${isVerified ? 'bg-gray-100 cursor-not-allowed pr-10' : ''} ${errors.national_id ? 'border-red-600' : ''}`} placeholder="e.g. 63-123456-A-63" />
                                                {isVerified && <FileCheck className="absolute right-3 top-3 text-emerald-600" size={18} />}
                                            </div>
                                            {errors.national_id && (
                                                <p className="field-error">
                                                    <AlertCircle size={14} />
                                                    {errors.national_id.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Number *</label>
                                            <input
                                                {...register('telephone', {
                                                    required: 'Contact number is required',
                                                    pattern: {
                                                        value: /^\+\d{10,15}$/,
                                                        message: 'Phone must include country code (e.g., +263771234567)'
                                                    }
                                                })}
                                                className={`input ${errors.telephone ? 'border-red-600' : ''}`}
                                                placeholder="+263771234567"
                                                onBlur={(e) => {
                                                    const val = e.target.value.trim();
                                                    if (val && !val.startsWith('+')) {
                                                        e.target.value = '+263' + val.replace(/^0+/, '');
                                                    }
                                                }}
                                            />
                                            {errors.telephone && (
                                                <p className="field-error">
                                                    <AlertCircle size={14} />
                                                    {errors.telephone.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +263 for Zimbabwe)</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1">Contact Address *</label>
                                            <textarea {...register('contact_address', { required: true })} className="input min-h-[80px]" placeholder="Full residential address" />
                                        </div>
                                    </div>

                                    {/* Farmer Categories */}
                                    <h4 className="text-lg font-bold mt-8 mb-4 border-t pt-6">Farmer Category (tick all that apply)</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                {...register('is_war_veteran')} 
                                                className="w-4 h-4" 
                                            />
                                            <span className="text-sm font-medium">War Veteran</span>
                                        </label>
                                        {watch('is_war_veteran') && (
                                            <div className="col-span-2 ml-8 -mt-2 mb-2">
                                                <label className="block text-sm font-medium mb-1">War Veteran Number *</label>
                                                <input 
                                                    {...register('war_vet_number')} 
                                                    className="input w-64" 
                                                    placeholder="Enter War Vet No." 
                                                />
                                            </div>
                                        )}

                                        <label className={`flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer`}>
                                            <input type="checkbox" {...register('is_uniformed_forces')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Uniformed Forces</span>
                                        </label>
                                        {watch('is_uniformed_forces') && (
                                            <div className="col-span-2 ml-8 -mt-2 mb-2">
                                                <label className="block text-sm font-medium mb-1">Force Number *</label>
                                                <input {...register('force_number')} className={`input w-64`} placeholder="Enter Force No." />
                                                <label className="block text-sm font-medium mb-1 mt-2">Years of Service *</label>
                                                <input type="number" {...register('years_of_service')} className={`input w-64`} placeholder="e.g. 15" min="0" />
                                            </div>
                                        )}

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_business_person')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Business Person</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_youth')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Youth (35 years and below)</span>
                                        </label>

                                        <label className={`flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer`}>
                                            <input type="checkbox" {...register('is_civil_servant')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Civil Servant</span>
                                        </label>
                                        {watch('is_civil_servant') && (
                                            <div className="col-span-2 ml-8 -mt-2 mb-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">EC Number *</label>
                                                    <input {...register('ec_number')} className={`input`} placeholder="Enter EC No." />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Years in Service *</label>
                                                    <input type="number" {...register('civil_service_years')} className={`input`} placeholder="e.g. 15" />
                                                </div>
                                            </div>
                                        )}

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_mp_senator')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">MP/Senator</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_disabled')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Disability</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_zepdra')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">ZEPDRA</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_councilor')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Councilor</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_traditional_chief')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Traditional Chief</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_ordinary')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Ordinary</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" {...register('is_other')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Other (specify)</span>
                                        </label>
                                        {watch('is_other') && (
                                            <div className="col-span-2 ml-8 -mt-2 mb-2">
                                                <label className="block text-sm font-medium mb-1">Specify Category *</label>
                                                <input {...register('other_category_specify')} className="input w-64" placeholder="Please specify" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Farm Details */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold mb-6">Farm Details</h3>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(step / 5) * 100}%` }}></div>
                                    </div>
                                    {/* Workflow Banner */}
                                    {isVerified && farmsDbVerified && (
                                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                                            <FileCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                                            <span>
                                                <strong>Farm record found.</strong> Your farm details have been pre-filled from the Lands Database and Surveyor General records. Fields are locked — please contact the Lands Office if any details are incorrect.
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="md:col-span-2">

                                            
                                            {!isSurveyed && isLandVerified && (
                                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                                                    <p className="font-bold flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                        Property Not Surveyed
                                                    </p>
                                                    <p>Our records indicate this property has not been surveyed. Your application will be paused after submission. Please visit the Department of Surveyor General (DSG) to make survey payments to avoid delays.</p>
                                                </div>
                                            )}

                                            <label className="block text-sm font-medium mb-1">Farm Name / Property Description *</label>
                                            <input
                                                {...register('farm_name', { required: 'Farm name is required' })}
                                                readOnly={farmsDbVerified}
                                                className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.farm_name ? 'border-red-600' : ''}`}
                                                placeholder="e.g. Subdivision A of Farm B"
                                            />
                                            {farmsDbVerified && (
                                                <p className="text-xs text-emerald-600 mt-1">✓ Confirmed from Lands Database</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Province *</label>
                                            <select
                                                {...register('province', { required: true })}
                                                disabled={farmsDbVerified}
                                                className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">Select Province...</option>
                                                {provinces.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">District *</label>
                                            <select
                                                {...register('district', { required: true })}
                                                disabled={!watch('province') || farmsDbVerified}
                                                className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">Select District...</option>
                                                {watch('province') && locationMapping[watch('province')].districts.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Plot Number</label>
                                            <input
                                                {...register('plot_number')}
                                                readOnly={farmsDbVerified}
                                                className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Enter plot number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Total Extent (Hectares) *</label>
                                            <input
                                                type="number" step="0.01"
                                                {...register('farm_extent', { required: 'Farm extent is required' })}
                                                readOnly={farmsDbVerified}
                                                className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.farm_extent ? 'border-red-600' : ''}`}
                                                placeholder="Total farm size"
                                            />
                                            {errors.farm_extent && (
                                                <p className="field-error">
                                                    <AlertCircle size={14} />
                                                    {errors.farm_extent.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Arable Area (Hectares)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('arable_area', {
                                                    validate: (value) => {
                                                        const farmExtent = watch('farm_extent');
                                                        if (value && farmExtent && parseFloat(value) > parseFloat(farmExtent)) {
                                                            return 'Arable area cannot be greater than the total farm extent.';
                                                        }
                                                        return true;
                                                    }
                                                })}
                                                className={`input ${errors.arable_area ? 'border-red-600' : ''}`}
                                                placeholder="Enter arable area suitable for crops"
                                            />
                                            {errors.arable_area && (
                                                <p className="field-error">
                                                    <AlertCircle size={14} />
                                                    {errors.arable_area.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Current Tenure Document Type *</label>
                                            <div className="flex gap-2">
                                                <select
                                                    {...register('tenure_document_type', { required: true })}
                                                    disabled={farmsDbVerified}
                                                    className={`input ${farmsDbVerified ? 'bg-gray-100 cursor-not-allowed' : ''} flex-1`}
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="A1 Permit">A1 Permit</option>
                                                    <option value="A2 Permit">A2 Permit</option>
                                                    <option value="Offer Letter">Offer Letter</option>
                                                    <option value="99 Year Lease">99 Year Lease</option>
                                                </select>
                                                {surveyDiagramLink && (
                                                    <a 
                                                        href={surveyDiagramLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all font-medium flex items-center gap-2 whitespace-nowrap"
                                                        title="View Official Survey Diagram"
                                                    >
                                                        <MapPin size={16} />
                                                        View Diagram
                                                    </a>
                                                )}
                                            </div>
                                            {farmsDbVerified && (
                                                <p className="text-xs text-emerald-600 mt-1">✓ Confirmed from Lands Database</p>
                                            )}
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-bold mt-8 mb-4 border-t pt-6">Location Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Nearest Town/City</label>
                                            <select {...register('nearest_town')} className="input" disabled={!watch('province')}>
                                                <option value="">Select Town...</option>
                                                {watch('province') && locationMapping[watch('province')].nearestTowns?.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                                <option value="Other">Other (Specify in Description)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Distance to Town (km)</label>
                                            <input type="number" step="0.1" {...register('distance_to_town')} className="input" placeholder="e.g. 25" />
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-bold mt-8 mb-4 border-t pt-6">Water Source</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Water Source Type</label>
                                            <select {...register('water_source_type')} className="input">
                                                <option value="none">No Water Source</option>
                                                <option value="dam">Dam</option>
                                                <option value="river">River</option>
                                                <option value="borehole">Borehole</option>
                                                <option value="well">Well</option>
                                                <option value="canal">Canal/Irrigation</option>
                                                <option value="spring">Natural Spring</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Distance to Water Source</label>
                                            <select {...register('water_source_distance')} className="input">
                                                <option value="">Select...</option>
                                                <option value="on_farm">On Farm</option>
                                                <option value="1_3km">1-3 km</option>
                                                <option value="4_6km">4-6 km</option>
                                                <option value="7km_plus">7+ km</option>
                                            </select>
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-bold mt-8 mb-4 border-t pt-6">Improvements Found on Farm</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description of Improvements</label>
                                            <textarea {...register('improvements_description')} className="input min-h-[100px]" placeholder="Describe any existing structures, infrastructure, or improvements you found on the farm (e.g., farmhouse, barns, fencing, irrigation systems)..." />
                                        </div>

                                    </div>


                                </div>
                            )}

                            {/* Step 3: Spouse Details */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    {watch('marital_status') === 'Single' ? (
                                        <div className="text-center py-12">
                                            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                            <h3 className="text-xl font-bold text-gray-400 mb-2">No Spouse Details Required</h3>
                                            <p className="text-gray-600">Step {step} of 5</p>
                                            <p className="text-gray-500">You indicated your marital status as "Single". You can proceed to the next step.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-2xl font-bold">Spouse Details</h3>
                                                <button type="button" onClick={addSpouse} className="btn bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
                                                    + Add Spouse
                                                </button>
                                            </div>
                                            {spouses.map((spouse, index) => (
                                                <div key={index} className="p-6 border rounded-lg bg-gray-50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold">Spouse {index + 1}</h4>
                                                        {spouses.length > 1 && (
                                                            <button type="button" onClick={() => removeSpouse(index)} className="text-red-600 text-sm font-bold hover:underline">
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Surname</label>
                                                            <input {...register(`spouse_${index}_surname`)} className="input" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">First Name</label>
                                                            <input {...register(`spouse_${index}_first_name`)} className="input" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">National ID</label>
                                                            <input {...register(`spouse_${index}_national_id`)} className="input" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Citizenship</label>
                                                            <select {...register(`spouse_${index}_citizenship`)} className="input">
                                                                <option value="">Select...</option>
                                                                <option value="Zimbabwean">Zimbabwean</option>
                                                                <option value="South African">South African</option>
                                                                <option value="Zambian">Zambian</option>
                                                                <option value="Mozambican">Mozambican</option>
                                                                <option value="Botswanan">Botswanan</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Spouse Beneficiary Eligibility */}
                                                    <div className="mt-4 pt-4 border-t">
                                                        <p className="text-sm font-medium text-gray-700 mb-3">Spouse Eligibility</p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-amber-50 cursor-pointer">
                                                                <input type="checkbox" {...register(`spouse_${index}_is_war_veteran`)} className="w-4 h-4 accent-amber-600" />
                                                                <div>
                                                                    <span className="text-sm font-medium">War Veteran</span>
                                                                </div>
                                                            </label>

                                                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-blue-50 cursor-pointer">
                                                                <input type="checkbox" {...register(`spouse_${index}_is_civil_servant`)} className="w-4 h-4 accent-blue-600" />
                                                                <div>
                                                                    <span className="text-sm font-medium">Civil Servant</span>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        {watch(`spouse_${index}_is_civil_servant`) && (
                                                            <div className="mt-3">
                                                                <label className="block text-sm font-medium mb-1">Spouse Years in Civil Service</label>
                                                                <input type="number" {...register(`spouse_${index}_civil_service_years`)} className="input w-48" placeholder="e.g. 15" />
                                                            </div>
                                                        )}

                                                        {/* Spouse document uploads shown in Step 4 based on selections */}
                                                    </div>

                                                </div>
                                            ))}
                                            <p className="text-sm text-gray-500 italic">Proof documents will be required in the next step.</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Document Upload */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold mb-6">Document Upload</h3>

                                    {/* Edit-mode banner */}
                                    {editId && (
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                            <AlertCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                            <span>
                                                Your previously uploaded documents are saved. You only need to upload a new file if you want to <strong>replace</strong> an existing one. Leave the field blank to keep the current document.
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* National ID */}
                                        <div className="p-6 border-2 border-dashed rounded-lg hover:bg-emerald-50 transition">
                                            <Upload className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                                            <p className="font-medium text-center">
                                                National ID or Passport Copy
                                                {!editId && ' *'}
                                            </p>
                                            <p className="text-xs text-gray-500 text-center mb-2">PDF or Image (Max 5MB)</p>
                                            {editId && existingApp?.national_id_copy && (
                                                <p className="text-xs text-green-700 text-center mb-2">
                                                    ✓ Current file: <span className="font-medium">{existingApp.national_id_copy.split('/').pop()}</span>
                                                </p>
                                            )}
                                            <input
                                                type="file"
                                                {...register('national_id_copy', {
                                                    required: false,
                                                    validate: validateFileFormat
                                                })}
                                                className="w-full text-sm"
                                                accept="image/*,application/pdf"
                                            />
                                            {editId && (
                                                <p className="text-xs text-gray-400 text-center mt-1">Upload a new file to replace the existing one</p>
                                            )}
                                            {errors.national_id_copy && (
                                                <p className="field-error justify-center">
                                                    <AlertCircle size={14} />
                                                    {errors.national_id_copy.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Tenure Document - only required when farm was NOT found in Lands DB */}
                                        {(isManualFarmEntry || editId) ? (
                                            <div className="p-6 border-2 border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition">
                                                <Upload className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                                                <p className="font-medium text-center">
                                                    Tenure Document
                                                    {(isManualFarmEntry && !editId) && <span className="text-red-600"> *</span>}
                                                </p>
                                                <p className="text-xs text-gray-500 text-center mb-1">PDF or Image (Max 10MB)</p>

                                                {editId && existingApp?.tenure_document && (
                                                    <p className="text-xs text-green-700 text-center mb-2">
                                                        ✓ Current file: <span className="font-medium">{existingApp.tenure_document.split('/').pop()}</span>
                                                    </p>
                                                )}
                                                <input
                                                    type="file"
                                                    {...register('tenure_document', {
                                                        required: false,
                                                        validate: validateFileFormat
                                                    })}
                                                    className="w-full text-sm"
                                                    accept="image/*,application/pdf"
                                                />
                                                {editId && (
                                                    <p className="text-xs text-gray-400 text-center mt-1">Upload a new file to replace the existing one</p>
                                                )}
                                                {errors.tenure_document && (
                                                    <p className="field-error justify-center">
                                                        <AlertCircle size={14} />
                                                        {errors.tenure_document.message}
                                                    </p>
                                                )}
                                            </div>
                                        ) : farmsDbVerified ? (
                                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-3">
                                                <FileCheck size={18} className="shrink-0" />
                                                <span>
                                                    <strong>Tenure document not required.</strong> Your farm was successfully verified in the Lands Database and Surveyor General records.
                                                </span>
                                            </div>
                                        ) : null}

                                        {/* Other Attachments */}
                                        <div className="p-6 border-2 border-dashed rounded-lg hover:bg-emerald-50 transition">
                                            <Upload className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                                            <p className="font-medium text-center">Additional Documents (Optional)</p>
                                            <p className="text-xs text-gray-500 text-center mb-2">PDF or Image</p>
                                            {editId && existingApp?.other_attachments && (
                                                <p className="text-xs text-green-700 text-center mb-2">
                                                    ✓ Current file: <span className="font-medium">{existingApp.other_attachments.split('/').pop()}</span>
                                                </p>
                                            )}
                                            <input type="file" {...register('other_attachments', { validate: validateFileFormat })} className="w-full text-sm" accept="image/*,application/pdf" />
                                            {editId && (
                                                <p className="text-xs text-gray-400 text-center mt-1">Upload a new file to replace the existing one</p>
                                            )}
                                            {errors.other_attachments && (
                                                <p className="field-error justify-center">
                                                    <AlertCircle size={14} />
                                                    {errors.other_attachments.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Farmer: War Veteran ID */}
                                        {watch('is_war_veteran') && (
                                            <div className="p-6 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 hover:bg-amber-100 transition">
                                                <Upload className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                                                <p className="font-medium text-center">Your War Veteran ID</p>
                                                <p className="text-xs text-gray-500 text-center mb-2">PDF or Image (Optional)</p>
                                                {editId && existingApp?.war_vet_id_copy && (
                                                    <p className="text-xs text-green-700 text-center mb-2">
                                                        ✓ Current file: <span className="font-medium">{existingApp.war_vet_id_copy.split('/').pop()}</span>
                                                    </p>
                                                )}
                                                <input type="file" {...register('war_vet_id_copy', { validate: validateFileFormat })} className="w-full text-sm" accept="image/*,application/pdf" />
                                                {errors.war_vet_id_copy && (
                                                    <p className="field-error justify-center">
                                                        <AlertCircle size={14} />
                                                        {errors.war_vet_id_copy.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Farmer: Civil Servant Employment Proof */}
                                        {watch('is_civil_servant') && (
                                            <div className="p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                                                <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                                                <p className="font-medium text-center">Your Proof of Employment</p>
                                                <p className="text-xs text-gray-500 text-center mb-2">Employment letter or pay slip (Optional)</p>
                                                {editId && existingApp?.employment_proof && (
                                                    <p className="text-xs text-green-700 text-center mb-2">
                                                        ✓ Current file: <span className="font-medium">{existingApp.employment_proof.split('/').pop()}</span>
                                                    </p>
                                                )}
                                                <input type="file" {...register('employment_proof', { validate: validateFileFormat })} className="w-full text-sm" accept="image/*,application/pdf" />
                                                {errors.employment_proof && (
                                                    <p className="field-error justify-center">
                                                        <AlertCircle size={14} />
                                                        {errors.employment_proof.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Spouse Documents */}
                                        {spouses.map((_, index) => (
                                            <div key={`spouse_docs_${index}`}>
                                                {watch(`spouse_${index}_is_war_veteran`) && (
                                                    <div className="p-6 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 hover:bg-amber-100 transition mb-4">
                                                        <Upload className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                                                        <p className="font-medium text-center">Spouse {index + 1} War Veteran ID</p>
                                                        <p className="text-xs text-gray-500 text-center mb-2">PDF or Image (Optional)</p>
                                                        <input type="file" {...register(`spouse_${index}_war_vet_id_copy`, { validate: validateFileFormat })} className="w-full text-sm" accept="image/*,application/pdf" />
                                                        {errors[`spouse_${index}_war_vet_id_copy`] && (
                                                            <p className="field-error justify-center">
                                                                <AlertCircle size={14} />
                                                                {errors[`spouse_${index}_war_vet_id_copy`].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {watch(`spouse_${index}_is_civil_servant`) && (
                                                    <div className="p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                                                        <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                                                        <p className="font-medium text-center">Spouse {index + 1} Proof of Employment</p>
                                                        <p className="text-xs text-gray-500 text-center mb-2">Employment letter or pay slip (Optional)</p>
                                                        <input type="file" {...register(`spouse_${index}_employment_proof`, { validate: validateFileFormat })} className="w-full text-sm" accept="image/*,application/pdf" />
                                                        {errors[`spouse_${index}_employment_proof`] && (
                                                            <p className="field-error justify-center">
                                                                <AlertCircle size={14} />
                                                                {errors[`spouse_${index}_employment_proof`].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-12 border-t pt-6">
                                <button
                                    type="button"
                                    disabled={step === 1}
                                    onClick={prevStep}
                                    className="btn bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-gray-300 transition"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                                {step < 4 && (
                                    <button
                                        key="next-btn"
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); nextStep(); }}
                                        className="btn btn-primary flex items-center gap-2 hover:shadow-lg transition"
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
                                )}
                                {step === 4 && (
                                    <button
                                        key="submit-btn"
                                        type="button"
                                        onClick={handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                        className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Final Application'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}

export default ApplicationForm
