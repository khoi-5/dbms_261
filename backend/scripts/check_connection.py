"""Read-only HTTP diagnostics. No account/cart/seed writes.
API_BASE overrides http://localhost:8080/api; FRONTEND_ORIGIN defaults to localhost:5173.
"""
import json
import os
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get('API_BASE', 'http://localhost:8080/api').rstrip('/')
ORIGIN = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')


def request(path, method='GET', body=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={'Origin': ORIGIN, **({'Content-Type': 'application/json'} if body is not None else {}), **(headers or {})})
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        payload = response.read()
        try:
            data = json.loads(payload) if payload else None
        except ValueError:
            data = None
        return response.status, response.headers, data


for path in ('/products', '/categories'):
    status, headers, data = request(path)
    assert status == 200, (path, status)
    assert headers.get('Access-Control-Allow-Origin') == ORIGIN, 'GET CORS missing'
    assert 'application/json' in headers.get('Content-Type', ''), 'Expected JSON'
    if path == '/products':
        assert isinstance(data.get('items'), list) and len(data['items']) <= data['size']
        assert data['size'] == 12
        assert data['totalPages'] == (data['totalElements'] + data['size'] - 1) // data['size']
        print(path, status, {key: data[key] for key in ('totalElements', 'totalPages', 'size')})
    else:
        assert isinstance(data, list)
        print(path, status, 'categories=' + str(len(data)))

for method, path in [('GET', '/products'), ('POST', '/auth/login'), ('POST', '/auth/register'),
                     ('POST', '/buyer/cart/items'), ('PUT', '/buyer/cart/items/1'), ('DELETE', '/buyer/cart/items/1')]:
    status, headers, _ = request(path, 'OPTIONS', headers={
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': 'authorization,content-type'})
    assert status == 200 and headers.get('Access-Control-Allow-Origin') == ORIGIN, 'Preflight failed'
    assert method in headers.get('Access-Control-Allow-Methods', '')
    allowed = headers.get('Access-Control-Allow-Headers', '').lower()
    assert 'authorization' in allowed and 'content-type' in allowed
    print('CORS OPTIONS', method, path, status)

status, headers, _ = request('/products', headers={'Origin': 'https://untrusted.example'})
assert status == 403 and headers.get('Access-Control-Allow-Origin') is None
assert request('/accounts/me')[0] == 401
assert request('/buyer/cart')[0] == 401  # Denied before the cart service, no lazy INSERT.
assert request('/auth/login', 'POST', {'identity': 'absent_' + uuid.uuid4().hex, 'password': 'not-a-real-password'})[0] == 401
assert request('/auth/register', 'POST', {})[0] == 400  # Bean validation fails before registration.
print('PASS: JSON, Guest catalog, CORS, invalid login/register, unauthenticated account/cart; no database writes.')
