'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type CSSProperties, Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Calendar, DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCalendarPlus,
  IconCalendarTime,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconNote,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { searchCrops } from '@/lib/api/crops';
import {
  createPlan,
  getPlan,
  updateSettings,
  updateTask,
  upsertMemo,
} from '@/lib/api/farmplan';
import { PROVINCE_OPTIONS, getCitiesByProvince } from '@/lib/regions';
import type {
  AreaUnit,
  CropOption,
  FarmPlan,
  FarmTask,
  TaskCategory,
} from '@/lib/types';

const FMT = 'YYYY-MM-DD';

const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  seeding: { label: '파종·정식', color: 'green' },
  growing: { label: '생육 관리', color: 'teal' },
  fertilize: { label: '시비', color: 'lime' },
  water: { label: '물·관수', color: 'cyan' },
  pest: { label: '병해충 예방', color: 'red' },
  harvest: { label: '수확·저장', color: 'orange' },
  etc: { label: '기타', color: 'gray' },
};

const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  pyeong: '평',
  sqm: 'm²',
  hectare: 'ha',
};

// 0=일 ~ 6=토 (dayjs/백엔드 isoweekday%7과 동일 인코딩). 표시는 월~일 순.
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
// getDay() 인덱스(0=일~6=토) → 한국어 요일
const KOR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MIN_YEAR = 1970; // 달력 연도 하한

function CalendarRoot() {
  const params = useSearchParams();
  const planIdParam = params.get('planId');
  const planId = planIdParam ? Number(planIdParam) : null;

  if (planId && !Number.isNaN(planId)) {
    return <PlanView planId={planId} />;
  }
  return <SetupForm />;
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <Box bg="gray.0" mih="100vh" py={48}>
          <Container size="lg">
            <Text c="dimmed">불러오는 중…</Text>
          </Container>
        </Box>
      }
    >
      <CalendarRoot />
    </Suspense>
  );
}

// ─────────────────────────── 설정 폼 ───────────────────────────

interface SetupValues {
  startDate: Date | null;
  province: string | null;
  city: string | null;
  area: number | '';
  areaUnit: AreaUnit;
  visitDays: number[];
}

function SetupForm() {
  const router = useRouter();
  const [crop, setCrop] = useState<CropOption | null>(null);

  const form = useForm<SetupValues>({
    initialValues: {
      startDate: new Date(),
      province: null,
      city: null,
      area: 300,
      areaUnit: 'pyeong',
      visitDays: [6, 0], // 기본: 주말(토·일)
    },
    validate: {
      startDate: (v) => (v ? null : '시작 날짜를 선택하세요'),
      province: (v) => (v ? null : '지역(시·도)을 선택하세요'),
      area: (v) => (typeof v === 'number' && v > 0 ? null : '면적을 입력하세요'),
    },
  });

  const createMut = useMutation({
    mutationFn: createPlan,
    onSuccess: (plan) => {
      sessionStorage.setItem('kiwofarm:lastPlanId', String(plan.id));
      router.push(`/calendar?planId=${plan.id}`);
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: '계획 생성 실패',
        message: '백엔드 서버·DB·OPENAI_API_KEY를 확인해 주세요.',
      });
    },
  });

  const onSubmit = form.onSubmit((values) => {
    if (!crop) {
      notifications.show({ color: 'red', message: '작목을 선택하세요.' });
      return;
    }
    const region = [values.province, values.city].filter(Boolean).join(' ');
    createMut.mutate({
      startDate: dayjs(values.startDate).format(FMT),
      itemCode: crop.item_code,
      kindCode: crop.kind_code,
      cropName: crop.item_name,
      region,
      province: values.province ?? undefined,
      area: typeof values.area === 'number' ? values.area : 0,
      areaUnit: values.areaUnit,
      visitDays: values.visitDays.length ? [...values.visitDays].sort((a, b) => a - b) : undefined,
    });
  });

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/dashboard">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  대시보드로
                </Text>
              </Group>
            </UnstyledButton>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              RAG · 농사로 농업기술정보
            </Badge>
          </Group>

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
            <form onSubmit={onSubmit}>
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
                    if (wd === 6)
                      return { style: { color: 'var(--mantine-color-blue-6)' } };
                    if (wd === 0)
                      return { style: { color: 'var(--mantine-color-red-6)' } };
                    return {};
                  }}
                  {...form.getInputProps('startDate')}
                />

                <CropPicker value={crop} onChange={setCrop} />

                <Group grow align="flex-start">
                  <Select
                    label="지역 (시·도)"
                    placeholder="선택"
                    withAsterisk
                    searchable
                    data={PROVINCE_OPTIONS}
                    leftSection={<IconMapPin size={16} />}
                    {...form.getInputProps('province')}
                    onChange={(v) => {
                      form.setFieldValue('province', v);
                      form.setFieldValue('city', null);
                    }}
                  />
                  <Select
                    label="시·군·구"
                    placeholder={form.values.province ? '선택' : ''}
                    searchable
                    disabled={!form.values.province}
                    data={form.values.province ? getCitiesByProvince(form.values.province) : []}
                    {...form.getInputProps('city')}
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
                      {...form.getInputProps('area')}
                    />
                    <SegmentedControl
                      data={[
                        { value: 'pyeong', label: '평' },
                        { value: 'sqm', label: 'm²' },
                        { value: 'hectare', label: 'ha' },
                      ]}
                      {...form.getInputProps('areaUnit')}
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
                      const checked = form.values.visitDays.includes(w.v);
                      return (
                        <Button
                          key={w.v}
                          size="sm"
                          radius="xl"
                          px={6}
                          variant={checked ? 'filled' : 'default'}
                          color="green"
                          leftSection={
                            checked ? <IconCheck size={12} /> : <IconX size={12} />
                          }
                          styles={{
                            section: checked
                              ? undefined
                              : { color: 'var(--mantine-color-gray-5)' },
                          }}
                          onClick={() =>
                            form.setFieldValue(
                              'visitDays',
                              checked
                                ? form.values.visitDays.filter((d) => d !== w.v)
                                : [...form.values.visitDays, w.v],
                            )
                          }
                        >
                          {w.l}
                        </Button>
                      );
                    })}
                  </Group>
                </Box>

                <Button
                  type="submit"
                  color="green"
                  size="md"
                  loading={createMut.isPending}
                  leftSection={<IconCalendarPlus size={18} />}
                  mt={4}
                >
                  농사 계획 생성
                </Button>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

