import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';
import { QueryProvider } from '@/providers/QueryProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

export const metadata: Metadata = {
  title: '키워팜 — AI 텃밭 추천·관리 플랫폼',
  description:
    '지역·장소·일조만 입력하면 AI가 지금 심기 좋은 텃밭 작물을 추천하고, 파종부터 수확까지 영농 캘린더·재배 정보·챗봇 상담으로 관리해 드립니다.',
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
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <QueryProvider>
            <SiteHeader />
            {children}
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
