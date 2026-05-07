import json
import requests
import os
from typing import Optional

from modules.integrations.slack_bot import SlackConnector

class FikableAction:
    def __init__(self, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.OLLAMA_HOST_URL = llm_url if llm_url is not None else os.getenv("OLLAMA_HOST_URL", "http://localhost:11434/api/chat")
        self.OLLAMA_MODEL_NAME = llm_model if llm_model is not None else os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    def _call_llm(self, system_prompt: str, user_data: str) -> dict:
        payload = {
            "model": self.OLLAMA_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_data}
            ],
            "stream": False,
            "format": "json"
        }
        try:
            response = requests.post(self.OLLAMA_HOST_URL, json=payload).json()
            raw_content = response['message']['content']
            
            # STRIP MARKDOWN BACKTICKS
            start_idx = raw_content.find('{')
            end_idx = raw_content.rfind('}')
            if start_idx != -1 and end_idx != -1:
                return json.loads(raw_content[start_idx:end_idx+1])
            return json.loads(raw_content)
        except Exception as e:
            print(f"[L3 LLM Error] {e}")
            return {}

    def automatically_rebalance(self, l2_state: dict, l2_simulation: dict) -> dict:
        system_prompt = """You are the Schedule Optimizer. Based on the user's state, propose ONE schedule action.
        Respond in strict JSON:
        1. "action_type": string
        2. "proposal_text": string
        3. "target_meeting_or_time": string"""

        llm_response = self._call_llm(system_prompt, json.dumps({"state": l2_state, "sim": l2_simulation}))
        return {"module": "Auto-Rebalancing", "execution_type": "requires_approval", "action": llm_response}
    
    def personal_interference(self, l2_state: dict) -> dict:
        energy = l2_state.get("energy_level", 50)
        return {
            "module": "Personal Energy", "delivery_method": "silent",
            "data": {"energy_score": energy, "suggested_task_mode": "Deep Work" if energy > 70 else "Light Tasks"}
        }

    def fika_layer(self, l2_state: dict) -> dict:
        system_prompt = """You are the Fikable 'Fika' Coordinator. Suggest a specific 15-minute break.
        Respond in strict JSON:
        1. "nudge_title": string (e.g., "Time for Fika!")
        2. "nudge_message": 1 sentence encouraging a break."""

        llm_response = self._call_llm(system_prompt, json.dumps(l2_state))

        # TRIGGER SLACK WEBHOOK
        SlackConnector.send_fika_nudge(
            employee_name="Fikable User", 
            nudge_title=llm_response.get("nudge_title", "Take a Breather!"),
            nudge_message=llm_response.get("nudge_message", "Step away from the screen for 15 minutes."),
            employee_id="DEMO_USER_01"
        )

        return {"module": "Fika Layer", "content": llm_response}

    def team_insights(self, employee_id: str, l2_state: dict) -> dict:
        energy = l2_state.get("energy_level", 50)
        return {"module": "Team Insights", "data": {"team_heatmap_impact": "Red" if energy < 40 else "Green"}}