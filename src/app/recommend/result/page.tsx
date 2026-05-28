'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  GridCol,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconChartLine,
  IconSparkles,
  IconStarFilled,
  IconStar,
} from '@tabler/icons-react';
import type { CropPhase, CropRecommendation, Mode } from '@/lib/types';
import { PHASE_COLOR, PHASE_LABEL, getRecommendations } from '@/lib/recommend/mock';

const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function ResultInner() {
  const params = useSearchParams();
  const router = useRouter();
  const mode: Mode = params.get('mode') === 'weekend' ? 'weekend' : 'returning';
  const recommendations = useMemo(() => getRecommendations(mode), [mode]);

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/onboarding">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  조건 다시 입력
                </Text>
              </Group>
            </UnstyledButton>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              XGBoost · 우수농가 112호 매칭
            </Badge>
          </Group>

          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              {mode === 'returning' ? '귀농 모드 추천' : '주말농장 모드 추천'}
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
              조건에 맞는{' '}
              <Text span inherit c="green.7">
                작목 TOP 3
              </Text>{' '}
              입니다
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              {mode === 'returning'
                ? '입력하신 지역·자본·시설 기준으로 우수농가 데이터와 매칭한 결과입니다. 카드를 눌러 1년 시뮬레이션을 확인해 보세요.'
                : '주말 방문 빈도와 면적 기준으로 가족 소비·직거래에 적합한 작목을 가려냈습니다.'}
            </Text>
          </Box>

          <Grid gutter="lg">
            {recommendations.map((rec, idx) => (
              <GridCol key={rec.cropId} span={{ base: 12, md: 4 }}>
                <RecommendationCard rec={rec} mode={mode} rank={idx + 1} />
              </GridCol>
            ))}
          </Grid>

          <Card radius="md" p="md" withBorder bg="white">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size={28} radius="xl" color="gray" variant="light">
                  <IconChartLine size={14} />
                </ThemeIcon>
                <Text size="sm" c="gray.7">
                  추천 결과는 우수농가 사례 평균값 기반의 참고 수치입니다.
                </Text>
              </Group>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/onboarding')}
                leftSection={<IconArrowLeft size={14} />}
              >
                조건 바꿔서 다시 추천
              </Button>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default function RecommendResultPage() {
  return (
    <Suspense
      fallback={
        <Box bg="gray.0" mih="100vh" py={48}>
          <Container size="xl">
            <Text c="dimmed">불러오는 중…</Text>
          </Container>
        </Box>
      }
    >
      <ResultInner />
    </Suspense>
  );
}

function RecommendationCard({
  rec,
  mode,
  rank,
}: {
  rec: CropRecommendation;
  mode: Mode;
  rank: number;
}) {
  return (
    <Card
      radius="lg"
      withBorder
      p={0}
      h="100%"
      style={{
        background: 'white',
        overflow: 'hidden',
        borderColor: 'var(--mantine-color-gray-2)',
      }}
    >
      <Box
        p="lg"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${rec.color}-1), var(--mantine-color-${rec.color}-0))`,
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Box
              w={56}
              h={56}
              style={{
                borderRadius: 14,
                background: 'white',
                display: 'grid',
                placeItems: 'center',
                fontSize: 32,
                boxShadow: '0 6px 14px -8px rgba(0,0,0,0.18)',
              }}
            >
              {rec.emoji}
            </Box>
            <Stack gap={2}>
              <Group gap={6}>
                <Badge color={rec.color} variant="filled" radius="sm" size="sm">
                  TOP {rank}
                </Badge>
                <Badge color="gray" variant="light" radius="sm" size="sm">
                  적합도 {rec.matchScore}%
                </Badge>
              </Group>
              <Title order={4} fz={20} mt={2}>
                {rec.name}
              </Title>
              <Difficulty value={rec.difficulty} />
            </Stack>
          </Group>
        </Group>
      </Box>

      <Stack gap="md" p="lg">
        <PrimaryNumber rec={rec} mode={mode} />

        <Box>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={6} style={{ letterSpacing: 0.8 }}>
            AI 추천 이유
          </Text>
          <Text size="sm" lh={1.6} c="gray.8">
            {rec.llmReason}
          </Text>
        </Box>

        <Box>
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              영농 캘린더
            </Text>
            <PhaseLegend />
          </Group>
          <CalendarStrip months={rec.calendar} />
        </Box>

        <Group gap={6} mt={2}>
          {rec.tags.map((t) => (
            <Badge key={t} variant="light" color="gray" radius="sm" size="sm">
              {t}
            </Badge>
          ))}
        </Group>

        <Box mt="auto">
          <Group justify="space-between" mb={10}>
            <Text size="xs" c="dimmed">
              {mode === 'returning' ? '인근 우수농가' : '주말농장 사용자'} {rec.peerFarms}곳 중{' '}
              <Text span fw={700} c="green.7">
                {Math.round((rec.peerFarms * rec.peerAgreeRate) / 100)}곳
              </Text>{' '}
              동일 선택
            </Text>
          </Group>
          <Button
            component={Link}
            href={`/twin/${rec.cropId}?mode=${mode}`}
            fullWidth
            color="green"
            rightSection={<IconArrowRight size={16} />}
          >
            1년 시뮬레이션 보기
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

function PrimaryNumber({ rec, mode }: { rec: CropRecommendation; mode: Mode }) {
  if (mode === 'returning') {
    return (
      <Group gap="lg" align="flex-end">
        <Box>
          <Text size="xs" c="dimmed" mb={2}>
            예상 연 매출
          </Text>
          <Text fz={26} fw={800} lh={1} c="green.8">
            ₩{rec.expectedRevenueManwon.toLocaleString()}
            <Text span size="sm" fw={600} c="dimmed">
              {' '}
              만원
            </Text>
          </Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed" mb={2}>
            예상 순이익
          </Text>
          <Text fz={18} fw={700} lh={1} c="teal.7">
            ₩{rec.expectedNetManwon.toLocaleString()}
            <Text span size="xs" fw={600} c="dimmed">
              {' '}
              만원
            </Text>
          </Text>
        </Box>
      </Group>
    );
  }
  return (
    <Group gap="lg" align="flex-end">
      <Box>
        <Text size="xs" c="dimmed" mb={2}>
          예상 수확량
        </Text>
        <Text fz={26} fw={800} lh={1} c="green.8">
          {rec.expectedYieldKg}
          <Text span size="sm" fw={600} c="dimmed">
            {' '}
            kg / 년
          </Text>
        </Text>
      </Box>
      <Box>
        <Text size="xs" c="dimmed" mb={2}>
          직거래 단가
        </Text>
        <Text fz={18} fw={700} lh={1} c="teal.7">
          ₩{rec.expectedDirectPriceWon.toLocaleString()}
          <Text span size="xs" fw={600} c="dimmed">
            {' '}
            / kg
          </Text>
        </Text>
      </Box>
    </Group>
  );
}

function Difficulty({ value }: { value: number }) {
  return (
    <Group gap={2} mt={2}>
      <Text size="xs" c="dimmed" mr={4}>
        난이도
      </Text>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? (
          <IconStarFilled key={i} size={11} color="var(--mantine-color-yellow-6)" />
        ) : (
          <IconStar key={i} size={11} color="var(--mantine-color-gray-4)" />
        ),
      )}
    </Group>
  );
}

function CalendarStrip({ months }: { months: { month: number; phase: CropPhase }[] }) {
  return (
    <Box>
      <Group gap={3} wrap="nowrap">
        {months.map((m) => (
          <Tooltip key={m.month} label={`${m.month}월 · ${PHASE_LABEL[m.phase]}`} withArrow>
            <Box
              flex={1}
              h={26}
              style={{
                borderRadius: 4,
                background: PHASE_COLOR[m.phase],
                position: 'relative',
                cursor: 'default',
              }}
            />
          </Tooltip>
        ))}
      </Group>
      <Group gap={3} wrap="nowrap" mt={4}>
        {MONTHS.map((m) => (
          <Text key={m} flex={1} ta="center" size="xs" c="dimmed" fz={10}>
            {m}
          </Text>
        ))}
      </Group>
    </Box>
  );
}

function PhaseLegend() {
  const items: CropPhase[] = ['seeding', 'growing', 'harvest'];
  return (
    <Group gap={8} wrap="nowrap">
      {items.map((p) => (
        <Group key={p} gap={3} wrap="nowrap">
          <Box w={8} h={8} style={{ borderRadius: 2, background: PHASE_COLOR[p] }} />
          <Text size="xs" c="dimmed" fz={10}>
            {PHASE_LABEL[p]}
          </Text>
        </Group>
      ))}
    </Group>
  );
}
