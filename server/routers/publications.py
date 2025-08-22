from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, schemas, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/publications",
    tags=["publications"],
)

@router.get("", response_model=List[schemas.PublicationResponse])
async def read_publications(year: Optional[str] = None, db: Session = Depends(database.get_db)):
    if year:
        publications = crud.get_publications_by_year(db, year)
    else:
        publications = crud.get_all_publications_with_authors(db)
    return [schemas.PublicationResponse.from_orm(pub) for pub in publications]

@router.get("/recent", response_model=List[schemas.PublicationResponse])
async def read_recent_publications(limit: int = 5, db: Session = Depends(database.get_db)):
    publications = crud.get_recent_publications(db, limit=limit)
    if not publications:
        return []
    return [schemas.PublicationResponse.from_orm(pub) for pub in publications]

@router.post("", response_model=schemas.PublicationResponse)
async def create_publication(
    publication_data: schemas.PublicationCreate,
    authors_data: List[schemas.AuthorCreate],
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_publication = crud.create_publication(db, publication_data, current_user.id, authors_data or [])
    return schemas.PublicationResponse.from_orm(db_publication)

@router.put("/{publication_id}", response_model=schemas.PublicationResponse)
async def update_publication(
    publication_id: str,
    publication: schemas.PublicationUpdate,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_publication = crud.update_publication(
        db,
        publication_id,
        publication,
        authors_data=None,  # crud에서 PublicationUpdate 내부의 authors(_data) 우선 사용
    )
    if db_publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return schemas.PublicationResponse.from_orm(db_publication)

@router.put("/{publication_id}/order", response_model=schemas.PublicationResponse)
async def update_publication_order(
    publication_id: str,
    order: int,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_publication = crud.update_publication_order(db, publication_id, order)
    if db_publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return schemas.PublicationResponse.from_orm(db_publication)

@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_publication(
    publication_id: str,
    db: Session = Depends(database.get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    success = crud.delete_publication(db, publication_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
