"""API + SQL upgrade tests, ONLY against a separate seeded BKPEE_TEST_ database.
Set TEST_DATABASE and API_BASE (dedicated test server, e.g. http://localhost:8082/api).
Creates disposable test accounts; no website data is changed. No credentials printed.
"""
import base64
import concurrent.futures
from decimal import Decimal
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid

DATABASE = os.environ.get('TEST_DATABASE', '')
BASE = os.environ.get('API_BASE', '').rstrip('/')
if not re.fullmatch(r'BKPEE_TEST_[A-Za-z0-9_]+', DATABASE) or not BASE:
    raise SystemExit('Set TEST_DATABASE=BKPEE_TEST_<suffix> and API_BASE to the isolated server.')
checks = 0


def check(value, message):
    global checks
    if not value:
        raise AssertionError(message)
    checks += 1


def sql(statement):
    prefix = "SET NOCOUNT ON; IF DB_NAME()<>N'" + DATABASE + "' THROW 51000,'Wrong database',1; "
    result = subprocess.run(['sqlcmd', '-S', 'localhost,1433', '-E', '-C', '-b', '-d', DATABASE,
        '-h', '-1', '-W', '-Q', prefix + statement], capture_output=True, text=True, check=True)
    return result.stdout.strip()


def request(path, body=None, token=None, method=None):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), method=method,
        headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    try:
        response = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        raw = response.read()
        try:
            data = json.loads(raw) if raw else None
        except ValueError:
            data = None
        return response.status, data


# Prove HTTP serves THIS database before any API write, using a unique SQL fixture.
marker = 'BKPEE_marker_' + uuid.uuid4().hex
marker_id = int(sql("INSERT INTO Product(Seller_ID,Category_ID,Product_Name) VALUES(2,11,N'" + marker + "'); "
    "DECLARE @id int=SCOPE_IDENTITY(); INSERT INTO Product_Variant(Product_ID,Price,Quantity_Stock) VALUES(@id,1,5); SELECT @id;"))
try:
    code, result = request('/products?' + urllib.parse.urlencode({'keyword': marker}))
    check(code == 200 and any(p['name'] == marker for p in result['items']), 'HTTP server is not serving the isolated test DB; stop before API writes')
finally:
    sql(f'DELETE FROM Product_Variant WHERE Product_ID={marker_id}; DELETE FROM Product WHERE Product_ID={marker_id};')

code, catalog = request('/products')
check(code == 200 and catalog['size'] == 12 and catalog['totalElements'] == 3000 and catalog['totalPages'] == 250, 'Default catalog contract')
check(len(catalog['items']) == len({p['id'] for p in catalog['items']}), 'Duplicate Product')
check(request('/products?size=24')[1]['totalPages'] == 125, 'Alternate valid size')
check(len(request('/products?page=249')[1]['items']) == 12, 'Last page')
check(request('/products?page=250')[1]['items'] == [], 'Out of range must not fabricate data')
check(request('/products?' + urllib.parse.urlencode({'keyword': ' ' * 300}))[1]['totalElements'] == 3000, 'Normalize before length validation')
book_keyword_total = int(sql('SELECT COUNT(*) FROM Product WHERE Category_ID IN (11,12);'))
for term in ['Sách', unicodedata.normalize('NFD', 'Sách'), '\u00a0Sách\u00a0']:
    check(request('/products?' + urllib.parse.urlencode({'keyword': term}))[1]['totalElements'] == book_keyword_total, 'Vietnamese NFC/NFD/whitespace')
check(request('/products?keyword=sach')[1]['totalElements'] == 0, 'Accent policy silently changed')
for params in ['size=0', 'size=49', 'page=-1', 'page=abc', 'categoryId=abc', 'minPrice=-1', 'minPrice=100&maxPrice=1', 'minPrice=1.001']:
    check(request('/products?' + params)[0] == 400, 'Invalid filter accepted: ' + params)
check(request('/products?minPrice=1.000')[0] == 200, 'Trailing zero scale')
for keyword in ['%', '_', '[', '~', "' OR 1=1 --"]:
    check(request('/products?' + urllib.parse.urlencode({'keyword': keyword}))[1]['totalElements'] == 0, 'LIKE literal/injection failure')
p = catalog['items'][0]
variants = request(f"/products/{p['id']}/variants")[1]
check(min(v['price'] for v in variants) == p['price'], 'MIN variant display mismatch')
filters = urllib.parse.urlencode(dict(keyword=p['name'], categoryId=p['categoryId'], minPrice=p['price'], maxPrice=p['price']))
check(request('/products?' + filters)[1]['items'][0]['id'] == p['id'], 'Combined filters')
print('F08/F09 catalog + Unicode + pagination + SQL contract PASS')


