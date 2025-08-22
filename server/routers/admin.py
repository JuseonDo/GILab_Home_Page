from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import schemas, crud, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

async def get_current_admin_user(current_user: schemas.User = Depends(get_current_active_user)):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

@router.get("/pending-users", response_model=List[schemas.UserResponse])
async def read_pending_users(db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    users = crud.get_all_pending_users(db)
    return [schemas.UserResponse.from_orm(user) for user in users]

@router.post("/approve-user/{user_id}", response_model=schemas.UserResponse)
async def approve_user_endpoint(user_id: str, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    approved_user = crud.approve_user(db, user_id)
    if not approved_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return schemas.UserResponse.from_orm(approved_user)
