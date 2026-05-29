'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBook2,
  IconBulb,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconLeaf,
  IconSearch,
  IconSeeding,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { fetchCropSummary, fetchCultivation, searchCrops } from '@/lib/api/crops';
import type { CropOption, CropSummary, CultivationGuide, EbookEntry } from '@/lib/types';

function CalendarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const itemCode = params.get('itemCode');
  const kindCode = params.get('kindCode');

  const [draftQ, setDraftQ] = useState(q);
  useEffect(() => setDraftQ(q), [q]);

  const searchQ = useQuery({
    queryKey: ['crops', 'search', q],
    queryFn: () => searchCrops(q, 40),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  });

  const cultivationQ = useQuery({
    queryKey: ['crops', 'cultivation', itemCode, kindCode],
    queryFn: () => fetchCultivation(itemCode!, kindCode!),
    enabled: !!itemCode && !!kindCode,
    retry: 1,
  });

  const summaryQ = useQuery({
    queryKey: ['crops', 'summary', itemCode, kindCode],
    queryFn: () => fetchCropSummary(itemCode!, kindCode!),
    enabled: !!itemCode && !!kindCode,
    retry: 0,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const selectedCrop: CropOption | null = useMemo(() => {
    if (!itemCode || !kindCode) return null;
    return (
      searchQ.data?.find(
        (c) => c.item_code === itemCode && c.kind_code === kindCode,
      ) ?? null
    );
  }, [itemCode, kindCode, searchQ.data]);

  const onSubmitSearch = () => {
    const next = draftQ.trim();
    if (!next) {
      router.push('/calendar');
      return;
    }
    router.push(`/calendar?q=${encodeURIComponent(next)}`);
  };

  const onSelectCrop = (c: CropOption) => {
    const qParam = q ? `q=${encodeURIComponent(q)}&` : '';
    router.push(`/calendar?${qParam}itemCode=${c.item_code}&kindCode=${c.kind_code}`);
  };

  const onClearSelection = () => {
    router.push(q ? `/calendar?q=${encodeURIComponent(q)}` : '/calendar');
  };

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
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
              농사로 · 작목별농업기술정보
            </Badge>
          </Group>

          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              재배 정보
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
              기를 작목을 검색하면{' '}
              <Text span inherit c="green.7">
                농업기술길잡이
              </Text>
              를 농사로에서 받아옵니다
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              작목명을 입력해 보세요. 선택한 작목의 농촌진흥청 농업기술길잡이 e-book과 목차를 표시합니다.
            </Text>
          </Box>

          <SearchBar
            value={draftQ}
            onChange={setDraftQ}
            onSubmit={onSubmitSearch}
            onClear={() => {
              setDraftQ('');
              router.push('/calendar');
            }}
          />

          {selectedCrop || itemCode ? (
            <CultivationView
              crop={selectedCrop}
              fallbackCodes={
                !selectedCrop && itemCode && kindCode
                  ? { itemCode, kindCode }
                  : null
              }
              isLoading={cultivationQ.isLoading}
              isError={cultivationQ.isError}
              data={cultivationQ.data}
              summary={summaryQ.data}
              summaryLoading={summaryQ.isLoading}
              summaryError={summaryQ.isError}
              onClear={onClearSelection}
            />
          ) : q ? (
            <SearchResults
              isLoading={searchQ.isLoading}
              isError={searchQ.isError}
              results={searchQ.data ?? []}
              onSelect={onSelectCrop}
            />
          ) : (
            <EmptyHint />
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <Box bg="gray.0" mih="100vh" py={48}>
          <Container size="xl">
            <Text c="dimmed">불러오는 중…</Text>
          </Container>
        </Box>
      }
    >
      <CalendarInner />
    </Suspense>
  );
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Group gap={6} mb="sm">
        <ThemeIcon size={22} radius="xl" color="green" variant="light">
          <IconLeaf size={12} />
        </ThemeIcon>
        <Text size="sm" fw={700}>
          작목 검색
        </Text>
      </Group>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Group gap="sm" wrap="nowrap">
          <TextInput
            flex={1}
            size="md"
            placeholder="예: 토마토, 상추, 고추, 양파…"
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            rightSection={
              value ? (
                <UnstyledButton onClick={onClear} aria-label="검색어 지우기">
                  <IconX size={14} color="var(--mantine-color-gray-6)" />
                </UnstyledButton>
              ) : null
            }
          />
          <Button type="submit" color="green" size="md">
            검색
          </Button>
        </Group>
      </form>
    </Card>
  );
}

