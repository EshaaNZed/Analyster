"""Quick API endpoint test script."""
import urllib.request
import json

BASE = "http://localhost:8000/api"

def test(name, url):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"URL:  {url}")
    print(f"{'='*60}")
    try:
        r = urllib.request.urlopen(url)
        d = json.loads(r.read())
        print(json.dumps(d, indent=2)[:1000])
        print("STATUS: PASS")
    except Exception as e:
        print(f"STATUS: FAIL - {e}")

# 1. Health
test("Health Check", f"{BASE}/health")

# 2. Dashboard stats
test("Dashboard Stats", f"{BASE}/dashboard/stats")

# 3. Claims list with high risk filter
test("Claims List (High Risk, page 1, size 3)", f"{BASE}/claims?page=1&page_size=3&risk_label=High")

# 4. Single claim detail
test("Claim Detail", f"{BASE}/claims/CLM-2024-00001")

# 5. Filters
test("Filter Options", f"{BASE}/filters")

# 6. Customer claims
test("Customer Claims", f"{BASE}/customers/CUST-06492/claims")

# 7. Customer policies
test("Customer Policies", f"{BASE}/customers/CUST-06492/policies")

# 8. Graph subgraph
test("Graph Subgraph (CUST-06492, depth 1)", f"{BASE}/graph/CUST-06492?depth=1")

print("\n" + "="*60)
print("ALL ENDPOINT TESTS COMPLETE")
print("="*60)
