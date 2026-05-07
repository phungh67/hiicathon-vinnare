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
from modules.layer_1.mock_manager import mock_db  # <-- IMPORT MOCK DB
from modules.layer_2.analytics import AnalyticsEngine
from modules.layer_3.application import FikableAction
from modules.layer_3.admin import AdminAggregator
from modules.layer_3.suggestions import SuggestionEngine

from modules.integrations.slack_bot import SlackConnector
from modules.integrations.playbook_slack import push_playbook_to_slack

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

# --- Auto-push playbook to Slack on a background timer ---
import threading

PLAYBOOK_PUSH_INTERVAL = int(os.getenv("PLAYBOOK_PUSH_INTERVAL", "3600"))  # seconds
PLAYBOOK_PUSH_LIMIT = int(os.getenv("PLAYBOOK_PUSH_LIMIT", "2"))
PLAYBOOK_PUSH_ENABLED = os.getenv("PLAYBOOK_PUSH_ENABLED", "true").lower() == "true"

def _playbook_push_loop():
    import time
    # Initial fire shortly after boot
    time.sleep(5)
    while True:
        try:
            push_playbook_to_slack(limit=PLAYBOOK_PUSH_LIMIT, sample=True)
        except Exception as ex:
            print(f"[Playbook Loop Error] {ex}")
        time.sleep(PLAYBOOK_PUSH_INTERVAL)

@app.on_event("startup")
def _start_playbook_pusher():
    if not PLAYBOOK_PUSH_ENABLED:
        print("[Playbook Loop] disabled via PLAYBOOK_PUSH_ENABLED=false")
        return
    t = threading.Thread(target=_playbook_push_loop, daemon=True)
    t.start()
    print(f"[Playbook Loop] ✅ started — every {PLAYBOOK_PUSH_INTERVAL}s, limit={PLAYBOOK_PUSH_LIMIT}")

@app.post("/api/slack/interactive")
async def slack_interaction(payload: str = Form(...)):
    try:
        action_data = json.loads(payload)
        user_name = action_data['user']['username']
        action_clicked = action_data['actions'][0]['value'] 
        
        print(f"\n[Slack Webhook] User {user_name} clicked: {action_clicked}")

        if action_clicked == "accept_fika":
            print(f"✅ Logging positive intervention compliance for {user_name}.")
        elif action_clicked == "snooze_fika":
            print(f"⏳ {user_name} snoozed the break. Increasing risk score for next cycle.")

        return {}

    except Exception as e:
        print(f"[Slack Webhook Error] {e}")
        raise HTTPException(status_code=500, detail="Failed to process Slack action")

@app.get("/api/fikable/admin/dashboard")
def trigger_admin_dashboard():
    try:
        print("\n=== Generating Admin Dashboard ===")
        
        # 1. DYNAMICALLY LOAD THE ENTIRE 15-PROFILE DATASET
        mock_company_roster = []
        for idx, profile_name in enumerate(mock_db.profiles.keys(), start=1):
            mock_company_roster.append({
                "id": f"ANON_EMP_{idx:03d}", # Anonymous ID used internally for processing
                "profile": profile_name
            })
            
        print(f"[Admin Engine] Ingesting anonymous roster of {len(mock_company_roster)} employees...")

        # 2. Extract Layer 1 Data
        team_l1_data = []
        for emp in mock_company_roster:
            payload = aggregate_and_normalize(emp["id"], profile=emp["profile"], interact_data=None)
            team_l1_data.append(payload["metadata"])

        # 3. Aggregate the math in Python
        admin_engine = AdminAggregator(llm_url=OLLAMA_HOST_URL, llm_model=OLLAMA_MODEL_NAME)
        aggregated_metrics = admin_engine.aggregate_team_metrics(team_l1_data)
        
        # 4. PRIVACY LAYER: Anonymize and Group by Role
        anonymized_team_data = admin_engine.anonymize_and_group_data(team_l1_data)

        # 5. Generate the Macro Insight with ONE LLM call
        print("[Admin Engine] Sending macro-metrics to Ollama for organizational strategy...")
        macro_insight = admin_engine.generate_organizational_insight(aggregated_metrics)

        # 6. Return the strictly anonymized payload
        return {
            "status": "success",
            "dashboard_data": {
                "team_metrics": aggregated_metrics,
                "organizational_insight": macro_insight,
                "anonymized_role_aggregates": anonymized_team_data # Completely replaces raw_employee_list!
            }
        }

    except Exception as e:
        print(f"[Admin Dashboard Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fikable/admin/suggestions")
def get_burnout_suggestions(enrich: bool = False, push_slack: bool = True, slack_limit: int = 2):
    """
    Returns the catalog of 12 canonical burnout patterns + suggested
    interventions. Pass ?enrich=true to also generate a per-pattern
    LLM coaching script (slower; one Ollama call per pattern).

    On successful fetch, also pushes `slack_limit` random patterns to the
    configured Slack webhook (set push_slack=false to disable).
    """
    try:
        engine = SuggestionEngine(llm_url=OLLAMA_HOST_URL, llm_model=OLLAMA_MODEL_NAME)
        patterns = engine.list_patterns_enriched() if enrich else engine.list_patterns()

        slack_result = None
        if push_slack:
            slack_result = push_playbook_to_slack(patterns=patterns, limit=slack_limit, sample=True)

        return {
            "status": "success",
            "count": len(patterns),
            "patterns": patterns,
            "slack_push": slack_result,
        }
    except Exception as e:
        print(f"[Suggestions Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("========================================")
    print("🚀 Starting Fikable Backend Server...")
    print(f"🔗 Connect Lovable UI to: http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"🧠 Local LLM Target: {OLLAMA_MODEL_NAME} at {OLLAMA_HOST_URL}")
    print("========================================")
    
    uvicorn.run("main:app", host=SERVER_HOST, port=SERVER_PORT, reload=True)