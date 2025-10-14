# Utiliser une image Python officielle plus légère
FROM python:3.11-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Mettre à jour pip et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY app ./app

# La commande d'exécution par défaut sera surchargée par docker-compose
# Elle est ici uniquement pour un démarrage autonome si nécessaire
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
