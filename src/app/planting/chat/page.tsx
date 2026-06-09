"use client";

import Link from "next/link";
import {
  Box,
  Container,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function PlantingChatPage() {
  return (
    <Box
      bg="gray.0"
      py={{ base: 16, md: 24 }}
      style={{
        display: "flex",
        flexDirection: "column",
        // 헤더(스크롤 시 높이 변동)보다 넉넉히 빼 창 스크롤을 0으로 → 헤더 진동 루프 차단.
        height: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      <Container
        size="sm"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          minHeight: 0,
        }}
      >
        <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
          <UnstyledButton component={Link} href="/planting">
            <Group gap={6}>
              <IconArrowLeft size={14} />
              <Text size="sm" c="dimmed">
                추천으로
              </Text>
            </Group>
          </UnstyledButton>

          <ChatPanel />
        </Stack>
      </Container>
    </Box>
  );
}
