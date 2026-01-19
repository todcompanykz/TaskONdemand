import axios from 'axios'

// Auto-detect API URL based on current hostname
// If user opens http://192.168.1.100:3000, API will be http://192.168.1.100:3001
function getApiUrl(): string {
  // Use environment variable if set (for explicit configuration)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Auto-detect from browser location (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    // Replace port 3000 with 3001, or use default 3001 if no port specified
    return `${protocol}//${hostname}:3001`
  }

  // Server-side fallback (SSR)
  return 'http://localhost:3001'
}

const API_URL = getApiUrl()

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
  firstName?: string
  lastName?: string
  phoneNumber?: string
  ratingAvg?: number
  ratingCount?: number
  completedTasksCount?: number
  createdAt?: string
  updatedAt?: string
  isAdmin?: boolean // Computed on frontend based on email
}

export interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  fromUser: {
    id: string
    firstName: string
    lastName: string
  }
  task: {
    id: string
    shortDescription: string
  }
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  ratingAvg: number
  ratingCount: number
  completedTasksCount: number
  createdAt: string
  reviews: Review[]
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
  register: async (email: string, firstName: string, lastName: string, password: string, confirmPassword: string, phoneNumber?: string) => {
    const { data } = await api.post('/auth/register', { email, firstName, lastName, password, confirmPassword, phoneNumber })
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

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
}

export interface NotificationSettings {
  id: string
  userId: string
  loginFromNewDevice: boolean
  passwordChange: boolean
  securityErrors: boolean
  accountBlocked: boolean
  profileChanges: boolean
  actionConfirmation: boolean
  sessionExpiration: boolean
  newMessages: boolean
  newTasks: boolean
  taskStatusChange: boolean
  taskComments: boolean
  executorAssigned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UpdateNotificationSettingsData {
  loginFromNewDevice?: boolean
  passwordChange?: boolean
  securityErrors?: boolean
  accountBlocked?: boolean
  profileChanges?: boolean
  actionConfirmation?: boolean
  sessionExpiration?: boolean
  newMessages?: boolean
  newTasks?: boolean
  taskStatusChange?: boolean
  taskComments?: boolean
  executorAssigned?: boolean
}

export const usersApi = {
  getMe: async () => {
    const { data } = await api.get('/users/me')
    return data
  },
  getProfile: async (userId: string): Promise<UserProfile> => {
    const { data } = await api.get(`/users/${userId}/profile`)
    return data
  },
  updateProfile: async (updateData: UpdateProfileData) => {
    const { data } = await api.put('/users/me/profile', updateData)
    return data
  },
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const { data } = await api.get('/users/me/notifications')
    return data
  },
  updateNotificationSettings: async (updateData: UpdateNotificationSettingsData): Promise<NotificationSettings> => {
    const { data } = await api.put('/users/me/notifications', updateData)
    return data
  },
}

export const reviewsApi = {
  createReview: async (taskId: string, rating: number, comment?: string) => {
    const { data } = await api.post(`/tasks/${taskId}/review`, { rating, comment })
    return data
  },
  getUserReviews: async (userId: string): Promise<Review[]> => {
    const { data } = await api.get(`/users/${userId}/reviews`)
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
