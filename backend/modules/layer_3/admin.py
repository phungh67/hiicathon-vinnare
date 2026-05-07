# modules/layer_3/admin.py

import json
import requests
import os
from typing import Optional

class AdminAggregator:
    def __init__(self, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.OLLAMA_HOST_URL = llm_url if llm_url is not None else os.getenv("OLLAMA_HOST_URL", "http://localhost:11434")
        self.OLLAMA_MODEL_NAME = llm_model if llm_model is not None else os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    def aggregate_team_metrics(self, team_l1_data: list) -> dict:
        """
        Takes a list of individual employee L1 payloads and calculates team averages.
        """
        total_employees = len(team_l1_data)
        if total_employees == 0:
            return {}

        avg_meeting_hrs = sum(emp.get('meeting_burden_hrs', 0) for emp in team_l1_data) / total_employees
        avg_switches = sum(emp.get('cognitive_switches', 0) for emp in team_l1_data) / total_employees
        
        burnout_count = sum(1 for emp in team_l1_data if emp.get('meeting_burden_hrs', 0) > 6)
        healthy_count = total_employees - burnout_count

        return {
            "total_headcount": total_employees,
            "department_averages": {
                "meeting_burden_hrs": round(avg_meeting_hrs, 1),
                "cognitive_switches_per_hr": round(avg_switches, 1),
            },
            "risk_distribution": {
                "healthy": healthy_count,
                "high_burnout_risk": burnout_count
            }
        }

    def anonymize_and_group_data(self, team_l1_data: list) -> list:
        """
        PRIVACY LAYER: Groups individual data by role to protect anonymity.
        Strips out all employee IDs and returns aggregated team-level stats.
        """
        grouped = {}
        for emp in team_l1_data:
            role = emp.get('role', 'Unknown Role')
            if role not in grouped:
                grouped[role] = {
                    "headcount": 0,
                    "total_meeting_hrs": 0,
                    "total_switches": 0,
                    "total_interruptions": 0,
                    "high_risk_count": 0
                }
            
            grouped[role]["headcount"] += 1
            grouped[role]["total_meeting_hrs"] += emp.get('meeting_burden_hrs', 0)
            grouped[role]["total_switches"] += emp.get('cognitive_switches', 0)
            grouped[role]["total_interruptions"] += emp.get('interruption_volume', 0)
            
            # Simple threshold flag for high risk based on L1 metrics
            if emp.get('meeting_burden_hrs', 0) > 6 or emp.get('interruption_volume', 0) > 5:
                grouped[role]["high_risk_count"] += 1

        # Calculate averages and format for the frontend UI
        anonymized_roster = []
        for role, metrics in grouped.items():
            hc = metrics["headcount"]
            anonymized_roster.append({
                "team_or_role": role,
                "headcount": hc,
                "avg_meeting_hrs": round(metrics["total_meeting_hrs"] / hc, 1),
                "avg_interruptions": round(metrics["total_interruptions"] / hc, 1),
                "high_burnout_risk_count": metrics["high_risk_count"],
                "status": "Critical" if (metrics["high_risk_count"] / hc) > 0.5 else "Stable"
            })
            
        return anonymized_roster

    def generate_organizational_insight(self, aggregated_metrics: dict) -> dict:
        """
        Asks the LLM to act as a fractional HR executive and propose a company-wide policy change.
        """
        system_prompt = """You are the Fikable Chief HR AI.
        Look at this aggregated team data. Identify the biggest macro-level burnout risk and propose ONE organizational policy change.
        
        Respond in strict JSON:
        1. "macro_risk_identified": 1 sentence explaining the team's biggest systemic issue.
        2. "proposed_policy_change": The name of the organizational intervention.
        3. "expected_roi": 1 sentence explaining how this helps the company."""

        payload = {
            "model": self.OLLAMA_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(aggregated_metrics)}
            ],
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(self.OLLAMA_HOST_URL, json=payload).json()
            raw_content = response['message']['content']

            start_idx = raw_content.find('{')
            end_idx = raw_content.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                clean_json = raw_content[start_idx:end_idx+1]
                return json.loads(clean_json)
            else:
                return json.loads(raw_content) 

        except Exception as e:
            print(f"[Admin LLM Error] {e}")
            raw_output = response.get('message', {}).get('content', 'No content') if 'response' in locals() else 'Request failed'
            print(f"[Raw Output] {raw_output}")
            
            return {
                "macro_risk_identified": "Data formatting error.", 
                "proposed_policy_change": "Run analysis again.", 
                "expected_roi": "N/A"
            }