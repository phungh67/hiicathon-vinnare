# modules/layer_1/crawlers.py

from .mock_manager import mock_db

class CalendarCrawler:
    @staticmethod
    def fetch(employee_id: str, profile: str = "healthy"):
        return mock_db.get_data(profile, "calendar")

class TaskCrawler:
    @staticmethod
    def fetch(employee_id: str, profile: str = "healthy"):
        return mock_db.get_data(profile, "task")

class CommCrawler:
    @staticmethod
    def fetch(employee_id: str, profile: str = "healthy"):
        return mock_db.get_data(profile, "comm")

class HRISCrawler:
    @staticmethod
    def fetch(employee_id: str, profile: str = "healthy"):
        return mock_db.get_data(profile, "hris")