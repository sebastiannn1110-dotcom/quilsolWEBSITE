import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type PdfRow = {
  mpn: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type BrandedPdfInput = {
  documentTitle: string;
  statusText: string;
  number: string;
  orderNumber?: string;
  quoteNumber?: string;
  date: string;
  seller: string;
  customer: string;
  address?: string;
  currency: string;
  rows: PdfRow[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  validity?: string;
  paymentStatus?: string;
  verificationReference?: string;
  mock: boolean;
};

function pdfText(value: string) {
  return value
    .replaceAll("—", "\x97")
    .replaceAll("–", "\x96")
    .replaceAll("“", "\x93")
    .replaceAll("”", "\x94")
    .replace(/[^\x20-\xFF]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function money(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

async function logoJpeg() {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "logos",
    "quicksol-logo.svg",
  );
  const svg = await readFile(logoPath);
  return sharp(svg)
    .resize({ width: 250, fit: "inside" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90 })
    .toBuffer({ resolveWithObject: true });
}

function textCommand(
  text: string,
  x: number,
  y: number,
  size = 10,
  bold = false,
) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfText(
    text,
  )}) Tj ET`;
}

export async function createBrandedPdf(input: BrandedPdfInput) {
  const logo = await logoJpeg();
  const commands: string[] = [
    "q 170 0 0 43 42 730 cm /Logo Do Q",
    "0.85 0.38 0.13 rg 42 704 514 3 re f",
    "0 0 0 rg",
    textCommand(input.documentTitle, 42, 675, 19, true),
    textCommand(input.statusText, 42, 651, 11, true),
    textCommand(`Número: ${input.number}`, 42, 625, 10),
    textCommand(`Fecha: ${input.date}`, 320, 625, 10),
  ];

  let identityY = 607;
  if (input.orderNumber || input.quoteNumber) {
    if (input.orderNumber) {
      commands.push(
        textCommand(`Pedido: ${input.orderNumber}`, 42, identityY, 10),
      );
    }
    if (input.quoteNumber) {
      commands.push(
        textCommand(`Cotización: ${input.quoteNumber}`, 320, identityY, 10),
      );
    }
    identityY -= 18;
  }
  commands.push(
    textCommand(`Vendedor: ${input.seller}`, 42, identityY, 10),
    textCommand(`Cliente: ${input.customer}`, 42, identityY - 18, 10),
  );

  if (input.address) {
    commands.push(
      textCommand(`Dirección: ${input.address}`, 42, identityY - 36, 9),
    );
  }

  const tableTop = input.address ? identityY - 65 : identityY - 47;
  commands.push(
    "0.03 0.18 0.2 rg",
    `42 ${tableTop} 514 24 re f`,
    "1 1 1 rg",
    textCommand("MPN", 50, tableTop + 8, 9, true),
    textCommand("Descripcion", 150, tableTop + 8, 9, true),
    textCommand("Cant.", 390, tableTop + 8, 9, true),
    textCommand("Unitario", 430, tableTop + 8, 9, true),
    textCommand("Subtotal", 500, tableTop + 8, 9, true),
    "0 0 0 rg",
  );

  let y = tableTop - 18;
  input.rows.slice(0, 14).forEach((row, index) => {
    if (index % 2 === 0) {
      commands.push(`0.97 0.96 0.94 rg 42 ${y - 5} 514 18 re f`, "0 0 0 rg");
    }
    commands.push(
      textCommand(row.mpn, 50, y, 8),
      textCommand(row.description.slice(0, 43), 150, y, 8),
      textCommand(String(row.quantity), 395, y, 8),
      textCommand(money(row.unitPrice, input.currency), 430, y, 8),
      textCommand(money(row.subtotal, input.currency), 500, y, 8),
    );
    y -= 20;
  });

  y -= 12;
  commands.push(
    textCommand(`Subtotal: ${money(input.subtotal, input.currency)}`, 390, y, 10),
    textCommand(`Impuestos: ${money(input.tax, input.currency)}`, 390, y - 18, 10),
    textCommand(`Total: ${money(input.total, input.currency)}`, 390, y - 40, 12, true),
  );

  const detailsY = Math.max(118, y - 78);
  if (input.validity) {
    commands.push(textCommand(`Vigencia: ${input.validity}`, 42, detailsY, 9));
  }
  if (input.paymentStatus) {
    commands.push(
      textCommand(`Estado de pago: ${input.paymentStatus}`, 42, detailsY, 9),
    );
  }
  if (input.verificationReference) {
    commands.push(
      textCommand(
        `Referencia verificable: ${input.verificationReference}`,
        42,
        detailsY - 16,
        9,
      ),
    );
  }
  if (input.notes) {
    commands.push(
      textCommand(`Notas: ${input.notes.slice(0, 90)}`, 42, detailsY - 34, 8),
    );
  }
  if (input.terms) {
    commands.push(
      textCommand(
        `Terminos: ${input.terms.slice(0, 90)}`,
        42,
        detailsY - 50,
        8,
      ),
    );
  }

  if (input.mock) {
    commands.push(
      "0.85 0.38 0.13 rg",
      textCommand(
        "DOCUMENTO DE PRUEBA — SIN VALIDEZ COMERCIAL",
        115,
        55,
        13,
        true,
      ),
      "0 0 0 rg",
    );
  }

  const content = Buffer.from(commands.join("\n"), "latin1");
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
        "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> " +
        "/XObject << /Logo 6 0 R >> >> /Contents 7 0 R >>",
    ),
    Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ),
    Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${logo.info.width} ` +
          `/Height ${logo.info.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
          `/Filter /DCTDecode /Length ${logo.data.length} >>\nstream\n`,
      ),
      logo.data,
      Buffer.from("\nendstream"),
    ]),
    Buffer.concat([
      Buffer.from(`<< /Length ${content.length} >>\nstream\n`),
      content,
      Buffer.from("\nendstream"),
    ]),
  ];

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];
  let offset = chunks[0].length;

  objects.forEach((object, index) => {
    offsets.push(offset);
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from("\nendobj\n"),
    ]);
    chunks.push(chunk);
    offset += chunk.length;
  });

  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets
      .slice(1)
      .map((item) => `${String(item).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF",
  ].join("\n");
  chunks.push(Buffer.from(`${xref}\n`));
  return Buffer.concat(chunks);
}
