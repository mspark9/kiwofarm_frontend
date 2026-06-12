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
  SimpleGrid,
  Skeleton,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendarCheck } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import { checkInAttendance } from '@/lib/api/rewards';
import type { AttendanceOut, PointsOut, RewardsSummary } from '@/lib/types';

/** 출석 보상 — 연속 20일 사이클 그리드 + 오늘 출석 버튼. */
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
                cycleDay: res.cycleDay,
                total: res.total,
              },
              points: { ...old.points, total: res.total },
            }
          : old,
      );
      // 지갑·도감 캐시는 다음 진입 때 갱신(백그라운드, 카드 표시를 막지 않음).
      qc.invalidateQueries({ queryKey: ['community', 'wallet'] });
      qc.invalidateQueries({ queryKey: ['rewards', 'summary'] });
      notifications.show({
        color: 'green',
        message: `${res.cycleDay}일차 출석 · +${res.reward}팜 (누적 ${res.total.toLocaleString()}팜)`,
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
        {attendance && (
          <Badge variant="light" color="orange" radius="sm">
            {attendance.streak}일 연속
          </Badge>
        )}
      </Group>

      {loading || !attendance ? (
        <Skeleton height={150} mt={8} />
      ) : (
        <>
          <SimpleGrid cols={5} spacing={6} mt={8}>
            {attendance.rewards.map((reward, i) => {
              const day = i + 1;
              const completed = attendance.checkedToday
                ? attendance.cycleDay
                : attendance.cycleDay - 1;
              const done = day <= completed;
              const isToday = day === attendance.cycleDay && !attendance.checkedToday;
              const milestone = reward !== 10;
              return (
                <Box
                  key={day}
                  ta="center"
                  py={6}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${
                      isToday
                        ? 'var(--mantine-color-orange-5)'
                        : 'var(--mantine-color-gray-2)'
                    }`,
                    background: done
                      ? 'var(--mantine-color-green-0)'
                      : milestone
                        ? 'var(--mantine-color-orange-0)'
                        : 'white',
                    opacity: done ? 0.6 : 1,
                  }}
                >
                  <Text fz={9} c="dimmed" fw={600}>
                    {day}일
                  </Text>
                  <Text
                    size="xs"
                    fw={milestone ? 800 : 600}
                    c={done ? 'green.7' : milestone ? 'orange.7' : 'gray.7'}
                  >
                    {done ? '✓' : reward}
                  </Text>
                </Box>
              );
            })}
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
              : `오늘 출석하고 ${attendance.todayReward}팜 받기`}
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
