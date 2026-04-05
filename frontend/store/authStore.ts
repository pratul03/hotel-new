import { create } from "zustand";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: User) => void;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  login: (user) => set({ user, isAuthenticated: true, isHydrated: true }),
  setUser: (user) => set({ user, isAuthenticated: !!user, isHydrated: true }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  logout: () => set({ user: null, isAuthenticated: false, isHydrated: true }),
}));
