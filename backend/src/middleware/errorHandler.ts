import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            400,
            'Validation failed',
            error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          )
        );
      } else {
        next(error);
      }
    }
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

export function getPagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
