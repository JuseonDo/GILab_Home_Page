from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import crud, schemas, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/research-projects", # Changed prefix to match Express.js reference
    tags=["research-projects"],
)

@router.get("", response_model=List[schemas.ResearchProjectResponse])
async def read_research_projects(db: Session = Depends(database.get_db)):
    projects = crud.get_all_research_projects(db)
    return [schemas.ResearchProjectResponse.from_orm(project) for project in projects]

@router.post("", response_model=schemas.ResearchProjectResponse)
async def create_research_project(project: schemas.ResearchProjectCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Assuming only admin can create research projects
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_project = crud.create_research_project(db, project, current_user.id)
    return schemas.ResearchProjectResponse.from_orm(db_project)