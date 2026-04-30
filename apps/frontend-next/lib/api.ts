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
    const { protocol, hostname, port } = window.location
    // Nginx reverse proxy on default ports: API is served under /api
    if (port === '' || port === '80' || port === '443') {
      return `${protocol}//${hostname}/api`
    }
    // Direct Next dev server on :3000 (or any non-standard port) → API on :3001
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
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  permissions?: string[]
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
  photoUrls: string[]
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
  photoUrls?: string[]
}

export interface ParseTaskDraftDto {
  shortDescription: string
  fullDescription: string
  city: string
  address: string
  urgency: 'low' | 'medium' | 'high'
  rewardSuggestion?: number
  needsUserClarification: boolean
  clarificationQuestion?: string
  missingFields?: string[]
  canSubmit?: boolean
  rewriteQualityNote?: string
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
  parseDraft: async (freeText: string): Promise<ParseTaskDraftDto> => {
    const { data } = await api.post('/tasks/parse', { freeText })
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
  remove: async (taskId: string) => {
    const { data } = await api.delete(`/tasks/${taskId}`)
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
  requireChatRequestApproval: boolean
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
  requireChatRequestApproval?: boolean
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
  updateFCMToken: async (token: string | null): Promise<void> => {
    await api.post('/users/me/fcm-token', { token })
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
  // Super Admin endpoints
  getAdminTokens: async () => {
    const { data } = await api.get('/admin/tokens')
    return data
  },
  createAdminToken: async (permissions: string[], expiresAt?: string, assignedToUserId?: string) => {
    const { data } = await api.post('/admin/tokens', { permissions, expiresAt, assignedToUserId })
    return data
  },
  revokeAdminToken: async (tokenId: string) => {
    const { data } = await api.post(`/admin/tokens/${tokenId}/revoke`)
    return data
  },
  getAdmins: async () => {
    const { data } = await api.get('/admin/admins')
    return data
  },
  activateAdminToken: async (token: string) => {
    const { data } = await api.post('/admin/tokens/activate', { token })
    return data
  },
  // Support conversations (admin)
  getSupportConversations: async (filters?: { status?: string; priority?: string }): Promise<SupportConversation[]> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    const { data } = await api.get(`/admin/support/conversations?${params.toString()}`)
    return data
  },
  getSupportConversation: async (id: string): Promise<SupportConversation> => {
    const { data } = await api.get(`/admin/support/conversations/${id}`)
    return data
  },
  sendSupportMessage: async (conversationId: string, message: string): Promise<SupportMessage> => {
    const { data } = await api.post('/admin/support/messages', { conversationId, message })
    return data
  },
  closeSupportConversation: async (id: string): Promise<SupportConversation> => {
    const { data } = await api.post(`/admin/support/conversations/${id}/close`)
    return data
  },
  updateSupportConversation: async (id: string, updates: { status?: string; priority?: string }): Promise<SupportConversation> => {
    const { data } = await api.post(`/admin/support/conversations/${id}/update`, updates)
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

export interface SupportConversation {
  id: string
  userId: string
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  topic: 'task_issue' | 'account_access' | 'restriction_block' | 'other'
  status: 'open' | 'closed'
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  updatedAt: string
  lastMessageAt?: string | null
  messages?: SupportMessage[]
}

export interface SupportMessage {
  id: string
  conversationId: string
  senderId: string
  sender?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  senderRole: 'USER' | 'ADMIN'
  message: string
  isRead: boolean
  createdAt: string
}

export const supportApi = {
  // Legacy endpoints (backward compatibility)
  // NOTE: This endpoint is deprecated. Use createConversation instead.
  createRequest: async (data: CreateSupportRequestData) => {
    const { data: response } = await api.post('/support/requests', data)
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
  // New conversation-based endpoints
  createConversation: async (topic: string, message: string): Promise<SupportConversation> => {
    const { data } = await api.post('/support/conversations', { topic, message })
    return data
  },
  getConversations: async (): Promise<SupportConversation[]> => {
    const { data } = await api.get('/support/conversations')
    return data
  },
  getConversation: async (id: string): Promise<SupportConversation> => {
    const { data } = await api.get(`/support/conversations/${id}`)
    return data
  },
  sendMessage: async (conversationId: string, message: string): Promise<SupportMessage> => {
    const { data } = await api.post('/support/messages', { conversationId, message })
    return data
  },
}

export interface ChatUserPreview {
  id: string
  firstName?: string
  lastName?: string
  email: string
  phoneNumber?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  message: string
  recipientReadAt?: string | null
  createdAt: string
}

export interface ChatConversation {
  id: string
  userAId: string
  userBId: string
  requestedById: string
  status: 'pending' | 'active' | 'declined'
  declinedById?: string | null
  lastMessagePreview?: string | null
  lastMessageAt?: string | null
  createdAt: string
  updatedAt: string
  otherUser: ChatUserPreview | null
  isIncomingRequest: boolean
  unreadCount: number
  messages?: ChatMessage[]
}

export const chatApi = {
  searchUser: async (query: string): Promise<ChatUserPreview | null> => {
    const { data } = await api.get('/chat/search', { params: { query } })
    return data
  },
  createRequest: async (userId: string, message: string): Promise<ChatConversation> => {
    const { data } = await api.post('/chat/requests', { userId, message })
    return data
  },
  getConversations: async (): Promise<ChatConversation[]> => {
    const { data } = await api.get('/chat/conversations')
    return data
  },
  getConversation: async (id: string, markAsRead = false): Promise<ChatConversation> => {
    const { data } = await api.get(`/chat/conversations/${id}`, {
      params: { markAsRead },
    })
    return data
  },
  sendMessage: async (conversationId: string, message: string): Promise<ChatConversation> => {
    const { data } = await api.post('/chat/messages', { conversationId, message })
    return data
  },
  acceptRequest: async (conversationId: string): Promise<ChatConversation> => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/accept`)
    return data
  },
  declineRequest: async (conversationId: string): Promise<ChatConversation> => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/decline`)
    return data
  },
  blockUser: async (conversationId: string): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/block`)
    return data
  },
}

export default api
