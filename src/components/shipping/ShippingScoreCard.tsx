import { Badge, Box, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowUpRight, IconCalendar } from '@tabler/icons-react';
import type { ShippingDecision } from '@/lib/types';

interface Props {
  decision: ShippingDecision;
  updatedAt: string;
}

function Stars({ value, size = 22 }: { value: number; size?: number }) {
  return (
    <Group gap={2}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} fz={size} c={i <= value ? 'yellow.6' : 'gray.3'} lh={1} fw={700}>
          ★
        </Text>
      ))}
    </Group>
  );
}

export function ShippingScoreCard({ decision, updatedAt }: Props) {
  const isFutureBetter = decision.score_in_3d > decision.score_today;

  return (
    <Card radius="lg" p="xl" withBorder shadow="sm" h="100%">
      <Stack gap="xl" justify="space-between" h="100%">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
              AI 출하 추천
            </Text>
            <Title order={3}>{decision.recommendation}</Title>
          </Box>
          <Badge
            color={isFutureBetter ? 'teal' : 'gray'}
            variant="light"
            size="lg"
            radius="sm"
            leftSection={isFutureBetter ? <IconArrowUpRight size={14} /> : null}
          >
            {isFutureBetter ? `+${decision.delta_pct.toFixed(1)}%` : '오늘 적정'}
          </Badge>
        </Group>

        <Group gap="xl" wrap="nowrap" align="center">
          <Stack gap={6} flex={1}>
            <Text size="xs" c="dimmed" fw={500}>
              오늘
            </Text>
            <Stars value={decision.score_today} />
            <Group gap={4} align="baseline" mt={4}>
              <Text fz={28} fw={700} lh={1}>
                ₩{decision.price_today.toLocaleString()}
              </Text>
              <Text size="sm" c="dimmed">
                /kg
              </Text>
            </Group>
          </Stack>

          <ThemeIcon size={56} radius="xl" variant="light" color="teal">
            <IconArrowUpRight size={32} stroke={2} />
          </ThemeIcon>

          <Stack gap={6} flex={1}>
            <Text size="xs" c="teal.7" fw={600}>
              3일 후 예측
            </Text>
            <Stars value={decision.score_in_3d} />
            <Group gap={4} align="baseline" mt={4}>
              <Text fz={28} fw={700} c="teal.7" lh={1}>
                ₩{decision.price_in_3d.toLocaleString()}
              </Text>
              <Text size="sm" c="dimmed">
                /kg
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group gap={6}>
          <IconCalendar size={14} stroke={1.5} color="var(--mantine-color-gray-5)" />
          <Text size="xs" c="dimmed">
            업데이트 {updatedAt}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
