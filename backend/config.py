import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Firebase
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # API
    API_VERSION: str = "0.1.0"
    API_TITLE: str = "Gym Tracker API"


settings = Settings()
