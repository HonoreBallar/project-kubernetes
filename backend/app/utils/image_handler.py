# utils/image_handler.py
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

BASE_DIR = Path(__file__).resolve().parent.parent
IMAGES_DIR = BASE_DIR / "static" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


async def save_image(image: UploadFile) -> str:
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = IMAGES_DIR / filename
    with open(path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return f"/static/images/{filename}"
