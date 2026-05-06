import { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '栾川便民信息 — 完全免费的本地信息平台',
  description: '栾川本地便民信息发布平台，求职招聘、房屋租售、二手交易、生活服务',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <link rel="preconnect" href="https://ygzldttfsrrzewhiktha.supabase.co" />
        <link rel="dns-prefetch" href="https://ygzldttfsrrzewhiktha.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <NavBar />
          <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
            <main className="flex-1">{children}</main>
          </Suspense>
          <footer className="text-center text-xs text-gray-400 py-6 border-t border-[var(--border)]">
            &copy; {new Date().getFullYear()} 栾川便民信息 — 信息完全免费发布
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
