# models.py
import uuid
from datetime import datetime
from pydantic import BaseModel

from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, DateTime, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import JSON as MySQLJSON  # ✅ JSON 컬럼
from database import Base

# (권장) MySQL 테이블 옵션: InnoDB, utf8mb4
MYSQL_TABLE_ARGS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
}

def gen_uuid_str() -> str:
    # mysql의 UUID() 함수도 가능하지만, 파이썬에서 생성하면 DB 독립성↑
    return str(uuid.uuid4())

class EmailLoginForm(BaseModel):
    email: str
    password: str


class User(Base):
    __tablename__ = "users"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    firstName = Column(String(100), nullable=False)
    lastName = Column(String(100), nullable=False)
    isApproved = Column(Boolean, default=False, nullable=False)
    isAdmin = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())
    updatedAt = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    publications = relationship("Publication", back_populates="author")
    news_items = relationship("News", back_populates="author")
    research_projects = relationship("ResearchProject", back_populates="author")


class Publication(Base):
    __tablename__ = "publications"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    title = Column(Text, nullable=False)
    journal = Column(Text)
    conference = Column(Text)
    year = Column(Integer)
    type = Column(String(32), nullable=False)          # 'journal' | 'conference'
    abstract = Column(Text, nullable=False)
    pdfUrl = Column(Text)
    imageUrl = Column(Text)
    # ⚠️ 'order'는 예약어 충돌 위험. 안전하게 내부 속성명은 displayOrder로 두고 실제 컬럼명은 "order"
    displayOrder = Column("order", Integer, default=0, nullable=False)
    authorId = Column(String(36), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())

    author = relationship("User", back_populates="publications")
    authors = relationship(
        "Author",
        back_populates="publication",
        cascade="all, delete-orphan",
        passive_deletes=True,   # ✅ ondelete="CASCADE"와 함께 실제 삭제 전파
    )


class Author(Base):
    __tablename__ = "authors"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    name = Column(Text, nullable=False)
    homepage = Column(Text)
    publicationId = Column(
        String(36),
        ForeignKey("publications.id", ondelete="CASCADE"),  # ✅ Drizzle와 동일 의미
        nullable=False,
    )
    displayOrder = Column("order", Integer, default=0, nullable=False)

    publication = relationship("Publication", back_populates="authors")


class ResearchProject(Base):
    __tablename__ = "research_projects"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    date = Column(Text, nullable=False)
    leadResearcher = Column(Text, nullable=False)
    imageUrl = Column(Text, nullable=False)
    displayOrder = Column("order", Integer, default=0, nullable=False)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())
    authorId = Column(String(36), ForeignKey("users.id"))  # Drizzle에선 notNull 아님

    author = relationship("User", back_populates="research_projects")


class News(Base):
    __tablename__ = "news"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text)
    imageUrl = Column(Text)
    publishedAt = Column(DateTime, nullable=False, server_default=func.now())
    authorId = Column(String(36), ForeignKey("users.id"), nullable=False)
    isPublished = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())
    updatedAt = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="news_items")


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    sid = Column(String(255), primary_key=True)
    # ✅ Drizzle의 jsonb → MySQL JSON
    sess = Column(MySQLJSON, nullable=False)
    expire = Column(DateTime, nullable=False)

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# ... (User, Publication, Author, News 등 기존 모델이 있으면 그대로 유지) ...

class Member(Base):
    __tablename__ = "members"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    imageUrl = Column(String(1024), nullable=True)
    homepage = Column(String(1024), nullable=True)
    degree = Column(String(50), nullable=False)          # e.g. "masters", "bachelors", "phd", "other"
    joinedAt = Column(String(100), nullable=False)       # e.g. "2021.03 ~ 현재"
    status = Column(String(255), nullable=True)   # "재학중", "네이버 인턴 중" 등 상태

    bio = Column(Text, nullable=True)
    researchInterests = Column(Text, nullable=True)

    # created/updated가 이미 있다면 유지
    createdAt = Column(DateTime, server_default=func.now(), nullable=False)
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class ResearchArea(Base):
    __tablename__ = "research_areas"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    id = Column(String(36), primary_key=True, index=True, default=gen_uuid_str)
    name = Column(Text, nullable=False)
    description = Column(Text)
    parentId = Column(String(36), ForeignKey("research_areas.id"))  # self FK
    imageUrl = Column(Text)
    displayOrder = Column("order", Integer, default=0, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())
    updatedAt = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    parent = relationship("ResearchArea", remote_side=[id])


class LabInfo(Base):
    __tablename__ = "lab_info"
    __table_args__ = (MYSQL_TABLE_ARGS,)

    # Drizzle은 기본값 'lab_settings' 단일 로우. 길이 36 내 문자열 고정.
    id = Column(String(36), primary_key=True, default='lab_settings')
    labName = Column(Text, nullable=False)
    principalInvestigator = Column(Text, nullable=False)
    piTitle = Column(Text, nullable=False)
    piEmail = Column(String(255))
    piPhone = Column(String(50))
    piPhoto = Column(Text)
    piBio = Column(Text)
    description = Column(Text)
    address = Column(Text, nullable=False)
    latitude = Column(Text)
    longitude = Column(Text)
    building = Column(Text)
    room = Column(Text)
    university = Column(Text, nullable=False)
    department = Column(Text, nullable=False)
    website = Column(Text)
    establishedYear = Column(String(10))  # 문자열 연도
    researchFocus = Column(Text)
    contactEmail = Column(String(255), nullable=False)
    contactPhone = Column(String(50))
    officeHours = Column(Text)
    createdAt = Column(DateTime, nullable=False, server_default=func.now())
    updatedAt = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
