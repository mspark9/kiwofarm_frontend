'use client';

import { useMemo, useState } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Card,
  Container,
  Group,
  Modal,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconCalendarHeart,
  IconExternalLink,
  IconFlame,
  IconInfoCircle,
  IconLock,
  IconNotebook,
  IconPhoto,
  IconSparkles,
  IconTargetArrow,
  IconUsers,
} from '@tabler/icons-react';
import {
  fetchCompare,
  fetchCropJournal,
  fetchHarvestCard,
  fetchRewardsSummary,
} from '@/lib/api/rewards';
import { mediaUrl } from '@/lib/constants';
import { cropEmoji } from '@/lib/cropEmoji';
import { cropIconSrc } from '@/lib/cropIcon';
import type { BadgeOut, CollectionEntry, CropJournalOut, HarvestCard, PointsOut } from '@/lib/types';

const MONTH_LABEL = (m: number) => `${m}월`;
const DIFFICULTY_LABEL: Record<number, string> = { 1: '쉬움', 2: '보통', 3: '도전' };

type FilterMode = 'all' | 'collected' | 'uncollected';
type SortMode = 'default' | 'difficulty' | 'name';

/** 카테고리를 마스터 등장 순서대로 보존하며 그룹핑. */
function groupByCategory(
  entries: CollectionEntry[],
): { category: string; entries: CollectionEntry[] }[] {
  const order: string[] = [];
  const map = new Map<string, CollectionEntry[]>();
  for (const e of entries) {
    const cat = e.category || '기타';
    if (!map.has(cat)) {
      map.set(cat, []);
      order.push(cat);
    }
    map.get(cat)!.push(e);
  }
  return order.map((category) => ({ category, entries: map.get(category)! }));
}

