"""Gestion centralisée de l'enregistrement des images uploadées via l'API."""

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

# On stocke les images dans backend/app/static/images pour être servies via FastAPI.
BASE_DIR = Path(__file__).resolve().parent.parent
IMAGES_DIR = BASE_DIR / "static" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


async def save_image(image: UploadFile) -> str:
    """Sauvegarde l'image fournie et retourne l'URL statique accessible côté client."""
    # On fabrique un nom de fichier unique pour éviter les collisions lors des uploads.
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = IMAGES_DIR / filename
    with open(path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return f"/static/images/{filename}"
