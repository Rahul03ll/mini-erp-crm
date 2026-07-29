import { Router } from 'express';
import { z } from 'zod';
import { ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, AppError, getPagination, paramId } from '../middleware/errorHandler';

const router = Router();

const lineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

const challanSchema = z.object({
  customerId: z.string().uuid(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

const challanUpdateSchema = z.object({
  customerId: z.string().uuid().optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

async function buildLineItems(lineItems: { productId: string; quantity: number }[]) {
  const products = await Promise.all(
    lineItems.map((item) => prisma.product.findUnique({ where: { id: item.productId } }))
  );

  return lineItems.map((item, index) => {
    const product = products[index];
    if (!product) throw new AppError(400, `Product not found: ${item.productId}`);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
    };
  });
}

router.use(authenticate);

router.post('/', authorize('manage_challans'), validateBody(challanSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.body.customerId } });
    if (!customer) throw new AppError(404, 'Customer not found');

    const builtItems = await buildLineItems(req.body.lineItems);
    const totalQuantity = builtItems.reduce((sum, item) => sum + item.quantity, 0);
    const challanNumber = await generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: req.body.customerId,
        totalQuantity,
        status: ChallanStatus.Draft,
        createdBy: req.user!.userId,
        lineItems: { create: builtItems },
      },
      include: {
        lineItems: true,
        customer: { select: { id: true, name: true, businessName: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(challan);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const status = req.query.status as ChallanStatus | undefined;
    const customerId = req.query.customerId as string | undefined;

    const where: Record<string, unknown> = {};
    if (status && Object.values(ChallanStatus).includes(status)) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    if (req.user!.role === 'Sales') {
      where.createdBy = req.user!.userId;
    }

    const canViewAll = ['Admin', 'Sales', 'Accounts'].includes(req.user!.role);
    if (!canViewAll) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          creator: { select: { id: true, name: true } },
          lineItems: true,
        },
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({
      data: challans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const canView = ['Admin', 'Sales', 'Accounts'].includes(req.user!.role);
    if (!canView) throw new AppError(403, 'Insufficient permissions');

    const challan = await prisma.challan.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        customer: true,
        creator: { select: { id: true, name: true } },
        lineItems: true,
      },
    });

    if (!challan) throw new AppError(404, 'Challan not found');

    if (req.user!.role === 'Sales' && challan.createdBy !== req.user!.userId) {
      throw new AppError(403, 'Insufficient permissions');
    }

    res.json(challan);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('manage_challans'), validateBody(challanUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.challan.findUnique({
      where: { id: paramId(req.params.id) },
      include: { lineItems: true },
    });

    if (!existing) throw new AppError(404, 'Challan not found');
    if (existing.status !== ChallanStatus.Draft) {
      throw new AppError(400, 'Only draft challans can be edited');
    }

    if (req.body.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: req.body.customerId } });
      if (!customer) throw new AppError(404, 'Customer not found');
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.customerId) updateData.customerId = req.body.customerId;

    if (req.body.lineItems) {
      const builtItems = await buildLineItems(req.body.lineItems);
      updateData.totalQuantity = builtItems.reduce((sum, item) => sum + item.quantity, 0);

      await prisma.challanLineItem.deleteMany({ where: { challanId: existing.id } });
      updateData.lineItems = { create: builtItems };
    }

    const challan = await prisma.challan.update({
      where: { id: paramId(req.params.id) },
      data: updateData,
      include: {
        lineItems: true,
        customer: { select: { id: true, name: true, businessName: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.json(challan);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/confirm', authorize('manage_challans'), async (req, res, next) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: paramId(req.params.id) },
      include: { lineItems: true },
    });

    if (!challan) throw new AppError(404, 'Challan not found');
    if (challan.status !== ChallanStatus.Draft) {
      throw new AppError(400, 'Only draft challans can be confirmed');
    }

    const lineItems = challan.lineItems;

    const result = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new AppError(400, `Product not found: ${item.productNameSnapshot}`);
        }
        if (item.quantity > product.currentStock) {
          throw new AppError(
            400,
            `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`
          );
        }
      }

      for (const item of lineItems) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: MovementType.OUT,
            reason: challan.challanNumber,
            createdBy: req.user!.userId,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }

      return tx.challan.update({
        where: { id: challan.id },
        data: { status: ChallanStatus.Confirmed },
        include: {
          lineItems: true,
          customer: { select: { id: true, name: true, businessName: true } },
          creator: { select: { id: true, name: true } },
        },
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authorize('manage_challans'), async (req, res, next) => {
  try {
    const challan = await prisma.challan.findUnique({ where: { id: paramId(req.params.id) } });
    if (!challan) throw new AppError(404, 'Challan not found');

    if (challan.status === ChallanStatus.Cancelled) {
      throw new AppError(400, 'Challan is already cancelled');
    }

    if (challan.status === ChallanStatus.Confirmed) {
      throw new AppError(400, 'Confirmed challans cannot be cancelled');
    }

    const updated = await prisma.challan.update({
      where: { id: paramId(req.params.id) },
      data: { status: ChallanStatus.Cancelled },
      include: {
        lineItems: true,
        customer: { select: { id: true, name: true, businessName: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
