import os
from sqlalchemy.orm import Session

from .models import User, UserRole
from .auth import hash_password


def ensure_admin_exists(db: Session):
    admin_email = os.getenv("ADMIN_EMAIL", "wakauate@gmail.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Beatriz1004")
    admin_name = os.getenv("ADMIN_NAME", "ARCA Admin")
    admin_phone = os.getenv("ADMIN_PHONE", "+258849666964")

    admin = db.query(User).filter(User.email == admin_email).first()
    if admin:
        # garante que é admin (se existir com role errado)
        if admin.role != UserRole.admin:
            admin.role = UserRole.admin
            db.commit()
        return

    admin = User(
        name=admin_name,
        email=admin_email,
        phone=admin_phone,
        password_hash=hash_password(admin_password),
        role=UserRole.admin,
    )

    db.add(admin)
    db.commit()