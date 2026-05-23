import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // Bypass login: keep a default Farm Admin active by default
  user: {
    name: "Farm Administrator",
    email: "admin@pinaka.com",
    role: "Admin",
    status: "Active"
  },
  token: "local_bypass_token",
  isAuthenticated: true,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Resolves instantly on browser load
  initSession: async () => {
    set({ isAuthenticated: true, loading: false });
  },

  // Local login mock: succeeds instantly
  login: async (email, password) => {
    set({ loading: true, error: null });
    const mockUser = {
      name: "Farm Administrator",
      email: email || "admin@pinaka.com",
      role: "Admin",
      status: "Active"
    };
    set({ 
      user: mockUser, 
      token: "local_bypass_token", 
      isAuthenticated: true, 
      loading: false 
    });
    return mockUser;
  },

  // Local signup mock: succeeds instantly
  signup: async (name, email, password, role) => {
    set({ loading: true, error: null });
    const mockUser = {
      name: name || "Farm Administrator",
      email: email || "admin@pinaka.com",
      role: role || "Admin",
      status: "Active"
    };
    set({ 
      user: mockUser, 
      token: "local_bypass_token", 
      isAuthenticated: true, 
      loading: false 
    });
    return mockUser;
  },

  // Local logout: resets state but keeps bypass available
  logout: () => {
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      error: null 
    });
  }
}));
