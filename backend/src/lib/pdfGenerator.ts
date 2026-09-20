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

  // Company Info
  doc
    .fontSize(10)
    .text('Mini ERP/CRM Operations Portal', { align: 'center' })
    .text('Wholesale & Distribution Operations', { align: 'center' })
    .moveDown(1.5);

  // Invoice Details
  const invoiceY = doc.y;
  doc
    .fontSize(10)
    .text(`Invoice #: ${challan.challanNumber}`, 50, invoiceY)
    .text(`Date: ${new Date(challan.createdDate).toLocaleDateString()}`, 50, invoiceY + 15)
    .text(`Status: ${challan.status}`, 50, invoiceY + 30);

  if (challan.creator?.name) {
    doc.text(`Issued By: ${challan.creator.name}`, 50, invoiceY + 45);
  }

  // Customer Details (Right Aligned)
  let custY = invoiceY;
  doc.text('Bill To:', 350, custY);
  custY += 15;
  doc.text(challan.customer.name, 350, custY);
  if (challan.customer.businessName) {
    custY += 15;
    doc.text(challan.customer.businessName, 350, custY);
  }
  custY += 15;
  doc.text(`Mobile: ${challan.customer.mobileNumber}`, 350, custY);
  if (challan.customer.gstNumber) {
    custY += 15;
    doc.text(`GSTIN: ${challan.customer.gstNumber}`, 350, custY);
  }
  if (challan.customer.email) {
    custY += 15;
    doc.text(`Email: ${challan.customer.email}`, 350, custY);
  }
  if (challan.customer.address) {
    custY += 15;
    doc.text(challan.customer.address, 350, custY, { width: 190 });
  }

  doc.y = Math.max(invoiceY + 90, custY + 25);

  // Line Items Table Setup
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 350;
  const priceX = 420;
  const amountX = 490;

  const drawTableHeader = (y: number) => {
    doc
      .fontSize(10)
      .fillColor('#000000')
      .text('SKU', itemCodeX, y)
      .text('Description', descriptionX, y)
      .text('Qty', quantityX, y)
      .text('Price (Rs.)', priceX, y)
      .text('Amount (Rs.)', amountX, y);

    doc
      .moveTo(50, y + 15)
      .lineTo(550, y + 15)
      .stroke();
  };

  let position = doc.y + 10;
  drawTableHeader(position);
  position += 25;

  let subtotal = 0;

  challan.lineItems.forEach((item) => {
    // Check page overflow
    if (position > doc.page.height - 140) {
      doc.addPage();
      position = 50;
      drawTableHeader(position);
      position += 25;
    }

    const unitPrice = Number(item.unitPriceSnapshot);
    const amount = unitPrice * item.quantity;
    subtotal += amount;

    doc
      .fontSize(9)
      .text(item.skuSnapshot, itemCodeX, position)
      .text(item.productNameSnapshot, descriptionX, position, { width: 180 })
      .text(item.quantity.toString(), quantityX, position)
      .text(`Rs. ${unitPrice.toFixed(2)}`, priceX, position)
      .text(`Rs. ${amount.toFixed(2)}`, amountX, position);

    position += 25;
  });

  // Check overflow before totals
  if (position > doc.page.height - 120) {
    doc.addPage();
    position = 50;
  }

  // Draw line before totals
  doc
    .moveTo(50, position)
    .lineTo(550, position)
    .stroke();

  // Totals
  position += 15;
  const tax = subtotal * 0.1; // 10% GST/Tax
  const total = subtotal + tax;

  doc
    .fontSize(10)
    .text('Subtotal:', 400, position)
    .text(`Rs. ${subtotal.toFixed(2)}`, 480, position)
    .text('GST / Tax (10%):', 400, position + 20)
    .text(`Rs. ${tax.toFixed(2)}`, 480, position + 20)
    .fontSize(11)
    .text('Total:', 400, position + 40)
    .text(`Rs. ${total.toFixed(2)}`, 480, position + 40);

  // Footer
  doc
    .fontSize(8)
    .text(
      'Thank you for your business!',
      50,
      doc.page.height - 80,
      { align: 'center' }
    )
    .text(
      'For inquiries, please contact support@mini-erp-crm.com',
      50,
      doc.page.height - 65,
      { align: 'center' }
    );

  doc.end();
}
