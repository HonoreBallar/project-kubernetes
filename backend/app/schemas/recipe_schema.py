"""Schémas Pydantic contrôler les données échangées entre API et clients."""

from pydantic import BaseModel


class RecipeBase(BaseModel):
    """Champs communs partagés par les opérations de création/lecture."""

    title: str
    description: str
    ingredients: str
    instructions: str
    image_url: str | None = None


class RecipeCreate(RecipeBase):
    """Alias pour clarifier la création (hérite des validations de base)."""


class RecipeUpdate(BaseModel):
    """Payload de mise à jour partielle, chaque champ devient optionnel."""

    title: str | None = None
    description: str | None = None
    ingredients: str | None = None
    instructions: str | None = None
    image_url: str | None = None


class RecipeOut(RecipeBase):
    """Structure renvoyée au frontend, contenant l'identifiant stringifié."""

    id: str

    class Config:
        orm_mode = True
