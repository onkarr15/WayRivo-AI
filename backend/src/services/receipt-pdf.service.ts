import PDFDocument from 'pdfkit';

export interface ReceiptData {
  receiptNumber: string;
  wayrivoTransactionId: string | null;
  paypalCaptureId: string | null;
  paypalOrderId: string | null;
  paymentStatus: string;
  rawStatus?: string;
  escrowStatus?: string;
  paymentMethod: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  amount: number;
  currency: string;
  chargeAmount: string;
  chargeCurrency: string;
  exchangeRate: number;
  sender: {
    fullName: string;
    email: string;
    userReference?: string | null;
  };
  merchant: {
    name: string;
    platform: string;
    paymentProvider: string;
    gateway: string;
  };
  booking: {
    id: string;
    reference: string;
    status: string;
    escrowStatus?: string;
    escrowReleaseDate?: any;
    itineraryTitle?: string;
    destination?: string;
  };
  timestamps: {
    completedAtUTC: Date | string;
    transactionDateIST: string;
    transactionTimeIST: string;
    receiptGeneratedAtUTC: Date | string;
  };
}

export class ReceiptPdfService {
  /**
   * Generates a high-fidelity, printable and downloadable PDF receipt buffer
   */
  async generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `WayRivo Payment Receipt - ${data.wayrivoTransactionId || data.receiptNumber}`,
            Author: 'WayRivo AI 2.0 Intelligent Travel Platform',
            Subject: 'Official Payment Confirmation & Escrow Guarantee',
            Keywords: 'receipt, payment, paypal, escrow, wayrivo',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2; // 515.28

        // ==========================================
        // 1. TOP BRANDING & HEADER BAR
        // ==========================================
        // Top dark header card
        const headerHeight = 90;
        doc
          .roundedRect(margin, margin, contentWidth, headerHeight, 10)
          .fillAndStroke('#071B33', '#1e293b');

        // Official Aero W Brand Vector Symbol inside Header
        const logoX = margin + 18;
        const logoY = margin + 22;
        const logoBadgeSize = 46;

        doc
          .roundedRect(logoX, logoY, logoBadgeSize, logoBadgeSize, 10)
          .fillAndStroke('#0B1E38', '#35D6E8');

        // Draw Aero W Vector Mark in PDFKit
        doc.save();
        doc.translate(logoX + 4, logoY + 4);
        doc.scale(0.316); // 120 * 0.316 = ~38px

        // Left Outer Fin
        doc
          .path(
            'M 18 25 C 18 21.5, 22.5 19, 27 19 L 34 19 C 38 19, 41 21.5, 42.5 25.5 L 54 68 C 55.5 72.5, 52 77, 47.5 77 L 40 77 C 36.5 77, 33.5 74.5, 32 71.5 L 18.8 28.5 C 18.2 27.5, 18 26.2, 18 25 Z'
          )
          .fill('#1677D2');

        // Right Outer Fin
        doc
          .path(
            'M 102 25 C 102 21.5, 97.5 19, 93 19 L 86 19 C 82 19, 79 21.5, 77.5 25.5 L 66 68 C 64.5 72.5, 68 77, 72.5 77 L 80 77 C 83.5 77, 86.5 74.5, 88 71.5 L 101.2 28.5 C 101.8 27.5, 102 26.2, 102 25 Z'
          )
          .fill('#1677D2');

        // Central Jet Monogram
        doc
          .path(
            'M 60 11 C 61.2 11, 62.4 12.2, 63 14 L 66.5 36 L 94 54 C 96 55.5, 95 58.5, 92.5 58.5 L 68 57.2 L 66 80.5 L 72 82 C 73.5 82.5, 73.5 84.5, 72 84.5 L 63 84.5 L 60 88 L 57 84.5 L 48 84.5 C 46.5 84.5, 46.5 82.5, 48 82 L 54 80.5 L 52 57.2 L 27.5 58.5 C 25 58.5, 24 55.5, 26 54 L 53.5 36 L 57 14 C 57.6 12.2, 58.8 11, 60 11 Z'
          )
          .fill('#35D6E8');

        // Flight Orbit Trajectory Arc
        doc
          .path('M 16 70 C 32 87, 88 87, 104 70 C 88 81, 32 81, 16 70 Z')
          .fill('#35D6E8');

        doc.restore();

        // WayRivo AI 2.0 Brand Logo / Wordmark
        doc
          .font('Helvetica-Bold')
          .fontSize(19)
          .fillColor('#35D6E8')
          .text('WAYRIVO', margin + 74, margin + 26, { continued: true })
          .fillColor('#ffffff')
          .text(' AI 2.0');

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text('TRAVEL SMARTER. EXPLORE FURTHER.', margin + 74, margin + 49);

        // Header Right: Title & Receipt Number
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#ffffff')
          .text('PAYMENT RECEIPT', margin, margin + 20, {
            width: contentWidth - 20,
            align: 'right',
          });

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#06b6d4')
          .text(data.receiptNumber || 'OFFICIAL RECEIPT', margin, margin + 42, {
            width: contentWidth - 20,
            align: 'right',
          });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text('Official Payment Confirmation', margin, margin + 57, {
            width: contentWidth - 20,
            align: 'right',
          });

