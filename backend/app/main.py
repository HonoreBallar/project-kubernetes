# app/main.py
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.recipe_routes import router as recipe_router

app = FastAPI()

# CORS pour autoriser les appels depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.db.database import db, client

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.on_event("startup")
async def ensure_indexes():
    await db.recipes.create_index(
        [
            ("title", "text"),
            ("description", "text"),
            ("ingredients", "text"),
            ("instructions", "text"),
        ],
        name="recipe_text_index",
    )

@app.get("/ping-db")
async def ping_db():
    try:
        await client.admin.command("ping")
        return {"status": "MongoDB connecté ✅"}
    except Exception as e:
        return {"status": "Erreur MongoDB ❌", "details": str(e)}


# Inclusion des routes
app.include_router(recipe_router, prefix="/api")

# Page d’accueil
@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de recettes FastAPI + MongoDB"}