function EmptyHint() {
  return (
    <Card
      radius="lg"
      p="xl"
      withBorder
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-teal-0))',
        borderColor: 'var(--mantine-color-green-2)',
        borderStyle: 'dashed',
      }}
    >
      <Stack align="center" gap="xs">
        <ThemeIcon size={48} radius="md" color="green" variant="light">
          <IconSeeding size={26} />
        </ThemeIcon>
        <Title order={5}>작목을 검색해 주세요</Title>
        <Text size="sm" c="gray.7" ta="center" maw={420}>
          작목명을 입력하면 KAMIS 분류에서 일치하는 작목 목록이 표시되고, 선택하면 농사로에서 재배 지침을 받아옵니다.
        </Text>
      </Stack>
    </Card>
  );
}

function SearchResults({
  isLoading,
  isError,
  results,
  onSelect,
}: {
  isLoading: boolean;
  isError: boolean;
  results: CropOption[];
  onSelect: (c: CropOption) => void;
}) {
  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h={72} radius="md" />
        ))}
      </SimpleGrid>
    );
  }
  if (isError) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
        작목 검색에 실패했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.
      </Alert>
    );
  }
  if (results.length === 0) {
    return (
      <Card radius="lg" p="xl" withBorder bg="white">
        <Stack align="center" gap="xs">
          <Text size="sm" c="gray.7">
            검색 결과가 없습니다. 다른 단어로 검색해 보세요.
          </Text>
        </Stack>
      </Card>
    );
  }
  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={700}>
          검색 결과
        </Text>
        <Text size="xs" c="dimmed">
          {results.length}건 · 작목을 누르면 재배 지침을 불러옵니다
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {results.map((c) => (
          <UnstyledButton
            key={`${c.item_code}-${c.kind_code}`}
            onClick={() => onSelect(c)}
          >
            <Card
              radius="md"
              p="sm"
              withBorder
              h="100%"
              style={{
                borderColor: 'var(--mantine-color-gray-2)',
                background: 'white',
                transition: 'border-color 160ms ease, background 160ms ease',
              }}
              className="kw-result-card"
            >
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Box>
                  <Group gap={6} mb={4}>
                    <Badge size="xs" color="gray" variant="light" radius="sm">
                      {c.group_name}
                    </Badge>
                    <Badge size="xs" color="green" variant="light" radius="sm">
                      {c.item_name}
                    </Badge>
                  </Group>
                  <Text fw={700} fz={14}>
                    {c.kind_name}
                  </Text>
                </Box>
              </Group>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>
      <style jsx global>{`
        .kw-result-card:hover {
          border-color: var(--mantine-color-green-4) !important;
          background: var(--mantine-color-green-0) !important;
        }
      `}</style>
    </Card>
  );
}

function CultivationView({
  crop,
  fallbackCodes,
  isLoading,
  isError,
  data,
  summary,
  summaryLoading,
  summaryError,
  onClear,
}: {
  crop: CropOption | null;
  fallbackCodes: { itemCode: string; kindCode: string } | null;
  isLoading: boolean;
  isError: boolean;
  data?: CultivationGuide;
  summary?: CropSummary;
  summaryLoading: boolean;
  summaryError: boolean;
  onClear: () => void;
}) {
  const headerName = crop?.label ?? data?.crop_name ?? '선택된 작목';
  const codes = crop
    ? { itemCode: crop.item_code, kindCode: crop.kind_code }
    : fallbackCodes;

  return (
    <Stack gap="md">
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
          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              선택한 작목
            </Text>
            <Title order={2} fz={{ base: 22, md: 28 }} fw={800} mt={4}>
              {headerName}
            </Title>
            <Group gap={6} mt={6}>
              {crop && (
                <>
                  <Badge color="gray" variant="light" radius="sm" size="sm">
                    {crop.group_name}
                  </Badge>
                  <Badge color="gray" variant="light" radius="sm" size="sm">
                    {crop.item_name}
                  </Badge>
                </>
              )}
              {codes && (
                <Badge color="gray" variant="light" radius="sm" size="sm">
                  KAMIS {codes.itemCode}·{codes.kindCode}
                </Badge>
              )}
              {data?.sub_category_name && (
                <Badge color="green" variant="light" radius="sm" size="sm">
                  농사로 매칭: {data.sub_category_name}
                </Badge>
              )}
            </Group>
          </Box>
          <Button variant="default" size="sm" onClick={onClear}>
            다른 작목 검색
          </Button>
        </Group>
      </Card>

      <SummaryCard summary={summary} loading={summaryLoading} error={summaryError} />

      {isLoading && (
        <Card radius="lg" p="xl" withBorder bg="white">
          <Group justify="center" gap="sm">
            <Loader size="sm" color="green" />
            <Text size="sm" c="gray.7">
              농사로에서 농업기술길잡이를 받아오는 중… (카테고리 트리 순회로 5~10초 소요)
            </Text>
          </Group>
        </Card>
      )}

      {isError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
          농사로 응답을 가져오지 못했습니다. 백엔드 로그·NONGSARO_API_KEY를 확인해 주세요.
        </Alert>
      )}

      {data && data.ebooks.length === 0 && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />} radius="md">
          해당 작목의 농업기술길잡이가 농사로에 등록되어 있지 않습니다.
          {data.source ? ` (${data.source})` : ''}
        </Alert>
      )}

      {data && data.ebooks.length > 0 && (
        <Card radius="lg" p="lg" withBorder bg="white">
          <Group justify="space-between" mb="md">
            <Group gap={8}>
              <ThemeIcon size={26} radius="md" color="grape" variant="light">
                <IconBook2 size={14} />
              </ThemeIcon>
              <Title order={5}>농업기술길잡이 {data.ebooks.length}건</Title>
            </Group>
            {data.source && (
              <Text size="xs" c="dimmed">
                {data.source}
              </Text>
            )}
          </Group>
          <Stack gap="md">
            {data.ebooks.map((eb) => (
              <EbookCard key={`${eb.ebook_code}-${eb.file_no}`} ebook={eb} />
            ))}
          </Stack>
        </Card>
      )}

      <Card radius="md" p="md" withBorder bg="white">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={28} radius="xl" color="gray" variant="light">
            <IconBook2 size={14} />
          </ThemeIcon>
          <Text size="sm" c="gray.7">
            출처: 농사로 (신)작목별농업기술정보 / cropEbook 서비스 (농촌진흥청). 본문 텍스트는 PDF·웹뷰어에서 확인하세요.
          </Text>
        </Group>
      </Card>
    </Stack>
  );
}

