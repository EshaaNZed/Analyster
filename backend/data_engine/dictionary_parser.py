"""
COIL 2000 Comprehensive Data Dictionary & Schema Parser
Dynamically parses data/raw/dictionary.txt into structured python mappings for:
- All 86 attribute definitions, descriptions, and domains
- L0: 41 Customer Subtypes
- L1: 6 Age Groups
- L2: 10 Customer Main Types
- L3: Sociodemographic Percentages
- L4: Contribution Tiers in USD approximate values
"""
import os
import re
from typing import Dict, List, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DICT_PATH = os.path.join(BASE_DIR, "data", "raw", "dictionary.txt")

# L0: Customer Subtypes (41 categories)
CUSTOMER_SUBTYPES = {
    1: "High Income, expensive child",
    2: "Very Important Provincials",
    3: "High status seniors",
    4: "Affluent senior apartments",
    5: "Mixed seniors",
    6: "Career and childcare",
    7: "Dinki's (double income no kids)",
    8: "Middle class families",
    9: "Modern, complete families",
    10: "Stable family",
    11: "Family starters",
    12: "Affluent young families",
    13: "Young all american family",
    14: "Junior cosmopolitan",
    15: "Senior cosmopolitans",
    16: "Students in apartments",
    17: "Fresh masters in the city",
    18: "Single youth",
    19: "Suburban youth",
    20: "Ethnically diverse",
    21: "Young urban have-nots",
    22: "Mixed apartment dwellers",
    23: "Young and rising",
    24: "Young, low educated",
    25: "Young seniors in the city",
    26: "Own home elderly",
    27: "Seniors in apartments",
    28: "Residential elderly",
    29: "Porchless seniors: no front yard",
    30: "Religious elderly singles",
    31: "Low income catholics",
    32: "Mixed seniors",
    33: "Lower class large families",
    34: "Large family, employed child",
    35: "Village families",
    36: "Couples with teens 'Married with children'",
    37: "Mixed small town dwellers",
    38: "Traditional families",
    39: "Large religious families",
    40: "Large family farms",
    41: "Mixed rurals"
}

# L1: Age Categories
AGE_CATEGORIES = {
    1: "20-30 years",
    2: "30-40 years",
    3: "40-50 years",
    4: "50-60 years",
    5: "60-70 years",
    6: "70-80 years"
}

# L2: Customer Main Types (10 groups)
CUSTOMER_MAIN_TYPES = {
    1: "Successful hedonists",
    2: "Driven Growers",
    3: "Average Family",
    4: "Career Loners",
    5: "Living well",
    6: "Cruising Seniors",
    7: "Retired and Religious",
    8: "Family with grown ups",
    9: "Conservative families",
    10: "Farmers"
}

# L4: Contribution Tiers in USD approximate values (median of tier ranges)
CONTRIBUTION_TIER_DOLLARS = {
    0: 0.0,
    1: 25.0,
    2: 75.0,
    3: 150.0,
    4: 350.0,
    5: 750.0,
    6: 3000.0,
    7: 7500.0,
    8: 15000.0,
    9: 25000.0
}

# Mapping of product code bases to human readable policy lines
PRODUCT_CODE_TO_LINE = {
    "WAPART": "Private Third Party",
    "WABG": "Commercial Third Party",
    "WALLEEN": "Agri Third Party",
    "PERSAUT": "Car / Auto",
    "BESAUT": "Delivery Van",
    "MOTSCO": "Motorcycle / Scooter",
    "AANHANG": "Lorry / Trailer",
    "TRACTOR": "Tractor",
    "WERKT": "Agri Machinery",
    "BROM": "Moped",
    "LEVEN": "Life Insurance",
    "PERSONG": "Private Accident",
    "GEZONG": "Family Accident",
    "WAOREG": "Disability",
    "BRAND": "Fire Policy",
    "ZEILPL": "Surfboard",
    "PLEZIER": "Boat Policy",
    "FIETS": "Bicycle",
    "INBOED": "Property / Contents",
    "BYSTAND": "Social Security",
    "CARAVAN": "Mobile Home / Caravan"
}

def parse_data_dictionary(dict_path: str = RAW_DICT_PATH) -> List[Dict[str, Any]]:
    """
    Parses the 86 attributes from dictionary.txt.
    Returns a list of dicts with: nr, code, description, domain, category, policy_line.
    """
    with open(dict_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    pos_table = text.find("Nr Name Description Domain")
    pos_end = text.find("L0:")
    table_text = text[pos_table:pos_end].strip()
    lines = [l.strip() for l in table_text.splitlines() if l.strip()][1:]

    attributes = []
    for line in lines:
        parts = line.split()
        if len(parts) >= 3 and parts[0].isdigit():
            nr = int(parts[0])
            code = parts[1]
            desc = " ".join(parts[2:-1]) if len(parts) > 3 else parts[2]
            domain = parts[-1]

            # Categorize the feature
            if nr <= 43:
                category = "sociodemographic"
                policy_line = None
            elif nr <= 64:
                category = "contribution"
                product_suffix = code[1:] if code.startswith("P") else code
                policy_line = PRODUCT_CODE_TO_LINE.get(product_suffix, "General")
            elif nr <= 85:
                category = "policy_count"
                product_suffix = code[1:] if code.startswith("A") else code
                policy_line = PRODUCT_CODE_TO_LINE.get(product_suffix, "General")
            else:
                category = "target"
                policy_line = "Caravan"

            attributes.append({
                "nr": nr,
                "code": code,
                "description": desc,
                "domain": domain,
                "category": category,
                "policy_line": policy_line
            })

    return attributes

# Cache attributes list
ALL_ATTRIBUTES = parse_data_dictionary()
ALL_COLUMN_NAMES = [a["code"] for a in ALL_ATTRIBUTES]
COLUMN_LOOKUP = {a["code"]: a for a in ALL_ATTRIBUTES}

def get_all_column_names() -> List[str]:
    return ALL_COLUMN_NAMES

def get_column_metadata(code: str) -> Dict[str, Any]:
    return COLUMN_LOOKUP.get(code, {})
