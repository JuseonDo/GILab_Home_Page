from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, schemas, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/news",
    tags=["news"],
)

@router.get("", response_model=List[schemas.NewsResponse])
async def read_news(limit: Optional[int] = None, db: Session = Depends(database.get_db)):
    if limit:
        news_items = crud.get_recent_news(db, limit=limit)
    else:
        news_items = crud.get_all_news(db)
    return [schemas.NewsResponse.from_orm(item) for item in news_items]

@router.get("/{news_id}", response_model=schemas.NewsResponse)
async def read_news_item(news_id: str, db: Session = Depends(database.get_db)):
    news_item = crud.get_news_by_id(db, news_id)
    if news_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    return schemas.NewsResponse.from_orm(news_item)

@router.post("", response_model=schemas.NewsResponse)
async def create_news_item(news: schemas.NewsCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Assuming only admin can create news
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_news = crud.create_news(db, news, current_user.id)
    return schemas.NewsResponse.from_orm(db_news)

@router.put("/{news_id}", response_model=schemas.NewsResponse)
async def update_news_item(news_id: str, news: schemas.NewsCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Assuming only admin can update news
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db_news = crud.update_news(db, news_id, news)
    if db_news is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    return schemas.NewsResponse.from_orm(db_news)

@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news_item(news_id: str, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Assuming only admin can delete news
    if not current_user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    success = crud.delete_news(db, news_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)