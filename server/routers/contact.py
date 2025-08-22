from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import schemas

router = APIRouter(
    prefix="/contact",
    tags=["contact"],
)

@router.post("")
async def submit_contact_form(contact_form: schemas.ContactForm):
    # In a real application, you would send an email or save to a database
    print(f"Contact form submission: {contact_form.dict()}")
    return {"message": "Message sent successfully"}
