import { getAdminUser } from "@/lib/auth";
import { listExpenses, listPayments } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const type = new URL(request.url).searchParams.get("type") === "expenses" ? "expenses" : "payments";

  let rows: (string | number | null)[][];
  if (type === "payments") {
    const payments = await listPayments();
    rows = [
      ["paid_on", "amount", "kind", "method", "booking_id", "note", "created_at"],
      ...payments.map((p) => [p.paid_on, p.amount, p.kind, p.method, p.booking_id, p.note, p.created_at]),
    ];
  } else {
    const expenses = await listExpenses();
    rows = [
      ["expense_date", "amount", "category", "vendor", "note", "created_at"],
      ...expenses.map((e) => [e.expense_date, e.amount, e.category, e.vendor, e.note, e.created_at]),
    ];
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
