import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, User as UserIcon, Shield, Briefcase, ChevronDown } from 'lucide-react'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FarmerDashboard from './pages/FarmerDashboard'
import OfficerDashboard from './pages/OfficerDashboard'
import ApplicationForm from './pages/ApplicationForm'
import AdminDashboard from './pages/AdminDashboard'
import Reports from './pages/Reports'
import AuditLogs from './pages/AuditLogs'
import ProfileModal from './components/ProfileModal'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import axios from 'axios'

// Configure axios for session-based authentication
axios.defaults.withCredentials = true
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

import { useEffect, Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 border-2 border-red-200 rounded-xl m-4">
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Something went wrong.</h2>
                    <p className="text-red-600 mb-4">{this.state.error?.toString()}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function Header({ user, setUser }) {
    const location = useLocation()
    const navigate = useNavigate()
    const [showPortalLinks, setShowPortalLinks] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    return (
        <header className="site-header">
            <div className="header-main">
                <div className="header-inner">
                    {/* Logo and Title */}
                    <Link to="/" className="header-brand">
                        <div className="header-logo-wrap">
                            <img src="/logo.png" alt="Land Tenure Implementation Committee" className="header-logo" />
                        </div>
                        <div className="header-brand-text">
                            <span className="header-title">Title Deeds One Stop Center</span>
                            <span className="header-subtitle-text">Land Tenure Implementation Committee</span>
                        </div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="header-nav">
                        {user && (
                            <>
                                {user.role === 'admin' ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPortalLinks(!showPortalLinks)}
                                            className="header-nav-btn"
                                        >
                                            <LayoutGrid size={16} />
                                            <span className="header-nav-label">Portals</span>
                                            <ChevronDown size={14} className={`header-chevron ${showPortalLinks ? 'header-chevron-open' : ''}`} />
                                        </button>
                                        {showPortalLinks && (
                                            <div className="header-dropdown">
                                                <button
                                                    onClick={() => { navigate('/admin-dashboard'); setShowPortalLinks(false) }}
                                                    className="header-dropdown-item"
                                                >
                                                    <Shield size={16} className="text-red-600" /> Admin Portal
                                                </button>
                                                <button
                                                    onClick={() => { navigate('/officer-dashboard'); setShowPortalLinks(false) }}
                                                    className="header-dropdown-item"
                                                >
                                                    <Briefcase size={16} className="text-blue-600" /> Officer Portal
                                                </button>
                                                <button
                                                    onClick={() => { navigate('/farmer-dashboard'); setShowPortalLinks(false) }}
                                                    className="header-dropdown-item"
                                                >
                                                    <UserIcon size={16} className="text-emerald-600" /> Farmer Portal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                <div className="header-user-section">
                                    <button
                                        onClick={() => setIsProfileOpen(true)}
                                        className="header-user-btn"
                                        title="Edit Profile"
                                    >
                                        <div className="header-avatar">
                                            <UserIcon size={14} />
                                        </div>
                                        <span className="header-nav-label">{user.name}</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await axios.post('/api/logout/');
                                            } catch (error) {
                                                console.error('Logout error:', error);
                                            }
                                            localStorage.removeItem('user');
                                            setIsProfileOpen(false);
                                            setUser(null);
                                        }}
                                        className="header-logout-btn"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}

                        {!user && location.pathname !== '/login' && location.pathname !== '/signup' && (
                            <div className="header-auth-links">
                                <Link to="/login" className="header-login-link">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="header-signup-link">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
            {/* Zimbabwe flag accent stripe */}
            <div className="header-flag-stripe">
                <div className="flag-green"></div>
                <div className="flag-yellow"></div>
                <div className="flag-red"></div>
                <div className="flag-black"></div>
            </div>

            {/* User Profile Modal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                onUpdateUser={setUser}
            />
        </header>
    )
}

function App() {
    const [user, setUser] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        // Check for existing session
        const restoreSession = async () => {
            try {
                // Try to get user from localStorage
                const storedUser = localStorage.getItem('user');

                if (storedUser) {
                    // Validate session with backend
                    const response = await axios.get('/api/check-session/');
                    if (response.data) {
                        setUser(response.data);
                    } else {
                        // Session invalid, clear localStorage
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                // Session invalid or expired, clear localStorage
                localStorage.removeItem('user');
                console.log('No active session');
            } finally {
                setIsCheckingSession(false);
            }
        };

        restoreSession();

        // Initialize CSRF cookie
        axios.get('/api/csrf-cookie/')
            .catch(err => console.error('Error setting CSRF cookie:', err));
    }, []);

    // Show loading state while checking session
    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header user={user} setUser={setUser} />

                <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                    <Routes>
                        <Route path="/" element={<Home user={user} setUser={setUser} />} />
                        <Route path="/login" element={<Login setUser={setUser} />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
                        <Route
                            path="/dashboard"
                            element={
                                user ? (
                                    user.role === 'farmer' ? <Navigate to="/farmer-dashboard" /> :
                                        user.role === 'admin' ? <Navigate to="/admin-dashboard" /> :
                                            <Navigate to="/officer-dashboard" />
                                ) : <Navigate to="/login" />
                            }
                        />
                        <Route
                            path="/farmer-dashboard"
                            element={user && (user.role === 'farmer' || user.role === 'admin') ? <FarmerDashboard user={user} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/officer-dashboard"
                            element={user && (user.role !== 'farmer') ? <ErrorBoundary><OfficerDashboard user={user} /></ErrorBoundary> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/admin-dashboard"
                            element={user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/reports"
                            element={user && user.role !== 'farmer' ? <Reports user={user} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/audit-logs"
                            element={user && user.role === 'admin' ? <AuditLogs user={user} /> : <Navigate to="/login" />}
                        />
                        <Route path="/apply" element={user ? <ApplicationForm user={user} /> : <Navigate to="/login" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    )
}

export default App
