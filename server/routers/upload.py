# upload.py
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.staticfiles import StaticFiles
import os, uuid

router = APIRouter(prefix="/upload")
UPLOAD_DIR = "static/uploads"
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")

@router.post("")
async def upload(request: Request, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "이미지 파일만 업로드 가능")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(await file.read())

    # 1순위: 환경변수로 강제
    if PUBLIC_BASE_URL:
        url = f"{PUBLIC_BASE_URL}/static/uploads/{fname}"
        return {"url": url}

    # 2순위: 프록시 헤더(X-Forwarded-*) 기반
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    host  = request.headers.get("x-forwarded-host")  or request.headers.get("host")
    if host:
        return {"url": f"{proto}://{host}/static/uploads/{fname}"}

    # 3순위: 최후의 보루
    base = str(request.base_url).rstrip("/")
    return {"url": f"{base}/static/uploads/{fname}"}
