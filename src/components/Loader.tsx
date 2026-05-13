export function Loader({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[var(--ink-soft)]">
      <div className="size-10 rounded-full border-2 border-[var(--peach)] border-t-[var(--accent-deep)] animate-spin" />
      <p className="mt-4 text-sm">{label}</p>
    </div>
  );
}
