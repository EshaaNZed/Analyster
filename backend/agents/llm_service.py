"""
LLM Service — Google Gemini Integration for Multi-Agent RAG
=============================================================
Provides generative LLM capabilities for:
  - Agent 4 (ClaimsSummarizationAgent): Generative grounded executive brief & key drivers
  - Agent 5 (InvestigationSupportAgent): Forensic investigation action items & interview probes

Uses the official `google.genai` SDK with `gemini-1.5-flash` / `gemini-2.0-flash`.
Includes automatic fallback to deterministic grounded generation if no API key is provided.
"""
import os
import re
import json
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("ClaimsIntelligence.LLM")

# Try to load .env file if present
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.isfile(ENV_PATH):
    try:
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k not in os.environ:
                        os.environ[k] = v
    except Exception as e:
        logger.warning(f"Could not load .env file: {e}")


class GeminiLLMService:
    """Singleton service wrapping the Google Gemini LLM API."""

    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model_name = model_name
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self._client = None
        self._init_client()

    def _init_client(self):
        """Initialize Google GenAI client if API key is present."""
        if not self.api_key:
            logger.info("[LLM SERVICE] GEMINI_API_KEY not configured. Running in deterministic grounded fallback mode.")
            return

        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
            logger.info(f"[LLM SERVICE] Google Gemini client initialized with model: {self.model_name}")
        except Exception as e:
            logger.warning(f"[LLM SERVICE] Could not initialize google.genai: {e}")
            self._client = None

    def is_available(self) -> bool:
        """Returns True if Gemini LLM is configured and ready."""
        return self._client is not None

    def get_status_info(self) -> Dict[str, Any]:
        """Telemetry metadata for health check and reviewer studio."""
        return {
            "provider": "Google Gemini",
            "model": self.model_name,
            "active": self.is_available(),
            "mode": "Generative LLM (gemini-1.5-flash)" if self.is_available() else "Deterministic Grounded Fallback"
        }

    def generate_executive_summary(
        self,
        claim_data: Dict[str, Any],
        precedent_text: str,
        risk_tier: str,
        risk_score: int,
        shap_factors: List[Dict[str, Any]],
        anomaly_summary: str,
        flagged_anomalies: List[str]
    ) -> Optional[Tuple[str, List[str]]]:
        """
        Synthesizes an executive summary and key risk drivers using Gemini LLM.
        Returns (executive_summary, list_of_key_risk_drivers) or None on failure.
        """
        if not self.is_available():
            return None

        prompt = f"""You are a Senior Insurance Forensic Examiner for Analyster Intelligence.
Generate a concise, highly factual, grounded Executive Briefing for an insurance claim review.

### GROUND TRUTH CLAIM CONTEXT:
- Claim ID: {claim_data.get('claim_id')}
- Customer ID: {claim_data.get('customer_id')} ({claim_data.get('customer_subtype_name', 'Policyholder')})
- Policy ID: {claim_data.get('policy_id')} ({claim_data.get('policy_line')})
- Claim Loss Amount: ${float(claim_data.get('claim_amount_usd', 0)):,.2f}
- Policy Coverage Limit: ${float(claim_data.get('coverage_limit_usd', 0)):,.2f}
- Annual Premium: ${float(claim_data.get('annual_premium_usd', 0)):,.2f}
- Incident Date: {claim_data.get('incident_date')}
- Filing Date: {claim_data.get('filing_date')} ({claim_data.get('filing_delay_days')} days FNOL delay)
- Incident Narrative: "{claim_data.get('incident_narrative')}"

### ENSEMBLE RISK & ANOMALY FINDINGS:
- Overall Ensemble Risk: {risk_score}/100 ({risk_tier} Risk)
- Top SHAP Risk Drivers: {json.dumps(shap_factors[:4])}
- Isolation Forest Outlier Analysis: {anomaly_summary}
- Flagged Anomaly Categories: {flagged_anomalies}
- Precedent Case Precedents: {precedent_text}

### INSTRUCTIONS:
1. Provide a professional, strictly grounded executive summary in 3-4 concise bullet points.
2. Ground all numbers, dates, and names strictly in the provided data. Do not hallucinate false assertions.
3. List exactly 3 to 4 distinct key risk drivers.
4. Output your response ONLY in valid JSON matching this exact structure:
{{
  "executive_summary": "Executive brief string with bullet points (using bullet character • and newlines)...",
  "key_risk_drivers": [
    "Driver 1...",
    "Driver 2...",
    "Driver 3..."
  ]
}}
"""
        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            text = response.text.strip()
            # Extract JSON from potential code fences
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                summary = data.get("executive_summary")
                drivers = data.get("key_risk_drivers", [])
                if summary and drivers:
                    return summary, drivers
        except Exception as e:
            logger.warning(f"[LLM SERVICE] Gemini summary generation error: {e}")

        return None

    def generate_investigation_probes(
        self,
        claim_data: Dict[str, Any],
        risk_score: int,
        risk_tier: str,
        flagged_anomalies: List[str],
        exec_summary: str
    ) -> Optional[Tuple[List[str], List[str]]]:
        """
        Formulates adjuster action items and direct claimant interview questions using Gemini LLM.
        Returns (recommended_actions, interview_questions) or None on failure.
        """
        if not self.is_available():
            return None

        prompt = f"""You are a Special Investigation Unit (SIU) Director and Claims Adjuster Mentor.
Based on the following claim and risk findings, formulate actionable verification checklist items and forensic interview probes for the adjuster.

### CLAIM FACTS:
- Claim ID: {claim_data.get('claim_id')}
- Line: {claim_data.get('policy_line')}
- Incident Narrative: "{claim_data.get('incident_narrative')}"
- Amount: ${float(claim_data.get('claim_amount_usd', 0)):,.2f}
- Delay: {claim_data.get('filing_delay_days')} days post-incident
- Risk Score: {risk_score}/100 ({risk_tier} Risk)
- Flagged Anomalies: {flagged_anomalies}

### INSTRUCTIONS:
1. Provide 4 concrete, actionable verification tasks for the adjuster (e.g. subpoena video, request repair invoices, verify VIN/serial).
2. Provide 3 targeted, forensic claimant interview questions specifically addressing inconsistencies in the incident narrative.
3. Output your response ONLY in valid JSON matching this exact structure:
{{
  "recommended_actions": [
    "Action 1...",
    "Action 2...",
    "Action 3...",
    "Action 4..."
  ],
  "interview_questions": [
    "Question 1...",
    "Question 2...",
    "Question 3..."
  ]
}}
"""
        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            text = response.text.strip()
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                actions = data.get("recommended_actions", [])
                questions = data.get("interview_questions", [])
                if actions and questions:
                    return actions, questions
        except Exception as e:
            logger.warning(f"[LLM SERVICE] Gemini probes generation error: {e}")

        return None


# Global singleton instance
_llm_service = None

def get_llm_service() -> GeminiLLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = GeminiLLMService()
    return _llm_service
