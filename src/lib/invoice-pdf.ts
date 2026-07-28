import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { brandConfig } from "@/lib/config";
import { formatMoney } from "@/lib/utils";

export type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: string;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
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

function dateLabel(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
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

function summaryRow(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  fonts: { regular: PDFFont; bold: PDFFont },
  strong = false,
) {
  page.drawText(label, {
    x: 350,
    y,
    size: strong ? 11 : 10,
    font: strong ? fonts.bold : fonts.regular,
    color: strong ? INK : MUTED,
  });
  rightText(page, value, strong ? fonts.bold : fonts.regular, strong ? 15 : 10, PAGE_WIDTH - MARGIN, y - (strong ? 2 : 0));
}

export async function buildInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const serif = await document.embedFont(StandardFonts.TimesRoman);
  const fonts = { regular, bold };

  document.setTitle(`${data.invoiceNumber} - ${brandConfig.name}`);
  document.setAuthor(brandConfig.name);
  document.setSubject(`Invoice for ${data.clientName}`);
  document.setCreator(brandConfig.name);

  page.drawText(brandConfig.name, {
    x: MARGIN,
    y: 712,
    size: 20,
    font: serif,
    color: INK,
  });
  page.drawText(brandConfig.contactEmail, {
    x: MARGIN,
    y: 691,
    size: 9.5,
    font: regular,
    color: MUTED,
  });
  page.drawText("Toronto, Ontario", {
    x: MARGIN,
    y: 676,
    size: 9.5,
    font: regular,
    color: MUTED,
  });

  rightText(page, "INVOICE", bold, 9, PAGE_WIDTH - MARGIN, 716, COPPER);
  rightText(page, data.invoiceNumber, regular, 10.5, PAGE_WIDTH - MARGIN, 696);
  rightText(page, `Issued ${dateLabel(data.issuedAt) ?? ""}`, regular, 9, PAGE_WIDTH - MARGIN, 678, MUTED);

  page.drawLine({
    start: { x: MARGIN, y: 645 },
    end: { x: PAGE_WIDTH - MARGIN, y: 645 },
    thickness: 0.8,
    color: LINE,
  });

  page.drawText("BILLED TO", { x: MARGIN, y: 620, size: 8, font: bold, color: COPPER });
  page.drawText(data.clientName, { x: MARGIN, y: 597, size: 11, font: bold, color: INK });
  if (data.clientEmail) {
    page.drawText(data.clientEmail, { x: MARGIN, y: 580, size: 9.5, font: regular, color: MUTED });
  }

  const shootDate = dateLabel(data.shootDate);
  if (shootDate) {
    rightText(page, "SHOOT DATE", bold, 8, PAGE_WIDTH - MARGIN, 620, COPPER);
    rightText(page, shootDate, regular, 10, PAGE_WIDTH - MARGIN, 597);
  }

  page.drawLine({
    start: { x: MARGIN, y: 550 },
    end: { x: PAGE_WIDTH - MARGIN, y: 550 },
    thickness: 0.8,
    color: LINE,
  });
  page.drawText("DESCRIPTION", { x: MARGIN, y: 530, size: 8, font: bold, color: MUTED });
  rightText(page, "AMOUNT", bold, 8, PAGE_WIDTH - MARGIN, 530, MUTED);

  page.drawText(data.shootType, { x: MARGIN, y: 500, size: 11, font: regular, color: INK });
  if (data.location) {
    page.drawText(data.location, { x: MARGIN, y: 482, size: 9, font: regular, color: MUTED });
  }
  rightText(page, formatMoney(data.total), regular, 11, PAGE_WIDTH - MARGIN, 500);
  page.drawLine({
    start: { x: MARGIN, y: 458 },
    end: { x: PAGE_WIDTH - MARGIN, y: 458 },
    thickness: 0.6,
    color: LINE,
  });

  let summaryY = 425;
  summaryRow(page, "Subtotal", formatMoney(data.total), summaryY, fonts);
  summaryY -= 25;
  if (data.paid > 0) {
    summaryRow(page, "Payments received", `-${formatMoney(data.paid)}`, summaryY, fonts);
    summaryY -= 25;
  }
  page.drawLine({
    start: { x: 350, y: summaryY + 12 },
    end: { x: PAGE_WIDTH - MARGIN, y: summaryY + 12 },
    thickness: 0.8,
    color: LINE,
  });
  summaryRow(
    page,
    data.balance <= 0.005 ? "Paid in full" : "Balance due",
    formatMoney(data.balance),
    summaryY - 5,
    fonts,
    true,
  );

  page.drawRectangle({
    x: MARGIN,
    y: 205,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 86,
    color: PAPER,
    borderColor: rgb(0.82, 0.73, 0.64),
    borderWidth: 0.7,
  });
  page.drawText(data.balance <= 0.005 ? "PAYMENT RECEIVED" : "PAYMENT", {
    x: MARGIN + 18,
    y: 266,
    size: 8,
    font: bold,
    color: COPPER,
  });
  const paymentLine =
    data.balance <= 0.005
      ? "Thank you. This invoice has been paid in full."
      : `Please send ${formatMoney(data.balance)} by Interac e-Transfer to:`;
  page.drawText(paymentLine, {
    x: MARGIN + 18,
    y: 241,
    size: 10,
    font: regular,
    color: INK,
  });
  if (data.balance > 0.005) {
    page.drawText(brandConfig.contactEmail, {
      x: MARGIN + 18,
      y: 221,
      size: 10,
      font: bold,
      color: INK,
    });
  }

  page.drawText("Amounts in Canadian dollars.", {
    x: MARGIN,
    y: 152,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  rightText(page, data.invoiceNumber, regular, 8.5, PAGE_WIDTH - MARGIN, 152, MUTED);

  return document.save();
}
