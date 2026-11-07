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
          .fillAndStroke('#090d16', '#1e293b');

        // WayRivo AI 2.0 Brand Logo / Text
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor('#06b6d4')
          .text('WAYRIVO', margin + 20, margin + 22, { continued: true })
          .fillColor('#ffffff')
          .text(' AI 2.0');

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#94a3b8')
          .text('Autonomous Travel Ecosystem & Escrow Protection', margin + 20, margin + 48);

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

