# modules/layer_1/normalizer.py - digest/aggregate all data into one form

import json
# 1. FIXED THE IMPORTS HERE (Spelling matches crawlers.py exactly)
from .crawlers import CalendarCrawler, TaskCrawler, CommCrawler, HRISCrawler
from .interactive_handler import InteractiveHandler

def aggregate_and_normalize(employee_id: str, profile: str = "burnout", interact_data: dict = None):
    # 2. FIXED THE CALLS HERE
    cal_data = CalendarCrawler.fetch(employee_id=employee_id, profile=profile)
    task_data = TaskCrawler.fetch(employee_id=employee_id, profile=profile)
    comm_data = CommCrawler.fetch(employee_id=employee_id, profile=profile)
    hris_data = HRISCrawler.fetch(employee_id=employee_id, profile=profile)

    # process the additional data (if any)
    wellness_score = interact_data.get("wellness_score") if interact_data else None
    note = interact_data.get("user_note") if interact_data else None
    user_feedback = InteractiveHandler.process_feedback(wellness_score=wellness_score, user_note=note)

    # create the payload
    normalized_data = {
        "employee_id": employee_id,
        "role": hris_data.get("role", "Unknown"),
        "meeting_burden_hrs": cal_data.get("hours_in_meetings", 0),
        "cognitive_switches": task_data.get("switches_per_hr", 0),
        "interruption_volume": comm_data.get("mgr_update_pings", 0),
        "feedback_provided": user_feedback["provided"]
    }

    # 3. FIXED THE F-STRING KEYS (Now matches the 15 diverse profiles in mock_profiles.json)
    narrative_document = f"""
    [1. WORKLOAD] Hours in meetings: {cal_data.get('hours_in_meetings', 0)}h. Back-to-back 15m syncs: {cal_data.get('back_to_back_15m_syncs', 0)}. After 8 PM Slack activity: {comm_data.get('after_8pm_activity', False)}.
    [2. CONTROL] Manager 'update' pings today: {comm_data.get('mgr_update_pings', 0)}. Strictly enforced availability: {cal_data.get('strictly_enforced_9_to_5', False)}.
    [3. REWARD] Kudos/Wins mentions: {comm_data.get('kudos_mentions', 0)}. Percentage of tasks classified as busy-work: {task_data.get('busy_work_percentage', 0)}%.
    [4. COMMUNITY] Non-work channel participation: {comm_data.get('non_work_channel_activity', '0%')}.
    [5. FAIRNESS] Task volume compared to peers: {task_data.get('task_volume_vs_peers', '0%')}. Manager response delay on blockers: {comm_data.get('mgr_response_delay_hrs', 0)} hours.
    [6. VALUES] Urgent blind-copy (BCC) calendar invites: {comm_data.get('urgent_blind_invites', 0)}.
    """

    if user_feedback["provided"]:
        narrative_document += f"\n[WELLNESS FEEDBACK] Score: {user_feedback['score']}/5. Note: '{user_feedback['note']}'."
    else:
        narrative_document += "\n[WELLNESS FEEDBACK] No manual check-in provided today."

    return {
        "metadata": normalized_data,
        "vector_document": narrative_document.strip(),
        "raw_json": json.dumps(normalized_data)
    }