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
  Grid,
  GridCol,
  Group,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuildingWarehouse,
  IconCalendarTime,
  IconCash,
  IconHome2,
  IconLeaf,
  IconMapPin,
  IconRuler2,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import type {
  AreaUnit,
  FacilityType,
  Mode,
  OnboardingInput,
  VisitFrequency,
} from '@/lib/types';
import { ONBOARDING_STORAGE_KEY, PREFERRED_CROP_OPTIONS } from '@/lib/constants';
import {
  PROVINCE_OPTIONS,
  getCitiesByProvince,
  getProvinceByCity,
} from '@/lib/regions';

const COMMON_FEATURES = [
  'AI 작목 추천',
  '디지털 트윈',
  '출하 도우미',
  '영농 캘린더',
  '카톡 알림',
];

const MODE_CARDS: {
  id: Mode;
  title: string;
  subtitle: string;
  desc: string;
  bullets: string[];
  color: 'green' | 'teal';
  icon: React.ReactNode;
}[] = [
    {
      id: 'returning',
      title: '귀농 모드',
      subtitle: '수익 작목 + 1년 경영 시뮬',
      desc: '귀농 준비~정착 1~3년차. 작목을 고르고 1년 매출·노동·위기를 미리 봅니다.',
      bullets: [
        '자본금·시설 기반 정밀 매칭',
        '1~3년 경영 계획 시뮬',
        '우수농가 벤치마크 수익 분석',
      ],
      color: 'green',
      icon: <IconHome2 size={24} />,
    },
    {
      id: 'weekend',
      title: '주말농장 모드',
      subtitle: '생육 관리 + 직거래·이웃나눔',
      desc: '도시 텃밭·주말농장. 수확량을 예측하고 직거래와 이웃나눔으로 연결합니다.',
      bullets: [
        '직거래·이웃나눔 연결',
        '방문 빈도 맞춤 작목',
        '가족 단위 수확량 기준',
      ],
      color: 'teal',
      icon: <IconLeaf size={24} />,
    },
  ];

export default function OnboardingPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);

  const form = useForm<OnboardingInput>({
    initialValues: {
      mode: 'returning',
      region: '옥천군',
      area: 300,
      areaUnit: 'pyeong',
      laborCount: 2,
      preferredCrops: [],
      budgetManwon: 3000,
      facility: 'vinyl_house',
      visitFrequency: 'weekly_1',
    },
    validate: {
      region: (v) => (v ? null : '지역을 선택해 주세요'),
      area: (v) => (v && v > 0 ? null : '면적을 입력해 주세요'),
      laborCount: (v) => (v && v >= 1 ? null : '노동력은 1인 이상으로 입력해 주세요'),
    },
  });

  const goNext = () => {
    if (active === 0) {
      if (!mode) return;
      form.setFieldValue('mode', mode);
      setActive(1);
      return;
    }
    const errors = form.validate();
    if (errors.hasErrors) return;
    const payload = form.values;
    try {
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    } catch { }
    router.push(`/recommend/result?mode=${payload.mode}`);
  };

  const goBack = () => {
    if (active === 0) return;
    setActive(0);
  };

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="md">
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
              조건 입력 → AI 추천
            </Badge>
          </Group>

          <Stepper active={active} color="green" size="sm" iconSize={28}>
            <Stepper.Step label="모드 선택" description="귀농 / 주말농장" />
            <Stepper.Step label="조건 입력" description="지역·자본·시설" />
            <Stepper.Step label="추천 결과" description="작목 TOP 3" />
          </Stepper>

          {active === 0 && <ModeSelect mode={mode} onChange={setMode} />}
          {active === 1 && mode && <ConditionForm form={form} mode={mode} />}

          <Group justify="space-between" mt="md">
            <Button
              variant="default"
              size="md"
              leftSection={<IconArrowLeft size={16} />}
              onClick={goBack}
              disabled={active === 0}
            >
              이전
            </Button>
            <Button
              color="green"
              size="md"
              rightSection={<IconArrowRight size={16} />}
              onClick={goNext}
              disabled={active === 0 && !mode}
            >
              {active === 0 ? '다음' : 'AI 추천받기'}
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

