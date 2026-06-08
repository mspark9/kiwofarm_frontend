'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type CSSProperties,
  Fragment,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Calendar, DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconBasket,
  IconCalendarPlus,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconExternalLink,
  IconBulb,
  IconLayoutGrid,
  IconMapPin,
  IconNote,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { searchCropCatalog } from '@/lib/api/crops';
import {
  createPlan,
  createPlansBatch,
  delayTasksBatch,
  deleteMemoImage,
  getPlan,
  getPlanAlerts,
  getWeeklyDigest,
  listPlans,
  updateTask,
  uploadMemoImages,
  upsertMemo,
} from '@/lib/api/farmplan';
import { verifyHarvestJournal } from '@/lib/api/rewards';
import { mediaUrl } from '@/lib/constants';
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
  FarmPlan,
  FarmPlanCreate,
  FarmTask,
  HarvestJournalResponse,
  GrowConditions,
  TaskCategory,
} from '@/lib/types';

const FMT = 'YYYY-MM-DD';

const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  seeding: { label: '파종·정식', color: 'green' },
  growing: { label: '생육 관리', color: 'teal' },
  fertilize: { label: '시비', color: 'lime' },
  water: { label: '물·관수', color: 'cyan' },
  pest: { label: '병해충 예방', color: 'red' },
  harvest: { label: '수확', color: 'orange' },
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

// 색은 '할 일 카테고리' 구분 전용. 작물(계획)은 색이 아니라 이름·회색톤 배지로 구분한다.
interface LoadedPlan {
  id: number;
  plan: FarmPlan;
}

function CalendarRoot() {
  const params = useSearchParams();
  const planIdParam = params.get('planId');
  const viewParam = params.get('view');
  const parsed = planIdParam ? Number(planIdParam) : null;
  const planId = parsed && !Number.isNaN(parsed) ? parsed : null;
  const showAll = viewParam === 'all';

  const { ids, ready, add, remove } = usePlanIds();

  // 생성 후 리다이렉트·공유 링크로 들어온 계획 ID 를 보관 목록에 등록
  useEffect(() => {
    if (planId) add(planId);
  }, [planId, add]);

  // 서버의 내 계획 목록(로그인 계정 또는 게스트 공용 데이터)을 탭에 합류 —
  // 기기를 옮겨도, 게스트 체험 데이터도 localStorage 없이 바로 보이게.
  const serverPlansQ = useQuery({
    queryKey: ['plans', 'list'],
    queryFn: listPlans,
    staleTime: 30_000,
  });
  useEffect(() => {
    for (const p of serverPlansQ.data ?? []) add(p.id);
  }, [serverPlansQ.data, add]);

  // 탭·모두보기를 위해 보관된 모든 계획을 로드 (PlanView 와 동일 queryKey → 캐시 공유)
  const planQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['farmplan', id],
      queryFn: () => getPlan(id),
      retry: false,
      staleTime: 30_000,
    })),
  });

  // 404 등으로 로드 실패한 계획(삭제·DB 초기화)은 보관 목록에서 정리
  const errorKey = ids.filter((_, i) => planQueries[i]?.isError).join(',');
  useEffect(() => {
    if (!errorKey) return;
    for (const id of errorKey.split(',')) remove(Number(id));
  }, [errorKey, remove]);

  const loaded: LoadedPlan[] = ids
    .map((id, i) => ({ id, plan: planQueries[i]?.data }))
    .filter((p): p is { id: number; plan: FarmPlan } => Boolean(p.plan))
    .map((p) => ({ id: p.id, plan: p.plan }));

  const tabs =
    ready && loaded.length > 0 ? (
      <PlanTabs plans={loaded} activeId={showAll ? null : planId} showAll={showAll} />
    ) : null;

  if (showAll) {
    return <AllPlansView plans={loaded} loading={planQueries.some((q) => q.isLoading)} tabs={tabs} />;
  }
  if (planId) {
    return <PlanView planId={planId} tabs={tabs} />;
  }
  return <SetupForm tabs={tabs} />;
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

