import api from './api';

export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/users/change-password', data),
};

export const tripRequestService = {
  create: (data: any) => api.post('/trip-requests', data),
  getMy: (page = 0, size = 10) => api.get(`/trip-requests/my?page=${page}&size=${size}`),
  getById: (id: number) => api.get(`/trip-requests/${id}`),
  getOpen: (page = 0, size = 10, search = '') => api.get(`/trip-requests/open?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
  getDashboardStats: () => api.get('/trip-requests/dashboard-stats'),
  cancel: (id: number) => api.patch(`/trip-requests/${id}/cancel`),
};

export const matchingService = {
  getMatchedExperts: (tripRequestId: number) => api.get(`/trip-requests/${tripRequestId}/matched-experts`),
  getAiInsights: (destination: string, style?: string, days?: number) =>
    api.get(`/public/ai-insights?destination=${encodeURIComponent(destination)}&style=${encodeURIComponent(style || '')}&days=${days || 5}`),
  getRecommendations: () => api.get('/public/recommendations'),
};

export const proposalService = {
  create: (data: any) => api.post('/proposals', data),
  getForRequest: (requestId: number) => api.get(`/proposals/request/${requestId}`),
  getMy: (page = 0, size = 10) => api.get(`/proposals/my?page=${page}&size=${size}`),
  getById: (id: number) => api.get(`/proposals/${id}`),
  select: (id: number) => api.post(`/proposals/${id}/select`),
  getExpertDashboardStats: () => api.get('/proposals/expert/dashboard-stats'),
};

export const bookingService = {
  getTravelerBookings: (page = 0, size = 10) => api.get(`/bookings/traveler?page=${page}&size=${size}`),
  getExpertBookings: (page = 0, size = 10) => api.get(`/bookings/expert?page=${page}&size=${size}`),
  getById: (id: number) => api.get(`/bookings/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`/bookings/${id}/status?status=${status}`),
};

export const paymentService = {
  getConfig: () => api.get('/payments/config'),
  createOrder: (data: { bookingId: number; amount?: number; currency?: string }) => api.post('/payments/create-order', data),
  verifyPayment: (data: { bookingId: number; transactionReference?: string; paymentMethod?: string; notes?: string }) => api.post('/payments/verify-payment', data),
  getBookingTransactions: (bookingId: number) => api.get(`/payments/booking/${bookingId}`),
};

export const reviewService = {
  create: (data: any) => api.post('/reviews', data),
  getRecent: () => api.get('/reviews/recent'),
  getForExpert: (expertId: number) => api.get(`/reviews/expert/${expertId}`),
};

export const destinationService = {
  getAll: (page = 0, size = 12, search = '') => api.get(`/destinations?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
  getPopular: () => api.get('/destinations/popular'),
  getById: (id: number) => api.get(`/destinations/${id}`),
  create: (data: any) => api.post('/destinations', data),
  update: (id: number, data: any) => api.put(`/destinations/${id}`, data),
  delete: (id: number) => api.delete(`/destinations/${id}`),
};

export const expertService = {
  getFeatured: () => api.get('/experts/featured'),
  getProfile: () => api.get('/experts/profile'),
  getById: (id: number) => api.get(`/experts/${id}`),
  updateProfile: (data: any) => api.put('/experts/profile', data),
};

export const messageService = {
  send: (data: { recipientId?: number | string; receiverId?: number | string; content?: string; message?: string; tripRequestId?: number | string }) =>
    api.post('/messages', {
      receiverId: data.receiverId || data.recipientId,
      message: data.message || data.content,
      tripRequestId: data.tripRequestId,
    }),
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (partnerId: number | string) => api.get(`/messages/conversation/${partnerId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (messageId: number | string) => api.patch(`/messages/${messageId}/read`),
};

export const notificationService = {
  getAll: (page = 0, size = 20) => api.get(`/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number | string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const publicService = {
  getStatistics: () => api.get('/public/statistics'),
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: (page = 0, size = 20) => api.get(`/admin/audit-logs?page=${page}&size=${size}`),
  getUsers: (page = 0, size = 10, search = '', role = '') => api.get(`/admin/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}&role=${role}`),
  updateUserStatus: (id: number, status: string) => api.patch(`/admin/users/${id}/status?status=${status}`),
  getExperts: (status = '', page = 0, size = 10) => api.get(`/admin/experts?status=${status}&page=${page}&size=${size}`),
  updateExpertVerification: (id: number, status: string) => api.patch(`/admin/experts/${id}/verification?status=${status}`),
  getTripRequests: (page = 0, size = 10) => api.get(`/admin/trip-requests?page=${page}&size=${size}`),
  getBookings: (page = 0, size = 10) => api.get(`/admin/bookings?page=${page}&size=${size}`),
  getReviews: (page = 0, size = 10) => api.get(`/admin/reviews?page=${page}&size=${size}`),
};
