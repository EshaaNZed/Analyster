"""
Generate a professional, clean, uncluttered Block Architecture Diagram PDF
for the Analyster (AI-Powered Insurance Claims Intelligence Assistant) project.
Outputs:
  - docs/system_block_architecture.pdf
  - system_block_architecture.pdf (in project root)
  - docs/system_block_architecture_p1.png
  - docs/system_block_architecture_p2.png
"""

import os
import shutil
from pathlib import Path
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import fitz  # PyMuPDF

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)

OUTPUT_PDF_DOCS = DOCS_DIR / "system_block_architecture.pdf"
OUTPUT_PDF_ROOT = PROJECT_ROOT / "system_block_architecture.pdf"

# Page Dimensions (Landscape A4: 841.89 x 595.28 pt)
PAGE_W, PAGE_H = landscape(A4)

# Color Palette (Modern, sleek dark mode with vibrant tier accents)
COLOR_BG = colors.HexColor("#0B0F17")          # Deep Slate Canvas
COLOR_PANEL_BG = colors.HexColor("#131924")    # Panel background
COLOR_TEXT_WHITE = colors.HexColor("#FFFFFF")
COLOR_TEXT_MUTED = colors.HexColor("#94A3B8")
COLOR_TEXT_BODY = colors.HexColor("#CBD5E1")

# Tier Accents
ACCENT_L1 = colors.HexColor("#38BDF8")  # Cyan / Presentation
ACCENT_L2 = colors.HexColor("#818CF8")  # Indigo / API
ACCENT_L3 = colors.HexColor("#C084FC")  # Bright Purple / Multi-Agent
ACCENT_L4 = colors.HexColor("#F59E0B")  # Amber / Analytics & ML
ACCENT_L5 = colors.HexColor("#10B981")  # Emerald / Data & KB

BOX_BG_L1 = colors.HexColor("#08253A")
BOX_BG_L2 = colors.HexColor("#171730")
BOX_BG_L3 = colors.HexColor("#221033")
BOX_BG_L4 = colors.HexColor("#2C1D06")
BOX_BG_L5 = colors.HexColor("#052217")

def draw_rounded_card(c, x, y, w, h, bg_color, border_color, radius=7, border_w=1.4):
    c.saveState()
    c.setFillColor(bg_color)
    c.setStrokeColor(border_color)
    c.setLineWidth(border_w)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
    c.restoreState()

def draw_arrow_down(c, x, y_start, y_end, color=colors.HexColor("#38BDF8"), label="", label_side="right"):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.4)
    c.line(x, y_start, x, y_end)
    # Arrow head
    p = c.beginPath()
    p.moveTo(x, y_end)
    p.lineTo(x - 3.5, y_end + 5.5)
    p.lineTo(x + 3.5, y_end + 5.5)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFont("Helvetica-Bold", 6.8)
        if label_side == "right":
            c.drawString(x + 6, (y_start + y_end) / 2 - 2, label)
        else:
            c.drawRightString(x - 6, (y_start + y_end) / 2 - 2, label)
    c.restoreState()

def draw_arrow_bidirectional(c, x, y_start, y_end, color=colors.HexColor("#38BDF8"), label=""):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.4)
    c.line(x, y_start, x, y_end)
    # Head 1 (down)
    p1 = c.beginPath()
    p1.moveTo(x, y_end)
    p1.lineTo(x - 3.5, y_end + 5)
    p1.lineTo(x + 3.5, y_end + 5)
    p1.close()
    c.drawPath(p1, fill=1, stroke=0)
    # Head 2 (up)
    p2 = c.beginPath()
    p2.moveTo(x, y_start)
    p2.lineTo(x - 3.5, y_start - 5)
    p2.lineTo(x + 3.5, y_start - 5)
    p2.close()
    c.drawPath(p2, fill=1, stroke=0)
    if label:
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x + 6, (y_start + y_end) / 2 - 2.5, label)
    c.restoreState()

