"use client";

// 로그인해야 사용할 수 있는 기능 라우트를 감싸 비로그인 접근을 막는다. layout 에서
// {children} 을 한 번 감싸면 모든 보호 페이지에 일괄 적용된다(페이지별 수정 불필요).
// 인증 상태는 클라이언트(localStorage)에서만 판별되므로 ready 전에는 로딩을 보여
// 게이트 화면이 깜빡이지 않게 한다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Box,
  Button,
  Center,
  Loader,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useAuthModal } from "@/components/auth/AuthProvider";

// 로그인 필요 라우트(접두사). 루트("/")·랜딩은 공개, /home(로그인 후 홈)은 보호.
const PROTECTED_PREFIXES = [
  "/home",
  "/planting",
  "/cultivation",
  "/calendar",
  "/collection",
  "/badges",
  "/community",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, username, openLogin } = useAuthModal();

  if (!pathname || !isProtected(pathname)) return <>{children}</>;

  // 판별 전: 로딩(게이트/콘텐츠 깜빡임 방지).
  if (!ready) {
    return (
      <Center mih="60vh">
        <Loader color="green" />
      </Center>
    );
  }

  if (!username) {
    return (
      <Center mih="70vh" px="md">
        <Stack align="center" gap="lg" maw={360}>
          <ThemeIcon size={64} radius="xl" variant="light" color="green">
            <IconLock size={30} />
          </ThemeIcon>
          <Box ta="center">
            <Text fw={800} fz={22}>
              로그인이 필요합니다
            </Text>
            <Text c="dimmed" size="sm" mt={6} lh={1.6}>
              이 기능은 로그인 후 이용할 수 있어요. 로그인하면 작목 추천·캘린더·도감을
              계정에 보관하고 어디서든 이어볼 수 있습니다.
            </Text>
          </Box>
          <Button color="green" size="md" fullWidth onClick={openLogin}>
            로그인 / 회원가입
          </Button>
          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            size="sm"
          >
            홈으로 돌아가기
          </Button>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
