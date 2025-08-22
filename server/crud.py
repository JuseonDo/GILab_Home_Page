from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
import models, schemas
from typing import List, Optional, Dict

# --- User CRUD ---
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        firstName=user.firstName,
        lastName=user.lastName,
        isApproved=False,
        isAdmin=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_pending_users(db: Session) -> List[models.User]:
    return db.query(models.User).filter(models.User.isApproved == False).all()

def approve_user(db: Session, user_id: str) -> Optional[models.User]:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.isApproved = True
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Publication CRUD ---
def get_all_publications_with_authors(db: Session) -> List[models.Publication]:
    # displayOrder가 있으면 우선, 없으면 year desc
    return db.query(models.Publication).order_by(asc(models.Publication.displayOrder)).all()

def get_publications_by_year(db: Session, year: str) -> List[models.Publication]:
    return (
        db.query(models.Publication)
        .filter(models.Publication.year == year)
        .order_by(asc(models.Publication.displayOrder))
        .all()
    )

def get_recent_publications(db: Session, limit: int = 5) -> List[models.Publication]:
    return (
        db.query(models.Publication)
        .order_by(desc(models.Publication.year), asc(models.Publication.displayOrder))
        .limit(limit)
        .all()
    )

def create_publication(
    db: Session,
    publication: schemas.PublicationCreate,
    author_id: str,
    authors_data: List[schemas.AuthorCreate],
) -> models.Publication:
    # 1) Publication payload 정리: order -> displayOrder
    pub_payload = publication.dict(exclude_unset=True)
    pub_display_order = pub_payload.pop("order", 0)
    pub_payload["displayOrder"] = pub_display_order

    db_publication = models.Publication(**pub_payload, authorId=author_id)
    db.add(db_publication)
    db.flush()  # id 확보

    # 2) Authors: order -> displayOrder, 기본값은 enumerate 인덱스
    for idx, author_data in enumerate(authors_data):
        a_payload = author_data.dict(exclude_unset=True)
        a_display_order = a_payload.pop("order", idx)
        a_payload["displayOrder"] = a_display_order

        db_author = models.Author(
            **a_payload,
            publicationId=db_publication.id,
        )
        db.add(db_author)

    db.commit()
    db.refresh(db_publication)
    return db_publication

def update_publication(db: Session, publication_id: str, publication: schemas.PublicationCreate) -> Optional[models.Publication]:
    db_publication = db.query(models.Publication).filter(models.Publication.id == publication_id).first()
    if not db_publication:
        return None

    updates = publication.dict(exclude_unset=True)
    if "order" in updates:
        updates["displayOrder"] = updates.pop("order")

    for key, value in updates.items():
        setattr(db_publication, key, value)

    db.commit()
    db.refresh(db_publication)
    return db_publication


def update_publication_order(db: Session, publication_id: str, order: int) -> Optional[models.Publication]:
    db_publication = db.query(models.Publication).filter(models.Publication.id == publication_id).first()
    if not db_publication:
        return None
    db_publication.displayOrder = order
    db.commit()
    db.refresh(db_publication)
    return db_publication


def delete_publication(db: Session, publication_id: str) -> bool:
    db_publication = db.query(models.Publication).filter(models.Publication.id == publication_id).first()
    if not db_publication:
        return False
    db.delete(db_publication)
    db.commit()
    return True

# --- Author CRUD ---
def create_author(db: Session, author: schemas.AuthorCreate, publication_id: str) -> models.Author:
    db_author = models.Author(name=author.name, homepage=author.homepage, publicationId=publication_id)
    db.add(db_author)
    db.commit()
    db.refresh(db_author)
    return db_author

# --- Research Project CRUD ---
def get_all_research_projects(db: Session) -> List[models.ResearchProject]:
    return db.query(models.ResearchProject).order_by(asc(models.ResearchProject.order)).all()

