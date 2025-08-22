// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/queryClient"; // apiClient 임포트 추가

export function useAuth() {
  const { data: user, isLoading, refetch, error } = useQuery<User | null>({
    queryKey: ["/auth/user"],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/auth/user", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) return null;      // 비로그인으로 처리
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
  return { user, isLoading, refetch, error, isAuthenticated: !!user, isAdmin: user?.isAdmin };
}
