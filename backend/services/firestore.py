import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional
from ..config import settings


class FirestoreService:
    _instance: Optional["FirestoreService"] = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        if not firebase_admin._apps:
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {
                    "projectId": settings.FIREBASE_PROJECT_ID
                })
            else:
                # Use default credentials (for Cloud Run)
                firebase_admin.initialize_app(options={
                    "projectId": settings.FIREBASE_PROJECT_ID
                })
        self._db = firestore.client()

    @property
    def db(self):
        return self._db

    def get_user_collection(self, user_id: str, collection: str):
        """Get a subcollection under a user document."""
        return self._db.collection("users").document(user_id).collection(collection)

    def get_user_doc(self, user_id: str):
        """Get the user's main document."""
        return self._db.collection("users").document(user_id)


_firestore_service: Optional[FirestoreService] = None


def get_firestore_service() -> FirestoreService:
    global _firestore_service
    if _firestore_service is None:
        _firestore_service = FirestoreService()
    return _firestore_service
