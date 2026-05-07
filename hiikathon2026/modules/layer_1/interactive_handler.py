# modules/interactive_handler.py - for optional, user's feedback (if any)

class InteractiveHandler:
    """
    Definition for an interactive handler, taking user's input, feedback,...
    """
    @staticmethod
    def process_feedback(wellness_score: int = None, user_note: str = None):
        """
        Process additional (but also optional input)
        Keyword arguments:
        wellness_score -- a number to determine wellness level of an employee
        user_note -- additional feedback or narration
        """
        payload = {
            "provided": False,
            "score": None,
            "note": None
        }

        if wellness_score is not None or user_note is not None:
            payload["provided"] = True
            payload["score"] = wellness_score if wellness_score else "Not provided."
            payload["note"] = user_note if user_note else "No additional notes."

        return payload