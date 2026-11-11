import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, tokenStore } from './api.js';

let values;
let expired;
beforeEach(() => {
  values = new Map(); expired = 0;
  globalThis.sessionStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.window = { dispatchEvent: event => { if (event.type === 'auth-expired') expired++; } };
});
test('sends Bearer token and JSON, returns authoritative server response', async () => {
  tokenStore.set('test-token');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://localhost:8080/api/buyer/cart/items');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { variantId: 99, quantity: 1 });
    return { ok: true, status: 200, json: async () => ({ total: 250 }) };
  };
  assert.deepEqual(await api('/buyer/cart/items', { method: 'POST', body: { variantId: 99, quantity: 1 } }), { total: 250 });
});
test('401 clears token and notifies AuthContext', async () => {
  tokenStore.set('expired');
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => null });
  await assert.rejects(api('/accounts/me'), error => error.status === 401);
  assert.equal(tokenStore.get(), null); assert.equal(expired, 1);
});
test('403 reports permission error without pretending to save or logging out', async () => {
  tokenStore.set('valid');
  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => null });
  await assert.rejects(api('/buyer/cart'), error => error.status === 403);
  assert.equal(tokenStore.get(), 'valid'); assert.equal(expired, 0);
});
test('network and business failures are exposed instead of returning mock data', async () => {
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(api('/products'), /offline/);
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Stock exceeded' }) });
  await assert.rejects(api('/buyer/cart/items', { method: 'POST', body: {} }), /Stock exceeded/);
});
test('logout token removal prevents authorization on subsequent requests', async () => {
  tokenStore.set('token'); tokenStore.clear();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  };
  await api('/products');
});
test('Guest sends no Authorization header and parses the paginated catalog JSON', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://localhost:8080/api/products');
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, status: 200, json: async () => ({ items: [{ id: 1 }], totalElements: 3000, totalPages: 250, size: 12 }) };
  };
  const result = await api('/products');
  assert.equal(result.items.length, 1);
  assert.equal(result.totalPages, 250);
});
