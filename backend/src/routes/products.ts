import { Router } from 'express';
import { z } from 'zod';
import { MovementType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, AppError, getPagination, paramId } from '../middleware/errorHandler';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  minStockAlert: z.number().int().min(0).optional(),
  location: z.string().optional(),
});

const productUpdateSchema = productSchema.partial().omit({ sku: true }).extend({
  sku: z.string().min(1).optional(),
});

const stockMovementSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().min(1, 'Reason is required'),
});

router.use(authenticate);
router.use(authorize('manage_products'));

router.post('/', validateBody(productSchema), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { sku: req.body.sku } });
    if (existing) throw new AppError(400, 'SKU already exists');

    const product = await prisma.product.create({
      data: {
        ...req.body,
        currentStock: 0,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new AppError(400, 'SKU already exists'));
    }
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = String(req.query.search || '').trim();
    const lowStock = req.query.lowStock === 'true';

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lowStock) {
      const allProducts = await prisma.product.findMany({
        where: search ? where : undefined,
        orderBy: { createdAt: 'desc' },
      });
      const filtered = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
      const paginated = filtered.slice(skip, skip + limit);
      return res.json({
        data: paginated,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      });
    }

    const products = await prisma.product.findMany({
      where: search ? where : undefined,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.product.count({ where: search ? where : undefined });

    res.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: paramId(req.params.id) } });
    if (!product) throw new AppError(404, 'Product not found');
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(productUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: paramId(req.params.id) } });
    if (!existing) throw new AppError(404, 'Product not found');

    if (req.body.sku && req.body.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: req.body.sku } });
      if (skuExists) throw new AppError(400, 'SKU already exists');
    }

    const { currentStock: _, ...updateData } = req.body;
    const product = await prisma.product.update({
      where: { id: paramId(req.params.id) },
      data: updateData,
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stock-movement', validateBody(stockMovementSchema), async (req, res, next) => {
  try {
    const { quantityChanged, movementType, reason } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: paramId(req.params.id) } });
      if (!product) throw new AppError(404, 'Product not found');

      const delta = movementType === 'IN' ? quantityChanged : -quantityChanged;
      const newStock = product.currentStock + delta;

      if (newStock < 0) {
        throw new AppError(
          400,
          `Insufficient stock. Available: ${product.currentStock}, Requested: ${quantityChanged}`
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged,
          movementType,
          reason,
          createdBy: req.user!.userId,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: newStock },
      });

      return { movement, product: updatedProduct };
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stock-movements', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: paramId(req.params.id) } });
    if (!product) throw new AppError(404, 'Product not found');

    const { page, limit, skip } = getPagination(req.query);

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId: paramId(req.params.id) },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.stockMovement.count({ where: { productId: paramId(req.params.id) } }),
    ]);

    res.json({
      data: movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
