"""
High-Fidelity Deterministic Claims Synthesizer & Knowledge Base Generator
Generates realistic, domain-grounded insurance claims tied directly to
authentic COIL 2000 customer policies with rich incident narratives,
amounts, dates, statuses, and controlled anomaly patterns for evaluation.
"""
import os
import random
import datetime
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

from backend.data_engine.dictionary_parser import (
    CONTRIBUTION_TIER_DOLLARS,
    PRODUCT_CODE_TO_LINE
)

# Deterministic seed for reproducible evaluation
RANDOM_SEED = 42

# Incident templates with realistic insurance adjuster narratives
INCIDENT_TEMPLATES = {
    "Auto": [
        {
            "type": "Rear-End Collision",
            "severities": ["Minor", "Moderate", "Major"],
            "base_min": 1200, "base_max": 8500,
            "narratives": [
                "Insured vehicle was struck from behind while stationary at a signalized intersection. Rear bumper crushed, trunk lid misaligned, and tail light assemblies shattered. Airbags did not deploy. Claimant reported minor neck stiffness.",
                "Vehicle was rear-ended in heavy stop-and-go highway traffic. Impact pushed vehicle into leading car, resulting in front and rear fascia damage. Radiator support cracked. Police report filed at scene."
            ]
        },
        {
            "type": "Intersection T-Bone Impact",
            "severities": ["Moderate", "Major", "Total Loss"],
            "base_min": 4500, "base_max": 28000,
            "narratives": [
                "Insured was proceeding on green light when a third-party vehicle failed to yield and impacted the passenger side. Significant structural intrusion along B-pillar and both passenger doors. Side curtain airbags deployed. Tow required.",
                "Broadside collision at uncontrolled intersection during heavy rain. Front quarter panel, suspension, and steering rack compromised. Vehicle deemed unsafe to drive and towed to certified repair facility."
            ]
        },
        {
            "type": "Single Vehicle Roadside Impact",
            "severities": ["Minor", "Moderate"],
            "base_min": 1800, "base_max": 9500,
            "narratives": [
                "Insured swerved to avoid crossing wildlife on unlit rural road, colliding with roadside guardrail. Damage concentrated on driver front bumper, headlight, and wheel arch. No other vehicles involved.",
                "Loss of traction on black ice caused vehicle to slide into concrete median barrier. Front subframe and wheel rim cracked. No injuries reported."
            ]
        },
        {
            "type": "Catalytic Converter & Component Theft",
            "severities": ["Minor", "Moderate"],
            "base_min": 1500, "base_max": 4200,
            "narratives": [
                "Vehicle parked overnight in commuter lot. Exhaust system severed cleanly beneath chassis and catalytic converter removed. Oxygen sensors stripped. Comprehensive theft claim submitted with police report number.",
                "Insured discovered vehicle propped on cinder blocks in driveway with all four alloy wheels, tires, and brake assemblies stolen. Ground scuffs along rocker panels."
            ]
        }
    ],
    "Fire": [
        {
            "type": "Kitchen Grease Fire",
            "severities": ["Moderate", "Major"],
            "base_min": 8500, "base_max": 45000,
            "narratives": [
                "Unattended cooking oil ignited on stovetop, spreading rapidly to wooden cabinetry and exhaust hood. Fire department responded within 12 minutes. Heavy smoke damage throughout ground floor and water saturation across kitchen subflooring.",
                "Deep fryer flare-up caused flame spread to kitchen drywall. Heat blistering across ceiling joists. Structural fire damage contained to kitchen area, but substantial soot cleanup needed throughout residence."
            ]
        },
        {
            "type": "Electrical Fault Fire",
            "severities": ["Major", "Total Loss"],
            "base_min": 15000, "base_max": 95000,
            "narratives": [
                "Overheated breaker panel in basement initiated smoldering fire inside stud wall cavity. Flames traveled upward between floors before breaching living room drywall. Significant structural timber charring and complete electrical overhaul required.",
                "Faulty space heater wiring ignited living room drapery while residents were asleep. Smoke detectors alerted occupants. Fire caused severe burn-through of roof rafters and extensive water damage from fire brigade hoses."
            ]
        },
        {
            "type": "Chimney / Fireplace Thermal Spread",
            "severities": ["Minor", "Moderate"],
            "base_min": 4000, "base_max": 18000,
            "narratives": [
                "Creosote buildup in masonry chimney flue sparked internal combustion. Thermal crack allowed embers into attic insulation. Prompt response by local brigade prevented full roof ignition. Flue relining and attic decontamination required."
            ]
        }
    ],
    "Boat": [
        {
            "type": "Submerged Hazard & Hull Puncture",
            "severities": ["Moderate", "Major"],
            "base_min": 6000, "base_max": 38000,
            "narratives": [
                "Vessel struck an unmarked submerged deadhead log while navigating marked harbor channel. Hull gelcoat breached along starboard bow, causing rapid bilge water ingress. Auxiliary bilge pump engaged; vessel towed to marina hoist for emergency haul-out.",
                "Twin outboard lower gearcases struck submerged rock ledge at cruising speed. Both skegs sheared, stainless steel propellers mangled, and drive shafts warped. Mechanical survey confirms complete lower unit replacements."
            ]
        },
        {
            "type": "Marina Slip Docking Collision",
            "severities": ["Minor", "Moderate"],
            "base_min": 2500, "base_max": 12000,
            "narratives": [
                "Sudden wind squall during docking approach threw stern into concrete piling. Swim platform shattered and rub-rail detached. Port transom fiberglass fractured above waterline."
            ]
        }
    ],
    "Private Accident": [
        {
            "type": "Slip and Fall with Fracture",
            "severities": ["Minor", "Moderate", "Major"],
            "base_min": 3000, "base_max": 24000,
            "narratives": [
                "Claimant slipped on icy external steps while descending home porch, sustaining closed fracture of distal radius and wrist dislocation. Emergency room treatment, cast stabilization, and 8 weeks of physical therapy documented.",
                "Fall on wet tiled commercial entryway resulted in fractured femoral neck requiring internal fixation surgery. Submitting medical billing statements and lost wage documentation."
            ]
        },
        {
            "type": "Power Tool Laceration / Trauma",
            "severities": ["Moderate", "Major"],
            "base_min": 4500, "base_max": 32000,
            "narratives": [
                "Kickback incident while operating table saw in home workshop caused severe tendon and nerve lacerations to dominant left hand. Micro-surgical repair performed. Claim submitted for outpatient physical therapy and temporary partial disability."
            ]
        }
    ],
    "Caravan": [
        {
            "type": "Storm Hail and Tree Branch Impact",
            "severities": ["Minor", "Moderate"],
            "base_min": 2200, "base_max": 14000,
            "narratives": [
                "Severe thunderstorm brought 2-inch hail and fallen pine limb onto mobile home aluminum roof. Punctured roof membrane, shattered skylight, and caused interior water intrusion onto living area carpet.",
                "High winds at holiday park caused awning detachment and side panel punctures. Water entered electrical breaker enclosure."
            ]
        }
    ]
}

