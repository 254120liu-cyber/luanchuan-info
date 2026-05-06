'use client';

import { useState } from 'react';

interface Props {
  phone: string;
  wechat: string;
  onReveal?: () => void;
}

export default function ContactReveal({ phone, wechat, onReveal }: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    if (visible) return;
    setVisible(true);
    onReveal?.();
  };

  const copyWechat = () => {
    navigator.clipboard.writeText(wechat).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!visible) {
    return (
      <button
        onClick={handleReveal}
        className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-base border-2 border-[var(--navy)] hover:opacity-90 transition-opacity"
        style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.15)' }}
      >
        点击查看联系方式
      </button>
    );
  }

  return (
    <div
      className="bg-[var(--bg-cream)] rounded-xl border-2 border-[var(--navy)] overflow-hidden animate-popIn"
      style={{ boxShadow: '3px 3px 0px rgba(30,39,46,0.08)' }}
    >
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-3 px-4 py-3.5 no-underline hover:bg-white/50 transition-colors border-b border-[var(--border)] last:border-b-0"
        >
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-white border-2 border-[var(--border)]">
            📞
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-0.5">拨打电话</p>
            <p className="text-base font-extrabold text-[var(--navy)]">{phone}</p>
          </div>
          <span className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">→</span>
        </a>
      )}

      {wechat && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-white border-2 border-[var(--border)]">
            💬
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide mb-0.5">微信号</p>
            <p className="text-base font-extrabold text-[var(--navy)]">{wechat}</p>
          </div>
          <button
            onClick={copyWechat}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2"
            style={{
              background: copied ? '#dcfce7' : 'var(--bg-warm)',
              color: copied ? '#16a34a' : 'var(--text-muted)',
              borderColor: copied ? '#86efac' : 'var(--border)',
            }}
          >
            {copied ? '已复制 ✓' : '复制'}
          </button>
        </div>
      )}

      {!phone && !wechat && (
        <p className="px-4 py-5 text-sm text-[var(--text-muted)] text-center">未提供联系方式</p>
      )}
    </div>
  );
}
