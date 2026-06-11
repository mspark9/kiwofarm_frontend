"use client";

// 뱃지 도감 — 난이도별 그리드. 뱃지를 누르면 팝업이 열리고, 달성한 뱃지는 거기서
// 직접 '획득'(claim)해 팜을 받는다. 미획득·획득가능·획득완료 3상태로 표시.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { IconArrowLeft, IconAward } from "@tabler/icons-react";
import { claimBadge, fetchBadges } from "@/lib/api/rewards";
import type { BadgeOut } from "@/lib/types";

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "입문",
  2: "쉬움",
  3: "보통",
  4: "도전",
  5: "전설",
};
const DIFFICULTY_COLOR: Record<number, string> = {
  1: "teal",
  2: "green",
  3: "lime",
  4: "orange",
  5: "grape",
};

export default function BadgesPage() {
  const qc = useQueryClient();
  const badgesQuery = useQuery({ queryKey: ["rewards", "badges"], queryFn: fetchBadges });
  const badges = useMemo(() => badgesQuery.data ?? [], [badgesQuery.data]);
  const [selected, setSelected] = useState<BadgeOut | null>(null);

  const claimedCount = badges.filter((b) => b.claimed).length;
  const claimableCount = badges.filter((b) => b.claimable).length;
  const earnedFarm = badges
    .filter((b) => b.claimed)
    .reduce((s, b) => s + b.rewardFarm, 0);

  const claim = useMutation({
    mutationFn: (id: string) => claimBadge(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["rewards", "badges"] });
      qc.invalidateQueries({ queryKey: ["rewards-summary"] });
      qc.invalidateQueries({ queryKey: ["rewards", "summary"] });
      qc.invalidateQueries({ queryKey: ["community", "wallet"] });
      notifications.show({
        color: "green",
        message: `${res.name} 획득! +${res.rewardFarm}팜 (누적 ${res.total.toLocaleString()}팜)`,
      });
      setSelected(null);
    },
    onError: (e) => {
      notifications.show({
        color: "red",
        message:
          isAxiosError(e) && typeof e.response?.data?.detail === "string"
            ? e.response.data.detail
            : "획득에 실패했어요.",
      });
    },
  });

  const groups = useMemo(
    () =>
      [1, 2, 3, 4, 5]
        .map((d) => ({ d, items: badges.filter((b) => b.difficulty === d) }))
        .filter((g) => g.items.length > 0),
    [badges],
  );

  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="md">
        <Stack gap="lg">
          <Box>
            <Box
              component={Link}
              href="/home"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Group gap={6} mb={10}>
                <IconArrowLeft size={14} />
                <Text size="sm" c="dimmed">
                  홈으로
                </Text>
              </Group>
            </Box>
            <Group gap={10} align="center">
              <ThemeIcon size={34} radius="md" variant="light" color="orange">
                <IconAward size={20} />
              </ThemeIcon>
              <Title order={2} fz={{ base: 24, md: 30 }} fw={800}>
                뱃지 도감
              </Title>
            </Group>
            {badgesQuery.isLoading ? (
              <Skeleton height={18} width={240} mt={8} />
            ) : (
              <Text c="dimmed" size="sm" mt={6}>
                획득 {claimedCount}/{badges.length} · 모은 팜 {earnedFarm.toLocaleString()}팜
                {claimableCount > 0 ? ` · 받을 수 있는 뱃지 ${claimableCount}개` : ""}
              </Text>
            )}
          </Box>

          {badgesQuery.isLoading ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={110} radius="lg" />
              ))}
            </SimpleGrid>
          ) : (
            groups.map((g) => (
              <Stack key={g.d} gap="xs">
                <Group gap={8}>
                  <Text fw={700} size="sm">
                    난이도 · {DIFFICULTY_LABEL[g.d]}
                  </Text>
                  <DiffDots difficulty={g.d} />
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {g.items.map((b) => (
                    <BadgeCard key={b.id} badge={b} onOpen={() => setSelected(b)} />
                  ))}
                </SimpleGrid>
              </Stack>
            ))
          )}
        </Stack>
      </Container>

      <BadgeModal
        badge={selected}
        onClose={() => setSelected(null)}
        onClaim={(id) => claim.mutate(id)}
        claiming={claim.isPending}
      />
    </Box>
  );
}