// 추천받기 frequency('매일'·'주2~3회'·'주말만') → 방문 요일(0=일~6=토).
function freqToVisitDays(freq: string | null | undefined): number[] {
  switch (freq) {
    case '매일':
      return []; // 비우면 매일 가능
    case '주2~3회':
      return [3, 6]; // 수·토
    case '주말만':
      return [6, 0]; // 토·일
    default:
      return [6];
  }
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

function SetupForm({ tabs }: { tabs?: ReactNode }) {
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
      next.startDate =
        input.start === 'next_month'
          ? dayjs().add(1, 'month').startOf('month').toDate()
          : new Date();
      if (input.frequency) next.visitDays = freqToVisitDays(input.frequency);
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

  const validateDraft = (): string | null => {
    if (!draft.startDate) return '시작 날짜를 선택하세요.';
    if (!draft.province) return '지역(시·도)을 선택하세요.';
    if (!(typeof draft.area === 'number' && draft.area > 0)) return '면적을 입력하세요.';
    return null;
  };

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
  const removeQueued = (key: string) =>
    setQueue((q) => q.filter((e) => e.key !== key));

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
        created.length === 1 ? `/calendar?planId=${created[0].id}` : '/calendar?view=all',
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
            <UnstyledButton component={Link} href="/">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  홈으로
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
                  {queue.map((e) => (
                    <QueuedCrop key={e.key} entry={e} onRemove={() => removeQueued(e.key)} />
                  ))}
                  <Divider my={4} label="다음 작물" labelPosition="center" />
                </Stack>
              )}

              {growConditions && (
                <Alert
                  color="green"
                  variant="light"
                  radius="md"
                  icon={<IconSparkles size={16} />}
                  py={8}
                >
                  추천받기에서 입력한 조건(지역·면적·시작 시기·재배 환경)을 자동으로 채웠어요. 필요하면
                  수정할 수 있고, 일정 생성 시 재배 환경도 함께 고려됩니다.
                </Alert>
              )}

              <CropPicker value={crop} onChange={setCrop} />

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
                value={draft.startDate}
                onChange={(v) => setDf({ startDate: v })}
              />

              <Group grow align="flex-start">
                <Select
                  label="지역 (시·도)"
                  placeholder="선택"
                  withAsterisk
                  searchable
                  data={PROVINCE_OPTIONS}
                  leftSection={<IconMapPin size={16} />}
                  value={draft.province}
                  onChange={(v) => setDf({ province: v, city: null })}
                />
                <Select
                  label="시·군·구"
                  placeholder={draft.province ? '선택' : ''}
                  searchable
                  disabled={!draft.province}
                  data={draft.province ? getCitiesByProvince(draft.province) : []}
                  value={draft.city}
                  onChange={(v) => setDf({ city: v })}
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
                    value={draft.area}
                    onChange={(v) => setDf({ area: typeof v === 'number' ? v : '' })}
                  />
                  <SegmentedControl
                    data={[
                      { value: 'pyeong', label: '평' },
                      { value: 'sqm', label: 'm²' },
                      { value: 'hectare', label: 'ha' },
                    ]}
                    value={draft.areaUnit}
                    onChange={(v) => setDf({ areaUnit: v as AreaUnit })}
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
                    const checked = draft.visitDays.includes(w.v);
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
                          setDf({
                            visitDays: checked
                              ? draft.visitDays.filter((d) => d !== w.v)
                              : [...draft.visitDays, w.v],
                          })
                        }
                      >
                        {w.l}
                      </Button>
                    );
                  })}
                </Group>
              </Box>

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

