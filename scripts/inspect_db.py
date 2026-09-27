"""Inspect view definition and policy schema."""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "claims_intelligence.db")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Full view SQL
print("=== FULL VIEW SQL ===")
for (sql,) in cur.execute("SELECT sql FROM sqlite_master WHERE name='v_claims_full_dossier'"):
    print(sql)

print("\n=== dim_policies schema ===")
for col in cur.execute("PRAGMA table_info(dim_policies)"):
    print(f"  {col}")
count = cur.execute("SELECT COUNT(*) FROM dim_policies").fetchone()[0]
print(f"  Row count: {count}")

print("\n=== SAMPLE POLICY ===")
cur.execute("SELECT * FROM dim_policies LIMIT 1")
cols = [d[0] for d in cur.description]
row = cur.fetchone()
if row:
    for c, v in zip(cols, row):
        print(f"  {c}: {v}")

print("\n=== fact_claims schema ===")
for col in cur.execute("PRAGMA table_info(fact_claims)"):
    print(f"  {col}")

# Count claims by risk_label
print("\n=== Claims by risk_label ===")
for row in cur.execute("SELECT risk_label, COUNT(*) as cnt FROM fact_claims GROUP BY risk_label ORDER BY cnt DESC"):
    print(f"  {row}")

conn.close()
