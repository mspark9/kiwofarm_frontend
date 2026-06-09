'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuildingStore,
  IconCalendarTime,
  IconCheck,
  IconClock,
  IconCompass,
  IconLeaf,
  IconMapPin,
  IconRuler2,
  IconSparkles,
  IconSun,
  IconX,
} from '@tabler/icons-react';
import type { Direction, PlantingInput } from '@/lib/api/planting';
import type { AreaUnit } from '@/lib/types';
import {
  DIRECTION_OPTIONS,
  EXP_OPTIONS,
  FACILITY_OPTIONS,
  PLACE_OPTIONS,
  PREF_OPTIONS,
  SUN_OPTIONS,
} from '@/lib/planting/options';
import {
  defaultPlantingInput,
  loadPlantingInput,
  savePlantingInput,
} from '@/lib/planting/storage';
import { RegionPicker } from '@/components/shared/RegionPicker';

// 0=일 ~ 6=토. 표시는 월~일 순. 방문 예정 요일 선택용.
const WEEKDAYS: { v: number; l: string }[] = [
  { v: 1, l: '월' },
  { v: 2, l: '화' },
  { v: 3, l: '수' },
  { v: 4, l: '목' },
  { v: 5, l: '금' },
  { v: 6, l: '토' },
  { v: 0, l: '일' },
];
const KOR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 매일(월~일). 방문 요일 기본값.
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

// 저장된 sigungu("경기도 성남시") → province / city 분해.
function splitSigungu(sigungu: string): { province: string; city: string } {
  const i = sigungu.indexOf(' ');
  if (i < 0) return { province: '경기도', city: '' };
  return { province: sigungu.slice(0, i), city: sigungu.slice(i + 1) };
}

type FormValues = Omit<PlantingInput, 'sigungu'>;

