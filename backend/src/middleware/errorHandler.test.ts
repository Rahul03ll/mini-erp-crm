import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, validateBody, getPagination, paramId } from './errorHandler';

describe('Error Handler & Utilities', () => {
  it('AppError stores statusCode and message', () => {
    const err = new AppError(404, 'Not found', [{ field: 'id', message: 'invalid' }]);
    assert.strictEqual(err.statusCode, 404);
    assert.strictEqual(err.message, 'Not found');
    assert.strictEqual(err.name, 'AppError');
    assert.deepStrictEqual(err.details, [{ field: 'id', message: 'invalid' }]);
  });

  it('validateBody passes valid payload', () => {
    const schema = z.object({
      name: z.string().min(1),
      count: z.number().int().positive(),
    });

    const req = { body: { name: 'Item', count: 5 } } as Request;
    let nextCalled = false;

    validateBody(schema)(req, {} as Response, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.body.name, 'Item');
    assert.strictEqual(req.body.count, 5);
  });

  it('validateBody passes AppError(400) on validation error', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = { body: { email: 'not-an-email' } } as Request;
    let error: unknown = null;

    validateBody(schema)(req, {} as Response, (err) => {
      error = err;
    });

    assert.ok(error instanceof AppError);
    assert.strictEqual((error as AppError).statusCode, 400);
    assert.strictEqual((error as AppError).message, 'Validation failed');
  });

  it('getPagination returns default values when query is empty', () => {
    const pagination = getPagination({});
    assert.strictEqual(pagination.page, 1);
    assert.strictEqual(pagination.limit, 10);
    assert.strictEqual(pagination.skip, 0);
  });

  it('getPagination handles custom page and limit with boundaries', () => {
    const p1 = getPagination({ page: '3', limit: '25' });
    assert.strictEqual(p1.page, 3);
    assert.strictEqual(p1.limit, 25);
    assert.strictEqual(p1.skip, 50);

    // Clamps minimums
    const p2 = getPagination({ page: '-5', limit: '0' });
    assert.strictEqual(p2.page, 1);
    assert.strictEqual(p2.limit, 1);
    assert.strictEqual(p2.skip, 0);

    // Clamps maximum limit to 100
    const p3 = getPagination({ page: '1', limit: '500' });
    assert.strictEqual(p3.limit, 100);
  });

  it('paramId extracts string correctly whether string or array', () => {
    assert.strictEqual(paramId('single-id'), 'single-id');
    assert.strictEqual(paramId(['first-id', 'second-id']), 'first-id');
  });
});
