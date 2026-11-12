import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_PAGE_SIZE, CATALOG_MAX_PAGE_SIZE, normalizeCatalogParams, validQuantity } from './catalog.js';
test('catalog normalizes invalid page and size and explicitly sends configured defaults', () => {
  const query = normalizeCatalogParams('page=-1&size=999&keyword=%20Sa%CC%81ch%20');
  assert.equal(query.get('page'), '0'); assert.equal(query.get('size'), String(CATALOG_PAGE_SIZE));
  assert.equal(query.get('keyword'), 'Sách');
  assert.equal(normalizeCatalogParams('page=abc&size=0').get('page'), '0');
  assert.equal(normalizeCatalogParams('size=24&page=2&categoryId=11').get('size'), '24');
  assert.equal(normalizeCatalogParams('categoryId=11').get('categoryId'), '11');
  assert.equal(normalizeCatalogParams(`size=${CATALOG_MAX_PAGE_SIZE}`).get('size'), String(CATALOG_MAX_PAGE_SIZE));
});
test('purchase quantity accepts one/three and rejects invalid or excessive units', () => {
  for (const input of ['1', '3', '10']) assert.equal(validQuantity(input, 10), true);
  for (const input of ['', '0', '-1', '1.5', '1e2', '11', 'abc', '9007199254740993']) assert.equal(validQuantity(input, 10), false);
});
