import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '캐봄',
  description: '이력서와 공고를 비교해 합격 전략을 알려드립니다',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0,0&icon_names=stylus"
        />
      </head>
      <body style={{ backgroundColor: '#0a0a0a', color: '#ededed' }}>{children}</body>
    </html>
  );
}
