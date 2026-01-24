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

  // Server-side fallback (SSR/Docker)
  return 'http://backend:3001'
}

// Create axios instance with placeholder baseURL
// Real baseURL will be set dynamically in request interceptor
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
})

// Request interceptor to dynamically set baseURL and add auth token
api.interceptors.request.use(
  (config) => {
    // Dynamically compute API URL on EVERY request (fixes SSR caching issue)
    const apiUrl = getApiUrl()
    config.baseURL = apiUrl
    
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
  isRestricted?: boolean
  cancelCount?: number
  refuseCount?: number
  suspiciousFlags?: string[]
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
  recentCancellationsCount?: number
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
  getFeed: async (city: string) => {
    const { data } = await api.get('/tasks/feed', {
      params: { city },
    })
    return data
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },
  create: async (task: CreateTaskDto) => {
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
  supportReplies: boolean
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
  supportReplies?: boolean
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

export interface AnalyticsData {
  dailyMetrics: Array<{ date: string; created: number; claimed: number }>
  overallMetrics: {
    claimRatio: number
    averageTimeToClaim: number
    cancellationRate: number
  }
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
  getAnalytics: async (): Promise<AnalyticsData> => {
    const { data } = await api.get('/admin/analytics')
    return data
  },
  deleteTask: async (taskId: string) => {
    const { data } = await api.delete(`/admin/tasks/${taskId}`)
    return data
  },
  restrictUser: async (userId: string) => {
    const { data } = await api.post(`/admin/users/${userId}/restrict`)
    return data
  },
  unrestrictUser: async (userId: string) => {
    const { data } = await api.post(`/admin/users/${userId}/unrestrict`)
    return data
  },
  replyToSupportRequest: async (requestId: string, message: string) => {
    const { data } = await api.post(`/admin/support/${requestId}/reply`, { message })
    return data
  },
}

export interface CreateSupportRequestData {
  topic: 'task_issue' | 'account_access' | 'restriction_block' | 'other'
  message: string
}

export interface SupportRequest {
  id: string
  userId: string
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  topic: string
  message: string
  status: 'open' | 'answered'
  responseMessage?: string | null
  answeredAt?: string | null
  respondedByAdminId?: string | null
  createdAt: string
}

export const supportApi = {
  createRequest: async (data: CreateSupportRequestData) => {
    const { data: response } = await api.post('/support', data)
    return response
  },
  getAllRequests: async (): Promise<SupportRequest[]> => {
    const { data } = await api.get('/support')
    return data
  },
  getMySupportRequests: async (): Promise<SupportRequest[]> => {
    const { data } = await api.get('/support/my-requests')
    return data
  },
}

export default api
