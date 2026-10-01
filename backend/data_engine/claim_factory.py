"""
Claim rows tied to COIL policies.

Schemes are separated from ordinary claims by behavior: a loss type that
does not match the line, a new or recently upgraded policy, a slow filing,
or a small linked group. Dollar size overlaps genuine catastrophic losses,
so amount alone is not the label.
"""
import datetime
import random
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from backend.data_engine.claims_synthesizer import (
    ANOMALOUS_NARRATIVE_TEMPLATES,
    INCIDENT_TEMPLATES,
)

LATEST_INCIDENT = datetime.date(2024, 9, 30)
STORM_DATE = datetime.date(2023, 8, 14)

SCHEMES_BY_CATEGORY = {tpl["category"]: tpl for tpl in ANOMALOUS_NARRATIVE_TEMPLATES}
SCHEME_HOME = {
    "STAGED_COLLISION_RING": {"Auto"},
    "INFLATED_WATER_REPAIR": {"Fire"},
    "RECENT_COVERAGE_SPIKE_FIRE": {"Fire"},
    "PHANTOM_LUXURY_BOAT_THEFT": {"Boat"},
}


def _parse_date(value: str) -> datetime.date:
    return datetime.date.fromisoformat(str(value))


def _pick(pool: pd.DataFrame) -> pd.Series:
    return pool.loc[random.choice(pool.index.tolist())]


def _pool_before(policies: pd.DataFrame, day: datetime.date) -> pd.DataFrame:
    inceptions = pd.to_datetime(policies["policy_inception_date"])
    pool = policies[inceptions <= pd.Timestamp(day)]
    return pool if len(pool) else policies


def _pool_between(policies: pd.DataFrame, start: datetime.date, end: datetime.date) -> pd.DataFrame:
    inceptions = pd.to_datetime(policies["policy_inception_date"])
    pool = policies[(inceptions >= pd.Timestamp(start)) & (inceptions <= pd.Timestamp(end))]
    return pool if len(pool) else policies


def _normal_amount(tpl: Dict[str, Any], severity: str, limit: float) -> float:
    base_val = random.uniform(tpl["base_min"], tpl["base_max"])
    severity_mult = {"Minor": 0.6, "Moderate": 1.0, "Major": 1.7, "Total Loss": 2.3}.get(severity, 1.0)
    noise = float(np.random.normal(1.0, 0.15))
    return round(min(max(base_val * severity_mult * noise, 450.0), limit * 0.45), 2)


def _established_incident(inception: datetime.date) -> datetime.date:
    start = max(inception + datetime.timedelta(days=180), datetime.date(2023, 1, 1))
    if start >= LATEST_INCIDENT:
        return LATEST_INCIDENT
    return start + datetime.timedelta(days=random.randint(0, (LATEST_INCIDENT - start).days))


