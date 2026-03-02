import client from './client'

export const adminApi = {
  // Auth
  login: (email, password) =>
    client.post('/admin/auth/login', { email, password }).then((r) => r.data),

  // Dashboard
  dashboard: () =>
    client.get('/admin/dashboard').then((r) => r.data),

  // Users
  listUsers: (page = 1, limit = 20) =>
    client.get('/admin/users/list', { params: { page, limit } }).then((r) => r.data),

  searchUsers: (search, limit = 20) =>
    client.get('/admin/users', { params: { search, limit } }).then((r) => r.data),

  getUser: (userId) =>
    client.get(`/admin/users/${userId}`).then((r) => r.data),

  updateUser: (userId, fields) =>
    client.put(`/admin/users/${userId}`, fields).then((r) => r.data),

  deleteUser: (userId) =>
    client.delete(`/admin/users/${userId}`).then((r) => r.data),

  recentRegistrations: (days = 7, limit = 20) =>
    client.get('/admin/users/recent', { params: { days, limit } }).then((r) => r.data),

  // Devices
  listDevices: (page = 1, limit = 20) =>
    client.get('/admin/devices/list', { params: { page, limit } }).then((r) => r.data),

  searchDevices: (search, limit = 20) =>
    client.get('/admin/devices', { params: { search, limit } }).then((r) => r.data),

  getDevice: (deviceId) =>
    client.get(`/admin/devices/${deviceId}`).then((r) => r.data),

  getDevicePin: (deviceId) =>
    client.get(`/admin/devices/${deviceId}/pin`).then((r) => r.data),

  clearPin: (deviceId) =>
    client.delete(`/admin/devices/${deviceId}/pin`).then((r) => r.data),

  transferDevice: (deviceId, newOwnerId) =>
    client.put(`/admin/devices/${deviceId}/owner`, { newOwnerId }).then((r) => r.data),

  deleteDevice: (deviceId) =>
    client.delete(`/admin/devices/${deviceId}`).then((r) => r.data),

  listUserDevices: (userId) =>
    client.get(`/admin/users/${userId}/devices`).then((r) => r.data),

  // Products
  listProducts: (page = 1, limit = 20) =>
    client.get('/admin/products/list', { params: { page, limit } }).then((r) => r.data),

  searchProducts: (search, limit = 20) =>
    client.get('/admin/products', { params: { search, limit } }).then((r) => r.data),

  getProduct: (productId) =>
    client.get(`/admin/products/${productId}`).then((r) => r.data),

  updateProductSpecs: (productId, specifications) =>
    client.put(`/admin/products/${productId}/specifications`, { specifications }).then((r) => r.data),

  uploadProductManual: (productId, file) => {
    const formData = new FormData()
    formData.append('manual', file)
    return client.post(`/admin/products/${productId}/manual`, formData, {
      headers: { 'Content-Type': undefined },
    }).then((r) => r.data)
  },

  deleteProductManual: (productId) =>
    client.delete(`/admin/products/${productId}/manual`).then((r) => r.data),

  // Notifications
  sendNotification: (payload) =>
    client.post('/admin/notifications/send', payload).then((r) => r.data),

  getNotificationHistory: (page = 1, limit = 20) =>
    client.get('/admin/notifications', { params: { page, limit } }).then((r) => r.data),

  getNotificationStats: () =>
    client.get('/admin/notifications/stats').then((r) => r.data),

  // Audit
  getAuditLog: (page = 1, limit = 20) =>
    client.get('/admin/audit-log', { params: { page, limit } }).then((r) => r.data),
}
