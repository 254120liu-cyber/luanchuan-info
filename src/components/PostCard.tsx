'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { catMap, townMap, formatTime, getRemainingHours } from '@/lib/constants';

interface PostCardProps {
  post: {
    id: string;
    category: string;
    content: string;
    images?: string[];
    town: string;
    created_at: string;
    expire_at: string;
    view_count?: number;
    userNickName?: string;
    userAvatar?: string;
  };
}

const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const cat = catMap[post.category] || { label: '其他', color: '#636E72' };
  const town = townMap[post.town] || '';
  const remaining = getRemainingHours(post.expire_at);

  return (
    <Link href={`/detail/${post.id}`} className="block no-underline">
      <div
        className="post-card bg-white rounded-xl border-2 border-[var(--border)] overflow-hidden transition-all hover:shadow-md"
        style={{ borderLeft: `4px solid ${cat.color}` }}
      >
        <div className="p-3.5">
          {/* Header: category + town + time */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white border border-[var(--navy)]"
              style={{ background: cat.color }}
            >
              {cat.label}
            </span>
            {town && <span className="text-xs text-[var(--text-muted)] font-medium">{town}</span>}
            <span className="text-xs text-[var(--text-muted)] ml-auto">{formatTime(post.created_at)}</span>
          </div>

          {/* Content */}
          <p className="text-[15px] font-semibold text-[var(--navy)] leading-relaxed line-clamp-2 mb-2">
            {post.content}
          </p>

          {/* Images preview */}
          {post.images && post.images.length > 0 && (
            <div className="flex gap-1.5 mb-2 overflow-hidden">
              {post.images.slice(0, 3).map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" unoptimized />
                </div>
              ))}
              {post.images.length > 3 && (
                <span className="text-xs text-[var(--text-muted)] self-end pb-1">+{post.images.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              {post.userAvatar ? (
                <Image src={post.userAvatar} alt="" width={18} height={18} className="rounded-full" unoptimized />
              ) : (
                <span className="text-base">👤</span>
              )}
              <span>{post.userNickName || '匿名用户'}</span>
            </span>
            <span className="ml-auto flex items-center gap-1">
              <span>👁 {post.view_count || 0}</span>
              {remaining <= 24 && (
                <span className="text-red-400 font-semibold">{remaining <= 0 ? '已过期' : `剩余${remaining}h`}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default PostCard;
