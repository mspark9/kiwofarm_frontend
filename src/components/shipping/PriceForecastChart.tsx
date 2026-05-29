'use client';

import { Badge, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import type { ForecastResponse } from '@/lib/types';

interface Props {
  forecast: ForecastResponse;
}

export function PriceForecastChart({ forecast }: Props) {
  const s = forecast.series;

  const data = s.map((p) => ({
    date: p.date.slice(5).replace('-', '/'),
    실측: p.is_forecast ? null : p.price,
    예측: p.is_forecast ? p.price : null,
  }));

  // 실측 → 예측 선이 끊기지 않도록 마지막 실측 지점에 예측값을 한 번 더 심는다.
  const lastActualIdx = s.map((p) => p.is_forecast).lastIndexOf(false);
  if (lastActualIdx >= 0 && data[lastActualIdx]) {
    data[lastActualIdx].예측 = s[lastActualIdx].price;
  }

  const won = (v?: number | null) => (v != null ? `₩${v.toLocaleString()}` : '–');
  const methodLabel = forecast.method === 'prophet' ? 'Prophet' : '통계추세';

  return (
    <Card radius="lg" p="xl" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
              {forecast.horizon_days ?? 7}일 도매가 예측
            </Text>
            <Title order={3}>
              {forecast.crop_name} 예측
              {forecast.unit ? <Text span c="dimmed" fz="md"> · {forecast.unit}</Text> : null}
            </Title>
          </Box>
          <Badge color="orange" variant="light" radius="sm">
            {methodLabel}
          </Badge>
        </Group>

        <AreaChart
          h={300}
          data={data}
          dataKey="date"
          series={[
            { name: '실측', color: 'green.6' },
            { name: '예측', color: 'orange.5' },
          ]}
          curveType="monotone"
          withGradient
          connectNulls={false}
          withLegend
          valueFormatter={(v) => `₩${v.toLocaleString()}`}
          yAxisProps={{ width: 70, tickFormatter: (v: number) => `${(v / 1000).toFixed(0)}k` }}
          gridAxis="xy"
        />

        {forecast.forecast_last != null && (
          <Group gap="xl" wrap="wrap">
            <Box>
              <Text size="xs" c="dimmed">
                {forecast.horizon_days ?? 7}일 후 예측가
              </Text>
              <Text fw={800} fz={22} c="orange.7" lh={1.2}>
                {won(forecast.forecast_last)}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">
                예측 구간
              </Text>
              <Text fw={600} size="sm">
                {won(forecast.forecast_last_low)} ~ {won(forecast.forecast_last_high)}
              </Text>
            </Box>
          </Group>
        )}

        <Text size="xs" c="dimmed">
          KAMIS 도매가 기반 참고 예측이며 실제 시장 상황에 따라 달라질 수 있습니다.
        </Text>
      </Stack>
    </Card>
  );
}
