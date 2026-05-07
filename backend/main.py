import json
import uuid
import os
import uvicorn
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from classes.vector_db import ChromaVectorDB
from modules.layer_1.normalizer import aggregate_and_normalize
from modules.layer_1.mock_manager import mock_db
from modules.layer_2.analytics import AnalyticsEngine
from modules.layer_3.application import FikableAction
from modules.layer_3.admin import AdminAggregator

from modules.integrations.slack_bot import SlackConnector

load_dotenv()

base_url = os.getenv("OLLAMA_HOST_URL", "http://localhost:11434").rstrip('/')
OLLAMA_HOST_URL = f"{base_url}/api/chat" if not base_url.endswith("/api/chat") else base_url

OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "gemma4")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8000))
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")

app = FastAPI(title="Fikable API")
db = ChromaVectorDB()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyticRequest(BaseModel):
    employee_id: str
    profile: str = "burnout"

@app.post("/api/fikable/full_sync")
def trigger_pipeline(request: AnalyticRequest):
    try:
        l1_payload = aggregate_and_normalize(request.employee_id, profile=request.profile, interact_data=None)

        l2_engine = AnalyticsEngine(db_client=db, llm_url=OLLAMA_HOST_URL, llm_model=OLLAMA_MODEL_NAME)
        l2_state = l2_engine.evaluate_cognitive_load(l1_payload["metadata"])

        recent_history = db.query_history(request.employee_id, current_telemetry="energy trends", n_results=3)
        l2_sim = l2_engine.predict_future_scenario(l2_state, "Delay next meeting by 1 hour", recent_history)

        l2_engine.learning_reinforcement_loop(request.employee_id, "TODAY", l1_payload["metadata"], l2_state)

        l3_application = FikableAction(llm_url=OLLAMA_HOST_URL, llm_model=OLLAMA_MODEL_NAME)

        rebalance_action = l3_application.automatically_rebalance(l2_state, l2_sim)
        dashboard_data = l3_application.personal_interference(l2_state)
        fika_nudge = l3_application.fika_layer(l2_state)
        team_heatmap = l3_application.team_insights(request.employee_id, l2_state)

        return {
            "status": "success",
            "pipeline_metrics": {
                "l1_normalized_data": l1_payload["metadata"],
                "l2_digital_twin_state": l2_state,
            },
            "l3_application_payloads": {
                "manager_approval_queue": rebalance_action, 
                "employee_dashboard": dashboard_data,       
                "active_notifications": fika_nudge,         
                "team_aggregates": team_heatmap             
            }
        }
        
    except Exception as e:
        print(f"[Fatal Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "Fikable Multi-Layer Pipeline is online"}

@app.post("/api/slack/interactive")
async def slack_interaction(payload: str = Form(...)):
    """
    Catches the button click from the employee's Slack app.
    Slack sends this as 'application/x-www-form-urlencoded' with a 'payload' JSON string.
    """
    try:
        # 1. Parse the incoming click data from Slack
        action_data = json.loads(payload)
        
        # 2. Extract what the user clicked
        user_name = action_data['user']['username']
        action_clicked = action_data['actions'][0]['value'] # e.g., 'accept_fika' or 'snooze_fika'
        
        print(f"\n[Slack Webhook] User {user_name} clicked: {action_clicked}")

        # 3. Handle the Business Logic
        if action_clicked == "accept_fika":
            print(f"✅ Logging positive intervention compliance for {user_name}.")
            # Here you could call your Vector DB to store that the nudge was successful!
            # db.store_baseline(user_id, "nudge_success", "User accepted 15m Fika break.")
        elif action_clicked == "snooze_fika":
            print(f"⏳ {user_name} snoozed the break. Increasing risk score for next cycle.")

        # Slack requires an empty 200 OK response to know the button click worked
        return {}

    except Exception as e:
        print(f"[Slack Webhook Error] {e}")
        raise HTTPException(status_code=500, detail="Failed to process Slack action")

@app.get("/api/fikable/admin/dashboard")
def trigger_admin_dashboard():
    try:
        print("\n=== Generating Admin Dashboard ===")
        
        # ==========================================
        # THE FIX: DYNAMICALLY LOAD THE ENTIRE DATASET
        # ==========================================
        mock_company_roster = []
        
        # Loop through every single profile in your mock_profiles.json
        for idx, profile_name in enumerate(mock_db.profiles.keys(), start=1):
            mock_company_roster.append({
                "id": f"EMP_{idx:03d}_{profile_name.upper()[:8]}", # e.g. EMP_001_BURNOUT_
                "profile": profile_name
            })
            
        print(f"[Admin Engine] Ingesting company roster of {len(mock_company_roster)} employees...")

        # 2. Extract Layer 1 Data for all employees (This processes all 15 instantly!)
        team_l1_data = []
        for emp in mock_company_roster:
            payload = aggregate_and_normalize(emp["id"], profile=emp["profile"], interact_data=None)
            team_l1_data.append(payload["metadata"])

        # 3. Aggregate the math in Python
        admin_engine = AdminAggregator(llm_url=OLLAMA_HOST_URL, llm_model=OLLAMA_MODEL_NAME)
        aggregated_metrics = admin_engine.aggregate_team_metrics(team_l1_data)

        # 4. Generate the Macro Insight with ONE LLM call
        print("[Admin Engine] Sending macro-metrics to Ollama for organizational strategy...")
        macro_insight = admin_engine.generate_organizational_insight(aggregated_metrics)

        # 5. Return the God-View payload
        return {
            "status": "success",
            "dashboard_data": {
                "team_metrics": aggregated_metrics,
                "organizational_insight": macro_insight,
                "raw_employee_list": team_l1_data 
            }
        }

    except Exception as e:
        print(f"[Admin Dashboard Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("========================================")
    print("🚀 Starting Fikable Backend Server...")
    print(f"🔗 Connect Lovable UI to: http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"🧠 Local LLM Target: {OLLAMA_MODEL_NAME} at {OLLAMA_HOST_URL}")
    print("========================================")
    
    uvicorn.run("main:app", host=SERVER_HOST, port=SERVER_PORT, reload=True)

