"""Point d'entrée FastAPI exposant les routes de gestion de recettes.

Ce module prépare l'application, configure le CORS pour autoriser les
échanges avec le frontend, expose un répertoire statique pour les images
et vérifie qu'un index full-text est créé dans MongoDB au démarrage.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.recipe_routes import router as recipe_router
from app.db.database import db, client

app = FastAPI()

# Autorise le frontend (ou d'autres clients) à appeler l'API sans blocage CORS.
# En production, restreindre la liste des origines à des domaines connus.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prépare un dossier local pour stocker les médias afin de pouvoir les servir
# directement depuis FastAPI sans dépendance à un service externe.
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
async def ensure_indexes():
    """Crée l'index full-text utilisé par la recherche MongoDB si nécessaire."""
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
    """Permet de tester la connexion MongoDB pour les diagnostics rapides."""
    try:
        await client.admin.command("ping")
        return {"status": "MongoDB connecté ✅"}
    except Exception as e:
        return {"status": "Erreur MongoDB ❌", "details": str(e)}


# Rattache le sous-ensemble de routes dédié aux recettes sous le préfixe /api.
app.include_router(recipe_router, prefix="/api")


@app.get("/")
async def root():
    """Affiche un message simple confirmant que l'API est opérationnelle."""
    return {"message": "Bienvenue sur l'API de recettes FastAPI + MongoDB"}
