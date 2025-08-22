# server/routers/members.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List

import crud, schemas, database
from auth import get_current_active_user

router = APIRouter(
    prefix="/members",
    tags=["members"],
)

@router.get("", response_model=schemas.GroupedMembersResponse)
@router.get("/", response_model=schemas.GroupedMembersResponse, include_in_schema=False)
def read_members(
    grouped: bool = Query(True, description="그룹핑된 응답을 원하면 true"),
    db: Session = Depends(database.get_db)
):
    """
    프런트는 /members?grouped=true 를 사용하므로,
    응답 모델을 GroupedMembersResponse 로 고정하여 검증 불일치 문제를 방지.
    """
    g = crud.get_members_by_degree_level(db)
    return schemas.GroupedMembersResponse(
        masters=[schemas.MemberResponse.from_orm(m) for m in g.get("masters", [])],
        bachelors=[schemas.MemberResponse.from_orm(m) for m in g.get("bachelors", [])],
        phd=[schemas.MemberResponse.from_orm(m) for m in g.get("phd", [])],
        other=[schemas.MemberResponse.from_orm(m) for m in g.get("other", [])],
        alumni=[schemas.MemberResponse.from_orm(m) for m in g.get("alumni", [])],
    )

@router.post("", response_model=schemas.MemberResponse)
def create_member(
    member: schemas.MemberCreate,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_active_user),
):
    if not getattr(current_user, "isAdmin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    db_member = crud.create_member(db, member)
    return schemas.MemberResponse.from_orm(db_member)

@router.put("/{member_id}", response_model=schemas.MemberResponse)
def update_member(
    member_id: str,
    member: schemas.MemberUpdate,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_active_user),
):
    if not getattr(current_user, "isAdmin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    db_member = crud.update_member(db, member_id, member)
    if db_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return schemas.MemberResponse.from_orm(db_member)

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_active_user),
):
    if not getattr(current_user, "isAdmin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    if not crud.delete_member(db, member_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
