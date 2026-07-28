import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { brandConfig } from "@/lib/config";
import { formatMoney } from "@/lib/utils";

export type InvoicePdfLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: string;
  dueDate?: string | null;
  poNumber?: string | null;
  notes?: string | null;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
  /** Itemised lines. Empty for legacy bookings billed as a single total. */
  lines?: InvoicePdfLine[];
  subtotal?: number;
  discount?: number;
  total: number;
  deposit: number;
  paid: number;
  balance: number;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const INK = rgb(0.09, 0.075, 0.06);
const MUTED = rgb(0.38, 0.34, 0.3);
const COPPER = rgb(0.55, 0.39, 0.27);
const PAPER = rgb(0.965, 0.945, 0.91);
const LINE = rgb(0.86, 0.83, 0.78);

/** Right edge of each money column. */
const COL_QTY = 392;
const COL_PRICE = 470;
const COL_AMOUNT = PAGE_WIDTH - MARGIN;
/** Description wraps before it can collide with the quantity column. */
const DESC_WIDTH = COL_QTY - MARGIN - 58;
/** Start a new page rather than drawing below this line. */
const PAGE_FLOOR = 210;

function dateLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

/** Drops a trailing .00 so a quantity of 1 reads "1", not "1.00". */
function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function rightText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  xRight: number,
  y: number,
  color = INK,
) {
  page.drawText(text, {
    x: xRight - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color,
  });
}

