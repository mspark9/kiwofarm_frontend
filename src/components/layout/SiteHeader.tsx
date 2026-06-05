'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBook2,
  IconCalendarEvent,
  IconChevronDown,
  IconLeaf,
  IconLogin2,
  IconMenu2,
  IconMessageCircle,
  IconUserCircle,
} from '@tabler/icons-react';

type MenuLink = { label: string; href: string; icon: React.ReactNode };

const MENU_LINKS: MenuLink[] = [
  { label: '작목 추천', href: '/planting', icon: <IconLeaf size={16} /> },
  { label: '챗봇 상담', href: '/planting/chat', icon: <IconMessageCircle size={16} /> },
  { label: '재배 정보', href: '/cultivation', icon: <IconBook2 size={16} /> },
  { label: '영농 캘린더', href: '/calendar', icon: <IconCalendarEvent size={16} /> },
  { label: '작물 도감', href: '/collection', icon: <IconBook2 size={16} /> },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'saturate(180%) blur(12px)',
          WebkitBackdropFilter: 'saturate(180%) blur(12px)',
          background: scrolled ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.55)',
          borderBottom: scrolled
            ? '1px solid var(--mantine-color-gray-2)'
            : '1px solid transparent',
          transition: 'background 180ms ease, border-color 180ms ease',
        }}
      >
        <Container size="xl" py={scrolled ? 10 : 14} style={{ transition: 'padding 180ms ease' }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/">
              <Group gap={8} wrap="nowrap">
                <Box
                  w={30}
                  h={30}
                  style={{
                    borderRadius: 8,
                    background:
                      'linear-gradient(135deg, var(--mantine-color-green-5), var(--mantine-color-teal-6))',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px -6px rgba(34,139,84,0.55)',
                  }}
                >
                  <IconLeaf size={18} stroke={2.4} />
                </Box>
                <Text fw={800} fz={18} style={{ letterSpacing: -0.5 }}>
                  키워팜
                </Text>
              </Group>
            </UnstyledButton>

            <Menu
              opened={menuOpen}
              onChange={setMenuOpen}
              shadow="xl"
              width={232}
              position="bottom-end"
              offset={10}
              radius="md"
              transitionProps={{ transition: 'pop-top-right', duration: 180 }}
            >
              <Menu.Target>
                <UnstyledButton className="kw-menu-trigger" data-open={menuOpen} aria-label="메뉴">
                  <Box className="kw-menu-icon" aria-hidden>
                    <IconMenu2 size={14} stroke={2.4} />
                  </Box>
                  <Text component="span" className="kw-menu-label">
                    메뉴
                  </Text>
                  <IconChevronDown size={14} className="kw-menu-chev" stroke={2.2} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>탐색</Menu.Label>
                {MENU_LINKS.map((item) => (
                  <Menu.Item
                    key={item.label}
                    component={Link}
                    href={item.href}
                    leftSection={
                      <ThemeIcon size={22} radius="md" variant="light" color="green">
                        {item.icon}
                      </ThemeIcon>
                    }
                  >
                    {item.label}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item
                  onClick={() => setLoginOpen(true)}
                  leftSection={
                    <ThemeIcon size={22} radius="md" variant="light" color="gray">
                      <IconLogin2 size={16} />
                    </ThemeIcon>
                  }
                >
                  로그인
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </Box>

      <LoginModal opened={loginOpen} onClose={() => setLoginOpen(false)} />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .kw-feature-card {
          will-change: transform;
        }
        .kw-feature-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 18px 40px -20px rgba(34, 139, 84, 0.28),
            0 2px 6px -2px rgba(0, 0, 0, 0.06) !important;
          border-color: var(--mantine-color-green-3) !important;
        }

        .kw-menu-trigger {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 6px;
          border-radius: 999px;
          border: 1px solid var(--mantine-color-gray-2);
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: var(--mantine-color-gray-8);
          transition:
            border-color 200ms ease,
            background 200ms ease,
            box-shadow 220ms ease,
            transform 160ms ease;
        }
        .kw-menu-trigger:hover {
          border-color: var(--mantine-color-green-3);
          background: rgba(255, 255, 255, 0.95);
          box-shadow:
            0 10px 24px -14px rgba(34, 139, 84, 0.38),
            0 2px 6px -3px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }
        .kw-menu-trigger:active {
          transform: translateY(0);
        }
        .kw-menu-trigger[data-open='true'] {
          border-color: var(--mantine-color-green-5);
          background: white;
          box-shadow:
            0 12px 28px -14px rgba(34, 139, 84, 0.5),
            0 2px 6px -3px rgba(0, 0, 0, 0.08);
        }

        .kw-menu-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            var(--mantine-color-green-5),
            var(--mantine-color-teal-6)
          );
          display: grid;
          place-items: center;
          color: white;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 4px 10px -4px rgba(20, 160, 150, 0.55);
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .kw-menu-trigger:hover .kw-menu-icon {
          transform: rotate(-8deg) scale(1.04);
        }
        .kw-menu-trigger[data-open='true'] .kw-menu-icon {
          transform: rotate(90deg);
        }

        .kw-menu-label {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          line-height: 1;
        }

        .kw-menu-chev {
          color: var(--mantine-color-gray-6);
          transition:
            transform 220ms ease,
            color 200ms ease;
        }
        .kw-menu-trigger:hover .kw-menu-chev {
          color: var(--mantine-color-green-7);
        }
        .kw-menu-trigger[data-open='true'] .kw-menu-chev {
          transform: rotate(180deg);
          color: var(--mantine-color-green-7);
        }
      `}</style>
    </>
  );
}

// 베타 기간 안내 — 계정 체계 도입 전까지 기록은 브라우저(디바이스 ID)에 자동 연결된다.
function LoginModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="sm"
      radius="lg"
      withCloseButton={false}
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
    >
      <Stack gap="lg">
        <Stack gap={6} align="center">
          <ThemeIcon size={48} radius="md" color="green" variant="light">
            <IconUserCircle size={26} />
          </ThemeIcon>
          <Text fw={800} fz={22}>
            베타 기간엔 로그인 없이 써요
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            농사 계획·일지·도감·점수는 지금 쓰는 브라우저에 자동으로 연결되어
            저장됩니다. 같은 브라우저로 접속하면 기록이 그대로 이어집니다.
          </Text>
        </Stack>

        <Alert color="green" radius="md" variant="light">
          정식 출시 때 이메일·카카오 계정 연동이 제공될 예정입니다. 그때 지금
          기록을 계정으로 옮겨드릴게요.
        </Alert>

        <Button color="green" size="md" onClick={onClose}>
          확인
        </Button>
      </Stack>
    </Modal>
  );
}
