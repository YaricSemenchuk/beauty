import { CSSProperties } from "react";

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div
      className={"text-center text-[var(--gold)] opacity-70 " + className}
      aria-hidden
    >
      <svg width="80" height="14" viewBox="0 0 80 14" fill="none" className="inline-block">
        <path d="M2 7 H30" stroke="currentColor" strokeWidth=".8" />
        <path d="M50 7 H78" stroke="currentColor" strokeWidth=".8" />
        <path d="M40 2 L43 7 L40 12 L37 7 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function BotanicalTR() {
  return (
    <svg
      aria-hidden
      className="absolute -top-8 -right-10 w-52 opacity-40 pointer-events-none rotate-[20deg]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path
        d="M100 20 C110 60 140 70 180 80 C140 90 110 100 100 140 C90 100 60 90 20 80 C60 70 90 60 100 20Z"
        fill="#e8c9b9"
        opacity=".5"
      />
      <path d="M100 60 Q120 80 100 100 Q80 80 100 60Z" fill="#c9a36b" opacity=".4" />
    </svg>
  );
}

export function BotanicalBL() {
  return (
    <svg
      aria-hidden
      className="absolute -bottom-10 -left-10 w-44 opacity-40 pointer-events-none -rotate-[15deg]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path d="M30 100 Q70 60 110 100 Q70 140 30 100Z" fill="#d4a29c" opacity=".35" />
      <circle cx="120" cy="120" r="14" fill="#c9a36b" opacity=".3" />
    </svg>
  );
}

/** Conic-gradient progress ring with centered text */
export function Ring({
  value, // 0..1
  label,
  hint,
  size = 96,
}: {
  value: number;
  label: string;
  hint?: string;
  size?: number;
}) {
  const v = Math.max(0, Math.min(1, value));
  const style: CSSProperties = {
    width: size,
    height: size,
    background: `conic-gradient(var(--gold) ${v * 360}deg, rgba(255,255,255,.5) 0)`,
  };
  return (
    <div
      style={style}
      className="rounded-full flex items-center justify-center relative"
    >
      <span className="absolute inset-[9px] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(201,163,107,.2),0_4px_10px_rgba(180,140,120,.12)]" />
      <span className="relative z-10 font-display text-2xl text-[var(--accent-deep)] font-semibold leading-none text-center">
        {label}
        {hint && (
          <small className="block font-sans text-[10px] text-[var(--ink-soft)] font-medium mt-0.5 tracking-wider">
            {hint}
          </small>
        )}
      </span>
    </div>
  );
}

/** Simple SVG sparkline with gradient fill. Values 0..1 normalized. */
export function Sparkline({ data, width = 120, height = 56 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - 8 - v * (height - 16)] as const);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4b43" stopOpacity=".5" />
          <stop offset="1" stopColor="#7a4b43" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path
        d={line}
        stroke="#7a4b43"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