function EbookCard({ ebook }: { ebook: EbookEntry }) {
  const hasIndex = ebook.indices.length > 0;
  return (
    <Card
      radius="md"
      p="md"
      withBorder
      style={{ borderColor: 'var(--mantine-color-gray-2)', background: 'white' }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm" align="flex-start">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Group gap={6} mb={4}>
            <Badge size="xs" color="grape" variant="light" radius="sm">
              {ebook.ebook_code}
            </Badge>
            {ebook.std_item_name && (
              <Badge size="xs" color="gray" variant="light" radius="sm">
                {ebook.std_item_name}
              </Badge>
            )}
          </Group>
          <Text fw={700} fz={15} lh={1.4}>
            {ebook.ebook_name || '제목 없음'}
          </Text>
          {ebook.orginl_file_nm && (
            <Text size="xs" c="dimmed" mt={2}>
              {ebook.orginl_file_nm}
            </Text>
          )}
        </Box>
        <Group gap="xs" wrap="nowrap">
          {ebook.ebook_url && (
            <Button
              component="a"
              href={ebook.ebook_url}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              color="green"
              leftSection={<IconExternalLink size={12} />}
            >
              웹뷰어
            </Button>
          )}
          {ebook.ebook_mobile_url && (
            <Button
              component="a"
              href={ebook.ebook_mobile_url}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="default"
              leftSection={<IconExternalLink size={12} />}
            >
              모바일
            </Button>
          )}
          {ebook.file_url && (
            <Button
              component="a"
              href={ebook.file_url}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="default"
              leftSection={<IconDownload size={12} />}
            >
              PDF
            </Button>
          )}
        </Group>
      </Group>

      {hasIndex && (
        <Accordion
          variant="separated"
          radius="md"
          chevronPosition="right"
          mt="sm"
          styles={{
            item: {
              backgroundColor: 'var(--mantine-color-gray-0)',
              borderColor: 'var(--mantine-color-gray-2)',
            },
            control: { padding: '8px 12px' },
            content: { paddingLeft: 12, paddingRight: 12, paddingBottom: 12 },
          }}
        >
          <Accordion.Item value="index">
            <Accordion.Control>
              <Text size="sm" fw={600}>
                목차 ({ebook.indices.length})
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={4}>
                {ebook.indices.map((idx, i) => (
                  <Group key={`${idx.name}-${i}`} gap={6} wrap="nowrap" align="flex-start">
                    <IconChevronRight
                      size={12}
                      style={{
                        marginTop: 4,
                        marginLeft: (idx.level ?? 0) * 12,
                        color: 'var(--mantine-color-gray-5)',
                        flexShrink: 0,
                      }}
                    />
                    <Text size="sm" c="gray.8" style={{ flex: 1 }}>
                      {idx.name}
                    </Text>
                    {idx.page > 0 && (
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        p.{idx.page}
                      </Text>
                    )}
                  </Group>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
    </Card>
  );
}

function SummaryCard({
  summary,
  loading,
  error,
}: {
  summary?: CropSummary;
  loading: boolean;
  error: boolean;
}) {
  if (!loading && !error && !summary) return null;

  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-yellow-0), var(--mantine-color-orange-0))',
        borderColor: 'var(--mantine-color-yellow-3)',
      }}
    >
      <Group gap="sm" mb="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size={36} radius="md" color="yellow" variant="filled">
          <IconBulb size={18} />
        </ThemeIcon>
        <Box style={{ flex: 1 }}>
          <Group gap={6} wrap="wrap">
            <Text size="xs" fw={800} c="orange.8" tt="uppercase" style={{ letterSpacing: 1 }}>
              AI 키포인트 요약
            </Text>
            {summary?.mode === 'pdf' && (
              <Badge size="xs" color="green" variant="light" radius="sm">
                PDF 본문 기반
              </Badge>
            )}
            {summary?.mode === 'general' && (
              <Badge size="xs" color="gray" variant="light" radius="sm">
                일반 지식 기반 (PDF 미공개)
              </Badge>
            )}
          </Group>
          {summary?.headline ? (
            <Text fw={700} fz={16} mt={2} lh={1.5}>
              {summary.headline}
            </Text>
          ) : (
            <Text fw={700} fz={16} mt={2} c="gray.7">
              요약을 생성하고 있습니다…
            </Text>
          )}
        </Box>
      </Group>

      {loading && !summary && (
        <Group gap="sm" mt="md">
          <Loader size="xs" color="orange" />
          <Text size="xs" c="gray.7">
            PDF 다운 → 텍스트 추출 → GPT 요약 (첫 호출 10~30초, 다음부터는 캐시).
          </Text>
        </Group>
      )}

      {error && !summary && (
        <Alert color="red" icon={<IconAlertCircle size={14} />} radius="md" mt="sm" p="xs">
          요약 생성에 실패했습니다. OPENAI_API_KEY·PDF 접근을 확인해 주세요.
        </Alert>
      )}

      {summary && summary.key_points.length > 0 && (
        <Stack gap={6} mt="sm">
          {summary.key_points.map((p, i) => (
            <Group key={i} gap={8} wrap="nowrap" align="flex-start">
              <Box
                w={20}
                h={20}
                style={{
                  borderRadius: 6,
                  background: 'var(--mantine-color-yellow-2)',
                  color: 'var(--mantine-color-orange-9)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {i + 1}
              </Box>
              <Text size="sm" c="gray.9" lh={1.6}>
                {p}
              </Text>
            </Group>
          ))}
        </Stack>
      )}

      {summary?.source_ebook_name && (
        <Text size="xs" c="dimmed" mt="sm">
          출처: {summary.source_ebook_name}
          {summary.text_chars ? ` · 본문 ${summary.text_chars.toLocaleString()}자 분석` : ''}
        </Text>
      )}
    </Card>
  );
}
