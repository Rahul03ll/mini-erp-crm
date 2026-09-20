import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PassThrough } from 'node:stream';
import { generateInvoicePDF } from './pdfGenerator';
import { ChallanStatus, CustomerStatus, CustomerType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('PDF Invoice Generator', () => {
  it('generates valid PDF bytes starting with %PDF- header', async () => {
    const mockChallan = {
      id: 'c1111111-1111-1111-1111-111111111111',
      challanNumber: 'CH-2026-0001',
      customerId: 'cust-1',
      totalQuantity: 5,
      status: ChallanStatus.Confirmed,
      createdBy: 'user-1',
      createdDate: new Date('2026-07-29T10:00:00Z'),
      updatedAt: new Date('2026-07-29T10:00:00Z'),
      customer: {
        id: 'cust-1',
        name: 'Rahul Raj',
        businessName: 'Raj Enterprises',
        mobileNumber: '+91 9876543210',
        email: 'raj@enterprises.com',
        gstNumber: '21AAAAA0000A1Z5',
        customerType: CustomerType.Wholesale,
        address: 'KIIT Square, Bhubaneswar, Odisha',
        status: CustomerStatus.Active,
        followUpDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      creator: { name: 'Admin Operations' },
      lineItems: [
        {
          id: 'li-1',
          challanId: 'c1111111-1111-1111-1111-111111111111',
          productId: 'prod-1',
          productNameSnapshot: 'Industrial Valve X200',
          skuSnapshot: 'VALVE-X200',
          unitPriceSnapshot: new Decimal('750.00'),
          quantity: 5,
        },
      ],
    };

    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

    await new Promise<void>((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      generateInvoicePDF(mockChallan, stream);
    });

    const pdfBuffer = Buffer.concat(chunks);
    assert.ok(pdfBuffer.length > 500, `PDF size should be at least 500 bytes, got ${pdfBuffer.length}`);
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    assert.strictEqual(header, '%PDF-');
  });
});
