"""Local opt-in: create one NEW Seller with real BCrypt; never reset existing seeds."""
import getpass
import os
from pathlib import Path
import shutil
import subprocess

env = os.environ.copy()
for key, label in [('USERNAME', 'Username mới'), ('EMAIL', 'Email'), ('FIRST_NAME', 'Tên'),
                   ('LAST_NAME', 'Họ'), ('PHONE', 'Điện thoại'), ('CCCD', 'CCCD/CMND'),
                   ('SHOP_NAME', 'Tên shop mới'), ('BANK_ACCOUNT', 'Tài khoản ngân hàng demo')]:
    env['DEMO_' + key] = input(label + ': ').strip()
env['DEMO_PASSWORD'] = getpass.getpass('Mật khẩu mới (không lưu file): ')
mvn = shutil.which('mvn.cmd') or shutil.which('mvn')
if not mvn:
    raise SystemExit('Không tìm thấy Maven')
raise SystemExit(subprocess.run([mvn, 'spring-boot:run',
    '-Dspring-boot.run.arguments=--spring.profiles.active=demo-account --server.port=0 --debug=false --logging.level.root=WARN', '-q'],
    cwd=Path(__file__).resolve().parents[1], env=env).returncode)