# Suspicious / Anomaly Narrative Injections (for testing similarity search & fraud detection)
ANOMALOUS_NARRATIVE_TEMPLATES = [
    {
        "category": "STAGED_COLLISION_RING",
        "type": "Suspicious Multi-Party Collision",
        "narrative": "Insured vehicle alleged sudden brake event leading to rear collision with third-party vehicle occupied by 4 unbelted passengers. All occupants retained same legal counsel and clinic on same business day. Identical soft tissue injury claims submitted. Vehicle damage pattern inconsistent with described low-speed impact velocity.",
        "amount_multiplier": 3.8,
        "filing_delay": 45,
        "status": "Under Investigation"
    },
    {
        "category": "INFLATED_WATER_REPAIR",
        "type": "Inflated Water Restoration",
        "narrative": "Claim submitted for sudden pipe rupture in unoccupied guest wing. Restoration contractor billed 24 industrial air movers and 6 commercial dehumidifiers for 21 days continuously, exceeding standard mitigation duration by 400%. Demolition invoices include pre-existing renovation materials not damaged by water.",
        "amount_multiplier": 4.5,
        "filing_delay": 60,
        "status": "Under Investigation"
    },
    {
        "category": "RECENT_COVERAGE_SPIKE_FIRE",
        "type": "Suspicious Early Inception Fire",
        "narrative": "Commercial property fire reported 9 days following policy contribution upgrade. Fire originated in storage room with two distinct, unlinked burn patterns detected by arson investigator. Stock inventory records requested but claimant unable to provide supporting receipts or tax filings.",
        "amount_multiplier": 5.2,
        "filing_delay": 2,
        "status": "Under Investigation"
    },
    {
        "category": "PHANTOM_LUXURY_BOAT_THEFT",
        "type": "High-Value Marine Equipment Loss",
        "narrative": "Claimant alleges twin 350HP marine engines unbolted and removed from dry dock trailer overnight with no perimeter fence breaches or security footage. Claim amount matches maximum policy limit to the exact dollar. Title transfer completed only 3 weeks prior.",
        "amount_multiplier": 4.0,
        "filing_delay": 1,
        "status": "Under Investigation"
    }
]

