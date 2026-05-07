import json
import os

class MockDataManager:
    def __init__(self, filepath="mock_profiles.json"):
        self.filepath = filepath
        self.profiles = {}
        self._load_data()

    def _load_data(self):
        """Loads the JSON file into memory."""
        try:
            # Adjust path if your JSON is in a different folder
            if os.path.exists(self.filepath):
                with open(self.filepath, 'r') as file:
                    self.profiles = json.load(file)
                print(f"[MockManager] Loaded {len(self.profiles)} diverse profiles from {self.filepath}")
            else:
                print(f"[MockManager Warning] File {self.filepath} not found. Using empty fallback.")
        except Exception as e:
            print(f"[MockManager Error] Failed to load JSON: {e}")

    def get_data(self, profile_name: str, crawler_type: str) -> dict:
        """
        Fetches the specific crawler data for a given profile.
        Falls back to 'healthy' if the profile isn't found.
        """
        target_profile = profile_name if profile_name in self.profiles else "healthy"
        return self.profiles.get(target_profile, {}).get(crawler_type, {})

# Create a singleton instance to be used by all crawlers
mock_db = MockDataManager()