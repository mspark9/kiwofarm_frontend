// 사이트 공통 푸터. 마케팅 홈(/)과 로그인 홈(/home)에서 동일하게 쓴다.

import Link from "next/link";
import { Anchor, Box, Container, Group, Stack, Text } from "@mantine/core";

export function SiteFooter() {
  return (
    <Box py="xl" bg="white" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
      <Container size="xl">
        <Group justify="space-between" wrap="wrap" gap="md" align="flex-start">
          <Stack gap={6}>
            <Group gap={8}>
              {/* 헤더와 동일한 앱 아이콘 SVG(투명 배경) — 정적이라 일반 img. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/app-icon.svg"
                alt="키워팜"
                width={28}
                height={28}
                style={{ display: "block" }}
              />
              <Text fw={800}>키워팜</Text>
            </Group>
            <Text size="xs" c="dimmed">
              © 2026 KiwoFarm · 공공데이터 활용 AI 텃밭 플랫폼
            </Text>
          </Stack>
          <Group gap="lg">
            <Anchor component={Link} href="/#features" size="sm" c="dimmed">
              기능
            </Anchor>
            <Anchor component={Link} href="/planting" size="sm" c="dimmed">
              추천받기
            </Anchor>
            <Anchor component={Link} href="/calendar" size="sm" c="dimmed">
              텃밭 캘린더
            </Anchor>
            <Anchor size="sm" c="dimmed" href="https://www.kiwofarm.store">
              kiwofarm.store
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