        let currentY = margin + headerHeight + 15;

        // ==========================================
        // 2. PAYMENT CONFIRMATION HERO BADGE
        // ==========================================
        const heroHeight = 68;
        doc
          .roundedRect(margin, currentY, contentWidth, heroHeight, 8)
          .fillAndStroke('#f0fdf4', '#bbf7d0');

        // Status check icon & headline
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#15803d')
          .text('[SUCCESS] PAYMENT VERIFIED & COMPLETED', margin + 20, currentY + 16);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#166534')
          .text(
            'Your payment was verified by PayPal Developer Sandbox and secured in WayRivo Escrow Vault.',
            margin + 20,
            currentY + 36,
            { width: contentWidth - 160 }
          );

        // Total Paid on Hero Right
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor('#0f172a')
          .text(`$${data.chargeAmount} ${data.chargeCurrency}`, margin, currentY + 15, {
            width: contentWidth - 20,
            align: 'right',
          });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text(`(Equivalent to Rs. ${Number(data.amount).toLocaleString('en-IN')} ${data.currency})`, margin, currentY + 38, {
            width: contentWidth - 20,
            align: 'right',
          });

        currentY += heroHeight + 15;

        // ==========================================
        // 3. TWO-COLUMN DETAILS: TRAVELLER & PAYMENT
        // ==========================================
        const colGap = 15;
        const colWidth = (contentWidth - colGap) / 2;
        const sectionHeight = 160;

        // Left Box: Traveller / Payer Details
        doc
          .roundedRect(margin, currentY, colWidth, sectionHeight, 8)
          .fillAndStroke('#ffffff', '#e2e8f0');

        // Left Box Header
        doc
          .roundedRect(margin, currentY, colWidth, 28, 8)
          .fill('#f8fafc');
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#334155')
          .text('TRAVELLER / SENDER DETAILS', margin + 14, currentY + 9);

        // Left Box Fields
        const leftFields = [
          { label: 'Full Name', value: data.sender.fullName || 'Verified Traveler' },
          { label: 'Registered Email', value: data.sender.email || 'N/A' },
          { label: 'Traveler ID', value: data.sender.userReference ? `${data.sender.userReference.substring(0, 18)}...` : 'N/A' },
          { label: 'Merchant / Payee', value: 'WayRivo AI 2.0 (Escrow Agent)' },
        ];

        let fieldY = currentY + 38;
        leftFields.forEach((f) => {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#64748b')
            .text(f.label.toUpperCase(), margin + 14, fieldY);
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#0f172a')
            .text(f.value, margin + 14, fieldY + 11);
          fieldY += 28;
        });

        // Right Box: Payment & Transaction Details
        const rightX = margin + colWidth + colGap;
        doc
          .roundedRect(rightX, currentY, colWidth, sectionHeight, 8)
          .fillAndStroke('#ffffff', '#e2e8f0');

        // Right Box Header
        doc
          .roundedRect(rightX, currentY, colWidth, 28, 8)
          .fill('#f8fafc');
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#334155')
          .text('PAYMENT & TRANSACTION DETAILS', rightX + 14, currentY + 9);

        // Right Box Fields
        const paymentMethodLabel = data.paymentMethod === 'CREDIT_DEBIT_CARD'
          ? `Card (${data.cardBrand || 'Card'} ending in ${data.cardLast4 || '****'})`
          : 'PayPal Sandbox Wallet';

        const rightFields = [
          { label: 'WayRivo Transaction ID', value: data.wayrivoTransactionId || 'N/A' },
          { label: 'PayPal Capture ID', value: data.paypalCaptureId || 'N/A' },
          { label: 'PayPal Order ID', value: data.paypalOrderId || 'N/A' },
          { label: 'Payment Method', value: paymentMethodLabel },
        ];

        fieldY = currentY + 38;
        rightFields.forEach((f) => {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#64748b')
            .text(f.label.toUpperCase(), rightX + 14, fieldY);
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#0f172a')
            .text(f.value, rightX + 14, fieldY + 11);
          fieldY += 28;
        });

        currentY += sectionHeight + 15;

        // ==========================================
        // 4. BOOKING & ESCROW GUARANTEE SUMMARY
        // ==========================================
        const bookingHeight = 145;
        doc
          .roundedRect(margin, currentY, contentWidth, bookingHeight, 8)
          .fillAndStroke('#ffffff', '#e2e8f0');

        // Booking Box Header
        doc
          .roundedRect(margin, currentY, contentWidth, 28, 8)
          .fill('#f8fafc');
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#334155')
          .text('BOOKING SPECIFICATION & ESCROW GUARANTEE', margin + 14, currentY + 9);

        // 3-Column Booking Details
        const bColWidth = (contentWidth - 28) / 3;
        const bRow1Y = currentY + 38;

