import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Challan Stock Aggregation & Consolidation Logic', () => {
  it('correctly consolidates duplicate line items for the same product', () => {
    const rawItems = [
      { productId: 'prod-A', quantity: 5 },
      { productId: 'prod-B', quantity: 2 },
      { productId: 'prod-A', quantity: 7 },
    ];

    const consolidatedMap = new Map<string, number>();
    for (const item of rawItems) {
      consolidatedMap.set(
        item.productId,
        (consolidatedMap.get(item.productId) || 0) + item.quantity
      );
    }
    const consolidated = Array.from(consolidatedMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    assert.strictEqual(consolidated.length, 2);
    assert.deepStrictEqual(
      consolidated.find((i) => i.productId === 'prod-A'),
      { productId: 'prod-A', quantity: 12 }
    );
    assert.deepStrictEqual(
      consolidated.find((i) => i.productId === 'prod-B'),
      { productId: 'prod-B', quantity: 2 }
    );
  });

  it('detects insufficient stock when cumulative line quantities exceed available stock', () => {
    // Product has 8 units in stock
    const productStock = {
      'prod-A': 8,
      'prod-B': 20,
    };

    // Challan requests 5 units, then 6 units of prod-A (total = 11 > 8)
    const lineItems = [
      { productId: 'prod-A', quantity: 5 },
      { productId: 'prod-B', quantity: 3 },
      { productId: 'prod-A', quantity: 6 },
    ];

    const productQuantities = new Map<string, number>();
    for (const item of lineItems) {
      productQuantities.set(
        item.productId,
        (productQuantities.get(item.productId) || 0) + item.quantity
      );
    }

    let errorDetected = false;
    let failedProduct = '';
    let available = 0;
    let requested = 0;

    for (const [productId, totalRequested] of productQuantities.entries()) {
      const stock = productStock[productId as keyof typeof productStock];
      if (totalRequested > stock) {
        errorDetected = true;
        failedProduct = productId;
        available = stock;
        requested = totalRequested;
        break;
      }
    }

    assert.strictEqual(errorDetected, true);
    assert.strictEqual(failedProduct, 'prod-A');
    assert.strictEqual(available, 8);
    assert.strictEqual(requested, 11);
  });
});
