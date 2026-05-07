# modules/integrations/playbook_slack.py
"""
Dummy Slack pusher for the Burnout Pattern Playbook.

Two entry points:
  - push_playbook_to_slack(patterns, limit=N): post N patterns as Block Kit cards
  - run_periodic_push(interval_sec, limit): blocking loop, fires every interval

Webhook URL is read from SLACK_WEBHOOK_URL (same env var as slack_bot.py).
"""
import json
import os
import time
import random
import requests
from typing import List, Dict, Optional

from dotenv import load_dotenv
load_dotenv()

from modules.layer_3.suggestions import SuggestionEngine

_ERI_EMOJI = {"Red": "🔴", "Orange": "🟠", "Yellow": "🟡"}


def _build_blocks(pattern: Dict) -> List[Dict]:
    emoji = _ERI_EMOJI.get(pattern.get("eri_level", ""), "⚪")
    interventions = "\n".join(f"• {s}" for s in pattern.get("suggested_interventions", [])[:4])
    coaching = pattern.get("ai_coaching") or {}
    coaching_block = ""
    if coaching:
        coaching_block = (
            f"\n\n*🧭 Manager script:* _{coaching.get('manager_script', '')}_"
            f"\n*👉 First action:* {coaching.get('first_action', '')}"
        )
    return [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"{emoji} Playbook · {pattern['pattern']}", "emoji": True},
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Risk dimension*\n{pattern['risk_dimension']}"},
                {"type": "mrkdwn", "text": f"*ERI level*\n{pattern['eri_level']}"},
                {"type": "mrkdwn", "text": f"*Audience*\n{pattern.get('audience', '—')}"},
                {"type": "mrkdwn", "text": f"*Action type*\n{pattern.get('action_type', '—')}"},
            ],
        },
        {"type": "section", "text": {"type": "mrkdwn", "text": f"*Signals*\n{pattern['signals']}"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": f"*Suggested interventions*\n{interventions}{coaching_block}"}},
        {"type": "context", "elements": [{"type": "mrkdwn", "text": f"Fikable HR Playbook · pattern #{pattern['id']}"}]},
        {"type": "divider"},
    ]


def push_playbook_to_slack(patterns: Optional[List[Dict]] = None,
                           limit: int = 3,
                           sample: bool = True,
                           enrich: bool = False) -> Dict:
    """
    Send up to `limit` playbook patterns to the configured Slack webhook.
    Returns a small summary dict for logging.
    """
    if not SLACK_WEBHOOK_URL or "input_here" in SLACK_WEBHOOK_URL:
        print("[Playbook Slack] SLACK_WEBHOOK_URL not configured — skipping push.")
        return {"sent": 0, "skipped": True, "reason": "webhook_not_configured"}

    if patterns is None:
        engine = SuggestionEngine()
        patterns = engine.list_patterns_enriched() if enrich else engine.list_patterns()

    chosen = random.sample(patterns, min(limit, len(patterns))) if sample else patterns[:limit]

    sent = 0
    for p in chosen:
        payload = {"blocks": _build_blocks(p)}
        try:
            r = requests.post(
                SLACK_WEBHOOK_URL,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            if r.status_code == 200:
                sent += 1
                print(f"[Playbook Slack] ✅ Sent #{p['id']} {p['pattern']}")
            else:
                print(f"[Playbook Slack] ❌ {r.status_code}: {r.text}")
        except Exception as ex:
            print(f"[Playbook Slack] Exception sending #{p['id']}: {ex}")
        time.sleep(0.6)  # gentle to avoid Slack rate limit

    return {"sent": sent, "total_available": len(patterns), "skipped": False}


def run_periodic_push(interval_sec: int = 3600, limit: int = 2, enrich: bool = False):
    """Blocking loop — useful as a standalone cron/dummy worker."""
    print(f"[Playbook Slack] Periodic push every {interval_sec}s (limit={limit}, enrich={enrich})")
    while True:
        push_playbook_to_slack(limit=limit, enrich=enrich)
        time.sleep(interval_sec)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Dummy Slack pusher for the Fikable Burnout Playbook")
    parser.add_argument("--once", action="store_true", help="Send one batch and exit")
    parser.add_argument("--interval", type=int, default=3600, help="Loop interval in seconds")
    parser.add_argument("--limit", type=int, default=2, help="How many patterns per batch")
    parser.add_argument("--enrich", action="store_true", help="Use AI coaching scripts (slower)")
    args = parser.parse_args()

    if args.once:
        result = push_playbook_to_slack(limit=args.limit, enrich=args.enrich)
        print(json.dumps(result, indent=2))
    else:
        run_periodic_push(interval_sec=args.interval, limit=args.limit, enrich=args.enrich)
