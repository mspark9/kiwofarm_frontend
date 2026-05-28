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
  UnstyledButton,
} from '@mantine/core';
import { AreaChart, BarChart } from '@mantine/charts';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCash,
  IconChartLine,
  IconClock,
  IconRefresh,
  IconRocket,
  IconSparkles,
} from '@tabler/icons-react';
import type { CrisisAlert, Mode, TwinData } from '@/lib/types';
import { ALERT_META, SEVERITY_META, getTwin } from '@/lib/twin/mock';

function TwinInner({ cropId }: { cropId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const mode: Mode = params.get('mode') === 'weekend' ? 'weekend' : 'returning';
  const twin = useMemo(() => getTwin(cropId), [cropId]);

  const netProfit = twin.totalRevenueManwon - twin.totalCostManwon;
  const peakMonth = twin.monthly.reduce((acc, m) =>
    m.revenueManwon > acc.revenueManwon ? m : acc,
  );

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href={`/recommend/result?mode=${mode}`}>
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  추천 결과로
                </Text>
              </Group>
            </UnstyledButton>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              디지털 트윈 · 1년 시뮬레이션
            </Badge>
          </Group>

          <Header twin={twin} peakMonthLabel={peakMonth.month} />

          <Grid gutter="md">
            <GridCol span={{ base: 12, sm: 4 }}>
              <SummaryCard
                icon={<IconCash size={18} />}
                color="green"
                label="예상 연 매출"
                value={`₩${twin.totalRevenueManwon.toLocaleString()}`}
                unit="만원"
              />
            </GridCol>
            <GridCol span={{ base: 12, sm: 4 }}>
              <SummaryCard
                icon={<IconChartLine size={18} />}
                color="teal"
                label="예상 순이익"
                value={`₩${netProfit.toLocaleString()}`}
                unit={`만원 (순이익률 ${Math.round((netProfit / twin.totalRevenueManwon) * 100)}%)`}
              />
            </GridCol>
            <GridCol span={{ base: 12, sm: 4 }}>
              <SummaryCard
                icon={<IconClock size={18} />}
                color="grape"
                label="연 노동시간"
                value={twin.totalLaborHours.toLocaleString()}
                unit={`시간 · 피크 ${twin.peakLaborMonth}월`}
              />
            </GridCol>
          </Grid>

          <AiCoach text={twin.aiCoach} />

          <Grid gutter="md">
            <GridCol span={{ base: 12, md: 7 }}>
              <ChartCard title="월별 예상 매출" subtitle="단위: 만원">
                <AreaChart
                  h={240}
                  data={twin.monthly.map((m) => ({
                    month: m.month,
                    매출: m.revenueManwon,
                  }))}
                  dataKey="month"
                  series={[{ name: '매출', color: 'green.6' }]}
                  curveType="monotone"
                  withGradient
                  gridAxis="y"
                  withDots={false}
                  valueFormatter={(v) => `${v.toLocaleString()}만원`}
                />
              </ChartCard>
            </GridCol>
            <GridCol span={{ base: 12, md: 5 }}>
              <ChartCard title="월별 노동시간" subtitle="단위: 시간">
                <BarChart
                  h={240}
                  data={twin.monthly.map((m) => ({
                    month: m.month,
                    노동: m.laborHours,
                  }))}
                  dataKey="month"
                  series={[{ name: '노동', color: 'grape.5' }]}
                  gridAxis="y"
                  valueFormatter={(v) => `${v}h`}
                />
              </ChartCard>
            </GridCol>
          </Grid>

          <Card radius="lg" p="lg" withBorder bg="white">
            <Group gap="xs" mb="md">
              <ThemeIcon size={28} radius="md" color="orange" variant="light">
                <IconAlertTriangle size={16} />
              </ThemeIcon>
              <Box>
                <Title order={5}>위기 알림 타임라인</Title>
                <Text size="xs" c="dimmed">
                  병해충·기상·가격·노동 위험 시점을 미리 확인하세요
                </Text>
              </Box>
            </Group>
            <Stack gap={0}>
              {twin.alerts.map((alert, idx) => (
                <AlertRow key={`${alert.month}-${alert.type}`} alert={alert} last={idx === twin.alerts.length - 1} />
              ))}
            </Stack>
          </Card>

          <Card
            radius="lg"
            p="lg"
            withBorder
            style={{
              background:
                'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-teal-7))',
              borderColor: 'transparent',
            }}
          >
            <Stack align="center" gap="md">
              <Title order={3} fz={{ base: 22, md: 26 }} c="white" ta="center">
                이 작목으로 시작하시겠어요?
              </Title>
              <Text size="sm" ta="center" style={{ color: 'rgba(255,255,255,0.86)' }}>
                선택 시 출하 의사결정 대시보드와 영농 캘린더가 자동 생성됩니다.
              </Text>
              <Group gap="sm" mt="xs">
                <Button
                  size="lg"
                  variant="white"
                  c="green.8"
                  leftSection={<IconRocket size={18} />}
                  component={Link}
                  href="/dashboard"
                >
                  이 작목으로 시작하기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  leftSection={<IconRefresh size={18} />}
                  styles={{
                    root: {
                      borderColor: 'rgba(255,255,255,0.55)',
                      color: 'white',
                      background: 'transparent',
                    },
                  }}
                  onClick={() => router.push(`/recommend/result?mode=${mode}`)}
                >
                  다른 작목 시뮬레이션
                </Button>
              </Group>
            </Stack>
          </Card>

          <Text size="xs" c="dimmed" ta="center" lh={1.6}>
            ※ 시뮬레이션 결과는 스마트팜코리아 우수농가 112호 평균값 기반의 참고 수치입니다.
            <br />
            실제 매출은 기상·시장가격·재배 숙련도에 따라 달라질 수 있습니다.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

export default function TwinPage({ params }: { params: { cropId: string } }) {
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
      <TwinInner cropId={params.cropId} />
    </Suspense>
  );
}

function Header({ twin, peakMonthLabel }: { twin: TwinData; peakMonthLabel: string }) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-teal-0))',
        borderColor: 'var(--mantine-color-green-2)',
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="md">
        <Group gap="md" wrap="nowrap">
          <Box
            w={64}
            h={64}
            style={{
              borderRadius: 16,
              background: 'white',
              display: 'grid',
              placeItems: 'center',
              fontSize: 36,
              boxShadow: '0 6px 18px -10px rgba(0,0,0,0.18)',
            }}
          >
            {twin.emoji}
          </Box>
          <Stack gap={2}>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              1년 영농 시뮬레이션
            </Text>
            <Title order={2} fz={{ base: 26, md: 32 }} fw={800}>
              {twin.name}
            </Title>
            <Text size="sm" c="gray.7">
              매출 피크: <b>{peakMonthLabel}</b> · 노동 피크: <b>{twin.peakLaborMonth}월</b>
            </Text>
          </Stack>
        </Group>
      </Group>
    </Card>
  );
}