function DiffDots({ difficulty }: { difficulty: number }) {
  const color = DIFFICULTY_COLOR[difficulty] ?? "gray";
  return (
    <Group gap={3}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          w={7}
          h={7}
          style={{
            borderRadius: "50%",
            background:
              i <= difficulty
                ? `var(--mantine-color-${color}-5)`
                : "var(--mantine-color-gray-3)",
          }}
        />
      ))}
    </Group>
  );
}

function BadgeCard({ badge, onOpen }: { badge: BadgeOut; onOpen: () => void }) {
  const color = DIFFICULTY_COLOR[badge.difficulty] ?? "gray";
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      bg="white"
      onClick={onOpen}
      className="kw-feature-card"
      style={{
        cursor: "pointer",
        opacity: badge.achieved ? 1 : 0.78,
        borderColor: badge.claimable
          ? "var(--mantine-color-orange-4)"
          : undefined,
        boxShadow: badge.claimable
          ? "0 0 0 2px var(--mantine-color-orange-2)"
          : undefined,
      }}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        <Text
          fz={36}
          lh={1}
          style={{ filter: badge.achieved ? "none" : "grayscale(1)" }}
        >
          {badge.emoji}
        </Text>
        <Box style={{ flex: 1 }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text fw={700}>{badge.name}</Text>
            <Text
              size="xs"
              fw={700}
              c={
                badge.claimed
                  ? `${color}.7`
                  : badge.claimable
                    ? "orange.7"
                    : "dimmed"
              }
            >
              {badge.claimed
                ? "획득 완료 ✓"
                : badge.claimable
                  ? `획득 가능 +${badge.rewardFarm}팜`
                  : `+${badge.rewardFarm}팜`}
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mt={2} lh={1.4}>
            {badge.description}
          </Text>
          {badge.achieved ? (
            <Text
              size="xs"
              c={badge.claimable ? "orange.7" : `${color}.7`}
              mt={8}
              fw={600}
            >
              {badge.claimable ? "눌러서 팜 받기" : `+${badge.rewardFarm}팜 획득 완료`}
            </Text>
          ) : (
            <Box mt={8}>
              <Progress value={badge.progress * 100} color={color} size="sm" radius="xl" />
              <Text size="xs" c="dimmed" mt={4}>
                {badge.current.toLocaleString()} / {badge.threshold.toLocaleString()}
              </Text>
            </Box>
          )}
        </Box>
      </Group>
    </Card>
  );
}

function BadgeModal({
  badge,
  onClose,
  onClaim,
  claiming,
}: {
  badge: BadgeOut | null;
  onClose: () => void;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const color = badge ? (DIFFICULTY_COLOR[badge.difficulty] ?? "gray") : "gray";
  return (
    <Modal
      opened={!!badge}
      onClose={onClose}
      centered
      radius="lg"
      size="sm"
      padding="xl"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
    >
      {badge && (
        <Stack gap="md" align="center">
          <Text
            fz={64}
            lh={1}
            style={{ filter: badge.achieved ? "none" : "grayscale(1)" }}
          >
            {badge.emoji}
          </Text>
          <Stack gap={6} align="center">
            <Text fw={800} fz={20}>
              {badge.name}
            </Text>
            <DiffDots difficulty={badge.difficulty} />
            <Text size="sm" c="dimmed" ta="center" lh={1.5}>
              {badge.description}
            </Text>
          </Stack>

          {!badge.achieved && (
            <Box w="100%">
              <Progress value={badge.progress * 100} color={color} size="md" radius="xl" />
              <Text size="xs" c="dimmed" mt={6} ta="center">
                {badge.current.toLocaleString()} / {badge.threshold.toLocaleString()} ·
                조금 더 달성하면 +{badge.rewardFarm}팜을 받을 수 있어요
              </Text>
            </Box>
          )}

          {badge.claimable && (
            <Button
              fullWidth
              color="orange"
              size="md"
              radius="md"
              loading={claiming}
              leftSection={<IconAward size={18} />}
              onClick={() => onClaim(badge.id)}
            >
              획득하기 (+{badge.rewardFarm}팜)
            </Button>
          )}

          {badge.claimed && (
            <Text c={`${color}.7`} fw={700}>
              ✓ 획득 완료 · +{badge.rewardFarm}팜
            </Text>
          )}
        </Stack>
      )}
    </Modal>
  );
}