/** Greedy word wrap to a pixel width, so long descriptions never overlap. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

function drawRule(page: PDFPage, y: number, thickness = 0.8, from = MARGIN, to = PAGE_WIDTH - MARGIN) {
  page.drawLine({ start: { x: from, y }, end: { x: to, y }, thickness, color: LINE });
}

export async function buildInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const serif = await document.embedFont(StandardFonts.TimesRoman);

  document.setTitle(`${data.invoiceNumber} - ${brandConfig.name}`);
  document.setAuthor(brandConfig.name);
  document.setSubject(`Invoice for ${data.clientName}`);
  document.setCreator(brandConfig.name);

  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // ── Masthead ──────────────────────────────────────────────────────────────
  page.drawText(brandConfig.name, { x: MARGIN, y: 712, size: 20, font: serif, color: INK });
  page.drawText(brandConfig.contactEmail, { x: MARGIN, y: 691, size: 9.5, font: regular, color: MUTED });
  page.drawText("Toronto, Ontario", { x: MARGIN, y: 676, size: 9.5, font: regular, color: MUTED });

  rightText(page, "INVOICE", bold, 9, COL_AMOUNT, 716, COPPER);
  rightText(page, data.invoiceNumber, regular, 10.5, COL_AMOUNT, 696);

  let metaY = 678;
  const issued = dateLabel(data.issuedAt);
  if (issued) {
    rightText(page, `Issued ${issued}`, regular, 9, COL_AMOUNT, metaY, MUTED);
    metaY -= 14;
  }
  const due = dateLabel(data.dueDate);
  if (due) {
    rightText(page, `Due ${due}`, regular, 9, COL_AMOUNT, metaY, MUTED);
    metaY -= 14;
  }

  const headerFloor = Math.min(645, metaY - 8);
  drawRule(page, headerFloor);

  // ── Billed to ─────────────────────────────────────────────────────────────
  let y = headerFloor - 25;
  page.drawText("BILLED TO", { x: MARGIN, y, size: 8, font: bold, color: COPPER });

  const shootDate = dateLabel(data.shootDate);
  if (shootDate) rightText(page, "SHOOT DATE", bold, 8, COL_AMOUNT, y, COPPER);

  y -= 23;
  page.drawText(data.clientName, { x: MARGIN, y, size: 11, font: bold, color: INK });
  if (shootDate) rightText(page, shootDate, regular, 10, COL_AMOUNT, y);

  y -= 17;
  if (data.clientEmail) {
    page.drawText(data.clientEmail, { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });
  }
  if (data.poNumber) {
    rightText(page, `PO ${data.poNumber}`, regular, 9, COL_AMOUNT, y, MUTED);
  }

  // ── Line item table ───────────────────────────────────────────────────────
  y -= 32;
  drawRule(page, y);
  y -= 20;

  const itemised = Boolean(data.lines?.length);
  page.drawText("DESCRIPTION", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  if (itemised) {
    rightText(page, "QTY", bold, 8, COL_QTY, y, MUTED);
    rightText(page, "PRICE", bold, 8, COL_PRICE, y, MUTED);
  }
  rightText(page, "AMOUNT", bold, 8, COL_AMOUNT, y, MUTED);
  y -= 12;
  drawRule(page, y, 0.6);
  y -= 22;

  /** Moves to a fresh page when the cursor runs out of room. */
  const ensureRoom = (needed: number) => {
    if (y - needed >= PAGE_FLOOR) return;
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN - 20;
    page.drawText("DESCRIPTION", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
    rightText(page, "AMOUNT", bold, 8, COL_AMOUNT, y, MUTED);
    y -= 12;
    drawRule(page, y, 0.6);
    y -= 22;
  };

  if (itemised) {
    for (const line of data.lines!) {
      const wrapped = wrapText(line.description, regular, 11, DESC_WIDTH);
      ensureRoom(wrapped.length * 15 + 10);

      wrapped.forEach((text, index) => {
        page.drawText(text, { x: MARGIN, y: y - index * 14, size: 11, font: regular, color: INK });
      });
      rightText(page, formatQuantity(line.quantity), regular, 10.5, COL_QTY, y, MUTED);
      rightText(page, formatMoney(line.unitPrice), regular, 10.5, COL_PRICE, y, MUTED);
      rightText(page, formatMoney(line.amount), regular, 11, COL_AMOUNT, y);

      y -= wrapped.length * 14 + 12;
    }
  } else {
    // Legacy single-total booking: keep the original one-line presentation.
    ensureRoom(40);
    page.drawText(data.shootType, { x: MARGIN, y, size: 11, font: regular, color: INK });
    rightText(page, formatMoney(data.total), regular, 11, COL_AMOUNT, y);
    if (data.location) {
      y -= 18;
      page.drawText(data.location, { x: MARGIN, y, size: 9, font: regular, color: MUTED });
    }
    y -= 20;
  }

  drawRule(page, y, 0.6);

  // ── Summary ───────────────────────────────────────────────────────────────
  const subtotal = data.subtotal ?? data.total;
  const discount = data.discount ?? 0;
  const summaryRows: { label: string; value: string; strong?: boolean }[] = [
    { label: "Subtotal", value: formatMoney(subtotal) },
  ];
  if (discount > 0.005) {
    summaryRows.push({ label: "Discount", value: `-${formatMoney(discount)}` });
    summaryRows.push({ label: "Total", value: formatMoney(data.total) });
  }
  if (data.paid > 0.005) {
    summaryRows.push({ label: "Payments received", value: `-${formatMoney(data.paid)}` });
  }

  ensureRoom(summaryRows.length * 22 + 60);
  y -= 30;

  for (const row of summaryRows) {
    page.drawText(row.label, { x: 350, y, size: 10, font: regular, color: MUTED });
    rightText(page, row.value, regular, 10, COL_AMOUNT, y);
    y -= 22;
  }

  drawRule(page, y + 10, 0.8, 350);
  y -= 8;
  const settled = data.balance <= 0.005;
  page.drawText(settled ? "Paid in full" : "Balance due", {
    x: 350,
    y,
    size: 11,
    font: bold,
    color: INK,
  });
  rightText(page, formatMoney(data.balance), bold, 15, COL_AMOUNT, y - 2);

  // ── Payment instructions ──────────────────────────────────────────────────
  y -= 40;
  ensureRoom(110);
  const boxHeight = settled ? 62 : 86;
  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: PAGE_WIDTH - MARGIN * 2,
    height: boxHeight,
    color: PAPER,
    borderColor: rgb(0.82, 0.73, 0.64),
    borderWidth: 0.7,
  });
  page.drawText(settled ? "PAYMENT RECEIVED" : "PAYMENT", {
    x: MARGIN + 18,
    y: y - 24,
    size: 8,
    font: bold,
    color: COPPER,
  });
  page.drawText(
    settled
      ? "Thank you. This invoice has been paid in full."
      : `Please send ${formatMoney(data.balance)} by Interac e-Transfer to:`,
    { x: MARGIN + 18, y: y - 49, size: 10, font: regular, color: INK },
  );
  if (!settled) {
    page.drawText(brandConfig.contactEmail, {
      x: MARGIN + 18,
      y: y - 69,
      size: 10,
      font: bold,
      color: INK,
    });
  }
  y -= boxHeight + 26;

  // ── Notes / terms ─────────────────────────────────────────────────────────
  if (data.notes?.trim()) {
    const noteLines = data.notes
      .trim()
      .split(/\n+/)
      .flatMap((paragraph) => wrapText(paragraph, regular, 9.5, PAGE_WIDTH - MARGIN * 2));
    ensureRoom(noteLines.length * 13 + 30);
    page.drawText("NOTES", { x: MARGIN, y, size: 8, font: bold, color: COPPER });
    y -= 18;
    for (const noteLine of noteLines) {
      page.drawText(noteLine, { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });
      y -= 13;
    }
  }

  // ── Footer, pinned to the last page ───────────────────────────────────────
  page.drawText("Amounts in Canadian dollars.", {
    x: MARGIN,
    y: 120,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  rightText(page, data.invoiceNumber, regular, 8.5, COL_AMOUNT, 120, MUTED);

  return document.save();
}
