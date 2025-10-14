# models/recipe.py
from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    ingredients = Column(Text)
    instructions = Column(Text)
    image_url = Column(String, nullable=True)
