# server/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional

import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import crud
import database
import models
import schemas
from models import EmailLoginForm  # 이미 만들어 둔 이메일 로그인 폼 (email, password)

# === 환경 변수 ===
# 배포에서는 반드시 서버 프로세스에 주입하세요 (.env 로드 또는 uvicorn --env-file)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")  # 개발 기본값(배포 전 교체)
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# === 보안 유틸 ===
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """이메일로 유저 조회 → 비밀번호 검증"""
    # crud 레이어가 있다면 선호: user = crud.get_user_by_email(db, email=email)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    # 모델의 해시 필드명이 hashed_password 인 것을 기준으로 함 (다르면 수정)
    hashed = getattr(user, "hashed_password", None) or getattr(user, "password", None)
    if not hashed or not verify_password(password, hashed):
        return None
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    """Bearer 토큰에서 email(sub)을 꺼내 유저를 로드"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        # 참고: schemas.TokenData 가 email 필드를 가진다면 다음 라인 유지
        _ = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception

    # crud 사용 선호 시: user = crud.get_user_by_email(db, email=email)
    user = db.query(models.User).where(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    # 필요 시 승인/활성화 체크 추가 가능 (예: if not current_user.is_approved: raise HTTPException(...))
    return current_user

# === 라우터 ===
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
async def login_for_access_token(
    payload: EmailLoginForm,                      # ★ JSON Body: { "email": "...", "password": "..." }
    db: Session = Depends(database.get_db),
):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to login",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    # 프론트 login.tsx가 기대하는 모양에 맞춰 반환
    return {
        "access_token": access_token,
        "user": {
            "id": getattr(user, "id"),
            "email": getattr(user, "email"),
            "firstName": getattr(user, "first_name", None),
            "lastName": getattr(user, "last_name", None),
            "isAdmin": getattr(user, "is_admin", False),
            "isApproved": getattr(user, "is_approved", False),
        },
    }

@router.get("/user")
async def read_me(current_user: models.User = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보"""
    return {
        "id": getattr(current_user, "id"),
        "email": getattr(current_user, "email"),
        "firstName": getattr(current_user, "first_name", None),
        "lastName": getattr(current_user, "last_name", None),
        "isAdmin": getattr(current_user, "is_admin", False),
        "isApproved": getattr(current_user, "is_approved", False),
    }
