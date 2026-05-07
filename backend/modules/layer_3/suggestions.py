# modules/layer_3/suggestions.py
"""
Burnout Pattern Intervention Catalog (Layer 3)
-----------------------------------------------
Static catalog of the 12 canonical burnout patterns and their suggested
interventions. Optionally enriched per-pattern by the local LLM to add a
context-aware "manager script" the HR / team-lead can copy-paste.
"""

import json
import os
import requests
from typing import Optional, List, Dict


BURNOUT_PATTERNS: List[Dict] = [
    {
        "id": 1,
        "pattern": "Quantitative Overload",
        "risk_dimension": "Workload",
        "signals": ">50 hrs/week + meetings after 7 PM + active tasks > avg×1.5",
        "eri_level": "Red",
        "suggested_interventions": [
            "Suggest micro-breaks throughout the day",
            "Reprioritize active tasks; defer non-critical work",
            "Recommend async alternatives to live meetings",
            "If persistent, trigger a workload-reduction discussion",
        ],
        "action_type": "Personal / System / Managerial",
        "audience": "Employee / Manager",
    },
    {
        "id": 2,
        "pattern": "Cognitive Fragmentation",
        "risk_dimension": "Workload",
        "signals": ">10 switches/hr + back-to-back meetings + >15 notifications/hr",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Activate focus mode and silence non-critical notifications",
            "Batch notifications into 2–3 windows per day",
            "Protect deep-work blocks (≥90 min)",
            "Add 10-minute buffers between meetings",
        ],
        "action_type": "Personal / System",
        "audience": "Employee / Manager",
    },
    {
        "id": 3,
        "pattern": "Micromanagement Dependency",
        "risk_dimension": "Autonomy",
        "signals": "Low-impact approvals + frequent direct 'update?' pings + low energy check-in",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Reduce approval layers for low-impact decisions",
            "Clarify decision rights and ownership",
            "Shift to outcome-based weekly check-ins",
        ],
        "action_type": "Managerial",
        "audience": "Manager",
    },
    {
        "id": 4,
        "pattern": "Workflow Rigidity",
        "risk_dimension": "Autonomy",
        "signals": "0% flexibility + strict 9–5 enforcement + high camera-on time",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Introduce flexible work windows",
            "Reduce mandatory synchronous control",
            "Review autonomy constraints with HR-BoM",
        ],
        "action_type": "Managerial / Cultural",
        "audience": "Manager / HR-BoM",
    },
    {
        "id": 5,
        "pattern": "Recognition Deficit",
        "risk_dimension": "Recognition & Meaning",
        "signals": "Feedback <3:1 + low kudos/@mentions + low peer recognition",
        "eri_level": "Yellow",
        "suggested_interventions": [
            "Nudge manager / peer to send recognition this week",
            "Schedule a structured feedback check-in",
            "Increase visibility of contribution in team channel",
        ],
        "action_type": "Managerial / Cultural",
        "audience": "Manager",
    },
    {
        "id": 6,
        "pattern": "Meaning Dilution",
        "risk_dimension": "Recognition & Meaning",
        "signals": ">70% busy work + high maintenance ratio + delayed high-impact goals",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Reconnect tasks to OKRs / company mission",
            "Rebalance toward strategic work",
            "Discuss role meaning and growth opportunities",
        ],
        "action_type": "Managerial",
        "audience": "Employee / Manager",
    },
    {
        "id": 7,
        "pattern": "Social Isolation",
        "risk_dimension": "Engagement",
        "signals": "Zero work friends + low non-mandatory social attendance",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Suggest low-pressure social touchpoints",
            "Pair with a peer buddy or fika partner",
            "Include in team inclusion activities",
        ],
        "action_type": "Personal / Cultural",
        "audience": "Employee / Team",
    },
    {
        "id": 8,
        "pattern": "Support Responsiveness",
        "risk_dimension": "Engagement",
        "signals": ">48hr manager delay + long blocker reply time",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Flag blocker risk to manager",
            "Set explicit response-time norms (e.g. 24h)",
            "Prompt manager to do a support check-in",
        ],
        "action_type": "Managerial / System",
        "audience": "Manager",
    },
    {
        "id": 9,
        "pattern": "Workload Distribution Imbalance",
        "risk_dimension": "Fairness",
        "signals": ">20% task gap + story points above team median",
        "eri_level": "Red",
        "suggested_interventions": [
            "Redistribute workload across the team",
            "Review team allocation in next planning",
            "Rebalance sprint / task planning",
        ],
        "action_type": "Managerial / System",
        "audience": "Manager / HR-BoM",
    },
    {
        "id": 10,
        "pattern": "Communication Opacity",
        "risk_dimension": "Fairness",
        "signals": "<24hr meeting notice + urgent tasks > regular tasks + high BCC",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Improve planning visibility (shared roadmap)",
            "Set meeting-notice norms (≥24h)",
            "Reduce reactive task creation",
        ],
        "action_type": "Cultural / Strategic",
        "audience": "Team / HR-BoM",
    },
    {
        "id": 11,
        "pattern": "Ethical Misalignment Signals",
        "risk_dimension": "Values Alignment",
        "signals": ">1 conflict/quarter + off-the-record huddles + whistleblower reports",
        "eri_level": "Red",
        "suggested_interventions": [
            "Trigger confidential HR review",
            "Escalate to ethics / compliance",
            "Run leadership alignment intervention",
        ],
        "action_type": "Cultural / Strategic",
        "audience": "HR-BoM",
    },
    {
        "id": 12,
        "pattern": "Cultural Disconnect",
        "risk_dimension": "Values Alignment",
        "signals": "Low optional-event participation + low belonging check-in",
        "eri_level": "Orange",
        "suggested_interventions": [
            "Run a belonging check-in",
            "Adapt team communication norms",
            "Initiate inclusion / culture intervention",
        ],
        "action_type": "Cultural / Strategic",
        "audience": "Employee / Team / HR-BoM",
    },
]


