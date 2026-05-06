'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { catMap, townMap, formatTime, getRemainingHours } from '@/lib/constants';

export default function MyPostsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (!user) return;
    fetch('/api/mine/posts')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setPosts((data.posts || []).map((p: any) => ({
            ...p,
            categoryLabel: (catMap[p.category] || {}).label || '其他',
            townLabel: townMap[p.town] || '',
            timeText: formatTime(p.created_at),
            remainingHours: getRemainingHours(p.expire_at),
          })));
        }
        setPageLoading(false);
      })
      .catch(() => setPageLoading(false));
  }, [user, loading, router]);

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这条信息吗？')) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(posts.filter(p => p.id !== postId));
    } else {
      const data = await res.json();
      alert(data.error || '删除失败');
    }
  };

  if (loading || pageLoading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-extrabold text-[var(--navy)] mb-4">我的发布</h2>
      {posts.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-sm font-semibold">还没有发布过信息</p>
          <button onClick={() => router.push('/publish')} className="mt-3 px-5 py-2 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-2 border-[var(--navy)]">
            去发布
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className={`bg-white rounded-xl p-4 border-2 ${post.status === 'reported' ? 'border-red-300 bg-red-50' : 'border-[var(--border)]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  post.status === 'reported' ? 'bg-red-100 text-red-600' :
                  post.status === 'deleted' ? 'bg-gray-100 text-gray-500' : ''
                }`}>
                  {post.status === 'reported' ? '审核中' : post.status === 'deleted' ? '已删除' : post.categoryLabel}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{post.townLabel}</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">{post.timeText}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--navy)] line-clamp-2 mb-2">{post.content}</p>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-3">
                <span>👁 {post.view_count || 0}次浏览</span>
                {post.remainingHours <= 24 && (
                  <span className="text-red-400 ml-2">{post.remainingHours <= 0 ? '已过期' : `剩余${post.remainingHours}h`}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/publish/${post.id}`)}
                  className="px-4 py-1.5 rounded-lg bg-white border-2 border-[var(--border)] text-xs font-bold text-[var(--navy)] hover:border-[var(--primary)] transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-4 py-1.5 rounded-lg bg-white border-2 border-red-300 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
