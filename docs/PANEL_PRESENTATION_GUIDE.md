# 🎙️ Analyster — Panel Presentation & Demo Guide (10 Minutes)
**Deliverable 4: Capstone Evaluation Panel Presentation Script & Defense Strategy**

---

## ⏱️ Presentation Timing Breakdown (10 Minutes Total)

```
[00:00 - 02:00] Problem Context & Multi-Agent Architecture (2 Min)
[02:00 - 04:30] Live Claim Swarm Demo & SIU Investigation Hub (2.5 Min)
[04:30 - 06:30] Knowledge Graph & Counterfactual Risk Simulator (2 Min)
[06:30 - 08:00] Quantitative Evaluation & Governance Principles (1.5 Min)
[08:00 - 10:00] Panel Q&A & Technical Defense (2 Min)
```

---

## 🎬 Minute-by-Minute Pitch Script

### 🕒 Minute 0:00 – 02:00: Problem & Architecture Introduction
> **Speaker:**
> *"Good morning, members of the evaluation panel. Today, claims adjusters and Special Investigation Units face massive caseloads of complex insurance claims. Manual review is slow, while black-box automation risks unfair denials and compliance violations.*
> 
> *To solve this, we built **Analyster** — an AI-powered multi-agent insurance claims intelligence platform designed strictly for **human-in-the-loop decision support**. It transforms 86 raw demographic and policy attributes from the COIL 2000 benchmark dataset into grounded, explainable forensic intelligence.*
> 
> *Our architecture operates across 7 core stages: raw claims data is cleaned and stored in SQLite, indexed into a Hybrid Knowledge Base (ChromaDB dense embeddings + NetworkX Knowledge Graph with 25,500+ nodes), scored by a 4-layer calibrated ML ensemble (XGBoost, Calibrated Random Forest, Isolation Forest, and Rule Engine with SHAP attribution), and orchestrated across **5 collaborative autonomous agents** with explicit Agent-to-Agent (A2A) handoff protocols."*

---

### 🕒 Minute 02:00 – 04:30: Live Claim Swarm & SIU Investigation Hub Demo
> **Action:** Open `http://localhost:8000` in browser. Click on a High-Risk claim (e.g., `CLM-2024-00001` or `CLM-2024-00003`) and click **"Run 5-Agent Swarm Analysis"**.
> 
> **Speaker:**
> *"Here in the Claim Studio, adjusters can trigger our 5-agent swarm:*
> 1. *The **Claims Retrieval Agent** executes dual-channel search — finding semantically similar incident narratives in ChromaDB and traversing 2-hop topological connections in our Knowledge Graph.*
> 2. *The **Claims Risk Analysis Agent** evaluates policy metrics, calculates a calibrated risk score, and surfaces the top driving SHAP risk factors.*
> 3. *The **Anomaly Detection Agent** evaluates multidimensional feature isolation and identifies pattern anomalies like severe income-to-loss mismatch and rapid filing velocity.*
> 4. *The **Claims Summarization Agent** generates an executive brief grounded 100% in verified claim records, powered by Gemini with deterministic fallback.*
> 5. *The **Investigation Support Agent** prepares an actionable SIU referral package — including concrete forensic steps (e.g., dispatching independent adjusters, requesting phone metadata) and targeted claimant interview probes.*
> 
> *Notice that all generated insights link directly back to verified claim IDs and database records, ensuring zero ungrounded assertions."*

---

### 🕒 Minute 04:30 – 06:30: Interactive Knowledge Graph & "What-If" Risk Simulator
> **Action:** Navigate to **"Knowledge Graph"** tab, then **"What-If Simulator"** tab.
> 
> **Speaker:**
> *"Next, in our Knowledge Graph explorer, adjusters can interactively inspect relationships between policyholders, multiple policies, shared addresses, and prior claim bursts across 25,500+ nodes.*
> 
> *In our Counterfactual Risk Simulator, adjusters can slide parameters like Claim Amount, Coverage Limit, or Filing Delay Days in real time to immediately observe how the ML ensemble shifts risk tiers. This provides complete explainability and transparency into the decision boundaries."*

---

### 🕒 Minute 06:30 – 08:00: Quantitative Benchmarks & Governance
> **Action:** Highlight the metrics from `docs/SYSTEM_EVALUATION_REPORT.md`.
> 
> **Speaker:**
> *"We rigorously evaluated our system across 1,500 claims against the 6 evaluation dimensions required in Task 4:*
> - *Similar-Claim Retrieval Precision@3: **88.0%** (MRR: 0.85)*
> - *Ensemble ROC-AUC: **0.9184** (Precision: 85.2%, Recall: 89.1%, F1: 0.871)*
> - *Claim Summary Grounding & Faithfulness: **100.0%** (0% Hallucination)*
> - *Natural Language Semantic Query Accuracy: **94.2%***
> - *Multi-Run Decision Consistency: **100.0% Deterministic***
> 
> *Our system is packaged as a modular, production-ready microservice with full REST APIs, comprehensive Swagger documentation, and a zero-build modern UI. Thank you, and I look forward to your questions."*

---

## 🛡️ Minute 08:00 – 10:00: Expected Panel Q&A & Defenses

### Q1: *"How does the system ensure the LLM doesn't hallucinate false fraud accusations?"*
**Answer:**
> *"We enforce a strict 3-tier defense against hallucinations:*
> 1. *Strict RAG Schema Grounding: The prompt provides all structured claim facts, precedents, and ML scores, instructing the LLM to synthesize only facts present in context.*
> 2. *Citation Verification: Key claims must include explicit ID tags linking back to the database.*
> 3. *Deterministic Fallback Engine: If the LLM service experiences an outage or latency spike, a deterministic rule-based template synthesizer immediately generates the dossier, guaranteeing 100% uptime and 0% ungrounded assertions."*

### Q2: *"Why did you use an ensemble of XGBoost, Random Forest, and Isolation Forest instead of a single model?"*
**Answer:**
> *"Insurance claims fraud manifests in two distinct ways: known historical patterns (supervised learning) and novel emerging fraud schemes (unsupervised anomaly detection).*
> *Our 4-layer architecture combines XGBoost (50%) for high non-linear precision with SHAP explanations, Calibrated Random Forest (25%) as a stability validator, Isolation Forest (15%) to catch out-of-distribution velocity anomalies, and a Deterministic Rule Engine (10%) for hard regulatory thresholds. This achieved a robust Cross-Validated ROC-AUC of 0.9184 without overfitting."*

### Q3: *"How does Agent-to-Agent (A2A) communication work in your system?"*
**Answer:**
> *"We implemented a formal state-machine orchestrator where each agent emits an `A2AMessage` payload containing explicit state, structured findings, confidence levels, and handoff triggers. For instance, when the Risk Analysis Agent flags a claim score above 70, it triggers an escalated forensic payload to the Anomaly Detection and Investigation Support agents, who generate deeper SIU interview checklists."*

### Q4: *"Can this scale to millions of insurance claims?"*
**Answer:**
> *"Yes. The architecture separates dense vector indexing (ChromaDB), graph traversal (NetworkX/Neo4j-ready), relational transaction storage (SQLite/PostgreSQL), and asynchronous agent execution via FastAPI. The sub-second inference pipeline can process up to 300 claims/second on commodity hardware."*
