'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { catMap, townMap, formatTime, getRemainingHours } from '@/lib/constants';
import { addHistory } from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';
import ContactReveal from '@/components/ContactReveal';
import FavoriteButton from '@/components/FavoriteButton';
import ReportButton from '@/components/ReportButton';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          router.push('/');
          return;
        }
        const enriched = {
          ...data,
          categoryLabel: (catMap[data.category] || {}).label || '其他',
          townLabel: townMap[data.town] || '',
          timeText: formatTime(data.created_at),
          remainingHours: getRemainingHours(data.expire_at),
          viewCount: data.view_count || 0,
          contactViewCount: data.contact_view_count || 0,
        };
        setPost(enriched);
        setLoading(false);

        // View count
        fetch(`/api/posts/${id}/view`, { method: 'POST' });

        // Browse history
        addHistory({
          _id: data.id,
          content: data.content,
          category: data.category,
          categoryLabel: enriched.categoryLabel,
          townLabel: enriched.townLabel,
          timeText: enriched.timeText,
        });

        // Check favorite
        if (user) {
          fetch('/api/favorites')
            .then(r => r.json())
            .then(fData => {
              const favs = (fData.favorites || []).map((f: any) => f.id);
              setIsFavorited(favs.includes(id));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        alert('加载失败');
        router.push('/');
      });
  }, [id, user]);

  const handleContactReveal = () => {
    fetch(`/api/posts/${id}/contact`, { method: 'POST' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.content?.substring(0, 30) + '...', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('链接已复制');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  }

  if (!post) return null;

  const cat = catMap[post.category] || { label: '其他', color: '#636E72' };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 animate-slideUp">
      {/* Category + Town */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full text-white border border-[var(--navy)]"
          style={{ background: cat.color }}
        >
          {cat.label}
        </span>
        <span className="text-xs text-[var(--text-muted)] font-medium">{post.townLabel}</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{post.timeText}</span>
        {post.remainingHours <= 24 && (
          <span className="text-xs text-red-400 font-bold">
            {post.remainingHours <= 0 ? '已过期' : `剩余${post.remainingHours}小时`}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-base font-semibold text-[var(--navy)] leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {post.images.map((img: string, i: number) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--border)] cursor-pointer"
              onClick={() => {
                // Simple image preview - open in new tab
                window.open(img, '_blank');
              }}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-3 border-2 border-[var(--border)]">
        {post.userAvatar ? (
          <Image src={post.userAvatar} alt="" width={36} height={36} className="rounded-full" unoptimized />
        ) : (
          <span className="text-2xl">👤</span>
        )}
        <div>
          <p className="text-sm font-bold text-[var(--navy)]">{post.userNickName || '匿名用户'}</p>
          <p className="text-xs text-[var(--text-muted)]">👁 {post.viewCount} 次浏览</p>
        </div>
      </div>

      {/* Contact */}
      <ContactReveal
        phone={post.phone}
        wechat={post.wechat}
        onReveal={handleContactReveal}
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <FavoriteButton postId={id} initialFavorited={isFavorited} />
        <ReportButton postId={id} />
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] transition-all"
        >
          <span>🔗</span><span>分享</span>
        </button>
      </div>

      {/* Contact view count */}
      {post.contactViewCount > 0 && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          已有 {post.contactViewCount} 人查看过联系方式
        </p>
      )}
    </div>
  );
}
