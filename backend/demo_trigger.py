import requests
import time
import json

# Make sure this matches your FastAPI server port!
API_URL = "http://localhost:8000/api/fikable/full_sync"

# How long to wait between Slack pings (gives you time to explain each one to the judges)
PAUSE_SECONDS = 15 

# The 3 specific scenarios we mapped out
test_scenarios = [
    {
        "name": "Scenario 1: The Meeting Overload",
        "payload": {
            "employee_id": "Sarah (Engineering Manager)",
            "profile": "burnout_meeting_overload"
        }
    },
    {
        "name": "Scenario 2: The Remote Isolation",
        "payload": {
            "employee_id": "Emma (Remote QA)",
            "profile": "burnout_isolation"
        }
    },
    {
        "name": "Scenario 3: The Context Switcher",
        "payload": {
            "employee_id": "Mike (DevOps)",
            "profile": "burnout_context_switcher"
        }
    }
]

def run_demo():
    print("=====================================================")
    print("🚀 FIKABLE AUTO-DEMO SEQUENCE INITIATED")
    print(f"Target URL: {API_URL}")
    print("=====================================================\n")

    for idx, scenario in enumerate(test_scenarios):
        print(f"▶️  TRIGGERING {scenario['name']}...")
        print(f"   Analyzing data for {scenario['payload']['employee_id']}...")
        
        try:
            # Send the request to your local FastAPI server
            start_time = time.time()
            response = requests.post(API_URL, json=scenario['payload'])
            elapsed_time = round(time.time() - start_time, 2)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract the LLM's custom Slack message from your nested payload
                nudge = data.get("l3_application_payloads", {}).get("active_notifications", {}).get("content", {})
                title = nudge.get("nudge_title", "Unknown Title")
                message = nudge.get("nudge_message", "Unknown Message")
                
                print(f"   ✅ Success! (LLM processing took {elapsed_time}s)")
                print(f"   📩 Sent to Slack: \"{title}\"")
                print(f"   💬 Message: {message}\n")
            else:
                print(f"   ❌ Server Error: {response.status_code}")
                print(response.text)
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection Failed! Is your FastAPI server running on port 8000?")
            return
        except Exception as e:
            print(f"   ❌ Unexpected Error: {str(e)}")

        # Wait before firing the next one (unless it's the last item)
        if idx < len(test_scenarios) - 1:
            print(f"⏳ Waiting {PAUSE_SECONDS} seconds for judges to review Slack...\n")
            time.sleep(PAUSE_SECONDS)

    print("=====================================================")
    print("🏁 DEMO SEQUENCE COMPLETE")
    print("=====================================================")

if __name__ == "__main__":
    run_demo()