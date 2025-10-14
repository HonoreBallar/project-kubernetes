# app/crud/recipe_crud.py
from app.db.database import db
from bson import ObjectId

def recipe_helper(recipe) -> dict:
    return {
        "id": str(recipe["_id"]),
        "title": recipe["title"],
        "description": recipe["description"],
        "ingredients": recipe["ingredients"],
        "instructions": recipe["instructions"],
        "image_url": recipe.get("image_url")
    }

# 🔧 Créer une recette
async def create_recipe(data: dict) -> str:
    result = await db.recipes.insert_one(data)
    return str(result.inserted_id)

# 🔍 Récupérer une recette par ID
async def get_recipe(id: str) -> dict | None:
    recipe = await db.recipes.find_one({"_id": ObjectId(id)})
    return recipe_helper(recipe) if recipe else None

# 📋 Liste toutes les recettes
async def list_recipes() -> list:
    recipes = []
    async for recipe in db.recipes.find():
        recipes.append(recipe_helper(recipe))
    return recipes

# 🔎 Recherche par mot-clé (nécessite un index texte)
async def search_recipes(query: str) -> list:
    cursor = db.recipes.find({"$text": {"$search": query}})
    return [recipe_helper(doc) async for doc in cursor]

# ✏️ Mettre à jour une recette
async def update_recipe(id: str, data: dict) -> dict | None:
    update_fields = {key: value for key, value in data.items() if value is not None}
    if not update_fields:
        recipe = await db.recipes.find_one({"_id": ObjectId(id)})
        return recipe_helper(recipe) if recipe else None

    result = await db.recipes.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        return None

    updated = await db.recipes.find_one({"_id": ObjectId(id)})
    return recipe_helper(updated) if updated else None

# 🗑️ Supprimer une recette
async def delete_recipe(id: str) -> bool:
    result = await db.recipes.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1
