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
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <footer className="text-center text-xs text-gray-400 py-6 border-t border-[var(--border)]">
            &copy; {new Date().getFullYear()} 栾川便民信息 — 信息完全免费发布
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
