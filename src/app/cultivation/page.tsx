'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Anchor,
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
  IconBookmarks,
  IconDownload,
  IconLeaf,
  IconSearch,
  IconSeeding,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { fetchCatalogEbooks, searchCropCatalog } from '@/lib/api/crops';
import { fetchGardenSummary, getGardenDetail } from '@/lib/api/garden';

function CultivationInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const no = params.get('no');

  const [draftQ, setDraftQ] = useState(q);
  useEffect(() => setDraftQ(q), [q]);

  const detailQ = useQuery({
    queryKey: ['garden', 'detail', no],
    queryFn: () => getGardenDetail(no!),
    enabled: !!no,
    retry: 1,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const onSubmitSearch = () => {
    const next = draftQ.trim();
    router.push(next ? `/cultivation?q=${encodeURIComponent(next)}` : '/cultivation');
  };
  // 원문 글(요약 근거) 열기 → 상세 본문 보기.
  const openNo = (cntntsNo: string) => {
    const qParam = q ? `q=${encodeURIComponent(q)}&` : '';
    router.push(`/cultivation?${qParam}no=${cntntsNo}`);
  };
  const onClear = () =>
    router.push(q ? `/cultivation?q=${encodeURIComponent(q)}` : '/cultivation');

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="lg">
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
              농사로 · 텃밭가꾸기 + 작목별기술정보
            </Badge>
          </Group>

          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              재배 정보
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
              기를 작물을 검색하면{' '}
              <Text span inherit c="green.7">
                재배 핵심을 요약
              </Text>
              해 드립니다
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              작물명을 입력하면 농사로 텃밭가꾸기 자료를 AI가 요약해 파종·물·시비·병해충·수확 핵심을
              정리하고, 작목별 농업기술길잡이 e-book도 함께 보여줍니다.
            </Text>
          </Box>

          <SearchBar
            value={draftQ}
            onChange={setDraftQ}
            onSubmit={onSubmitSearch}
            onClear={() => {
              setDraftQ('');
              router.push('/cultivation');
            }}
          />

          {no ? (
            <DetailView
              isLoading={detailQ.isLoading}
              isError={detailQ.isError}
              title={detailQ.data?.title}
              body={detailQ.data?.body}
              downUrl={detailQ.data?.downUrl ?? null}
              fileName={detailQ.data?.fileName ?? null}
              onClear={onClear}
            />
          ) : q ? (
            <Stack gap="lg">
              <GardenSummaryView q={q} onOpenSource={openNo} />
              <Card radius="lg" p="lg" withBorder bg="white">
                <CropEbookGuides q={q} />
              </Card>
            </Stack>
          ) : (
            <EmptyHint />
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default function CultivationPage() {
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
      <CultivationInner />
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
          작물 검색
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
            placeholder="예: 토마토, 상추, 대파, 양파…"
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
        <Title order={5}>작물을 검색해 주세요</Title>
        <Text size="sm" c="gray.7" ta="center" maw={490}>
          작물명을 입력하면 농사로 텃밭가꾸기 자료를 AI가 요약해 재배 핵심을 정리해 드립니다.
        </Text>
      </Stack>
    </Card>
  );
}

// 텃밭가꾸기와 함께 보여주는 작목별농업기술정보(cropEbook) 농업기술길잡이 e-book.
function CropEbookGuides({ q }: { q: string }) {
  const catalogQ = useQuery({
    queryKey: ['crop-catalog', 'search', q],
    queryFn: () => searchCropCatalog(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  });
  // 정확 일치 > 짧은 작목명(더 대표적) 순으로 가장 잘 맞는 작목 1개 선택.
  const term = q.trim();
  const items = catalogQ.data ?? [];
  const match =
    items.length > 0
      ? [...items].sort((a, b) => {
          const ax = a.name === term ? 0 : 1;
          const bx = b.name === term ? 0 : 1;
          return ax !== bx ? ax - bx : a.name.length - b.name.length;
        })[0]
      : undefined;
  const ebooksQ = useQuery({
    queryKey: ['catalog-ebooks', match?.code],
    queryFn: () => fetchCatalogEbooks(match!.code, match!.name),
    enabled: !!match,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const loading = catalogQ.isLoading || (!!match && ebooksQ.isLoading);
  const ebooks = ebooksQ.data?.ebooks ?? [];

  return (
    <Box>
      <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
        <Group gap={8}>
          <ThemeIcon size={22} radius="xl" color="teal" variant="light">
            <IconBookmarks size={12} />
          </ThemeIcon>
          <Text size="sm" fw={700}>
            작목별 농업기술정보
          </Text>
          {match && ebooks.length > 0 && (
            <Text size="xs" c="dimmed">
              {match.category ? `${match.category} · ` : ''}
              {match.name} · {ebooks.length}권
            </Text>
          )}
        </Group>
        <Badge variant="light" color="teal" radius="sm" size="sm">
          농업기술길잡이
        </Badge>
      </Group>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} h={64} radius="md" />
          ))}
        </SimpleGrid>
      ) : !match ? (
        <Text size="sm" c="dimmed">
          ‘{q}’에 해당하는 작목별 기술정보를 찾지 못했어요.
        </Text>
      ) : ebooks.length === 0 ? (
        <Text size="sm" c="dimmed">
          {match.name} 농업기술길잡이가 아직 없습니다.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {ebooks.map((bk) => {
            const inner = (
              <Card
                radius="md"
                p="sm"
                withBorder
                h="100%"
                className="kw-result-card"
                style={{
                  borderColor: 'var(--mantine-color-gray-2)',
                  background: 'white',
                  transition: 'border-color 160ms ease, background 160ms ease',
                }}
              >
                <Badge
                  size="xs"
                  color="teal"
                  variant="light"
                  radius="sm"
                  mb={4}
                  leftSection={<IconBookmarks size={10} />}
                >
                  농업기술길잡이
                </Badge>
                <Text fw={700} fz={14} lh={1.4} lineClamp={2}>
                  {bk.ebook_name}
                </Text>
                {bk.indices.length > 0 && (
                  <Text size="xs" c="dimmed" mt={4}>
                    목차 {bk.indices.length}개 · 누르면 e-book 열림
                  </Text>
                )}
              </Card>
            );
            const key = `${bk.ebook_code}-${bk.file_no}`;
            return bk.ebook_url ? (
              <UnstyledButton
                key={key}
                component="a"
                href={bk.ebook_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </UnstyledButton>
            ) : (
              <Box key={key}>{inner}</Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}

// 텃밭가꾸기 본문을 GPT로 요약해 재배 핵심을 보여준다(글 목록 클릭 대신).
function GardenSummaryView({
  q,
  onOpenSource,
}: {
  q: string;
  onOpenSource: (cntntsNo: string) => void;
}) {
  const summaryQ = useQuery({
    queryKey: ['garden', 'summary', q],
    queryFn: () => fetchGardenSummary(q),
    enabled: q.trim().length >= 1,
    retry: 1,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Group justify="space-between" mb="md" wrap="wrap" gap="xs">
        <Group gap={8}>
          <ThemeIcon size={26} radius="md" color="green" variant="light">
            <IconSparkles size={14} />
          </ThemeIcon>
          <Title order={5}>{q} 재배 요약</Title>
        </Group>
        <Badge variant="light" color="green" radius="sm" size="sm">
          {summaryQ.data?.mode === 'general'
            ? 'AI 일반 요약'
            : '농사로 텃밭가꾸기 · AI 요약'}
        </Badge>
      </Group>

      {summaryQ.isLoading ? (
        <Stack gap="sm">
          <Skeleton h={22} w="55%" radius="sm" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} h={16} radius="sm" />
          ))}
        </Stack>
      ) : summaryQ.isError ? (
        <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
          요약을 만들지 못했습니다. 백엔드 서버·OPENAI_API_KEY를 확인해 주세요.
        </Alert>
      ) : summaryQ.data ? (
        <Stack gap="md">
          <Text fw={700} fz={{ base: 16, md: 18 }} lh={1.5}>
            {summaryQ.data.headline}
          </Text>
          <Stack gap="xs">
            {summaryQ.data.keyPoints.map((p, i) => (
              <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
                <ThemeIcon size={20} radius="xl" color="green" variant="light" mt={2}>
                  <Text fw={800} fz={11}>
                    {i + 1}
                  </Text>
                </ThemeIcon>
                <Text size="sm" c="gray.9" lh={1.65} style={{ flex: 1 }}>
                  {p}
                </Text>
              </Group>
            ))}
          </Stack>

          {summaryQ.data.sources.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" mb={6}>
                원문 보기 (농사로 텃밭가꾸기)
              </Text>
              <Group gap={6} wrap="wrap">
                {summaryQ.data.sources.map((s) => (
                  <Badge
                    key={s.cntntsNo}
                    variant="outline"
                    color="gray"
                    radius="sm"
                    className="kw-source-chip"
                    style={{ cursor: 'pointer', textTransform: 'none', fontWeight: 500 }}
                    onClick={() => onOpenSource(s.cntntsNo)}
                  >
                    {s.title}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          <Text size="xs" c="dimmed">
            출처: 농사로 텃밭가꾸기 / fildMnfct · AI 요약(참고용)
          </Text>
        </Stack>
      ) : null}

      <style jsx global>{`
        .kw-source-chip:hover {
          border-color: var(--mantine-color-green-4) !important;
          background: var(--mantine-color-green-0) !important;
        }
      `}</style>
    </Card>
  );
}

function DetailView({
  isLoading,
  isError,
  title,
  body,
  downUrl,
  fileName,
  onClear,
}: {
  isLoading: boolean;
  isError: boolean;
  title?: string;
  seName?: string;
  body?: string;
  downUrl?: string | null;
  fileName?: string | null;
  onClear: () => void;
}) {
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
          <Box style={{ minWidth: 0 }}>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              텃밭가꾸기
            </Text>
            <Title order={2} fz={{ base: 22, md: 28 }} fw={800} mt={4}>
              {title ?? '재배 정보'}
            </Title>
          </Box>
          <Button variant="default" size="sm" onClick={onClear}>
            다른 글 검색
          </Button>
        </Group>
      </Card>

      {isLoading && (
        <Card radius="lg" p="xl" withBorder bg="white">
          <Group justify="center" gap="sm">
            <Loader size="sm" color="green" />
            <Text size="sm" c="gray.7">
              농사로에서 본문을 받아오는 중…
            </Text>
          </Group>
        </Card>
      )}

      {isError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
          본문을 가져오지 못했습니다. 백엔드 로그·NONGSARO_API_KEY를 확인해 주세요.
        </Alert>
      )}

      {body !== undefined && (
        <Card radius="lg" p="lg" withBorder bg="white">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Group gap={8}>
              <ThemeIcon size={26} radius="md" color="green" variant="light">
                <IconBook2 size={14} />
              </ThemeIcon>
              <Title order={5}>재배 정보</Title>
            </Group>
            {downUrl && (
              <Button
                component="a"
                href={downUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                color="green"
                leftSection={<IconDownload size={12} />}
              >
                첨부 자료{fileName ? ` (${fileName})` : ''}
              </Button>
            )}
          </Group>
          {body.trim() ? (
            <Text size="sm" c="gray.9" lh={1.7} style={{ whiteSpace: 'pre-wrap' }}>
              {body}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              본문이 비어 있습니다. {downUrl ? '첨부 자료를 확인해 주세요.' : ''}
            </Text>
          )}
        </Card>
      )}

      <Card radius="md" p="md" withBorder bg="white">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={28} radius="xl" color="gray" variant="light">
            <IconBook2 size={14} />
          </ThemeIcon>
          <Text size="sm" c="gray.7">
            출처: 농사로 텃밭가꾸기 / fildMnfct (농촌진흥청).{' '}
            <Anchor href="https://www.nongsaro.go.kr" target="_blank" rel="noreferrer" size="sm">
              nongsaro.go.kr
            </Anchor>
          </Text>
        </Group>
      </Card>
    </Stack>
  );
}
