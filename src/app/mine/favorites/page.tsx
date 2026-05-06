'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (!user) return;
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setFavorites(data.favorites || []);
        setPageLoading(false);
      })
      .catch(() => setPageLoading(false));
  }, [user, loading, router]);

  if (loading || pageLoading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-extrabold text-[var(--navy)] mb-4">我的收藏</h2>
      {favorites.length === 0 ? (
        <EmptyState message="还没有收藏过信息" />
      ) : (
        <div className="space-y-3">
          {favorites.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
