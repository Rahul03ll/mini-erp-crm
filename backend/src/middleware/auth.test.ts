import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Request, Response } from 'express';
import { signToken, authenticate, authorize, AuthPayload } from './auth';
import { AppError } from './errorHandler';

describe('Auth Middleware & RBAC', () => {
  before(() => {
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  const sampleUser: AuthPayload = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'admin@erp.com',
    role: 'Admin',
  };

  it('signToken generates a valid verifiable JWT', () => {
    const token = signToken(sampleUser);
    assert.ok(typeof token === 'string');
    assert.ok(token.split('.').length === 3);
  });

  it('authenticate extracts user from Authorization header', () => {
    const token = signToken(sampleUser);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    let nextError: unknown = null;

    authenticate(req, {} as Response, (err) => {
      nextError = err;
    });

    assert.strictEqual(nextError, undefined);
    assert.deepStrictEqual(req.user?.userId, sampleUser.userId);
    assert.deepStrictEqual(req.user?.role, 'Admin');
  });

  it('authenticate returns 401 when header is missing', () => {
    const req = { headers: {} } as Request;
    let nextError: unknown = null;

    authenticate(req, {} as Response, (err) => {
      nextError = err;
    });

    assert.ok(nextError instanceof AppError);
    assert.strictEqual((nextError as AppError).statusCode, 401);
  });

  it('authenticate returns 401 when token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalid.token.payload' },
    } as unknown as Request;
    let nextError: unknown = null;

    authenticate(req, {} as Response, (err) => {
      nextError = err;
    });

    assert.ok(nextError instanceof AppError);
    assert.strictEqual((nextError as AppError).statusCode, 401);
  });

  it('authorize allows access when user has permission', () => {
    const middleware = authorize('manage_customers');
    const req = {
      user: { userId: '1', email: 'sales@erp.com', role: 'Sales' },
    } as unknown as Request;
    let calledNext = false;

    middleware(req, {} as Response, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, true);
  });

  it('authorize denies access when user lacks permission', () => {
    const middleware = authorize('manage_products');
    const req = {
      user: { userId: '1', email: 'sales@erp.com', role: 'Sales' },
    } as unknown as Request;
    let nextError: unknown = null;

    middleware(req, {} as Response, (err) => {
      nextError = err;
    });

    assert.ok(nextError instanceof AppError);
    assert.strictEqual((nextError as AppError).statusCode, 403);
  });

  it('Accounts role can view_reports but cannot manage_challans', () => {
    const req = {
      user: { userId: '2', email: 'accounts@erp.com', role: 'Accounts' },
    } as unknown as Request;

    let reportsAllowed = false;
    authorize('view_reports')(req, {} as Response, () => {
      reportsAllowed = true;
    });
    assert.strictEqual(reportsAllowed, true);

    let challansError: unknown = null;
    authorize('manage_challans')(req, {} as Response, (err) => {
      challansError = err;
    });
    assert.ok(challansError instanceof AppError);
    assert.strictEqual((challansError as AppError).statusCode, 403);
  });
});
