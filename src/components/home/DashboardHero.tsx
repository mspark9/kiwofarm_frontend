"use client";

// 로그인 사용자가 홈("/")에서 보는 대시보드 히어로. 상단에 내 정보와 작물 키우기 현황
// 요약을 보여준다. 데이터는 계정별 API(키우는 작물·도감/연속기록)에서 실시간으로 읽는다.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBook2,
  IconCalendarEvent,
  IconFlame,
  IconLeaf,
  IconMapPin,
  IconPlant2,
} from "@tabler/icons-react";
import { listPlans } from "@/lib/api/farmplan";
import { fetchRewardsSummary } from "@/lib/api/rewards";
import { getAddress } from "@/lib/auth";

export function DashboardHero({ username }: { username: string }) {
  const address = getAddress();

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: listPlans,
  });
  const rewardsQuery = useQuery({
    queryKey: ["rewards-summary"],
    queryFn: fetchRewardsSummary,
  });

  const plans = plansQuery.data ?? [];
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
                {plans.map((p) => (
                  <Badge
                    key={p.id}
                    component={Link}
                    href="/calendar"
                    size="lg"
                    variant="light"
                    color="green"
                    radius="sm"
                    style={{ cursor: "pointer" }}
                    leftSection={<IconLeaf size={12} />}
                  >
                    {p.cropName}
                  </Badge>
                ))}
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
          <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
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
              desc="수확 인증·뱃지 모으기"
            />
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
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
