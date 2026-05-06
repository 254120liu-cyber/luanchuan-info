'use client';

import { TOWNS } from '@/lib/constants';

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export default function TownSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] bg-white text-sm font-semibold text-[var(--navy)] focus:outline-none focus:border-[var(--primary)] appearance-none"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808E9B' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
      <option value="">全部区域</option>
      {TOWNS.map(t => (
        <option key={t.key} value={t.key}>{t.label}</option>
      ))}
    </select>
  );
}
