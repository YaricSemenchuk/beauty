export function hmToMinutes(hm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) throw new Error("Invalid time format, expected HH:MM");
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) throw new Error("Invalid time");
  return h * 60 + min;
}

export function minutesToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Computes worked minutes, treating end<=start as crossing midnight. */
export function shiftMinutes(startMin: number, endMin: number): number {
  if (endMin === startMin) return 0;
  if (endMin > startMin) return endMin - startMin;
  return 24 * 60 - startMin + endMin;
}

export function fmtHours(min: number): string {
  const h = min / 60;
  return (Math.round(h * 10) / 10).toFixed(1).replace(/\.0$/, "");
}

export function isoDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}
