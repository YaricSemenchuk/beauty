import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { shiftMinutes } from "@/lib/time";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const userIdParam = url.searchParams.get("userId");
    if (!from || !to)
      return NextResponse.json(
        { error: "from, to required (YYYY-MM-DD)" },
        { status: 400 },
      );

    const targetUserId =
      userIdParam && me.role === "ADMIN" ? userIdParam : me.id;

    const shifts = await prisma.shift.findMany({
      where: {
        userId: targetUserId,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
    });

    const byDay = new Map<string, number>();
    let totalMin = 0;
    for (const s of shifts) {
      const k = s.date.toISOString().slice(0, 10);
      const m = shiftMinutes(s.startMin, s.endMin);
      byDay.set(k, (byDay.get(k) ?? 0) + m);
      totalMin += m;
    }

    return NextResponse.json({
      totalMinutes: totalMin,
      totalDays: byDay.size,
      byDay: [...byDay.entries()].map(([date, minutes]) => ({ date, minutes })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
