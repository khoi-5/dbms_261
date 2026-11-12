const positiveInteger = (value, fallback) => /^\d+$/.test(String(value)) && Number(value) > 0 ? Number(value) : fallback;
export const CATALOG_MAX_PAGE_SIZE = positiveInteger(import.meta.env?.VITE_CATALOG_MAX_PAGE_SIZE, 48);
export const CATALOG_PAGE_SIZE = Math.min(positiveInteger(import.meta.env?.VITE_CATALOG_PAGE_SIZE, 12), CATALOG_MAX_PAGE_SIZE);

export function normalizeCatalogParams(source) {
  const params = new URLSearchParams(source);
  const page = params.get('page');
  const size = params.get('size');
  params.set('page', /^\d+$/.test(page || '') && Number(page) <= 100000 ? String(Number(page)) : '0');
  params.set('size', /^\d+$/.test(size || '') && Number(size) >= 1 && Number(size) <= CATALOG_MAX_PAGE_SIZE ? String(Number(size)) : String(CATALOG_PAGE_SIZE));
  if (params.has('keyword')) {
    const keyword = params.get('keyword').trim().normalize('NFC');
    if (keyword) params.set('keyword', keyword); else params.delete('keyword');
  }
  return params;
}

export function validQuantity(value, stock) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= stock;
}