def synthesize_claims_knowledge_base(
    df_customers: pd.DataFrame,
    target_claims_count: int = 1500,
    anomaly_ratio: float = 0.12,
    seed: int = RANDOM_SEED
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Synthesizes realistic, domain-grounded claims directly linked to
    COIL 2000 customers and their active policies.
    Returns:
    - df_policies: Normalized policies table
    - df_claims: Fact table of enriched claims with text narratives and risk labels
    """
    print(f"[CLAIMS SYNTHESIZER] Generating {target_claims_count} linked claims (Anomaly ratio: {anomaly_ratio:.1%})...")
    random.seed(seed)
    np.random.seed(seed)

    # 1. First, build the normalized dim_policies table from customer holdings
    policies = []
    policy_id_counter = 1

    policy_columns_map = [
        ("Auto", "APERSAUT", "PPERSAUT", 50000.0),
        ("Fire", "ABRAND", "PBRAND", 250000.0),
        ("Boat", "APLEZIER", "PPLEZIER", 80000.0),
        ("Private Accident", "APERSONG", "PPERSONG", 60000.0),
        ("Life Insurance", "ALEVEN", "PLEVEN", 150000.0),
        ("Caravan", "CARAVAN", "CARAVAN", 35000.0),
        ("Third Party", "AWAPART", "PWAPART", 40000.0),
        ("Property", "AINBOED", "PINBOED", 120000.0)
    ]

    for _, cust in df_customers.iterrows():
        cust_id = cust["customer_id"]
        for line_name, count_col, contrib_col, default_limit in policy_columns_map:
            count = int(cust.get(count_col, 0))
            if count > 0:
                tier = int(cust.get(contrib_col, 1)) if contrib_col in cust else 1
                annual_spend = CONTRIBUTION_TIER_DOLLARS.get(tier, 150.0)
                # Policy limit scales with contribution tier
                tier_factor = max(0.5, tier * 0.4)
                policy_limit = round(default_limit * tier_factor, -2)

                inception = datetime.date(2018, 1, 1) + datetime.timedelta(days=random.randint(0, 2300))
                coverage_change = ""
                if random.random() < 0.12:
                    change = inception + datetime.timedelta(days=random.randint(90, 800))
                    if change < datetime.date(2024, 9, 1):
                        coverage_change = change.isoformat()
                policies.append({
                    "policy_id": f"POL-{policy_id_counter:06d}",
                    "customer_id": cust_id,
                    "policy_line": line_name,
                    "policy_count": count,
                    "contribution_tier": tier,
                    "annual_premium_usd": annual_spend,
                    "coverage_limit_usd": policy_limit,
                    "policy_inception_date": inception.isoformat(),
                    "coverage_change_date": coverage_change,
                    "policy_status": "Active"
                })
                policy_id_counter += 1

    df_policies = pd.DataFrame(policies)
    print(f"[CLAIMS SYNTHESIZER] Created {len(df_policies)} active policy contracts across {df_customers['customer_id'].nunique()} customers.")

    from backend.data_engine.claim_factory import build_claim_facts
    df_claims = build_claim_facts(df_policies, target_claims_count, anomaly_ratio)

    print(f"[CLAIMS SYNTHESIZER] Successfully synthesized {len(df_claims)} claims.")
    print(f"  - Anomaly distribution: {df_claims['is_anomaly_ground_truth'].sum()} anomalous, {(~df_claims['is_anomaly_ground_truth']).sum()} normal.")
    print(f"  - Policy line breakdown: {df_claims['policy_line'].value_counts().to_dict()}")

    return df_policies, df_claims
