'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  Anchor,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconCalendarHeart,
  IconExternalLink,
  IconFlame,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import { fetchCompare, fetchHarvestCard, fetchRewardsSummary } from '@/lib/api/rewards';
import { cropEmoji } from '@/lib/cropEmoji';
import { cropIconSrc } from '@/lib/cropIcon';
import type { BadgeOut, CollectionEntry } from '@/lib/types';

const MONTH_LABEL = (m: number) => `${m}월`;

export default function CollectionPage() {
  const [selected, setSelected] = useState<CollectionEntry | null>(null);

  const summary = useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: fetchRewardsSummary,
    staleTime: 30_000,
  });

  const col = summary.data?.collection;
  const streak = summary.data?.streak;
  const badges = summary.data?.badges ?? [];
  const compare = summary.data?.compare;

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="lg">
        <Stack gap="lg">
          {/* 헤더 */}
          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              나의 텃밭 기록
            </Text>
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
              <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
                작물{' '}
                <Text span inherit c="green.7">
                  도감
                </Text>
              </Title>
              {streak && (
                <Group gap="xs">
                  <Tooltip label={streak.todayLogged ? '오늘 기록 완료!' : '오늘 기록을 남기면 연속 기록이 이어져요'}>
                    <Badge
                      size="lg"
                      radius="md"
                      variant={streak.todayLogged ? 'filled' : 'light'}
                      color="orange"
                      leftSection={<IconFlame size={14} />}
                    >
                      연속 {streak.current}일
                    </Badge>
                  </Tooltip>
                  <Badge size="lg" radius="md" variant="light" color="gray">
                    최고 {streak.best}일
                  </Badge>
                </Group>
              )}
            </Group>
            <Text c="dimmed" size="sm" mt={6}>
              수확 인증에 성공한 작물이 도감에 수집됩니다. 카드를 눌러 보관·요리 정보를 확인하세요.
            </Text>
          </Box>

          {/* 수집 현황 + 뱃지 */}
          <Card radius="lg" p="lg" withBorder bg="white">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Box miw={180}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                  수집 현황
                </Text>
                {col ? (
                  <>
                    <Title order={3} mt={4}>
                      {col.collectedCrops}
                      <Text span c="dimmed" fz="md" fw={600}>
                        {' '}
                        / {col.totalCrops}종
                      </Text>
                    </Title>
                    <Progress
                      value={(col.collectedCrops / col.totalCrops) * 100}
                      color="green"
                      size="sm"
                      radius="xl"
                      mt={8}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                      누적 수확 인증 {col.totalHarvests}회
                    </Text>
                  </>
                ) : (
                  <Skeleton height={60} mt={8} />
                )}
              </Box>
              <Divider orientation="vertical" visibleFrom="sm" />
              <Box style={{ flex: 1 }} miw={260}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                  뱃지
                </Text>
                <Group gap="sm" mt={8} wrap="wrap">
                  {badges.map((b) => (
                    <BadgeChip key={b.id} badge={b} />
                  ))}
                  {summary.isLoading && <Skeleton height={36} width={280} />}
                </Group>
              </Box>
            </Group>
          </Card>

          {/* 긍정형 비교 통계 */}
          {compare && (
            <Card
              radius="lg"
              p="lg"
              withBorder
              style={{
                background: compare.aboveMedian
                  ? 'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-lime-0))'
                  : 'white',
                borderColor: 'var(--mantine-color-green-2)',
              }}
            >
              <Group gap="md" wrap="nowrap" align="flex-start">
                <ThemeIcon size={44} radius="md" variant="light" color="green">
                  <IconUsers size={24} />
                </ThemeIcon>
                <Box>
                  <Group gap={8}>
                    <Text fw={700}>{compare.message}</Text>
                    {compare.aboveMedian && (
                      <Badge variant="filled" color="green" radius="sm">
                        상위 {compare.topPercent}%
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    지금 키워팜에서 {compare.communitySize.toLocaleString()}명이 함께 텃밭을 가꾸고 있어요
                  </Text>
                </Box>
              </Group>
            </Card>
          )}

          {/* 도감 그리드 */}
          {summary.isLoading ? (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="md">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={120} radius="lg" />
              ))}
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="md">
              {col?.entries.map((e) => (
                <CropTile key={e.cropSlug} entry={e} onOpen={() => e.collected && setSelected(e)} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>

      <HarvestCardModal entry={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}

function BadgeChip({ badge }: { badge: BadgeOut }) {
  return (
    <Tooltip
      label={
        badge.achieved
          ? badge.description
          : `${badge.description} (${badge.current}/${badge.threshold})`
      }
    >
      <Badge
        size="lg"
        radius="md"
        variant={badge.achieved ? 'filled' : 'light'}
        color={badge.achieved ? 'green' : 'gray'}
        style={badge.achieved ? undefined : { opacity: 0.7 }}
      >
        {badge.emoji} {badge.name}
        {!badge.achieved && ` ${Math.round(badge.progress * 100)}%`}
      </Badge>
    </Tooltip>
  );
}

/** 작물 아이콘 — public/svg 의 SVG. 대응 파일이 없으면 이모지로 폴백. */
function CropIcon({ slug, size, dimmed }: { slug: string; size: number; dimmed?: boolean }) {
  const src = cropIconSrc(slug);
  const dimStyle = dimmed ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined;
  if (src) {
    // 정적 SVG 아이콘이라 next/image 최적화가 불필요해 일반 img 사용.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ display: 'block', objectFit: 'contain', ...dimStyle }}
      />
    );
  }
  return (
    <Text fz={size} lh={1} style={dimStyle}>
      {cropEmoji(slug)}
    </Text>
  );
}

function CropTile({ entry, onOpen }: { entry: CollectionEntry; onOpen: () => void }) {
  const collected = entry.collected;
  return (
    <Card
      radius="lg"
      p="md"
      withBorder
      onClick={onOpen}
      style={{
        cursor: collected ? 'pointer' : 'default',
        background: collected ? 'white' : 'var(--mantine-color-gray-1)',
        borderColor: collected ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-gray-2)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      className={collected ? 'kw-feature-card' : undefined}
    >
      <Stack gap={6} align="center">
        <CropIcon slug={entry.cropSlug} size={60} dimmed={!collected} />
        <Text fw={700} size="sm" c={collected ? 'dark' : 'dimmed'}>
          {entry.cropName}
        </Text>
        {collected ? (
          <Badge size="sm" variant="light" color="green" radius="sm">
            완주 {entry.harvestCount}회
          </Badge>
        ) : (
          <Text size="xs" c="dimmed">
            미수집
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function HarvestCardModal({
  entry,
  onClose,
}: {
  entry: CollectionEntry | null;
  onClose: () => void;
}) {
  const card = useQuery({
    queryKey: ['harvest', 'card', entry?.cropSlug],
    queryFn: () => fetchHarvestCard(entry!.cropSlug),
    enabled: !!entry,
    staleTime: 5 * 60_000,
  });
  const cropCompare = useQuery({
    queryKey: ['rewards', 'compare', entry?.cropSlug],
    queryFn: () => fetchCompare(entry!.cropSlug),
    enabled: !!entry,
    staleTime: 60_000,
  });

  const c = card.data;
  const cc = cropCompare.data?.crop;

  return (
    <Modal
      opened={!!entry}
      onClose={onClose}
      size="lg"
      radius="lg"
      padding={0}
      withCloseButton={false}
      centered
    >
      {entry && (
        <Box>
          {/* 카드 헤더 */}
          <Box
            p="lg"
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-lime-6))',
              borderTopLeftRadius: 'var(--mantine-radius-lg)',
              borderTopRightRadius: 'var(--mantine-radius-lg)',
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Group gap="md">
                <Box
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    width: 76,
                    height: 76,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <CropIcon slug={entry.cropSlug} size={54} />
                </Box>
                <Box>
                  <Group gap={6}>
                    <Title order={3} c="white">
                      {entry.cropName} 수확 인증
                    </Title>
                    <IconSparkles size={20} color="white" />
                  </Group>
                  <Text c="green.0" size="sm" mt={2}>
                    키우기 완주 {entry.harvestCount}회 · 최근 수확 {entry.lastHarvestedAt}
                  </Text>
                </Box>
              </Group>
              {c && c.seasonMonths.length > 0 && (
                <Badge variant="white" color="green" radius="sm" leftSection={<IconCalendarHeart size={12} />}>
                  제철 {c.seasonMonths.map(MONTH_LABEL).join('·')}
                </Badge>
              )}
            </Group>
          </Box>

          {/* 카드 본문 */}
          <Stack p="lg" gap="md">
            {cc && (
              <Card radius="md" p="sm" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
                <Group gap={8} wrap="nowrap">
                  <IconUsers size={18} color="var(--mantine-color-green-7)" />
                  <Text size="sm" fw={600} c="green.9">
                    {cc.message}
                  </Text>
                </Group>
              </Card>
            )}
            {card.isLoading && <Skeleton height={200} />}
            {c && (
              <>
                <CardSection emoji="🧊" title="보관방법·손질법" body={c.storage} />
                <CardSection emoji="🥗" title="맛있게 먹기" body={c.eating} />
                <CardSection emoji="💪" title="영양·효능" body={c.nutrition} />

                {c.recipes.length > 0 && (
                  <Box>
                    <Text fw={700} size="sm" mb={6}>
                      🍳 추천 레시피
                    </Text>
                    <Stack gap={6}>
                      {c.recipes.map((r) => (
                        <Card key={r.name} radius="md" p="sm" withBorder bg="gray.0">
                          <Group justify="space-between" wrap="nowrap" gap="xs">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {r.name}
                            </Text>
                            {r.nutrients['에너지(kcal)'] && (
                              <Badge size="sm" variant="light" color="orange" radius="sm">
                                {Math.round(Number(r.nutrients['에너지(kcal)']))}kcal
                              </Badge>
                            )}
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Group gap="sm">
                  {c.links.map((l) => (
                    <Anchor key={l.url} href={l.url} target="_blank" rel="noreferrer" size="sm" c="green.7" fw={600}>
                      <Group gap={4} wrap="nowrap">
                        {l.label}
                        <IconExternalLink size={14} />
                      </Group>
                    </Anchor>
                  ))}
                </Group>

                <Text size="xs" c="dimmed">
                  출처: {c.source === 'nongsaro:monthFd' ? '농촌진흥청 농사로 「이달의 음식」' : 'AI 생성 정보 (참고용)'}
                </Text>
              </>
            )}
          </Stack>
        </Box>
      )}
    </Modal>
  );
}

function CardSection({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  if (!body) return null;
  return (
    <Box>
      <Text fw={700} size="sm" mb={4}>
        {emoji} {title}
      </Text>
      <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-line' }} lh={1.65}>
        {body}
      </Text>
    </Box>
  );
}
