'use client';

// 농사 계획 설정 폼 — 작목 추천 흐름의 마지막 단계(/planting/plan)에서 사용한다.
// (페이지 라우트가 아니므로 컴포넌트를 자유롭게 export 할 수 있다.)

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendarPlus,
  IconCheck,
  IconChevronDown,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { searchCropCatalog } from '@/lib/api/crops';
import { createPlan, createPlansBatch } from '@/lib/api/farmplan';
import { usePlanIds } from '@/lib/planStore';
import {
  clearPlantingCarryCrops,
  loadPlantingCarryCrops,
  loadPlantingInput,
} from '@/lib/planting/storage';
import { PROVINCE_OPTIONS, getCitiesByProvince } from '@/lib/regions';
import type {
  AreaUnit,
  BatchFailure,
  CropCatalogItem,
  FarmPlanCreate,
  GrowConditions,
} from '@/lib/types';

const FMT = 'YYYY-MM-DD';

const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  pyeong: '평',
  sqm: 'm²',
  hectare: 'ha',
};

// 0=일 ~ 6=토. 표시는 월~일 순.
const WEEKDAYS: { v: number; l: string }[] = [
  { v: 1, l: '월' },
  { v: 2, l: '화' },
  { v: 3, l: '수' },
  { v: 4, l: '목' },
  { v: 5, l: '금' },
  { v: 6, l: '토' },
  { v: 0, l: '일' },
];
const WEEKDAY_LABEL: Record<number, string> = Object.fromEntries(
  WEEKDAYS.map((w) => [w.v, w.l]),
);
const KOR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 작물별로 따로 설정하는 한 줄(작목 + 그 작물만의 시작일·지역·면적·방문요일).
interface CropEntry {
  key: string; // 작목 코드(subCategoryCode)
  crop: CropCatalogItem;
  startDate: Date | null;
  province: string | null;
  city: string | null;
  area: number | '';
  areaUnit: AreaUnit;
  visitDays: number[];
}

const cropEntryKey = (c: CropCatalogItem) => c.code;

interface DraftValues {
  startDate: Date | null;
  province: string | null;
  city: string | null;
  area: number | '';
  areaUnit: AreaUnit;
  visitDays: number[];
}

// 추천받기 sigungu("경기도 성남시") → province / city.
function splitSigungu(sigungu: string): { province: string | null; city: string | null } {
  const s = sigungu.trim();
  if (!s) return { province: null, city: null };
  const i = s.indexOf(' ');
  return i < 0
    ? { province: s, city: null }
    : { province: s.slice(0, i), city: s.slice(i + 1) || null };
}