/** 카테고리별 수집/전체 — 섹션 헤더·진행률 카드 공용. */
function categoryProgress(
  entries: CollectionEntry[],
): { category: string; collected: number; total: number }[] {
  return groupByCategory(entries).map((g) => ({
    category: g.category,
    collected: g.entries.filter((e) => e.collected).length,
    total: g.entries.length,
  }));
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function CollectionPage() {
  const [selected, setSelected] = useState<CollectionEntry | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('default');

  const summary = useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: fetchRewardsSummary,
    staleTime: 30_000,
  });

  const col = summary.data?.collection;
  const streak = summary.data?.streak;
  const points = summary.data?.points;
  const badges = summary.data?.badges ?? [];
  const compare = summary.data?.compare;

  const allEntries = col?.entries ?? [];

  // 필터·정렬 적용 후 카테고리 그룹핑. entries 40개라 매 렌더 계산해도 부담 없음.
  const groups = useMemo(() => {
    let list = allEntries;
    if (filter === 'collected') list = list.filter((e) => e.collected);
    else if (filter === 'uncollected') list = list.filter((e) => !e.collected);

    if (sort !== 'default') {
      list = [...list].sort((a, b) => {
        if (sort === 'name') return a.cropName.localeCompare(b.cropName, 'ko');
        return (b.difficulty ?? 0) - (a.difficulty ?? 0);
      });
    }
    return groupByCategory(list);
  }, [allEntries, filter, sort]);

  // 다음 목표 — 미달성 뱃지 중 완성에 가장 가까운 것.
  const nextGoal = useMemo(
    () =>
      badges
        .filter((b) => !b.achieved && b.threshold > 0)
        .sort((a, b) => b.progress - a.progress)[0],
    [badges],
  );

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
                  <Tooltip label={streak.todayLogged ? '오늘 기록 완료' : '오늘 기록을 남기면 연속 기록이 이어져요'}>
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

          {/* 수집 현황 + 포인트 */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <CollectionStatusCard
              col={col}
              activeDays={streak?.totalActiveDays}
              nextGoal={nextGoal}
            />
            <PointsCard points={points} loading={summary.isLoading} />
          </SimpleGrid>

          {/* 뱃지 */}
          <Card radius="lg" p="lg" withBorder bg="white">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              뱃지
            </Text>
            <Group gap="sm" mt={8} wrap="wrap">
              {badges.map((b) => (
                <BadgeChip key={b.id} badge={b} />
              ))}
              {summary.isLoading && <Skeleton height={36} width={280} />}
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

          {/* 필터·정렬 바 */}
          {!summary.isLoading && col && (
            <Group justify="space-between" wrap="wrap" gap="sm">
              <SegmentedControl
                size="sm"
                radius="md"
                value={filter}
                onChange={(v) => setFilter(v as FilterMode)}
                data={[
                  { label: `전체 ${col.totalCrops}`, value: 'all' },
                  { label: `수집 ${col.collectedCrops}`, value: 'collected' },
                  { label: `미수집 ${col.totalCrops - col.collectedCrops}`, value: 'uncollected' },
                ]}
              />
              <SegmentedControl
                size="sm"
                radius="md"
                value={sort}
                onChange={(v) => setSort(v as SortMode)}
                data={[
                  { label: '기본', value: 'default' },
                  { label: '난이도', value: 'difficulty' },
                  { label: '이름', value: 'name' },
                ]}
              />
            </Group>
          )}

          {/* 도감 그리드 — 카테고리 섹션 */}
          {summary.isLoading ? (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="md">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={140} radius="lg" />
              ))}
            </SimpleGrid>
          ) : groups.length === 0 ? (
            <Card radius="lg" p="xl" withBorder bg="white">
              <Text c="dimmed" ta="center">
                해당하는 작물이 없습니다.
              </Text>
            </Card>
          ) : (
            <Stack gap="lg">
              {groups.map((g) => {
                const collected = g.entries.filter((e) => e.collected).length;
                return (
                  <Box key={g.category}>
                    <Group justify="space-between" align="center" mb={8}>
                      <Text fw={800} size="md">
                        {g.category}
                      </Text>
                      <Group gap={8} align="center">
                        <Text size="xs" c="dimmed" fw={600}>
                          {collected}/{g.entries.length}
                        </Text>
                        <Progress
                          value={(collected / g.entries.length) * 100}
                          color="green"
                          size="sm"
                          radius="xl"
                          w={72}
                        />
                      </Group>
                    </Group>
                    <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="md">
                      {g.entries.map((e) => (
                        <CropTile
                          key={e.cropSlug}
                          entry={e}
                          onOpen={() => e.collected && setSelected(e)}
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>

      <HarvestCardModal entry={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}

/** 수집 현황 — 누적 집계 + 카테고리별 진행률 + 다음 목표. */
function CollectionStatusCard({
  col,
  activeDays,
  nextGoal,
}: {
  col?: { totalCrops: number; collectedCrops: number; totalHarvests: number; entries: CollectionEntry[] };
  activeDays?: number;
  nextGoal?: BadgeOut;
}) {
  if (!col) {
    return (
      <Card radius="lg" p="lg" withBorder bg="white">
        <Skeleton height={160} />
      </Card>
    );
  }
  const cats = categoryProgress(col.entries);
  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
        수집 현황
      </Text>
      <Group align="flex-end" gap="xs" mt={4}>
        <Title order={3}>
          {col.collectedCrops}
          <Text span c="dimmed" fz="md" fw={600}>
            {' '}
            / {col.totalCrops}종
          </Text>
        </Title>
      </Group>
      <Progress
        value={(col.collectedCrops / col.totalCrops) * 100}
        color="green"
        size="sm"
        radius="xl"
        mt={8}
      />
      <Group gap={6} mt={6}>
        <Text size="xs" c="dimmed">
          누적 수확 인증 {col.totalHarvests}회
        </Text>
        {activeDays != null && (
          <>
            <Text size="xs" c="dimmed">
              ·
            </Text>
            <Text size="xs" c="dimmed">
              총 기록 {activeDays}일
            </Text>
          </>
        )}
      </Group>

      {/* 카테고리별 진행률 */}
      <Stack gap={6} mt="md">
        {cats.map((c) => (
          <Box key={c.category}>
            <Group justify="space-between" gap={4}>
              <Text size="xs" c="gray.7" fw={600}>
                {c.category}
              </Text>
              <Text size="xs" c="dimmed">
                {c.collected}/{c.total}
              </Text>
            </Group>
            <Progress
              value={(c.collected / c.total) * 100}
              color="lime"
              size="xs"
              radius="xl"
              mt={2}
            />
          </Box>
        ))}
      </Stack>

      {/* 다음 목표 */}
      {nextGoal && (
        <Group gap={8} mt="md" wrap="nowrap" align="center">
          <ThemeIcon size={30} radius="md" variant="light" color="green">
            <IconTargetArrow size={18} />
          </ThemeIcon>
          <Box style={{ flex: 1 }}>
            <Text size="xs" c="dimmed">
              다음 목표
            </Text>
            <Text size="sm" fw={600}>
              {nextGoal.emoji} {nextGoal.name} · {nextGoal.threshold - nextGoal.current}개 남음
            </Text>
          </Box>
        </Group>
      )}
    </Card>
  );
}

/** 활동 점수 — 총점 + 메모·사진·수확 분해. */
function PointsCard({ points, loading }: { points?: PointsOut; loading: boolean }) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      style={{
        background: 'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-green-5))',
      }}
    >
      <Text size="xs" c="green.0" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
        활동 점수
      </Text>
      {loading || !points ? (
        <Skeleton height={120} mt={8} />
      ) : (
        <>
          <Title order={2} c="white" mt={4}>
            {points.total.toLocaleString()}
            <Text span c="green.0" fz="md" fw={600}>
              {' '}
              점
            </Text>
          </Title>
          <SimpleGrid cols={3} spacing="xs" mt="md">
            <PointStat label="메모" value={points.memoCount} />
            <PointStat label="사진" value={points.photoCount} />
            <PointStat label="수확 인증" value={points.harvestCount} />
          </SimpleGrid>
          <Text size="xs" c="green.0" mt="md" style={{ opacity: 0.85 }}>
            기록을 남길수록 점수가 쌓여요
          </Text>
        </>
      )}
    </Card>
  );
}

function PointStat({ label, value }: { label: string; value: number }) {
  return (
    <Box
      style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        padding: '8px 6px',
        textAlign: 'center',
      }}
    >
      <Text c="white" fw={800} fz="lg" lh={1.1}>
        {value.toLocaleString()}
      </Text>
      <Text c="green.0" size="xs" mt={2}>
        {label}
      </Text>
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

/** 난이도 점(●) — 1~3 척도. */
function DifficultyDots({ level }: { level: number }) {
  return (
    <Tooltip label={`난이도 ${DIFFICULTY_LABEL[level] ?? level}`}>
      <Group gap={3} wrap="nowrap">
        {[1, 2, 3].map((n) => (
          <Box
            key={n}
            w={6}
            h={6}
            style={{
              borderRadius: '50%',
              background:
                n <= level ? 'var(--mantine-color-orange-5)' : 'var(--mantine-color-gray-3)',
            }}
          />
        ))}
      </Group>
    </Tooltip>
  );
}

/** 제철 12개월 스트립 — 제철 월 강조. */
function SeasonStrip({ months }: { months: number[] }) {
  const set = new Set(months);
  return (
    <Box>
      <Text fw={700} size="sm" mb={6}>
        🗓 제철 달력
      </Text>
      <Group gap={3} wrap="nowrap">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const on = set.has(m);
          return (
            <Box
              key={m}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '4px 0',
                borderRadius: 6,
                background: on ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-1)',
              }}
            >
              <Text size="xs" fw={on ? 700 : 400} c={on ? 'white' : 'dimmed'} lh={1.2}>
                {m}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Box>
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
        position: 'relative',
      }}
      className={collected ? 'kw-feature-card' : undefined}
    >
      {!collected && (
        <ThemeIcon
          size={22}
          radius="xl"
          variant="filled"
          color="gray.4"
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          <IconLock size={13} />
        </ThemeIcon>
      )}
      <Stack gap={6} align="center">
        <CropIcon slug={entry.cropSlug} size={56} dimmed={!collected} />
        <Tooltip
          label={collected ? `수집일 ${fmtDate(entry.firstHarvestedAt)}` : '미수집'}
          disabled={!collected || !entry.firstHarvestedAt}
        >
          <Text fw={700} size="sm" c={collected ? 'dark' : 'dimmed'}>
            {entry.cropName}
          </Text>
        </Tooltip>
        {entry.difficulty != null && <DifficultyDots level={entry.difficulty} />}
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
  const growLabel = entry ? growPeriodLabel(entry, c) : '';

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
            <Group justify="space-between" align="flex-start" wrap="nowrap">
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
                  <Group gap={6} mt={6}>
                    {entry.category && (
                      <Badge variant="white" color="green" radius="sm" size="sm">
                        {entry.category}
                      </Badge>
                    )}
                    {entry.difficulty != null && (
                      <Badge variant="white" color="orange" radius="sm" size="sm">
                        난이도 {DIFFICULTY_LABEL[entry.difficulty] ?? entry.difficulty}
                      </Badge>
                    )}
                    {c && c.seasonMonths.length > 0 && (
                      <Badge
                        variant="white"
                        color="green"
                        radius="sm"
                        size="sm"
                        leftSection={<IconCalendarHeart size={12} />}
                      >
                        제철 {c.seasonMonths.map(MONTH_LABEL).join('·')}
                      </Badge>
                    )}
                  </Group>
                  <Text c="green.0" size="sm" mt={6}>
                    키우기 완주 {entry.harvestCount}회{growLabel ? ` · ${growLabel}` : ''}
                  </Text>
                </Box>
              </Group>
            </Group>
          </Box>

          {/* 카드 본문 — 정보 / 내 기록 탭 */}
          <Tabs defaultValue="info" keepMounted={false} color="green">
            <Tabs.List px="lg" pt="md">
              <Tabs.Tab value="info" leftSection={<IconInfoCircle size={15} />}>
                정보
              </Tabs.Tab>
              <Tabs.Tab value="journal" leftSection={<IconNotebook size={15} />}>
                내 기록
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info">
              <Stack p="lg" gap="md">
                {cc && <CropCompareBlock compare={cc} />}
                {card.isLoading && <Skeleton height={200} />}
                {c && (
                  <>
                    {c.seasonMonths.length > 0 && <SeasonStrip months={c.seasonMonths} />}

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
                            <RecipeRow key={r.name} name={r.name} nutrients={r.nutrients} />
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
            </Tabs.Panel>

            <Tabs.Panel value="journal">
              <CropJournalPanel cropSlug={entry.cropSlug} />
            </Tabs.Panel>
          </Tabs>
        </Box>
      )}
    </Modal>
  );
}

/** 내 기록 탭 — 이 작물을 키우며 남긴 메모·사진(최신순). 탭 선택 시 lazy fetch. */
function CropJournalPanel({ cropSlug }: { cropSlug: string }) {
  const journal = useQuery({
    queryKey: ['harvest', 'crop-journal', cropSlug],
    queryFn: () => fetchCropJournal(cropSlug),
    staleTime: 2 * 60_000,
  });
  const data = journal.data;

  if (journal.isLoading) {
    return (
      <Stack p="lg" gap="sm">
        <Skeleton height={90} radius="md" />
        <Skeleton height={90} radius="md" />
      </Stack>
    );
  }

  if (!data || data.memos.length === 0) {
    return (
      <Stack p="xl" gap={6} align="center">
        <ThemeIcon size={48} radius="xl" variant="light" color="gray">
          <IconNotebook size={26} />
        </ThemeIcon>
        <Text c="dimmed" size="sm" ta="center">
          아직 남긴 기록이 없어요. 캘린더에서 메모와 사진을 남겨보세요.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack p="lg" gap="md">
      <Group gap={8}>
        <Badge variant="light" color="green" radius="sm" leftSection={<IconNotebook size={12} />}>
          기록 {data.totalMemos}
        </Badge>
        <Badge variant="light" color="teal" radius="sm" leftSection={<IconPhoto size={12} />}>
          사진 {data.totalPhotos}
        </Badge>
      </Group>
      <Stack gap="sm">
        {data.memos.map((m) => (
          <MemoRow key={m.id} memo={m} />
        ))}
      </Stack>
    </Stack>
  );
}

function MemoRow({ memo }: { memo: CropJournalOut['memos'][number] }) {
  return (
    <Card radius="md" p="sm" withBorder bg="gray.0">
      <Group justify="space-between" mb={memo.content || memo.images.length ? 6 : 0}>
        <Text fw={700} size="sm">
          {fmtDate(memo.memoDate)}
        </Text>
        {memo.images.length > 0 && (
          <Badge size="sm" variant="light" color="teal" radius="sm">
            사진 {memo.images.length}
          </Badge>
        )}
      </Group>
      {memo.content && (
        <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-line' }} lh={1.6}>
          {memo.content}
        </Text>
      )}
      {memo.images.length > 0 && (
        <SimpleGrid cols={{ base: 3, sm: 4 }} spacing={6} mt={8}>
          {memo.images.map((img) => (
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
    </Card>
  );
}

/** 키운 기간 — 수집 이력 + 표준 재배 소요일. */
function growPeriodLabel(entry: CollectionEntry, card?: HarvestCard): string {
  const parts: string[] = [];
  if (entry.lastHarvestedAt) parts.push(`최근 수확 ${fmtDate(entry.lastHarvestedAt)}`);
  const days = card?.daysToHarvest;
  if (days && days.length === 2) parts.push(`보통 ${days[0]}~${days[1]}일이면 수확`);
  return parts.join(' · ');
}

function CropCompareBlock({
  compare,
}: {
  compare: { growers: number; completionRate: number; harvested: boolean; message: string };
}) {
  const rate = Math.round(compare.completionRate * 100);
  return (
    <Card radius="md" p="sm" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
      <Group gap={8} wrap="nowrap" align="flex-start">
        <IconUsers size={18} color="var(--mantine-color-green-7)" style={{ marginTop: 2 }} />
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={600} c="green.9">
            {compare.message}
          </Text>
          <Group justify="space-between" gap={4} mt={8}>
            <Text size="xs" c="green.8">
              재배자 {compare.growers.toLocaleString()}명 · 완주율 {rate}%
            </Text>
          </Group>
          <Progress value={rate} color="green" size="sm" radius="xl" mt={4} />
        </Box>
      </Group>
    </Card>
  );
}

function RecipeRow({ name, nutrients }: { name: string; nutrients: Record<string, string> }) {
  const kcal = nutrients['에너지(kcal)'];
  const carb = nutrients['탄수화물(g)'];
  const protein = nutrients['단백질(g)'];
  const num = (v?: string) => (v ? Math.round(Number(v)) : null);
  return (
    <Card radius="md" p="sm" withBorder bg="gray.0">
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="sm" fw={600} lineClamp={1}>
          {name}
        </Text>
        <Group gap={4} wrap="nowrap">
          {kcal && (
            <Badge size="sm" variant="light" color="orange" radius="sm">
              {num(kcal)}kcal
            </Badge>
          )}
          {carb && (
            <Badge size="sm" variant="light" color="gray" radius="sm">
              탄 {num(carb)}g
            </Badge>
          )}
          {protein && (
            <Badge size="sm" variant="light" color="gray" radius="sm">
              단 {num(protein)}g
            </Badge>
          )}
        </Group>
      </Group>
    </Card>
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
