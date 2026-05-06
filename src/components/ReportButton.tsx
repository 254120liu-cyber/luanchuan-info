'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface Props {
  postId: string;
}

export default function ReportButton({ postId }: Props) {
  const { user } = useAuth();
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    if (loading || reported) return;

    if (!confirm('确定要举报这条信息吗？举报后该信息将立刻对其他人隐藏。')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/report`, { method: 'POST' });
      if (res.ok) {
        setReported(true);
        alert('举报成功，管理员将尽快处理');
      } else {
        const data = await res.json();
        alert(data.error || '举报失败');
      }
    } catch {
      alert('举报失败，请重试');
    }
    setLoading(false);
  };

  if (reported) {
    return (
      <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 bg-gray-100 text-gray-400 border-gray-300">
        <span>🚩</span><span>已举报</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleReport}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm border-2 bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-red-400 hover:text-red-500 transition-all"
    >
      <span>🚩</span><span>{loading ? '举报中...' : '举报'}</span>
    </button>
  );
}
