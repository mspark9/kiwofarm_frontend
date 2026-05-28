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
  title: '키워팜 — AI 작목 추천 & 디지털 트윈',
  description: '귀농인·주말농장인을 위한 AI 영농 플랫폼',
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
