# app/db/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from decouple import config

from dotenv import load_dotenv

load_dotenv()

MONGO_URI = config("MONGO_URI")
MONGO_DB_NAME = config("MONGO_DATABASE", default="recipes_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]
