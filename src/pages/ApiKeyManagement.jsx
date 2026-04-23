import React, { useState, useEffect } from 'react'
import { 
    Key, Plus, Trash2, Copy, CheckCircle, AlertCircle, 
    Shield, Clock, Eye, EyeOff, Search, ChevronLeft,
    ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import Modal from '../components/Modal'
import axios from 'axios'

const ApiKeyManagement = ({ user }) => {
    const navigate = useNavigate()
    const [keys, setKeys] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [generatedKey, setGeneratedKey] = useState(null)
    const [copied, setCopied] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            setLoading(true)
            const response = await axios.get('/api/admin/external-access/keys/')
            setKeys(response.data)
        } catch (err) {
            console.error('Error fetching API keys:', err)
            setError('Failed to load API keys.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const response = await axios.post('/api/admin/external-access/keys/', { name: newKeyName })
            setGeneratedKey(response.data)
            setNewKeyName('')
            fetchKeys()
        } catch (err) {
            console.error('Error creating API key:', err)
            setError(err.response?.data?.error || 'Failed to generate API key.')
        }
    }

    const handleRevokeKey = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone and will immediately disable access for any client using it.')) {
            return
        }

        try {
            await axios.delete(`/api/admin/external-access/keys/${id}/`)
            fetchKeys()
        } catch (err) {
            console.error('Error revoking API key:', err)
            setError('Failed to revoke API key.')
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const filteredKeys = keys.filter(k => 
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.prefix.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin-dashboard')}
                        className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Third-Party API Keys</h1>
                        <p className="text-gray-500 mt-1">Manage external access for partner organizations</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setGeneratedKey(null)
                        setShowCreateModal(true)
                    }}
                    className="btn btn-primary gap-2 shadow-lg"
                >
                    <Plus size={18} /> Generate New Key
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="card border-0 shadow-xl ring-1 ring-gray-100 overflow-hidden">
                <div className="p-5 border-b bg-gray-50/50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search by client name or prefix..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        {filteredKeys.length} keys total
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client / Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prefix</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-400">Loading API keys...</td></tr>
                            ) : filteredKeys.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-400">No API keys found.</td></tr>
                            ) : (
                                filteredKeys.map((keyItem) => (
                                    <tr key={keyItem.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <Shield size={16} />
                                                </div>
                                                <span className="font-semibold text-gray-900">{keyItem.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                                                {keyItem.prefix}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                keyItem.revoked 
                                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                                    : 'bg-green-50 text-green-700 border-green-100'
                                            }`}>
                                                {keyItem.revoked ? 'Revoked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(keyItem.created).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!keyItem.revoked && (
                                                <button 
                                                    onClick={() => handleRevokeKey(keyItem.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                    title="Revoke Key"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create API Key Modal */}
            <Modal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                title={generatedKey ? "Key Generated Successfully" : "Generate API Key"}
                maxWidth="max-w-lg"
            >
                {!generatedKey ? (
                    <form onSubmit={handleCreateKey} className="space-y-6 p-2">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>Give this key a descriptive name (e.g., "Registrar General Integration"). This will help you identify it later.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Client Name</label>
                            <input 
                                required
                                className="input text-lg py-3"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="Enter organization or system name..."
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>
                            <button type="submit" className="btn btn-primary px-8">Generate Key</button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 p-2">
                        <div className="bg-red-50 border border-red-200 p-5 rounded-xl text-red-800 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-base">
                                <AlertCircle size={20} />
                                <span>CRITICAL: Save this key now!</span>
                            </div>
                            <p className="text-sm opacity-90">For security reasons, this key will <strong>NEVER</strong> be shown again. If you lose it, you will have to revoke it and generate a new one.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Full API Key</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono break-all text-sm shadow-inner selection:bg-emerald-500 selection:text-white">
                                    {generatedKey.key}
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(generatedKey.key)}
                                    className={`p-4 rounded-xl transition-all shadow-md flex items-center justify-center min-w-[60px] ${
                                        copied ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
                                </button>
                            </div>
                            {copied && <p className="text-xs text-green-600 font-bold text-center">Copied to clipboard!</p>}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{generatedKey.name}</p>
                                    <p className="text-xs text-gray-500">Prefix: {generatedKey.prefix}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowCreateModal(false)}
                            className="btn btn-primary w-full py-4 text-lg shadow-lg mt-4"
                        >
                            I Have Saved This Key
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ApiKeyManagement
