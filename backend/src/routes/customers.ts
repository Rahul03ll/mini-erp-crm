import { Router } from 'express';
import { z } from 'zod';
import { CustomerStatus, CustomerType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, AppError, getPagination, paramId } from '../middleware/errorHandler';

const router = Router();

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  address: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
});

const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

router.use(authenticate);
router.use(authorize('manage_customers'));

router.post('/', validateBody(customerSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      },
    });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = String(req.query.search || '').trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { mobileNumber: { contains: search } },
            { businessName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        followUpNotes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!customer) throw new AppError(404, 'Customer not found');
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(customerSchema.partial()), async (req, res, next) => {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: paramId(req.params.id) } });
    if (!existing) throw new AppError(404, 'Customer not found');

    const data = req.body;
    const customer = await prisma.customer.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : data.followUpDate === null ? null : undefined,
      },
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/notes', validateBody(noteSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: paramId(req.params.id) } });
    if (!customer) throw new AppError(404, 'Customer not found');

    const note = await prisma.followUpNote.create({
      data: {
        customerId: paramId(req.params.id),
        content: req.body.content,
        createdBy: req.user!.userId,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
