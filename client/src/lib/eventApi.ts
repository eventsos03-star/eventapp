import axios, { AxiosError } from "axios";

const API_BASE = "/api";

export const eventApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

eventApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return eventApi(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export interface CreateEventPayload {
  organizationId: string;
  venueId?: string;
  eventName: string;
  description: string;
  eventType: "free" | "paid";
  registrationType: "team" | "individual";
  maxParticipants: number;
  registrationStartDate: string;
  registrationEndDate: string;
  eventDate: string;
  eventEndDate?: string;
  certificateEnabled?: boolean;
  ticketPrice?: number;
  teamSize?: number;
  bannerImage?: { url: string; key?: string; publicId?: string };
}

export interface UpdateEventPayload {
  eventName?: string;
  description?: string;
  bannerImage?: { url: string; key?: string; publicId?: string };
  eventType?: "free" | "paid";
  registrationType?: "team" | "individual";
  maxParticipants?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  eventDate?: string;
  eventEndDate?: string;
  certificateEnabled?: boolean;
  ticketPrice?: number;
  teamSize?: number;
}

export interface VenueAvailability {
  startDate: string;
  endDate: string;
  status: "approved" | "pending";
}

export interface EventRecord extends CreateEventPayload {
  _id: string;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  registeredCount: number;
  availableSeats: number;
  isFull: boolean;
}

export const eventService = {
  create: (payload: CreateEventPayload | FormData) => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    return eventApi
      .post("/events", payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
      })
      .then((res) => res.data);
  },

  publish: (id: string) =>
    eventApi.patch(`/events/${id}/publish`).then((res) => res.data),

  list: () =>
    eventApi.get("/events").then((res) => res.data),

  getById: (id: string) =>
    eventApi.get(`/events/${id}`).then((res) => res.data),

    update: (id: string, payload: UpdateEventPayload | FormData) => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    return eventApi
      .patch(`/events/${id}`, payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      })
      .then((res) => res.data);
  },

  remove: (id: string) =>
    eventApi.delete(`/events/${id}`).then((res) => res.data),

  byOrganization: () =>
    eventApi.get("/events/organization").then((res) => res.data),

  publicList: (params?: {
    search?: string;
    page?: number;
    limit?: number;
    location?: string;
    eventType?: "free" | "paid";
    sort?: "upcoming" | "latest" | "price-low" | "price-high";
  }) =>
    eventApi.get("/events/public", { params }).then((res) => res.data),

  publicGetById: (id: string) =>
    eventApi.get(`/events/public/${id}`).then((res) => res.data),

  getVenueAvailability: (venueId: string) =>
    eventApi
      .get(`/venue-bookings/venue/${venueId}/availability`)
      .then((res) => res.data),
};