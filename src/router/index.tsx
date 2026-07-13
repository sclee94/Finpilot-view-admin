import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";
import { authStorage } from "../utils/auth";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

// 로그인 없이 접근 가능한 경로 — 이 외 경로는 세션 없으면 여기로 리다이렉트
const PUBLIC_PATHS = ["/", "/login"];

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  }, [navigate]);

  const user = authStorage.get();
  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  // 세션 없이 보호된 경로 접근 -> 로그인 페이지로
  if (!user && !isPublicPath) {
    return <Navigate to="/" replace />;
  }

  // 세션 있는 상태로 로그인 페이지 접근 -> 자동 로그인 (권한별 랜딩 페이지로)
  if (user && isPublicPath) {
    const target =
      user.status === 0 || user.status === -1 ? "/blocked" :
      user.permission === 1 ? "/reports" : "/dashboard";
    return <Navigate to={target} replace />;
  }

  return element;
}
