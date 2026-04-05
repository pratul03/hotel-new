"use client";

import { ReactNode, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const response = await axiosInstance.get("/auth/me");
        if (!active) return;

        setUser(response.data?.data ?? null);
      } catch {
        if (!active) return;
        logout();
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [setUser, logout, setHydrated]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