export default function PlantingWizardPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const saved = loadPlantingInput();
  const initRegion = splitSigungu(saved?.sigungu ?? '');

  const [province, setProvince] = useState(initRegion.province);
  const [city, setCity] = useState(initRegion.city);
  const [regionError, setRegionError] = useState<string | undefined>();

  const form = useForm<FormValues>({
    initialValues: {
      place: saved?.place ?? defaultPlantingInput.place,
      sun_hours: saved?.sun_hours ?? defaultPlantingInput.sun_hours,
      experience: saved?.experience ?? defaultPlantingInput.experience,
      direction: saved?.direction ?? null,
      area: saved?.area ?? null,
      areaUnit: saved?.areaUnit ?? 'pyeong',
      visitDays: saved?.visitDays ?? ALL_DAYS,
      startDate: saved?.startDate ?? dayjs().format('YYYY-MM-DD'),
      facility: saved?.facility ?? [],
      prefs: saved?.prefs ?? [],
      top_n: saved?.top_n ?? 6,
    },
  });

  const submit = () => {
    if (!city) {
      setRegionError('지역을 선택해 주세요');
      return;
    }
    const input: PlantingInput = { ...form.values, sigungu: `${province} ${city}` };
    savePlantingInput(input);
    router.push('/planting/result');
  };

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <UnstyledButton component={Link} href="/">
              <Group gap={6}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  홈으로
                </Text>
              </Group>
            </UnstyledButton>
            <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
              심기 · 내 텃밭 맞춤 추천
            </Badge>
          </Group>

          <Stepper active={0} color="green" size="sm" iconSize={28}>
            <Stepper.Step label="조건 입력" description="장소·일조·경험" />
            <Stepper.Step label="작물 추천" description="이번 달 적기 TOP" />
            <Stepper.Step label="챗봇 상담" description="궁금증 해결" />
          </Stepper>

          <Box>
            <Title order={3} fz={{ base: 22, md: 26 }} fw={800}>
              어디서 무엇을 키우시나요?
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              필수 항목만으로 추천이 가능합니다. 자세히 입력할수록 정확해집니다.
            </Text>
          </Box>

          {/* 입력 항목 (선택 항목 포함) */}
          <Card radius="lg" p="lg" withBorder bg="white">
            <Stack gap="lg">
              <FieldRow icon={<IconMapPin size={16} />} label="지역 (시·군·구)">
                <RegionPicker
                  value={city}
                  province={province}
                  onChange={(c, p) => {
                    setProvince(p);
                    setCity(c);
                    setRegionError(undefined);
                  }}
                  error={regionError}
                />
              </FieldRow>

              <FieldRow icon={<IconBuildingStore size={16} />} label="장소">
                <SegmentedControl
                  fullWidth
                  data={PLACE_OPTIONS}
                  {...form.getInputProps('place')}
                />
              </FieldRow>

              <FieldRow icon={<IconCompass size={16} />} label="방향 (일조 핵심)">
                <SegmentedControl
                  fullWidth
                  value={form.values.direction ?? ''}
                  onChange={(v) => form.setFieldValue('direction', (v || null) as Direction | null)}
                  data={[
                    { label: '선택 안 함', value: '' },
                    ...DIRECTION_OPTIONS.map((d) => ({ label: d, value: d })),
                  ]}
                />
              </FieldRow>

              <FieldRow icon={<IconSun size={16} />} label="하루 직사광 시간">
                <SegmentedControl fullWidth data={SUN_OPTIONS} {...form.getInputProps('sun_hours')} />
              </FieldRow>

              <FieldRow icon={<IconRuler2 size={16} />} label="규모 (면적, 선택)">
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  <NumberInput
                    flex={1}
                    min={0}
                    hideControls
                    placeholder="대략적인 면적 (화분만 쓰면 비워두세요)"
                    value={form.values.area ?? undefined}
                    onChange={(v) =>
                      form.setFieldValue('area', v === '' || v === undefined ? null : Number(v))
                    }
                  />
                  <SegmentedControl
                    data={[
                      { value: 'pyeong', label: '평' },
                      { value: 'sqm', label: 'm²' },
                      { value: 'hectare', label: 'ha' },
                    ]}
                    value={form.values.areaUnit ?? 'pyeong'}
                    onChange={(v) => form.setFieldValue('areaUnit', v as AreaUnit)}
                  />
                </Group>
              </FieldRow>

              <FieldRow icon={<IconLeaf size={16} />} label="경험">
                <SegmentedControl fullWidth data={EXP_OPTIONS} {...form.getInputProps('experience')} />
              </FieldRow>

              <FieldRow icon={<IconCalendarTime size={16} />} label="방문 예정 요일">
                <Text size="xs" c="dimmed" mb={8}>
                  기본값은 매일이에요. 방문하지 않는 요일은 눌러서 빼주세요.
                </Text>
                <Group grow gap="xs">
                  {WEEKDAYS.map((w) => {
                    const days = form.values.visitDays ?? [];
                    const checked = days.includes(w.v);
                    return (
                      <Button
                        key={w.v}
                        size={isMobile ? 'xs' : 'sm'}
                        radius="xl"
                        px={isMobile ? 4 : 6}
                        fz={isMobile ? 11 : undefined}
                        variant={checked ? 'filled' : 'default'}
                        color="green"
                        leftSection={
                          isMobile
                            ? undefined
                            : checked ? <IconCheck size={12} /> : <IconX size={12} />
                        }
                        styles={{
                          section: checked ? undefined : { color: 'var(--mantine-color-gray-5)' },
                        }}
                        onClick={() =>
                          form.setFieldValue(
                            'visitDays',
                            checked ? days.filter((d) => d !== w.v) : [...days, w.v],
                          )
                        }
                      >
                        {w.l}
                      </Button>
                    );
                  })}
                </Group>
              </FieldRow>

              <FieldRow icon={<IconClock size={16} />} label="시작 시점">
                <DatePickerInput
                  placeholder="재배 시작일 선택 (비우면 오늘 기준)"
                  valueFormat="YYYY년 M월 D일"
                  firstDayOfWeek={1}
                  monthLabelFormat="YYYY년 M월"
                  yearLabelFormat="YYYY년"
                  monthsListFormat="M월"
                  clearable
                  weekdayFormat={(date) => KOR_WEEKDAYS[date.getDay()]}
                  value={form.values.startDate ? dayjs(form.values.startDate).toDate() : null}
                  onChange={(v) =>
                    form.setFieldValue('startDate', v ? dayjs(v).format('YYYY-MM-DD') : null)
                  }
                />
              </FieldRow>

              <FieldRow icon={<IconBuildingStore size={16} />} label="보유 시설" optional>
                <MultiSelect
                  data={FACILITY_OPTIONS}
                  placeholder="화분·플랜터·비닐터널 등"
                  {...form.getInputProps('facility')}
                  clearable
                />
              </FieldRow>

              <FieldRow icon={<IconLeaf size={16} />} label="선호 작물군" optional>
                <MultiSelect
                  data={PREF_OPTIONS}
                  placeholder="잎채소·열매채소·뿌리채소·허브"
                  {...form.getInputProps('prefs')}
                  clearable
                />
              </FieldRow>
            </Stack>
          </Card>

          <Card radius="md" p="sm" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-2)' }}>
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={22} radius="xl" color="green" variant="light">
                <IconSparkles size={12} />
              </ThemeIcon>
              <Text size="xs" c="green.9" lh={1.6}>
                농사로 농작업일정 매트릭스로 이번 달 심기 적기를 가려내고, AI가 내 환경 맞춤 설명을 더합니다.
              </Text>
            </Group>
          </Card>

          <Group justify="flex-end">
            <Button
              color="green"
              size="md"
              rightSection={<IconArrowRight size={16} />}
              onClick={submit}
            >
              AI 추천받기
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

function FieldRow({
  icon,
  label,
  optional,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Group gap={6} mb={6}>
        <ThemeIcon size={20} radius="xl" variant="light" color="gray">
          {icon}
        </ThemeIcon>
        <Text size="sm" fw={600}>
          {label}
        </Text>
        {optional && (
          <Badge size="xs" variant="light" color="gray" radius="sm">
            선택사항
          </Badge>
        )}
      </Group>
      {children}
    </Box>
  );
}
