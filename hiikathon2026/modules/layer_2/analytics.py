import json
import uuid
import requests
import os
from typing import Optional

from classes.vector_db import ChromaVectorDB

class AnalyticsEngine:
    """
    Definition for an Analytics engine, with core is local-LLM
    """
    def __init__(self, db_client: ChromaVectorDB, llm_url: Optional[str] = None, llm_model: Optional[str] = None):
        self.db = db_client
        self.OLLAMA_HOST_URL = llm_url if llm_url is not None else os.getenv("OLLAMA_HOST_URL", "http://localhost:11434")
        self.OLLAMA_MODEL_NAME = llm_model if llm_model is not None else os.getenv("OLLAMA_MODEL_NAME", "gemma4")

    
    def evaluate_cognitive_load(self, normalized_data: dict) -> dict:
        """
        Function to calculate and build the profile for each employee,
        based on the crawled data from layer 1 - data aggregators
        Keyword arguments:
        normalized_data -- a dictionary, take from layer 1
        Return:
        A dictionary to indicate the corresponding profile
        """

        # Enforcement for system_prompt
        system_prompt = """
        You are Fikable Layer 2 Analytics Engine.
        Analyze the normalized L1 data and estimate the user's current Cognitive Load and Energy Level.

        Response in strict JSON:
        1. "energy_level": integer (0-100)
        2. "cognitive_load": integer (0-100)
        3. "state_summary": 1 sentence describing their current capacity."""

        payload = {
            "model": self.OLLAMA_MODEL_NAME,
            "message": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(normalized_data)}
            ],
            "steam": False,
            "format": "json"
        }

        try:
            response = requests.post(self.OLLAMA_HOST_URL, json=payload).json()
        except Exception as e:
            return {
                "error": "Something happened",
                "detail": str(e)
            }

        return json.loads(response['message']['content'])

    def predict_future_scenario(self, current_state: dict, proposed_scenario: str, historical_context: str) -> dict:
        """
        Based on the current state and historical data (if any)
        predict the future sceanrio - to this employee
        Keyword arguments:
        current_state: dictionary to describes current state of this employee
        proposed_scenario: a short sentence about future possibility
        historical_context: previous data, if any
        """

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
        
        -- PROPOSED SCENARIO (WHAT-IF) --
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
            return json.loads(response['message']['content'])
        except Exception as e:
            print(f"[L2 What-If Error] {e}")
            return {"predicted_energy_change": 0, "simulation_outcome": "Simulation failed.", "is_recommended": False}

    def learning_reinforcement_loop(self, employee_id: str, date_string: str, l1_data: dict, l2_state: dict):
        """
        Pattern Recognition & Learning (The Continuous Pipeline)
        Stores the fused L1+L2 analysis back into the Vector DB to grow the baseline.
        """
        memory_narrative = f"""
        Date: {date_string}
        Metrics: {l1_data['meeting_burden_hrs']}h meetings, {l1_data['interruption_volume']} interruptions.
        Resulting State: Energy at {l2_state['energy_level']}%, Cognitive Load at {l2_state['cognitive_load']}%.
        Summary: {l2_state['state_summary']}
        """
        
        document_id = f"daily_log_{uuid.uuid4().hex[:8]}"
        
        self.db.store_baseline(employee_id, document_id, memory_narrative.strip())
        print(f"[L2 Learning Pipeline] Memory updated for {employee_id}.")