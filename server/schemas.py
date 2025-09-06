from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# =======================
# User Schemas
# =======================
class UserBase(BaseModel):
    email: str
    firstName: str
    lastName: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    isAdmin: bool
    isApproved: bool
    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    id: str
    hashed_password: str
    isAdmin: bool
    isApproved: bool
    createdAt: datetime
    updatedAt: datetime
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# =======================
# Publication & Author
# =======================
class PublicationBase(BaseModel):
    title: str
    journal: Optional[str] = None
    conference: Optional[str] = None
    year: int
    type: str  # 'journal' | 'conference'
    abstract: str
    pdfUrl: Optional[str] = None
    imageUrl: Optional[str] = None
    order: Optional[int] = 0

class AuthorBase(BaseModel):
    name: str
    homepage: Optional[str] = None
    order: Optional[int] = 0

class AuthorCreate(AuthorBase):
    pass

class AuthorResponse(AuthorBase):
    id: str
    publicationId: str
    model_config = ConfigDict(from_attributes=True)

class PublicationCreate(PublicationBase):
    # POST에서는 라우트에서 publication_data / authors_data 를 분리해 받습니다.
    # (프론트 호환성 유지를 위해 여기서는 authors 필드를 강제하지 않습니다.)
    pass

class PublicationUpdate(PublicationBase):
    """
    PUT /publications/:id 에서는 프론트가 보내는 형태를 모두 수용:
    - authors: [{ name, homepage, order? }]
    - authors_data: [{ name, homepage, order? }]
    둘 중 하나라도 있으면 갱신, 둘 다 없으면 저자 목록은 변경하지 않음.
    """
    authors: Optional[List[AuthorCreate]] = None
    authors_data: Optional[List[AuthorCreate]] = None

class PublicationResponse(PublicationBase):
    id: str
    authorId: str
    createdAt: datetime
    # ✅ 응답에 저자 배열을 포함 (홈/리서치 페이지에서 바로 렌더 가능)
    authors: List[AuthorResponse] = []
    model_config = ConfigDict(from_attributes=True)


# =======================
# Research Projects
# =======================
class ResearchProjectBase(BaseModel):
    title: str
    description: str
    category: str
    date: str
    leadResearcher: str
    imageUrl: str
    order: Optional[int] = 0

class ResearchProjectCreate(ResearchProjectBase):
    pass

class ResearchProjectResponse(ResearchProjectBase):
    id: str
    authorId: Optional[str] = None
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)


# =======================
# News
# =======================
class NewsBase(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    imageUrl: Optional[str] = None

class NewsCreate(NewsBase):
    pass

class NewsResponse(NewsBase):
    id: str
    publishedAt: datetime
    authorId: str
    isPublished: bool
    createdAt: datetime
    updatedAt: datetime
    model_config = ConfigDict(from_attributes=True)


# =======================
# Sessions
# =======================
class SessionBase(BaseModel):
    sid: str
    sess: dict   # JSON
    expire: datetime

class SessionResponse(SessionBase):
    model_config = ConfigDict(from_attributes=True)


# =======================
# Members
# =======================
class MemberBase(BaseModel):
    name: str
    degree: str
    email: Optional[EmailStr] = None
    imageUrl: Optional[str] = None
    homepage: Optional[str] = None
    joinedAt: str
    status: Optional[str] = "current"
    bio: Optional[str] = None
    researchInterests: Optional[str] = None

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    degree: Optional[str] = None
    email: Optional[EmailStr] = None
    imageUrl: Optional[str] = None
    homepage: Optional[str] = None
    joinedAt: Optional[str] = None
    status: Optional[str] = None
    bio: Optional[str] = None
    researchInterests: Optional[str] = None

class MemberResponse(MemberBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class GroupedMembersResponse(BaseModel):
    masters: List[MemberResponse] = []
    bachelors: List[MemberResponse] = []
    phd: List[MemberResponse] = []
    other: List[MemberResponse] = []
    alumni: List[MemberResponse] = []


# =======================
# Research Areas
# =======================
class ResearchAreaBase(BaseModel):
    name: str
    description: Optional[str] = None
    parentId: Optional[str] = None
    imageUrl: Optional[str] = None
    order: Optional[int] = 0
    isActive: Optional[bool] = True

class ResearchAreaCreate(ResearchAreaBase):
    pass

class ResearchAreaResponse(ResearchAreaBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    model_config = ConfigDict(from_attributes=True)


# =======================
# Lab Info
# =======================
class LabInfoBase(BaseModel):
    labName: str
    principalInvestigator: str
    piTitle: str
    piEmail: Optional[EmailStr] = None
    piPhone: Optional[str] = None
    piPhoto: Optional[str] = None
    piBio: Optional[str] = None
    description: Optional[str] = None
    address: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    building: Optional[str] = None
    room: Optional[str] = None
    university: str
    department: str
    website: Optional[str] = None
    establishedYear: Optional[str] = None
    researchFocus: Optional[str] = None
    contactEmail: EmailStr
    contactPhone: Optional[str] = None
    officeHours: Optional[str] = None

class LabInfoCreate(LabInfoBase):
    pass

class LabInfoResponse(LabInfoBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    model_config = ConfigDict(from_attributes=True)


