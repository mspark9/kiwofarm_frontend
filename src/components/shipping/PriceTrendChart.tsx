'use client';

import { Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { LineChart } from '@mantine/charts';
import type { PriceTrendResponse } from '@/lib/types';

interface Props {
  trend: PriceTrendResponse;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="sm" c={color}>
        {value}
      </Text>
    </Box>
  );
}

export function PriceTrendChart({ trend }: Props) {
  const data = trend.points.map((p) => ({ label: p.label, 올해: p.price }));

  const referenceLines = [
    ...(trend.year_ago
      ? [{ y: trend.year_ago, label: '작년', color: 'gray.5', labelPosition: 'right' as const }]
      : []),
    ...(trend.normal
      ? [{ y: trend.normal, label: '평년', color: 'blue.4', labelPosition: 'right' as const }]
      : []),
  ];

  const won = (v?: number | null) => (v != null ? `₩${v.toLocaleString()}` : '–');

  return (
    <Card radius="lg" p="xl" withBorder shadow="sm">
      <Stack gap="md">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
            최근 가격추이 · 도매 {trend.rank}
          </Text>
          <Title order={3}>{trend.crop_name} 추이</Title>
        </Box>

        {data.length >= 2 ? (
          <LineChart
            h={260}
            data={data}
            dataKey="label"
            series={[{ name: '올해', color: 'green.6' }]}
            curveType="monotone"
            withDots
            referenceLines={referenceLines}
            valueFormatter={(v) => `₩${v.toLocaleString()}`}
            yAxisProps={{ width: 70, tickFormatter: (v: number) => `${(v / 1000).toFixed(0)}k` }}
            gridAxis="xy"
          />
        ) : (
          <Text c="dimmed" size="sm" py="lg" ta="center">
            추이를 그릴 데이터가 충분하지 않습니다 (최근 {data.length}개 시점).
          </Text>
        )}

        <Group gap="xl" wrap="wrap">
          <Stat label="최근" value={won(trend.latest)} color="green.7" />
          <Stat label="작년 동기" value={won(trend.year_ago)} />
          <Stat label="평년" value={won(trend.normal)} />
          <Stat label="기간 최고" value={won(trend.month_high)} />
          <Stat label="기간 최저" value={won(trend.month_low)} />
        </Group>
      </Stack>
    </Card>
  );
}