function ModeSelect({
  mode,
  onChange,
}: {
  mode: Mode | null;
  onChange: (m: Mode) => void;
}) {
  return (
    <Stack gap="md" mt="md">
      <Box>
        <Title order={3} fz={{ base: 22, md: 26 }} fw={800}>
          어떤 농사를 시작하시나요?
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          모드에 따라 추천 작목과 시뮬레이션 항목이 달라집니다.
        </Text>
      </Box>

      <Card
        radius="md"
        p="sm"
        withBorder
        bg="green.0"
        style={{ borderColor: 'var(--mantine-color-green-2)' }}
      >
        <Group gap="xs" wrap="wrap" align="center">
          <Group gap={6} wrap="nowrap">
            <ThemeIcon size={22} radius="xl" color="green" variant="filled">
              <IconSparkles size={12} />
            </ThemeIcon>
            <Text size="xs" fw={800} c="green.9" tt="uppercase" style={{ letterSpacing: 0.6 }}>
              두 모드 공통 기능
            </Text>
          </Group>
          <Box style={{ width: 1, height: 14, background: 'var(--mantine-color-green-3)' }} />
          <Group gap={6} wrap="wrap">
            {COMMON_FEATURES.map((f) => (
              <Badge key={f} color="green" variant="light" radius="sm" size="sm">
                {f}
              </Badge>
            ))}
          </Group>
        </Group>
      </Card>

      <Grid gutter="md">
        {MODE_CARDS.map((card) => {
          const selected = mode === card.id;
          return (
            <GridCol key={card.id} span={{ base: 12, sm: 6 }}>
              <UnstyledButton
                onClick={() => onChange(card.id)}
                w="100%"
                style={{ display: 'block' }}
              >
                <Card
                  radius="lg"
                  p="lg"
                  h="100%"
                  style={{
                    border: `2px solid ${selected
                        ? `var(--mantine-color-${card.color}-6)`
                        : 'var(--mantine-color-gray-2)'
                      }`,
                    background: selected
                      ? `var(--mantine-color-${card.color}-0)`
                      : 'white',
                    boxShadow: selected
                      ? `0 10px 24px -16px var(--mantine-color-${card.color}-6)`
                      : 'none',
                    transition: 'border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <ThemeIcon size={48} radius="md" color={card.color} variant="light">
                        {card.icon}
                      </ThemeIcon>
                      {selected && (
                        <Badge color={card.color} variant="filled" radius="sm">
                          선택됨
                        </Badge>
                      )}
                    </Group>
                    <Box>
                      <Title order={4}>{card.title}</Title>
                      <Text size="sm" c={card.color === 'green' ? 'green.7' : 'teal.7'} fw={600}>
                        {card.subtitle}
                      </Text>
                    </Box>
                    <Text size="sm" c="dimmed" lh={1.6}>
                      {card.desc}
                    </Text>
                    <Box>
                      <Text
                        size="xs"
                        c={card.color === 'green' ? 'green.7' : 'teal.7'}
                        fw={800}
                        tt="uppercase"
                        mb={6}
                        style={{ letterSpacing: 0.6 }}
                      >
                        이 모드만의 차별점
                      </Text>
                      <Stack gap={6}>
                        {card.bullets.map((b) => (
                          <Group key={b} gap={6} wrap="nowrap">
                            <Box
                              w={5}
                              h={5}
                              style={{
                                borderRadius: 99,
                                background: `var(--mantine-color-${card.color}-6)`,
                                flexShrink: 0,
                              }}
                            />
                            <Text size="xs" c="gray.7">
                              {b}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </UnstyledButton>
            </GridCol>
          );
        })}
      </Grid>
    </Stack>
  );
}

function ConditionForm({
  form,
  mode,
}: {
  form: ReturnType<typeof useForm<OnboardingInput>>;
  mode: Mode;
}) {
  return (
    <Stack gap="md" mt="md">
      <Box>
        <Title order={3} fz={{ base: 22, md: 26 }} fw={800}>
          {mode === 'returning' ? '귀농 조건을 알려주세요' : '주말농장 조건을 알려주세요'}
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          입력값은 AI 추천과 1년 시뮬레이션에 사용됩니다.
        </Text>
      </Box>

      <Card radius="lg" p="lg" withBorder bg="white">
        <Stack gap="lg">
          <FieldRow icon={<IconMapPin size={16} />} label="지역">
            <RegionPicker
              value={form.values.region}
              onChange={(v) => form.setFieldValue('region', v)}
              error={form.errors.region as string | undefined}
            />
          </FieldRow>

          <FieldRow icon={<IconRuler2 size={16} />} label="면적">
            <Group gap="xs" wrap="nowrap">
              <NumberInput
                flex={1}
                min={1}
                hideControls
                {...form.getInputProps('area')}
              />
              <SegmentedControl
                size="xs"
                value={form.values.areaUnit}
                onChange={(v) => form.setFieldValue('areaUnit', v as AreaUnit)}
                data={[
                  { label: '평', value: 'pyeong' },
                  { label: '㎡', value: 'sqm' },
                  { label: 'ha', value: 'hectare' },
                ]}
              />
            </Group>
          </FieldRow>

          <FieldRow icon={<IconUsers size={16} />} label="노동력">
            <NumberInput
              min={1}
              max={20}
              suffix="명"
              {...form.getInputProps('laborCount')}
            />
          </FieldRow>

          {mode === 'returning' && (
            <>
              <FieldRow icon={<IconCash size={16} />} label="자본금">
                <NumberInput
                  min={0}
                  step={100}
                  thousandSeparator=","
                  suffix=" 만원"
                  {...form.getInputProps('budgetManwon')}
                />
              </FieldRow>
              <FieldRow icon={<IconBuildingWarehouse size={16} />} label="시설">
                <SegmentedControl
                  fullWidth
                  value={form.values.facility ?? 'open_field'}
                  onChange={(v) => form.setFieldValue('facility', v as FacilityType)}
                  data={[
                    { label: '노지', value: 'open_field' },
                    { label: '비닐하우스', value: 'vinyl_house' },
                    { label: '스마트팜', value: 'smart_farm' },
                  ]}
                />
              </FieldRow>
            </>
          )}

          {mode === 'weekend' && (
            <FieldRow icon={<IconCalendarTime size={16} />} label="방문 빈도">
              <SegmentedControl
                fullWidth
                value={form.values.visitFrequency ?? 'weekly_1'}
                onChange={(v) => form.setFieldValue('visitFrequency', v as VisitFrequency)}
                data={[
                  { label: '주 1회', value: 'weekly_1' },
                  { label: '주 2회', value: 'weekly_2' },
                  { label: '격주', value: 'biweekly' },
                  { label: '월 1회', value: 'monthly' },
                ]}
              />
            </FieldRow>
          )}

          <FieldRow icon={<IconLeaf size={16} />} label="선호 작목 (선택)">
            <MultiSelect
              data={PREFERRED_CROP_OPTIONS}
              placeholder="없으면 비워두세요"
              {...form.getInputProps('preferredCrops')}
              searchable
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
            입력 즉시 XGBoost 모델이 스마트팜 우수농가 112호 데이터와 비교해 적합 작목 TOP 3를 가려냅니다.
          </Text>
        </Group>
      </Card>
    </Stack>
  );
}

function RegionPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (city: string) => void;
  error?: string;
}) {
  const [province, setProvince] = useState<string>(
    () => getProvinceByCity(value) ?? '충청북도',
  );
  const cities = getCitiesByProvince(province);

  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <Select
        data={PROVINCE_OPTIONS}
        value={province}
        onChange={(v) => {
          if (!v) return;
          setProvince(v);
          const nextCities = getCitiesByProvince(v);
          if (!nextCities.includes(value)) onChange(nextCities[0] ?? '');
        }}
        allowDeselect={false}
        searchable
        placeholder="시·도"
        w={170}
        nothingFoundMessage="검색 결과 없음"
      />
      <Select
        data={cities}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        allowDeselect={false}
        searchable
        placeholder="시·군·구"
        flex={1}
        nothingFoundMessage="검색 결과 없음"
        error={error}
        disabled={cities.length === 0}
      />
    </Group>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
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
      </Group>
      {children}
    </Box>
  );
}
