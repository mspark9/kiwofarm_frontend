'use client';

import { Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import type { PricePoint } from '@/lib/types';

interface Props {
  series: PricePoint[];
  cropName: string;
}

export function PriceForecast({ series, cropName }: Props) {
  const data = series.map((p) => ({
    date: p.date.slice(5).replace('-', '/'),
    실측: p.is_forecast ? null : p.price,
    예측: p.is_forecast ? p.price : null,
  }));

  return (
    <Card radius="lg" p="xl" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
              14일 가격 예측
            </Text>
            <Title order={3}>{cropName} 도매가 추이</Title>
          </Box>
          <Group gap="lg">
            <Group gap={6}>
              <Box w={10} h={10} bg="green.6" style={{ borderRadius: 3 }} />
              <Text size="xs" c="dimmed">
                실측 (KAMIS)
              </Text>
            </Group>
            <Group gap={6}>
              <Box w={10} h={10} bg="teal.4" style={{ borderRadius: 3 }} />
              <Text size="xs" c="dimmed">
                예측 (Prophet)
              </Text>
            </Group>
          </Group>
        </Group>

        <AreaChart
          h={320}
          data={data}
          dataKey="date"
          series={[
            { name: '실측', color: 'green.6' },
            { name: '예측', color: 'teal.4' },
          ]}
          curveType="monotone"
          withGradient
          gridAxis="xy"
          tickLine="y"
          withLegend={false}
          connectNulls={false}
          valueFormatter={(v) => `₩${v.toLocaleString()}`}
          yAxisProps={{ width: 70, tickFormatter: (v: number) => `${(v / 1000).toFixed(1)}k` }}
        />
      </Stack>
    </Card>
  );
}
