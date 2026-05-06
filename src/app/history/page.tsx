'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getHistory, clearHistory } from '@/lib/storage';
import { catMap } from '@/lib/constants';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>(() => getHistory());

  const handleClear = () => {
    if (!confirm('确定要清空所有浏览历史吗？')) return;
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-[var(--navy)]">浏览历史</h2>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 font-semibold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
          >
            清空
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-5xl mb-3">🕐</p>
          <p className="text-sm font-semibold">暂无浏览历史</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item: any) => {
            const cat = catMap[item.category] || { label: '其他', color: '#636E72' };
            return (
              <Link key={item._id} href={`/detail/${item._id}`} className="block no-underline">
                <div className="bg-white rounded-xl p-3.5 border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                  style={{ borderLeft: `3px solid ${cat.color}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: cat.color }}
                    >
                      {item.categoryLabel}
                    </span>
                    {item.townLabel && <span className="text-xs text-[var(--text-muted)]">{item.townLabel}</span>}
                    <span className="text-xs text-[var(--text-muted)] ml-auto">{item.timeText}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--navy)] line-clamp-1">{item.content}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
