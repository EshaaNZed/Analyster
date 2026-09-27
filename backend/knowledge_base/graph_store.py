"""
NetworkX Knowledge Graph Builder — Insurance Domain Ontology
=============================================================
Constructs an in-memory directed property graph with nodes for:
  Customer  ->  Policy  ->  Claim  ->  IncidentType  ->  RiskCluster

Provides:
 - build_knowledge_graph()       -> construct & persist GraphML
 - get_customer_subgraph()       -> 2-hop neighbourhood for a customer
 - get_claim_context_subgraph()  -> full context for a single claim
 - detect_suspicious_clusters()  -> community-level fraud ring detection
 - get_graph_stats()             -> summary metrics for architecture diagram
"""
import os
import json
import sqlite3
import warnings
from typing import List, Dict, Any, Optional, Tuple

import networkx as nx
import pandas as pd

warnings.filterwarnings("ignore")

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
GRAPH_DIR    = os.path.join(BASE_DIR, "data", "graph_store")
DB_PATH      = os.path.join(PROCESSED_DIR, "claims_intelligence.db")
GRAPHML_PATH = os.path.join(GRAPH_DIR, "insurance_knowledge_graph.graphml")
JSON_PATH    = os.path.join(GRAPH_DIR, "graph_summary.json")

os.makedirs(GRAPH_DIR, exist_ok=True)

# --------------------------------------------------------------------------- #
# Node type constants
# --------------------------------------------------------------------------- #
NODE_CUSTOMER      = "Customer"
NODE_POLICY        = "Policy"
NODE_CLAIM         = "Claim"
NODE_INCIDENT_TYPE = "IncidentType"
NODE_RISK_CLUSTER  = "RiskCluster"
NODE_HOUSEHOLD     = "HouseholdCluster"