def create_research_project(db: Session, project: schemas.ResearchProjectCreate, author_id: str) -> models.ResearchProject:
    db_project = models.ResearchProject(**project.dict(exclude_unset=True), authorId=author_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# --- News CRUD ---
def get_all_news(db: Session) -> List[models.News]:
    return db.query(models.News).order_by(desc(models.News.publishedAt)).all()

def get_recent_news(db: Session, limit: int) -> List[models.News]:
    return db.query(models.News).order_by(desc(models.News.publishedAt)).limit(limit).all()

def get_news_by_id(db: Session, news_id: str) -> Optional[models.News]:
    return db.query(models.News).filter(models.News.id == news_id).first()

def create_news(db: Session, news: schemas.NewsCreate, author_id: str) -> models.News:
    db_news = models.News(**news.dict(exclude_unset=True), authorId=author_id)
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news

def update_news(db: Session, news_id: str, news: schemas.NewsCreate) -> Optional[models.News]:
    db_news = db.query(models.News).filter(models.News.id == news_id).first()
    if not db_news:
        return None
    for key, value in news.dict(exclude_unset=True).items():
        setattr(db_news, key, value)
    db.commit()
    db.refresh(db_news)
    return db_news

def delete_news(db: Session, news_id: str) -> bool:
    db_news = db.query(models.News).filter(models.News.id == news_id).first()
    if not db_news:
        return False
    db.delete(db_news)
    db.commit()
    return True

# --- Member CRUD ---
def get_members(db: Session) -> List[models.Member]:
    """일반 목록: 이름으로만 정렬(스키마 추가 없이 안전)"""
    return db.query(models.Member).order_by(asc(models.Member.name)).all()

def get_members_by_degree_level(db: Session) -> Dict[str, List[models.Member]]:
    """
    그룹핑된 목록을 dict으로 반환.
    DB 스키마 변경 없이 안전하게 이름 기준 정렬 후 파이썬에서 그룹핑.
    """
    members = db.query(models.Member).order_by(asc(models.Member.name)).all()
    grouped = {
        "masters": [],
        "bachelors": [],
        "phd": [],
        "other": [],
        "alumni": [],
    }
    for m in members:
        # 상태가 졸업/alumni면 별도 버킷으로
        if (m.status or "").lower() == "alumni":
            grouped["alumni"].append(m)
            continue

        deg = (m.degree or "").lower()
        if deg in grouped:
            grouped[deg].append(m)
        elif deg in {"phd", "ph.d", "doctor"}:
            grouped["phd"].append(m)
        elif deg.startswith("master"):
            grouped["masters"].append(m)
        elif deg.startswith("bachelor"):
            grouped["bachelors"].append(m)
        else:
            grouped["other"].append(m)
    return grouped

def create_member(db: Session, member: schemas.MemberCreate) -> models.Member:
    db_member = models.Member(**member.dict(exclude_unset=True))
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def update_member(db: Session, member_id: str, member: schemas.MemberUpdate) -> Optional[models.Member]:
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not db_member:
        return None
    for k, v in member.dict(exclude_unset=True).items():
        setattr(db_member, k, v)
    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member(db: Session, member_id: str) -> bool:
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not db_member:
        return False
    db.delete(db_member)
    db.commit()
    return True

# --- Research Area CRUD ---
def get_all_research_areas(db: Session) -> List[models.ResearchArea]:
    return db.query(models.ResearchArea).order_by(asc(models.ResearchArea.order)).all()

def get_research_areas_by_parent(db: Session, parent_id: Optional[str] = None) -> List[models.ResearchArea]:
    if parent_id is None:
        return (
            db.query(models.ResearchArea)
            .filter(models.ResearchArea.parentId == None)  # noqa: E711
            .order_by(asc(models.ResearchArea.order))
            .all()
        )
    return (
        db.query(models.ResearchArea)
        .filter(models.ResearchArea.parentId == parent_id)
        .order_by(asc(models.ResearchArea.order))
        .all()
    )

def get_research_area_by_id(db: Session, area_id: str) -> Optional[models.ResearchArea]:
    return db.query(models.ResearchArea).filter(models.ResearchArea.id == area_id).first()

def create_research_area(db: Session, area: schemas.ResearchAreaCreate) -> models.ResearchArea:
    db_area = models.ResearchArea(**area.dict(exclude_unset=True))
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

def update_research_area(db: Session, area_id: str, area: schemas.ResearchAreaCreate) -> Optional[models.ResearchArea]:
    db_area = db.query(models.ResearchArea).filter(models.ResearchArea.id == area_id).first()
    if not db_area:
        return None
    for key, value in area.dict(exclude_unset=True).items():
        setattr(db_area, key, value)
    db.commit()
    db.refresh(db_area)
    return db_area

def delete_research_area(db: Session, area_id: str) -> bool:
    db_area = db.query(models.ResearchArea).filter(models.ResearchArea.id == area_id).first()
    if not db_area:
        return False
    db.delete(db_area)
    db.commit()
    return True

# --- Lab Info CRUD ---
def get_lab_info(db: Session) -> Optional[models.LabInfo]:
    return db.query(models.LabInfo).filter(models.LabInfo.id == "lab_settings").first()

def create_or_update_lab_info(db: Session, lab_info: schemas.LabInfoCreate) -> models.LabInfo:
    db_lab_info = db.query(models.LabInfo).filter(models.LabInfo.id == "lab_settings").first()
    if db_lab_info:
        for key, value in lab_info.dict(exclude_unset=True).items():
            setattr(db_lab_info, key, value)
    else:
        db_lab_info = models.LabInfo(id="lab_settings", **lab_info.dict(exclude_unset=True))
        db.add(db_lab_info)
    db.commit()
    db.refresh(db_lab_info)
    return db_lab_info