// 작목 검색 + 선택 (기존 /crops/search 재사용)
function CropPicker({
  value,
  onChange,
}: {
  value: CropOption | null;
  onChange: (c: CropOption | null) => void;
}) {
  const [q, setQ] = useState('');
  const searchQ = useQuery({
    queryKey: ['crops', 'search', q],
    queryFn: () => searchCrops(q, 20),
    enabled: !value && q.trim().length >= 1,
    staleTime: 60_000,
  });

  if (value) {
    return (
      <Box>
        <Text size="sm" fw={500} mb={4}>
          작목 <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
        </Text>
        <Card radius="md" p="sm" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap={8}>
              <Badge color="green" variant="light" radius="sm">
                {value.group_name}
              </Badge>
              <Text fw={700}>{value.kind_name}</Text>
              <Text size="sm" c="dimmed">
                {value.item_name}
              </Text>
            </Group>
            <UnstyledButton onClick={() => onChange(null)} aria-label="작목 변경">
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
        label="작목"
        withAsterisk
        placeholder="예: 토마토, 상추, 고추…"
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
      />
      {q.trim().length >= 1 && (
        <Card radius="md" p="xs" withBorder mt={6} bg="white">
          {searchQ.isLoading ? (
            <Stack gap={6}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} h={32} radius="sm" />
              ))}
            </Stack>
          ) : searchQ.data && searchQ.data.length > 0 ? (
            <Stack gap={2} mah={220} style={{ overflowY: 'auto' }}>
              {searchQ.data.map((c) => (
                <UnstyledButton
                  key={`${c.item_code}-${c.kind_code}`}
                  onClick={() => {
                    onChange(c);
                    setQ('');
                  }}
                  p="6px 8px"
                  style={{ borderRadius: 6 }}
                  className="kw-crop-opt"
                >
                  <Group gap={8} wrap="nowrap">
                    <Badge size="xs" color="gray" variant="light" radius="sm">
                      {c.group_name}
                    </Badge>
                    <Text size="sm" fw={600}>
                      {c.kind_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {c.item_name}
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

// ─────────────────────────── 계획 캘린더 뷰 ───────────────────────────

function PlanView({ planId }: { planId: number }) {
  const qc = useQueryClient();
  const planQ = useQuery({
    queryKey: ['farmplan', planId],
    queryFn: () => getPlan(planId),
  });

  const [month, setMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  const plan = planQ.data;

  // 첫 로드 시 시작월/선택일을 계획 시작일로 맞춤
  useEffect(() => {
    if (plan && !month) {
      const start = dayjs(plan.startDate).toDate();
      setMonth(start);
      setSelected(start);
    }
  }, [plan, month]);

  const setPlan = (next: FarmPlan) => qc.setQueryData(['farmplan', planId], next);

  if (planQ.isLoading) {
    return (
      <Box bg="gray.0" mih="100vh" py={48}>
        <Container size="lg">
          <Skeleton h={400} radius="lg" />
        </Container>
      </Box>
    );
  }
  if (planQ.isError || !plan) {
    return (
      <Box bg="gray.0" mih="100vh" py={48}>
        <Container size="lg">
          <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
            농사 계획을 불러오지 못했습니다.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
        <Stack gap="lg">
          <PlanHeader plan={plan} planId={planId} onChange={setPlan} />
          <Grid gutter="lg" align="stretch">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <PlanCalendar
                plan={plan}
                month={month}
                onMonthChange={setMonth}
                selected={selected}
                onSelect={setSelected}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DayPanel
                plan={plan}
                planId={planId}
                selected={selected}
                onChange={setPlan}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

function PlanHeader({
  plan,
  planId,
  onChange,
}: {
  plan: FarmPlan;
  planId: number;
  onChange: (p: FarmPlan) => void;
}) {
  const settingsMut = useMutation({
    mutationFn: (v: boolean) => updateSettings(planId, v),
    onSuccess: onChange,
  });

  const visitLabel =
    (plan.visitDays?.length ?? 0) > 0
      ? [...(plan.visitDays ?? [])]
          .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
          .map((d) => WEEKDAY_LABEL[d])
          .join('·')
      : '매일';

  // 헤더 요약: 가로 한 줄(지역·면적·시작·작업·방문)을 카드 폭 전체에 균등 분할. 세그먼트 사이 세로 구분선.
  type Seg = { key: string; node: React.ReactNode; color?: string; bold?: boolean };
  const summarySegments: Seg[] = [
    { key: 'region', color: 'green.8', bold: true, node: plan.region || '지역 미지정' },
    {
      key: 'area',
      node: `${plan.area.toLocaleString()} ${AREA_UNIT_LABEL[plan.areaUnit]}`,
    },
    { key: 'start', node: `시작 ${dayjs(plan.startDate).format('YYYY.MM.DD')}` },
    {
      key: 'visit',
      color: 'teal.7',
      node: (
        <Group gap={4} wrap="nowrap" justify="center">
          <IconCalendarTime size={16} color="var(--mantine-color-teal-7)" />
          <span>방문 {visitLabel}</span>
        </Group>
      ),
    },
  ];

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
      <Group justify="space-between" wrap="wrap" gap="md" align="flex-start">
        <Box style={{ flex: 1, minWidth: 280 }}>
          <Group gap={8} align="center">
            <UnstyledButton component={Link} href="/calendar">
              <Group gap={4}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  새 계획
                </Text>
              </Group>
            </UnstyledButton>
          </Group>
          <Title order={2} fz={{ base: 22, md: 28 }} fw={800} mt={6}>
            {plan.cropName} 농사 계획
          </Title>
        </Box>
        <Switch
          label="완료/지연 표시"
          description="켜면 작업을 완료·지연 처리하고 일정이 자동 조정됩니다"
          color="green"
          checked={plan.trackProgress}
          onChange={(e) => settingsMut.mutate(e.currentTarget.checked)}
          disabled={settingsMut.isPending}
        />
      </Group>
      {/* 요약 행: 카드(연두색) 폭 전체를 균등 분할해 오른쪽 끝까지 펼침 */}
      <Group gap={0} mt="md" wrap="nowrap" align="stretch">
        {summarySegments.map((seg, i) => (
          <Fragment key={seg.key}>
            {i > 0 && <Divider orientation="vertical" mx={{ base: 'xs', md: 'md' }} />}
            <Box
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text ta="center" fz={{ base: 13, md: 17 }} fw={seg.bold ? 700 : 600} c={seg.color}>
                {seg.node}
              </Text>
            </Box>
          </Fragment>
        ))}
      </Group>
    </Card>
  );
}

function tasksByDate(plan: FarmPlan): Map<string, FarmTask[]> {
  const map = new Map<string, FarmTask[]>();
  for (const t of plan.tasks) {
    let d = dayjs(t.date);
    const end = dayjs(t.endDate);
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      const key = d.format(FMT);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
      d = d.add(1, 'day');
    }
  }
  return map;
}

const MAX_LANES = 4;

interface BarSeg {
  color: string;
  isStart: boolean;
  isEnd: boolean;
}

// 여러 날 이어지는(기간형) 작업을 겹치지 않게 레인(행)으로 배치 → 날짜별 막대 세그먼트.
function computeBars(plan: FarmPlan): {
  barsByDate: Map<string, (BarSeg | undefined)[]>;
  laneCount: number;
} {
  const multi = plan.tasks
    .filter((t) => t.durationDays > 1)
    .slice()
    .sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : b.durationDays - a.durationDays,
    );
  const laneEnd: string[] = []; // 레인별 마지막 점유 종료일
  const placed: { task: FarmTask; lane: number }[] = [];
  for (const t of multi) {
    let lane = laneEnd.findIndex((e) => e < t.date);
    if (lane === -1) {
      lane = laneEnd.length;
      laneEnd.push(t.endDate);
    } else {
      laneEnd[lane] = t.endDate;
    }
    placed.push({ task: t, lane });
  }
  const laneCount = Math.min(laneEnd.length, MAX_LANES);
  const barsByDate = new Map<string, (BarSeg | undefined)[]>();
  for (const { task, lane } of placed) {
    if (lane >= MAX_LANES) continue;
    let d = dayjs(task.date);
    const end = dayjs(task.endDate);
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      const k = d.format(FMT);
      const arr = barsByDate.get(k) ?? [];
      arr[lane] = {
        color: CATEGORY_META[task.category].color,
        isStart: k === task.date,
        isEnd: k === task.endDate,
      };
      barsByDate.set(k, arr);
      d = d.add(1, 'day');
    }
  }
  return { barsByDate, laneCount };
}

// 하루짜리 작업만 점으로 (기간형은 막대로 표시).
function singleDayDots(plan: FarmPlan): Map<string, TaskCategory[]> {
  const map = new Map<string, TaskCategory[]>();
  for (const t of plan.tasks) {
    if (t.durationDays > 1) continue;
    const arr = map.get(t.date) ?? [];
    if (!arr.includes(t.category)) arr.push(t.category);
    map.set(t.date, arr);
  }
  return map;
}

// 월 선택 오버레이 그리드(1~12월). 연도 라벨 클릭 시 연도 선택으로 전환.
function MonthGrid({
  baseDate,
  onChangeYear,
  onOpenYears,
  onPickMonth,
}: {
  baseDate: Date;
  onChangeYear: (year: number) => void;
  onOpenYears: () => void;
  onPickMonth: (monthIndex: number) => void;
}) {
  const year = dayjs(baseDate).year();
  return (
    <Box maw={480} mx="auto">
      <Group justify="space-between" align="center" mb="sm" px="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          disabled={year <= MIN_YEAR}
          onClick={() => onChangeYear(year - 1)}
          aria-label="이전 해"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <UnstyledButton onClick={onOpenYears}>
          <Text fw={700}>{year}년</Text>
        </UnstyledButton>
        <ActionIcon variant="subtle" color="gray" onClick={() => onChangeYear(year + 1)} aria-label="다음 해">
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>
      <SimpleGrid cols={3} spacing="md" verticalSpacing="md">
        {Array.from({ length: 12 }, (_, m) => (
          <Button key={m} size="md" variant="subtle" color="dark" fullWidth h={48} onClick={() => onPickMonth(m)}>
            {m + 1}월
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  );
}

// 연도 선택 오버레이 그리드. 해당 10년 + 앞뒤 한 해. 경계 연도 클릭 시 이웃 10년대로 이동.
function DecadeYearGrid({
  baseDate,
  onMoveDecade,
  onPickYear,
}: {
  baseDate: Date;
  onMoveDecade: (year: number) => void;
  onPickYear: (year: number) => void;
}) {
  const start = Math.floor(dayjs(baseDate).year() / 10) * 10;
  const years = Array.from({ length: 12 }, (_, i) => start - 1 + i); // (start-1) ~ (start+10)
  return (
    <Box maw={480} mx="auto">
      <Group justify="space-between" align="center" mb="sm" px="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          disabled={start <= MIN_YEAR}
          onClick={() => onMoveDecade(start - 10)}
          aria-label="이전 10년"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={700}>
          {start} - {start + 9}
        </Text>
        <ActionIcon variant="subtle" color="gray" onClick={() => onMoveDecade(start + 10)} aria-label="다음 10년">
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>
      <SimpleGrid cols={3} spacing="md" verticalSpacing="md">
        {years.map((y) => {
          const outside = y < start || y > start + 9;
          if (y < MIN_YEAR) {
            // 하한 미만: 회색 버튼 대신 가운데 "-" 텍스트만
            return (
              <Box
                key={y}
                c="gray.4"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                -
              </Box>
            );
          }
          return (
            <Button
              key={y}
              size="md"
              variant="subtle"
              color={outside ? 'gray' : 'dark'}
              c={outside ? 'dimmed' : undefined}
              fullWidth
              h={48}
              onClick={() => (outside ? onMoveDecade(y) : onPickYear(y))}
            >
              {y}
            </Button>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function PlanCalendar({
  plan,
  month,
  onMonthChange,
  selected,
  onSelect,
}: {
  plan: FarmPlan;
  month: Date | null;
  onMonthChange: (d: Date | null) => void;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  // 월/연도 선택 오버레이 모드 (null이면 달력 표시)
  const [pickerMode, setPickerMode] = useState<'months' | 'years' | null>(null);
  const goToday = () => {
    const today = new Date();
    onMonthChange(today);
    onSelect(today);
    setPickerMode(null);
  };
  const { barsByDate, laneCount } = useMemo(() => computeBars(plan), [plan]);
  const dotsByDate = useMemo(() => singleDayDots(plan), [plan]);
  const memoDates = useMemo(
    () => new Set(plan.memos.map((m) => m.memoDate)),
    [plan.memos],
  );
  // 시작일 = plan.startDate, 마지막일 = 가장 늦은 작업 종료일 (YYYY-MM-DD 문자열 비교로 충분)
  const startKey = plan.startDate;
  const lastKey = useMemo(() => {
    let last = plan.startDate;
    for (const t of plan.tasks) if (t.endDate > last) last = t.endDate;
    return last;
  }, [plan.tasks, plan.startDate]);
  // 방문 요일(0=일~6=토). dayjs(date).day()와 동일 인코딩.
  const visitDaySet = useMemo(() => new Set(plan.visitDays ?? []), [plan.visitDays]);

  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <style jsx global>{`
        /* 달력을 카드 폭에 꽉 채움 */
        .kw-cal {
          width: 100%;
        }
        .kw-cal .mantine-Calendar-calendarHeader {
          max-width: 100%;
        }
        /* 헤더 라벨(2026년 6월) 가운데 정렬 */
        .kw-cal .mantine-Calendar-calendarHeaderLevel {
          justify-content: center;
          text-align: center;
        }
        /* 월/년 선택 그리드: 폭에 꽉 채워 균등 분할 + 칸 안에서 가운데 정렬 */
        .kw-cal .mantine-Calendar-monthsList,
        .kw-cal .mantine-Calendar-yearsList {
          width: 100%;
          table-layout: fixed;
        }
        .kw-cal .mantine-Calendar-monthsListCell,
        .kw-cal .mantine-Calendar-yearsListCell {
          text-align: center;
        }
        .kw-cal .mantine-Calendar-monthsListControl,
        .kw-cal .mantine-Calendar-yearsListControl {
          margin-inline: auto;
        }
        /* 표를 카드 폭에 꽉 채워 7칸 균등 분할, 날짜 칸은 정사각형 */
        .kw-cal .mantine-Calendar-month,
        .kw-cal .mantine-Calendar-weekdaysRow {
          width: 100%;
          table-layout: fixed;
        }
        .kw-cal .mantine-Calendar-day {
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
        }
        .kw-cal .mantine-Calendar-weekday {
          font-size: 0.8rem;
          font-weight: 700;
        }
        /* 월화수목금토일 순서: 6번째=토(파랑), 마지막=일(빨강) */
        .kw-cal .mantine-Calendar-weekday:nth-of-type(6) {
          color: var(--mantine-color-blue-6);
        }
        .kw-cal .mantine-Calendar-weekday:last-of-type {
          color: var(--mantine-color-red-6);
        }
      `}</style>
      {/* 6주 기준 높이 예약(+여백) — 5주인 달은 아래가 여백, 달이 바뀌어도 카드 높이 일정 */}
      <Box mih={{ base: 380, md: 610 }} w="100%" pos="relative">
      <Calendar
        className="kw-cal"
        date={month ?? undefined}
        onDateChange={onMonthChange}
        level="month"
        onLevelChange={(lv) => {
          if (lv === 'year') setPickerMode('months');
          else if (lv === 'decade') setPickerMode('years');
        }}
        minDate={new Date(MIN_YEAR, 0, 1)}
        size="xl"
        firstDayOfWeek={1}
        weekdayFormat={(date) => KOR_WEEKDAYS[date.getDay()]}
        monthLabelFormat="YYYY년 M월"
        yearLabelFormat="YYYY년"
        monthsListFormat="M월"
        style={{ '--day-size': '3rem', width: '100%' } as CSSProperties}
        getDayProps={(date) => ({
          onClick: () => onSelect(date),
        })}
        renderDay={(date) => {
          const key = dayjs(date).format(FMT);
          const bars = barsByDate.get(key) ?? [];
          const dots = (dotsByDate.get(key) ?? []).slice(0, 4);
          const hasMemo = memoDates.has(key);
          const isStart = key === startKey;
          const isLast = key === lastKey;
          const wd = dayjs(date).day(); // 0=일 ~ 6=토
          // 방문 요일 표시는 계획 기간(시작~마지막 작업일) 안에서만 — 수확 이후엔 숨김
          const isVisitDay =
            visitDaySet.has(wd) && key >= startKey && key <= lastKey;
          const isSelected = selected ? dayjs(date).isSame(selected, 'date') : false;
          const edgeColor = isStart
            ? 'var(--mantine-color-green-7)'
            : 'var(--mantine-color-orange-7)';
          const bg = isSelected
            ? 'var(--mantine-color-green-1)'
            : isVisitDay
              ? 'var(--mantine-color-green-0)'
              : undefined;
          const border = isSelected
            ? '2px solid var(--mantine-color-green-5)'
            : isStart || isLast
              ? `2px solid ${edgeColor}`
              : undefined;
          const numColor =
            wd === 0
              ? 'var(--mantine-color-red-6)'
              : wd === 6
                ? 'var(--mantine-color-blue-6)'
                : undefined;
          return (
            <Stack
              gap={2}
              align="stretch"
              justify="flex-start"
              style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                paddingTop: 4,
                background: bg,
                border,
                borderRadius: bg || border ? 6 : undefined,
              }}
            >
              <Text ta="center" size="md" fw={isSelected ? 700 : 500} lh={1} style={{ color: numColor }}>
                {date.getDate()}
              </Text>

              {laneCount > 0 && (
                <Stack gap={2} style={{ width: '100%' }}>
                  {Array.from({ length: laneCount }).map((_, lane) => {
                    const seg = bars[lane];
                    return (
                      <Box
                        key={lane}
                        h={5}
                        style={{
                          width: '100%',
                          background: seg
                            ? `var(--mantine-color-${seg.color}-5)`
                            : 'transparent',
                          borderTopLeftRadius: seg?.isStart ? 3 : 0,
                          borderBottomLeftRadius: seg?.isStart ? 3 : 0,
                          borderTopRightRadius: seg?.isEnd ? 3 : 0,
                          borderBottomRightRadius: seg?.isEnd ? 3 : 0,
                        }}
                      />
                    );
                  })}
                </Stack>
              )}

              {(dots.length > 0 || hasMemo) && (
                <Group gap={2} justify="center" style={{ minHeight: 6 }}>
                  {dots.map((c) => (
                    <Box
                      key={c}
                      w={5}
                      h={5}
                      style={{
                        borderRadius: '50%',
                        background: `var(--mantine-color-${CATEGORY_META[c].color}-6)`,
                      }}
                    />
                  ))}
                  {hasMemo && (
                    <Box
                      w={5}
                      h={5}
                      style={{
                        borderRadius: '50%',
                        background: 'var(--mantine-color-yellow-6)',
                      }}
                    />
                  )}
                </Group>
              )}
            </Stack>
          );
        }}
      />
      {pickerMode && (
        <Box
          pos="absolute"
          inset={0}
          onClick={() => setPickerMode(null)}
          style={{
            zIndex: 5,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 8,
          }}
        >
          <Card
            withBorder
            shadow="md"
            radius="md"
            bg="white"
            p="md"
            w={{ base: '94%', md: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
          <Group justify="space-between" mb="sm">
            <Button size="compact-sm" variant="light" color="green" onClick={goToday}>
              오늘
            </Button>
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={() => setPickerMode(null)}
            >
              닫기
            </Button>
          </Group>
          {pickerMode === 'months' ? (
            <MonthGrid
              baseDate={month ?? new Date()}
              onChangeYear={(y) =>
                onMonthChange(new Date(y, month ? dayjs(month).month() : 0, 1))
              }
              onOpenYears={() => setPickerMode('years')}
              onPickMonth={(m) => {
                onMonthChange(new Date(month ? dayjs(month).year() : new Date().getFullYear(), m, 1));
                setPickerMode(null);
              }}
            />
          ) : (
            <DecadeYearGrid
              baseDate={month ?? new Date()}
              onMoveDecade={(y) => onMonthChange(new Date(y, 0, 1))}
              onPickYear={(y) => {
                onMonthChange(new Date(y, month ? dayjs(month).month() : 0, 1));
                setPickerMode('months');
              }}
            />
          )}
          </Card>
        </Box>
      )}
      </Box>
      <Group gap="md" mt="md" justify="center" wrap="wrap">
        {(Object.keys(CATEGORY_META) as TaskCategory[]).map((c) => (
          <Group key={c} gap={4}>
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                background: `var(--mantine-color-${CATEGORY_META[c].color}-6)`,
              }}
            />
            <Text size="xs" c="dimmed">
              {CATEGORY_META[c].label}
            </Text>
          </Group>
        ))}
      </Group>
      <Group gap="lg" mt={6} justify="center" wrap="wrap">
        <Group gap={6}>
          <Box w={5} h={5} bg="yellow.6" style={{ borderRadius: '50%' }} />
          <Text size="xs" c="dimmed">
            메모
          </Text>
        </Group>
        {(plan.visitDays?.length ?? 0) > 0 && (
          <Group gap={6}>
            <Box w={14} h={14} bg="green.0" style={{ borderRadius: 4, border: '1px solid var(--mantine-color-green-3)' }} />
            <Text size="xs" c="dimmed">
              방문 요일
            </Text>
          </Group>
        )}
      </Group>
    </Card>
  );
}

function DayPanel({
  plan,
  planId,
  selected,
  onChange,
}: {
  plan: FarmPlan;
  planId: number;
  selected: Date | null;
  onChange: (p: FarmPlan) => void;
}) {
  const key = selected ? dayjs(selected).format(FMT) : null;
  const byDate = useMemo(() => tasksByDate(plan), [plan]);
  const dayTasks = key ? byDate.get(key) ?? [] : [];
  const existingMemo = key ? plan.memos.find((m) => m.memoDate === key)?.content ?? '' : '';

  const [memoDraft, setMemoDraft] = useState(existingMemo);
  useEffect(() => setMemoDraft(existingMemo), [existingMemo, key]);

  const taskMut = useMutation({
    mutationFn: ({ taskId, status, delayDays }: { taskId: number; status: FarmTask['status']; delayDays?: number }) =>
      updateTask(planId, taskId, status, delayDays),
    onSuccess: onChange,
    onError: () =>
      notifications.show({ color: 'red', message: '작업 상태 변경에 실패했습니다.' }),
  });

  const memoMut = useMutation({
    mutationFn: (content: string) => upsertMemo(planId, key!, content),
    onSuccess: (p) => {
      onChange(p);
      notifications.show({ color: 'green', message: '메모를 저장했습니다.' });
    },
  });

  if (!key) {
    return (
      <Card radius="lg" p="lg" withBorder bg="white">
        <Text c="dimmed" size="sm">
          날짜를 선택하면 그 날의 작업과 메모를 볼 수 있습니다.
        </Text>
      </Card>
    );
  }

  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Stack gap="md">
        <Group gap={6}>
          <ThemeIcon size={26} radius="md" color="green" variant="light">
            <IconCalendarPlus size={14} />
          </ThemeIcon>
          <Title order={4}>{dayjs(selected).format('M월 D일 (ddd)')}</Title>
        </Group>

        {dayTasks.length === 0 ? (
          <Text size="sm" c="dimmed">
            이 날짜에 예정된 작업이 없습니다.
          </Text>
        ) : (
          <Stack gap="sm">
            {dayTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                trackProgress={plan.trackProgress}
                pending={taskMut.isPending}
                onStatus={(status, delayDays) =>
                  taskMut.mutate({ taskId: t.id, status, delayDays })
                }
              />
            ))}
          </Stack>
        )}

        <Box>
          <Group gap={6} mb={6}>
            <IconNote size={16} color="var(--mantine-color-yellow-7)" />
            <Text size="sm" fw={700}>
              이 날짜 메모
            </Text>
          </Group>
          <Textarea
            placeholder="예: 비 예보로 방제 하루 미룸, 묘 상태 양호…"
            autosize
            minRows={3}
            value={memoDraft}
            onChange={(e) => setMemoDraft(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button
              size="xs"
              color="green"
              loading={memoMut.isPending}
              onClick={() => memoMut.mutate(memoDraft)}
            >
              메모 저장
            </Button>
          </Group>
        </Box>
      </Stack>
    </Card>
  );
}

function TaskRow({
  task,
  trackProgress,
  pending,
  onStatus,
}: {
  task: FarmTask;
  trackProgress: boolean;
  pending: boolean;
  onStatus: (status: FarmTask['status'], delayDays?: number) => void;
}) {
  const meta = CATEGORY_META[task.category];
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayDays, setDelayDays] = useState<number | ''>(3);

  return (
    <Card
      radius="md"
      p="sm"
      withBorder
      style={{
        borderColor: 'var(--mantine-color-gray-2)',
        opacity: task.status === 'done' ? 0.6 : 1,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Group gap={6} mb={2}>
            <Badge size="xs" color={meta.color} variant="light" radius="sm">
              {meta.label}
            </Badge>
            {task.status === 'done' && (
              <Badge size="xs" color="green" radius="sm" leftSection={<IconCheck size={10} />}>
                완료
              </Badge>
            )}
            {task.status === 'delayed' && (
              <Badge size="xs" color="red" variant="light" radius="sm" leftSection={<IconClock size={10} />}>
                지연
              </Badge>
            )}
          </Group>
          <Text
            fw={700}
            fz={14}
            td={task.status === 'done' ? 'line-through' : undefined}
          >
            {task.title}
          </Text>
          {task.detail && (
            <Text size="xs" c="gray.7" mt={2} lh={1.5}>
              {task.detail}
            </Text>
          )}
          {task.sourceNote && (
            <Text size="xs" c="dimmed" mt={2}>
              - {task.sourceNote}  {/* 근거 */}
            </Text>
          )}
        </Box>
        {trackProgress && (
          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Button
              size="compact-xs"
              variant={task.status === 'done' ? 'filled' : 'light'}
              color="green"
              leftSection={<IconCheck size={12} />}
              disabled={pending}
              onClick={() => onStatus(task.status === 'done' ? 'planned' : 'done')}
            >
              {task.status === 'done' ? '완료 취소' : '완료'}
            </Button>
            <Button
              size="compact-xs"
              variant="light"
              color="orange"
              leftSection={<IconClock size={12} />}
              disabled={pending}
              onClick={() => setDelayOpen((v) => !v)}
            >
              지연
            </Button>
          </Group>
        )}
      </Group>

      {trackProgress && delayOpen && (
        <Group gap={6} align="center" mt="sm">
          <Text size="xs" c="dimmed">
            며칠 미룰까요?
          </Text>
          <NumberInput
            size="xs"
            w={80}
            min={1}
            hideControls
            value={delayDays}
            onChange={(v) => setDelayDays(typeof v === 'number' ? v : '')}
          />
          <Button
            size="compact-xs"
            color="orange"
            disabled={pending || typeof delayDays !== 'number'}
            onClick={() => {
              onStatus('delayed', typeof delayDays === 'number' ? delayDays : 0);
              setDelayOpen(false);
            }}
          >
            적용 (이후 일정 시프트)
          </Button>
        </Group>
      )}
    </Card>
  );
}
