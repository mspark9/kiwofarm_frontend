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
  IconDownload,
  IconLeaf,
  IconSearch,
  IconSeeding,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { getGardenDetail, searchGarden } from '@/lib/api/garden';
import type { GardenItem } from '@/lib/types';

function CultivationInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const no = params.get('no');

  const [draftQ, setDraftQ] = useState(q);
  useEffect(() => setDraftQ(q), [q]);

  const searchQ = useQuery({
    queryKey: ['garden', 'search', q],
    queryFn: () => searchGarden(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  });

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
  const onSelect = (it: GardenItem) => {
    const qParam = q ? `q=${encodeURIComponent(q)}&` : '';
    router.push(`/cultivation?${qParam}no=${it.cntntsNo}`);
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
              농사로 · 텃밭가꾸기
            </Badge>
          </Group>

          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              재배 정보
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
              기를 작물을 검색하면{' '}
              <Text span inherit c="green.7">
                텃밭가꾸기 정보
              </Text>
              를 농사로에서 받아옵니다
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              작물명·키워드를 입력하면 농사로 텃밭가꾸기 콘텐츠(재배 캘린더·모종 심는 법·관리 요령 등)를 보여줍니다.
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
            <SearchResults
              isLoading={searchQ.isLoading}
              isError={searchQ.isError}
              results={searchQ.data ?? []}
              onSelect={onSelect}
            />
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
          작물명을 입력하면 농사로 텃밭가꾸기에서 일치하는 글이 표시됩니다.
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
  results: GardenItem[];
  onSelect: (it: GardenItem) => void;
}) {
  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h={64} radius="md" />
        ))}
      </SimpleGrid>
    );
  }
  if (isError) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
        검색에 실패했습니다. 백엔드 서버·NONGSARO_API_KEY를 확인해 주세요.
      </Alert>
    );
  }
  if (results.length === 0) {
    return (
      <Card radius="lg" p="xl" withBorder bg="white">
        <Text size="sm" c="gray.7" ta="center">
          검색 결과가 없습니다. 다른 단어로 검색해 보세요.
        </Text>
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
          {results.length}건 · 글을 누르면 본문을 불러옵니다
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {results.map((it) => (
          <UnstyledButton key={it.cntntsNo} onClick={() => onSelect(it)}>
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
              {it.seName && (
                <Badge size="xs" color="green" variant="light" radius="sm" mb={4}>
                  {it.seName}
                </Badge>
              )}
              <Text fw={700} fz={14} lh={1.4}>
                {it.title}
              </Text>
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
