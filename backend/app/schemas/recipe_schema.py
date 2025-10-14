# schemas/recipe_schema.py
from pydantic import BaseModel

class RecipeBase(BaseModel):
    title: str
    description: str
    ingredients: str
    instructions: str
    image_url: str | None = None

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    ingredients: str | None = None
    instructions: str | None = None
    image_url: str | None = None

class RecipeOut(RecipeBase):
    id: str

    class Config:
        orm_mode = True
