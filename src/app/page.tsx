'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryTabs from '@/components/CategoryTabs';
import TownSelect from '@/components/TownSelect';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';

const PAGE_SIZE = 20;

function cacheKey(category: string, town: string): string {
  return `${category}|${town}`;
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [town, setTown] = useState('');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const fetchIdRef = useRef(0);
  const cacheRef = useRef<Map<string, { posts: any[]; skip: number; hasMore: boolean }>>(new Map());

  const fetchPosts = useCallback(async (reset: boolean) => {
    const thisFetchId = ++fetchIdRef.current;
    const key = cacheKey(activeCategory, town);
    const newSkip = reset ? 0 : skip;
    const cached = cacheRef.current.get(key);

    if (reset && cached) {
      setPosts(cached.posts);
      setSkip(cached.skip);
      setHasMore(cached.hasMore);
      setInitialLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (town) params.set('town', town);
    if (search) params.set('q', search);
    params.set('skip', String(newSkip));
    params.set('limit', String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      // Ignore stale responses from rapid switching
      if (thisFetchId !== fetchIdRef.current) return;
      if (res.ok) {
        const incomingPosts = data.posts;
        const merged = reset ? incomingPosts : [...(reset ? [] : posts), ...incomingPosts];
        const newTotalSkip = newSkip + incomingPosts.length;
        const hMore = incomingPosts.length === PAGE_SIZE;

        setPosts(merged);
        setSkip(newTotalSkip);
        setHasMore(hMore);
        if (reset) {
          cacheRef.current.set(key, { posts: incomingPosts, skip: newTotalSkip, hasMore: hMore });
        }
      } else {
        setError(data.error || '加载失败');
      }
    } catch {
      if (thisFetchId === fetchIdRef.current && !cached) setError('网络错误，请刷新重试');
    }
    if (thisFetchId === fetchIdRef.current) {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, town, search, skip, posts]);

  useEffect(() => {
    setSkip(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  }, [activeCategory, town]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  };

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
  }, [hasMore, loading, skip, fetchPosts]);

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

      {/* Subtle refresh indicator */}
      {refreshing && (
        <div className="px-4 pb-1">
          <div className="h-0.5 bg-[var(--primary)]/20 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--primary)]/50 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      <div className="px-4 space-y-3 pb-8">
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 border-2 border-[var(--border)] animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
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
          {loading && !initialLoading && !refreshing && (
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
