from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, date, timedelta
from typing import Optional
import uuid

from ..models.body_metrics import BodyMetrics, WeightLog, WeightLogCreate
from ..models.user import UserProfile, UserProfileUpdate
from ..auth import get_current_user, AuthenticatedUser
from ..services.firestore import get_firestore_service

router = APIRouter(prefix="/body-metrics", tags=["body-metrics"])


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get the user's profile."""
    fs = get_firestore_service()
    doc = fs.get_user_doc(user.uid).get()

    if not doc.exists:
        # Create default profile
        now = datetime.now(timezone.utc)
        data = {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.name,
            "photo_url": user.picture,
            "height_cm": None,
            "created_at": now,
            "updated_at": now,
        }
        fs.get_user_doc(user.uid).set(data)
        return UserProfile(**data)

    data = doc.to_dict()
    data["uid"] = user.uid
    return UserProfile(**data)


@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Update the user's profile."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_doc(user.uid)
    doc = doc_ref.get()

    if not doc.exists:
        # Create profile first
        await get_profile(user)
        doc = doc_ref.get()

    update_data = profile_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["uid"] = user.uid
    return UserProfile(**data)


@router.get("/weight", response_model=list[WeightLog])
async def list_weight_logs(
    months: int = 3,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get weight logs for the specified time period."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "weight_logs")

    start_date = date.today() - timedelta(days=months * 30)
    query = (
        collection.where("date", ">=", start_date)
        .order_by("date", direction="DESCENDING")
    )

    docs = query.stream()
    logs = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        logs.append(WeightLog(**data))

    return logs


@router.post("/weight", response_model=WeightLog, status_code=status.HTTP_201_CREATED)
async def create_weight_log(
    weight_log: WeightLogCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Log a new weight measurement."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "weight_logs")

    # Check if there's already a log for this date
    existing = collection.where("date", "==", weight_log.date).limit(1).stream()
    existing_doc = None
    for doc in existing:
        existing_doc = doc
        break

    now = datetime.now(timezone.utc)
    data = {
        "weight": weight_log.weight,
        "date": weight_log.date,
        "notes": weight_log.notes,
        "created_at": now,
    }

    if existing_doc:
        # Update existing log for the same date
        existing_doc.reference.update(data)
        return WeightLog(id=existing_doc.id, **data)
    else:
        # Create new log
        log_id = str(uuid.uuid4())
        collection.document(log_id).set(data)
        return WeightLog(id=log_id, **data)


@router.delete("/weight/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weight_log(
    log_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a weight log."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "weight_logs").document(log_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weight log not found",
        )

    doc_ref.delete()