function SummaryCard({
  icon,
  color,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <Card radius="lg" p="lg" withBorder h="100%">
      <Stack gap={6}>
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color={color} variant="light">
            {icon}
          </ThemeIcon>
          <Text size="sm" fw={600} c="gray.7">
            {label}
          </Text>
        </Group>
        <Text fz={28} fw={800} c={`${color}.7`} lh={1.1} mt={4}>
          {value}
        </Text>
        <Text size="xs" c="dimmed">
          {unit}
        </Text>
      </Stack>
    </Card>
  );
}

function AiCoach({ text }: { text: string }) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-yellow-0), var(--mantine-color-orange-0))',
        borderColor: 'var(--mantine-color-yellow-3)',
      }}
    >
      <Group gap="md" wrap="nowrap" align="flex-start">
        <ThemeIcon size={40} radius="md" color="yellow" variant="filled">
          <IconSparkles size={20} />
        </ThemeIcon>
        <Box>
          <Text size="xs" fw={800} c="orange.8" tt="uppercase" style={{ letterSpacing: 1 }} mb={4}>
            AI 코치 · GPT-4o
          </Text>
          <Text size="sm" lh={1.65} c="gray.9">
            {text}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card radius="lg" p="lg" withBorder h="100%" bg="white">
      <Group justify="space-between" mb="md">
        <Title order={5}>{title}</Title>
        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      </Group>
      {children}
    </Card>
  );
}

function AlertRow({ alert, last }: { alert: CrisisAlert; last: boolean }) {
  const meta = ALERT_META[alert.type];
  const sev = SEVERITY_META[alert.severity];
  return (
    <Group
      wrap="nowrap"
      align="flex-start"
      gap="md"
      py="md"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Box w={48} style={{ flexShrink: 0 }}>
        <Text fw={800} fz={20} c="gray.7" ta="center" lh={1}>
          {alert.month}
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          월
        </Text>
      </Box>
      <Box flex={1}>
        <Group gap={6} mb={4} wrap="nowrap">
          <Badge color={meta.color} variant="light" radius="sm" size="sm">
            {meta.emoji} {meta.label}
          </Badge>
          <Badge color={sev.color} variant="filled" radius="sm" size="sm">
            위험 {sev.label}
          </Badge>
        </Group>
        <Text fw={700} fz={15} mb={2}>
          {alert.title}
        </Text>
        <Text size="sm" c="gray.7" lh={1.6}>
          {alert.detail}
        </Text>
      </Box>
    </Group>
  );
}
