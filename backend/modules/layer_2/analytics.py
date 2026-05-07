import json
import uuid
import requests
import os
from typing import Optional

from classes.vector_db import ChromaVectorDB

class AnalyticsEngine:
    def __init__(self, db_client: ChromaVectorDB, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.db = db_client
        self.OLLAMA_HOST_URL = llm_url if llm_url is not None else os.getenv("OLLAMA_HOST_URL", "http://localhost:11434/api/chat")
        self.OLLAMA_MODEL_NAME = llm_model if llm_model is not None else os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    def _parse_llm_json(self, raw_content: str, fallback: dict) -> dict:
        """Bulletproof parser to strip markdown ```json blocks"""
        try:
            start_idx = raw_content.find('{')
            end_idx = raw_content.rfind('}')
            if start_idx != -1 and end_idx != -1:
                return json.loads(raw_content[start_idx:end_idx+1])
            return json.loads(raw_content)
        except Exception as e:
            print(f"[L2 JSON Parse Error] {e} | Raw: {raw_content}")
            return fallback

    def evaluate_cognitive_load(self, normalized_data: dict) -> dict:
        system_prompt = """
        You are Fikable Layer 2 Analytics Engine.
        Analyze the normalized L1 data and estimate the user's current Cognitive Load and Energy Level.

        Response in strict JSON:
        1. "energy_level": integer (0-100)
        2. "cognitive_load": integer (0-100)
        3. "state_summary": 1 sentence describing their current capacity."""

        payload = {
            "model": self.OLLAMA_MODEL_NAME,
            "messages": [  # FIXED TYPO HERE
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(normalized_data)}
            ],
            "stream": False, # FIXED TYPO HERE
            "format": "json"
        }

        try:
            response = requests.post(self.OLLAMA_HOST_URL, json=payload)
            if response.status_code != 200:
                return {"energy_level": 50, "cognitive_load": 50, "state_summary": f"Ollama Error: {response.status_code}"}
            
            raw_content = response.json()['message']['content']
            return self._parse_llm_json(raw_content, {"energy_level": 50, "cognitive_load": 50, "state_summary": "Analysis failed."})
        except Exception as e:
            print(f"[L2 Evaluate Error] {e}")
            return {"energy_level": 50, "cognitive_load": 50, "state_summary": "Analysis failed."}

    def predict_future_scenario(self, current_state: dict, proposed_scenario: str, historical_context: str) -> dict:
        system_prompt = """You are an Energy Simulation Engine (Burnout detection) 
        Given an employee's historical patterns and current state, predict the impact of the Proposed Scenario.
        
        Respond in strict JSON:
        1. "predicted_energy_change": integer (-100 to +100)
        2. "simulation_outcome": 1 sentence explaining the predicted reaction.
        3. "is_recommended": boolean (true/false)"""

        user_prompt = f"""
        -- HISTORY --
        {historical_context}
        -- CURRENT STATE --
        Energy: {current_state.get('energy_level')} | Load: {current_state.get('cognitive_load')}
        -- PROPOSED SCENARIO --
        {proposed_scenario}
        """

        payload = {
            "model": self.OLLAMA_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(self.OLLAMA_HOST_URL, json=payload).json()
            raw_content = response['message']['content']
            return self._parse_llm_json(raw_content, {
                "predicted_energy_change": 0, "simulation_outcome": "Failed to simulate.", "is_recommended": False
            })
        except Exception as e:
            print(f"[L2 Predict Error] {e}")
            return {"predicted_energy_change": 0, "simulation_outcome": "Failed to simulate.", "is_recommended": False}

    def learning_reinforcement_loop(self, employee_id: str, date_string: str, l1_data: dict, l2_state: dict):
        memory_narrative = f"""
        Date: {date_string}
        Metrics: {l1_data.get('meeting_burden_hrs', 0)}h meetings, {l1_data.get('interruption_volume', 0)} interruptions.
        Resulting State: Energy at {l2_state.get('energy_level', 50)}%, Cognitive Load at {l2_state.get('cognitive_load', 50)}%.
        Summary: {l2_state.get('state_summary', 'None')}
        """
        document_id = f"daily_log_{uuid.uuid4().hex[:8]}"
        self.db.store_baseline(employee_id, document_id, memory_narrative.strip())