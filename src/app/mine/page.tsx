'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function MinePage() {
  const { user, phone, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (!user) return;

    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { if (!d.error) setProfile(d); })
      .catch(() => {});
  }, [user, loading, router]);

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Profile header */}
      <div className="bg-white rounded-xl p-5 border-2 border-[var(--navy)] flex items-center gap-4" style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.08)' }}>
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={56} height={56} className="rounded-full border-2 border-[var(--border)]" unoptimized />
        ) : (
          <span className="text-5xl">👤</span>
        )}
        <div>
          <p className="text-lg font-extrabold text-[var(--navy)]">{profile?.nickname || '用户'}</p>
          <p className="text-xs text-[var(--text-muted)]">{phone || '未绑定手机号'}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-xl border-2 border-[var(--navy)] overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.08)' }}>
        {[
          { label: '编辑资料', icon: '👤', path: '/mine/profile' },
          { label: '我的发布', icon: '📋', path: '/mine/posts' },
          { label: '我的收藏', icon: '⭐', path: '/mine/favorites' },
          { label: '修改密码', icon: '🔒', path: '/mine/password' },
        ].map(item => (
          <Link
            key={item.path}
            href={item.path}
            prefetch
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-[var(--border)] last:border-b-0 font-bold text-[var(--navy)] text-sm hover:bg-[var(--bg-warm)] transition-colors no-underline"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <span className="text-[var(--text-muted)]">›</span>
          </Link>
        ))}
      </div>

      {/* Admin entry */}
      {isAdmin && (
        <Link
          href="/admin"
          prefetch
          className="w-full bg-yellow-50 rounded-xl border-2 border-[var(--navy)] p-4 flex items-center gap-3 text-left font-bold text-[var(--navy)] hover:bg-yellow-100 transition-colors no-underline"
          style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.08)' }}
        >
          <span className="text-2xl">🛡️</span>
          <span className="flex-1">管理面板</span>
          <span className="text-[var(--text-muted)]">›</span>
        </Link>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full py-3 text-center text-sm text-[var(--text-muted)] font-semibold hover:text-red-500 transition-colors"
      >
        退出登录
      </button>
    </div>
  );
}
