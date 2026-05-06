'use client';

import { useState } from 'react';

interface Props {
  phone: string;
  wechat: string;
  onReveal?: () => void;
}

export default function ContactReveal({ phone, wechat, onReveal }: Props) {
  const [visible, setVisible] = useState(false);

  const handleReveal = () => {
    if (visible) return;
    setVisible(true);
    onReveal?.();
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
    <div className="bg-[var(--bg-cream)] rounded-xl p-4 border-2 border-[var(--navy)] animate-popIn">
      {phone && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📞</span>
          <a href={`tel:${phone}`} className="text-lg font-extrabold text-[var(--navy)] no-underline">{phone}</a>
        </div>
      )}
      {wechat && (
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-lg font-extrabold text-[var(--navy)]">{wechat}</span>
        </div>
      )}
      {!phone && !wechat && <span className="text-sm text-[var(--text-muted)]">未提供联系方式</span>}
    </div>
  );
}
