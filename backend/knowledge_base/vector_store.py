"""
ChromaDB Vector Store — Semantic Claims Retrieval Engine
=========================================================
Embeds claim incident narratives + adjuster notes using
sentence-transformers/all-MiniLM-L6-v2 and persists them in a local
persistent ChromaDB collection.

Provides:
 - build_vector_store()   -> index all claims
 - semantic_search()      -> top-k neighbours for free-text query
 - get_similar_claims()   -> top-k neighbours given a claim_id
"""
import os
import json
import sqlite3
import warnings
from typing import List, Dict, Any, Optional

import pandas as pd

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR    = os.path.join(BASE_DIR, "data", "processed")
CHROMA_DIR       = os.path.join(BASE_DIR, "data", "chroma_store")
DB_PATH          = os.path.join(PROCESSED_DIR, "claims_intelligence.db")
EMBEDDING_MODEL  = "all-MiniLM-L6-v2"   # 80 MB, CPU-friendly, high accuracy
COLLECTION_NAME  = "insurance_claims"

os.makedirs(CHROMA_DIR, exist_ok=True)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _load_claims_from_db(db_path: str = DB_PATH) -> pd.DataFrame:
    """Load the full claims dossier view from SQLite."""
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM v_claims_full_dossier", conn)
    conn.close()
    return df


def _build_rich_document(row: pd.Series) -> str:
    """
    Concatenates every meaningful textual + categorical field into a single
    rich document for dense embedding.  The more context, the better the
    semantic recall for adjuster queries.
    """
    parts = [
        f"Claim ID: {row['claim_id']}",
        f"Policy Line: {row['policy_line']}",
        f"Incident Type: {row['incident_type']}",
        f"Incident Severity: {row['incident_severity']}",
        f"Claim Status: {row['claim_status']}",
        f"Risk Label: {row['risk_label']}",
        f"Claim Amount USD: {row['claim_amount_usd']:.2f}",
        f"Claim to Limit Ratio: {row['claim_to_limit_ratio']:.4f}",
        f"Filing Delay Days: {row['filing_delay_days']}",
        f"Customer Subtype: {row['customer_subtype_name']}",
        f"Customer Main Type: {row['customer_main_type_name']}",
        f"Age Group: {row['age_group_desc']}",
        f"Household Size: {row['household_size']}",
        f"Purchasing Power Tier: {row['purchasing_power_tier']}",
        f"Incident Date: {row['incident_date']}",
        f"Filing Date: {row['filing_date']}",
        f"Incident Narrative: {row['incident_narrative']}",
        f"Adjuster Notes: {row['adjuster_notes']}",
    ]
    return "  |  ".join(parts)


def _build_metadata(row: pd.Series) -> Dict[str, Any]:
    """
    Extracts structured metadata stored alongside each embedding vector.
    These fields enable ChromaDB $where clause filtering.
    """
    return {
        "claim_id":               str(row["claim_id"]),
        "customer_id":            str(row["customer_id"]),
        "policy_id":              str(row["policy_id"]),
        "policy_line":            str(row["policy_line"]),
        "incident_type":          str(row["incident_type"]),
        "incident_severity":      str(row["incident_severity"]),
        "claim_status":           str(row["claim_status"]),
        "risk_label":             str(row["risk_label"]),
        "is_anomaly":             bool(row["is_anomaly_ground_truth"]),
        "claim_amount_usd":       float(row["claim_amount_usd"]),
        "claim_to_limit_ratio":   float(row["claim_to_limit_ratio"]),
        "filing_delay_days":      int(row["filing_delay_days"]),
        "incident_date":          str(row["incident_date"]),
        "customer_subtype":       str(row["customer_subtype_name"]),
        "customer_main_type":     str(row["customer_main_type_name"]),
        "household_cluster":      str(row["household_cluster_signature"]),
    }


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def build_vector_store(
    db_path: str = DB_PATH,
    chroma_dir: str = CHROMA_DIR,
    model_name: str = EMBEDDING_MODEL,
    batch_size: int = 64,
    force_rebuild: bool = False,
) -> Any:
    """
    Builds (or loads) the persistent ChromaDB collection.

    Parameters
    ----------
    db_path      : path to claims_intelligence.db
    chroma_dir   : directory for persistent Chroma storage
    model_name   : HuggingFace sentence-transformer model id
    batch_size   : embedding batch size (tune for RAM)
    force_rebuild: if True, deletes existing collection and re-indexes

    Returns
    -------
    chroma_collection object
    """
    import chromadb
    from chromadb.utils import embedding_functions

    print(f"[VECTOR STORE] Initializing ChromaDB persistent store at: {chroma_dir}")
    client = chromadb.PersistentClient(path=chroma_dir)

    # Handle rebuild flag
    if force_rebuild:
        try:
            client.delete_collection(COLLECTION_NAME)
            print(f"[VECTOR STORE] Deleted existing collection '{COLLECTION_NAME}' for rebuild.")
        except Exception:
            pass

    # Check if collection already populated
    existing = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing and not force_rebuild:
        collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=model_name
            )
        )
        count = collection.count()
        print(f"[VECTOR STORE] Loaded existing collection '{COLLECTION_NAME}' with {count} documents.")
        return collection

    # Fresh build
    print(f"[VECTOR STORE] Loading embedding model: {model_name} ...")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=model_name)

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={
            "hnsw:space": "cosine",          # cosine similarity for insurance text
            "hnsw:construction_ef": 200,      # higher = better recall, slower build
            "hnsw:M": 16,                     # graph connectivity
        }
    )

    # Load claims
    df = _load_claims_from_db(db_path)
    print(f"[VECTOR STORE] Embedding {len(df)} claims in batches of {batch_size}...")

    total_indexed = 0
    for start in range(0, len(df), batch_size):
        batch = df.iloc[start : start + batch_size]
        documents  = [_build_rich_document(row) for _, row in batch.iterrows()]
        metadatas  = [_build_metadata(row)      for _, row in batch.iterrows()]
        ids        = [str(row["claim_id"])       for _, row in batch.iterrows()]

        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )
        total_indexed += len(batch)
        print(f"  Indexed {total_indexed}/{len(df)} claims...", end="\r")

    print(f"\n[VECTOR STORE] Successfully indexed {total_indexed} claim documents.")
    print(f"[VECTOR STORE] Collection count verification: {collection.count()}")
    return collection


