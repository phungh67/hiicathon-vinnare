# modules/normalizer.py - digest/aggregate all data into one form

import json
from .crawlers import CalendarCrawlwer, TaskCrawler, CommCralwer, HRISCrawler
from .interactive_handler import InteractiveHandler

def aggregate_and_normalize(employee_id: str, profile: str = "burnout", interact_data: dict = None):
    """
    Function to crawl data from L1 sources
    Merge these data with optional headers or annotations
    Normalized these data into a structural one - put in vector database
    Keyword arguments:
    employee_id -- ID of a given employee
    profile -- type of profile: 'neutral', 'burnout', 'warning'
    interact_data -- additional data, provided by user
    """

    calendar_data = CalendarCrawlwer.fetch(employee_id=employee_id, profile=profile)
    task_data = TaskCrawler.fetch(employee_id=employee_id, profile=profile)
    comm_data = CommCralwer.fetch(employee_id=employee_id, profile=profile)
    hirs_data = HRISCrawler.fetch(employee_id=employee_id)

    # process the additional data (if any)
    wellness_score = interact_data.get("wellness_score") if interact_data else None
    note = interact_data.get("user_note") if interact_data else None
    user_feedback = InteractiveHandler.process_feedback(wellness_score, note)

    # create the payload
    normalized_data = {
        "employee_id": employee_id,
        "role": hirs_data["role"],
        "meeting_burden_hrs": calendar_data["hours_in_meetings"],
        "cognitive_load_tasks": comm_data["high_priority"],
        "interruption_volume": comm_data["messages_sent"],
        "feedback_provided": user_feedback["provided"]
    }

    # must forge a narrative for stored documents to put in the database
    narrative_document = f"""
    [HRIS] Role: {hirs_data['role']}, Tenure: {hirs_data['tenure_years']} years.
    [CALENDAR] Meeting Load: {calendar_data['hours_in_meetings']} hours across {calendar_data['total_meetings']} meetings. Uninterrupted focus blocks: {cal_data['uninterrupted_blocks']}.
    [TASKS] Cognitive Load: {task_data['active_tickets']} active tickets, {task_data['high_priority']} high priority. Avg completion: {task_data['avg_completion_time_hrs']} hrs.
    [COMMUNICATION] Interruptions: {comm_data['messages_sent']} messages sent. After-hours pings: {comm_data['after_hours_pings']}. Tone: {comm_data['sentiment_flag']}.
    """

    if user_feedback["provided"]:
        narrative_document += f"[WELLNESS FEEDBACK] Score: {user_feedback['score']}/5. Note: '{user_feedback['note']}'."
    else:
        narrative_document += "[WELLNESS FEEDBACK] No manual check-in provided today."

    return {
        "metadata": normalized_data,
        "vector_document": narrative_document.strip(),
        "raw_json": json.dumps(normalized_data)
    }