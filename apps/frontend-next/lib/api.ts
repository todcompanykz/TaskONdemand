import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: string
  email: string
  phoneNumber?: string
  createdAt?: string
  updatedAt?: string
  isAdmin?: boolean // Computed on frontend based on email
}

export interface Task {
  id: string
  shortDescription: string
  fullDescription: string
  reward: number
  city: string
  address: string
  geoPoint: string
  urgency: 'low' | 'medium' | 'high'
  status: 'created' | 'claimed' | 'completed' | 'cancelled' | 'expired'
  createdById: string
  claimedById?: string
  customerConfirmed: boolean
  executorConfirmed: boolean
  createdAt: string
  updatedAt: string
  expiresAt?: string
  createdBy?: User
  claimedBy?: User
}

export interface CreateTaskDto {
  shortDescription: string
  fullDescription: string
  reward: number
  city: string
  address: string
  urgency: 'low' | 'medium' | 'high'
}

export const authApi = {
  register: async (email: string, password: string, phoneNumber?: string) => {
    const { data } = await api.post('/auth/register', { email, password, phoneNumber })
    return data
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
}

export const tasksApi = {
  getFeed: async (longitude: number, latitude: number) => {
    const { data } = await api.get('/tasks/feed', {
      params: { longitude, latitude },
    })
    return data
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },
  create: async (task: CreateTaskDto) => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:tasksApi.create:entry',message:'tasksApi.create called',data:{task,hasLongitude:'longitude' in task,hasLatitude:'latitude' in task,hasCity:'city' in task,hasAddress:'address' in task},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    const { data } = await api.post('/tasks', task)
    return data
  },
  claim: async (taskId: string) => {
    const { data } = await api.post('/tasks/claim', { taskId })
    return data
  },
  cancel: async (taskId: string) => {
    const { data } = await api.post(`/tasks/${taskId}/cancel`)
    return data
  },
  refuse: async (taskId: string) => {
    const { data } = await api.post(`/tasks/${taskId}/refuse`)
    return data
  },
  confirmWork: async (taskId: string) => {
    const { data } = await api.post(`/tasks/${taskId}/confirm-work`)
    return data
  },
  confirmPayment: async (taskId: string) => {
    const { data } = await api.post(`/tasks/${taskId}/confirm-payment`)
    return data
  },
  getHistory: async () => {
    const { data } = await api.get('/tasks/history')
    return data
  },
}

export const usersApi = {
  getMe: async () => {
    const { data } = await api.get('/users/me')
    return data
  },
}

export const adminApi = {
  getUsers: async () => {
    const { data } = await api.get('/admin/users')
    return data
  },
  getTasks: async () => {
    const { data } = await api.get('/admin/tasks')
    return data
  },
  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },
  deleteTask: async (taskId: string) => {
    const { data } = await api.delete(`/admin/tasks/${taskId}`)
    return data
  },
}

export default api
