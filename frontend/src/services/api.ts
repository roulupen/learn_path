import axios from 'axios'
import { trackActivity } from '../utils/sessionManager'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to track activity and add auth token
api.interceptors.request.use(
  (config) => {
    // Track user activity on API calls
    trackActivity()
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Track activity on successful responses
    trackActivity()
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear session and redirect to login
      const { sessionManager } = require('../utils/sessionManager')
      sessionManager.clearSession()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api
