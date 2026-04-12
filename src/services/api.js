import axios from 'axios'

/**
 * Get CSRF token from cookie
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Base axios instance with default configuration
 * Provides centralized request/response handling
 */
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // Send cookies with requests
})

/**
 * Request interceptor
 * Add CSRF token and authentication headers
 */
api.interceptors.request.use(
    (config) => {
        // Add CSRF token for unsafe methods
        if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }

        // Add auth token if available (though we're using session auth)
        const token = localStorage.getItem('authToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * Response interceptor
 * Handle errors globally
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors
        if (error.response?.status === 429) {
            // Rate limited - too many requests
            const retryAfter = error.response.headers['retry-after']
            const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment'
            console.warn(`Rate limited. Retry after ${waitTime}.`)
            alert(`Too many requests. Please wait ${waitTime} and try again.`)
        } else if (error.response?.status === 401) {
            // Unauthorized - could redirect to login
            console.error('Unauthorized access')
        } else if (error.response?.status === 403) {
            console.error('Forbidden - check CSRF token or permissions')
        } else if (error.response?.status === 500) {
            console.error('Server error')
        }
        return Promise.reject(error)
    }
)

export default api
