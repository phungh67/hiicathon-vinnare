import json
import requests
import os

from typing import Optional

class FikableAction:
    """
    Definition for action layer of the application, will execute and manage workloads to reduce stress
    """
    def __init__(self, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.OLLAMA_HOST_URL = llm_url if llm_url is not None else os.getenv("OLLAMA_HOST_URL", "http://localhost:11434")
        self.OLLAMA_MODEL_NAME = llm_model if llm_model is not None else os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    def _call_llm(self, system_prompt: str, user_data: str) -> dict:
        """Helper function for calling LLM"""
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
            return json.loads(response['message']['content'])
        except Exception as e:
            print(f"[L3 LLM Error] {e}")
            return {}

    def automatically_rebalance(self, l2_state: dict, l2_simulation: dict) -> dict:
        """
        Suggest automation rebalance solutions for stress reducing
        """
        
        system_prompt = """You are the SafeHer Voice Schedule Optimizer. 
        Based on the user's low energy state and the successful 'What-If' simulation, 
        propose ONE specific calendar action to protect their energy.
        
        Respond in strict JSON:
        1. "action_type": string (e.g., "Reschedule", "Protect Block")
        2. "proposal_text": 1 sentence explaining the schedule shift.
        3. "target_meeting_or_time": string (e.g., "2:00 PM Sync")"""

        llm_response = self._call_llm(system_prompt, json.dumps({"state": l2_state, "sim": l2_simulation}))
        
        # Enforce the approval logic mandated by the architecture
        return {
            "module": "Auto-Rebalancing",
            "execution_type": "requires_approval",
            "approval_status": "pending_supervisor",
            "action": llm_response
        }
    
    def personal_interference(self, l2_state: dict) -> dict:
        """
        Generate forecasts for the employee's personal dashboard
        """
        energy = l2_state.get("energy_level", 50)
        forecast = "Stable" if energy > 60 else "Declining - Pace yourself"

        return {
            "module": "Personal Energy Interference",
            "execution_type": "dashboard_update",
            "delivery_method": "silent",
            "data": {
                "current_energy_score": energy,
                "afternoon_forecast": forecast,
                "suggested_task_mode": "Deep Work" if energy > 70 else "Admin/Light Tasks"
            }
        }

    def fika_layer(self, l2_state: dict) -> dict:
        """
        The fika layer - nudge actions to reduce stress
        """

        system_prompt = """You are the Fikable 'Fika' Coordinator. 
        The user has a high cognitive load. Suggest a specific, refreshing 15-minute break.
        Make it Swedish 'Fika' themed or a social wellness nudge.
        
        Respond in strict JSON:
        1. "nudge_title": string (e.g., "Time for Fika!")
        2. "nudge_message": 1 sentence encouraging a specific type of break."""

        llm_response = self._call_llm(system_prompt, json.dumps(l2_state))

        return {
            "module": "Fika Layer",
            "execution_type": "push_notification",
            "delivery_method": "desktop_popup_and_slack",
            "content": llm_response
        }

    def team_insights(self, employee_id: str, l2_state: dict) -> dict:
        """
        Mocks aggregating user's data into Team Heatmap
        """
        energy = l2_state.get("energy_level", 50)

        return {
            "module": "Team Energy Insights",
            "execution_type": "manager_dashboard_update",
            "delivery_method": "email_digest",
            "data": {
                "employee_contributing": employee_id,
                "team_heatmap_impact": "Red" if energy < 40 else "Green",
                "team_flow_status": "Impaired by individual cognitive overload" if energy else "Optimal"
            }
        }