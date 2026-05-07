# modules/integrations/playbook_dm.py
"""
Dummy direct-message pusher for the Burnout Pattern Playbook.

Sends a playbook card straight to a specific Slack user (by email)
via the Slack Web API. Requires a bot token (SLACK_BOT_TOKEN) with
scopes: users:read.email, chat:write, im:write.

Usage:
    python -m modules.integrations.playbook_dm --once
    python -m modules.integrations.playbook_dm --interval 3600 --limit 1
    python -m modules.integrations.playbook_dm --email someone@x.com
"""
import json
import os
import time
import random
import argparse
import requests
from typing import Dict, List, Optional

from dotenv import load_dotenv
load_dotenv()

from modules.layer_3.suggestions import SuggestionEngine
from modules.integrations.playbook_slack import _build_blocks  # reuse Block Kit formatter

DEFAULT_TARGET_EMAIL = os.getenv("PLAYBOOK_DM_EMAIL", "huyhoang@student.chalmers.se")
SLACK_API = "https://slack.com/api"


def _bot_token() -> str:
    token = os.getenv("SLACK_BOT_TOKEN", "")
    if not token:
        raise RuntimeError(
            "SLACK_BOT_TOKEN not configured. Add a bot token with scopes "
            "users:read.email, chat:write, im:write to your .env."
        )
    return token


def lookup_user_id_by_email(email: str) -> Optional[str]:
    r = requests.get(
        f"{SLACK_API}/users.lookupByEmail",
        headers={"Authorization": f"Bearer {_bot_token()}"},
        params={"email": email},
        timeout=10,
    ).json()
    if not r.get("ok"):
        print(f"[DM] users.lookupByEmail error for {email}: {r.get('error')}")
        return None
    return r["user"]["id"]


def send_dm(user_id: str, blocks: List[Dict], text: str = "Fikable playbook nudge") -> bool:
    r = requests.post(
        f"{SLACK_API}/chat.postMessage",
        headers={
            "Authorization": f"Bearer {_bot_token()}",
            "Content-Type": "application/json; charset=utf-8",
        },
        data=json.dumps({"channel": user_id, "blocks": blocks, "text": text}),
        timeout=10,
    ).json()
    if not r.get("ok"):
        print(f"[DM] chat.postMessage error: {r.get('error')}")
        return False
    return True


def push_playbook_dm(email: str = DEFAULT_TARGET_EMAIL,
                     limit: int = 1,
                     enrich: bool = False) -> Dict:
    """Send `limit` random playbook patterns as DMs to the user matching `email`."""
    try:
        user_id = lookup_user_id_by_email(email)
    except RuntimeError as ex:
        print(f"[DM] {ex}")
        return {"sent": 0, "skipped": True, "reason": "no_token"}

    if not user_id:
        return {"sent": 0, "skipped": True, "reason": "user_not_found", "email": email}

    engine = SuggestionEngine()
    patterns = engine.list_patterns_enriched() if enrich else engine.list_patterns()
    chosen = random.sample(patterns, min(limit, len(patterns)))

    sent = 0
    for p in chosen:
        ok = send_dm(user_id, _build_blocks(p), text=f"Playbook · {p['pattern']}")
        if ok:
            sent += 1
            print(f"[DM] ✅ Sent #{p['id']} {p['pattern']} → {email}")
        time.sleep(0.6)

    return {"sent": sent, "email": email, "user_id": user_id}


def run_periodic_dm(email: str = DEFAULT_TARGET_EMAIL,
                    interval_sec: int = 3600,
                    limit: int = 1,
                    enrich: bool = False):
    print(f"[DM Loop] Every {interval_sec}s → {email} (limit={limit}, enrich={enrich})")
    while True:
        push_playbook_dm(email=email, limit=limit, enrich=enrich)
        time.sleep(interval_sec)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dummy Slack DM pusher for the Fikable Burnout Playbook")
    parser.add_argument("--email", default=DEFAULT_TARGET_EMAIL, help="Target Slack user email")
    parser.add_argument("--once", action="store_true", help="Send one batch and exit")
    parser.add_argument("--interval", type=int, default=3600, help="Loop interval in seconds")
    parser.add_argument("--limit", type=int, default=1, help="How many patterns per batch")
    parser.add_argument("--enrich", action="store_true", help="Use AI coaching scripts (slower)")
    args = parser.parse_args()

    if args.once:
        print(json.dumps(push_playbook_dm(email=args.email, limit=args.limit, enrich=args.enrich), indent=2))
    else:
        run_periodic_dm(email=args.email, interval_sec=args.interval, limit=args.limit, enrich=args.enrich)
