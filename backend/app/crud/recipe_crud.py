"""Fonctions CRUD asynchrones encapsulant l'accès à la collection MongoDB."""

from bson import ObjectId

from app.db.database import db


def recipe_helper(recipe) -> dict:
    """Convertit un document MongoDB en dictionnaire utilisable côté API."""
    return {
        "id": str(recipe["_id"]),
        "title": recipe["title"],
        "description": recipe["description"],
        "ingredients": recipe["ingredients"],
        "instructions": recipe["instructions"],
        "image_url": recipe.get("image_url"),
    }


async def create_recipe(data: dict) -> str:
    """Insère une nouvelle recette et renvoie son identifiant stringifié."""
    result = await db.recipes.insert_one(data)
    return str(result.inserted_id)


async def get_recipe(id: str) -> dict | None:
    """Retourne une recette par identifiant, ou None si elle n'existe pas."""
    recipe = await db.recipes.find_one({"_id": ObjectId(id)})
    return recipe_helper(recipe) if recipe else None


async def list_recipes() -> list:
    """Itère sur l'ensemble des recettes et normalise chaque document MongoDB."""
    recipes = []
    async for recipe in db.recipes.find():
        recipes.append(recipe_helper(recipe))
    return recipes


async def search_recipes(query: str) -> list:
    """Effectue une recherche full-text en utilisant l'index configuré au démarrage."""
    cursor = db.recipes.find({"$text": {"$search": query}})
    return [recipe_helper(doc) async for doc in cursor]


async def update_recipe(id: str, data: dict) -> dict | None:
    """Met à jour uniquement les champs fournis et renvoie la version finale."""
    # On nettoie le payload pour éviter d'écraser des champs avec des valeurs nulles.
    update_fields = {key: value for key, value in data.items() if value is not None}
    if not update_fields:
        recipe = await db.recipes.find_one({"_id": ObjectId(id)})
        return recipe_helper(recipe) if recipe else None

    result = await db.recipes.update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return None

    updated = await db.recipes.find_one({"_id": ObjectId(id)})
    return recipe_helper(updated) if updated else None


async def delete_recipe(id: str) -> bool:
    """Supprime la recette et confirme la suppression via le compteur MongoDB."""
    result = await db.recipes.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1
