'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface Props {
  postId: string;
  initialFavorited: boolean;
}

export default function FavoriteButton({ postId, initialFavorited }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      if (favorited) {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId }),
        });
        setFavorited(false);
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId }),
        });
        setFavorited(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
        favorited
          ? 'bg-yellow-50 text-yellow-600 border-yellow-400'
          : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-yellow-400'
      }`}
    >
      <span>{favorited ? '⭐' : '☆'}</span>
      <span>{favorited ? '已收藏' : '收藏'}</span>
    </button>
  );
}