def draw_page_1(c):
    """Page 1: System Block Architecture Diagram"""
    c.setFillColor(COLOR_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Top Header
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.drawString(35, PAGE_H - 35, "ANALYSTER")
    
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(ACCENT_L1)
    c.drawString(162, PAGE_H - 33, "— SYSTEM BLOCK ARCHITECTURE")

    c.setFont("Helvetica", 8.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(35, PAGE_H - 49, "AI-Powered Insurance Claims Intelligence Assistant  |  High-Level Subsystem Blocks & Interaction Topology")

    canvas_x = 30
    canvas_w = PAGE_W - 60  # 781.89 pt

    # ==========================================
    # BLOCK 1: PRESENTATION LAYER (FRONTEND)
    # ==========================================
    b1_y = PAGE_H - 124
    b1_h = 65
    draw_rounded_card(c, canvas_x, b1_y, canvas_w, b1_h, COLOR_PANEL_BG, ACCENT_L1, radius=6, border_w=1.6)

    # Header label
    c.setFillColor(ACCENT_L1)
    c.setFont("Helvetica-Bold", 8.8)
    c.drawString(canvas_x + 14, b1_y + b1_h - 17, "BLOCK 1: PRESENTATION LAYER  [React 18 + TypeScript + Vite + Vanilla CSS]")

    modules_l1 = [
        ("Claim Explorer", "Interactive claim search, filters & triage tags"),
        ("Risk & Anomaly Gauges", "Visual metric dials & confidence bars"),
        ("Knowledge Graph Visualizer", "Vis-Network interactive entity exploration"),
        ("Agent War Room", "Real-time step-by-step reasoning feed"),
        ("Counterfactual Simulator", "'What-If' attribute slider stress-testing"),
        ("SIU Dossier Generator", "1-click fraud referral export & audit pack")
    ]
    sub_w1 = (canvas_w - 28 - (len(modules_l1) - 1) * 8) / len(modules_l1)
    for idx, (title, desc) in enumerate(modules_l1):
        sx = canvas_x + 14 + idx * (sub_w1 + 8)
        sy = b1_y + 8
        draw_rounded_card(c, sx, sy, sub_w1, 38, BOX_BG_L1, ACCENT_L1, radius=4, border_w=0.7)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(sx + sub_w1 / 2, sy + 24, title)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.setFont("Helvetica", 5.8)
        c.drawCentredString(sx + sub_w1 / 2, sy + 11, desc)

    # Connector Arrow: L1 <-> L2
    conn1_y_start = b1_y
    conn1_y_end = b1_y - 28
    draw_arrow_bidirectional(c, PAGE_W / 2, conn1_y_start, conn1_y_end, color=ACCENT_L1, label="REST API (JSON over HTTP)")

    # ==========================================
    # BLOCK 2: API & SERVICE GATEWAY (FASTAPI)
    # ==========================================
    b2_y = conn1_y_end - 54
    b2_h = 54
    draw_rounded_card(c, canvas_x, b2_y, canvas_w, b2_h, COLOR_PANEL_BG, ACCENT_L2, radius=6, border_w=1.6)

    c.setFillColor(ACCENT_L2)
    c.setFont("Helvetica-Bold", 8.8)
    c.drawString(canvas_x + 14, b2_y + b2_h - 16, "BLOCK 2: API & SERVICE GATEWAY  [FastAPI Microservice + Pydantic v2 Models]")

    api_subblocks = [
        ("REST Endpoints Router", "routes.py (/claims, /analyze, /graph, /agents)"),
        ("Pydantic v2 Data Models", "models.py (Strict typing, serialization & validation)"),
        ("Async Request Coordinator", "Non-blocking dispatch to agent mesh & analytics"),
        ("CORS & Error Middleware", "Safe headers, status codes & audit logging")
    ]
    sub_w2 = (canvas_w - 28 - (len(api_subblocks) - 1) * 10) / len(api_subblocks)
    for idx, (title, desc) in enumerate(api_subblocks):
        sx = canvas_x + 14 + idx * (sub_w2 + 10)
        sy = b2_y + 8
        draw_rounded_card(c, sx, sy, sub_w2, 28, BOX_BG_L2, ACCENT_L2, radius=4, border_w=0.7)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(sx + sub_w2 / 2, sy + 16, title)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.setFont("Helvetica", 6)
        c.drawCentredString(sx + sub_w2 / 2, sy + 7, desc)

    # Connectors from Gateway to Block 3 and Block 4
    conn2_y_start = b2_y
    conn2_y_end = b2_y - 25
    draw_arrow_down(c, canvas_x + 225, conn2_y_start, conn2_y_end, color=ACCENT_L3, label="Trigger Swarm")
    draw_arrow_down(c, canvas_x + 610, conn2_y_start, conn2_y_end, color=ACCENT_L4, label="Fetch Scores")

    # ==========================================
    # MIDDLE ROW: BLOCK 3 (AGENTS) & BLOCK 4 (ANALYTICS)
    # ==========================================
    mid_y = conn2_y_end - 198
    mid_h = 198

    # Left: Block 3 - Multi-Agent Intelligence Core
    b3_w = 465
    draw_rounded_card(c, canvas_x, mid_y, b3_w, mid_h, COLOR_PANEL_BG, ACCENT_L3, radius=6, border_w=1.6)

    c.setFillColor(ACCENT_L3)
    c.setFont("Helvetica-Bold", 8.8)
    c.drawString(canvas_x + 14, mid_y + mid_h - 16, "BLOCK 3: MULTI-AGENT INTELLIGENCE CORE  [Collaborative Mesh + State Machine]")

    # Orchestrator & LLM Service Bar inside Block 3
    orch_w = b3_w - 28
    draw_rounded_card(c, canvas_x + 14, mid_y + mid_h - 52, orch_w, 30, BOX_BG_L3, ACCENT_L3, radius=4, border_w=0.9)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(canvas_x + 14 + orch_w / 2, mid_y + mid_h - 36, "Central State-Machine Orchestrator  &  LLM Gateway Service (orchestrator.py, llm_service.py)")
    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(canvas_x + 14 + orch_w / 2, mid_y + mid_h - 46, "Google Gemini API Integration  |  Shared State-Context Management  |  Deterministic Mock Fallback")

    # 5 Sequential Agents Pipeline
    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawString(canvas_x + 16, mid_y + 128, "SEQUENTIAL COLLABORATIVE AGENT PIPELINE (A2A Handoff Protocol):")

    agents = [
        ("1. Claims Retrieval", "retrieval_agent.py", "Hybrid Vector + Graph precedent search"),
        ("2. Risk Analysis", "risk_agent.py", "Policy profiling, history & loss severity"),
        ("3. Anomaly Detection", "anomaly_agent.py", "Multidimensional statistical outlier dive"),
        ("4. Summarization", "summarizer_agent.py", "Grounded executive brief & evidence tags"),
        ("5. Investigation", "investigation_agent.py", "Action items, claimant probes & SIU dossier")
    ]
    agent_h = 21
    for a_idx, (a_name, a_file, a_desc) in enumerate(agents):
        ay = mid_y + 104 - a_idx * 23
        draw_rounded_card(c, canvas_x + 14, ay, orch_w, agent_h, BOX_BG_L3, ACCENT_L3, radius=3, border_w=0.7)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(canvas_x + 22, ay + 6.5, a_name)
        c.setFillColor(ACCENT_L3)
        c.setFont("Helvetica-Oblique", 6.5)
        c.drawString(canvas_x + 120, ay + 6.5, f"[{a_file}]")
        c.setFillColor(COLOR_TEXT_BODY)
        c.setFont("Helvetica", 6.5)
        c.drawString(canvas_x + 220, ay + 6.5, f"— {a_desc}")
        # Handoff arrow
        if a_idx < len(agents) - 1:
            c.setFillColor(ACCENT_L3)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(canvas_x + orch_w - 6, ay - 2, "↓")

    # Right: Block 4 - Analytics & Machine Learning Engine
    b4_x = canvas_x + b3_w + 14
    b4_w = canvas_w - b3_w - 14
    draw_rounded_card(c, b4_x, mid_y, b4_w, mid_h, COLOR_PANEL_BG, ACCENT_L4, radius=6, border_w=1.6)

    c.setFillColor(ACCENT_L4)
    c.setFont("Helvetica-Bold", 8.8)
    c.drawString(b4_x + 14, mid_y + mid_h - 16, "BLOCK 4: ANALYTICS & ML SCORING ENGINE")

    ml_components = [
        ("Deterministic Rule Engine", "rule_engine.py", "10+ heuristic fraud & threshold rules (flag count, severity score)"),
        ("Isolation Forest Outlier Model", "isolation_forest.py", "Unsupervised anomaly detection on claim amount, frequency & velocity"),
        ("Supervised XGBoost Classifier", "xgboost_classifier.py", "Gradient boosted decision trees for claim complexity & triage"),
        ("Random Forest Validator", "random_forest_validator.py", "Calibrated tree ensemble baseline for model cross-validation"),
        ("Ensemble Risk Scorer", "ensemble_scorer.py", "Weighted aggregation (0-100 score: Green, Yellow, Orange, Red)"),
        ("Triage Feature Store", "triage_features.py", "Ratio of claim to income, premium leverage, filing velocity metrics")
    ]
    card_h = 24
    for m_idx, (m_title, m_code, m_expl) in enumerate(ml_components):
        my = mid_y + mid_h - 45 - m_idx * 28.5
        draw_rounded_card(c, b4_x + 12, my, b4_w - 24, card_h, BOX_BG_L4, ACCENT_L4, radius=4, border_w=0.7)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(b4_x + 20, my + 13, m_title)
        c.setFillColor(ACCENT_L4)
        c.setFont("Helvetica", 6.5)
        c.drawString(b4_x + 160, my + 13, f"[{m_code}]")
        c.setFillColor(COLOR_TEXT_MUTED)
        c.setFont("Helvetica", 6)
        c.drawString(b4_x + 20, my + 4, m_expl)

    # Connector between Block 3 and Block 4 in the middle gap
    c.saveState()
    c.setStrokeColor(colors.HexColor("#64748B"))
    c.setLineWidth(1)
    c.setDash(2, 2)
    c.line(canvas_x + b3_w, mid_y + 110, b4_x, mid_y + 110)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString((canvas_x + b3_w + b4_x) / 2, mid_y + 114, "Rule / ML")
    c.drawCentredString((canvas_x + b3_w + b4_x) / 2, mid_y + 104, "Scores")
    c.restoreState()

    # Connector down to Block 5
    conn3_y_start = mid_y
    conn3_y_end = mid_y - 25
    draw_arrow_down(c, canvas_x + 180, conn3_y_start, conn3_y_end, color=ACCENT_L5, label="Semantic / KG Query")
    draw_arrow_down(c, canvas_x + 650, conn3_y_start, conn3_y_end, color=ACCENT_L5, label="Feature Extracts")

    # ==========================================
    # BLOCK 5: DATA FOUNDATION & KNOWLEDGE BASE
    # ==========================================
    b5_y = conn3_y_end - 94
    b5_h = 94
    draw_rounded_card(c, canvas_x, b5_y, canvas_w, b5_h, COLOR_PANEL_BG, ACCENT_L5, radius=6, border_w=1.6)

    c.setFillColor(ACCENT_L5)
    c.setFont("Helvetica-Bold", 8.8)
    c.drawString(canvas_x + 14, b5_y + b5_h - 16, "BLOCK 5: DATA FOUNDATION & HYBRID KNOWLEDGE BASE  [Graph RAG + Vector Store + SQL]")

    kb_boxes = [
        ("Data Cleaner & Synthesizer", "data_engine/", "COIL 2000 Ingestion (86 attributes)\nRealistic linked claims synthesis\nNormalizer & schema validation"),
        ("Relational Store (SQLite)", "insurance_claims.db", "Normalized tables: fact_claims,\ndim_policies, dim_customers\nv_claims_full_dossier view"),
        ("Knowledge Graph (NetworkX)", "graph_store.py", "25,543 entities & 22,184 edges\nCustomer - Policy - Claim links\n2-hop multi-party fraud cluster search"),
        ("Vector Store (ChromaDB)", "vector_store.py", "Sentence-Transformers (all-MiniLM-L6-v2)\nIncident narrative embeddings\nAdjuster forensic notes retrieval"),
        ("Hybrid RAG Retriever", "hybrid_retriever.py", "Reciprocal Rank Fusion (RRF)\nMerges structural graph hops with\ndense semantic precedent matching")
    ]
    kb_w = (canvas_w - 28 - (len(kb_boxes) - 1) * 8) / len(kb_boxes)
    for k_idx, (k_title, k_loc, k_desc) in enumerate(kb_boxes):
        kx = canvas_x + 14 + k_idx * (kb_w + 8)
        ky = b5_y + 8
        draw_rounded_card(c, kx, ky, kb_w, 62, BOX_BG_L5, ACCENT_L5, radius=4, border_w=0.7)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(kx + kb_w / 2, ky + 49, k_title)
        c.setFillColor(ACCENT_L5)
        c.setFont("Helvetica-Oblique", 6.5)
        c.drawCentredString(kx + kb_w / 2, ky + 39, k_loc)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.setFont("Helvetica", 5.8)
        lines = k_desc.split("\n")
        for l_idx, line in enumerate(lines):
            c.drawCentredString(kx + kb_w / 2, ky + 26 - l_idx * 8.5, line)

    # Bottom Governance Bar
    c.setFont("Helvetica-Bold", 6.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    footer_text = "ENTERPRISE ASSURANCE: Deterministic Evidence Grounding  •  Zero-Hallucination Fallback  •  Human-in-the-Loop Decision Support  •  Full Audit Traceability"
    c.drawCentredString(PAGE_W / 2, 14, footer_text)

def draw_page_2(c):
    """Page 2: Block-by-Block Functional Specification & Data Flow Details"""
    c.setFillColor(COLOR_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.drawString(35, PAGE_H - 35, "ANALYSTER")
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(ACCENT_L2)
    c.drawString(162, PAGE_H - 33, "— BLOCK-BY-BLOCK FUNCTIONAL SPECIFICATION")

    c.setFont("Helvetica", 8.5)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(35, PAGE_H - 49, "Detailed architectural reference: Subsystem roles, input/output data contracts, and operational execution flow.")

    canvas_x = 30
    canvas_w = PAGE_W - 60

    blocks_info = [
        {
            "name": "BLOCK 1: Presentation Layer (Reviewer Studio)",
            "color": ACCENT_L1,
            "bg": BOX_BG_L1,
            "tech": "React 18, TypeScript, Vite, Vanilla CSS, Vis-Network",
            "role": "Single-pane-of-glass workbench empowering claims adjusters and SIU investigators.",
            "inputs": "FastAPI REST API responses, SSE agent execution events, structured JSON claim dossiers.",
            "outputs": "Adjuster decisions (Approve, Further Investigation, Escalate to SIU), audit annotations.",
            "files": ["frontend/src/App.tsx, views/ClaimExplorer.tsx", "views/WarRoom.tsx, views/WhatIfSimulator.tsx"]
        },
        {
            "name": "BLOCK 2: API & Gateway Layer",
            "color": ACCENT_L2,
            "bg": BOX_BG_L2,
            "tech": "FastAPI, Uvicorn, Pydantic v2, Python 3.10+",
            "role": "High-throughput asynchronous communication gateway ensuring strict contract validation.",
            "inputs": "HTTP GET / POST requests from frontend or external enterprise claim management systems.",
            "outputs": "Strictly typed Pydantic response payloads: ClaimDossier, RiskScorePayload, GraphNodesEdges.",
            "files": ["backend/api/main.py, backend/api/routes.py", "backend/api/models.py"]
        },
        {
            "name": "BLOCK 3: Multi-Agent Intelligence Core",
            "color": ACCENT_L3,
            "bg": BOX_BG_L3,
            "tech": "Google Gemini 1.5 Pro / Flash, Custom State Machine, Python typing",
            "role": "Specialized collaborative swarm performing progressive reasoning via deterministic A2A handoffs.",
            "inputs": "Selected claim ID, policy record, precedent matches, ML anomaly scores, and rule signals.",
            "outputs": "Synthesized executive brief, evidence citations, interview probes, and formal SIU referral dossier.",
            "files": ["orchestrator.py, retrieval_agent.py, risk_agent.py", "anomaly_agent.py, summarizer_agent.py, investigation_agent.py"]
        },
        {
            "name": "BLOCK 4: Analytics & Machine Learning Engine",
            "color": ACCENT_L4,
            "bg": BOX_BG_L4,
            "tech": "Scikit-Learn (Isolation Forest), XGBoost, NumPy, Pandas",
            "role": "Dual-method scoring: heuristic business rule evaluation and unsupervised anomaly detection.",
            "inputs": "Engineered tabular features: claim-to-income ratio, filing velocity, premium volume, claim frequency.",
            "outputs": "Normalized Anomaly Score [-1 to +1], Composite Risk Score [0 to 100], 4-tier triage priority.",
            "files": ["rule_engine.py, isolation_forest.py", "ensemble_scorer.py, triage_features.py"]
        },
        {
            "name": "BLOCK 5: Data Foundation & Hybrid Knowledge Base",
            "color": ACCENT_L5,
            "bg": BOX_BG_L5,
            "tech": "ChromaDB (Dense Vectors), NetworkX (Property Graph), SQLite (Relational Store)",
            "role": "Unified enterprise data layer combining structured policies with semantic narrative indexing.",
            "inputs": "COIL 2000 benchmark dataset, synthesized incident narratives, policy portfolio tables.",
            "outputs": "Dense 384-d narrative embeddings, 2-hop graph neighborhood subgraphs, normalized SQL views.",
            "files": ["claims_synthesizer.py, vector_store.py", "graph_store.py, hybrid_retriever.py"]
        }
    ]

    card_y = PAGE_H - 68
    card_h = 76
    card_gap = 10

    for idx, b in enumerate(blocks_info):
        cy = card_y - (idx + 1) * (card_h + card_gap) + 12
        draw_rounded_card(c, canvas_x, cy, canvas_w, card_h, COLOR_PANEL_BG, b["color"], radius=5, border_w=1.2)

        # Title Tag
        c.setFillColor(b["color"])
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(canvas_x + 14, cy + card_h - 15, b["name"])

        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString(canvas_x + 360, cy + card_h - 15, f"Tech Stack: {b['tech']}")

        # Content Grid
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(canvas_x + 14, cy + card_h - 30, "CORE MISSION:")
        c.drawString(canvas_x + 14, cy + card_h - 44, "INPUT DATA:")
        c.drawString(canvas_x + 14, cy + card_h - 58, "OUTPUT DATA:")

        c.drawString(canvas_x + 460, cy + card_h - 30, "PRIMARY CODEBASE MODULES:")

        c.setFont("Helvetica", 7)
        c.setFillColor(COLOR_TEXT_BODY)
        c.drawString(canvas_x + 85, cy + card_h - 30, b["role"])
        c.drawString(canvas_x + 85, cy + card_h - 44, b["inputs"])
        c.drawString(canvas_x + 85, cy + card_h - 58, b["outputs"])

        c.setFont("Helvetica", 6.8)
        c.setFillColor(b["color"])
        for f_idx, f_line in enumerate(b["files"]):
            c.drawString(canvas_x + 460, cy + card_h - 43 - f_idx * 12, f_line)

    # Bottom Pipeline Summary
    p_box_y = 16
    p_box_h = 58
    draw_rounded_card(c, canvas_x, p_box_y, canvas_w, p_box_h, COLOR_PANEL_BG, colors.HexColor("#38BDF8"), radius=5, border_w=1.2)

    c.setFillColor(colors.HexColor("#38BDF8"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(canvas_x + 14, p_box_y + p_box_h - 14, "END-TO-END EXECUTION FLOW SUMMARY (7 STAGES)")

    steps = [
        "1. Ingestion\nCOIL 2000 + Synthesizer",
        "2. Storage\nSQLite + Chroma + Graph",
        "3. Scoring\nIsolation Forest + Rules",
        "4. Orchestration\nState-Machine Swarm",
        "5. Hybrid RAG\nVector + 2-Hop Graph",
        "6. Synthesis\nGrounded Dossier + SIU",
        "7. Reviewer\nHuman-in-the-Loop"
    ]
    step_w = (canvas_w - 28 - (len(steps) - 1) * 6) / len(steps)
    for s_idx, st in enumerate(steps):
        sx = canvas_x + 14 + s_idx * (step_w + 6)
        sy = p_box_y + 8
        draw_rounded_card(c, sx, sy, step_w, 28, BOX_BG_L1, colors.HexColor("#38BDF8"), radius=3, border_w=0.6)
        lines = st.split("\n")
        c.setFillColor(COLOR_TEXT_WHITE)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(sx + step_w / 2, sy + 16, lines[0])
        c.setFillColor(COLOR_TEXT_MUTED)
        c.setFont("Helvetica", 5.5)
        c.drawCentredString(sx + step_w / 2, sy + 7, lines[1])

def generate_pdf():
    print(f"[PDF] Creating High-Quality System Block Architecture PDF at:")
    print(f"  - {OUTPUT_PDF_DOCS}")
    print(f"  - {OUTPUT_PDF_ROOT}")

    c = canvas.Canvas(str(OUTPUT_PDF_DOCS), pagesize=landscape(A4))
    c.setTitle("Analyster - System Block Architecture Diagram")
    c.setAuthor("Analyster AI Engineering Team")
    c.setSubject("Insurance Claims Intelligence System Architecture")

    # Page 1: Clean Visual Block Architecture Diagram
    draw_page_1(c)
    c.showPage()

    # Page 2: Detailed Block Specifications & Flow Reference
    draw_page_2(c)
    c.showPage()

    c.save()

    # Copy to root
    shutil.copyfile(OUTPUT_PDF_DOCS, OUTPUT_PDF_ROOT)

    # Render PNG previews
    doc = fitz.open(str(OUTPUT_PDF_DOCS))
    page1 = doc.load_page(0)
    pix1 = page1.get_pixmap(dpi=200)
    pix1.save(str(DOCS_DIR / "system_block_architecture_p1.png"))

    page2 = doc.load_page(1)
    pix2 = page2.get_pixmap(dpi=200)
    pix2.save(str(DOCS_DIR / "system_block_architecture_p2.png"))

    print("[SUCCESS] PDF and preview images regenerated successfully.")

if __name__ == "__main__":
    generate_pdf()
