'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingStore,
  IconBuildingWarehouse,
  IconMapPin,
  IconPhone,
  IconScale,
  IconSparkles,
  IconStack2,
  IconTrophy,
  IconTruck,
} from '@tabler/icons-react';
import { fetchChannelCompare, fetchRecommend } from '@/lib/api/sales';
import { CropSearchAutocomplete } from '@/components/crops/CropSearchAutocomplete';
import { RegionPicker } from '@/components/shared/RegionPicker';
import { ONBOARDING_STORAGE_KEY, SALES_STORAGE_KEY } from '@/lib/constants';
import type {
  CropOption,
  MarketOut,
  OnboardingInput,
  RecommendChannelOut,
  SalesHandoff,
  StoreOut,
} from '@/lib/types';

const won = (v?: number | null) => (v == null ? '–' : `₩${v.toLocaleString()}`);
const kakaoMap = (name: string, lat?: number | null, lng?: number | null) =>
  lat != null && lng != null
    ? `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`
    : null;

export default function SalesPage() {
  const [crop, setCrop] = useState<CropOption | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [province, setProvince] = useState<string>('경기도');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState('');

  // 출하 도우미 인계 작물·판매량 + 온보딩 지역 프리필 (sessionStorage)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SALES_STORAGE_KEY);
      if (raw) {
        const h = JSON.parse(raw) as SalesHandoff;
        if (h.crop) setCrop(h.crop);
        if (h.amount && h.amount > 0) setAmount(h.amount);
      }
    } catch {
      /* 무시 */
    }
    try {
      const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw) as OnboardingInput;
        if (o.province) setProvince(o.province);
        if (o.region) setCity(o.region);
      }
    } catch {
      /* 무시 */
    }
  }, []);

  // 위치 입력 전: 가격만 비교. 위치 입력 후: 운송비·AI 포함 추천.
  const compare = useQuery({
    queryKey: ['sales-compare', crop?.item_code, crop?.kind_code, amount],
    queryFn: () => fetchChannelCompare(crop!, amount),
    enabled: amount > 0 && !!crop,
  });

  const recommend = useQuery({
    queryKey: ['sales-recommend', crop?.item_code, crop?.kind_code, amount, address],
    queryFn: () => fetchRecommend(crop!, amount, address),
    enabled: amount > 0 && !!crop && address.trim().length > 0,
  });

  const rec = recommend.data;
  const c = compare.data;
  const meta = rec?.found ? rec : c;
  const mode = meta?.input_mode ?? 'weight';
  const amountUnit = meta?.amount_unit ?? 'kg';

  // 채널 비교에 쓸 데이터: 위치 있으면 운송비 반영(rec), 없으면 가격만(compare).
  const recChannels = rec?.found
    ? [...rec.channels].sort((a, b) => (b.net_after ?? 0) - (a.net_after ?? 0))
    : null;
  const priceChannels = c?.found
    ? [...c.channels].sort((a, b) => (b.net ?? 0) - (a.net ?? 0))
    : null;

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="sm">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
                판매 도우미 · 직거래 vs 도매시장 AI 추천
              </Text>
              <Title order={2}>{crop ? crop.label : '작목을 검색하세요'}</Title>
            </Box>
            <CropSearchAutocomplete value={crop} onSelect={setCrop} />
          </Group>

          {/* 입력: 판매량(무게/갯수) + 판매 위치 */}
          <Card radius="lg" p="lg" withBorder shadow="sm">
            <Stack gap="md">
              <NumberInput
                label={mode === 'count' ? '판매 예정 수량' : '판매 예정 무게'}
                description={
                  mode === 'count'
                    ? '이 작물은 도매가가 갯수 단위라 개수로 입력합니다.'
                    : '이 작물은 도매가가 무게 단위라 kg으로 입력합니다.'
                }
                value={amount}
                onChange={(v) => setAmount(typeof v === 'number' ? v : 0)}
                min={1}
                step={mode === 'count' ? 1 : 10}
                suffix={` ${amountUnit}`}
                thousandSeparator=","
                leftSection={mode === 'count' ? <IconStack2 size={16} /> : <IconScale size={16} />}
              />
              <Box>
                <Text size="sm" fw={500} mb={4}>
                  판매 위치
                </Text>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <RegionPicker
                      value={city}
                      province={province}
                      onChange={(nextCity, nextProvince) => {
                        setCity(nextCity);
                        setProvince(nextProvince);
                      }}
                    />
                  </Box>
                  <Button
                    color="green"
                    disabled={!city || !crop}
                    onClick={() => setAddress(`${province} ${city}`)}
                  >
                    추천받기
                  </Button>
                </Group>
              </Box>
              <Text size="xs" c="dimmed">
                판매량은 출하 도우미에서 넘어옵니다. 시·군·구를 고르면 운송비까지 따져 어디서 파는 게
                유리한지 AI가 추천합니다.
              </Text>
            </Stack>
          </Card>

          {/* AI 판매 추천 */}
          {address && crop && (
            <Card radius="lg" p="xl" withBorder shadow="sm" bg="white">
              <Stack gap="md">
                <Group gap={8}>
                  <ThemeIcon size={28} radius="md" variant="light" color="green">
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Text fw={700}>AI 판매 추천</Text>
                  {rec?.advice_source === 'ai' && (
                    <Badge size="xs" variant="light" color="grape" radius="sm">
                      GPT-4o
                    </Badge>
                  )}
                  {rec?.advice_source === 'rule' && (
                    <Badge size="xs" variant="light" color="gray" radius="sm">
                      규칙기반
                    </Badge>
                  )}
                </Group>

                {recommend.isLoading && (
                  <Group gap="xs" py="sm">
                    <Loader size="sm" color="green" />
                    <Text size="sm" c="dimmed">
                      위치·가격·운송비를 분석해 추천을 생성하는 중…
                    </Text>
                  </Group>
                )}

                {rec && !rec.found && !recommend.isLoading && (
                  <Text size="sm" c="dimmed">
                    {rec.message ?? '추천을 생성할 데이터가 부족합니다.'}
                  </Text>
                )}

                {rec && rec.found && (
                  <>
                    {rec.origin_label && (
                      <Text size="xs" c="dimmed">
                        기준 위치 · {rec.origin_label}
                      </Text>
                    )}
                    <Text size="md" lh={1.7}>
                      {rec.advice}
                    </Text>
                    {rec.delta_net_after != null && rec.delta_net_after > 0 && recChannels && (
                      <Group gap={6}>
                        <Badge color="green" variant="light" radius="sm" leftSection={<IconTrophy size={12} />}>
                          {recChannels[0].label} 유리
                        </Badge>
                        <Text size="sm" c="dimmed">
                          운송비까지 반영 시 약 {won(rec.delta_net_after)} 더 남습니다.
                        </Text>
                      </Group>
                    )}
                  </>
                )}
              </Stack>
            </Card>
          )}

          {/* 채널별 실수령액 비교 */}
          <Box>
            <Group gap={8} mb="sm">
              <ThemeIcon size={28} radius="md" variant="light" color="green">
                <IconTrophy size={16} />
              </ThemeIcon>
              <Text fw={700}>채널별 실수령액</Text>
              {meta?.amount != null && (
                <Badge variant="light" color="gray" radius="sm">
                  {meta.amount.toLocaleString()}
                  {meta.amount_unit} 기준
                </Badge>
              )}
              {recChannels && (
                <Badge variant="light" color="teal" radius="sm" leftSection={<IconTruck size={12} />}>
                  운송비 반영
                </Badge>
              )}
            </Group>

            {!crop && (
              <Card radius="lg" p="xl" withBorder shadow="sm">
                <Text ta="center" c="dimmed" py="md">
                  작목을 검색하면 직매장 직거래와 도매 출하 수익을 비교합니다.
                </Text>
              </Card>
            )}

            {crop && !recChannels && compare.isLoading && (
              <Card radius="lg" p="xl" withBorder shadow="sm">
                <Group gap="xs">
                  <Loader size="sm" color="green" />
                  <Text size="sm" c="dimmed">
                    KAMIS 도매·소매가로 채널별 수익을 계산하는 중…
                  </Text>
                </Group>
              </Card>
            )}

            {crop && !recChannels && c && !c.found && !compare.isLoading && (
              <Card radius="lg" p="xl" withBorder shadow="sm">
                <Text ta="center" c="dimmed" py="md">
                  {c.message ?? '비교에 필요한 가격 데이터가 없습니다.'}
                </Text>
              </Card>
            )}

            {/* 운송비 반영 비교 (위치 있음) */}
            {recChannels && (
              <Stack gap="md">
                <Group grow align="stretch" wrap="wrap">
                  {recChannels.map((ch, i) => (
                    <RecoChannelCard
                      key={ch.key}
                      ch={ch}
                      unit={amountUnit}
                      best={i === 0 && (rec?.delta_net_after ?? 0) > 0}
                    />
                  ))}
                </Group>
                <Text size="xs" c="dimmed">
                  KAMIS {rec?.obs_date} 기준 시장가 + 가까운 매장까지 왕복 운송비(약 km당 ₩
                  {rec?.per_km_won?.toLocaleString()}, 1톤 트럭 추정)로 산출한 참고 수치입니다.
                </Text>
              </Stack>
            )}

            {/* 가격만 비교 (위치 입력 전) */}
            {!recChannels && priceChannels && (
              <Stack gap="md">
                <Group grow align="stretch" wrap="wrap">
                  {priceChannels.map((ch, i) => (
                    <PriceChannelCard
                      key={ch.key}
                      ch={ch}
                      unit={amountUnit}
                      best={i === 0 && (c?.delta_net ?? 0) > 0}
                    />
                  ))}
                </Group>
                <Text size="xs" c="dimmed">
                  KAMIS {c?.obs_date} 기준 시장가 참고 수치입니다. 위치를 입력하면 운송비까지 반영합니다.
                </Text>
              </Stack>
            )}
          </Box>

          {/* 가까운 직매장 / 도매시장 */}
          {!address && (
            <Card radius="lg" p="xl" withBorder shadow="sm">
              <Text ta="center" c="dimmed" py="md">
                판매 위치를 입력하면 가까운 직매장과 도매시장을 거리순으로 추천합니다.
              </Text>
            </Card>
          )}

          {rec?.found && rec.nearby_direct.length > 0 && (
            <Box>
              <Group gap={8} mb="sm">
                <ThemeIcon size={28} radius="md" variant="light" color="teal">
                  <IconBuildingStore size={16} />
                </ThemeIcon>
                <Text fw={700}>가까운 로컬푸드 직매장</Text>
              </Group>
              <Stack gap="sm">
                {rec.nearby_direct.map((s, i) => (
                  <StoreRow key={s.id} s={s} first={i === 0} />
                ))}
              </Stack>
            </Box>
          )}

          {rec?.found && rec.nearby_wholesale.length > 0 && (
            <Box>
              <Group gap={8} mb="sm">
                <ThemeIcon size={28} radius="md" variant="light" color="indigo">
                  <IconBuildingWarehouse size={16} />
                </ThemeIcon>
                <Text fw={700}>가까운 도매시장</Text>
              </Group>
              <Stack gap="sm">
                {rec.nearby_wholesale.map((m, i) => (
                  <MarketRow key={m.id} m={m} first={i === 0} />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function RecoChannelCard({
  ch,
  unit,
  best,
}: {
  ch: RecommendChannelOut;
  unit: string;
  best: boolean;
}) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      shadow="sm"
      style={best ? { borderColor: 'var(--mantine-color-green-4)', borderWidth: 2 } : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fw={700}>{ch.label}</Text>
          {best && (
            <Badge color="green" variant="light" radius="sm" leftSection={<IconTrophy size={12} />}>
              추천
            </Badge>
          )}
        </Group>
        <Group gap={6} align="baseline">
          <Text fz={26} fw={800} lh={1.1}>
            {won(ch.net_after)}
          </Text>
          <Text size="xs" c="dimmed">
            운송 후 실수령
          </Text>
        </Group>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            가격 실수령 {won(ch.net)} − 운송비 {won(ch.transport_cost)}
          </Text>
          {ch.place && (
            <Group gap={4} c="dimmed" wrap="nowrap">
              <IconMapPin size={12} stroke={1.6} />
              <Text size="xs" truncate>
                {ch.place.name} · {ch.place.distance_km}km
              </Text>
            </Group>
          )}
          <Text size="xs" c="dimmed">
            {unit}당 {ch.unit_price ? `₩${Math.round(ch.unit_price).toLocaleString()}` : '–'} · 수수료{' '}
            {ch.commission_pct.toFixed(0)}%
          </Text>
        </Stack>
        {ch.estimated && (
          <Badge color="orange" variant="light" size="xs" radius="sm">
            추정값
          </Badge>
        )}
      </Stack>
    </Card>
  );
}

function PriceChannelCard({
  ch,
  unit,
  best,
}: {
  ch: { label: string; net?: number | null; gross?: number | null; unit_price?: number | null; commission_pct: number; note: string; estimated: boolean };
  unit: string;
  best: boolean;
}) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      shadow="sm"
      style={best ? { borderColor: 'var(--mantine-color-green-4)', borderWidth: 2 } : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fw={700}>{ch.label}</Text>
          {best && (
            <Badge color="green" variant="light" radius="sm" leftSection={<IconTrophy size={12} />}>
              추천
            </Badge>
          )}
        </Group>
        <Group gap={6} align="baseline">
          <Text fz={28} fw={800} lh={1.1}>
            {won(ch.net)}
          </Text>
          <Text size="xs" c="dimmed">
            실수령
          </Text>
        </Group>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            {unit}당 {ch.unit_price ? `₩${Math.round(ch.unit_price).toLocaleString()}` : '–'} · 총{' '}
            {won(ch.gross)}
          </Text>
          <Text size="xs" c="dimmed">
            수수료 {ch.commission_pct.toFixed(0)}% · {ch.note}
          </Text>
        </Stack>
        {ch.estimated && (
          <Badge color="orange" variant="light" size="xs" radius="sm">
            추정값
          </Badge>
        )}
      </Stack>
    </Card>
  );
}

function StoreRow({ s, first }: { s: StoreOut; first: boolean }) {
  const map = kakaoMap(s.name, s.lat, s.lng);
  return (
    <Card radius="lg" p="md" withBorder shadow="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Group gap={8} mb={4} wrap="nowrap">
            {first && (
              <Badge color="teal" variant="filled" size="sm" radius="sm">
                최단거리
              </Badge>
            )}
            <Text fw={700} truncate>
              {s.name}
            </Text>
          </Group>
          <Group gap={6} c="dimmed" wrap="nowrap">
            <IconMapPin size={13} stroke={1.6} />
            <Text size="xs" truncate>
              {s.address}
            </Text>
          </Group>
          {s.phone && (
            <Group gap={6} c="dimmed" mt={2}>
              <IconPhone size={13} stroke={1.6} />
              <Text size="xs">{s.phone}</Text>
            </Group>
          )}
        </Box>
        <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
          <Badge color="gray" variant="light" radius="sm" size="lg">
            {s.distance_km}km
          </Badge>
          {map && (
            <Button
              component="a"
              href={map}
              target="_blank"
              rel="noreferrer"
              size="compact-sm"
              variant="light"
              color="teal"
              rightSection={<IconArrowRight size={13} />}
            >
              지도
            </Button>
          )}
        </Stack>
      </Group>
    </Card>
  );
}

function MarketRow({ m, first }: { m: MarketOut; first: boolean }) {
  const map = kakaoMap(m.name, m.lat, m.lng);
  return (
    <Card radius="lg" p="md" withBorder shadow="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Group gap={8} mb={4} wrap="nowrap">
            {first && (
              <Badge color="indigo" variant="filled" size="sm" radius="sm">
                최단거리
              </Badge>
            )}
            <Text fw={700} truncate>
              {m.name}
            </Text>
          </Group>
          <Group gap={6} c="dimmed" wrap="nowrap">
            <Badge color="gray" variant="light" size="xs" radius="sm">
              {m.category}
            </Badge>
            <Text size="xs" truncate>
              {m.sido}
              {m.corp_count != null ? ` · 도매법인 ${m.corp_count}` : ''}
            </Text>
          </Group>
        </Box>
        <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
          <Badge color="gray" variant="light" radius="sm" size="lg">
            {m.distance_km}km
          </Badge>
          {map && (
            <Button
              component="a"
              href={map}
              target="_blank"
              rel="noreferrer"
              size="compact-sm"
              variant="light"
              color="indigo"
              rightSection={<IconArrowRight size={13} />}
            >
              지도
            </Button>
          )}
        </Stack>
      </Group>
    </Card>
  );
}
