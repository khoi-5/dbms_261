"""Real HTTP/SQL smoke test. Creates two isolated QA Buyers; never resets seeds.
Run against the newly built backend: python scripts/smoke_buyer.py
Optional API_BASE overrides http://localhost:8080/api. Passwords exist only in memory.
"""
import concurrent.futures
import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
import uuid
from decimal import Decimal

BASE = os.environ.get('API_BASE', 'http://localhost:8080/api')
checks = 0


def check(condition, message):
    global checks
    if not condition:
        raise AssertionError(message)
    checks += 1


def request(path, body=None, token=None, method=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                                 method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


def account():
    suffix = uuid.uuid4().hex[:12]
    body = dict(username='qa_' + suffix, email='qa_' + suffix + '@example.invalid',
                password=secrets.token_urlsafe(20), firstName='QA', lastName='Buyer',
                phone='08' + str(int(suffix, 16)).zfill(18)[-18:],
                cccd=str(secrets.randbelow(900000000000) + 100000000000), role='SELLER', roles=['SELLER'])
    status, data = request('/auth/register', body)
    check(status == 201, 'Register failed: ' + str(status))
    check(data['account']['roles'] == ['BUYER'], 'Public registration must only grant BUYER')
    print('Created QA Buyer:', body['username'])
    for identity in (body['username'], body['email']):
        check(request('/auth/login', dict(identity=identity, password=body['password']))[0] == 200,
              'Username/email login failed')
    check(request('/auth/login', dict(identity=body['username'], password='wrong'))[0] == 401, 'Wrong password accepted')
    check(request('/auth/register', body)[0] == 409, 'Duplicate accepted')
    check(request('/accounts/me', token=data['token'])[1]['id'] == data['account']['id'], 'Wrong current account')
    check(request('/seller/products', token=data['token'])[0] == 403, 'Buyer accessed Seller API')
    return data['token']


status, catalog = request('/products')
check(status == 200, 'Guest catalog failed')
check(0 < len(catalog['items']) <= 12, 'Missing products or unbounded page')
check(len(set(p['id'] for p in catalog['items'])) == len(catalog['items']), 'Duplicate Product')
check(request('/categories')[0] == 200, 'Guest categories failed')
p = catalog['items'][0]
query = urllib.parse.urlencode(dict(keyword=p['name'], categoryId=p['categoryId'], minPrice=p['price'], maxPrice=p['price']))
filtered = request('/products?' + query)
check(filtered[0] == 200 and any(x['id'] == p['id'] for x in filtered[1]['items']), 'Combined filters failed')
check(all(x['categoryId'] == p['categoryId'] and x['price'] == p['price'] for x in filtered[1]['items']), 'Filter mismatch')
second = request('/products?page=1')[1]
check(not set(x['id'] for x in second['items']) & set(x['id'] for x in catalog['items']), 'Pagination overlaps')
for bad in ('minPrice=-1', 'minPrice=10&maxPrice=1', 'size=3000', 'page=-1', 'minPrice=1.001'):
    check(request('/products?' + bad)[0] == 400, 'Invalid filter accepted: ' + bad)
check(request('/products?keyword=zzzzzzzzzzzznotfound')[1]['items'] == [], 'Empty result failed')
check(request('/products?keyword=%25')[1]['items'] == [], 'LIKE wildcard was not escaped')
status, variants = request('/products/' + str(p['id']) + '/variants')
check(status == 200 and all(v['stock'] > 0 for v in variants), 'Variant saleability failed')
v = variants[0]
check(Decimal(str(min(x['price'] for x in variants))) == Decimal(str(p['price'])), 'Displayed minimum price mismatch')
print('F08/F09 PASS; catalog total:', catalog['totalElements'])

token, other = account(), account()
check(request('/accounts/me')[0] == 401, 'Anonymous account allowed')
check(request('/buyer/cart')[0] == 401, 'Anonymous cart allowed')
check(request('/buyer/cart', token='invalid')[0] == 401, 'Invalid JWT allowed')
check(request('/buyer/cart', token=token)[1]['items'] == [], 'New cart not empty')
status, cart = request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), token)
check(status == 200, 'Add cart failed: ' + str(cart))
check(cart['items'][0]['variantId'] == v['id'], 'Product/Variant IDs confused')
check(Decimal(str(cart['total'])) == Decimal(str(v['price'])), 'Backend total mismatch')
check(request('/buyer/cart', token=token)[1]['items'][0]['quantity'] == 1, 'Cart not persisted')
check(request('/buyer/cart?buyerId=1', token=other)[1]['items'] == [], 'Buyer ID injection leaked cart')
path = '/buyer/cart/items/' + str(v['id'])
check(request(path, token=other, method='DELETE')[0] == 404, 'Other Buyer deleted cart item')
check(request(path, dict(quantity=1), other, 'PUT')[0] == 404, 'Other Buyer updated cart item')
for quantity in (0, -1, 1.5, 2147483648):
    check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=quantity), token)[0] == 400, 'Invalid quantity accepted')
check(request('/buyer/cart/items', dict(variantId=1.5, quantity=1), token)[0] == 400, 'Fractional variant ID accepted')
check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=v['stock'] + 1), token)[0] == 409, 'Stock overflow accepted')
check(request(path, dict(quantity=1), token, 'PUT')[0] == 200, 'Update failed')
if v['stock'] >= 3:
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), token), range(2)))
    check(all(r[0] == 200 for r in results), 'Concurrent add failed')
    check(request('/buyer/cart', token=token)[1]['items'][0]['quantity'] == 3, 'Concurrent add lost quantity')
check(request(path, token=token, method='DELETE')[1]['items'] == [], 'Remove failed')
check(request('/buyer/cart', token=token)[1]['total'] == 0, 'Empty cart total wrong')
print('F01/F10 PASS; assertions:', checks)
print('QA accounts retained; test cart items removed. No seed product/account modified.')
