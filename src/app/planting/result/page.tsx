'use client';

// 위저드 플로우 검증용 최소 결과 화면. 정식 추천카드(미니 캘린더·작물 상세 링크)는 다음 단계.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  List,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendarPlus,
  IconChecks,
  IconMessageCircle,
  IconSparkles,
} from '@tabler/icons-react';
import type { AiExplain, PlantingInput, RecommendationItem } from '@/lib/api/planting';
import { fetchPlantingExplains, fetchPlantingRecommend } from '@/lib/api/planting';
import type { CarryCrop } from '@/lib/planting/storage';
import {
  loadPlantingInput,
  savePlantingCarryCrops,
  savePlantingResult,
} from '@/lib/planting/storage';

const ACTION_COLOR: Record<string, string> = {
  파종: 'green',
  정식: 'teal',
  관리: 'gray',
  수확: 'orange',
};

export default function PlantingResultPage() {
  const router = useRouter();
  const [input, setInput] = useState<PlantingInput | null | undefined>(undefined);
  // 캘린더로 함께 넘길 작물(crop_id) 다중 선택.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setInput(loadPlantingInput());
  }, []);

  const query = useQuery({
    queryKey: ['planting-recommend', input],
    queryFn: () => fetchPlantingRecommend(input as PlantingInput),
    enabled: !!input,
  });

  // AI 설명은 추천 렌더를 막지 않도록 별도 쿼리로 비동기 로드. 추천이 도착한 뒤
  // 활성화되며, 실패해도(설명 없음) 추천 표시에는 영향 없다.
  const explainQuery = useQuery({
    queryKey: ['planting-explains', input],
    queryFn: () => fetchPlantingExplains(input as PlantingInput),
    enabled: !!input && !!query.data,
    retry: 1,
  });
  const explains = explainQuery.data;

  // 추천 결과를 보관 → 챗봇 경로 A 컨텍스트 캐리.
  useEffect(() => {
    if (query.data) savePlantingResult(query.data);
  }, [query.data]);

  const toggle = (cropId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cropId)) next.delete(cropId);
      else next.add(cropId);
      return next;
    });

  // 선택한 작물들을 세션에 담아 캘린더로 이동(추천받기 조건도 함께 캐리).
  const goCalendar = () => {
    const crops: CarryCrop[] = (query.data?.recommendations ?? [])
      .filter((r) => selected.has(r.crop_id))
      .map((r) => ({ code: r.crop_id, name: r.name, category: r.category }));
    if (crops.length === 0) return;
    savePlantingCarryCrops(crops);
    router.push('/calendar?from=planting');
  };

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Button
              component={Link}
              href="/planting"
              variant="subtle"
              color="gray"
              size="sm"
              leftSection={<IconArrowLeft size={14} />}
            >
              조건 다시 입력
            </Button>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              심기 추천 결과
            </Badge>
          </Group>

          {input === null && (
            <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
              입력 정보가 없습니다. 먼저 조건을 입력해 주세요.
              <Box mt="sm">
                <Button component={Link} href="/planting" size="xs" color="green">
                  조건 입력하러 가기
                </Button>
              </Box>
            </Alert>
          )}

          {query.isLoading && input && (
            <Group justify="center" py="xl">
              <Loader color="green" />
              <Text c="dimmed" size="sm">
                매트릭스로 적기 작물을 고르는 중…
              </Text>
            </Group>
          )}

          {query.isError && (
            <Alert color="red" icon={<IconAlertTriangle size={16} />}>
              추천을 불러오지 못했습니다. 백엔드 상태를 확인하고 다시 시도해 주세요.
            </Alert>
          )}

          {query.data && (
            <>
              <Box>
                <Title order={3} fz={{ base: 22, md: 26 }} fw={800}>
                  {query.data.month}월 · {query.data.zone} 기준 추천
                </Title>
                <Text c="dimmed" size="sm" mt={4}>
                  매트릭스가 고른 적기 작물 {query.data.recommendations.length}종입니다.
                </Text>
              </Box>

              <Stack gap="md">
                {query.data.recommendations.map((it, idx) => (
                  <CropCard
                    key={it.crop_id}
                    item={it}
                    rank={idx + 1}
                    explain={explains?.[it.crop_id] ?? it.ai_explain ?? null}
                    explainLoading={explainQuery.isFetching && !explains}
                    checked={selected.has(it.crop_id)}
                    onToggle={() => toggle(it.crop_id)}
                  />
                ))}
              </Stack>

              {query.data.next_month_candidates.length > 0 && (
                <Card radius="md" p="sm" withBorder bg="gray.0">
                  <Text size="xs" c="dimmed">
                    다음 달 가능: {query.data.next_month_candidates.join(', ')}
                  </Text>
                </Card>
              )}

              <Button
                color="green"
                size="md"
                leftSection={<IconCalendarPlus size={18} />}
                disabled={selected.size === 0}
                onClick={goCalendar}
              >
                {selected.size > 0
                  ? `선택한 ${selected.size}개로 캘린더 만들기`
                  : '작물을 선택하면 캘린더를 만들 수 있어요'}
              </Button>

              <Button
                component={Link}
                href="/planting/chat"
                color="green"
                variant="light"
                size="md"
                leftSection={<IconMessageCircle size={16} />}
              >
                이 결과로 챗봇 상담하기
              </Button>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function CropCard({
  item,
  rank,
  explain,
  explainLoading,
  checked,
  onToggle,
}: {
  item: RecommendationItem;
  rank: number;
  explain: AiExplain | null;
  explainLoading: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const actions = Array.from(new Set(item.calendar_this_month.map((a) => a.action)));
  const [dMin, dMax] = item.days_to_harvest;
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      bg={checked ? 'green.0' : 'white'}
      style={{ borderColor: checked ? 'var(--mantine-color-green-5)' : undefined }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" color="green" variant="light">
              <Text fw={800} size="sm">
                {rank}
              </Text>
            </ThemeIcon>
            <Box>
              <Group gap={6}>
                <Title order={4}>{item.name}</Title>
                <Badge size="sm" variant="light" color="green">
                  {item.category}
                </Badge>
                <Badge size="sm" variant="light" color="gray">
                  난이도 {item.difficulty}/3
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                수확까지 {dMin}~{dMax}일 · {item.source}
                {item.needs_review ? ' · AI보강(검수전)' : ''}
              </Text>
            </Box>
          </Group>
          <Badge size="lg" color="green" variant="filled">
            {item.score}점
          </Badge>
        </Group>

        <Group gap={6}>
          {item.plantable_now ? (
            <Badge color="green" variant="dot">
              이번 달 심기 가능
            </Badge>
          ) : item.plantable_next ? (
            <Badge color="teal" variant="dot">
              다음 달 가능
            </Badge>
          ) : null}
          {actions.map((a) => (
            <Badge key={a} size="sm" color={ACTION_COLOR[a] ?? 'gray'} variant="light">
              {a}
            </Badge>
          ))}
        </Group>

        {item.reasons.length > 0 && (
          <Group gap={6}>
            {item.reasons.map((r) => (
              <Badge key={r} size="sm" variant="outline" color="gray" radius="sm">
                {r}
              </Badge>
            ))}
          </Group>
        )}

        {explain ? (
          <Card radius="md" p="sm" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-2)' }}>
            <Stack gap={6}>
              <Text size="sm" lh={1.6}>
                {explain.reason}
              </Text>
              {explain.tips.length > 0 && (
                <List size="xs" spacing={2} icon={<IconChecks size={12} color="var(--mantine-color-green-7)" />}>
                  {explain.tips.map((t) => (
                    <List.Item key={t}>{t}</List.Item>
                  ))}
                </List>
              )}
              {explain.first_month_todo.length > 0 && (
                <Text size="xs" c="green.9">
                  첫 달 할 일: {explain.first_month_todo.join(' · ')}
                </Text>
              )}
            </Stack>
          </Card>
        ) : explainLoading ? (
          <Group gap={6} c="dimmed">
            <Loader size="xs" color="green" />
            <Text size="xs">AI 맞춤 설명 생성 중…</Text>
          </Group>
        ) : null}

        <Checkbox
          checked={checked}
          onChange={onToggle}
          color="green"
          label="캘린더에 추가"
          styles={{ label: { fontWeight: 600, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
        />
      </Stack>
    </Card>
  );
}
