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

        avg_meeting_hrs = sum(emp['meeting_burden_hrs'] for emp in team_l1_data) / total_employees
        avg_switches = sum(emp['cognitive_switches'] for emp in team_l1_data) / total_employees
        
        # Determine risk distribution based on meeting load (hackathon logic)
        burnout_count = sum(1 for emp in team_l1_data if emp['meeting_burden_hrs'] > 6)
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
                return json.loads(raw_content) # Fallback

        except Exception as e:
            print(f"[Admin LLM Error] {e}")
            # This prints exactly what the LLM said so you can debug it in the terminal!
            raw_output = response.get('message', {}).get('content', 'No content') if 'response' in locals() else 'Request failed'
            print(f"[Raw Output] {raw_output}")
            
            return {
                "macro_risk_identified": "Data formatting error.", 
                "proposed_policy_change": "Run analysis again.", 
                "expected_roi": "N/A"
            }