export function SetupForm({ tabs }: { tabs?: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { add } = usePlanIds();

  const [crop, setCrop] = useState<CropCatalogItem | null>(null);
  const [draft, setDraft] = useState<DraftValues>(() => ({
    startDate: new Date(),
    province: null,
    city: null,
    area: 300,
    areaUnit: 'pyeong',
    visitDays: [6], // 기본: 토요일
  }));
  const [queue, setQueue] = useState<CropEntry[]>([]);
  // 추가된 작물 중 현재 펼쳐 편집 중인 작목 코드(없으면 null).
  const [editKey, setEditKey] = useState<string | null>(null);
  // 추천받기에서 넘어온 재배 조건(생성 시 백엔드로 전달).
  const [growConditions, setGrowConditions] = useState<GrowConditions | null>(null);

  // 추천받기(?from=planting)에서 들어오면 선택 작물(1개 이상)·지역·면적·시작일·방문요일을 프리필.
  useEffect(() => {
    if (params.get('from') !== 'planting') return;
    const input = loadPlantingInput();
    const carry = loadPlantingCarryCrops();
    if (!input && !carry) return;

    // 추천받기 조건으로 폼 기본값 계산.
    const next: DraftValues = {
      startDate: new Date(),
      province: null,
      city: null,
      area: 300,
      areaUnit: 'pyeong',
      visitDays: [6],
    };
    if (input) {
      const { province, city } = splitSigungu(input.sigungu);
      const hasArea = typeof input.area === 'number' && input.area > 0;
      next.province = province ?? next.province;
      next.city = city ?? next.city;
      if (hasArea) {
        next.area = input.area as number;
        next.areaUnit = input.areaUnit ?? 'pyeong';
      }
      next.startDate = input.startDate ? dayjs(input.startDate).toDate() : new Date();
      if (input.visitDays?.length) next.visitDays = input.visitDays;
      setGrowConditions({
        place: input.place,
        sunHours: input.sun_hours,
        experience: input.experience,
        facility: input.facility?.length ? input.facility : undefined,
        direction: input.direction ?? undefined,
      });
    }
    setDraft(next);

    // 선택 작물: 1개면 현재 입력칸에, 2개 이상이면 대기 목록(배치 생성)에 채운다.
    if (carry && carry.length > 0) {
      const crops: CropCatalogItem[] = carry.map((c) => ({
        code: c.code,
        name: c.name,
        category: c.category,
      }));
      if (crops.length === 1) {
        setCrop(crops[0]);
      } else {
        setQueue(
          crops.map((c) => ({
            key: c.code,
            crop: c,
            startDate: next.startDate,
            province: next.province,
            city: next.city,
            area: next.area,
            areaUnit: next.areaUnit,
            visitDays: next.visitDays,
          })),
        );
        setCrop(null);
      }
      clearPlantingCarryCrops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDf = (patch: Partial<DraftValues>) => setDraft((d) => ({ ...d, ...patch }));

  const validateValues = (v: DraftValues): string | null => {
    if (!v.startDate) return '시작 날짜를 선택하세요.';
    if (!v.province) return '지역(시·도)을 선택하세요.';
    if (!(typeof v.area === 'number' && v.area > 0)) return '면적을 입력하세요.';
    return null;
  };
  const validateDraft = (): string | null => validateValues(draft);

  // 추가된 작물 한 칸의 세부정보를 인라인 수정.
  const updateQueued = (key: string, patch: Partial<DraftValues>) =>
    setQueue((q) => q.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const draftToEntry = (c: CropCatalogItem): CropEntry => ({
    key: cropEntryKey(c),
    crop: c,
    startDate: draft.startDate,
    province: draft.province,
    city: draft.city,
    area: draft.area,
    areaUnit: draft.areaUnit,
    visitDays: draft.visitDays,
  });

  // 현재 작물을 목록에 담고, 작목만 비워 다음 작물을 빠르게 입력(위치·면적·요일은 유지).
  const addAnother = () => {
    if (!crop) {
      notifications.show({ color: 'red', message: '작목을 먼저 선택하세요.' });
      return;
    }
    const err = validateDraft();
    if (err) {
      notifications.show({ color: 'red', message: err });
      return;
    }
    if (queue.some((e) => e.key === cropEntryKey(crop))) {
      notifications.show({ color: 'yellow', message: '이미 추가된 작목입니다.' });
      return;
    }
    setQueue((q) => [...q, draftToEntry(crop)]);
    setCrop(null);
    notifications.show({ color: 'green', message: '작물을 추가했어요. 다음 작물을 선택하세요.' });
  };
  const removeQueued = (key: string) => {
    setQueue((q) => q.filter((e) => e.key !== key));
    setEditKey((k) => (k === key ? null : k));
  };

  const createMut = useMutation({
    // 1개면 단일 생성(해당 계획으로 이동), 2개 이상이면 배치 생성(모두 보기로 이동).
    mutationFn: (payloads: FarmPlanCreate[]) =>
      payloads.length === 1
        ? createPlan(payloads[0]).then((p) => ({
            created: [p],
            failed: [] as BatchFailure[],
          }))
        : createPlansBatch(payloads),
    onSuccess: ({ created, failed }) => {
      if (created.length === 0) {
        notifications.show({
          color: 'red',
          title: '계획 생성 실패',
          message: '작물 계획을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
        });
        return;
      }
      for (const p of created) add(p.id);
      if (failed.length > 0) {
        notifications.show({
          color: 'orange',
          title: `${created.length}개 생성 · ${failed.length}개 실패`,
          message: `${failed.map((f) => f.cropName).join(', ')} 계획 생성에 실패했어요.`,
        });
      }
      sessionStorage.setItem('kiwofarm:lastPlanId', String(created[0].id));
      router.push(
        created.length === 1 ? `/calendar?planId=${created[0].id}` : '/calendar',
      );
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: '계획 생성 실패',
        message: '백엔드 서버·DB·OPENAI_API_KEY를 확인해 주세요.',
      });
    },
  });

  const onSubmit = () => {
    const all = [...queue];
    // 입력 중인 작물이 있으면 함께 생성(따로 "추가"를 누르지 않아도 됨).
    if (crop) {
      const err = validateDraft();
      if (err) {
        notifications.show({ color: 'red', message: err });
        return;
      }
      if (!all.some((e) => e.key === cropEntryKey(crop))) all.push(draftToEntry(crop));
    }
    if (all.length === 0) {
      notifications.show({ color: 'red', message: '작목을 선택하거나 추가하세요.' });
      return;
    }
    // 인라인 편집으로 필수값이 비워졌을 수 있어 생성 전 각 작물을 검증한다.
    for (const e of all) {
      const err = validateValues(e);
      if (err) {
        notifications.show({ color: 'red', message: `${e.crop.name}: ${err}` });
        setEditKey(e.key);
        return;
      }
    }
    const payloads: FarmPlanCreate[] = all.map((e) => ({
      startDate: dayjs(e.startDate).format(FMT),
      itemCode: e.crop.code,
      kindCode: '0',
      cropName: e.crop.name,
      region: [e.province, e.city].filter(Boolean).join(' '),
      province: e.province ?? undefined,
      area: typeof e.area === 'number' ? e.area : 0,
      areaUnit: e.areaUnit,
      visitDays: e.visitDays.length ? [...e.visitDays].sort((a, b) => a - b) : undefined,
      growConditions: growConditions ?? undefined,
    }));
    createMut.mutate(payloads);
  };

  const totalCount = queue.length + (crop ? 1 : 0);

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/planting/result">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  추천 결과로
                </Text>
              </Group>
            </UnstyledButton>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              RAG · 농사로 농업기술정보
            </Badge>
          </Group>

          {tabs}

          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              영농 캘린더
            </Text>
            <Title order={2} fz={{ base: 26, md: 34 }} fw={800} lh={1.2} mt={4}>
              시작일·작목·지역·면적을 넣으면{' '}
              <Text span inherit c="green.7">
                날짜별 농사 계획
              </Text>
              을 만들어 드립니다
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              농사로 농업기술길잡이와 병해충 예방 정보를 RAG로 분석해 캘린더에 일정을 자동으로 채웁니다.
            </Text>
          </Box>

          <Card radius="lg" p="lg" withBorder bg="white">
            <Stack gap="md">
              <style jsx global>{`
                /* 시작일 선택 팝오버 달력: 토=파랑, 일=빨강 (월화수목금토일 순서) */
                .mantine-DatePickerInput-weekday:nth-of-type(6) {
                  color: var(--mantine-color-blue-6);
                }
                .mantine-DatePickerInput-weekday:last-of-type {
                  color: var(--mantine-color-red-6);
                }
              `}</style>

              {queue.length > 0 && (
                <Stack gap={8}>
                  <Text size="sm" fw={700}>
                    추가된 작물 {queue.length}개
                  </Text>
                  {growConditions && (
                    <Alert
                      color="grape"
                      variant="light"
                      radius="md"
                      icon={<IconSparkles size={16} />}
                      py={8}
                    >
                      추천받기에서 입력한 조건(지역·면적·시작 시기·재배 환경)을 자동으로 채웠어요. 필요하면
                      수정할 수 있고, 일정 생성 시 재배 환경도 함께 고려됩니다.
                    </Alert>
                  )}
                  {queue.map((e) => (
                    <QueuedCrop
                      key={e.key}
                      entry={e}
                      expanded={editKey === e.key}
                      onToggle={() => setEditKey((k) => (k === e.key ? null : e.key))}
                      onChange={(patch) => updateQueued(e.key, patch)}
                      onRemove={() => removeQueued(e.key)}
                    />
                  ))}
                  <Divider my={4} label="다음 작물" labelPosition="center" />
                </Stack>
              )}

              <CropPicker value={crop} onChange={setCrop} />

              <CropDetailFields values={draft} onChange={setDf} />

              <Stack gap="sm" mt={4}>
                <Button
                  variant="default"
                  size="md"
                  fullWidth
                  leftSection={<IconPlus size={16} />}
                  onClick={addAnother}
                >
                  작물 추가
                </Button>
                <Button
                  color="green"
                  size="md"
                  fullWidth
                  loading={createMut.isPending}
                  leftSection={<IconCalendarPlus size={18} />}
                  onClick={onSubmit}
                >
                  {totalCount > 1 ? `${totalCount}개 작물 계획 생성` : '농사 계획 생성'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

// 추가된(대기 중) 작물 한 줄 — 누르면 펼쳐서 세부정보(시작일·지역·면적·방문요일)를 인라인 수정.
function QueuedCrop({
  entry,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  entry: CropEntry;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DraftValues>) => void;
  onRemove: () => void;
}) {
  const region = [entry.province, entry.city].filter(Boolean).join(' ') || '지역 미정';
  const visit = entry.visitDays.length
    ? `${[...entry.visitDays]
        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
        .map((d) => WEEKDAY_LABEL[d])
        .join('·')}요일`
    : '매일';
  const area = typeof entry.area === 'number' ? entry.area.toLocaleString() : entry.area;
  return (
    <Card
      radius="md"
      p="xs"
      withBorder
      bg="green.0"
      style={{ borderColor: 'var(--mantine-color-green-2)' }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <UnstyledButton
          onClick={onToggle}
          style={{ flex: 1, minWidth: 0 }}
          aria-label="세부정보 편집"
        >
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Box style={{ minWidth: 0 }}>
              <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                {entry.crop.category && (
                  <Badge color="green" variant="light" radius="sm" size="sm">
                    {entry.crop.category}
                  </Badge>
                )}
                <Text fw={700} fz={14} truncate>
                  {entry.crop.name}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2} truncate>
                {region} · {area} {AREA_UNIT_LABEL[entry.areaUnit]} ·{' '}
                {dayjs(entry.startDate).format('M.D')} 시작 · {visit}
              </Text>
            </Box>
            <IconChevronDown
              size={16}
              style={{
                flexShrink: 0,
                color: 'var(--mantine-color-gray-6)',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 160ms ease',
              }}
            />
          </Group>
        </UnstyledButton>
        <ActionIcon variant="subtle" color="gray" onClick={onRemove} aria-label="추가 취소">
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Box pt="sm" mt="xs" style={{ borderTop: '1px solid var(--mantine-color-green-2)' }}>
          <CropDetailFields values={entry} onChange={onChange} />
        </Box>
      </Collapse>
    </Card>
  );
}

// 작물 한 건의 세부정보 입력 필드(시작일·지역·면적·방문요일). 메인 폼과 인라인 편집에서 공용.
function CropDetailFields({
  values,
  onChange,
}: {
  values: DraftValues;
  onChange: (patch: Partial<DraftValues>) => void;
}) {
  return (
    <Stack gap="md">
      <DatePickerInput
        label="시작 날짜"
        placeholder="재배 시작일 선택"
        valueFormat="YYYY년 M월 D일"
        withAsterisk
        firstDayOfWeek={1}
        monthLabelFormat="YYYY년 M월"
        yearLabelFormat="YYYY년"
        monthsListFormat="M월"
        weekdayFormat={(date) => KOR_WEEKDAYS[date.getDay()]}
        getDayProps={(date) => {
          const wd = dayjs(date).day(); // 0=일 ~ 6=토
          if (wd === 6) return { style: { color: 'var(--mantine-color-blue-6)' } };
          if (wd === 0) return { style: { color: 'var(--mantine-color-red-6)' } };
          return {};
        }}
        value={values.startDate}
        onChange={(v) => onChange({ startDate: v })}
      />

      <Group grow align="flex-start">
        <Select
          label="지역 (시·도)"
          placeholder="선택"
          withAsterisk
          searchable
          data={PROVINCE_OPTIONS}
          leftSection={<IconMapPin size={16} />}
          value={values.province}
          onChange={(v) => onChange({ province: v, city: null })}
        />
        <Select
          label="시·군·구"
          placeholder={values.province ? '선택' : ''}
          searchable
          disabled={!values.province}
          data={values.province ? getCitiesByProvince(values.province) : []}
          value={values.city}
          onChange={(v) => onChange({ city: v })}
        />
      </Group>

      <Box>
        <Text size="sm" fw={500} mb={4}>
          농지 면적 <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
        </Text>
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <NumberInput
            flex={1}
            min={1}
            placeholder="면적"
            hideControls
            value={values.area}
            onChange={(v) => onChange({ area: typeof v === 'number' ? v : '' })}
          />
          <SegmentedControl
            data={[
              { value: 'pyeong', label: '평' },
              { value: 'sqm', label: 'm²' },
              { value: 'hectare', label: 'ha' },
            ]}
            value={values.areaUnit}
            onChange={(v) => onChange({ areaUnit: v as AreaUnit })}
          />
        </Group>
      </Box>

      <Box>
        <Text size="sm" fw={500} mb={4}>
          방문 요일
        </Text>
        <Text size="xs" c="dimmed" mb={8}>
          선택하면 단기 작업(파종·시비·방제 등)을 방문 요일에 맞춰 배치합니다. 비우면 매일 가능으로 처리.
        </Text>
        <Group grow gap="xs">
          {WEEKDAYS.map((w) => {
            const checked = values.visitDays.includes(w.v);
            return (
              <Button
                key={w.v}
                size="sm"
                radius="xl"
                px={6}
                variant={checked ? 'filled' : 'default'}
                color="green"
                leftSection={checked ? <IconCheck size={12} /> : <IconX size={12} />}
                styles={{
                  section: checked ? undefined : { color: 'var(--mantine-color-gray-5)' },
                }}
                onClick={() =>
                  onChange({
                    visitDays: checked
                      ? values.visitDays.filter((d) => d !== w.v)
                      : [...values.visitDays, w.v],
                  })
                }
              >
                {w.l}
              </Button>
            );
          })}
        </Group>
      </Box>
    </Stack>
  );
}

// 작물 검색 + 단일 선택 (농사로 작목별농업기술정보 카탈로그). 선택하면 카드로 표시, 변경 가능.
function CropPicker({
  value,
  onChange,
}: {
  value: CropCatalogItem | null;
  onChange: (c: CropCatalogItem | null) => void;
}) {
  const [q, setQ] = useState('');
  // 매 키 입력마다 요청하지 않도록 디바운스. 검색은 안정된 입력값(dq)으로만 나간다.
  const [dq] = useDebouncedValue(q.trim(), 250);
  const searchQ = useQuery({
    queryKey: ['crop-catalog', 'search', dq],
    queryFn: () => searchCropCatalog(dq),
    enabled: !value && dq.length >= 1,
    staleTime: 60_000,
  });
  // 입력은 했지만 디바운스가 아직 반영 전이면(타이핑 중) 스켈레톤을 보여 깜빡임을 막는다.
  const pending = q.trim().length >= 1 && (q.trim() !== dq || searchQ.isFetching);

  if (value) {
    return (
      <Box>
        <Text size="sm" fw={500} mb={4}>
          작물 <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
        </Text>
        <Card
          radius="md"
          p="sm"
          withBorder
          bg="green.0"
          style={{ borderColor: 'var(--mantine-color-green-3)' }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap={8} style={{ minWidth: 0 }}>
              {value.category && (
                <Badge color="green" variant="light" radius="sm">
                  {value.category}
                </Badge>
              )}
              <Text fw={700} truncate>
                {value.name}
              </Text>
            </Group>
            <UnstyledButton onClick={() => onChange(null)} aria-label="작물 변경">
              <IconX size={16} color="var(--mantine-color-gray-6)" />
            </UnstyledButton>
          </Group>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <TextInput
        label="작물"
        withAsterisk
        placeholder="예: 토마토, 상추, 대파…"
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
      />
      {q.trim().length >= 1 && (
        <Card radius="md" p="xs" withBorder mt={6} bg="white">
          {pending ? (
            <Stack gap={6}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} h={32} radius="sm" />
              ))}
            </Stack>
          ) : searchQ.data && searchQ.data.length > 0 ? (
            <Stack gap={2} mah={220} style={{ overflowY: 'auto' }}>
              {searchQ.data.map((c) => (
                <UnstyledButton
                  key={c.code}
                  onClick={() => {
                    onChange(c);
                    setQ('');
                  }}
                  p="6px 8px"
                  style={{ borderRadius: 6 }}
                  className="kw-crop-opt"
                >
                  <Group gap={8} wrap="nowrap">
                    {c.category && (
                      <Badge size="xs" color="gray" variant="light" radius="sm">
                        {c.category}
                      </Badge>
                    )}
                    <Text size="sm" fw={600} truncate>
                      {c.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" p={6}>
              검색 결과가 없습니다.
            </Text>
          )}
          <style jsx global>{`
            .kw-crop-opt:hover {
              background: var(--mantine-color-green-0);
            }
          `}</style>
        </Card>
      )}
    </Box>
  );
}
