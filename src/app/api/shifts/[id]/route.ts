import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hmToMinutes } from "@/lib/time";

export const runtime = "nodejs";

async function load(id: string, meId: string, isAdmin: boolean) {
  const s = await prisma.shift.findUnique({ where: { id } });
  if (!s) return null;
  if (!isAdmin && s.userId !== meId) return "forbidden" as const;
  return s;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await ctx.params;
    const s = await load(id, me.id, me.role === "ADMIN");
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (s === "forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data: {
      startMin?: number;
      endMin?: number;
      note?: string | null;
      date?: Date;
    } = {};
    if (body.start) data.startMin = hmToMinutes(body.start);
    if (body.end) data.endMin = hmToMinutes(body.end);
    if (body.date) data.date = new Date(body.date + "T00:00:00Z");
    if ("note" in body) data.note = body.note?.toString().slice(0, 280) || null;

    await prisma.shift.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await ctx.params;
    const s = await load(id, me.id, me.role === "ADMIN");
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (s === "forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
