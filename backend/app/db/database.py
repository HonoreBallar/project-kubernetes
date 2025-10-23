"""Initialise la connexion asynchrone à MongoDB via Motor."""

from decouple import config
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv

# Charge les variables d'environnement depuis un fichier .env pour les setups locaux.
load_dotenv()

# URI de connexion complète (incluant credentials/host) et nom de base à utiliser.
MONGO_URI = config("MONGO_URI")
MONGO_DB_NAME = config("MONGO_DATABASE", default="recipes_db")

# Client Motor partagé et objet base de données, réutilisés dans toute l'application.
client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]
