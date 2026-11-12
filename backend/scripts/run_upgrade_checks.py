"""Run write tests on an existing isolated test DB, then stop only our test server.
Usage: python -u scripts/run_upgrade_checks.py BKPEE_TEST_<suffix>
Does not prepare/reset the DB; use prepare_upgrade_test_db.py on a new DB first.
"""
import json
import os
from pathlib import Path
import re
import secrets
import base64
import shutil
import subprocess
import sys
import time
import socket
import argparse
import urllib.request

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('database')
parser.add_argument('--skip-build', action='store_true', help='Use the existing built JAR during test iteration')
parser.add_argument('--upgrade-only', action='store_true', help='Run only the upgrade API/SQL checks')
args = parser.parse_args()
name = args.database
if not re.fullmatch(r'BKPEE_TEST_[A-Za-z0-9_]+', name):
    raise SystemExit('Refusing tests outside a BKPEE_TEST_ database.')
settings = dict(line.split('=', 1) for line in (root / '.env').read_text(encoding='utf-8-sig').splitlines()
                if '=' in line and not line.lstrip().startswith('#'))
url = os.environ.get('DB_URL', settings['DB_URL'])
if not re.search(r'(?i)databaseName=[^;]+', url):
    raise SystemExit('DB_URL must explicitly specify databaseName')
env = os.environ.copy()
env.update(DB_URL=re.sub(r'(?i)databaseName=[^;]+', 'databaseName=' + name, url), DB_NAME=name,
           JWT_SECRET=base64.b64encode(secrets.token_bytes(32)).decode(), RUN_SQL_INTEGRATION='true',
           TEST_DATABASE=name, API_BASE='http://localhost:8082/api', PYTHONDONTWRITEBYTECODE='1')
print('SQL WRITE TEST TARGET:', name, flush=True)
try:
    connection = socket.create_connection(('localhost', 8082), timeout=1)
except OSError:
    pass
else:
    connection.close()
    raise SystemExit('Test port 8082 is occupied; no existing process was stopped.')
mvn = shutil.which('mvn.cmd') or shutil.which('mvn')
if not args.skip_build:
    subprocess.run([mvn, 'clean', 'package', '-q'], cwd=root, env=env, check=True)
jar = root / 'target/mini-ecommerce-0.0.1-SNAPSHOT.jar'
log_path = root / 'target/upgrade-test-server.log'
with log_path.open('w', encoding='utf-8') as log:
    process = subprocess.Popen(['java', '-jar', str(jar), '--server.port=8082', '--debug=false', '--logging.level.root=WARN'],
        cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
    try:
        for _ in range(60):
            if process.poll() is not None:
                raise RuntimeError('Test server exited; inspect target/upgrade-test-server.log')
            try:
                with urllib.request.urlopen(env['API_BASE'] + '/products', timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(1)
        else:
            raise RuntimeError('Test server readiness timeout')
        for script in (['test_buyer_upgrade.py'] if args.upgrade_only else ['test_buyer_upgrade.py', 'smoke_buyer.py']):
            subprocess.run([sys.executable, '-u', str(root / 'scripts' / script)], cwd=root, env=env, check=True)
        print('All Maven + existing smoke + upgrade API/SQL checks passed on', name, flush=True)
    finally:
        process.terminate()
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        print('Stopped owned test server PID', process.pid, flush=True)
