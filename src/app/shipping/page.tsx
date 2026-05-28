'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { fetchShippingDashboard } from '@/lib/api/shipping';
import { ShippingScoreCard } from '@/components/shipping/ShippingScoreCard';
import { PriceForecast } from '@/components/shipping/PriceForecast';
import { PeerFarmPattern } from '@/components/shipping/PeerFarmPattern';

const CROP_OPTIONS = [
  { value: 'tomato', label: '토마토' },
  { value: 'sweetpotato', label: '고구마' },
  { value: 'blueberry', label: '블루베리' },
];

const REGION_OPTIONS = [
  { value: '옥천', label: '옥천' },
  { value: '청양', label: '청양' },
  { value: '나주', label: '나주' },
];

export default function ShippingPage() {
  const [crop, setCrop] = useState('tomato');
  const [region, setRegion] = useState('옥천');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shipping', crop, region],
    queryFn: () => fetchShippingDashboard(crop, region),
  });

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="xl">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: 0.6 }}>
                출하 도우미
              </Text>
              <Title order={2}>
                {data?.crop_name ?? '토마토'} · {data?.region ?? '옥천'}
              </Title>
            </Box>
            <Group gap="sm">
              <Select
                data={CROP_OPTIONS}
                value={crop}
                onChange={(v) => v && setCrop(v)}
                w={140}
                radius="md"
                allowDeselect={false}
              />
              <Select
                data={REGION_OPTIONS}
                value={region}
                onChange={(v) => v && setRegion(v)}
                w={140}
                radius="md"
                allowDeselect={false}
              />
            </Group>
          </Group>

          <Box pos="relative" mih={400}>
            <LoadingOverlay
              visible={isLoading}
              zIndex={10}
              overlayProps={{ blur: 2, color: 'gray.0' }}
            />
            {isError && (
              <Text c="red" ta="center" py="xl">
                데이터를 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.
              </Text>
            )}
            {data && (
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <ShippingScoreCard decision={data.decision} updatedAt={data.updated_at} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <PeerFarmPattern peer={data.peer} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <PriceForecast series={data.price_series} cropName={data.crop_name} />
                </Grid.Col>
              </Grid>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
