"use client";

// 홈 히어로·하단 CTA 버튼. 비로그인이면 로그인/회원가입 모달을 띄우고, 로그인 상태면
// 바로 작목 추천으로 이동한다. 홈은 서버 컴포넌트라 onClick을 쓰려고 분리한 조각.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Group } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { useAuthModal } from "@/components/auth/AuthProvider";

export function HomeCta({
  variant,
  groupClassName,
}: {
  variant: "hero" | "final";
  groupClassName?: string;
}) {
  const router = useRouter();
  const { username, openLogin } = useAuthModal();

  const start = () => {
    if (username) router.push("/planting");
    else openLogin();
  };

  if (variant === "hero") {
    return (
      <Group gap="md" mt="xs" className={groupClassName}>
        <Button
          size="lg"
          color="green"
          radius="md"
          rightSection={<IconArrowRight size={18} />}
          styles={{ root: { boxShadow: "0 10px 24px -10px rgba(34,139,84,0.55)" } }}
          onClick={start}
        >
          지금 추천받기
        </Button>
        <Button component={Link} href="/#features" variant="default" size="lg" radius="md">
          기능 둘러보기
        </Button>
      </Group>
    );
  }

  return (
    <Group gap="sm" mt="sm" className={groupClassName}>
      <Button
        size="xl"
        radius="md"
        color="white"
        c="green.8"
        variant="white"
        rightSection={<IconArrowRight size={20} />}
        onClick={start}
      >
        지금 시작하기
      </Button>
      {/* '텃밭 캘린더 보기' 버튼 임시 비활성화(로그인 게이팅 적용 전까지 주석 처리)
      <Button
        component={Link}
        href="/calendar"
        size="xl"
        radius="md"
        variant="outline"
        styles={{
          root: {
            borderColor: "rgba(255,255,255,0.55)",
            color: "white",
            background: "transparent",
          },
        }}
      >
        텃밭 캘린더 보기
      </Button>
      */}
    </Group>
  );
}
