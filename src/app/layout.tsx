import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { SiteHeader } from '@/components/layout/SiteHeader';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

export const metadata: Metadata = {
  title: '키워팜 — AI 텃밭 추천·관리 플랫폼',
  description:
    '지역·장소·일조만 입력하면 AI가 지금 심기 좋은 텃밭 작물을 추천하고, 파종부터 수확까지 텃밭 캘린더·재배 정보·챗봇 상담으로 관리해 드립니다.',
  icons: {
    icon: '/icons/favicon.svg',
    shortcut: '/icons/favicon.svg',
    apple: '/icons/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <ColorSchemeScript />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 자랑글 꾸미기 서체 — Gowun Batang(명조)·Gaegu(손글씨). 산세리프는 Pretendard. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gaegu:wght@400;700&display=swap"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <QueryProvider>
            <AuthProvider>
              <SiteHeader />
              <RouteGuard>{children}</RouteGuard>
            </AuthProvider>
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
