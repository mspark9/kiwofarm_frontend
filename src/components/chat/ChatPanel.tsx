"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconRefresh,
  IconRobot,
  IconSend,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";
import type { ChatContext, ChatMessage } from "@/lib/api/planting";
import { fetchPlantingChat } from "@/lib/api/planting";
import { AFTER_RECO_CHIPS, STARTER_CHIPS } from "@/lib/planting/options";
import {
  clearChat,
  loadChat,
  loadPlantingInput,
  loadPlantingResult,
  saveChat,
} from "@/lib/planting/storage";
import { QuickReplyChips } from "@/components/planting/QuickReplyChips";

// 챗봇 상담 본체. 페이지(/planting/chat)와 헤더 모달에서 공용으로 사용.
// 두 진입점이 같은 localStorage 세션을 공유하므로 대화가 자연스럽게 이어진다.
export function ChatPanel({ style }: { style?: CSSProperties }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chips, setChips] = useState<string[]>(STARTER_CHIPS);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 경로 A: 추천 결과 컨텍스트 캐리. 없으면 경로 B(스타터).
  const context = useMemo<ChatContext | null>(() => {
    if (typeof window === "undefined") return null;
    const input = loadPlantingInput();
    const result = loadPlantingResult();
    if (!input && !result) return null;
    return {
      user_input: input ?? undefined,
      recommendations: result?.recommendations.map((r) => ({
        crop_id: r.crop_id,
        name: r.name,
      })),
    };
  }, []);

  // 최초 진입: 저장된 세션 복원, 없으면 컨텍스트 유무로 인사 + 칩 설정.
  useEffect(() => {
    const saved = loadChat();
    if (saved.length > 0) {
      setMessages(saved);
      setChips(AFTER_RECO_CHIPS);
      setReady(true);
      return;
    }
    const recos = context?.recommendations ?? [];
    if (recos.length > 0) {
      const names = recos
        .slice(0, 3)
        .map((r) => r.name)
        .join(", ");
      setMessages([
        {
          role: "assistant",
          content: `추천 결과를 바탕으로 상담해 드릴게요. 이번 달 추천 작물은 ${names} 등이에요. 궁금한 점을 물어보거나 아래 버튼을 눌러 보세요.`,
        },
      ]);
      setChips(AFTER_RECO_CHIPS);
    } else {
      setChips(STARTER_CHIPS);
    }
    setReady(true);
  }, [context]);

  // 메시지 영역 내부만 맨 아래로(창 전체 스크롤 금지 → 화면 흔들림 방지).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    saveChat(next);
    setDraft("");
    setSending(true);
    try {
      const res = await fetchPlantingChat(next, context);
      const after: ChatMessage[] = [
        ...next,
        { role: "assistant", content: res.answer },
      ];
      setMessages(after);
      saveChat(after);
      setChips(res.chips);
      setDataSources(res.dataSources ?? []);
    } catch {
      const after: ChatMessage[] = [
        ...next,
        {
          role: "assistant",
          content:
            "죄송해요, 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        },
      ];
      setMessages(after);
      saveChat(after);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    clearChat();
    setMessages([]);
    setDataSources([]);
    setChips(
      context?.recommendations?.length ? AFTER_RECO_CHIPS : STARTER_CHIPS,
    );
  };

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, ...style }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Group gap="xs" mb={4}>
            <Title order={4}>무엇이든 물어보세요</Title>
            <Badge
              variant="light"
              color="green"
              leftSection={<IconSparkles size={12} />}
            >
              작목 상담 챗봇
            </Badge>
          </Group>
          <Text c="dimmed" size="xs">
            농사로 매트릭스와 텃밭 재배지식을 근거로 답합니다. 참고용으로
            활용하세요.
          </Text>
        </Box>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={reset}
          title="대화 초기화"
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      <Stack
        ref={listRef}
        gap="sm"
        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      >
        {ready && messages.map((m, i) => <Bubble key={i} message={m} />)}
        {sending && (
          <Group gap="xs">
            <Avatar role="assistant" />
            <Paper p="sm" radius="lg" bg="white" withBorder>
              <Loader size="xs" color="green" type="dots" />
            </Paper>
          </Group>
        )}
      </Stack>

      {dataSources.length > 0 && (
        <Group gap={6} wrap="wrap">
          <Text size="xs" c="dimmed">
            출처:
          </Text>
          {dataSources.map((d) => (
            <Badge key={d} size="xs" variant="light" color="teal">
              {d}
            </Badge>
          ))}
        </Group>
      )}

      <QuickReplyChips chips={chips} onSelect={send} disabled={sending} />

      <Group gap="xs" align="flex-end">
        <Textarea
          flex={1}
          autosize
          minRows={1}
          maxRows={4}
          radius="md"
          placeholder="예: 상추 화분 크기는 어느 정도가 좋아요?"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          disabled={sending}
        />
        <ActionIcon
          size={42}
          radius="md"
          color="green"
          variant="filled"
          onClick={() => send(draft)}
          disabled={sending || !draft.trim()}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}

function Avatar({ role }: { role: ChatMessage["role"] }) {
  const isUser = role === "user";
  return (
    <ThemeIcon
      size={28}
      radius="xl"
      variant="light"
      color={isUser ? "gray" : "green"}
    >
      {isUser ? <IconUser size={15} /> : <IconRobot size={15} />}
    </ThemeIcon>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <Group
      gap="xs"
      align="flex-start"
      justify={isUser ? "flex-end" : "flex-start"}
      wrap="nowrap"
    >
      {!isUser && <Avatar role="assistant" />}
      <Paper
        p="sm"
        radius="lg"
        maw="78%"
        withBorder={!isUser}
        bg={isUser ? "green.6" : "white"}
      >
        <Text
          size="sm"
          c={isUser ? "white" : undefined}
          lh={1.6}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {message.content}
        </Text>
      </Paper>
      {isUser && <Avatar role="user" />}
    </Group>
  );
}
