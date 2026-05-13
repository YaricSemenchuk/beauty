import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hmToMinutes, shiftMinutes } from "@/lib/time";

export const runtime = "nodejs";

function err(e: unknown) {
  if (e instanceof Response) return e;
  console.error(e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const userIdParam = url.searchParams.get("userId");

    const targetUserId =
      userIdParam && me.role === "ADMIN" ? userIdParam : me.id;

    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
      userId: targetUserId,
    };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
    });

    return NextResponse.json({
      shifts: shifts.map((s) => ({
        id: s.id,
        userId: s.userId,
        date: s.date.toISOString().slice(0, 10),
        startMin: s.startMin,
        endMin: s.endMin,
        minutes: shiftMinutes(s.startMin, s.endMin),
        note: s.note,
      })),
    });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await req.json();
    const { date, start, end, note, userId } = body ?? {};

    if (!date || !start || !end)
      return NextResponse.json(
        { error: "date, start, end required" },
        { status: 400 },
      );

    const startMin = hmToMinutes(start);
    const endMin = hmToMinutes(end);
    if (startMin === endMin)
      return NextResponse.json(
        { error: "Начало и конец не могут совпадать" },
        { status: 400 },
      );

    const targetUserId = userId && me.role === "ADMIN" ? userId : me.id;
    const dateObj = new Date(date + "T00:00:00Z");

    // Overlap check (only within same calendar day, since cross-midnight shifts are rare)
    const existing = await prisma.shift.findMany({
      where: { userId: targetUserId, date: dateObj },
    });
    for (const s of existing) {
      const aStart = s.startMin;
      const aEnd = s.endMin > s.startMin ? s.endMin : s.startMin + 1;
      const bStart = startMin;
      const bEnd = endMin > startMin ? endMin : startMin + 1;
      if (aStart < bEnd && bStart < aEnd)
        return NextResponse.json(
          { error: "Смена пересекается с существующей" },
          { status: 409 },
        );
    }

    const created = await prisma.shift.create({
      data: {
        userId: targetUserId,
        date: dateObj,
        startMin,
        endMin,
        note: note?.toString().slice(0, 280) || null,
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e) {
    return err(e);
  }
}
