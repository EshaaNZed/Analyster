"""Quick test of graph endpoint after fix."""
import urllib.request, json

r = urllib.request.urlopen("http://localhost:8000/api/graph/CUST-06492?depth=1")
d = json.loads(r.read())
for n in d["nodes"]:
    print(f"  {n['id']:25s} -> group={n['group']}")
print(f"\nNodes: {d['stats']['total_nodes']}, Edges: {d['stats']['total_edges']}")
