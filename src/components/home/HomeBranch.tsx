"use client";

// 홈("/")을 로그인 여부로 분기하는 클라이언트 래퍼. 홈은 공개 라우트(게이팅 제외)라
// 게스트는 마케팅 랜딩을 본다. 로그인 사용자는 별도 홈(/home)으로 보낸다.
// ready 전(SSR/하이드레이션 직후)에는 게스트 화면을 보여 서버 렌더와 일치시킨다.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth/AuthProvider";

// 로그인이면 /home 으로 리다이렉트, 아니면 전달된 마케팅 히어로(children).
export function HomeHeroSwitch({ children }: { children: ReactNode }) {
  const { ready, username } = useAuthModal();
  const router = useRouter();
  useEffect(() => {
    if (ready && username) router.replace("/home");
  }, [ready, username, router]);
  if (ready && username) return null; // 리다이렉트 중
  return <>{children}</>;
}

// 비로그인일 때만 children 을 렌더(로그인 사용자에겐 마케팅 섹션 숨김).
export function GuestOnly({ children }: { children: ReactNode }) {
  const { ready, username } = useAuthModal();
  if (ready && username) return null;
  return <>{children}</>;
}
