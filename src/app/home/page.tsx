"use client";

// 로그인 후 홈(/home) — 진입 시 대시보드(인사·현황·내 팜·출석·키우는 작물·빠른 이동).
// RouteGuard 가 비로그인 접근을 막으므로 username 은 보장되지만, ready 전/누락 시
// 안전하게 빈 화면을 반환한다.

import { useAuthModal } from "@/components/auth/AuthProvider";
import { DashboardHero } from "@/components/home/DashboardHero";

export default function HomePage() {
  const { username } = useAuthModal();
  if (!username) return null;
  return <DashboardHero username={username} />;
}
