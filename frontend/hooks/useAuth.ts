"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/user";

interface LoginPayload {
  email: string;
  password: string;
}
interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
interface AuthResponse {
  user: User;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await axiosInstance.post("/auth/login", payload);
      return response.data.data as AuthResponse;
    },
    onSuccess: ({ user }) => {
      login(user);
      router.push("/");
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await axiosInstance.post("/auth/register", payload);
      return response.data.data as AuthResponse;
    },
    onSuccess: ({ user }) => {
      login(user);
      router.push("/");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return () => {
    axiosInstance.post("/auth/logout").catch(() => {});
    logout();
    router.push("/login");
  };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}
