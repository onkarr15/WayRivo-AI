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

export const destinationService = {
  getAll: (page = 1, limit = 50, search = '', state = '') =>
    api.get(`/destinations?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${state && state !== 'All' ? `&state=${encodeURIComponent(state)}` : ''}`),
  getPopular: () => api.get('/destinations/popular'),
  getById: (id: number | string) => api.get(`/destinations/${id}`),
  getBySlug: (slug: string) => api.get(`/destinations/slug/${slug}`),
  create: (data: any) => api.post('/destinations', data),
  update: (id: number | string, data: any) => api.put(`/destinations/${id}`, data),
  delete: (id: number | string) => api.delete(`/destinations/${id}`),
};

export const hotelService = {
  getAll: (params?: { destinationId?: string; stars?: number; search?: string; minPrice?: number; maxPrice?: number; sortBy?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.destinationId) q.append('destinationId', params.destinationId);
    if (params?.stars) q.append('stars', params.stars.toString());
    if (params?.search) q.append('search', params.search);
    if (params?.minPrice) q.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) q.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return api.get(`/hotels?${q.toString()}`);
  },
  getById: (id: number | string) => api.get(`/hotels/${id}`),
  create: (data: any) => api.post('/hotels', data),
  update: (id: number | string, data: any) => api.put(`/hotels/${id}`, data),
  delete: (id: number | string) => api.delete(`/hotels/${id}`),
};

export const activityService = {
  getAll: (params?: { destinationId?: string; category?: string; search?: string; maxPrice?: number; sortBy?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.destinationId) q.append('destinationId', params.destinationId);
    if (params?.category && params.category !== 'All') q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    if (params?.maxPrice) q.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return api.get(`/activities?${q.toString()}`);
  },
  getById: (id: number | string) => api.get(`/activities/${id}`),
  create: (data: any) => api.post('/activities', data),
  update: (id: number | string, data: any) => api.put(`/activities/${id}`, data),
  delete: (id: number | string) => api.delete(`/activities/${id}`),
};

export const packageService = {
  getAll: (params?: { destinationId?: string; isRecommended?: boolean; search?: string; maxPrice?: number; sortBy?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.destinationId) q.append('destinationId', params.destinationId);
    if (params?.isRecommended !== undefined) q.append('isRecommended', params.isRecommended.toString());
    if (params?.search) q.append('search', params.search);
    if (params?.maxPrice) q.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return api.get(`/packages?${q.toString()}`);
  },
  getById: (id: number | string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: number | string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: number | string) => api.delete(`/packages/${id}`),
};

export const tripRequestService = {
  create: (data: any) => api.post('/trip-requests', data),
  getMy: (page = 0, size = 10) => api.get(`/trip-requests/my?page=${page}&size=${size}`),
  getById: (id: number | string) => api.get(`/trip-requests/${id}`),
  getOpen: (page = 0, size = 10, search = '') => api.get(`/trip-requests/open?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
  getDashboardStats: () => api.get('/trip-requests/dashboard-stats'),
  cancel: (id: number | string) => api.patch(`/trip-requests/${id}/cancel`),
};

export const matchingService = {
  getMatchedExperts: (tripRequestId: number | string) => api.get(`/trip-requests/${tripRequestId}/matched-experts`),
  getAiInsights: (destination: string, style?: string, days?: number) =>
    api.get(`/public/ai-insights?destination=${encodeURIComponent(destination)}&style=${encodeURIComponent(style || '')}&days=${days || 5}`),
  getRecommendations: () => api.get('/public/recommendations'),
};

export const proposalService = {
  create: (data: any) => api.post('/proposals', data),
  getForRequest: (requestId: number | string) => api.get(`/proposals/request/${requestId}`),
  getMy: (page = 0, size = 10) => api.get(`/proposals/my?page=${page}&size=${size}`),
  getById: (id: number | string) => api.get(`/proposals/${id}`),
  select: (id: number | string) => api.post(`/proposals/${id}/select`),
  getExpertDashboardStats: () => api.get('/proposals/expert/dashboard-stats'),
};

export const bookingService = {
  getTravelerBookings: (page = 0, size = 10) => api.get(`/bookings/traveler?page=${page}&size=${size}`),
  getExpertBookings: (page = 0, size = 10) => api.get(`/bookings/expert?page=${page}&size=${size}`),
  getById: (id: number | string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  updateStatus: (id: number | string, status: string) => api.patch(`/bookings/${id}/status?status=${status}`),
};

export const paymentService = {
  getConfig: () => api.get('/payments/config'),
  createOrder: (data: { bookingId?: string | number; amount?: number; currency?: string }) => api.post('/payments/create-order', data),
  captureOrder: (data: { orderId: string; bookingId?: string | number }) => api.post('/payments/capture-order', data),
  verifyPayment: (data: { bookingId: number | string; transactionReference?: string; paymentMethod?: string; notes?: string }) => api.post('/payments/verify-payment', data),
  getBookingTransactions: (bookingId: number | string) => api.get(`/payments/booking/${bookingId}`),
};

export const reviewService = {
  create: (data: any) => api.post('/reviews', data),
  getRecent: () => api.get('/reviews/recent'),
  getForExpert: (expertId: number | string) => api.get(`/reviews/expert/${expertId}`),
};

export const expertService = {
  getFeatured: () => api.get('/experts/featured'),
  getProfile: () => api.get('/experts/profile'),
  getById: (id: number | string) => api.get(`/experts/${id}`),
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

export const aiAgentService = {
  chat: (message: string, conversationId?: string) =>
    api.post('/agent/chat', { message, conversationId }),
  getConversations: () => api.get('/agent/conversations'),
  getConversation: (id: string) => api.get(`/agent/conversations/${id}`),
  createConversation: (title?: string) => api.post('/agent/conversations', { title }),
  deleteConversation: (id: string) => api.delete(`/agent/conversations/${id}`),
  saveItinerary: (data: any) => api.post('/agent/save-itinerary', data),
  createProposal: (data: any) => api.post('/agent/create-proposal', data),
  getSuggestedPrompts: () => api.get('/agent/suggested-prompts'),
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/stats'),
  getInventoryOverview: () => api.get('/admin/inventory'),
  getAuditLogs: (page = 0, size = 20) => api.get(`/admin/audit-logs?page=${page}&size=${size}`),
  getUsers: (page = 0, size = 10, search = '', role = '') => api.get(`/admin/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}&role=${role}`),
  updateUserStatus: (id: number | string, status: string) => api.patch(`/admin/users/${id}/status?status=${status}`),
  getExperts: (status = '', page = 0, size = 10) => api.get(`/admin/experts?status=${status}&page=${page}&size=${size}`),
  updateExpertVerification: (id: number | string, status: string) => api.patch(`/admin/experts/${id}/verification?status=${status}`),
  getTripRequests: (page = 0, size = 10) => api.get(`/admin/trip-requests?page=${page}&size=${size}`),
  getBookings: (page = 0, size = 10) => api.get(`/admin/bookings?page=${page}&size=${size}`),
  getReviews: (page = 0, size = 10) => api.get(`/admin/reviews?page=${page}&size=${size}`),
};
