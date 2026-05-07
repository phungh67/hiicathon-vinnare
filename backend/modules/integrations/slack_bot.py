# modules/integrations/slack_bot.py
import requests
import json
import os

# For the hackathon, create a free Slack workspace and grab an Incoming Webhook URL
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "input_here_hehee")

class SlackConnector:
    @staticmethod
    def send_fika_nudge(employee_name: str, nudge_title: str, nudge_message: str, employee_id: str):
        """
        Formats the L3 Fika Nudge into a highly professional Slack Block Kit message.
        Includes interactive buttons that ping back to your FastAPI server.
        """
        
        # Slack Block Kit JSON Payload
        slack_payload = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"☕ {nudge_title}",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"Hej {employee_name}!\n\n{nudge_message}"
                    }
                },
                {
                    "type": "actions",
                    "block_id": f"fika_action_block_{employee_id}", # Used to track who clicked
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Take 15m Break",
                                "emoji": True
                            },
                            "style": "primary", # Makes the button Green
                            "value": "accept_fika",
                            "action_id": "btn_accept_fika"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Snooze 1 Hour",
                                "emoji": True
                            },
                            "style": "danger", # Makes the button Red
                            "value": "snooze_fika",
                            "action_id": "btn_snooze_fika"
                        }
                    ]
                }
            ]
        }

        try:
            print(f"[Slack Bot] Pushing interactive Fika nudge to {employee_name}...")
            response = requests.post(
                SLACK_WEBHOOK_URL, 
                data=json.dumps(slack_payload),
                headers={'Content-Type': 'application/json'}
            )
            if response.status_code != 200:
                print(f"[Slack Error] Failed to send: {response.text}")
        except Exception as e:
            print(f"[Slack Error] Exception during send: {e}")