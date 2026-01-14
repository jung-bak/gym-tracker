from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import Optional
import uuid

from ..models.routine import Routine, RoutineCreate, RoutineUpdate
from ..auth import get_current_user, AuthenticatedUser
from ..services.firestore import get_firestore_service

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get("", response_model=list[Routine])
async def list_routines(
    active_only: bool = False,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all routines for the authenticated user."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "routines")

    docs = collection.stream()
    routines = []
    today = datetime.now(timezone.utc).date()

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        data["user_id"] = user.uid

        # Convert Firestore timestamps to Python datetime
        if data.get("created_at"):
            data["created_at"] = data["created_at"]
        if data.get("updated_at"):
            data["updated_at"] = data["updated_at"]

        # Filter active routines if requested
        if active_only:
            start_date = data.get("schedule_start_date")
            end_date = data.get("schedule_end_date")

            if start_date and start_date > today:
                continue
            if end_date and end_date < today:
                continue

        routines.append(Routine(**data))

    return routines


@router.post("", response_model=Routine, status_code=status.HTTP_201_CREATED)
async def create_routine(
    routine: RoutineCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new workout routine."""
    fs = get_firestore_service()
    collection = fs.get_user_collection(user.uid, "routines")

    now = datetime.now(timezone.utc)
    routine_id = str(uuid.uuid4())

    # Process provisions to add IDs
    provisions = []
    for i, provision in enumerate(routine.provisions):
        provision_with_id = {**provision, "id": str(uuid.uuid4()), "order": i}

        # If it's a superset, add IDs to items
        if provision.get("type") == "superset" and provision.get("items"):
            provision_with_id["items"] = [
                {**item, "id": str(uuid.uuid4()), "order": j}
                for j, item in enumerate(provision["items"])
            ]

        provisions.append(provision_with_id)

    data = {
        "name": routine.name,
        "description": routine.description,
        "schedule_start_date": routine.schedule_start_date,
        "schedule_end_date": routine.schedule_end_date,
        "provisions": provisions,
        "created_at": now,
        "updated_at": now,
    }

    collection.document(routine_id).set(data)

    return Routine(id=routine_id, user_id=user.uid, **data)


@router.get("/{routine_id}", response_model=Routine)
async def get_routine(
    routine_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a specific routine by ID."""
    fs = get_firestore_service()
    doc = fs.get_user_collection(user.uid, "routines").document(routine_id).get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    data = doc.to_dict()
    data["id"] = doc.id
    data["user_id"] = user.uid
    return Routine(**data)


@router.patch("/{routine_id}", response_model=Routine)
async def update_routine(
    routine_id: str,
    routine_update: RoutineUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Update an existing routine."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "routines").document(routine_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    update_data = routine_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Process provisions if provided
    if "provisions" in update_data:
        provisions = []
        for i, provision in enumerate(update_data["provisions"]):
            if not provision.get("id"):
                provision["id"] = str(uuid.uuid4())
            provision["order"] = i

            if provision.get("type") == "superset" and provision.get("items"):
                provision["items"] = [
                    {**item, "id": item.get("id", str(uuid.uuid4())), "order": j}
                    for j, item in enumerate(provision["items"])
                ]

            provisions.append(provision)
        update_data["provisions"] = provisions

    update_data["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    data["user_id"] = user.uid
    return Routine(**data)


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(
    routine_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a routine."""
    fs = get_firestore_service()
    doc_ref = fs.get_user_collection(user.uid, "routines").document(routine_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    doc_ref.delete()
