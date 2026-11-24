import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { clearCheckoutIntent, readCheckoutIntent, saveCheckoutIntent, orderQuery, orderDate,
  clearCheckoutPromotion, readCheckoutPromotion } from './orders.js';

beforeEach(() => {
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
});
test('an uncertain checkout retains the same full payload and stays scoped to the account', () => {
  const payload = { requestKey: 'request-0001', quoteFingerprint: 'a'.repeat(64),
    deliveryAddress: 'Demo', promotionId: 17 };
  saveCheckoutIntent(1, payload);
  assert.deepEqual(readCheckoutIntent(1).payload, payload);
  assert.equal(readCheckoutIntent(2), null);
  clearCheckoutIntent(1);
  assert.equal(readCheckoutIntent(1), null);
});
test('checkout uses the Cart voucher key and clears only the completed selection', () => {
  const key = 'checkout.promotionId';
  for (const value of ['0', '-1', '2.5', 'wrong', '2147483648']) {
    sessionStorage.setItem(key, value);
    assert.equal(readCheckoutPromotion(), null);
  }
  sessionStorage.setItem(key, '17');
  assert.equal(readCheckoutPromotion(), 17);
  clearCheckoutPromotion(18);
  assert.equal(readCheckoutPromotion(), 17);
  clearCheckoutPromotion(17);
  assert.equal(readCheckoutPromotion(), null);
});
test('malformed recovery data does not become a checkout request', () => {
  sessionStorage.setItem('bkpee.checkout.intent.1', '{broken');
  assert.equal(readCheckoutIntent(1), null);
  sessionStorage.setItem('bkpee.checkout.intent.1', JSON.stringify({ payload: { requestKey: 'missing-quote' } }));
  assert.equal(readCheckoutIntent(1), null);
});
test('filters retain status and both dates when changing the page', () => {
  const query = new URLSearchParams(orderQuery({ status: 'PENDING', from: '2026-11-01', to: '2026-11-16' }, 2));
  assert.equal(query.get('page'), '2'); assert.equal(query.get('size'), '10');
  assert.equal(query.get('status'), 'PENDING'); assert.equal(query.get('to'), '2026-11-16');
});
test('database-local timestamps are displayed without inventing a timezone conversion', () => {
  assert.equal(orderDate('2026-11-16T10:20:30.123'), '2026-11-16 10:20:30');
  assert.equal(orderDate(null), '—');
});
