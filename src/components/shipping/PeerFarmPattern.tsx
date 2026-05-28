import { Box, Card, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import type { PeerFarmStat } from '@/lib/types';

interface Props {
  peer: PeerFarmStat;
}

export function PeerFarmPattern({ peer }: Props) {
  const pct = Math.round((peer.farms_aligned / peer.total_farms) * 100);

  return (
    <Card radius="lg" p="xl" withBorder shadow="sm" h="100%">
      <Stack gap="lg" justify="space-between" h="100%">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
              우수농가 패턴
            </Text>
            <Title order={3}>{peer.region} 우수농가</Title>
          </Box>
          <IconUsersGroup size={22} stroke={1.5} color="var(--mantine-color-green-6)" />
        </Group>

        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            {peer.total_farms}곳 중
          </Text>
          <Group align="baseline" gap={6}>
            <Text fz={64} fw={800} c="green.7" lh={1}>
              {peer.farms_aligned}
            </Text>
            <Text size="lg" c="dimmed">
              곳
            </Text>
          </Group>
          <Text size="sm" mt={6} fw={500}>
            동일 시점 출하 선택
          </Text>
        </Box>

        <Box>
          <Progress value={pct} color="green" size="md" radius="xl" />
          <Group justify="space-between" mt={8}>
            <Text size="xs" fw={600} c="green.7">
              {pct}%
            </Text>
            <Text size="xs" c="dimmed">
              {peer.note}
            </Text>
          </Group>
        </Box>
      </Stack>
    </Card>
  );
}
