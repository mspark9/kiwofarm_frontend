'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBuildingBank,
  IconCircleCheck,
  IconExternalLink,
  IconHelpCircle,
  IconPhone,
  IconSparkles,
} from '@tabler/icons-react';
import { fetchSupportMatch } from '@/lib/api/support';
import { PROVINCE_OPTIONS } from '@/lib/regions';
import { ONBOARDING_STORAGE_KEY } from '@/lib/constants';
import type { OnboardingInput, ProgramOut } from '@/lib/types';

interface Form {
  mode: string;
  province: string;
  age: number | '';
  farmingYears: number | '';
}

const DEFAULT_FORM: Form = { mode: 'returning', province: '', age: '', farmingYears: '' };

const CATEGORY_COLOR: Record<string, string> = {
  정착지원금: 'green',
  융자: 'teal',
  주거: 'indigo',
  농지: 'lime',
  교육: 'blue',
  인증: 'grape',
  임대: 'cyan',
  보험: 'orange',
  복지: 'pink',
};

export default function SupportPage() {
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [committed, setCommitted] = useState<Form>(DEFAULT_FORM);
  const [ready, setReady] = useState(false);

  // 온보딩 조건 프리필 후 1회 자동 조회
  useEffect(() => {
    let next = DEFAULT_FORM;
    try {
      const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw) as OnboardingInput;
        next = {
          mode: o.mode ?? 'returning',
          province: o.province ?? '',
          age: '',
          farmingYears: '',
        };
      }
    } catch {
      /* 무시 */
    }
    setForm(next);
    setCommitted(next);
    setReady(true);
  }, []);

  const match = useQuery({
    queryKey: ['support-match', committed.mode, committed.age, committed.farmingYears, committed.province],
    queryFn: () =>
      fetchSupportMatch({
        mode: committed.mode,
        age: committed.age === '' ? null : committed.age,
        farmingYears: committed.farmingYears === '' ? null : committed.farmingYears,
        province: committed.province || null,
      }),
    enabled: ready,
  });

  const setMode = (mode: string) => {
    const next = { ...form, mode };
    setForm(next);
    setCommitted(next);
  };

  const d = match.data;

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="sm">
        <Stack gap="xl">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
              정부 지원사업 · 맞춤 매칭
            </Text>
            <Title order={2}>받을 수 있는 지원금 찾기</Title>
          </Box>

          {/* 조건 입력 */}
          <Card radius="lg" p="lg" withBorder shadow="sm">
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb={6}>
                  유형
                </Text>
                <SegmentedControl
                  value={form.mode}
                  onChange={setMode}
                  data={[
                    { label: '귀농 (전업)', value: 'returning' },
                    { label: '주말농장', value: 'weekend' },
                  ]}
                  fullWidth
                />
              </Box>
              <Group grow align="flex-start" wrap="wrap">
                <Select
                  label="지역 (시·도)"
                  data={PROVINCE_OPTIONS}
                  value={form.province || null}
                  onChange={(v) => setForm({ ...form, province: v ?? '' })}
                  searchable
                  clearable
                  placeholder="선택"
                  nothingFoundMessage="검색 결과 없음"
                />
                <NumberInput
                  label="연령"
                  value={form.age}
                  onChange={(v) => setForm({ ...form, age: typeof v === 'number' ? v : '' })}
                  min={18}
                  max={100}
                  suffix=" 세"
                  placeholder="예: 35"
                />
                <NumberInput
                  label="영농경력"
                  value={form.farmingYears}
                  onChange={(v) => setForm({ ...form, farmingYears: typeof v === 'number' ? v : '' })}
                  min={0}
                  max={60}
                  suffix=" 년"
                  placeholder="없으면 비움"
                />
              </Group>
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Text size="xs" c="dimmed">
                  연령·경력은 청년농 등 자격 판정에 쓰입니다. 비우면 해당 사업은 조건확인으로 표시됩니다.
                </Text>
                <Button color="green" onClick={() => setCommitted(form)}>
                  지원사업 찾기
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* AI 맞춤 요약 */}
          <Card radius="lg" p="xl" withBorder shadow="sm" bg="white">
            <Stack gap="md">
              <Group gap={8}>
                <ThemeIcon size={28} radius="md" variant="light" color="green">
                  <IconSparkles size={16} />
                </ThemeIcon>
                <Text fw={700}>AI 맞춤 요약</Text>
                {d?.advice_source === 'ai' && (
                  <Badge size="xs" variant="light" color="grape" radius="sm">
                    GPT-4o
                  </Badge>
                )}
                {d?.advice_source === 'rule' && (
                  <Badge size="xs" variant="light" color="gray" radius="sm">
                    규칙기반
                  </Badge>
                )}
              </Group>

              {match.isLoading && (
                <Group gap="xs" py="sm">
                  <Loader size="sm" color="green" />
                  <Text size="sm" c="dimmed">
                    조건에 맞는 지원사업을 분석하는 중…
                  </Text>
                </Group>
              )}

              {match.isError && (
                <Text size="sm" c="red">
                  지원사업을 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.
                </Text>
              )}

              {d && (
                <>
                  <Text size="md" lh={1.7}>
                    {d.advice}
                  </Text>
                  <Group gap="xs">
                    <Badge color="green" variant="light" radius="sm">
                      적합 {d.eligible_count}
                    </Badge>
                    <Badge color="yellow" variant="light" radius="sm">
                      조건확인 {d.check_count}
                    </Badge>
                    {d.excluded_count > 0 && (
                      <Badge color="gray" variant="light" radius="sm">
                        대상아님 {d.excluded_count}
                      </Badge>
                    )}
                  </Group>
                </>
              )}
            </Stack>
          </Card>

          {/* 사업 목록 */}
          {d && d.programs.length > 0 && (
            <Stack gap="sm">
              {d.programs.map((p) => (
                <ProgramCard key={p.id} p={p} />
              ))}
              <Text size="xs" c="dimmed">
                지원 조건·금액은 매년·지자체별로 달라집니다. 최종 자격과 신청 기간은 각 사업 공고로
                확인하세요.
              </Text>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function ProgramCard({ p }: { p: ProgramOut }) {
  const eligible = p.status === 'eligible';
  const catColor = CATEGORY_COLOR[p.category] ?? 'gray';
  return (
    <Card radius="lg" p="lg" withBorder shadow="sm">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Group gap={6} mb={4} wrap="wrap">
              <Badge color={catColor} variant="light" radius="sm" size="sm">
                {p.category}
              </Badge>
              <Badge
                color={eligible ? 'green' : 'yellow'}
                variant={eligible ? 'filled' : 'light'}
                radius="sm"
                size="sm"
                leftSection={eligible ? <IconCircleCheck size={12} /> : <IconHelpCircle size={12} />}
              >
                {eligible ? '적합' : '조건확인'}
              </Badge>
            </Group>
            <Text fw={700} lh={1.3}>
              {p.name}
            </Text>
            <Text size="xs" c="dimmed">
              {p.agency}
            </Text>
          </Box>
        </Group>

        <Group gap={6} align="baseline" wrap="wrap">
          <IconBuildingBank size={16} stroke={1.6} color="var(--mantine-color-green-6)" />
          <Text fw={700} c="green.8">
            {p.support}
          </Text>
        </Group>

        <Text size="sm" c="dimmed" lh={1.5}>
          {p.summary}
        </Text>

        {p.reasons.length > 0 && (
          <Group gap={6} wrap="wrap">
            {p.reasons.map((r, i) => (
              <Badge
                key={i}
                color={eligible ? 'green' : 'gray'}
                variant="light"
                size="xs"
                radius="sm"
              >
                {r}
              </Badge>
            ))}
          </Group>
        )}

        {p.notes && (
          <Text size="xs" c="dimmed">
            {p.notes}
          </Text>
        )}

        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap={6} c="dimmed" wrap="nowrap">
            {p.apply.phone && (
              <>
                <IconPhone size={13} stroke={1.6} />
                <Text size="xs">{p.apply.phone}</Text>
              </>
            )}
            {p.apply.where && (
              <Text size="xs" truncate>
                · {p.apply.where}
              </Text>
            )}
          </Group>
          {p.apply.link && (
            <Anchor href={p.apply.link} target="_blank" rel="noreferrer" size="sm">
              <Group gap={4} wrap="nowrap">
                <Text size="sm" c="green.7" fw={600}>
                  신청·안내
                </Text>
                <IconExternalLink size={13} />
              </Group>
            </Anchor>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