def account():
    suffix = uuid.uuid4().hex[:12]
    password = secrets.token_urlsafe(20)
    body = dict(username='up_' + suffix, email='up_' + suffix + '@example.invalid', password=password,
        confirmPassword=password, firstName='Test', lastName='Buyer', phone='08' + str(secrets.randbelow(10**12)).zfill(12),
        cccd=str(10**11 + secrets.randbelow(9 * 10**11)), roles=['SELLER'])
    check(request('/auth/register', {**body, 'confirmPassword': 'different-value'})[0] == 400, 'Registration confirmation ignored')
    code, session = request('/auth/register', body)
    check(code == 201 and session['account']['roles'] == ['BUYER'], 'Public registration role')
    check(request('/auth/register', body)[0] == 409, 'Duplicate registration')
    for identity in [body['username'], body['email']]:
        check(request('/auth/login', dict(identity=identity, password=password))[0] == 200, 'Login username/email')
    return body, session


a, session = account()
b, other = account()
token, other_token = session['token'], other['token']
aid, bid = session['account']['id'], other['account']['id']
hash_before = sql(f'SELECT password FROM Account WHERE Account_ID={aid};')
check(hash_before.startswith(('$2a$', '$2b$')) and hash_before != a['password'], 'Password is not BCrypt')
check(request('/buyer/profile')[0] == 401 and request('/buyer/cart')[0] == 401, 'Guest access')
check(request('/seller/products', token=token)[0] == 403, 'Buyer role protection')

# Existing empty QA cart removed ONLY in this isolated DB to exercise lazy creation rollback.
sql(f'DELETE FROM Cart WHERE Buyer_ID={aid};')
check(request('/buyer/cart', token=token)[1]['id'] is None, 'GET missing cart must return empty')
check(sql(f'SELECT COUNT(*) FROM Cart WHERE Buyer_ID={aid};') == '0', 'GET inserted a cart')
check(request('/buyer/cart/items', dict(variantId=2147483647, quantity=1), token)[0] == 404, 'Unknown variant')
check(sql(f'SELECT COUNT(*) FROM Cart WHERE Buyer_ID={aid};') == '0', 'Failed mutation did not roll back new Cart')
v = variants[0]
for count, expected in [(1, 1), (3, 4), (2, 6)]:
    code, cart = request('/buyer/cart/items', dict(variantId=v['id'], quantity=count, price=0, total=0, buyerId=bid), token)
    check(code == 200 and cart['totalQuantity'] == expected, 'One/three/repeated add')
    check(sql(f'SELECT Total_product FROM Cart WHERE Buyer_ID={aid};') == str(expected), 'Total_product must be SUM Quantity')
    check(Decimal(str(cart['total'])) == Decimal(str(v['price'])) * expected, 'Server total')
for count in [0, -1, 1.5]:
    check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=count), token)[0] == 400, 'Invalid quantity')
check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=v['stock']), token)[0] == 409, 'Accumulated stock overflow')
check(request('/buyer/cart', token=token)[1]['totalQuantity'] == 6, 'Conflict changed cart')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(lambda _: request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), token), range(2)))
check(all(r[0] == 200 for r in results) and request('/buyer/cart', token=token)[1]['totalQuantity'] == 8, 'Lost concurrent add')
check(request('/buyer/cart?buyerId=' + str(aid), token=other_token)[1]['items'] == [], 'Ownership leak')
path = f"/buyer/cart/items/{v['id']}"
check(request(path, dict(quantity=1), other_token, 'PUT')[0] == 404, 'Cross-Buyer update')
check(request(path, token=other_token, method='DELETE')[0] == 404, 'Cross-Buyer delete')
check(request(path, dict(quantity=3), token, 'PUT')[1]['totalQuantity'] == 3, 'Absolute quantity update')
check(sql(f'SELECT Total_product FROM Cart WHERE Buyer_ID={aid};') == '3', 'Updated SUM Quantity')
check(request(path, token=token, method='DELETE')[1]['totalQuantity'] == 0, 'Delete item')
check(request('/buyer/cart', token=token)[1]['items'] == [], 'Persist cart removal')
try:
    sql(f"UPDATE Product_Variant SET Quantity_Stock=0 WHERE Variant_ID={v['id']};")
    saleable = request(f"/products/{p['id']}/variants")[1]
    new_price = min(row['price'] for row in saleable)
    current_product = request('/products?' + urllib.parse.urlencode({'keyword': p['name']}))[1]['items'][0]
    check(current_product['price'] == new_price and new_price > p['price'], 'MIN did not exclude out-of-stock variant')
    check(all(row['id'] != p['id'] for row in request('/products?' + filters)[1]['items']), 'Price filter disagrees with displayed saleable MIN')
    check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), token)[0] == 409, 'Out-of-stock add')
    sql(f"UPDATE Product_Variant SET Quantity_Stock={v['stock']},Is_Active=0 WHERE Variant_ID={v['id']};")
    check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), token)[0] == 409, 'Inactive variant add')
finally:
    sql(f"UPDATE Product_Variant SET Quantity_Stock={v['stock']},Is_Active=1 WHERE Variant_ID={v['id']};")
