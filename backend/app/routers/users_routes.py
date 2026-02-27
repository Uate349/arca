from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_admin, get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(
    current=Depends(get_current_user)
):
    return current

@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    users = db.query(models.User).all()
    return users