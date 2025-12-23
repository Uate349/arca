from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, UserRole
from .auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    sub = decode_token(token)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    user = db.query(User).filter(User.id == sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )
    return user


def _role_to_value(role) -> str:
    """
    Mantém compatível caso role seja Enum ou string.
    Ex.: UserRole.admin -> "admin" | "admin" -> "admin"
    """
    if role is None:
        return ""
    val = getattr(role, "value", role)
    return str(val).strip().lower()


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    # ✅ mantém a tua regra original (UserRole.admin)
    # mas com fallback seguro se em algum ponto virar string
    if getattr(user, "role", None) == UserRole.admin:
        return user

    if _role_to_value(getattr(user, "role", None)) == "admin":
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Acesso restrito",
    )