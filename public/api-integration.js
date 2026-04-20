// API Integration - Hotel La Promenade
// Connects the frontend to the backend API.

const API_BASE = '/api';
const authStorage = window.sessionStorage;

var TOKEN = authStorage.getItem('token');
var CURRENT_USER = null;
const storedCurrentUser = authStorage.getItem('currentUser');
if (storedCurrentUser) {
  try {
    CURRENT_USER = JSON.parse(storedCurrentUser);
  } catch (_) {
    authStorage.removeItem('currentUser');
  }
}

function syncAuthGlobals() {
  window.TOKEN = TOKEN;
  window.CURRENT_USER = CURRENT_USER;
}

syncAuthGlobals();

async function fetchWithTimeout(resource, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps à répondre. Réessayez.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (TOKEN) {
    options.headers.Authorization = `Bearer ${TOKEN}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, options, 18000);

  if (response.status === 401 || response.status === 403) {
    apiLogout();
    const appEl = document.getElementById('app');
    const loginEl = document.getElementById('login-screen');
    const getStartedEl = document.getElementById('getstarted-screen');
    if (appEl) appEl.style.display = 'none';
    if (loginEl) loginEl.style.display = 'flex';
    if (getStartedEl) getStartedEl.style.display = 'none';
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    const blob = await response.blob();
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }
    return blob;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Erreur ${response.status}`);
  }
  return data;
}

async function apiUpload(endpoint, formData) {
  const headers = {};
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  }, 20000);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data;
}

async function apiLogin(email, password) {
  const response = await fetchWithTimeout(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }, 15000);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Échec de connexion');
  }

  TOKEN = data.token;
  CURRENT_USER = data.user;
  authStorage.setItem('token', TOKEN);
  authStorage.setItem('currentUser', JSON.stringify(CURRENT_USER));
  syncAuthGlobals();
  return data;
}

async function apiRegister(fname, lname, email, password) {
  const response = await fetchWithTimeout(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fname, lname, email, password })
  }, 12000);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Échec d’inscription');
  }

  TOKEN = data.token;
  CURRENT_USER = data.user;
  authStorage.setItem('token', TOKEN);
  authStorage.setItem('currentUser', JSON.stringify(CURRENT_USER));
  syncAuthGlobals();
  return data;
}

function apiLogout() {
  TOKEN = null;
  CURRENT_USER = null;
  authStorage.removeItem('token');
  authStorage.removeItem('currentUser');
  syncAuthGlobals();
}

async function fetchEvents() { return apiRequest('/events'); }
async function fetchEvent(id) { return apiRequest(`/events/${id}`); }
async function createEvent(data) { return apiRequest('/events', 'POST', data); }
async function updateEvent(id, data) { return apiRequest(`/events/${id}`, 'PUT', data); }
async function deleteEvent(id) { return apiRequest(`/events/${id}`, 'DELETE'); }

async function uploadDocument(eventId, file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiUpload(`/events/${eventId}/documents`, fd);
}
async function fetchDocuments(eventId) { return apiRequest(`/events/${eventId}/documents`); }
async function deleteDocument(eventId, docId) { return apiRequest(`/events/${eventId}/documents/${docId}`, 'DELETE'); }

async function fetchRooms(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.capacity) params.set('capacity', filters.capacity);
  if (filters.feature) params.set('feature', filters.feature);
  const qs = params.toString();
  return apiRequest(`/rooms${qs ? `?${qs}` : ''}`);
}
async function fetchRoom(id) { return apiRequest(`/rooms/${id}`); }

async function fetchReservations() { return apiRequest('/reservations'); }
async function reserveRoom(data) { return apiRequest('/rooms/reserve', 'POST', data); }
async function updateReservation(id, data) { return apiRequest(`/reservations/${id}`, 'PUT', data); }

