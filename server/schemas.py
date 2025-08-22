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


class PublicationCreate(PublicationBase):
    pass


class PublicationResponse(PublicationBase):
    id: str
    authorId: str
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)


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
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# --- Member Schemas ---

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

    class Config:
        orm_mode = True

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


# =======================
# Contact Form
# =======================
class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
