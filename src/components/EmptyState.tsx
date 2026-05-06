export default function EmptyState({ message = '暂无信息，敬请期待~' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
      <span className="text-5xl mb-4">📭</span>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