EDGE_OWNS          = "OWNS_POLICY"
EDGE_HAS_CLAIM     = "HAS_CLAIM"
EDGE_INCIDENT_OF   = "INCIDENT_OF_TYPE"
EDGE_BELONGS_TO    = "BELONGS_TO_HOUSEHOLD"
EDGE_FLAGGED_BY    = "FLAGGED_BY_RISK_CLUSTER"
EDGE_SIMILAR_TO    = "SIMILAR_CLAIM_PATTERN"


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _load_all_data(db_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load customers, policies, claims from SQLite."""
    conn = sqlite3.connect(db_path)
    df_cust   = pd.read_sql_query("SELECT * FROM dim_customers LIMIT 2000", conn)
    df_pol    = pd.read_sql_query("SELECT * FROM dim_policies", conn)
    df_claims = pd.read_sql_query("SELECT * FROM fact_claims", conn)
    conn.close()
    return df_cust, df_pol, df_claims


def _add_customer_nodes(G: nx.DiGraph, df_cust: pd.DataFrame):
    for _, row in df_cust.iterrows():
        G.add_node(
            row["customer_id"],
            node_type=NODE_CUSTOMER,
            subtype=str(row.get("customer_subtype_name", "")),
            main_type=str(row.get("customer_main_type_name", "")),
            age_group=str(row.get("age_group_desc", "")),
            household_size=int(row.get("household_size", 0)),
            purchasing_power=int(row.get("purchasing_power_tier", 0)),
            annual_spend_usd=float(row.get("est_annual_insurance_spend_usd", 0.0)),
            total_policies=int(row.get("total_active_policies_count", 0)),
            household_cluster=str(row.get("household_cluster_signature", "")),
            has_auto=bool(row.get("has_auto_policy", False)),
            has_fire=bool(row.get("has_fire_policy", False)),
            has_boat=bool(row.get("has_boat_policy", False)),
        )


def _add_policy_nodes(G: nx.DiGraph, df_pol: pd.DataFrame):
    for _, row in df_pol.iterrows():
        G.add_node(
            row["policy_id"],
            node_type=NODE_POLICY,
            policy_line=str(row["policy_line"]),
            contribution_tier=int(row.get("contribution_tier", 0)),
            annual_premium_usd=float(row.get("annual_premium_usd", 0.0)),
            coverage_limit_usd=float(row.get("coverage_limit_usd", 0.0)),
        )
        G.add_edge(
            row["customer_id"],
            row["policy_id"],
            edge_type=EDGE_OWNS,
            label="OWNS",
        )


def _add_claim_nodes(G: nx.DiGraph, df_claims: pd.DataFrame):
    for _, row in df_claims.iterrows():
        claim_id = row["claim_id"]
        G.add_node(
            claim_id,
            node_type=NODE_CLAIM,
            policy_line=str(row["policy_line"]),
            incident_type=str(row["incident_type"]),
            incident_severity=str(row["incident_severity"]),
            claim_amount_usd=float(row["claim_amount_usd"]),
            claim_to_limit_ratio=float(row["claim_to_limit_ratio"]),
            filing_delay_days=int(row["filing_delay_days"]),
            claim_status=str(row["claim_status"]),
            risk_label=str(row["risk_label"]),
            is_anomaly=bool(row["is_anomaly_ground_truth"]),
            incident_date=str(row["incident_date"]),
            filing_date=str(row["filing_date"]),
        )

        # Customer -> Claim edge
        G.add_edge(
            row["customer_id"],
            claim_id,
            edge_type=EDGE_HAS_CLAIM,
            label="HAS_CLAIM",
            amount_usd=float(row["claim_amount_usd"]),
        )

        # Policy -> Claim edge
        G.add_edge(
            row["policy_id"],
            claim_id,
            edge_type=EDGE_HAS_CLAIM,
            label="POLICY_COVERS",
        )

        # Claim -> IncidentType node (shared type cluster)
        inc_type_id = f"INC_TYPE::{row['policy_line']}::{row['incident_type']}"
        if not G.has_node(inc_type_id):
            G.add_node(inc_type_id, node_type=NODE_INCIDENT_TYPE,
                       policy_line=row["policy_line"], label=row["incident_type"])
        G.add_edge(claim_id, inc_type_id, edge_type=EDGE_INCIDENT_OF, label="IS_TYPE")

        # Risk cluster node for flagged/anomaly claims
        if bool(row["is_anomaly_ground_truth"]):
            anomaly_reasons = str(row.get("anomaly_reasons", "FLAGGED"))
            risk_cluster_id = f"RISK_CLUSTER::{anomaly_reasons}"
            if not G.has_node(risk_cluster_id):
                G.add_node(risk_cluster_id, node_type=NODE_RISK_CLUSTER,
                           risk_category=anomaly_reasons, severity="High")
            G.add_edge(claim_id, risk_cluster_id, edge_type=EDGE_FLAGGED_BY, label="FLAGGED_BY")


def _add_household_cluster_nodes(G: nx.DiGraph, df_cust: pd.DataFrame):
    """Groups customers by their COIL-2000 household cluster signature."""
    cluster_groups = df_cust.groupby("household_cluster_signature")["customer_id"].apply(list)
    for cluster_sig, members in cluster_groups.items():
        if len(members) < 2:
            continue
        cluster_node_id = f"HH_CLUSTER::{cluster_sig}"
        G.add_node(cluster_node_id, node_type=NODE_HOUSEHOLD,
                   signature=cluster_sig, member_count=len(members))
        for cust_id in members:
            if G.has_node(cust_id):
                G.add_edge(cust_id, cluster_node_id, edge_type=EDGE_BELONGS_TO, label="IN_CLUSTER")


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def build_knowledge_graph(
    db_path: str = DB_PATH,
    graphml_path: str = GRAPHML_PATH,
    force_rebuild: bool = False,
) -> nx.DiGraph:
    """
    Builds the full insurance knowledge graph and persists it as GraphML.
    Returns the in-memory DiGraph.
    """
    if os.path.exists(graphml_path) and not force_rebuild:
        print(f"[KNOWLEDGE GRAPH] Loading cached graph from: {graphml_path}")
        G = nx.read_graphml(graphml_path)
        print(f"[KNOWLEDGE GRAPH] Loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")
        return G

    print("[KNOWLEDGE GRAPH] Building insurance knowledge graph from SQLite...")
    df_cust, df_pol, df_claims = _load_all_data(db_path)

    G = nx.DiGraph(
        name="InsuranceClaimsKnowledgeGraph",
        description="Multi-hop property graph: Customer->Policy->Claim->IncidentType->RiskCluster"
    )

    print(f"  [1/4] Adding {len(df_cust)} Customer nodes...")
    _add_customer_nodes(G, df_cust)

    print(f"  [2/4] Adding {len(df_pol)} Policy nodes + OWNS edges...")
    _add_policy_nodes(G, df_pol)

    print(f"  [3/4] Adding {len(df_claims)} Claim nodes + HAS_CLAIM edges + RiskCluster nodes...")
    _add_claim_nodes(G, df_claims)

    print(f"  [4/4] Adding HouseholdCluster aggregate nodes...")
    _add_household_cluster_nodes(G, df_cust)

    # Persist as GraphML (universal format compatible with Gephi / Cytoscape)
    nx.write_graphml(G, graphml_path)

    # Summary JSON
    summary = get_graph_stats(G)
    with open(JSON_PATH, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"[KNOWLEDGE GRAPH] Built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")
    print(f"[KNOWLEDGE GRAPH] Saved GraphML -> {graphml_path}")
    return G


def get_graph_stats(G: nx.DiGraph) -> Dict[str, Any]:
    """Returns a JSON-serializable summary of the graph for documentation."""
    node_type_counts: Dict[str, int] = {}
    edge_type_counts: Dict[str, int] = {}

    for _, data in G.nodes(data=True):
        ntype = data.get("node_type", "Unknown")
        node_type_counts[ntype] = node_type_counts.get(ntype, 0) + 1

    for _, _, data in G.edges(data=True):
        etype = data.get("edge_type", "Unknown")
        edge_type_counts[etype] = edge_type_counts.get(etype, 0) + 1

    return {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "is_directed":  G.is_directed(),
        "node_types":   node_type_counts,
        "edge_types":   edge_type_counts,
    }


def get_customer_subgraph(
    G: nx.DiGraph,
    customer_id: str,
    depth: int = 2,
) -> Dict[str, Any]:
    """
    Returns the k-hop neighbourhood of a customer node as a serializable dict.
    depth=2 captures: Customer -> Policies -> Claims (+ RiskClusters, IncidentTypes)
    """
    if not G.has_node(customer_id):
        return {"error": f"Customer '{customer_id}' not found in graph."}

    ego   = nx.ego_graph(G, customer_id, radius=depth, undirected=False)
    nodes = []
    edges = []

    for node_id, data in ego.nodes(data=True):
        nodes.append({"id": node_id, **{k: v for k, v in data.items()}})

    for src, tgt, data in ego.edges(data=True):
        edges.append({"source": src, "target": tgt, **{k: v for k, v in data.items()}})

    return {
        "root":       customer_id,
        "depth":      depth,
        "node_count": ego.number_of_nodes(),
        "edge_count": ego.number_of_edges(),
        "nodes":      nodes,
        "edges":      edges,
    }


def get_claim_context_subgraph(
    G: nx.DiGraph,
    claim_id: str,
) -> Dict[str, Any]:
    """
    Returns the full relational context surrounding a single claim:
    Customer <-> Policy <-> Claim <-> IncidentType, RiskCluster
    Uses undirected ego graph at depth=2 to traverse both directions.
    """
    if not G.has_node(claim_id):
        return {"error": f"Claim '{claim_id}' not found in graph."}

    undirected = G.to_undirected()
    ego = nx.ego_graph(undirected, claim_id, radius=2)
    nodes, edges = [], []

    for node_id, data in ego.nodes(data=True):
        nodes.append({"id": node_id, **data})

    for src, tgt, data in ego.edges(data=True):
        edges.append({"source": src, "target": tgt, **data})

    # Extract claim's own data
    claim_data = dict(G.nodes[claim_id])

    return {
        "claim_id":   claim_id,
        "claim_data": claim_data,
        "node_count": ego.number_of_nodes(),
        "edge_count": ego.number_of_edges(),
        "nodes":      nodes,
        "edges":      edges,
    }


def detect_suspicious_clusters(
    G: nx.DiGraph,
    min_anomaly_claims: int = 2,
) -> List[Dict[str, Any]]:
    """
    Detects customers with multiple anomalous claims (fraud ring signals).
    Traverses Customer -> Claim edges and aggregates anomaly counts.
    Returns a list of suspicious customer profiles with their linked anomalous claims.
    """
    suspicious = []

    for node_id, data in G.nodes(data=True):
        if data.get("node_type") != NODE_CUSTOMER:
            continue

        # Find all claim successors
        claim_successors = [
            (nbr, G.nodes[nbr])
            for nbr in G.successors(node_id)
            if G.nodes[nbr].get("node_type") == NODE_CLAIM
        ]

        anomaly_claims = [
            (cid, cdata) for cid, cdata in claim_successors
            if cdata.get("is_anomaly") is True
        ]

        if len(anomaly_claims) >= min_anomaly_claims:
            suspicious.append({
                "customer_id":           node_id,
                "customer_subtype":      data.get("subtype", ""),
                "total_claims":          len(claim_successors),
                "anomaly_claim_count":   len(anomaly_claims),
                "anomaly_claim_ids":     [c[0] for c in anomaly_claims],
                "total_active_policies": data.get("total_policies", 0),
                "annual_spend_usd":      data.get("annual_spend_usd", 0.0),
                "risk_level":            "HIGH" if len(anomaly_claims) >= 3 else "ELEVATED",
            })

    # Sort by anomaly count descending
    suspicious.sort(key=lambda x: x["anomaly_claim_count"], reverse=True)
    return suspicious


def load_graph() -> nx.DiGraph:
    """Helper to load or build the persistent NetworkX knowledge graph."""
    return build_knowledge_graph(force_rebuild=False)
