"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Group,
  Menu,
  Modal,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAuthModal } from "@/components/auth/AuthProvider";
import {
  IconBook2,
  IconCalendarEvent,
  IconChevronDown,
  IconLeaf,
  IconLogin2,
  IconMenu2,
  IconMessageCircle,
  IconUserCircle,
  IconUsersGroup,
} from "@tabler/icons-react";

type MenuLink = { label: string; href: string; icon: React.ReactNode };

const MENU_LINKS: MenuLink[] = [
  { label: "작목 추천", href: "/planting", icon: <IconLeaf size={16} /> },
  {
    label: "챗봇 상담",
    href: "/planting/chat",
    icon: <IconMessageCircle size={16} />,
  },
  { label: "재배 정보", href: "/cultivation", icon: <IconBook2 size={16} /> },
  {
    label: "텃밭 캘린더",
    href: "/calendar",
    icon: <IconCalendarEvent size={16} />,
  },
  { label: "작물 도감", href: "/collection", icon: <IconBook2 size={16} /> },
  {
    label: "커뮤니티",
    href: "/community",
    icon: <IconUsersGroup size={16} />,
  },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { username, openLogin, openProfile, logout } = useAuthModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          background: scrolled
            ? "rgba(255,255,255,0.78)"
            : "rgba(255,255,255,0.55)",
          borderBottom: scrolled
            ? "1px solid var(--mantine-color-gray-2)"
            : "1px solid transparent",
          transition: "background 180ms ease, border-color 180ms ease",
        }}
      >
        <Container
          size="xl"
          py={scrolled ? 10 : 14}
          style={{ transition: "padding 180ms ease" }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/">
              <Group gap={8} wrap="nowrap">
                {/* 자체 그라데이션·라운드를 가진 앱 아이콘 SVG(투명 배경) — 정적이라 일반 img.
                    별도 box-shadow/border-radius 를 주면 투명 여백이 흰 타일처럼 보여 제거. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/app-icon.svg"
                  alt="키워팜"
                  width={40}
                  height={40}
                  style={{ display: "block" }}
                />
                <Text fw={800} fz={18} style={{ letterSpacing: -0.5 }}>
                  키워팜
                </Text>
              </Group>
            </UnstyledButton>

            <Group gap="sm" wrap="nowrap">
              <Tooltip
                label="챗봇 상담"
                position="bottom"
                withArrow
                openDelay={300}
              >
                <UnstyledButton
                  className="kw-chat-fab"
                  onClick={() => (username ? setChatOpen(true) : openLogin())}
                  aria-label="챗봇 상담 열기"
                >
                  <IconMessageCircle size={18} stroke={2.4} />
                </UnstyledButton>
              </Tooltip>

              <Menu
                opened={menuOpen}
                onChange={setMenuOpen}
                shadow="xl"
                width={232}
                position="bottom-end"
                offset={10}
                radius="md"
                transitionProps={{ transition: "pop-top-right", duration: 180 }}
              >
                <Menu.Target>
                  <UnstyledButton
                    className="kw-menu-trigger"
                    data-open={menuOpen}
                    aria-label="메뉴"
                  >
                    <Box className="kw-menu-icon" aria-hidden>
                      <IconMenu2 size={14} stroke={2.4} />
                    </Box>
                    <Text component="span" className="kw-menu-label">
                      메뉴
                    </Text>
                    <IconChevronDown
                      size={14}
                      className="kw-menu-chev"
                      stroke={2.2}
                    />
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
                        <ThemeIcon
                          size={22}
                          radius="md"
                          variant="light"
                          color="green"
                        >
                          {item.icon}
                        </ThemeIcon>
                      }
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                  {username ? (
                    <>
                      <Menu.Label>{username} 님</Menu.Label>
                      <Menu.Item
                        onClick={openProfile}
                        leftSection={
                          <ThemeIcon
                            size={22}
                            radius="md"
                            variant="light"
                            color="green"
                          >
                            <IconUserCircle size={16} />
                          </ThemeIcon>
                        }
                      >
                        내 정보 수정
                      </Menu.Item>
                      <Menu.Item
                        onClick={logout}
                        leftSection={
                          <ThemeIcon
                            size={22}
                            radius="md"
                            variant="light"
                            color="gray"
                          >
                            <IconLogin2 size={16} />
                          </ThemeIcon>
                        }
                      >
                        로그아웃
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item
                      onClick={openLogin}
                      leftSection={
                        <ThemeIcon
                          size={22}
                          radius="md"
                          variant="light"
                          color="gray"
                        >
                          <IconLogin2 size={16} />
                        </ThemeIcon>
                      }
                    >
                      로그인
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      <ChatModal opened={chatOpen} onClose={() => setChatOpen(false)} />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        /* 모바일·태블릿에서 Hero Grid의 음수 마진(gutter/2 > Container 패딩)이
           뷰포트를 넘겨 생기던 가로 스크롤/떨림 차단. 모바일은 가로 스크롤이
           html(뷰포트) 레벨에서 발생하므로 html·body 모두에 적용한다.
           clip은 스크롤 컨테이너를 만들지 않아 sticky 헤더를 깨지 않는다. */
        html,
        body {
          overflow-x: clip;
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
        .kw-menu-trigger[data-open="true"] {
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
        .kw-menu-trigger[data-open="true"] .kw-menu-icon {
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
        .kw-menu-trigger[data-open="true"] .kw-menu-chev {
          transform: rotate(180deg);
          color: var(--mantine-color-green-7);
        }

        .kw-chat-fab {
          width: 33px;
          height: 33px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(
            135deg,
            var(--mantine-color-green-5),
            var(--mantine-color-teal-6)
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 6px 16px -6px rgba(20, 160, 150, 0.55);
          transition:
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 220ms ease;
        }
        .kw-chat-fab:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 12px 26px -10px rgba(20, 160, 150, 0.6);
        }
        .kw-chat-fab:active {
          transform: translateY(0) scale(1);
        }
      `}</style>
    </>
  );
}

// 어디서나 챗봇 상담을 모달로 열기. 본체는 /planting/chat 페이지와 동일한 ChatPanel,
// 같은 localStorage 세션을 공유하므로 모달↔페이지 대화가 끊기지 않고 이어진다.
function ChatModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      radius="lg"
      padding="lg"
      title={
        <Group gap={8}>
          <ThemeIcon size={28} radius="md" variant="light" color="green">
            <IconMessageCircle size={16} />
          </ThemeIcon>
          <Text fw={800}>챗봇 상담</Text>
        </Group>
      }
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      // 모달이 닫힐 때 ChatPanel을 언마운트 → 다음 열림 때 저장 세션을 다시 로드.
      styles={{ body: { display: "flex", flexDirection: "column" } }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "min(68vh, 600px)",
        }}
      >
        <ChatPanel />
      </Box>
    </Modal>
  );
}