class SuggestionEngine:
    def __init__(self, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.OLLAMA_HOST_URL = llm_url or os.getenv("OLLAMA_HOST_URL", "http://localhost:11434/api/chat")
        self.OLLAMA_MODEL_NAME = llm_model or os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    def list_patterns(self) -> List[Dict]:
        """Return the static catalog as-is."""
        return BURNOUT_PATTERNS

    def _enrich_one(self, pattern: Dict) -> Dict:
        """Ask the LLM for a short manager script + first action."""
        system_prompt = (
            "You are Fikable's Burnout Coach. Given a burnout pattern, write ONE short, "
            "concrete recommendation for the team lead. Respond in strict JSON: "
            '{"manager_script": "<2 sentences the manager can say to the team>", '
            '"first_action": "<the single most impactful next step, <=12 words>"}'
        )
        user_payload = json.dumps({
            "pattern": pattern["pattern"],
            "risk_dimension": pattern["risk_dimension"],
            "signals": pattern["signals"],
            "eri_level": pattern["eri_level"],
            "interventions": pattern["suggested_interventions"],
        })
        body = {
            "model": self.OLLAMA_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_payload},
            ],
            "stream": False,
            "format": "json",
        }
        try:
            r = requests.post(self.OLLAMA_HOST_URL, json=body, timeout=30).json()
            raw = r["message"]["content"]
            s, e = raw.find("{"), raw.rfind("}")
            parsed = json.loads(raw[s:e + 1] if s != -1 and e != -1 else raw)
            return {**pattern, "ai_coaching": parsed}
        except Exception as ex:
            print(f"[Suggestion LLM Error · {pattern['pattern']}] {ex}")
            return {
                **pattern,
                "ai_coaching": {
                    "manager_script": "(LLM offline) Use the suggested interventions above as a starting point.",
                    "first_action": pattern["suggested_interventions"][0],
                },
            }

    def list_patterns_enriched(self) -> List[Dict]:
        """Catalog with per-pattern LLM coaching script."""
        return [self._enrich_one(p) for p in BURNOUT_PATTERNS]
