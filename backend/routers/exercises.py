from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import Optional
import uuid

from ..models.exercise import Exercise, ExerciseCreate, ExerciseUpdate
from ..auth import get_current_user, AuthenticatedUser
from ..services.firestore import get_firestore_service

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[Exercise])
async def list_exercises(
    muscle_group: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all exercises for the authenticated user."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "exercises")

    query = collection
    if muscle_group:
        query = query.where("muscle_group", "==", muscle_group)

    docs = query.stream()
    exercises = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        data["user_id"] = user.uid
        exercises.append(Exercise(**data))

    return exercises


@router.post("", response_model=Exercise, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    exercise: ExerciseCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new exercise."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "exercises")

    # Check for duplicate name
    existing = collection.where("name", "==", exercise.name).limit(1).stream()
    if any(True for _ in existing):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise with this name already exists",
        )

    now = datetime.now(timezone.utc)
    exercise_id = str(uuid.uuid4())

    data = {
        **exercise.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    collection.document(exercise_id).set(data)

    return Exercise(id=exercise_id, user_id=user.uid, **data)


@router.get("/{exercise_id}", response_model=Exercise)
async def get_exercise(
    exercise_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a specific exercise by ID."""
    fs = get_firestore_service()
    doc = fs.get_user_collection(user.uid, "exercises").document(exercise_id).get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    data = doc.to_dict()
    data["id"] = doc.id
    data["user_id"] = user.uid
    return Exercise(**data)


@router.patch("/{exercise_id}", response_model=Exercise)
async def update_exercise(
    exercise_id: str,
    exercise_update: ExerciseUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Update an existing exercise."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "exercises").document(exercise_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    update_data = exercise_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Check for duplicate name if name is being updated
    if "name" in update_data:
        existing = (
            fs.get_user_collection(user.uid, "exercises")
            .where("name", "==", update_data["name"])
            .limit(1)
            .stream()
        )
        for existing_doc in existing:
            if existing_doc.id != exercise_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Exercise with this name already exists",
                )

    update_data["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return Exercise(**data)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete an exercise."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "exercises").document(exercise_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    doc_ref.delete()
