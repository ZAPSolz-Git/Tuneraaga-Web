const PDFDocument = require("pdfkit");

const LOGO_URL =
  "https://suaguciltgydkoyjmbmx.supabase.co/storage/v1/object/public/TuneRaaga/1781762603953_tuneraaga.png";

async function fetchLogoBuffer() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn("⚠️ Logo fetch failed, receipt will skip logo:", err.message);
    return null;
  }
}

function generateReceiptPDF({
  orderId,
  paymentId,
  email,
  planName,
  durationLabel,
  amount,
  paidAt,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const logoBuffer = await fetchLogoBuffer();

      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const dark = "#0D0B1A";
      const cardDark = "#16132B";
      const gold = "#F2B705";
      const teal = "#22D3AE";
      const grayText = "#8B879E";
      const white = "#F5F3EC";

      const marginX = 50;
      const cardWidth = pageWidth - marginX * 2;

      // ── TOP: event-info panel ──
      const topHeight = 260;
      doc.rect(marginX, 40, cardWidth, topHeight).fill(cardDark);

      // logo
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, pageWidth / 2 - 55, 65, { width: 110 });
        } catch (e) {
          doc
            .fillColor(white)
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("TuneRaaga", marginX, 75, {
              width: cardWidth,
              align: "center",
            });
        }
      } else {
        doc
          .fillColor(white)
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("TuneRaaga", marginX, 75, {
            width: cardWidth,
            align: "center",
          });
      }

      doc
        .fillColor(teal)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("✓ PAYMENT SUCCESSFUL", marginX, 130, {
          width: cardWidth,
          align: "center",
          characterSpacing: 1.2,
        });

      doc
        .fillColor(grayText)
        .fontSize(9)
        .font("Helvetica")
        .text("AMOUNT PAID", marginX, 165, {
          width: cardWidth,
          align: "center",
          characterSpacing: 1.5,
        });

      doc
        .fillColor(white)
        .fontSize(36)
        .font("Helvetica-Bold")
        .text(`Rs. ${amount}`, marginX, 180, {
          width: cardWidth,
          align: "center",
        });

      doc
        .fillColor(grayText)
        .fontSize(10)
        .font("Helvetica")
        .text(`${planName} - ${durationLabel}`, marginX, 232, {
          width: cardWidth,
          align: "center",
        });

      // ── PERFORATED DIVIDER (dashed line + punch notches) ──
      const dividerY = 40 + topHeight;
      doc
        .moveTo(marginX, dividerY)
        .lineTo(marginX + cardWidth, dividerY)
        .lineWidth(1.2)
        .dash(4, { space: 4 })
        .strokeColor("#3a3555")
        .stroke();
      doc.undash();

     
      doc.circle(marginX, dividerY, 11).fill("#ffffff");
      doc.circle(marginX + cardWidth, dividerY, 11).fill("#ffffff");

      // ── BOTTOM: stub details panel ──
      const bottomY = dividerY;
      const bottomHeight = 260;
      doc.rect(marginX, bottomY, cardWidth, bottomHeight).fill(cardDark);

      const rows = [
        ["Email", email],
        [
          "Date",
          new Date(paidAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        ],
        ["Payment ID", paymentId],
        ["Order ID", orderId],
      ];

      let rowY = bottomY + 30;
      const rowHeight = 34;

      rows.forEach(([label, value]) => {
        doc
          .fillColor(grayText)
          .fontSize(9.5)
          .font("Helvetica")
          .text(label, marginX + 24, rowY);

        doc
          .fillColor(white)
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text(value, marginX + 24, rowY, {
            width: cardWidth - 48,
            align: "right",
          });

        rowY += rowHeight;
      });

      // barcode strip
      const barcodeY = rowY + 20;
      let barX = marginX + 24;
      const barcodeHeights = [10, 22, 16, 22, 10, 22, 16, 10, 22];
      for (let i = 0; i < 40; i++) {
        const h = barcodeHeights[i % barcodeHeights.length];
        doc.rect(barX, barcodeY + (22 - h), 2, h).fill("#3a3555");
        barX += 5;
      }

      doc
        .fillColor(grayText)
        .fontSize(8.5)
        .font("Helvetica")
        .text(
          "Thank you for going Pro with TuneRaaga",
          marginX,
          barcodeY + 40,
          { width: cardWidth, align: "center" },
        );

      
      doc
        .roundedRect(marginX, 40, cardWidth, topHeight + bottomHeight, 20)
        .lineWidth(1)
        .strokeColor("#3a3555")
        .stroke();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceiptPDF;