        // Col 1: Booking Reference & Itinerary
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('BOOKING REFERENCE', margin + 14, bRow1Y);
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(data.booking.reference || 'N/A', margin + 14, bRow1Y + 11);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('ITINERARY TITLE', margin + 14, bRow1Y + 34);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text(data.booking.itineraryTitle || 'Curated Itinerary', margin + 14, bRow1Y + 45, { width: bColWidth - 10 });

        // Col 2: Destination & Status
        const bCol2X = margin + 14 + bColWidth;
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('DESTINATION', bCol2X, bRow1Y);
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(data.booking.destination || 'Selected Destination', bCol2X, bRow1Y + 11);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('BOOKING STATUS', bCol2X, bRow1Y + 34);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#16a34a')
          .text('CONFIRMED (ESCROW HOLD)', bCol2X, bRow1Y + 45);

        // Col 3: Date & Time of Transaction
        const bCol3X = margin + 14 + bColWidth * 2;
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('TRANSACTION DATE (IST)', bCol3X, bRow1Y);
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(data.timestamps.transactionDateIST || 'N/A', bCol3X, bRow1Y + 11);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('TRANSACTION TIME (IST)', bCol3X, bRow1Y + 34);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text(data.timestamps.transactionTimeIST || 'N/A', bCol3X, bRow1Y + 45);

        // Escrow Security Banner inside Booking Box
        const bannerY = currentY + 98;
        doc
          .roundedRect(margin + 12, bannerY, contentWidth - 24, 34, 6)
          .fillAndStroke('#eff6ff', '#bfdbfe');

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#1d4ed8')
          .text('WAYRIVO ESCROW VAULT GUARANTEE ACTIVE', margin + 22, bannerY + 7);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#1e40af')
          .text(
            'Your payment is safely protected in escrow. Funds will only be disbursed to verified travel partners after successful journey completion.',
            margin + 22,
            bannerY + 19,
            { width: contentWidth - 44 }
          );

        currentY += bookingHeight + 15;

        // ==========================================
        // 5. FINANCIAL BREAKDOWN TABLE
        // ==========================================
        const tableHeight = 110;
        doc
          .roundedRect(margin, currentY, contentWidth, tableHeight, 8)
          .fillAndStroke('#ffffff', '#e2e8f0');

        // Table Header
        doc
          .roundedRect(margin, currentY, contentWidth, 26, 8)
          .fill('#f1f5f9');

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#475569')
          .text('DESCRIPTION / LINE ITEM', margin + 14, currentY + 9)
          .text('QTY', margin + 280, currentY + 9)
          .text('RATE (INR)', margin + 340, currentY + 9)
          .text('AMOUNT (USD)', margin, currentY + 9, { width: contentWidth - 14, align: 'right' });

        // Row 1: Itinerary Package
        const row1Y = currentY + 34;
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text(data.booking.itineraryTitle || 'Curated Itinerary Booking', margin + 14, row1Y)
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text('All-inclusive verified accommodations, transit & activities', margin + 14, row1Y + 12)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#0f172a')
          .text('1', margin + 280, row1Y)
          .text(`Rs. ${Number(data.amount).toLocaleString('en-IN')}`, margin + 340, row1Y)
          .font('Helvetica-Bold')
          .text(`$${data.chargeAmount}`, margin, row1Y, { width: contentWidth - 14, align: 'right' });

        // Divider
        doc
          .moveTo(margin + 10, currentY + 68)
          .lineTo(margin + contentWidth - 10, currentY + 68)
          .strokeColor('#e2e8f0')
          .stroke();

        // Row 2: Totals
        const totalY = currentY + 76;
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#64748b')
          .text('TOTAL CHARGED (CAPTURED)', margin + 14, totalY);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(`Exchange Reference: 1 USD = ${data.exchangeRate} INR`, margin + 14, totalY + 12);

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#0f172a')
          .text(`$${data.chargeAmount} ${data.chargeCurrency}`, margin, totalY + 2, {
            width: contentWidth - 14,
            align: 'right',
          });

        currentY += tableHeight + 15;

        // ==========================================
        // 6. OFFICIAL FOOTER
        // ==========================================
        const footerY = pageHeight - margin - 50;

        doc
          .moveTo(margin, footerY)
          .lineTo(margin + contentWidth, footerY)
          .strokeColor('#cbd5e1')
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#64748b')
          .text('WayRivo AI 2.0 • Intelligent Travel Platform & Escrow Security', margin, footerY + 8);

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#94a3b8')
          .text(
            `Receipt Generated: ${new Date().toUTCString()} | Booking Ref: ${data.booking.reference} | WayRivo TxID: ${data.wayrivoTransactionId}`,
            margin,
            footerY + 20
          );

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#94a3b8')
          .text(
            'This official computer-generated receipt confirms the recorded payment transaction. No physical signature is required.',
            margin,
            footerY + 31
          );

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#64748b')
          .text('Page 1 of 1', margin, footerY + 8, {
            width: contentWidth,
            align: 'right',
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const receiptPdfService = new ReceiptPdfService();