class _ClaimBook:
    def __init__(self, policies: pd.DataFrame) -> None:
        self.policies = policies
        self.claims: List[Dict[str, Any]] = []
        self.ring_n = 0
        self.ring_filled = 0
        self.ring_anchor: Dict[str, datetime.date] = {}

    def next_ring(self, inception: datetime.date) -> tuple:
        if self.ring_filled >= 3:
            self.ring_n += 1
            self.ring_filled = 0
        self.ring_filled += 1
        group_id = f"RING-{self.ring_n:03d}"
        if group_id not in self.ring_anchor:
            self.ring_anchor[group_id] = _established_incident(inception)
        incident = self.ring_anchor[group_id] + datetime.timedelta(days=random.randint(0, 6))
        return group_id, incident

    def add(
        self,
        pol: pd.Series,
        inc_date: datetime.date,
        filing_delay: int,
        inc_type: str,
        inc_severity: str,
        narrative: str,
        claim_amt: float,
        claim_status: str,
        risk_label: str,
        is_anomaly: bool,
        anomaly_reasons: List[str],
        adjuster_notes: str,
        event_group_id: str,
    ) -> None:
        inception = _parse_date(pol["policy_inception_date"])
        if inc_date < inception:
            inc_date = inception + datetime.timedelta(days=1)
        if inc_date > LATEST_INCIDENT:
            inc_date = LATEST_INCIDENT
        change_raw = str(pol.get("coverage_change_date") or "")
        recent_increase = 0
        if change_raw:
            delta = (inc_date - _parse_date(change_raw)).days
            recent_increase = int(0 <= delta <= 30)
        limit = float(pol["coverage_limit_usd"])
        premium = float(pol["annual_premium_usd"])
        self.claims.append({
            "claim_id": f"CLM-2024-{len(self.claims) + 1:05d}",
            "customer_id": pol["customer_id"],
            "policy_id": pol["policy_id"],
            "policy_line": pol["policy_line"],
            "incident_date": inc_date.isoformat(),
            "filing_date": (inc_date + datetime.timedelta(days=int(filing_delay))).isoformat(),
            "filing_delay_days": int(filing_delay),
            "incident_type": inc_type,
            "incident_severity": inc_severity,
            "claim_amount_usd": float(claim_amt),
            "coverage_limit_usd": limit,
            "claim_to_limit_ratio": round(claim_amt / max(limit, 1.0), 4),
            "estimated_annual_premium_usd": premium,
            "claim_to_premium_ratio": round(claim_amt / max(premium, 1.0), 2),
            "claim_status": claim_status,
            "risk_label": risk_label,
            "is_anomaly_ground_truth": bool(is_anomaly),
            "anomaly_reasons": ",".join(anomaly_reasons) if anomaly_reasons else "NONE",
            "incident_narrative": narrative,
            "adjuster_notes": adjuster_notes,
            "days_since_inception": int((inc_date - inception).days),
            "recent_coverage_increase": recent_increase,
            "prior_claims_24m": 0,
            "linked_claims_90d": 0,
            "event_group_id": event_group_id,
        })

    def add_normal(self, pol: pd.Series, inc_date: datetime.date, catastrophic: bool, event_group_id: str = "NONE") -> None:
        line = pol["policy_line"]
        tpl = random.choice(INCIDENT_TEMPLATES.get(line, INCIDENT_TEMPLATES["Auto"]))
        severity = random.choice(tpl["severities"])
        delay = int(np.clip(np.random.lognormal(mean=1.6, sigma=0.75), 1, 55))
        limit = float(pol["coverage_limit_usd"])
        if catastrophic and severity in ("Major", "Total Loss"):
            amount = round(random.uniform(limit * 0.50, limit * 0.85), 2)
            notes = (
                "Field adjuster, police report, and independent surveyor agree. "
                "Documented catastrophic loss on an established policy."
            )
            label = "Medium"
        else:
            amount = _normal_amount(tpl, severity, limit)
            notes = "Estimates match the independent inspection. Documentation verified."
            label = "Low"
        status = random.choices(
            ["Settled", "Approved", "Open", "Under Investigation"],
            weights=[0.65, 0.22, 0.09, 0.04],
        )[0]
        self.add(
            pol, inc_date, delay, tpl["type"], severity, random.choice(tpl["narratives"]),
            amount, status, label, False, [], notes, event_group_id,
        )


