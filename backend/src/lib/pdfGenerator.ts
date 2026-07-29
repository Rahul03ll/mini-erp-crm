import PDFDocument from 'pdfkit';
import { Challan, ChallanLineItem, Customer } from '@prisma/client';

interface InvoiceData extends Challan {
  customer: Customer;
  lineItems: ChallanLineItem[];
  creator?: { name: string } | null;
}

export function generateInvoicePDF(
  challan: InvoiceData,
  stream: NodeJS.WritableStream
): void {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Header
  doc
    .fontSize(20)
    .text('INVOICE', { align: 'center' })
    .moveDown(0.5);

  // Company Info (you can customize this)
  doc
    .fontSize(10)
    .text('Mini ERP/CRM Operations Portal', { align: 'center' })
    .text('Wholesale & Distribution', { align: 'center' })
    .moveDown(1.5);

  // Invoice Details
  const invoiceY = doc.y;
  doc
    .fontSize(10)
    .text(`Invoice #: ${challan.challanNumber}`, 50, invoiceY)
    .text(`Date: ${new Date(challan.createdDate).toLocaleDateString()}`, 50, invoiceY + 15)
    .text(`Status: ${challan.status}`, 50, invoiceY + 30);

  // Customer Details
  doc
    .text(`Bill To:`, 350, invoiceY)
    .text(challan.customer.name, 350, invoiceY + 15)
    .text(challan.customer.businessName || '', 350, invoiceY + 30)
    .text(challan.customer.mobileNumber, 350, invoiceY + 45)
    .text(challan.customer.email || '', 350, invoiceY + 60)
    .text(challan.customer.address || '', 350, invoiceY + 75);

  doc.moveDown(4);

  // Line Items Table
  const tableTop = doc.y + 20;
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 350;
  const priceX = 420;
  const amountX = 490;

  // Table Headers
  doc
    .fontSize(10)
    .fillColor('#000000')
    .text('SKU', itemCodeX, tableTop)
    .text('Description', descriptionX, tableTop)
    .text('Qty', quantityX, tableTop)
    .text('Price', priceX, tableTop)
    .text('Amount', amountX, tableTop);

  // Draw header line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Line Items
  let position = tableTop + 25;
  let subtotal = 0;

  challan.lineItems.forEach((item) => {
    const amount = Number(item.unitPriceSnapshot) * item.quantity;
    subtotal += amount;

    doc
      .fontSize(9)
      .text(item.skuSnapshot, itemCodeX, position)
      .text(item.productNameSnapshot, descriptionX, position, { width: 180 })
      .text(item.quantity.toString(), quantityX, position)
      .text(`$${item.unitPriceSnapshot.toFixed(2)}`, priceX, position)
      .text(`$${amount.toFixed(2)}`, amountX, position);

    position += 25;
  });

  // Draw line before totals
  doc
    .moveTo(50, position)
    .lineTo(550, position)
    .stroke();

  // Totals
  position += 15;
  const tax = subtotal * 0.1; // 10% tax (customize as needed)
  const total = subtotal + tax;

  doc
    .fontSize(10)
    .text('Subtotal:', 420, position)
    .text(`$${subtotal.toFixed(2)}`, 490, position)
    .text('Tax (10%):', 420, position + 20)
    .text(`$${tax.toFixed(2)}`, 490, position + 20)
    .fontSize(12)
    .text('Total:', 420, position + 40)
    .text(`$${total.toFixed(2)}`, 490, position + 40);

  // Footer
  doc
    .fontSize(8)
    .text(
      'Thank you for your business!',
      50,
      doc.page.height - 100,
      { align: 'center' }
    )
    .text(
      'For inquiries, please contact support@mini-erp-crm.com',
      50,
      doc.page.height - 85,
      { align: 'center' }
    );

  doc.end();
}
