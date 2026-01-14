from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, date
from typing import Optional
import uuid

from ..models.session import (
    WorkoutSession,
    WorkoutSessionCreate,
    WorkoutSessionUpdate,
    PerformedExercise,
    PerformedSet,
    AddExerciseToSession,
    AddSetToExercise,
)
from ..auth import get_current_user, AuthenticatedUser
from ..services.firestore import get_firestore_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[WorkoutSession])
async def list_sessions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List workout sessions for the authenticated user."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "sessions")

    query = collection.order_by("date", direction="DESCENDING")

    if start_date:
        query = query.where("date", ">=", start_date)
    if end_date:
        query = query.where("date", "<=", end_date)

    query = query.limit(limit)
    docs = query.stream()

    sessions = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        data["user_id"] = user.uid
        sessions.append(WorkoutSession(**data))

    return sessions


@router.post("", response_model=WorkoutSession, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: WorkoutSessionCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Start a new workout session."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "sessions")

    now = datetime.now(timezone.utc)
    session_id = str(uuid.uuid4())

    data = {
        "routine_id": session.routine_id,
        "routine_name": session.routine_name,
        "date": session.date,
        "notes": session.notes,
        "start_time": now,
        "end_time": None,
        "performed_exercises": [],
        "created_at": now,
        "updated_at": now,
    }

    collection.document(session_id).set(data)

    return WorkoutSession(id=session_id, user_id=user.uid, **data)


@router.get("/active", response_model=Optional[WorkoutSession])
async def get_active_session(
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get the current active (unfinished) session if one exists."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "sessions")

    # Find sessions with no end_time
    query = collection.where("end_time", "==", None).limit(1)
    docs = list(query.stream())

    if not docs:
        return None

    doc = docs[0]
    data = doc.to_dict()
    data["id"] = doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.get("/{session_id}", response_model=WorkoutSession)
async def get_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a specific session by ID."""
    fs = get_firestore_service()
    doc = fs.get_user_collection(user.uid, "sessions").document(session_id).get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    data = doc.to_dict()
    data["id"] = doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.patch("/{session_id}", response_model=WorkoutSession)
async def update_session(
    session_id: str,
    session_update: WorkoutSessionUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Update a session (notes, end time)."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    update_data = session_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.post("/{session_id}/finish", response_model=WorkoutSession)
async def finish_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Mark a session as finished."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    now = datetime.now(timezone.utc)
    doc_ref.update({"end_time": now, "updated_at": now})

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.post("/{session_id}/exercises", response_model=WorkoutSession)
async def add_exercise_to_session(
    session_id: str,
    exercise_data: AddExerciseToSession,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Add an exercise to a session."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session_data = doc.to_dict()

    # Get exercise name
    exercise_doc = (
        fs.get_user_collection(user.uid, "exercises")
        .document(exercise_data.exercise_id)
        .get()
    )
    exercise_name = None
    if exercise_doc.exists:
        exercise_name = exercise_doc.to_dict().get("name")

    # Create new performed exercise
    performed_exercises = session_data.get("performed_exercises", [])
    new_exercise = {
        "id": str(uuid.uuid4()),
        "exercise_id": exercise_data.exercise_id,
        "exercise_name": exercise_name,
        "routine_item_id": exercise_data.routine_item_id,
        "is_adhoc": exercise_data.is_adhoc,
        "sets": [],
        "order": len(performed_exercises),
        "notes": None,
    }

    performed_exercises.append(new_exercise)

    now = datetime.now(timezone.utc)
    doc_ref.update({"performed_exercises": performed_exercises, "updated_at": now})

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.post(
    "/{session_id}/exercises/{performed_exercise_id}/sets",
    response_model=WorkoutSession,
)
async def add_set_to_exercise(
    session_id: str,
    performed_exercise_id: str,
    set_data: AddSetToExercise,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Add a set to a performed exercise."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session_data = doc.to_dict()
    performed_exercises = session_data.get("performed_exercises", [])

    # Find the exercise
    exercise_found = False
    for exercise in performed_exercises:
        if exercise.get("id") == performed_exercise_id:
            exercise_found = True
            sets = exercise.get("sets", [])
            new_set = {
                "set_number": len(sets) + 1,
                "reps": set_data.reps,
                "weight": set_data.weight,
                "rpe": set_data.rpe,
                "completed": True,
                "notes": set_data.notes,
            }
            sets.append(new_set)
            exercise["sets"] = sets
            break

    if not exercise_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performed exercise not found in session",
        )

    now = datetime.now(timezone.utc)
    doc_ref.update({"performed_exercises": performed_exercises, "updated_at": now})

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return WorkoutSession(**data)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a session."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    doc_ref.delete()
