import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends
from fastapi import HTTPException
from ..config import settings

router = APIRouter()

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido")
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.MEDIA_DIR, filename)
    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"url": f"/media/{filename}"}