async function fetchGuests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/guests${qs ? `?${qs}` : ''}`);
}
async function createGuest(data) { return apiRequest('/guests', 'POST', data); }
async function updateGuest(id, data) { return apiRequest(`/guests/${id}`, 'PUT', data); }
async function deleteGuest(id) { return apiRequest(`/guests/${id}`, 'DELETE'); }
async function sendInvitation(id) { return apiRequest(`/guests/${id}/invite`, 'POST'); }

async function importGuests(file, eventId) {
  const fd = new FormData();
  fd.append('file', file);
  if (eventId) fd.append('eventId', eventId);
  return apiUpload('/guests/import', fd);
}

async function exportGuests(eventId) {
  const qs = eventId ? `?eventId=${eventId}` : '';
  const blob = await apiRequest(`/guests/export${qs}`);
  if (blob instanceof Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invites.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function fetchServices(eventId) {
  const qs = eventId ? `?eventId=${eventId}` : '';
  return apiRequest(`/services${qs}`);
}
async function createService(data) { return apiRequest('/services', 'POST', data); }
async function updateService(id, data) { return apiRequest(`/services/${id}`, 'PUT', data); }

async function fetchDevis(eventId) { return apiRequest(`/devis/${eventId}`); }

async function fetchInvoices() { return apiRequest('/invoices'); }
async function createInvoice(data) { return apiRequest('/invoices', 'POST', data); }
async function generateInvoice(eventId, client) { return apiRequest(`/invoices/generate/${eventId}`, 'POST', { client }); }
async function updateInvoice(id, data) { return apiRequest(`/invoices/${id}`, 'PUT', data); }
async function payInvoice(id, method, amount) { return apiRequest(`/invoices/${id}/pay`, 'POST', { method, amount }); }
async function sendInvoiceEmail(id, email) { return apiRequest(`/invoices/${id}/send`, 'POST', { email }); }

async function downloadInvoicePDF(id, number) {
  const blob = await apiRequest(`/invoices/${id}/pdf`);
  if (blob instanceof Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${number || id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function downloadReceipt(id, number) {
  const blob = await apiRequest(`/invoices/${id}/receipt`);
  if (blob instanceof Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-${number || id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function fetchPayments() { return apiRequest('/payments'); }

async function fetchNotifications() { return apiRequest('/notifications'); }
async function markNotificationRead(id) { return apiRequest(`/notifications/${id}/read`, 'PUT'); }
async function markAllNotificationsRead() { return apiRequest('/notifications/read-all', 'PUT'); }
async function fetchNotifPreferences() { return apiRequest('/notification-preferences'); }
async function updateNotifPreferences(prefs) { return apiRequest('/notification-preferences', 'PUT', prefs); }

async function fetchUsers() { return apiRequest('/users'); }
async function createUser(data) { return apiRequest('/users', 'POST', data); }
async function updateUser(id, data) { return apiRequest(`/users/${id}`, 'PUT', data); }
async function deactivateUser(id) { return apiRequest(`/users/${id}`, 'DELETE'); }

async function fetchAudit() { return apiRequest('/audit'); }

async function fetchReportSummary() { return apiRequest('/reports/summary'); }
async function fetchEventsByType() { return apiRequest('/reports/events-by-type'); }
async function fetchRevenueByMonth() { return apiRequest('/reports/revenue-by-month'); }
async function fetchRoomOccupancy() { return apiRequest('/reports/room-occupancy'); }
async function fetchServicesCost() { return apiRequest('/reports/services-cost'); }

async function sendChatMessage(messages) {
  return apiRequest('/chat', 'POST', { messages });
}

Object.assign(window, {
  apiLogin,
  apiRegister,
  apiLogout,
  apiRequest,
  apiUpload,
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadDocument,
  fetchDocuments,
  deleteDocument,
  fetchRooms,
  fetchRoom,
  fetchReservations,
  reserveRoom,
  updateReservation,
  fetchGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  sendInvitation,
  importGuests,
  exportGuests,
  fetchServices,
  createService,
  updateService,
  fetchDevis,
  fetchInvoices,
  createInvoice,
  generateInvoice,
  updateInvoice,
  payInvoice,
  sendInvoiceEmail,
  downloadInvoicePDF,
  downloadReceipt,
  fetchPayments,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotifPreferences,
  updateNotifPreferences,
  fetchUsers,
  createUser,
  updateUser,
  deactivateUser,
  fetchAudit,
  fetchReportSummary,
  fetchEventsByType,
  fetchRevenueByMonth,
  fetchRoomOccupancy,
  fetchServicesCost,
  sendChatMessage,
  syncAuthGlobals
});
