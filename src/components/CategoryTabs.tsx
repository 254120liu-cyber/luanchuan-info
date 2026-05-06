'use client';

import { CATEGORIES } from '@/lib/constants';

interface Props {
  active: string;
  onChange: (key: string) => void;
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar">
      {CATEGORIES.map(c => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all whitespace-nowrap ${
            active === c.key
              ? 'bg-[var(--primary)] text-white border-[var(--navy)]'
              : 'bg-white text-[var(--navy)] border-[var(--border)] hover:border-[var(--primary)]'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
