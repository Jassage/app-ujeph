import { create } from "zustand";
import api from "../services/api";
import { Event } from "../types/academic";

interface EventState {
  events: Event[];
  upcomingEvents: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  createEvent: (eventData: Omit<Event, "id" | "createdAt">) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (eventId: string, userId: string) => Promise<void>;
}

interface EventFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  upcomingEvents: [],
  currentEvent: null,
  loading: false,
  error: null,

  fetchEvents: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/events?${params}`);
      set({ events: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      throw error;
    }
  },

  fetchUpcomingEvents: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/events/public/upcoming");
      set({ upcomingEvents: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      throw error;
    }
  },

  fetchEventById: async (id: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/events/${id}`);
      set({ currentEvent: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      throw error;
    }
  },

  createEvent: async (eventData) => {
    set({ loading: true });
    try {
      const response = await api.post("/events", eventData);
      set((state) => ({
        events: [...state.events, response.data],
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de création",
        loading: false,
      });
      throw error;
    }
  },

  updateEvent: async (id, eventData) => {
    set({ loading: true });
    try {
      const response = await api.put(`/events/${id}`, eventData);
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? response.data : event
        ),
        currentEvent:
          state.currentEvent?.id === id ? response.data : state.currentEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de modification",
        loading: false,
      });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/events/${id}`);
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de suppression",
        loading: false,
      });
      throw error;
    }
  },

  registerForEvent: async (eventId, userId) => {
    set({ loading: true });
    try {
      const response = await api.post(`/events/${eventId}/register`, {
        userId,
      });
      set((state) => ({
        currentEvent:
          state.currentEvent?.id === eventId
            ? response.data
            : state.currentEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur d'inscription",
        loading: false,
      });
      throw error;
    }
  },
}));
