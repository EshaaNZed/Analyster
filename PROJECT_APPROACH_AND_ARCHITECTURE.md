# AI-Powered Insurance Claims Intelligence Assistant
## Comprehensive Project Approach, System Flow & Architecture Blueprint

---

## 1. Executive Summary & Core Mission
The **AI-Powered Insurance Claims Intelligence Assistant** is an enterprise-grade decision-support platform designed to assist insurance adjusters, claims investigators, and risk analysts. It transforms raw policyholder demographics, policy portfolios, and incident records into explainable, evidence-backed claims intelligence.

### Foundational Principles:
1. **Human-in-the-Loop Decision Support**: The AI assistant never makes unilateral, automated claim decisions (approvals or denials). It prioritizes, scores, clusters, and explains findings to empower human adjusters.
2. **Deterministic Evidence Grounding & Traceability**: Every risk flag, anomaly score, and summary assertion is strictly mapped back to verified claim IDs, policy numbers, and underlying dataset attributes.
3. **Hybrid Graph RAG**: Combines dense semantic vector retrieval (for unstructured incident narratives) with knowledge graph traversal (for structural relationships across customers, policies, households, and claim bursts).
4. **Specialized Multi-Agent Orchestration**: Deploys 5 dedicated, collaborative agents featuring explicit Agent-to-Agent (A2A) communication and dynamic handoff protocols.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TB
    subgraph DataFoundation ["1. Data Foundation & Knowledge Base Layer (Task 1)"]
        D1[(COIL 2000 Dataset\n86 Customer & Policy Attributes)] --> DP[Data Ingestion, Cleaning & Feature Engineering]
        DP --> DB[(Relational Store: SQLite / DuckDB\nNormalized Policies & Claims)]
        DP --> KG[(Knowledge Graph: NetworkX\nCustomer - Policy - Claim - Household Nodes)]
        DP --> VDB[(Vector Store: ChromaDB\nIncident Narrative Embeddings)]
    end

    subgraph AnalyticalEngine ["2. Claims Analysis & Anomaly Detection Layer (Task 2)"]
        DB & KG & VDB --> IF[Unsupervised Isolation Forest Engine\nAmount & Velocity Outlier Detection]
        DB & KG & VDB --> RE[Deterministic Risk Scoring Engine\nWeighted Factors & Rule Heuristics]
        DB & KG & VDB --> HSR[Hybrid Semantic + Graph Retrieval\nPrecedent Case Matching]
    end

    subgraph MultiAgentSystem ["3. Multi-Agent Intelligence Core (Task 3)"]
        direction TB
        Orchestrator[State-Machine Agent Orchestrator]
        
        subgraph Agents ["Collaborative Agent Mesh"]
            A1[Claims Retrieval Agent\nHybrid Graph + Vector Search]
            A2[Claims Risk Analysis Agent\nPolicy & Claim Risk Profiling]
            A3[Anomaly Detection Agent\nStatistical Outlier Deep Dive]
            A4[Claims Summarization Agent\nConcise Grounded Executive Brief]
            A5[Investigation Support Agent\nEvidence Consolidation & Human Action Items]
        end
        
        Orchestrator --> A1
        A1 <-->|A2A Handoff| A2
        A2 <-->|A2A Handoff| A3
        A1 & A2 & A3 --> A4
        A4 --> A5
    end

    subgraph APILayer ["4. Microservice API Layer (FastAPI)"]
        API[FastAPI Asynchronous Microservice]
        PydanticModels[Pydantic v2 Contracts & Validation]
        API --- MultiAgentSystem
        API --- AnalyticalEngine
    end

    subgraph PresentationLayer ["5. User Application & Reviewer Studio (Task 4)"]
        direction TB
        UI[Modern Reviewer Dashboard: React + Vite + Vanilla CSS]
        
        subgraph UIViews ["Reviewer Modules"]
            V1[Claim Explorer & Search]
            V2[Interactive Knowledge Graph Visualizer]
            V3[Risk Gauge & Anomaly Breakdown]
            V4[Agent Execution 'War Room' Stream]
            V5[Counterfactual 'What-If' Risk Simulator]
            V6[Evidence Grounding & Citation Inspector]
            V7[SIU Referral Dossier Generator]
        end
        
        UI --> UIViews
    end

    subgraph EvaluationSuite ["6. Automated Evaluation & Benchmarking (Task 4)"]
        E1[Retrieval Relevance: Precision@K, Recall@K, MRR]
        E2[Anomaly Detection: ROC-AUC, Precision-Recall, F1]
        E3[Summary Quality: Grounding, Faithfulness & ROUGE]
        E4[Consistency: Multi-run Stability & Variance]
    end

    AnalyticalEngine --> MultiAgentSystem
    APILayer <==> UI
    AnalyticalEngine --- EvaluationSuite
    MultiAgentSystem --- EvaluationSuite
