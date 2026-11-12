"""Create a NEW isolated SQL database and seed it. Never targets BKPEE_DB.
Usage: python scripts/prepare_upgrade_test_db.py BKPEE_TEST_<unique_suffix>
Requires Windows sqlcmd access; preserves the test DB for inspection.
"""
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import argparse

root = Path(__file__).resolve().parents[2]
command = ['sqlcmd', '-S', 'localhost,1433', '-E', '-C', '-b', '-r', '1', '-f', '65001']


def run(sql, database):
    # sqlcmd stdin on Windows can use the OEM code page despite -f. Use a BOM file.
    with tempfile.TemporaryDirectory(prefix='bkpee_test_sql_') as directory:
        script = Path(directory) / 'test-only.sql'
        script.write_text(sql, encoding='utf-8-sig')
        result = subprocess.run(command + ['-d', database, '-i', str(script)], text=True,
                                encoding='utf-8', errors='replace', capture_output=True)
    if result.returncode:
        print(result.stdout)
        print(result.stderr)
        raise SystemExit(result.returncode)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('database')
    parser.add_argument('--original-benchmark', action='store_true', help='Keep the original dataset in a separate test DB; never execute the backup directly')
    args = parser.parse_args()
    name = args.database
    if not re.fullmatch(r'BKPEE_TEST_[A-Za-z0-9_]+', name):
        raise SystemExit('Target must be a NEW database with BKPEE_TEST_ prefix.')
    run("IF DB_ID(N'" + name + "') IS NOT NULL THROW 51000,'Test database already exists; choose a new name.',1;", 'master')
    schema = (root / 'database/01_schema.sql').read_text(encoding='utf-8-sig').replace('BKPEE_DB', name)
    assert 'BKPEE_DB' not in schema
    run(schema, 'master')
    seed_file = '03_seed_large.backup.sql' if args.original_benchmark else '03_seed_large.sql'
    seed = (root / 'database' / seed_file).read_text(encoding='utf-8-sig')
    if args.original_benchmark:
        # The unchanged backup contains USE BKPEE_DB. Redirect IN MEMORY before execution.
        seed = seed.replace('BKPEE_DB', name)
        assert 'BKPEE_DB' not in seed
    run(seed, name)
    print('Created and validated isolated database:', name)
    print('Seed: Product=3000, Variant=9000; original website database untouched.')