def get_collection(
    chroma_dir: str = CHROMA_DIR,
    model_name: str = EMBEDDING_MODEL,
) -> Any:
    """Loads an already-built collection (fast path for agents)."""
    import chromadb
    from chromadb.utils import embedding_functions

    client = chromadb.PersistentClient(path=chroma_dir)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=model_name)
    return client.get_collection(name=COLLECTION_NAME, embedding_function=ef)


def semantic_search(
    query: str,
    top_k: int = 5,
    where_filter: Optional[Dict[str, Any]] = None,
    collection: Any = None,
) -> List[Dict[str, Any]]:
    """
    Free-text semantic search across all indexed claims.

    Parameters
    ----------
    query        : natural language adjuster query
    top_k        : number of results to return
    where_filter : optional ChromaDB metadata $where filter dict
                   e.g. {"policy_line": "Auto"} or {"is_anomaly": True}
    collection   : pre-loaded collection object (loads if None)

    Returns
    -------
    List of result dicts with keys:
      claim_id, similarity_score, document_snippet, metadata
    """
    if collection is None:
        collection = get_collection()

    kwargs = {"query_texts": [query], "n_results": top_k, "include": ["documents", "metadatas", "distances"]}
    if where_filter:
        kwargs["where"] = where_filter

    results = collection.query(**kwargs)

    output = []
    for i in range(len(results["ids"][0])):
        distance   = results["distances"][0][i]
        similarity = round(1.0 - distance, 4)   # cosine: distance = 1 - similarity
        output.append({
            "rank":             i + 1,
            "claim_id":         results["ids"][0][i],
            "similarity_score": similarity,
            "document_snippet": results["documents"][0][i][:400] + "...",
            "metadata":         results["metadatas"][0][i],
        })
    return output


def get_similar_claims(
    claim_id: str,
    top_k: int = 5,
    exclude_self: bool = True,
    collection: Any = None,
    db_path: str = DB_PATH,
) -> List[Dict[str, Any]]:
    """
    Given a claim_id, finds the k most semantically similar historical claims.
    Used by the Claims Retrieval Agent for precedent case discovery.
    """
    if collection is None:
        collection = get_collection()

    # Fetch the source claim document text
    result = collection.get(ids=[claim_id], include=["documents"])
    if not result["documents"]:
        raise ValueError(f"Claim ID '{claim_id}' not found in vector store.")

    source_doc = result["documents"][0]

    # Query by document text
    n_fetch = top_k + (1 if exclude_self else 0)
    results = collection.query(
        query_texts=[source_doc],
        n_results=min(n_fetch, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    output = []
    for i in range(len(results["ids"][0])):
        result_id = results["ids"][0][i]
        if exclude_self and result_id == claim_id:
            continue
        if len(output) >= top_k:
            break

        distance   = results["distances"][0][i]
        similarity = round(1.0 - distance, 4)
        output.append({
            "rank":             len(output) + 1,
            "claim_id":         result_id,
            "similarity_score": similarity,
            "document_snippet": results["documents"][0][i][:400] + "...",
            "metadata":         results["metadatas"][0][i],
        })
    return output


def get_claims_collection():
    """Helper to get or load the persistent claims collection."""
    return build_vector_store(force_rebuild=False)
