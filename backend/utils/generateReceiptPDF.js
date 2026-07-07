const PDFDocument = require("pdfkit");

function generateReceiptPDF({
  orderId,
  paymentId,
  email,
  planName,
  durationLabel,
  amount,
  paidAt,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const emerald = "#10b981";
      const dark = "#0f172a";
      const grayText = "#64748b";
      const lightGray = "#f1f5f9";

      doc.rect(0, 0, pageWidth, 150).fill(emerald);

      doc
        .fillColor("#ffffff")
        .fontSize(26)
        .font("Helvetica-Bold")
        .text("TuneRaaga", 0, 50, { align: "center" });

      doc
        .fillColor("#ffffff")
        .fontSize(11)
        .font("Helvetica")
        .text("Payment Receipt", 0, 85, { align: "center" });

      doc.roundedRect(pageWidth / 2 - 100, 118, 200, 34, 17).fill(dark);
      doc
        .fillColor(emerald)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Payment Successful", pageWidth / 2 - 100, 128, {
          width: 200,
          align: "center",
        });

      let y = 190;
      doc
        .fillColor(grayText)
        .fontSize(9)
        .font("Helvetica")
        .text("AMOUNT PAID", 0, y, { align: "center", characterSpacing: 1 });

      doc
        .fillColor(dark)
        .fontSize(34)
        .font("Helvetica-Bold")
        .text(`Rs. ${amount}`, 0, y + 16, { align: "center" });

      y = 270;
      const cardX = 60;
      const cardWidth = pageWidth - 120;

      const rows = [
        ["Plan", `${planName} - ${durationLabel}`],
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

      const rowHeight = 46;
      doc
        .roundedRect(cardX, y, cardWidth, rowHeight * rows.length, 12)
        .fill(lightGray);

      rows.forEach(([label, value], i) => {
        const rowY = y + i * rowHeight;

        if (i !== 0) {
          doc
            .moveTo(cardX + 20, rowY)
            .lineTo(cardX + cardWidth - 20, rowY)
            .lineWidth(0.5)
            .strokeColor("#e2e8f0")
            .stroke();
        }

        doc
          .fillColor(grayText)
          .fontSize(10)
          .font("Helvetica")
          .text(label, cardX + 20, rowY + 16);

        doc
          .fillColor(dark)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(value, cardX + 20, rowY + 16, {
            width: cardWidth - 40,
            align: "right",
          });
      });

      const footerY = y + rowHeight * rows.length + 40;
      doc
        .moveTo(cardX, footerY)
        .lineTo(cardX + cardWidth, footerY)
        .lineWidth(0.5)
        .dash(3, { space: 3 })
        .strokeColor("#cbd5e1")
        .stroke();
      doc.undash();

      doc
        .fillColor(grayText)
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for going Pro with TuneRaaga", 0, footerY + 20, {
          align: "center",
        });

      doc
        .fillColor("#94a3b8")
        .fontSize(8)
        .text(
          "This is a system-generated receipt and does not require a signature.",
          0,
          footerY + 36,
          { align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceiptPDF;
