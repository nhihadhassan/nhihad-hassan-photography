import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { brandConfig } from "@/lib/config";
import type { ReceiptView } from "@/lib/receipts";
import { formatMoney } from "@/lib/utils";

export async function buildReceiptPdf(receipt: ReceiptView): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const page = pdf.addPage([612, 792]);
  const ink = rgb(0.09, 0.075, 0.06);
  const muted = rgb(0.38, 0.34, 0.3);
  const copper = rgb(0.55, 0.39, 0.27);
  const line = rgb(0.86, 0.83, 0.78);
  const right = (text: string, y: number, size = 10, font = regular, color = ink) => page.drawText(text, { x: 558 - font.widthOfTextAtSize(text, size), y, size, font, color });

  pdf.setTitle(`${receipt.receiptNumber} - ${brandConfig.name}`);
  pdf.setAuthor(brandConfig.name);
  pdf.setSubject(`Payment receipt for ${receipt.clientName}`);

  page.drawText(brandConfig.name, { x: 54, y: 712, size: 20, font: serif, color: ink });
  page.drawText(brandConfig.contactEmail, { x: 54, y: 690, size: 9.5, font: regular, color: muted });
  right("PAYMENT RECEIPT", 716, 9, bold, copper);
  right(receipt.receiptNumber, 696, 10.5);
  page.drawLine({ start: { x: 54, y: 654 }, end: { x: 558, y: 654 }, thickness: 0.8, color: line });

  page.drawText("RECEIVED FROM", { x: 54, y: 620, size: 8, font: bold, color: copper });
  page.drawText(receipt.clientName, { x: 54, y: 594, size: 13, font: bold, color: ink });
  if (receipt.clientEmail) page.drawText(receipt.clientEmail, { x: 54, y: 576, size: 9.5, font: regular, color: muted });

  page.drawText("PAYMENT FOR", { x: 54, y: 526, size: 8, font: bold, color: copper });
  page.drawText(receipt.shootType, { x: 54, y: 500, size: 11, font: regular, color: ink });
  right(formatMoney(receipt.amount), 500, 17, bold, ink);
  page.drawLine({ start: { x: 54, y: 476 }, end: { x: 558, y: 476 }, thickness: 0.8, color: line });

  const date = new Date(`${receipt.paidOn}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const rows = [
    ["Payment date", date],
    ["Method", receipt.method],
    ["Invoice", receipt.invoiceNumber],
    ["Invoice total", formatMoney(receipt.invoiceTotal)],
    ["Total received", formatMoney(receipt.totalPaid)],
    ["Balance remaining", formatMoney(receipt.balance)],
  ];
  let y = 438;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 54, y, size: 9.5, font: regular, color: muted });
    right(value, y, 9.5, label === "Balance remaining" ? bold : regular, ink);
    y -= 27;
  }

  page.drawText("Thank you. This receipt confirms payment received; it is not a request for payment.", { x: 54, y: 180, size: 9.5, font: regular, color: muted });
  return pdf.save();
}