print('F10 quantities + SUM + ownership + concurrency + real transaction rollback PASS')

profile = dict(firstName='Tên mới', lastName='Họ mới', address='Địa chỉ thử nghiệm', gender='Nữ', avatar='https://example.invalid/avatar.png')
code, result = request('/buyer/profile', profile, token, 'PUT')
check(code == 200 and result == profile, 'Profile update/Unicode contract')
check(request('/buyer/profile', token=token)[1] == profile, 'Profile persistence')
check(not {'password', 'cccd', 'roles', 'id'}.intersection(result), 'Sensitive profile response')
check(request('/buyer/profile', {**profile, 'gender': 'invalid'}, token, 'PUT')[0] == 400, 'Invalid gender')
check(request('/buyer/profile', {**profile, 'avatar': 'javascript:alert(1)'}, token, 'PUT')[0] == 400, 'Invalid avatar scheme')
check(request('/buyer/profile', {**profile, 'avatar': '/relative'}, token, 'PUT')[0] == 400, 'Relative avatar')
check(request('/buyer/profile', {**profile, 'firstName': ' '}, token, 'PUT')[0] == 400, 'Blank name')
protected = sql(f'SELECT CONCAT(Username,Email,Phone,CCCD,Account_Status,password) FROM Account WHERE Account_ID={aid};')
request('/buyer/profile', {**profile, 'id': bid, 'roles': ['SELLER'], 'email': 'changed@example.invalid', 'phone': 'changed', 'cccd': 'changed', 'password': 'changed', 'status': 'LOCKED'}, token, 'PUT')
check(sql(f'SELECT CONCAT(Username,Email,Phone,CCCD,Account_Status,password) FROM Account WHERE Account_ID={aid};') == protected, 'Profile whitelist breached')
request('/buyer/profile', {**profile, 'firstName': 'Other', 'accountId': aid}, other_token, 'PUT')
check(request('/buyer/profile', token=token)[1]['firstName'] == profile['firstName'], 'Cross-Buyer profile update')
new_password = secrets.token_urlsafe(20)
for old, confirmation in [('wrong', new_password), (a['password'], 'different')]:
    check(request('/buyer/profile/password', dict(currentPassword=old, newPassword=new_password, confirmPassword=confirmation), token)[0] == 400, 'Password validation')
check(request('/buyer/profile/password', dict(currentPassword=a['password'], newPassword='ắ'*30, confirmPassword='ắ'*30), token)[0] == 400, 'UTF-8 BCrypt byte limit')
check(sql(f'SELECT password FROM Account WHERE Account_ID={aid};') == hash_before, 'Failed password change altered hash')
check(request('/buyer/profile/password', dict(currentPassword=a['password'], newPassword=new_password, confirmPassword=new_password), token)[0] == 204, 'Password change')
check(request('/auth/login', dict(identity=a['username'], password=a['password']))[0] == 401, 'Old password still logs in')
check(request('/auth/login', dict(identity=a['username'], password=new_password))[0] == 200, 'New password login')
check(request('/buyer/profile', token=token)[0] == 200, 'Stateless token behavior changed')
check(sql(f'SELECT password FROM Account WHERE Account_ID={aid};') != hash_before, 'New hash not saved')

settings = dict(line.split('=', 1) for line in Path('.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.lstrip().startswith('#'))
key = base64.b64decode(os.environ.get('JWT_SECRET', settings['JWT_SECRET']))
def encode(value):
    return base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b'=')
unsigned = encode({'alg': 'HS256'}) + b'.' + encode({'iss': 'mini-ecommerce', 'sub': str(aid), 'iat': int(time.time())-600, 'exp': int(time.time())-300, 'roles': ['BUYER']})
expired = (unsigned + b'.' + base64.urlsafe_b64encode(hmac.new(key, unsigned, hashlib.sha256).digest()).rstrip(b'=')).decode()
check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=1), expired)[0] == 401, 'Expired JWT add')
check(request('/buyer/cart/items', dict(variantId=v['id'], quantity=1))[0] == 401, 'Logged-out add')
seller_id = int(sql('SELECT TOP(1) Account_ID FROM Seller ORDER BY Account_ID;'))
seller_unsigned = encode({'alg': 'HS256'}) + b'.' + encode({'iss': 'mini-ecommerce', 'sub': str(seller_id), 'iat': int(time.time()), 'exp': int(time.time())+120, 'roles': ['SELLER']})
seller_token = (seller_unsigned + b'.' + base64.urlsafe_b64encode(hmac.new(key, seller_unsigned, hashlib.sha256).digest()).rstrip(b'=')).decode()
check(request('/buyer/profile', token=seller_token)[0] == 403, 'Seller profile access')
print('F01 profile + password + BCrypt + whitelist + JWT expiry PASS')
print('PASS assertions:', checks, '| isolated database:', DATABASE)