// 추가된(대기 중) 작물 한 줄 요약 — 작목 + 지역·면적·시작일·방문 요일.
function QueuedCrop({ entry, onRemove }: { entry: CropEntry; onRemove: () => void }) {
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
      <Group justify="space-between" wrap="nowrap">
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
        <ActionIcon variant="subtle" color="gray" onClick={onRemove} aria-label="추가 취소">
          <IconX size={16} />
        </ActionIcon>
      </Group>
    </Card>
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

// ─────────────────────────── 작물 탭 + 모두보기 ───────────────────────────

// 달력 그리드 공통 스타일(.kw-cal). PlanCalendar·AllCalendar 가 공유.
function CalendarGridStyles() {
  return (
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
  );
}

// 작물(계획)별 탭 + 모두보기 + 작물 추가. 클릭 시 URL 쿼리로 전환.
function PlanTabs({
  plans,
  activeId,
  showAll,
}: {
  plans: LoadedPlan[];
  activeId: number | null;
  showAll: boolean;
}) {
  const router = useRouter();
  const value = showAll ? 'all' : activeId ? String(activeId) : '';

  return (
    <Tabs
      value={value}
      variant="pills"
      color="green"
      onChange={(v) => {
        if (v === 'all') router.push('/calendar?view=all');
        else if (v === '__add') router.push('/calendar');
        else if (v) router.push(`/calendar?planId=${v}`);
      }}
    >
      <Tabs.List style={{ flexWrap: 'wrap', rowGap: 6 }}>
        <Tabs.Tab value="all" leftSection={<IconLayoutGrid size={14} />}>
          모두 보기
        </Tabs.Tab>
        {plans.map(({ id, plan }) => (
          <Tabs.Tab key={id} value={String(id)}>
            {plan.cropName}
          </Tabs.Tab>
        ))}
        <Tabs.Tab value="__add" leftSection={<IconPlus size={14} />} c="dimmed">
          작물 추가
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}

// 모두보기 인덱스: 날짜별로 (작물·작업) 목록을 모음. 기간형 작업은 날짜 범위로 펼침.
interface AllEntry {
  planId: number;
  cropName: string;
  task: FarmTask;
}

// 한 작물의 방문 요일(0=일~6=토)과 적용 기간(시작~마지막 작업일).
interface VisitWindow {
  days: Set<number>;
  startKey: string;
  lastKey: string;
}

function buildAllIndex(plans: LoadedPlan[]): Map<string, AllEntry[]> {
  const byDate = new Map<string, AllEntry[]>();
  for (const { id, plan } of plans) {
    for (const t of plan.tasks) {
      let d = dayjs(t.date);
      const end = dayjs(t.endDate);
      while (d.isBefore(end) || d.isSame(end, 'day')) {
        const key = d.format(FMT);
        const arr = byDate.get(key) ?? [];
        arr.push({ planId: id, cropName: plan.cropName, task: t });
        byDate.set(key, arr);
        d = d.add(1, 'day');
      }
    }
  }
  return byDate;
}

function AllPlansView({
  plans,
  loading,
  tabs,
}: {
  plans: LoadedPlan[];
  loading: boolean;
  tabs?: ReactNode;
}) {
  // 숨긴 작물 id 집합(비어 있으면 전체 표시).
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const shown = useMemo(() => plans.filter((p) => !hidden.has(p.id)), [plans, hidden]);
  const toggle = (id: number) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const index = useMemo(() => buildAllIndex(shown), [shown]);
  // 보이는 작물별 방문 요일 + 계획 기간(시작~마지막 작업일). 달력에서 방문일 배경 표시용.
  const visitInfo = useMemo<VisitWindow[]>(
    () =>
      shown
        .map(({ plan }) => {
          const days = new Set(plan.visitDays ?? []);
          if (days.size === 0) return null;
          let last = plan.startDate;
          for (const t of plan.tasks) if (t.endDate > last) last = t.endDate;
          return { days, startKey: plan.startDate, lastKey: last };
        })
        .filter((v): v is VisitWindow => v !== null),
    [shown],
  );
  const earliest = useMemo(() => {
    if (plans.length === 0) return new Date();
    const min = plans.reduce(
      (acc, p) => (p.plan.startDate < acc ? p.plan.startDate : acc),
      plans[0].plan.startDate,
    );
    return dayjs(min).toDate();
  }, [plans]);

  const [month, setMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  useEffect(() => {
    if (!month) {
      setMonth(earliest);
      setSelected(earliest);
    }
  }, [earliest, month]);

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
        <Stack gap="lg">
          {tabs}
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
            <Stack gap="sm">
              <Title order={2} fz={{ base: 22, md: 28 }} fw={800}>
                전체 작물 캘린더
              </Title>
              <Group gap="sm" wrap="wrap">
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  disabled={hidden.size === 0}
                  onClick={() => setHidden(new Set())}
                >
                  전체 표시
                </Button>
                {plans.map(({ id, plan }) => {
                  const on = !hidden.has(id);
                  return (
                    <Badge
                      key={id}
                      onClick={() => toggle(id)}
                      variant={on ? 'filled' : 'outline'}
                      color="gray"
                      radius="sm"
                      leftSection={on ? <IconCheck size={11} /> : <IconX size={11} />}
                      style={{ cursor: 'pointer', opacity: on ? 1 : 0.6 }}
                    >
                      {plan.cropName}
                    </Badge>
                  );
                })}
              </Group>
            </Stack>
          </Card>

          {loading && plans.length === 0 ? (
            <Skeleton h={400} radius="lg" />
          ) : plans.length === 0 ? (
            <Alert color="gray" radius="md" icon={<IconAlertCircle size={16} />}>
              아직 등록된 작물 계획이 없습니다. “작물 추가”로 첫 계획을 만들어 보세요.
            </Alert>
          ) : (
            <Grid gutter="lg" align="stretch">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <AllCalendar
                  index={index}
                  visitInfo={visitInfo}
                  month={month}
                  onMonthChange={setMonth}
                  selected={selected}
                  onSelect={setSelected}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <AllDayPanel plans={shown} index={index} selected={selected} />
              </Grid.Col>
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function AllCalendar({
  index,
  visitInfo,
  month,
  onMonthChange,
  selected,
  onSelect,
}: {
  index: Map<string, AllEntry[]>;
  visitInfo: VisitWindow[];
  month: Date | null;
  onMonthChange: (d: Date | null) => void;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <CalendarGridStyles />
      <Box mih={{ base: 380, md: 610 }} w="100%">
        <Calendar
          className="kw-cal"
          date={month ?? undefined}
          onDateChange={onMonthChange}
          minDate={new Date(MIN_YEAR, 0, 1)}
          size="xl"
          firstDayOfWeek={1}
          weekdayFormat={(date) => KOR_WEEKDAYS[date.getDay()]}
          monthLabelFormat="YYYY년 M월"
          yearLabelFormat="YYYY년"
          monthsListFormat="M월"
          style={{ '--day-size': '3rem', width: '100%' } as CSSProperties}
          getDayProps={(date) => ({ onClick: () => onSelect(date) })}
          renderDay={(date) => {
            const key = dayjs(date).format(FMT);
            const entries = index.get(key) ?? [];
            // 점 하나 = 카테고리 하나(색=카테고리). 작물 구분은 오른쪽 날짜 패널에서.
            const cats: TaskCategory[] = [];
            for (const e of entries) {
              if (!cats.includes(e.task.category)) cats.push(e.task.category);
            }
            const shown = cats.slice(0, 5);
            const wd = dayjs(date).day();
            const isSelected = selected ? dayjs(date).isSame(selected, 'date') : false;
            // 보이는 작물 중 하나라도 그 기간 안의 방문 요일이면 방문일로 표시.
            const isVisitDay = visitInfo.some(
              (v) => v.days.has(wd) && key >= v.startKey && key <= v.lastKey,
            );
            const bg = isSelected
              ? 'var(--mantine-color-green-1)'
              : isVisitDay
                ? 'var(--mantine-color-green-0)'
                : undefined;
            const numColor =
              wd === 0
                ? 'var(--mantine-color-red-6)'
                : wd === 6
                  ? 'var(--mantine-color-blue-6)'
                  : undefined;
            return (
              <Stack
                gap={3}
                align="stretch"
                justify="flex-start"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  paddingTop: 4,
                  background: bg,
                  border: isSelected ? '2px solid var(--mantine-color-green-5)' : undefined,
                  borderRadius: isSelected || isVisitDay ? 6 : undefined,
                }}
              >
                <Text
                  ta="center"
                  size="md"
                  fw={isSelected ? 700 : 500}
                  lh={1}
                  style={{ color: numColor }}
                >
                  {date.getDate()}
                </Text>
                <Group gap={3} justify="center" wrap="wrap" style={{ minHeight: 8 }}>
                  {shown.map((c) => (
                    <Box
                      key={c}
                      w={7}
                      h={7}
                      style={{
                        borderRadius: '50%',
                        background: `var(--mantine-color-${CATEGORY_META[c].color}-6)`,
                      }}
                    />
                  ))}
                  {cats.length > 5 && (
                    <Text size="9px" c="dimmed" lh={1}>
                      +{cats.length - 5}
                    </Text>
                  )}
                </Group>
              </Stack>
            );
          }}
        />
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
        {visitInfo.length > 0 && (
          <Group gap={4}>
            <Box
              w={14}
              h={14}
              bg="green.0"
              style={{ borderRadius: 4, border: '1px solid var(--mantine-color-green-3)' }}
            />
            <Text size="xs" c="dimmed">
              방문 요일
            </Text>
          </Group>
        )}
      </Group>
    </Card>
  );
}

function AllDayPanel({
  plans,
  index,
  selected,
}: {
  plans: LoadedPlan[];
  index: Map<string, AllEntry[]>;
  selected: Date | null;
}) {
  const key = selected ? dayjs(selected).format(FMT) : null;
  const entries = key ? index.get(key) ?? [] : [];

  const groups = plans
    .map(({ id, plan }) => {
      const seen = new Set<number>();
      const tasks: FarmTask[] = [];
      for (const e of entries) {
        if (e.planId === id && !seen.has(e.task.id)) {
          seen.add(e.task.id);
          tasks.push(e.task);
        }
      }
      const memoObj = key ? plan.memos.find((m) => m.memoDate === key) : undefined;
      const memo = memoObj?.content ?? '';
      const images = memoObj?.images ?? [];
      return { id, plan, tasks, memo, images };
    })
    .filter((g) => g.tasks.length > 0 || g.memo || g.images.length > 0);

  if (!key) {
    return (
      <Card radius="lg" p="lg" withBorder bg="white">
        <Text c="dimmed" size="sm">
          날짜를 선택하면 그 날 모든 작물의 작업을 모아 봅니다.
        </Text>
      </Card>
    );
  }

  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Stack gap="md">
        <Group gap={6}>
          <ThemeIcon size={26} radius="md" color="green" variant="light">
            <IconLayoutGrid size={14} />
          </ThemeIcon>
          <Title order={4}>
            {dayjs(selected).format('M월 D일')} ({KOR_WEEKDAYS[dayjs(selected).day()]})
          </Title>
        </Group>

        {groups.length === 0 ? (
          <Text size="sm" c="dimmed">
            이 날짜에 예정된 작업이 없습니다.
          </Text>
        ) : (
          <Stack gap="lg">
            {groups.map(({ id, plan, tasks, memo, images }) => (
              <Box key={id}>
                <Group justify="space-between" wrap="nowrap" mb={6}>
                  <Badge
                    variant="outline"
                    color="gray"
                    radius="sm"
                    size="lg"
                    styles={{ root: { borderColor: 'var(--mantine-color-gray-4)' } }}
                  >
                    {plan.cropName}
                  </Badge>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    component={Link}
                    href={`/calendar?planId=${id}`}
                    rightSection={<IconExternalLink size={12} />}
                  >
                    캘린더 열기
                  </Button>
                </Group>
                <Stack gap={6}>
                  {tasks.map((t) => {
                    const meta = CATEGORY_META[t.category];
                    return (
                      <Card key={t.id} radius="md" p="xs" withBorder bg="gray.0">
                        <Group gap={6} wrap="wrap" align="baseline">
                          <Text fw={600} fz={13}>
                            {t.title}
                          </Text>
                          <Text size="xs" c={`${meta.color}.7`} fw={600}>
                            {meta.label}
                          </Text>
                          {t.status === 'done' && (
                            <Badge size="xs" color="green" radius="sm">
                              완료
                            </Badge>
                          )}
                          {t.status === 'delayed' && (
                            <Badge size="xs" color="orange" variant="light" radius="sm">
                              지연
                            </Badge>
                          )}
                        </Group>
                      </Card>
                    );
                  })}
                  {memo && (
                    <Group gap={6} wrap="nowrap" align="flex-start" px={4}>
                      <IconPencil
                        size={14}
                        stroke={2.2}
                        color="var(--mantine-color-grape-6)"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <Text size="xs" c="gray.7" style={{ whiteSpace: 'pre-wrap' }}>
                        {memo}
                      </Text>
                    </Group>
                  )}
                  {images.length > 0 && (
                    <SimpleGrid cols={4} spacing={6} px={4}>
                      {images.map((img) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={img.id} href={mediaUrl(img.url)} target="_blank" rel="noreferrer">
                          <img
                            src={mediaUrl(img.url)}
                            alt={img.originalName ?? '메모 사진'}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: '1px solid var(--mantine-color-gray-3)',
                            }}
                          />
                        </a>
                      ))}
                    </SimpleGrid>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          작물별 캘린더에서 작업 완료·지연, 메모 등록이 가능합니다.
        </Text>
      </Stack>
    </Card>
  );
}

// ─────────────────────────── 계획 캘린더 뷰 ───────────────────────────

function PlanView({ planId, tabs }: { planId: number; tabs?: ReactNode }) {
  const qc = useQueryClient();
  const planQ = useQuery({
    queryKey: ['farmplan', planId],
    queryFn: () => getPlan(planId),
  });

  const [month, setMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  const plan = planQ.data;

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
          {tabs}
          <PlanHeader plan={plan} />
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

function PlanHeader({ plan }: { plan: FarmPlan }) {
  const [harvestResult, setHarvestResult] = useState<HarvestJournalResponse | null>(null);
  const photoCount = plan.memos.reduce((n, m) => n + m.images.length, 0);
  const memoDays = plan.memos.filter((m) => m.content.trim() || m.images.length > 0).length;

  const harvestMut = useMutation({
    mutationFn: () => verifyHarvestJournal(plan.id),
    onSuccess: setHarvestResult,
    onError: (e) =>
      notifications.show({
        color: 'red',
        message:
          isAxiosError(e) && typeof e.response?.data?.detail === 'string'
            ? e.response.data.detail
            : '수확 인증 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      }),
  });

  const visitValue =
    (plan.visitDays?.length ?? 0) > 0
      ? `${[...(plan.visitDays ?? [])]
          .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
          .map((d) => WEEKDAY_LABEL[d])
          .join('·')}요일`
      : '매일';

  type Seg = { key: string; label: string; value: string; color?: string; bold?: boolean };
  const summarySegments: Seg[] = [
    { key: 'region', label: '장소', color: 'green.8', bold: true, value: plan.region || '미지정' },
    {
      key: 'area',
      label: '면적',
      value: `${plan.area.toLocaleString()} ${AREA_UNIT_LABEL[plan.areaUnit]}`,
    },
    { key: 'start', label: '시작', value: dayjs(plan.startDate).format('YYYY.MM.DD') },
    { key: 'visit', label: '방문', color: 'teal.7', value: visitValue },
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
        <Stack gap={4} align="flex-end">
          <Tooltip
            label="기르는 동안 캘린더에 사진을 1장 이상 남겨야 인증할 수 있어요"
            disabled={photoCount > 0}
          >
            <Button
              color="orange"
              radius="md"
              leftSection={<IconBasket size={16} />}
              loading={harvestMut.isPending}
              disabled={photoCount === 0}
              onClick={() => harvestMut.mutate()}
            >
              수확했어요
            </Button>
          </Tooltip>
          <Text size="xs" c="dimmed">
            {harvestMut.isPending
              ? 'AI가 일지를 분석하고 있어요…'
              : `기록 ${memoDays}일 · 사진 ${photoCount}장 분석`}
          </Text>
        </Stack>
      </Group>
      <HarvestResultModal
        result={harvestResult}
        cropName={plan.cropName}
        onClose={() => setHarvestResult(null)}
      />
      <Group gap="md" mt="md" wrap="nowrap" align="stretch">
        {summarySegments.map((seg, i) => (
          <Fragment key={seg.key}>
            {i > 0 && <Divider orientation="vertical" size="sm" color="green.4" />}
            <Group justify="space-between" wrap="nowrap" gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Text fz={{ base: 13, md: 16 }} fw={600} c="dimmed">
                {seg.label}
              </Text>
              <Text fz={{ base: 13, md: 16 }} fw={seg.bold ? 700 : 600} c={seg.color} ta="right">
                {seg.value}
              </Text>
            </Group>
          </Fragment>
        ))}
      </Group>
    </Card>
  );
}

// '수확했어요' 일지 인증 결과 — 성공 시 도감 등록 안내 + 새 뱃지, 실패 시 사유.
function HarvestResultModal({
  result,
  cropName,
  onClose,
}: {
  result: HarvestJournalResponse | null;
  cropName: string;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={!!result}
      onClose={onClose}
      centered
      radius="lg"
      title={
        <Text fw={800} fz="lg">
          {result?.verified ? '수확 인증 완료 🎉' : '수확 인증 실패'}
        </Text>
      }
    >
      {result && (
        <Stack gap="md">
          <Alert
            color={result.verified ? 'orange' : 'gray'}
            radius="md"
            icon={result.verified ? <IconBasket size={16} /> : <IconAlertCircle size={16} />}
          >
            {result.message}
          </Alert>

          {result.verified && result.verdict?.summary && (
            <Box>
              <Text size="sm" fw={700} mb={4}>
                나의 재배 여정
              </Text>
              <Text size="sm" c="dimmed">
                {result.verdict.summary}
              </Text>
              {result.verdict.quantity && (
                <Text size="sm" mt={4}>
                  수확량: {result.verdict.quantity}
                </Text>
              )}
            </Box>
          )}

          {result.newBadges.length > 0 && (
            <Box>
              <Text size="sm" fw={700} mb={6}>
                새로 획득한 뱃지
              </Text>
              <Group gap="xs">
                {result.newBadges.map((b) => (
                  <Badge key={b.id} size="lg" variant="light" color="yellow" radius="md">
                    {b.emoji} {b.name}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {result.verified ? (
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                누적 {result.pointsTotal.toLocaleString()}점
              </Text>
              <Button
                component={Link}
                href="/collection"
                color="orange"
                radius="md"
                leftSection={<IconSparkles size={16} />}
              >
                {cropName} 도감 보러가기
              </Button>
            </Group>
          ) : (
            <Group justify="flex-end">
              <Button variant="light" color="gray" radius="md" onClick={onClose}>
                기록 더 쌓고 다시 인증하기
              </Button>
            </Group>
          )}
        </Stack>
      )}
    </Modal>
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
    () => new Set(plan.memos.filter((m) => m.content.trim()).map((m) => m.memoDate)),
    [plan.memos],
  );
  const photoDates = useMemo(
    () => new Set(plan.memos.filter((m) => m.images.length > 0).map((m) => m.memoDate)),
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
      <CalendarGridStyles />
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
          const hasPhoto = photoDates.has(key);
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
                position: 'relative',
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
              </Group>

              {(hasMemo || hasPhoto) && (
                <Group gap={3} justify="center" style={{ minHeight: 15 }}>
                  {hasMemo && (
                    <IconPencil size={15} stroke={2.4} color="var(--mantine-color-grape-6)" />
                  )}
                  {hasPhoto && (
                    <IconPhoto size={14} stroke={2.2} color="var(--mantine-color-grape-6)" />
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
          <IconPencil size={15} stroke={2.4} color="var(--mantine-color-grape-6)" />
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
  const memo = key ? plan.memos.find((m) => m.memoDate === key) : undefined;
  const existingMemo = memo?.content ?? '';
  const existingImages = memo?.images ?? [];

  const [memoDraft, setMemoDraft] = useState(existingMemo);
  useEffect(() => setMemoDraft(existingMemo), [existingMemo, key]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const taskMut = useMutation({
    mutationFn: ({ taskId, status, delayDays }: { taskId: number; status: FarmTask['status']; delayDays?: number }) =>
      updateTask(planId, taskId, status, delayDays),
    onSuccess: onChange,
    onError: () =>
      notifications.show({ color: 'red', message: '작업 상태 변경에 실패했습니다.' }),
  });

  const batchDelayMut = useMutation({
    mutationFn: ({ taskIds, delayDays }: { taskIds: number[]; delayDays: number }) =>
      delayTasksBatch(planId, taskIds, delayDays),
    onSuccess: (p) => {
      onChange(p);
      notifications.show({ color: 'orange', message: '이 날짜 작업을 통째로 지연했습니다.' });
    },
    onError: () =>
      notifications.show({ color: 'red', message: '일괄 지연에 실패했습니다.' }),
  });

  const bulkDoneMut = useMutation({
    mutationFn: async (taskIds: number[]) => {
      let latest: FarmPlan | null = null;
      for (const id of taskIds) {
        latest = await updateTask(planId, id, 'done');
      }
      return latest;
    },
    onSuccess: (p) => {
      if (p) onChange(p);
      notifications.show({ color: 'green', message: '이 날짜 작업을 모두 완료했습니다.' });
    },
    onError: () =>
      notifications.show({ color: 'red', message: '일괄 완료에 실패했습니다.' }),
  });

  const delayable = dayTasks.filter((t) => t.status !== 'done');
  const [bulkDelayOpen, setBulkDelayOpen] = useState(false);
  const [bulkDelayDays, setBulkDelayDays] = useState<number | ''>(1);

  const memoMut = useMutation({
    mutationFn: (content: string) => upsertMemo(planId, key!, content),
    onSuccess: (p) => {
      onChange(p);
      notifications.show({
        color: 'grape',
        message:
          p.pointsEarned > 0
            ? `메모를 저장했습니다. +${p.pointsEarned}점 (누적 ${p.pointsTotal.toLocaleString()}점)`
            : '메모를 저장했습니다.',
      });
    },
  });

  const uploadMut = useMutation({
    mutationFn: (files: File[]) => uploadMemoImages(planId, key!, files),
    onSuccess: (p) => {
      onChange(p);
      notifications.show({
        color: 'grape',
        message:
          p.pointsEarned > 0
            ? `사진을 첨부했습니다. +${p.pointsEarned}점 (누적 ${p.pointsTotal.toLocaleString()}점)`
            : '사진을 첨부했습니다.',
      });
    },
    onError: () =>
      notifications.show({
        color: 'red',
        message: '사진 업로드 실패 — 이미지 형식(jpg·png·webp 등)과 용량(최대 10MB)을 확인하세요.',
      }),
  });

  const deleteImageMut = useMutation({
    mutationFn: (imageId: number) => deleteMemoImage(planId, imageId),
    onSuccess: onChange,
    onError: () =>
      notifications.show({ color: 'red', message: '사진 삭제에 실패했습니다.' }),
  });

  // 선택일이 속한 주(월~일)를 키로 주간 다이제스트(할 일 3 + 코칭) 조회.
  const weekStart = selected
    ? dayjs(selected).subtract((dayjs(selected).day() + 6) % 7, 'day')
    : null;
  const weekStartKey = weekStart ? weekStart.format(FMT) : null;
  // 계획 종료일(가장 늦은 작업 종료일 = 수확 마무리).
  const planEndKey = useMemo(() => {
    let last = plan.startDate;
    for (const t of plan.tasks) if (t.endDate > last) last = t.endDate;
    return last;
  }, [plan.tasks, plan.startDate]);
  // 선택한 주(월~일)가 통째로 계획 시작일 이전이거나 수확일 이후면 알림을 띄우지 않는다.
  const beforeStart = weekStart
    ? weekStart.add(6, 'day').isBefore(dayjs(plan.startDate), 'day')
    : false;
  const afterEnd = weekStart ? weekStart.isAfter(dayjs(planEndKey), 'day') : false;
  const outOfSeason = beforeStart || afterEnd;
  const weeklyQ = useQuery({
    queryKey: ['weekly', planId, weekStartKey],
    queryFn: () => getWeeklyDigest(planId, weekStartKey!),
    enabled: !!weekStartKey && !outOfSeason,
    staleTime: 30 * 60_000,
  });
  const alertsQ = useQuery({
    queryKey: ['plan-alerts', planId],
    queryFn: () => getPlanAlerts(planId),
    enabled: !outOfSeason,
    staleTime: 30 * 60_000,
  });
  // 그 주(월~일) 작업을 plan 에서 직접 추려 표시(완료 처리 즉시 회색 반영). 코칭만 서버 사용.
  const weekTasks = useMemo(() => {
    if (!weekStartKey) return [];
    const we = dayjs(weekStartKey).add(6, 'day').format(FMT);
    return plan.tasks
      .filter((t) => t.date >= weekStartKey && t.date <= we)
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.order - b.order));
  }, [plan.tasks, weekStartKey]);
  // 작업별 코칭 멘트(서버 생성, 주 단위 캐시) → id로 매핑. 완료 상태는 plan(weekTasks)에서 실시간.
  const messageById = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of weeklyQ.data?.tasks ?? []) m.set(t.id, t.message);
    return m;
  }, [weeklyQ.data]);

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
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap={6}>
            <ThemeIcon size={26} radius="md" color="green" variant="light">
              <IconCalendarPlus size={14} />
            </ThemeIcon>
            <Title order={4}>
            {dayjs(selected).format('M월 D일')} ({KOR_WEEKDAYS[dayjs(selected).day()]})
          </Title>
          </Group>
          {delayable.length > 0 && (
            <Group gap={6} wrap="nowrap" align="center">
              <Text size="xs" c="dimmed">
                전체
              </Text>
              <Button
                size="compact-xs"
                variant="light"
                color="green"
                leftSection={<IconCheck size={12} />}
                loading={bulkDoneMut.isPending}
                onClick={() => {
                  setBulkDelayOpen(false);
                  bulkDoneMut.mutate(delayable.map((t) => t.id));
                }}
              >
                완료
              </Button>
              {!bulkDelayOpen ? (
                <Button
                  size="compact-xs"
                  variant="light"
                  color="orange"
                  leftSection={<IconClock size={12} />}
                  onClick={() => setBulkDelayOpen(true)}
                >
                  지연
                </Button>
              ) : (
                <Group gap={4} wrap="nowrap" align="center">
                  <NumberInput
                    size="xs"
                    w={64}
                    min={1}
                    hideControls
                    value={bulkDelayDays}
                    onChange={(v) =>
                      setBulkDelayDays(typeof v === 'number' ? v : '')
                    }
                  />
                  <Text size="xs" c="dimmed">
                    일
                  </Text>
                  <Button
                    size="compact-xs"
                    color="orange"
                    loading={batchDelayMut.isPending}
                    disabled={typeof bulkDelayDays !== 'number'}
                    onClick={() => {
                      if (typeof bulkDelayDays !== 'number') return;
                      batchDelayMut.mutate({
                        taskIds: delayable.map((t) => t.id),
                        delayDays: bulkDelayDays,
                      });
                      setBulkDelayOpen(false);
                    }}
                  >
                    적용
                  </Button>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => setBulkDelayOpen(false)}
                    aria-label="지연 취소"
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
          )}
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
            <IconNote size={16} color="var(--mantine-color-grape-6)" />
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

          {existingImages.length > 0 && (
            <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="xs" mt="xs">
              {existingImages.map((img) => (
                <Box key={img.id} pos="relative" style={{ aspectRatio: '1 / 1' }}>
                  <a href={mediaUrl(img.url)} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(img.url)}
                      alt={img.originalName ?? '메모 사진'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--mantine-color-gray-3)',
                      }}
                    />
                  </a>
                  <ActionIcon
                    size="sm"
                    radius="xl"
                    color="red"
                    variant="filled"
                    pos="absolute"
                    top={4}
                    right={4}
                    loading={deleteImageMut.isPending}
                    onClick={() => deleteImageMut.mutate(img.id)}
                    aria-label="사진 삭제"
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                </Box>
              ))}
            </SimpleGrid>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              if (files.length) uploadMut.mutate(files);
              e.currentTarget.value = '';
            }}
          />
          <Group justify="space-between" mt="xs">
            <Button
              size="xs"
              variant="light"
              color="grape"
              leftSection={<IconPhoto size={14} />}
              loading={uploadMut.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              사진 추가
            </Button>
            <Button
              size="xs"
              color="grape"
              loading={memoMut.isPending}
              onClick={() => memoMut.mutate(memoDraft)}
            >
              메모 저장
            </Button>
          </Group>
        </Box>

        {!outOfSeason && (
          <Stack gap={6}>
            <Text size="sm" fw={700}>
              이번 주 할 일{' '}
              {weekStartKey && (
                <Text span size="xs" c="dimmed" fw={500}>
                  ({dayjs(weekStartKey).format('M.D')}~
                  {dayjs(weekStartKey).add(6, 'day').format('M.D')})
                </Text>
              )}
            </Text>

            {weekTasks.length === 0 ? (
              <Alert color="yellow" variant="light" radius="md" icon={<IconBulb size={16} />}>
                이번 주 예정된 작업이 없어요.
              </Alert>
            ) : (
              weekTasks.map((t) => {
                const done = t.status === 'done';
                const message = messageById.get(t.id) ?? `${t.title} 준비를 챙겨보세요.`;
                return (
                  <Alert
                    key={t.id}
                    color={done ? 'gray' : 'yellow'}
                    variant="light"
                    radius="md"
                    py={8}
                    icon={done ? <IconCheck size={16} /> : <IconBulb size={16} />}
                    style={done ? { opacity: 0.65 } : undefined}
                  >
                    <Group gap={6} mb={3}>
                      <Text
                        span
                        size="xs"
                        fw={600}
                        c={done ? 'gray.5' : `${CATEGORY_META[t.category].color}.7`}
                      >
                        {CATEGORY_META[t.category].label}
                      </Text>
                      <Text span size="xs" c="dimmed">
                        {dayjs(t.date).format('M.D')}({KOR_WEEKDAYS[dayjs(t.date).day()]})
                      </Text>
                    </Group>
                    <Text size="sm" c={done ? 'dimmed' : undefined}>
                      {message}
                    </Text>
                  </Alert>
                );
              })
            )}
          </Stack>
        )}

        {!outOfSeason &&
          (alertsQ.data?.alerts ?? []).map((a, i) => (
          <Alert
            key={i}
            color={a.severity === 'danger' ? 'red' : a.severity === 'warn' ? 'yellow' : 'blue'}
            variant="light"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            title={a.title}
            styles={{ title: { fontWeight: 700 } }}
          >
            <Text size="sm">{a.detail}</Text>
            <Group gap={12} mt={6} wrap="wrap">
              {a.date && (
                <Text size="xs" c="dimmed">
                  {a.date}
                </Text>
              )}
              {a.link && (
                <Anchor href={a.link} target="_blank" rel="noreferrer" size="xs" fw={600}>
                  원문 보기
                </Anchor>
              )}
              <Text size="xs" c="dimmed">
                출처: {a.source}
              </Text>
            </Group>
          </Alert>
        ))}
      </Stack>
    </Card>
  );
}

function TaskRow({
  task,
  pending,
  onStatus,
}: {
  task: FarmTask;
  pending: boolean;
  onStatus: (status: FarmTask['status'], delayDays?: number) => void;
}) {
  const meta = CATEGORY_META[task.category];
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayDays, setDelayDays] = useState<number | ''>(3);

  const isDelayed = task.status === 'delayed';
  return (
    <Card
      radius="md"
      p="sm"
      withBorder
      style={{
        borderColor: isDelayed
          ? 'var(--mantine-color-orange-3)'
          : 'var(--mantine-color-gray-2)',
        background: isDelayed ? 'var(--mantine-color-orange-0)' : undefined,
        opacity: task.status === 'done' ? 0.6 : 1,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Group gap={6} mb={2} wrap="wrap" align="baseline">
            <Text fw={700} fz={14}>
              {task.title}
            </Text>
            <Text size="xs" c={`${meta.color}.7`} fw={600}>
              {meta.label}
            </Text>
            {task.status === 'done' && (
              <Badge size="xs" color="green" radius="sm" leftSection={<IconCheck size={10} />}>
                완료
              </Badge>
            )}
            {isDelayed && (
              <Badge size="xs" color="orange" variant="light" radius="sm" leftSection={<IconClock size={10} />}>
                지연
              </Badge>
            )}
          </Group>
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
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            size="compact-xs"
            variant={task.status === 'done' ? 'filled' : 'light'}
            color="green"
            leftSection={<IconCheck size={12} />}
            disabled={pending}
            onClick={() => {
              setDelayOpen(false);
              onStatus(task.status === 'done' ? 'planned' : 'done');
            }}
          >
            {task.status === 'done' ? '취소' : '완료'}
          </Button>
          <Button
            size="compact-xs"
            variant="light"
            color="orange"
            leftSection={<IconClock size={12} />}
            disabled={pending || task.status === 'done'}
            onClick={() => setDelayOpen((v) => !v)}
          >
            지연
          </Button>
        </Group>
      </Group>

      {task.status !== 'done' && delayOpen && (
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