def build_claim_facts(
    df_policies: pd.DataFrame,
    target_claims_count: int,
    anomaly_ratio: float,
) -> pd.DataFrame:
    eligible = df_policies[df_policies["policy_line"].isin(INCIDENT_TEMPLATES.keys())].copy()
    if len(eligible) == 0:
        eligible = df_policies.copy()

    n_storm = 28
    n_young = 40
    n_anomaly = int(round(target_claims_count * anomaly_ratio))
    n_ordinary = max(0, target_claims_count - n_anomaly - n_storm - n_young)
    book = _ClaimBook(df_policies)
    established = _pool_before(eligible, datetime.date(2022, 6, 1))
    recent = _pool_between(eligible, datetime.date(2023, 1, 1), datetime.date(2024, 6, 1))

    caravan = eligible[
        (eligible["policy_line"] == "Caravan")
        & (pd.to_datetime(eligible["policy_inception_date"]) < pd.Timestamp(STORM_DATE))
    ]
    storm_pool = caravan if len(caravan) else established
    for _ in range(n_storm):
        pol = _pick(storm_pool)
        storm_day = STORM_DATE + datetime.timedelta(days=random.randint(0, 3))
        book.add_normal(pol, storm_day, catastrophic=False, event_group_id="STORM-2023-08")

    for _ in range(n_ordinary):
        pol = _pick(established)
        book.add_normal(pol, _established_incident(_parse_date(pol["policy_inception_date"])), random.random() < 0.06)

    for _ in range(n_young):
        pol = _pick(recent)
        inception = _parse_date(pol["policy_inception_date"])
        inc_date = inception + datetime.timedelta(days=random.randint(8, 70))
        if random.random() < 0.15:
            change = inc_date - datetime.timedelta(days=random.randint(3, 20))
            if change > inception:
                pol = pol.copy()
                pol["coverage_change_date"] = change.isoformat()
                df_policies.loc[df_policies["policy_id"] == pol["policy_id"], "coverage_change_date"] = change.isoformat()
        book.add_normal(pol, inc_date, catastrophic=False)

    for _ in range(n_anomaly):
        kind = random.choices(["blatant", "subtle", "spike"], weights=[0.35, 0.45, 0.20])[0]
        if kind == "spike":
            scheme = SCHEMES_BY_CATEGORY["RECENT_COVERAGE_SPIKE_FIRE"]
            pool = recent
        elif kind == "subtle":
            scheme = SCHEMES_BY_CATEGORY["INFLATED_WATER_REPAIR"]
            pool = established
        else:
            scheme = random.choice([
                SCHEMES_BY_CATEGORY["STAGED_COLLISION_RING"],
                SCHEMES_BY_CATEGORY["PHANTOM_LUXURY_BOAT_THEFT"],
            ])
            pool = established
        homes = SCHEME_HOME[scheme["category"]]
        cross_line = random.random() < 0.22
        if cross_line:
            foreign = pool[~pool["policy_line"].isin(homes)]
            pol = _pick(foreign if len(foreign) else pool)
        else:
            home = pool[pool["policy_line"].isin(homes)]
            pol = _pick(home if len(home) else pool)
        limit = float(pol["coverage_limit_usd"])
        inception = _parse_date(pol["policy_inception_date"])
        event_group = "NONE"
        category = scheme["category"]

        if category == "STAGED_COLLISION_RING":
            event_group, inc_date = book.next_ring(inception)
            delay = int(np.clip(np.random.lognormal(mean=3.2, sigma=0.6), 15, 90))
            amount = round(random.uniform(limit * 0.50, limit * 0.85), 2)
            label = "High"
            notes = (
                "Damage pattern and the number of claimants do not match a low-speed impact. "
                "The same counsel and clinic appear on the linked claims."
            )
        elif category == "INFLATED_WATER_REPAIR":
            inc_date = _established_incident(inception)
            delay = int(np.clip(np.random.lognormal(mean=2.1, sigma=0.55), 2, 40))
            line_tpls = INCIDENT_TEMPLATES.get(pol["policy_line"], INCIDENT_TEMPLATES["Fire"])
            ceiling = max(tpl["base_max"] for tpl in line_tpls)
            amount = round(min(limit * 0.40, random.uniform(ceiling * 0.7, ceiling * 1.15)), 2)
            label = "Medium"
            notes = "Mitigation invoices run several times a typical dry-out. Some materials predate the leak."
        elif category == "PHANTOM_LUXURY_BOAT_THEFT":
            inc_date = _established_incident(inception)
            delay = random.randint(1, 4)
            amount = round(limit, 2)
            label = "High"
            notes = "Claimed amount equals the policy limit. No perimeter breach or title history supports the removal."
        else:
            if random.random() < 0.55:
                inc_date = inception + datetime.timedelta(days=random.randint(4, 21))
            else:
                inc_date = inception + datetime.timedelta(days=random.randint(30, 90))
                change = inc_date - datetime.timedelta(days=random.randint(3, 12))
                if change > inception:
                    pol = pol.copy()
                    pol["coverage_change_date"] = change.isoformat()
                    df_policies.loc[df_policies["policy_id"] == pol["policy_id"], "coverage_change_date"] = change.isoformat()
            delay = random.randint(1, 3)
            amount = round(random.uniform(limit * 0.50, limit * 0.85), 2)
            label = "High"
            notes = "Loss date sits within days of inception or a contribution increase. Two unlinked burn patterns were recorded."

        book.add(
            pol, inc_date, delay, scheme["type"], "Major", scheme["narrative"],
            amount, "Under Investigation", label, True, [category], notes, event_group,
        )

    _assign_history_features(book.claims)
    return pd.DataFrame(book.claims)


def _assign_history_features(claims: List[Dict[str, Any]]) -> None:
    """Prior claims and linked-event counts, computed after every claim exists."""
    by_customer: Dict[str, List[Dict[str, Any]]] = {}
    for claim in claims:
        by_customer.setdefault(claim["customer_id"], []).append(claim)
    for group in by_customer.values():
        group.sort(key=lambda row: row["incident_date"])
        for index, claim in enumerate(group):
            current = datetime.date.fromisoformat(claim["incident_date"])
            prior = 0
            for earlier in group[:index]:
                gap = (current - datetime.date.fromisoformat(earlier["incident_date"])).days
                if 0 < gap <= 730:
                    prior += 1
            claim["prior_claims_24m"] = prior

    by_event: Dict[str, List[Dict[str, Any]]] = {}
    for claim in claims:
        group_id = claim.get("event_group_id") or "NONE"
        if group_id != "NONE":
            by_event.setdefault(group_id, []).append(claim)
    for group in by_event.values():
        for claim in group:
            current = datetime.date.fromisoformat(claim["incident_date"])
            linked = 0
            for other in group:
                if other["claim_id"] == claim["claim_id"]:
                    continue
                gap = abs((current - datetime.date.fromisoformat(other["incident_date"])).days)
                if gap <= 90:
                    linked += 1
            claim["linked_claims_90d"] = linked
