import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let refreshQueue: Array<(token: null) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (original.url === '/auth/refresh' || original.url === '/auth/login') {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push(() => {
          resolve(api(original))
        })
        void reject
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )

      refreshQueue.forEach((cb) => cb(null))
      refreshQueue = []
      isRefreshing = false

      return api(original)
    } catch (refreshError) {
      refreshQueue = []
      isRefreshing = false
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    }
  },
)

export default api
