import axios, { AxiosError } from "axios";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const API_BASE = "/api"

export const eventApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// -- Silent refresh-and-retry on 401, same dedupe pattern as the main api.ts --

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
        return eventApi(originalRequest); // retry the original request once
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// -- Typed helpers for your three event endpoints --
export interface CreateEventPayload {
  organizationId: string;
  venueBookingId?: string;
  eventName: string;
  description: string;
  eventType: "free" | "paid";
  registrationType: "team" | "individual";
  maxParticipants: number;
  registrationStartDate: string;
  registrationEndDate: string;
  eventDate: string;
  certificateEnabled?: boolean;
  ticketPrice?: number;
  teamSize?: number;
}
export interface UpdateEventPayload {
  eventName?: string;
  description?: string;
  bannerImage?: { url: string; publicId: string };
  eventType?: "free" | "paid";
  registrationType?: "team" | "individual";
  maxParticipants?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  eventDate?: string;
  certificateEnabled?: boolean;
  ticketPrice?: number;
  teamSize?: number;
}
export interface EventRecord extends CreateEventPayload {
  _id: string;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const eventService = {
  create: (payload: CreateEventPayload) =>
    eventApi.post("/events", payload).then((res) => res.data),

  publish: (id: string) =>
    eventApi.patch(`/events/${id}/publish`).then((res) => res.data),

  list: () =>
    eventApi.get("/events").then((res) => res.data),
    getById: (id: string) =>
    eventApi.get(`/events/${id}`).then((res) => res.data),

  update: (id: string, payload: UpdateEventPayload) =>
    eventApi.patch(`/events/${id}`, payload).then((res) => res.data),

  remove: (id: string) =>
    eventApi.delete(`/events/${id}`).then((res) => res.data),

   byOrganization: () =>
    eventApi.get("/events/organization").then((res) => res.data),

  
};