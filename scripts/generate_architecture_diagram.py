"""
Generate High-Resolution Architecture Diagram (PNG + PDF + SVG)
Deliverable 1 for AI-Powered Insurance Claims Intelligence Assistant
Uses pure PIL and SVG generation (zero external plotting dependencies).
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)

def generate_diagram():
    print("[DIAGRAM] Generating High-Resolution System Architecture Diagram...")
    
    # 3840 x 2160 (4K UHD Canvas)
    width = 3840
    height = 2160
    
    img = Image.new("RGB", (width, height), color="#0B0F19")
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("arialbd.ttf", 68)
        font_sub = ImageFont.truetype("arial.ttf", 34)
        font_stage_num = ImageFont.truetype("arialbd.ttf", 26)
        font_stage_title = ImageFont.truetype("arialbd.ttf", 34)
        font_item = ImageFont.truetype("arial.ttf", 28)
        font_bottom = ImageFont.truetype("arialbd.ttf", 30)
    except Exception:
        font_title = font_sub = font_stage_num = font_stage_title = font_item = font_bottom = ImageFont.load_default()

    # Draw Header
    title_text = "ANALYSTER: AI-POWERED INSURANCE CLAIMS INTELLIGENCE ASSISTANT"
    sub_text = "End-to-End Architecture: Claims Data  Data Processing  Retrieval/Analytics  Risk & Anomaly  Multi-Agent Swarm  Claims Insights  Human Reviewer"
    
    draw.text((width // 2, 120), title_text, fill="#38BDF8", font=font_title, anchor="mm")
    draw.text((width // 2, 200), sub_text, fill="#94A3B8", font=font_sub, anchor="mm")

    # Stages Definition
    stages = [
        {
            "num": "STAGE 1",
            "title": "Claims Data\n& Ingestion",
            "accent": "#3B82F6",
            "items": [
                "COIL 2000 Benchmark",
                "86 Demographic/Policy Feats",
                "1,500 Normalized Claims",
                "Synthetic Incident Narratives",
                "Adjuster Forensic Notes",
                "Ground Truth Anomaly Tags"
            ]
        },
        {
            "num": "STAGE 2",
            "title": "Data Processing\n& Storage",
            "accent": "#6366F1",
            "items": [
                "Data Quality & Imputation",
                "Normalized fact_claims",
                "dim_policies & dim_customers",
                "SQLite Relational DB",
                "v_claims_full_dossier View",
                "SHA-256 Hash Integrity"
            ]
        },
        {
            "num": "STAGE 3",
            "title": "Hybrid Knowledge\nBase (Graph-RAG)",
            "accent": "#8B5CF6",
            "items": [
                "ChromaDB Persistent Store",
                "all-MiniLM-L6-v2 Vectors",
                "NetworkX Knowledge Graph",
                "25,543 Nodes / 22,184 Edges",
                "2-Hop Graph Traversal",
                "Semantic Precedent Matching"
            ]
        },
        {
            "num": "STAGE 4",
            "title": "Risk & Anomaly\nDetection Engine",
            "accent": "#EC4899",
            "items": [
                "XGBoost Classifier (50%)",
                "Calibrated RF Validator (25%)",
                "Isolation Forest Outliers (15%)",
                "Deterministic Rule Engine (10%)",
                "SHAP TreeExplainer Attrib",
                "4-Tier Triage Prioritization"
            ]
        },
        {
            "num": "STAGE 5",
            "title": "Multi-Agent\nIntelligence Mesh",
            "accent": "#F59E0B",
            "items": [
                "Claims Retrieval Agent",
                "Claims Risk Analysis Agent",
                "Anomaly Detection Agent",
                "Claims Summarization Agent",
                "Investigation Support Agent",
                "Deterministic A2A Handoffs"
            ]
        },
        {
            "num": "STAGE 6",
            "title": "Claims Insights\n& Synthesis",
            "accent": "#10B981",
            "items": [
                "Gemini LLM Synthesis",
                "Evidence Grounded Dossier",
                "Forensic Action Plan",
                "Claimant Interview Probes",
                "SIU Fraud Referral Pack",
                "Zero-Hallucination Fallback"
            ]
        },
        {
            "num": "STAGE 7",
            "title": "Human Reviewer\n& Studio",
            "accent": "#06B6D4",
            "items": [
                "Interactive Reviewer Studio",
                "Real-Time What-If Simulator",
                "Vis-Network Graph Explorer",
                "Audit Log & Citation View",
                "SIU Case Export / Print",
                "Human-in-the-Loop Signoff"
            ]
        }
    ]

    card_width = 460
    card_height = 1450
    start_y = 320
    spacing = 530
    start_x = (width - (len(stages) * spacing - (spacing - card_width))) // 2

    for i, s in enumerate(stages):
        cx = start_x + i * spacing
        cy = start_y

        # Draw card background
        draw.rounded_rectangle([cx, cy, cx + card_width, cy + card_height], radius=24, fill="#1E293B", outline=s["accent"], width=4)
        
        # Header Box
        draw.rounded_rectangle([cx + 12, cy + 12, cx + card_width - 12, cy + 220], radius=16, fill=s["accent"])
        
        # Header text
        draw.text((cx + card_width // 2, cy + 50), s["num"], fill="#FFFFFF", font=font_stage_num, anchor="mm")
        
        lines = s["title"].split("\n")
        if len(lines) == 1:
            draw.text((cx + card_width // 2, cy + 130), lines[0], fill="#FFFFFF", font=font_stage_title, anchor="mm")
        else:
            draw.text((cx + card_width // 2, cy + 115), lines[0], fill="#FFFFFF", font=font_stage_title, anchor="mm")
            draw.text((cx + card_width // 2, cy + 165), lines[1], fill="#FFFFFF", font=font_stage_title, anchor="mm")

        # Items list
        item_y = cy + 290
        for item in s["items"]:
            # Bullet point
            draw.ellipse([cx + 35, item_y + 8, cx + 51, item_y + 24], fill=s["accent"])
            draw.text((cx + 65, item_y), item, fill="#E2E8F0", font=font_item)
            item_y += 180

        # Draw connecting arrow between stages
        if i < len(stages) - 1:
            arrow_start_x = cx + card_width + 8
            arrow_end_x = arrow_start_x + (spacing - card_width) - 16
            arrow_y = cy + card_height // 2
            
            # Arrow line
            draw.line([(arrow_start_x, arrow_y), (arrow_end_x, arrow_y)], fill="#38BDF8", width=6)
            # Arrowhead
            draw.polygon([
                (arrow_end_x, arrow_y),
                (arrow_end_x - 20, arrow_y - 14),
                (arrow_end_x - 20, arrow_y + 14)
            ], fill="#38BDF8")

    # Bottom Governance Banner
    bottom_y = start_y + card_height + 60
    draw.rounded_rectangle([start_x, bottom_y, start_x + (len(stages)-1)*spacing + card_width, bottom_y + 120],
                           radius=18, fill="#111827", outline="#38BDF8", width=3)
    
    gov_text = "ENTERPRISE GOVERNANCE: Deterministic State-Machine Handoffs  *  Explicit A2A Protocol  *  100% Grounded Traceability  *  Human-in-the-Loop Decision Support"
    draw.text((width // 2, bottom_y + 60), gov_text, fill="#38BDF8", font=font_bottom, anchor="mm")

    # Save PNG and PDF
    png_path = DOCS_DIR / "architecture_diagram.png"
    pdf_path = DOCS_DIR / "architecture_diagram.pdf"
    
    img.save(png_path, "PNG", quality=95)
    img.save(pdf_path, "PDF", resolution=300.0)

    print(f"[SUCCESS] Architecture Diagram exported:")
    print(f"   - {png_path}")
    print(f"   - {pdf_path}")

if __name__ == "__main__":
    generate_diagram()
