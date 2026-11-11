"""Provision a NEW demo Buyer through the real registration API; no fixed password.
The password is entered privately and hashed by the server. No seed account updated.
"""
import getpass
import json
import os
import urllib.error
import urllib.request

base = os.environ.get('API_BASE', 'http://localhost:8080/api')
body = {key: input(label).strip() for key, label in [
    ('username', 'Username mới: '), ('email', 'Email: '), ('firstName', 'Tên: '),
    ('lastName', 'Họ: '), ('phone', 'Điện thoại: '), ('cccd', 'CCCD/CMND (9 hoặc 12 số): ')]}
body['password'] = getpass.getpass('Mật khẩu mới (8 ký tự trở lên, tối đa 72 byte UTF-8): ')
req = urllib.request.Request(base + '/auth/register', data=json.dumps(body).encode(),
                             headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=20) as response:
        result = json.load(response)
        print('Đã tạo Buyer:', result['account']['username'])
        print('Có thể đăng nhập bằng username/email. Token và mật khẩu không được in hoặc lưu file.')
except urllib.error.HTTPError as error:
    print('Đăng ký thất bại, HTTP', error.code, error.read().decode())
    raise SystemExit(1)
