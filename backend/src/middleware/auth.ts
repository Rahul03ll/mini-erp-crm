import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

type Permission =
  | 'manage_customers'
  | 'manage_products'
  | 'manage_challans'
  | 'view_reports';

const rolePermissions: Record<Role, Permission[]> = {
  Admin: ['manage_customers', 'manage_products', 'manage_challans', 'view_reports'],
  Sales: ['manage_customers', 'manage_challans'],
  Warehouse: ['manage_products'],
  Accounts: ['view_reports'],
};

export function authorize(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    const userPermissions = rolePermissions[req.user.role];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}

export function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
}
