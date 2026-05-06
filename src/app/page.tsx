'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CategoryTabs from '@/components/CategoryTabs';
import TownSelect from '@/components/TownSelect';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [town, setTown] = useState('');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const loadingRef = useRef(false); // prevent duplicate fetches

  const fetchPosts = async (reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');

    const newSkip = reset ? 0 : skip;
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (town) params.set('town', town);
    if (search) params.set('q', search);
    params.set('skip', String(newSkip));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      if (res.ok) {
        const newPosts = reset ? data.posts : [...posts, ...data.posts];
        setPosts(newPosts);
        setSkip(newSkip + data.posts.length);
        setHasMore(data.posts.length === 20);
      } else {
        setError(data.error || '加载失败');
      }
    } catch {
      setError('网络错误，请刷新重试');
    }
    setLoading(false);
    setInitialLoading(false);
    loadingRef.current = false;
  };

  // Initial load
  useEffect(() => {
    setSkip(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  }, [activeCategory, town]);

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  };

  // Infinite scroll
  useEffect(() => {
    const el = document.getElementById('load-trigger');
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, skip]);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="px-4 pt-3">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索信息..."
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[var(--navy)] text-white text-sm font-bold border-2 border-[var(--navy)]"
          >
            搜索
          </button>
        </div>
      </form>

      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      <div className="px-4 pb-2">
        <TownSelect value={town} onChange={setTown} />
      </div>

      <div className="px-4 space-y-3 pb-8">
        {initialLoading ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">加载中...</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={() => fetchPosts(true)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-full">
              点击重试
            </button>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState />
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}

        <div id="load-trigger" className="h-4">
          {loading && !initialLoading && (
            <div className="text-center py-4 text-[var(--text-muted)] text-sm">加载中...</div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-xs text-[var(--text-muted)]">— 已加载全部信息 —</div>
          )}
        </div>
      </div>

      <button
        onClick={() => router.push('/publish')}
        onMouseEnter={() => router.prefetch('/publish')}
        onTouchStart={() => router.prefetch('/publish')}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-3 rounded-full font-bold text-sm border-2 border-[var(--navy)] shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.2)' }}
      >
        <span className="text-lg">✏️</span>
        <span>发布信息</span>
      </button>
    </div>
  );
}
