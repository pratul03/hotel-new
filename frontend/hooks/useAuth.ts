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
  token: string;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await axiosInstance.post<AuthResponse>(
        "/auth/login",
        payload,
      );
      return data;
    },
    onSuccess: ({ user, token }) => {
      login(user, token);
      router.push("/");
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await axiosInstance.post<AuthResponse>(
        "/auth/register",
        payload,
      );
      return data;
    },
    onSuccess: ({ user, token }) => {
      login(user, token);
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
