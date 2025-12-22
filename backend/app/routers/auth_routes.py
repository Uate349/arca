from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas, auth
from ..deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=schemas.UserOut)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user = models.User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=auth.hash_password(data.password),
        role=data.role,
        referred_by_id=data.referred_by_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token)
def login(data: schemas.LoginData, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)

@router.get("/me", response_model=schemas.UserOut)
def me(current = Depends(get_current_user)):
    return current
