import axios from 'axios'
import store, { logout } from './store'

// Create Axios Instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Inject JWT token into Bearer Headers
api.interceptors.request.use(
  (config) => {
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

// Response Interceptor: Catch 401 and redirect to logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch Redux Logout action
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

export default api
