import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: 'Admin User', email: 'admin@erp.com', password: 'admin123', role: Role.Admin },
  { name: 'Sales User', email: 'sales@erp.com', password: 'sales123', role: Role.Sales },
  { name: 'Warehouse User', email: 'warehouse@erp.com', password: 'warehouse123', role: Role.Warehouse },
  { name: 'Accounts User', email: 'accounts@erp.com', password: 'accounts123', role: Role.Accounts },
];

async function main() {
  console.log('Seeding database...');

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`  Created user: ${user.email} (${user.role})`);
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@erp.com' } });

    const products = [
      { name: 'Widget A', sku: 'WDG-001', category: 'Widgets', unitPrice: 150.0, currentStock: 100, minStockAlert: 20, location: 'Warehouse A' },
      { name: 'Widget B', sku: 'WDG-002', category: 'Widgets', unitPrice: 250.0, currentStock: 50, minStockAlert: 10, location: 'Warehouse A' },
      { name: 'Gadget X', sku: 'GDG-001', category: 'Gadgets', unitPrice: 500.0, currentStock: 30, minStockAlert: 5, location: 'Warehouse B' },
      { name: 'Gadget Y', sku: 'GDG-002', category: 'Gadgets', unitPrice: 750.0, currentStock: 5, minStockAlert: 10, location: 'Warehouse B' },
    ];

    for (const p of products) {
      const product = await prisma.product.create({ data: p });
      if (admin) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            quantityChanged: p.currentStock,
            movementType: 'IN',
            reason: 'Initial stock',
            createdBy: admin.id,
          },
        });
      }
    }
    console.log('  Created sample products with stock movements');
  }

  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        {
          name: 'Rajesh Kumar',
          mobileNumber: '9876543210',
          email: 'rajesh@example.com',
          businessName: 'Kumar Traders',
          customerType: 'Wholesale',
          status: 'Active',
          address: '123 Market Street, Mumbai',
        },
        {
          name: 'Priya Sharma',
          mobileNumber: '9876543211',
          email: 'priya@example.com',
          businessName: 'Sharma Retail',
          customerType: 'Retail',
          status: 'Lead',
          address: '456 Main Road, Delhi',
        },
      ],
    });
    console.log('  Created sample customers');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
