import sqlite3
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(base_dir, "instagram.db")
file_size = os.path.getsize(db_path)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]

stats = []
total_records = 0

for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    cnt = cur.fetchone()[0]
    total_records += cnt
    stats.append((t, cnt))

print(f"FILE_SIZE: {file_size} bytes ({file_size / (1024 * 1024):.2f} MB)")
print(f"TOTAL_TABLES: {len(tables)}")
print(f"TOTAL_RECORDS: {total_records}")
print("--- TABLES ---")
for t, cnt in stats:
    print(f"{t}: {cnt}")
