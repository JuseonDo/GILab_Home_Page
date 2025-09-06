from fastapi import FastAPI, Depends, status, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database
from database import engine
from routers import auth as auth_router, members, news, lab_info, publications, research, upload, admin, research_areas
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="GILab API",
    description="API for the Generative Intelligence Lab Homepage",
    version="1.0.0",
    redirect_slashes=True,
)

app.mount("/static", StaticFiles(directory="static"), name="static")


# CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for external access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(auth_router.router)
app.include_router(members.router)
app.include_router(news.router)
app.include_router(lab_info.router)
app.include_router(publications.router)
app.include_router(research.router)
app.include_router(upload.router)
app.include_router(admin.router)
app.include_router(research_areas.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the GILab API"}