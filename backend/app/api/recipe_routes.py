# api/recipe_routes.py
from typing import List

from bson.errors import InvalidId
from fastapi import APIRouter, UploadFile, Form, HTTPException, status

from app.utils.image_handler import save_image
from app.crud.recipe_crud import (
    create_recipe,
    delete_recipe,
    get_recipe,
    list_recipes,
    search_recipes,
    update_recipe,
)
from app.schemas.recipe_schema import RecipeOut

router = APIRouter()

@router.post("/recipes")
async def add_recipe(
    title: str = Form(...),
    description: str = Form(...),
    ingredients: str = Form(...),
    instructions: str = Form(...),
    image: UploadFile = None
):
    image_url = await save_image(image) if image else None
    data = {
        "title": title,
        "description": description,
        "ingredients": ingredients,
        "instructions": instructions,
        "image_url": image_url
    }
    recipe_id = await create_recipe(data)
    return {"id": recipe_id}

@router.get("/recipes", response_model=List[RecipeOut])
async def get_all_recipes():
    return await list_recipes()

@router.get("/recipes/search")
async def search(query: str):
    results = await search_recipes(query)
    return results

@router.get("/recipes/{recipe_id}", response_model=RecipeOut)
async def get_recipe_by_id(recipe_id: str):
    try:
        recipe = await get_recipe(recipe_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant invalide")

    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recette introuvable")
    return recipe

@router.put("/recipes/{recipe_id}")
async def edit_recipe(
    recipe_id: str,
    title: str | None = Form(None),
    description: str | None = Form(None),
    ingredients: str | None = Form(None),
    instructions: str | None = Form(None),
    image: UploadFile | None = None,
):
    update_data = {
        "title": title,
        "description": description,
        "ingredients": ingredients,
        "instructions": instructions,
    }

    if image:
        update_data["image_url"] = await save_image(image)

    try:
        recipe = await update_recipe(recipe_id, update_data)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant invalide")

    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recette introuvable")

    return recipe

@router.delete("/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_recipe(recipe_id: str):
    try:
        deleted = await delete_recipe(recipe_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant invalide")

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recette introuvable")
