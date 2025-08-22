# server/routers/lab_info.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

import crud, schemas, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/lab-info",
    tags=["lab-info"],
)

@router.get("", response_model=Optional[schemas.LabInfoResponse])
async def get_lab_info(db: Session = Depends(database.get_db)):
    """
    존재하지 않으면 200 + null 반환.
    """
    info = crud.get_lab_info(db)
    if info is None:
        return None
    # Pydantic v2: from_attributes=True
    return schemas.LabInfoResponse.model_validate(info, from_attributes=True)

@router.put("", response_model=schemas.LabInfoResponse)
async def upsert_lab_info(
    lab_info: schemas.LabInfoCreate,  # 전체 스키마(필수 많음)
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(get_current_active_user),
):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # 업서트: 존재하면 업데이트, 없으면 생성
    saved = crud.create_or_update_lab_info(db, lab_info)
    return schemas.LabInfoResponse.model_validate(saved, from_attributes=True)
