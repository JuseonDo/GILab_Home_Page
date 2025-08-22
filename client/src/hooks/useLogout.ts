import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return () => {
    // 1) 토큰 제거
    localStorage.removeItem("access_token");

    // 2) 현재 사용자 캐시 null로
    queryClient.setQueryData(["/auth/user"], null);
    // 혹시 모를 곳도 무효화
    queryClient.invalidateQueries({ queryKey: ["/auth/user"] });

    // 3) 홈으로 보내기(원하면 /login 등으로)
    setLocation("/");
  };
}