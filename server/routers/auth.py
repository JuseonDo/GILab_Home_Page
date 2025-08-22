from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

import schemas, auth, database, crud, models
from auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, authenticate_user, get_current_active_user, get_password_hash

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.UserResponse)
async def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Failed to register")
    
    hashed_password = get_password_hash(user.password)
    new_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)
    
    return schemas.UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        firstName=new_user.firstName,
        lastName=new_user.lastName,
        isAdmin=new_user.isAdmin,
        isApproved=new_user.isApproved
    )


@router.post("/login", response_model=schemas.LoginResponse)
async def login_for_access_token(form_data: models.EmailLoginForm = Body(), db: Session = Depends(database.get_db)):
    user: models.User = authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to login",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is approved
    if not user.isApproved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to login",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # In a real application, you might set a cookie here or return the token
    # For now, we'll return user details as requested by the frontend's expected response
    return schemas.LoginResponse(
        access_token=access_token,
        user=schemas.UserResponse(
            id=str(user.id), email=user.email,
            firstName=user.firstName, lastName=user.lastName,
            isAdmin=user.isAdmin, isApproved=user.isApproved
        )
    )

@router.post("/logout")
async def logout_user(response: Response):
    # In a real application, you would invalidate the session/token here.
    # For now, we'll just return a success message.
    # If using HTTPOnly cookies, you'd clear the cookie here.
    response.delete_cookie(key="access_token") # Example if using cookies
    return {"message": "Logout successful"}

@router.get("/user", response_model=schemas.UserResponse)
async def read_current_user(current_user: schemas.User = Depends(get_current_active_user)):
    return schemas.UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        firstName=current_user.firstName,
        lastName=current_user.lastName,
        isAdmin=current_user.isAdmin,
        isApproved=current_user.isApproved
    )