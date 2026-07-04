import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000,
});

// Attach token from localStorage on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerPatient = (data) => API.post('/auth/register/patient', data);
export const registerDoctor = (data) => API.post('/auth/register/doctor', data);
export const login = (data) => API.post('/auth/login', data);
export const logout = () => API.post('/auth/logout');
export const getMe = () => API.get('/auth/me');
export const updatePassword = (data) => API.put('/auth/update-password', data);

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const getDoctors = (params) => API.get('/doctors', { params });
export const getDoctorById = (id) => API.get(`/doctors/${id}`);
export const getDoctorSlots = (id, date) => API.get(`/doctors/${id}/slots`, { params: { date } });
export const getCities = () => API.get('/doctors/cities');
export const getSpecializations = () => API.get('/doctors/specializations');

// Doctor self-management
export const getDoctorDashboard = () => API.get('/doctors/dashboard/me');
export const getDoctorAppointments = (params) => API.get('/doctors/appointments/me', { params });
export const updateDoctorProfile = (data) => API.put('/doctors/profile/me', data);
export const updateSlotConfig = (data) => API.put('/doctors/slots/config', data);
export const toggleDayAvailability = (data) => API.put('/doctors/availability/day', data);
export const toggleSlot = (slotId, data) => API.put(`/doctors/slots/${slotId}/toggle`, data);
export const updateDoctorAppointment = (id, data) => API.put(`/doctors/appointments/${id}`, data);

// ─── Appointments ─────────────────────────────────────────────────────────────
export const initiateBooking = (data) => API.post('/appointments/book', data);
export const verifyPayment = (data) => API.post('/appointments/verify-payment', data);
export const getMyAppointments = (params) => API.get('/appointments/my', { params });
export const getAppointmentById = (id) => API.get(`/appointments/${id}`);
export const cancelAppointment = (id, data) => API.put(`/appointments/${id}/cancel`, data);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const createReview = (data) => API.post('/reviews', data);
export const getDoctorReviews = (doctorId, params) => API.get(`/reviews/doctor/${doctorId}`, { params });
export const updateReview = (id, data) => API.put(`/reviews/${id}`, data);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminStats = () => API.get('/admin/stats');
export const getRevenueAnalytics = () => API.get('/admin/analytics/revenue');
export const getPendingDoctors = () => API.get('/admin/doctors/pending');
export const getAllDoctors = (params) => API.get('/admin/doctors', { params });
export const verifyDoctor = (id, data) => API.put(`/admin/doctors/${id}/verify`, data);
export const toggleDoctorActive = (id) => API.put(`/admin/doctors/${id}/toggle`);
export const getAllPatients = (params) => API.get('/admin/patients', { params });
export const getAllAppointments = (params) => API.get('/admin/appointments', { params });

export default API;