```

---

## 3. High-Level Data Flow Pipeline

The end-to-end operational pipeline flows through 7 structured stages:

$$\mathbf{Claims\ Data} \longrightarrow \mathbf{Data\ Processing} \longrightarrow \mathbf{Retrieval/Analytics} \longrightarrow \mathbf{Risk\ \&\ Anomaly\ Detection} \longrightarrow \mathbf{Multi-Agent\ Intelligence} \longrightarrow \mathbf{Claims\ Insights} \longrightarrow \mathbf{Human\ Reviewer}$$

| Stage | Operations Performed | Output Artifact |
| :--- | :--- | :--- |
| **1. Claims Data** | Ingest raw COIL 2000 customer & policy attributes (86 fields). | Raw benchmark records |
| **2. Data Processing** | Normalize demographics, map multi-line policies, engineer claim history indicators, generate realistic linked claim events & textual incident narratives. | Relational SQLite DB, Cleaned Pandas Parquet |
| **3. Retrieval & Analytics** | Generate vector embeddings (`all-MiniLM-L6-v2`) and build knowledge graph triples (`Customer`-`Policy`-`Claim`-`Household`). | ChromaDB Collections & NetworkX Graph Store |
| **4. Risk & Anomaly Detection** | Fit Isolation Forest on multidimensional amount/velocity features; evaluate deterministic rule thresholds. | Normalized Anomaly Scores [-1, 1], Risk Factors [0-100] |
| **5. Multi-Agent Intelligence** | Orchestrate the 5 specialized agents via typed state machine; perform A2A context passing and handoffs. | Aggregated Agent State Dossier |
| **6. Claims Insights** | Synthesize executive summaries, extract granular evidence citations, generate investigation checklist. | Structured JSON Claims Intelligence Packet |
| **7. Human Reviewer** | Interactive web dashboard: claim inspection, graph visualization, counterfactual simulation, manual triage. | Reviewer Disposition (Approve / Investigate / Refer to SIU) |

---

## 4. Phased Step-by-Step Implementation Roadmap

### Phase 1: Data Preparation, Feature Engineering & Knowledge Base (Task 1 — 20%)
* **Step 1.1 — Dataset Acquisition**: Fetch authentic COIL 2000 benchmark dataset files (`TICDATA2000.txt`, `TICEVAL2000.txt`, `TICTGTS2000.txt`) and data dictionary.
* **Step 1.2 — Data Ingestion & Relational Schema**: Normalize the 86 attributes (customer subtype, sociodemographics, car/fire/boat policy contributions and counts).
* **Step 1.3 — Linked Claims Synthesis & Narrative Generation**: Deterministically synthesize realistic claim records (dates, amounts, claim types, incident narratives, adjuster notes) statistically aligned with COIL 2000 policy types.
* **Step 1.4 — Vector Knowledge Base Setup**: Generate text embeddings using `sentence-transformers/all-MiniLM-L6-v2` and index them in persistent `ChromaDB`.
* **Step 1.5 — Relational & Graph Indexing**: Construct `NetworkX` graph connecting `Customer`, `Policy`, `Claim`, `Household`, and `IncidentType`.

### Phase 2: Core Analytics, Similarity Engine & Anomaly Detection (Task 2 — 25%)
* **Step 2.1 — Isolation Forest Anomaly Model**: Train scikit-learn Isolation Forest on numerical features (claim amount vs. contribution ratio, filing velocity, claim frequency).
* **Step 2.2 — Rule-Based Risk Attribution Engine**: Implement transparent, explainable scoring with itemized factors (no black-box scores).
* **Step 2.3 — Hybrid Similarity Search Engine**: Build combined search querying ChromaDB (semantic narrative similarity) + NetworkX (entity 1-hop/2-hop neighborhood).
* **Step 2.4 — Triaging & Prioritization Engine**: Categorize claims into Low Risk (Fast-Track), Moderate Risk (Standard Review), and High Risk (Priority Investigation).

### Phase 3: Multi-Agent Intelligence Core & Handoff Protocols (Task 3 — 25%)
* **Step 3.1 — State Machine & Message Contracts**: Define strict Pydantic schemas for state, messages, and A2A communication.
* **Step 3.2 — Agent 1: Claims Retrieval Agent**: Hybrid search over precedent cases and policy history.
* **Step 3.3 — Agent 2: Claims Risk Analysis Agent**: Dissects claim characteristics, policy limits, and specific risk triggers.
* **Step 3.4 — Agent 3: Anomaly Detection Agent**: Deep dives into statistical outliers, burst patterns, and unusual clusters.
* **Step 3.5 — Agent 4: Claims Summarization Agent**: Produces clear, bulleted executive briefs grounded strictly in retrieved facts.
* **Step 3.6 — Agent 5: Investigation Support Agent**: Consolidates findings, cross-examines discrepancies, drafts human-review checklists.
* **Step 3.7 — Orchestrator & A2A Handoffs**: Coordinate complex claims passing from Risk $\rightarrow$ Anomaly $\rightarrow$ Investigation.

### Phase 4: Automated Evaluation & Front-End Reviewer Application (Task 4 — 20%)
* **Step 4.1 — Evaluation Benchmark Suite**:
  * Retrieval Relevance (Precision@K, Recall@K, MRR).
  * Anomaly Detection Performance (ROC-AUC, F1-Score).
  * Summarization Faithfulness & Grounding (hallucination checks).
  * Consistency & Stability across repeated queries.
* **Step 4.2 — Reviewer Front-End (Vite + React + Vanilla CSS)**:
  * Claim search, filtering, and selection.
  * Comprehensive claim and policy profile viewer.
  * Side-by-side historical similar claims comparison.
  * Interactive risk indicators & gauge meters.
  * Grounded claim executive summary with source citations.
  * Granular supporting evidence viewer.
  * Triage & investigation disposition controls.

### Phase 5: Architecture Documentation, Demonstration & Innovation Multipliers (Task 5 — 10% + Innovations)
* **Step 5.1 — High-Resolution Architecture Deliverables**: Generate high-res architecture diagrams and design trade-off documentation.
* **Step 5.2 — Microservice Packaging & Production README**: Setup scripts, clear run instructions, sample queries, and API documentation.
* **Step 5.3 — Standout Innovation Features**:
  1. Interactive Collusion & Fraud Ring Graph Explorer (`vis-network`).
  2. Live Multi-Agent "War Room" Execution Stream.
  3. Interactive "What-If" Counterfactual Risk Simulator.
  4. Dynamic Evidence Grounding & Faithfulness Heatmap.
  5. One-Click SIU Referral Dossier Generator.
* **Step 5.4 — 10-Minute Presentation Script**: Detailed 8-minute demo walkthrough + 2-minute Q&A defense preparation.

---

## 5. Technology Stack Summary

| Layer | Chosen Technology | Justification |
| :--- | :--- | :--- |
| **API Microservice** | FastAPI + Uvicorn (Python 3.10+) | Asynchronous, auto-generates OpenAPI/Swagger docs, high throughput. |
| **Data & Relations** | SQLite + Pandas + NumPy | Local, lightweight, embedded, relational integrity for 9,800+ COIL records. |
| **Vector Engine** | ChromaDB + `all-MiniLM-L6-v2` | Dense semantic retrieval, zero cloud cost, local CPU execution. |
| **Knowledge Graph** | NetworkX (In-Memory + JSON/GraphML) | Blazing-fast graph traversal, community detection, sub-graph exports. |
| **Machine Learning** | Scikit-learn (Isolation Forest, Z-score) | Unsupervised anomaly detection, reproducible statistical modeling. |
| **Multi-Agent Core** | Typed Python State Machine | Deterministic control over A2A handoffs, audit trails, and tool calls. |
| **Frontend UI** | Vite + React + Vanilla CSS | Ultra-responsive, sleek dark glassmorphism, bespoke design system. |
| **Graph Visualizer** | `vis-network` | Interactive 2D/3D physics-based node-link graph on the browser canvas. |
| **Evaluation Suite** | Custom Automated Benchmarks | Quantitative reporting on Precision@K, ROC-AUC, and Faithfulness. |

---
*Maintained under `PROJECT_APPROACH_AND_ARCHITECTURE.md` as the authoritative blueprint.*
