'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import PostForm from '@/components/PostForm';

export default function PublishPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) return null;

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-[var(--navy)] text-center mb-2">发布信息</h2>
      <PostForm />
    </div>
  );
}
