import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { fmtHours, minutesToHm, shiftMinutes } from "@/lib/time";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "xlsx").toLowerCase();
    const userId = url.searchParams.get("userId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!userId || !from || !to)
      return NextResponse.json(
        { error: "userId, from, to required" },
        { status: 400 },
      );

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const shifts = await prisma.shift.findMany({
      where: {
        userId,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
    });

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username || "Сотрудник";
    const totalMin = shifts.reduce(
      (a, s) => a + shiftMinutes(s.startMin, s.endMin),
      0,
    );
    const totalDays = new Set(
      shifts.map((s) => s.date.toISOString().slice(0, 10)),
    ).size;

    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Отчёт");
      ws.addRow([`Сотрудник: ${fullName}`]);
      ws.addRow([`Период: ${from} — ${to}`]);
      ws.addRow([]);
      ws.addRow(["Дата", "Начало", "Конец", "Часы", "Заметка"]);
      ws.getRow(4).font = { bold: true };
      for (const s of shifts) {
        const m = shiftMinutes(s.startMin, s.endMin);
        ws.addRow([
          s.date.toISOString().slice(0, 10),
          minutesToHm(s.startMin),
          minutesToHm(s.endMin),
          Number((m / 60).toFixed(2)),
          s.note ?? "",
        ]);
      }
      ws.addRow([]);
      ws.addRow(["Итого часов", "", "", Number((totalMin / 60).toFixed(2))]);
      ws.addRow(["Итого дней", "", "", totalDays]);
      ws.columns.forEach((c) => (c.width = 16));

      const buf = await wb.xlsx.writeBuffer();
      return new NextResponse(buf as ArrayBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="report_${userId}_${from}_${to}.xlsx"`,
        },
      });
    }

    if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      const done = new Promise<Buffer>((resolve) =>
        doc.on("end", () => resolve(Buffer.concat(chunks))),
      );

      doc.fontSize(18).text("Отчёт по рабочим часам");
      doc.moveDown(0.3).fontSize(11).text(`Сотрудник: ${fullName}`);
      doc.text(`Период: ${from} — ${to}`);
      doc.moveDown();

      doc.fontSize(11).text("Дата          Начало    Конец    Часы    Заметка");
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      for (const s of shifts) {
        const m = shiftMinutes(s.startMin, s.endMin);
        doc.text(
          `${s.date.toISOString().slice(0, 10)}    ${minutesToHm(s.startMin)}    ${minutesToHm(s.endMin)}    ${fmtHours(m)}    ${s.note ?? ""}`,
        );
      }
      doc.moveDown();
      doc.fontSize(12).text(`Итого часов: ${fmtHours(totalMin)}`);
      doc.text(`Итого дней: ${totalDays}`);
      doc.end();
      const buf = await done;

      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report_${userId}_${from}_${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Unknown format" }, { status: 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
