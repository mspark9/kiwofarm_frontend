import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Card,
  Container,
  Grid,
  GridCol,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconCalendarEvent,
  IconChartLine,
  IconLeaf,
  IconTruck,
} from '@tabler/icons-react';

type Tile = {
  title: string;
  desc: string;
  href: string;
  icon: ReactNode;
  color: 'green' | 'teal' | 'lime' | 'orange';
  meta: string;
};

const TILES: Tile[] = [
  {
    title: 'AI 작목 추천',
    desc: '지역·자본·시설로 적합 작목 TOP 3 가려내기',
    href: '/onboarding',
    icon: <IconLeaf size={22} />,
    color: 'green',
    meta: 'XGBoost · 우수농가 112호',
  },
  {
    title: '디지털 트윈',
    desc: '1년 매출·노동·위기 시점 시뮬레이션',
    href: '/twin/tomato',
    icon: <IconChartLine size={22} />,
    color: 'teal',
    meta: '결정론적 시뮬 · 12개월',
  },
  {
    title: '출하 도우미',
    desc: '14일 가격 예측 + 별점 + 우수농가 패턴',
    href: '/shipping',
    icon: <IconTruck size={22} />,
    color: 'orange',
    meta: 'Prophet · KAMIS 도매가',
  },
  {
    title: '영농 캘린더',
    desc: '월별 농작업·병해충 알림',
    href: '/calendar',
    icon: <IconCalendarEvent size={22} />,
    color: 'lime',
    meta: '농사로 데이터',
  },
];

export default function DashboardPage() {
  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="xl">
        <Stack gap="lg">
          <Box>
            <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              내 키워팜
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }} fw={800} lh={1.2} mt={4}>
              오늘의{' '}
              <Text span inherit c="green.7">
                영농 의사결정
              </Text>{' '}
              한눈에 보기
            </Title>
            <Text c="dimmed" size="sm" mt={6}>
              4개 기능 어디에서든 이어서 작업할 수 있어요.
            </Text>
          </Box>

          <Grid gutter="lg">
            {TILES.map((tile) => (
              <GridCol key={tile.href} span={{ base: 12, sm: 6, md: 3 }}>
                <TileCard tile={tile} />
              </GridCol>
            ))}
          </Grid>

          <Card radius="lg" p="lg" withBorder bg="white">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Box>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                  최근 추천 결과
                </Text>
                <Title order={5} mt={4}>
                  방울토마토 · 옥천 · 적합도 94%
                </Title>
                <Text size="sm" c="gray.7" mt={4}>
                  예상 연 매출 ₩4,260만원 · 순이익 ₩2,180만원
                </Text>
              </Box>
              <Anchor
                component={Link}
                href="/twin/tomato"
                c="green.7"
                fw={700}
                size="sm"
                underline="never"
              >
                <Group gap={6} wrap="nowrap">
                  1년 시뮬레이션 이어보기
                  <IconArrowUpRight size={16} />
                </Group>
              </Anchor>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <Card
      component={Link}
      href={tile.href}
      radius="lg"
      p="lg"
      withBorder
      h="100%"
      className="kw-feature-card"
      style={{
        background: 'white',
        borderColor: 'var(--mantine-color-gray-2)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
      }}
    >
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start">
          <ThemeIcon size={44} radius="md" variant="light" color={tile.color}>
            {tile.icon}
          </ThemeIcon>
          <IconArrowUpRight size={16} color="var(--mantine-color-gray-5)" />
        </Group>
        <Box>
          <Title order={5} fz={17} mb={6}>
            {tile.title}
          </Title>
          <Text size="sm" c="dimmed" lh={1.6}>
            {tile.desc}
          </Text>
        </Box>
        <Badge variant="light" color={tile.color} radius="sm" size="sm" mt="auto" style={{ alignSelf: 'flex-start' }}>
          {tile.meta}
        </Badge>
      </Stack>
    </Card>
  );
}
