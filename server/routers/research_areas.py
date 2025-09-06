from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

import schemas, crud, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/research-areas",
    tags=["research-areas"],
)

@router.get("/", response_model=List[schemas.ResearchAreaResponse])
async def read_research_areas(parent_id: Optional[str] = None, db: Session = Depends(database.get_db)):
    areas = crud.get_research_areas_by_parent(db, parent_id)
    return [schemas.ResearchAreaResponse.from_orm(area) for area in areas]

@router.get("/{area_id}", response_model=schemas.ResearchAreaResponse)
async def read_research_area(area_id: str, db: Session = Depends(database.get_db)):
    area = crud.get_research_area_by_id(db, area_id)
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research area not found")
    return schemas.ResearchAreaResponse.from_orm(area)

@router.post("/", response_model=schemas.ResearchAreaResponse)
async def create_research_area(area: schemas.ResearchAreaCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Only admin can create research areas
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    db_area = crud.create_research_area(db, area)
    return schemas.ResearchAreaResponse.from_orm(db_area)


@router.put("/{area_id}", response_model=schemas.ResearchAreaResponse)
async def update_research_area(area_id: str, area: schemas.ResearchAreaCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Only admin can update research areas
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_area = crud.update_research_area(db, area_id, area)
    if db_area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research area not found")
    return schemas.ResearchAreaResponse.from_orm(db_area)

@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_research_area(area_id: str, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Only admin can delete research areas
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    success = crud.delete_research_area(db, area_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research area not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
