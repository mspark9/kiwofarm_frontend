"use client";

// 로그인 사용자가 홈("/")에서 보는 대시보드 히어로. 상단에 내 정보와 작물 키우기 현황
// 요약을 보여준다. 데이터는 계정별 API(키우는 작물·도감/연속기록)에서 실시간으로 읽는다.

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconAward,
  IconBook2,
  IconCalendarEvent,
  IconFlame,
  IconHelpCircle,
  IconLeaf,
  IconMapPin,
  IconPlant2,
} from "@tabler/icons-react";
import { getPlan, listPlans } from "@/lib/api/farmplan";
import { fetchRewardsSummary } from "@/lib/api/rewards";
import { getAddress } from "@/lib/auth";
import { AttendanceCard, PointsCard } from "@/components/home/RewardCards";
import type { FarmPlan } from "@/lib/types";

// 작물 뱃지는 기본 4개까지만 노출하고 나머지는 '더보기'로 펼친다.
const CROP_PREVIEW = 4;

export function DashboardHero({ username }: { username: string }) {
  const address = getAddress();
  const [showAllCrops, setShowAllCrops] = useState(false);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: listPlans,
  });
  const rewardsQuery = useQuery({
    queryKey: ["rewards-summary"],
    queryFn: fetchRewardsSummary,
  });

  const plans = plansQuery.data ?? [];

  // 뱃지의 D-day/상태용 작업 데이터. queryKey 를 캘린더(PlanView)와 동일하게 맞춰
  // 캐시를 공유한다 → 홈에서 받아두면 캘린더 진입 시 재요청이 없다.
  const planDetailQueries = useQueries({
    queries: plans.map((p) => ({
      queryKey: ["farmplan", p.id],
      queryFn: () => getPlan(p.id),
      staleTime: 30_000,
      retry: false,
    })),
  });

  // 작물 + 다음 작업 상태를 묶어 시급한 순으로 정렬(지연 → 오늘 → 임박 → 여유 →
  // 완료/대기). 정렬 후 미리보기 4개를 자르므로, 위에 노출되는 4개가 가장 급한 작물.
  const cropItems = plans
    .map((p, i) => {
      const detail = planDetailQueries[i]?.data;
      return { plan: p, info: detail ? nextTaskInfo(detail) : null };
    })
    .sort(
      (a, b) =>
        (a.info?.order ?? Number.MAX_SAFE_INTEGER) -
        (b.info?.order ?? Number.MAX_SAFE_INTEGER),
    );

  const rewards = rewardsQuery.data;
  const growing = plans.length;
  const collected = rewards?.collection.collectedCrops ?? 0;
  const streak = rewards?.streak.current ?? 0;

  return (
    <Box style={{ background: "linear-gradient(180deg, #f6fbf6 0%, #ffffff 80%)" }}>
      <Container size="xl" py={{ base: 40, md: 64 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Box>
              <Group gap={8} mb={6}>
                <ThemeIcon size={30} radius="md" variant="light" color="green">
                  <IconPlant2 size={18} />
                </ThemeIcon>
                {address && (
                  <Badge
                    variant="light"
                    color="green"
                    radius="sm"
                    leftSection={<IconMapPin size={12} />}
                  >
                    {address}
                  </Badge>
                )}
              </Group>
              <Title order={1} fz={{ base: 28, md: 40 }} fw={800} lh={1.2} style={{ letterSpacing: -1 }}>
                {username}님, 오늘도
                <br />
                텃밭 돌보러 오셨네요
              </Title>
            </Box>
            <Button
              component={Link}
              href="/planting"
              size="md"
              color="green"
              radius="md"
              rightSection={<IconArrowRight size={18} />}
            >
              작목 추천받기
            </Button>
          </Group>

          {/* 작물 키우기 현황 요약 */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <StatCard
              icon={<IconLeaf size={18} />}
              value={`${growing}종`}
              label="키우는 작물"
              loading={plansQuery.isLoading}
            />
            <StatCard
              icon={<IconBook2 size={18} />}
              value={`${collected}종`}
              label="도감 수집"
              loading={rewardsQuery.isLoading}
            />
            <StatCard
              icon={<IconFlame size={18} />}
              value={`${streak}일`}
              label="연속 기록"
              loading={rewardsQuery.isLoading}
            />
          </SimpleGrid>

          {/* 내 팜 + 출석 보상 */}
          <PointsCard points={rewards?.points} loading={rewardsQuery.isLoading} />
          <AttendanceCard attendance={rewards?.attendance} loading={rewardsQuery.isLoading} />

          {/* 키우는 작물 목록 또는 빈 상태 */}
          <Card radius="lg" p="lg" withBorder bg="white">
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={700}>내가 키우는 작물</Text>
              {growing > 0 && (
                <Button
                  component={Link}
                  href="/calendar"
                  variant="subtle"
                  color="green"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                >
                  텃밭 캘린더
                </Button>
              )}
            </Group>
            {growing > 0 ? (
              <Group gap={8}>
                {(showAllCrops ? cropItems : cropItems.slice(0, CROP_PREVIEW)).map(
                  ({ plan: p, info }) => {
                    const color = info?.color ?? "green";
                    return (
                      <Group
                        key={p.id}
                        gap={2}
                        wrap="nowrap"
                        h={32}
                        style={{
                          backgroundColor: `var(--mantine-color-${color}-light)`,
                          color: `var(--mantine-color-${color}-light-color)`,
                          borderRadius: "var(--mantine-radius-sm)",
                          paddingInline: 10,
                        }}
                      >
                        <Box
                          component={Link}
                          href="/calendar"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            height: "100%",
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          <IconLeaf size={13} />
                          <Text fz="sm" fw={600} lh={1}>
                            {p.cropName}
                          </Text>
                          {info && (
                            <Text fz="sm" fw={700} lh={1}>
                              {info.label}
                            </Text>
                          )}
                        </Box>
                        {info?.task && (
                          <Popover width={220} position="top" withArrow shadow="md">
                            <Popover.Target>
                              <ActionIcon
                                variant="transparent"
                                size="xs"
                                aria-label={`${p.cropName} 다음 작업 보기`}
                                style={{ color: "inherit" }}
                              >
                                <IconHelpCircle size={15} />
                              </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown>
                              <Text size="xs" c="dimmed" mb={2}>
                                다음 작업
                              </Text>
                              <Text size="sm" fw={600}>
                                {info.task}
                              </Text>
                            </Popover.Dropdown>
                          </Popover>
                        )}
                      </Group>
                    );
                  },
                )}
                {growing > CROP_PREVIEW && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    radius="sm"
                    onClick={() => setShowAllCrops((v) => !v)}
                  >
                    {showAllCrops ? "접기" : `+${growing - CROP_PREVIEW} 더보기`}
                  </Button>
                )}
              </Group>
            ) : (
              <Stack gap="sm" align="flex-start">
                <Text c="dimmed" size="sm">
                  아직 키우는 작물이 없어요. 지금 조건을 입력하면 AI가 심기 좋은 작목을 골라드려요.
                </Text>
                <Button
                  component={Link}
                  href="/planting"
                  size="sm"
                  color="green"
                  radius="md"
                  rightSection={<IconArrowRight size={16} />}
                >
                  지금 추천받기
                </Button>
              </Stack>
            )}
          </Card>

          {/* 빠른 이동 */}
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
            <QuickLink
              href="/planting"
              icon={<IconLeaf size={20} />}
              title="작목 추천"
              desc="지금 심기 좋은 작목 찾기"
            />
            <QuickLink
              href="/calendar"
              icon={<IconCalendarEvent size={20} />}
              title="텃밭 캘린더"
              desc="작업 일정 챙기기"
            />
            <QuickLink
              href="/collection"
              icon={<IconBook2 size={20} />}
              title="작물 도감"
              desc="수확 인증 모으기"
            />
            <QuickLink
              href="/badges"
              icon={<IconAward size={20} />}
              title="뱃지 도감"
              desc="업적 달성하고 팜 받기"
            />
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

// 뱃지에 표시할 다음 작업 상태. 미완료(planned/delayed) 작업 중 가장 이른 것을
// 오늘과 비교해 D-day 와 색을 만든다. 색은 시급도 신호: 지연=빨강, 오늘=주황,
// 임박(D-3 이내)=주황, 그 외=초록, 수확 완료/대기=회색.
// order: 정렬 키(작을수록 시급). 다음 작업까지 남은 일수를 그대로 쓴다 → 지연
// (음수)이 가장 앞, 그다음 오늘(0)·임박·여유 순. 완료/대기는 맨 뒤로 보낸다.
function nextTaskInfo(
  plan: FarmPlan,
): { label: string; color: string; order: number; task?: string } {
  const IDLE = Number.MAX_SAFE_INTEGER;
  if (plan.harvested) return { label: "수확 완료", color: "gray", order: IDLE };

  const pending = plan.tasks
    .filter((t) => t.status !== "done" && t.status !== "skipped")
    .sort((a, b) => a.date.localeCompare(b.date));
  if (pending.length === 0) return { label: "대기", color: "gray", order: IDLE };

  const next = pending[0];
  const diff = dayjs(next.date).startOf("day").diff(dayjs().startOf("day"), "day");
  const base = { task: next.title, order: diff };
  if (diff < 0) return { ...base, label: `${-diff}일 지남`, color: "red" };
  if (diff === 0) return { ...base, label: "오늘", color: "orange" };
  if (diff <= 3) return { ...base, label: `D-${diff}`, color: "orange" };
  return { ...base, label: `D-${diff}`, color: "green" };
}

function StatCard({
  icon,
  value,
  label,
  loading,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Group gap="sm" align="center">
        <ThemeIcon size={40} radius="md" variant="light" color="green">
          {icon}
        </ThemeIcon>
        <Box>
          <Text fz={26} fw={800} lh={1.1}>
            {loading ? "—" : value}
          </Text>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card
      component={Link}
      href={href}
      radius="lg"
      p="lg"
      withBorder
      className="kw-feature-card"
      style={{ background: "white", textDecoration: "none", color: "inherit" }}
    >
      <Group gap="sm" align="center">
        <ThemeIcon size={44} radius="md" variant="light" color="green">
          {icon}
        </ThemeIcon>
        <Box>
          <Text fw={700}>{title}</Text>
          <Text size="xs" c="dimmed">
            {desc}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}
