import axios from 'axios';

const API_BASE = '/api';

export const orgRoleApi = {
  // Tasks
  getTasks: (params?: { eventId?: string; status?: string }) =>
    axios.get(`${API_BASE}/tasks`, { params, withCredentials: true }),

  createTask: (body: {
    title: string;
    description?: string;
    assignedMemberId: string;
    eventId?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
  }) => axios.post(`${API_BASE}/tasks`, body, {withCredentials: true}),

  updateTaskStatus: (taskId: string, status: 'Todo' | 'InProgress' | 'Done') =>
    axios.patch(`${API_BASE}/tasks/${taskId}/status`, { status }, {withCredentials: true}),

  deleteTask: (taskId: string) =>
    axios.delete(`${API_BASE}/tasks/${taskId}`, {withCredentials: true}),

  // Participants (User Manager)
  getParticipants: (eventId: string) =>
    axios.get(`${API_BASE}/events/${eventId}/participants`, { withCredentials: true }),

  toggleCheckIn: (eventId: string, regId: string) =>
    axios.patch(`${API_BASE}/events/${eventId}/participants/${regId}/check-in`, {}, { withCredentials: true }),

  // Certificates (Certificate Manager)
  getCertificates: (eventId: string) =>
    axios.get(`${API_BASE}/certificates/event/${eventId}`, { withCredentials: true }),

  issueCertificate: (registrationId: string, certificateUrl?: string) =>
    axios.post(`${API_BASE}/certificates/issue`, { registrationId, certificateUrl }, {withCredentials: true}),

  // Finance (Finance Manager)
  getFinance: () =>
    axios.get(`${API_BASE}/organizations/finance`, { withCredentials: true }),
};