'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function NavBar() {
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-[var(--navy)] shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-xl">🏘️</span>
          <span className="text-[17px] font-extrabold text-[var(--navy)]">栾川便民信息</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-[var(--navy)] hover:text-[var(--primary)] transition-colors">
            首页
          </Link>
          {user ? (
            <>
              <Link href="/publish" className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                发布信息
              </Link>
              <Link href="/mine" className="text-sm font-semibold text-[var(--navy)] hover:text-[var(--primary)] transition-colors">
                我的
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors">
                  管理
                </Link>
              )}
              <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2">
                退出
              </button>
            </>
          ) : (
            <Link href="/auth" className="text-sm font-semibold bg-[var(--primary)] text-white px-4 py-1.5 rounded-full transition-colors">
              登录
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <span className={`block w-5 h-0.5 bg-[var(--navy)] transition-transform ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[var(--navy)] transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[var(--navy)] transition-transform ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t-2 border-[var(--border)] bg-white animate-slideUp">
          <div className="flex flex-col p-4 gap-3">
            <Link href="/" className="text-base font-semibold text-[var(--navy)] py-2" onClick={() => setMenuOpen(false)}>首页</Link>
            {user ? (
              <>
                <Link href="/publish" className="text-base font-semibold text-[var(--primary)] py-2" onClick={() => setMenuOpen(false)}>发布信息</Link>
                <Link href="/mine" className="text-base font-semibold text-[var(--navy)] py-2" onClick={() => setMenuOpen(false)}>我的</Link>
                {isAdmin && (
                  <Link href="/admin" className="text-base font-bold text-red-500 py-2" onClick={() => setMenuOpen(false)}>管理面板</Link>
                )}
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="text-left text-sm text-gray-400 py-2">
                  退出登录
                </button>
              </>
            ) : (
              <Link href="/auth" className="text-base font-semibold text-[var(--primary)] py-2" onClick={() => setMenuOpen(false)}>登录 / 注册</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
