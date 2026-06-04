'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconRefresh,
  IconRobot,
  IconSend,
  IconSparkles,
  IconUser,
} from '@tabler/icons-react';
import type { ChatContext, ChatMessage, ChatSource } from '@/lib/api/planting';
import { fetchPlantingChat } from '@/lib/api/planting';
import { AFTER_RECO_CHIPS, STARTER_CHIPS } from '@/lib/planting/options';
import {
  clearChat,
  loadChat,
  loadPlantingInput,
  loadPlantingResult,
  saveChat,
} from '@/lib/planting/storage';
import { QuickReplyChips } from '@/components/planting/QuickReplyChips';

export default function PlantingChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chips, setChips] = useState<string[]>(STARTER_CHIPS);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 경로 A: 추천 결과 컨텍스트 캐리. 없으면 경로 B(스타터).
  const context = useMemo<ChatContext | null>(() => {
    if (typeof window === 'undefined') return null;
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
      const names = recos.slice(0, 3).map((r) => r.name).join(', ');
      setMessages([
        {
          role: 'assistant',
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
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    saveChat(next);
    setDraft('');
    setSending(true);
    try {
      const res = await fetchPlantingChat(next, context);
      const after: ChatMessage[] = [...next, { role: 'assistant', content: res.answer }];
      setMessages(after);
      saveChat(after);
      setChips(res.chips);
      setSources(res.sources);
    } catch {
      const after: ChatMessage[] = [
        ...next,
        { role: 'assistant', content: '죄송해요, 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' },
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
    setSources([]);
    setChips(context?.recommendations?.length ? AFTER_RECO_CHIPS : STARTER_CHIPS);
  };

  return (
    <Box
      bg="gray.0"
      py={{ base: 16, md: 24 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        // 헤더(스크롤 시 높이 변동)보다 넉넉히 빼 창 스크롤을 0으로 → 헤더 진동 루프 차단.
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      <Container
        size="sm"
        style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', minHeight: 0 }}
      >
        <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
          <Group justify="space-between" align="center">
            <UnstyledButton component={Link} href="/planting">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  추천으로
                </Text>
              </Group>
            </UnstyledButton>
            <Group gap="xs">
              <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
                작목 상담 챗봇
              </Badge>
              <ActionIcon variant="subtle" color="gray" onClick={reset} title="대화 초기화">
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>
          </Group>

          <Box>
            <Title order={4}>무엇이든 물어보세요</Title>
            <Text c="dimmed" size="xs" mt={2}>
              농사로 매트릭스와 텃밭 재배지식을 근거로 답합니다. 참고용으로 활용하세요.
            </Text>
          </Box>

          <Stack ref={listRef} gap="sm" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {ready &&
              messages.map((m, i) => <Bubble key={i} message={m} />)}
            {sending && (
              <Group gap="xs">
                <Avatar role="assistant" />
                <Paper p="sm" radius="lg" bg="white" withBorder>
                  <Loader size="xs" color="green" type="dots" />
                </Paper>
              </Group>
            )}
          </Stack>

          {sources.length > 0 && (
            <Group gap={6}>
              <Text size="xs" c="dimmed">
                출처:
              </Text>
              {sources.map((s) => (
                <Badge key={s.crop_id} size="xs" variant="light" color="green">
                  {s.name}
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
                if (e.key === 'Enter' && !e.shiftKey) {
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
      </Container>
    </Box>
  );
}

function Avatar({ role }: { role: ChatMessage['role'] }) {
  const isUser = role === 'user';
  return (
    <ThemeIcon size={28} radius="xl" variant="light" color={isUser ? 'gray' : 'green'}>
      {isUser ? <IconUser size={15} /> : <IconRobot size={15} />}
    </ThemeIcon>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <Group gap="xs" align="flex-start" justify={isUser ? 'flex-end' : 'flex-start'} wrap="nowrap">
      {!isUser && <Avatar role="assistant" />}
      <Paper
        p="sm"
        radius="lg"
        maw="78%"
        withBorder={!isUser}
        bg={isUser ? 'green.6' : 'white'}
      >
        <Text size="sm" c={isUser ? 'white' : undefined} lh={1.6} style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Text>
      </Paper>
      {isUser && <Avatar role="user" />}
    </Group>
  );
}
