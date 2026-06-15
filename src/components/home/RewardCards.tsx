'use client';

// 로그인 후 홈(/home)에서 보여주는 보상 카드 — 내 팜(누적 보유) + 출석 보상(연속 20일).
// 데이터는 rewards/summary 에서 읽고, 출석 적립 시 관련 쿼리를 무효화한다.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendarCheck, IconFlame } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import { checkInAttendance } from '@/lib/api/rewards';
import type { AttendanceOut, PointsOut, RewardsSummary } from '@/lib/types';

/** 출석 보상 — 이번 달 누적 20일 목표(주 보상) + 연속 마일스톤 + 오늘 출석 버튼. */
export function AttendanceCard({
  attendance,
  loading,
}: {
  attendance?: AttendanceOut;
  loading: boolean;
}) {
  const qc = useQueryClient();
  const claim = useMutation({
    mutationFn: checkInAttendance,
    onSuccess: (res) => {
      // check-in 응답으로 홈 summary 캐시를 즉시 패치 — 무거운 /rewards/summary
      // 전체 재요청을 기다리지 않고 카드를 바로 갱신한다.
      qc.setQueryData<RewardsSummary>(['rewards-summary'], (old) =>
        old
          ? {
              ...old,
              attendance: {
                ...old.attendance,
                checkedToday: true,
                streak: res.streak,
                monthDays: res.monthDays,
                monthAchieved:
                  old.attendance.monthAchieved ||
                  res.monthDays >= old.attendance.monthTarget,
                total: res.total,
              },
              points: { ...old.points, total: res.total },
            }
          : old,
      );
      // 지갑·도감 캐시는 다음 진입 때 갱신(백그라운드, 카드 표시를 막지 않음).
      qc.invalidateQueries({ queryKey: ['community', 'wallet'] });
      qc.invalidateQueries({ queryKey: ['rewards', 'summary'] });
      const bonusMsg =
        res.bonusReward > 0
          ? ` · 보너스 +${res.bonusReward}팜 (${res.bonuses.map((b) => b.label).join(', ')})`
          : '';
      notifications.show({
        color: 'green',
        message: `출석 완료 · +${res.reward}팜${bonusMsg} (누적 ${res.total.toLocaleString()}팜)`,
      });
    },
    onError: (e) => {
      const detail =
        isAxiosError(e) && typeof e.response?.data?.detail === 'string'
          ? e.response.data.detail
          : '출석에 실패했어요.';
      notifications.show({ color: 'orange', message: detail });
    },
  });

  const monthPct = attendance
    ? Math.min(100, (attendance.monthDays / attendance.monthTarget) * 100)
    : 0;

  return (
    <Card radius="lg" p="lg" withBorder bg="white">
      <Group justify="space-between" align="center" mb={4}>
        <Group gap={6}>
          <ThemeIcon variant="light" color="orange" radius="md" size="sm">
            <IconCalendarCheck size={14} />
          </ThemeIcon>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
            출석 보상
          </Text>
        </Group>
        {attendance && attendance.streak > 0 && (
          <Badge variant="light" color="orange" radius="sm" leftSection={<IconFlame size={11} />}>
            {attendance.streak}일 연속
          </Badge>
        )}
      </Group>

      {loading || !attendance ? (
        <Skeleton height={150} mt={8} />
      ) : (
        <>
          {/* 이번 달 누적 출석(주 보상) */}
          <Group justify="space-between" mt={10} mb={4}>
            <Text size="sm" fw={700}>
              이번 달 출석
            </Text>
            <Text size="sm" fw={700} c={attendance.monthAchieved ? 'green.7' : 'orange.7'}>
              {attendance.monthDays} / {attendance.monthTarget}일
            </Text>
          </Group>
          <Progress
            value={monthPct}
            color={attendance.monthAchieved ? 'green' : 'orange'}
            radius="xl"
            size="md"
          />
          <Text size="xs" c="dimmed" mt={4}>
            {attendance.monthAchieved
              ? `이번 달 ${attendance.monthTarget}일 출석 달성 · +${attendance.monthBonus}팜 보너스`
              : `${attendance.monthTarget}일 채우면 +${attendance.monthBonus}팜 보너스`}
          </Text>

          {/* 연속 출석 마일스톤(별도 보상) */}
          <SimpleGrid cols={3} spacing={6} mt={12}>
            {attendance.milestones.map((m) => (
              <Box
                key={m.days}
                ta="center"
                py={6}
                style={{
                  borderRadius: 8,
                  border: `1px solid ${
                    m.reached
                      ? 'var(--mantine-color-green-3)'
                      : 'var(--mantine-color-gray-2)'
                  }`,
                  background: m.reached
                    ? 'var(--mantine-color-green-0)'
                    : 'white',
                }}
              >
                <Text fz={10} c="dimmed" fw={600}>
                  {m.days}일 연속
                </Text>
                <Text size="xs" fw={800} c={m.reached ? 'green.7' : 'orange.7'}>
                  {m.reached ? '✓' : `+${m.reward}`}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Button
            mt="md"
            fullWidth
            color="orange"
            radius="md"
            leftSection={<IconCalendarCheck size={16} />}
            disabled={attendance.checkedToday}
            loading={claim.isPending}
            onClick={() => claim.mutate()}
          >
            {attendance.checkedToday
              ? '오늘 출석 완료'
              : `오늘 출석하고 ${attendance.dailyReward}팜 받기`}
          </Button>
        </>
      )}
    </Card>
  );
}

/** 팜 — 총 보유량 + 메모·사진·수확 분해. */
export function PointsCard({ points, loading }: { points?: PointsOut; loading: boolean }) {
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
        내 팜
      </Text>
      {loading || !points ? (
        <Skeleton height={120} mt={8} />
      ) : (
        <>
          <Title order={2} c="white" mt={4}>
            {points.total.toLocaleString()}
            <Text span c="green.0" fz="md" fw={600}>
              {' '}
              팜
            </Text>
          </Title>
          <SimpleGrid cols={3} spacing="xs" mt="md">
            <PointStat label="메모" value={points.memoCount} />
            <PointStat label="사진" value={points.photoCount} />
            <PointStat label="수확 인증" value={points.harvestCount} />
          </SimpleGrid>
          <Text size="xs" c="green.0" mt="md" style={{ opacity: 0.85 }}>
            기록을 남길수록 팜이 쌓여요
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
