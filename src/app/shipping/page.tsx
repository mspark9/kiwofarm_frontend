'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  LoadingOverlay,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendar,
  IconSparkles,
} from '@tabler/icons-react';
import { SALES_STORAGE_KEY } from '@/lib/constants';
import { forecastToKg, recentToKg, trendToKg, unitToKg } from '@/lib/price';
import {
  fetchPriceForecast,
  fetchPriceTrend,
  fetchRecentPrice,
  fetchShippingAdvice,
} from '@/lib/api/shipping';
import { CropSearchAutocomplete } from '@/components/shipping/CropSearchAutocomplete';
import { PriceTrendChart } from '@/components/shipping/PriceTrendChart';
import { PriceForecastChart } from '@/components/shipping/PriceForecastChart';
import type { CropOption, SalesHandoff } from '@/lib/types';

function pctText(v?: number | null) {
  if (v == null) return '–';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="sm">
        {value}
      </Text>
    </Box>
  );
}

export default function ShippingPage() {
  const router = useRouter();
  const [crop, setCrop] = useState<CropOption | null>(null);

  const goToSales = () => {
    if (!crop) return;
    const handoff: SalesHandoff = { crop };
    sessionStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(handoff));
    router.push('/sales');
  };

  const price = useQuery({
    queryKey: ['recent-price', crop?.item_code, crop?.kind_code],
    queryFn: () => fetchRecentPrice(crop!),
    enabled: !!crop,
  });

  const trend = useQuery({
    queryKey: ['trend', crop?.item_code, crop?.kind_code],
    queryFn: () => fetchPriceTrend(crop!),
    enabled: !!crop,
  });

  const forecast = useQuery({
    queryKey: ['forecast', crop?.item_code, crop?.kind_code],
    queryFn: () => fetchPriceForecast(crop!),
    enabled: !!crop,
  });

  const advice = useQuery({
    queryKey: ['advice', crop?.item_code, crop?.kind_code],
    queryFn: () => fetchShippingAdvice(crop!),
    enabled: !!crop,
  });

  const data = price.data ? recentToKg(price.data) : undefined;
  const delta = data?.delta_pct ?? null;
  const up = (delta ?? 0) > 0;
  const down = (delta ?? 0) < 0;

  const a = advice.data;
  const dir = a?.direction ?? null;
  const dirColor = dir === '상승' ? 'teal' : dir === '하락' ? 'red' : 'gray';

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="sm">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
                출하 도우미 · 최근일자 도매가
              </Text>
              <Title order={2}>{crop ? (data?.crop_name ?? crop.label) : '작목을 검색하세요'}</Title>
            </Box>
            <CropSearchAutocomplete value={crop} onSelect={setCrop} />
          </Group>

          {!crop && (
            <Card radius="lg" p="xl" withBorder shadow="sm">
              <Stack gap={6} align="center" py="lg">
                <Text fw={700}>판매할 작목을 검색해 주세요</Text>
                <Text size="sm" c="dimmed" ta="center">
                  검색하면 최근 도매가·가격추이·예측·AI 출하 조언을 보여드립니다.
                </Text>
              </Stack>
            </Card>
          )}

          {crop && (
          <>
          {/* 최근일자 도매가 */}
          <Box pos="relative" mih={180}>
            <LoadingOverlay visible={price.isLoading} zIndex={10} overlayProps={{ blur: 2, color: 'gray.0' }} />

            {price.isError && (
              <Text c="red" ta="center" py="xl">
                데이터를 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.
              </Text>
            )}

            {data && !data.found && (
              <Card radius="lg" p="xl" withBorder shadow="sm">
                <Text ta="center" c="dimmed" py="md">
                  {data.message ?? 'KAMIS에 최근 도매가 정보가 없는 작물입니다.'}
                </Text>
              </Card>
            )}

            {data && data.found && (
              <Card radius="lg" p="xl" withBorder shadow="sm">
                <Stack gap="lg">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
                        {data.product_cls} 가격 · {data.rank}
                      </Text>
                      <Title order={3}>{data.kind_name}</Title>
                    </Box>
                    {delta !== null && (
                      <Badge
                        color={up ? 'teal' : down ? 'red' : 'gray'}
                        variant="light"
                        size="lg"
                        radius="sm"
                        leftSection={
                          up ? <IconArrowUpRight size={14} /> : down ? <IconArrowDownRight size={14} /> : null
                        }
                      >
                        전일 대비 {pctText(delta)}
                      </Badge>
                    )}
                  </Group>

                  <Group gap={6} align="baseline">
                    <Text fz={48} fw={800} lh={1}>
                      ₩{data.price?.toLocaleString()}
                    </Text>
                    <Text size="lg" c="dimmed">
                      / {data.unit}
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <IconCalendar size={14} stroke={1.5} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed">
                      기준일 {data.obs_date} · 출처 KAMIS
                      {price.data && (unitToKg(price.data.unit) ?? 1) > 1 &&
                        ` · 원단가 ₩${price.data.price?.toLocaleString()}/${price.data.unit}`}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            )}
          </Box>

          {/* 최근 가격추이 */}
          {trend.data && trend.data.found && <PriceTrendChart trend={trendToKg(trend.data)} />}

          {/* 가격 예측 (Prophet) */}
          {forecast.isLoading && (
            <Card radius="lg" p="xl" withBorder shadow="sm">
              <Group gap="xs">
                <Loader size="sm" color="orange" />
                <Text size="sm" c="dimmed">
                  최근 90일 도매가로 예측 모델을 계산하는 중…
                </Text>
              </Group>
            </Card>
          )}
          {forecast.data && forecast.data.found && (
            <PriceForecastChart forecast={forecastToKg(forecast.data)} />
          )}

          {/* AI 출하 조언 */}
          <Card radius="lg" p="xl" withBorder shadow="sm" bg="white">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap={8}>
                  <ThemeIcon size={28} radius="md" variant="light" color="green">
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Text fw={700}>AI 출하 조언</Text>
                  {a?.source === 'ai' && (
                    <Badge size="xs" variant="light" color="grape" radius="sm">
                      GPT-4o
                    </Badge>
                  )}
                  {a?.source === 'rule' && (
                    <Badge size="xs" variant="light" color="gray" radius="sm">
                      규칙기반
                    </Badge>
                  )}
                </Group>
                {dir && (
                  <Badge color={dirColor} variant="light" radius="sm">
                    {dir}
                  </Badge>
                )}
              </Group>

              {advice.isLoading && (
                <Group gap="xs" py="sm">
                  <Loader size="sm" color="green" />
                  <Text size="sm" c="dimmed">
                    KAMIS 지표를 분석해 조언을 생성하는 중…
                  </Text>
                </Group>
              )}

              {advice.isError && (
                <Text size="sm" c="red">
                  조언을 생성하지 못했습니다.
                </Text>
              )}

              {a && a.found && (
                <>
                  <Text size="md" lh={1.7}>
                    {a.advice}
                  </Text>
                  <Group gap="xl" wrap="wrap">
                    <Metric label="전일 대비" value={pctText(a.vs_prev_pct)} />
                    <Metric label="작년 동기 대비" value={pctText(a.vs_year_ago_pct)} />
                    <Metric label="평년 대비" value={pctText(a.vs_normal_pct)} />
                    <Metric label="한 달 추세" value={pctText(a.trend_pct)} />
                    <Metric
                      label="변동성"
                      value={a.volatility_pct != null ? `${a.volatility_pct.toFixed(1)}%` : '–'}
                    />
                    {a.forecast_pct != null && (
                      <Metric label={`${a.forecast_days ?? 7}일 후 예측`} value={pctText(a.forecast_pct)} />
                    )}
                  </Group>
                </>
              )}

              {a && !a.found && !advice.isLoading && (
                <Text size="sm" c="dimmed">
                  {a.message ?? '데이터가 없어 조언을 생성할 수 없습니다.'}
                </Text>
              )}
            </Stack>
          </Card>

          {/* 판매 도우미로 이어가기 */}
          <Card radius="lg" p="lg" withBorder shadow="sm" bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Box>
                <Text fw={700}>이제 어디에 팔까요?</Text>
                <Text size="sm" c="dimmed">
                  직매장 직거래와 도매 출하 수익을 비교하고 가까운 직매장을 찾아보세요.
                </Text>
              </Box>
              <Button
                color="green"
                size="md"
                onClick={goToSales}
                rightSection={<IconArrowRight size={16} />}
              >
                판매 도우미로
              </Button>
            </Group>
          </Card>
          </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
