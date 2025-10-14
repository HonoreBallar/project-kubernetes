# Project Kubernetes – Recipe Management Platform

Application complète de gestion de recettes construite pour être déployée aussi bien en local que dans des environnements conteneurisés (Docker Compose) ou orchestrés (Kubernetes).  
Le backend FastAPI expose une API CRUD reliée à MongoDB, tandis que le frontend React (Vite + Tailwind) fournit une interface moderne pour consulter, créer, modifier et rechercher des recettes illustrées.

## Sommaire
- [Architecture](#architecture)
- [Structure du dépôt](#structure-du-dépôt)
- [Prérequis](#prérequis)
- [Variables d'environnement](#variables-denvironnement)
- [Démarrage rapide en local](#démarrage-rapide-en-local)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Frontend (React + Vite)](#frontend-react--vite)
- [Docker Compose](#docker-compose)
- [Kubernetes](#kubernetes)
- [API du backend](#api-du-backend)
- [Fonctionnalités du frontend](#fonctionnalités-du-frontend)
- [Dépannage](#dépannage)
- [Commandes utiles](#commandes-utiles)

## Architecture
- **Backend** : FastAPI + Motor (client MongoDB asynchrone). Gère les opérations CRUD, la recherche full-text et la gestion des images (stockées dans `app/static/images`).
- **Frontend** : React 18 avec Vite et Tailwind CSS. Communication HTTP via `fetch`, gestion des formulaires (création, mise à jour), recherche en direct, mise en page responsive.
- **Base de données** : MongoDB (Atlas ou instance/self-host).
- **Stockage des images** : fichiers statiques servis depuis le backend (`/static/images/...`).
- **Déploiement** :
  - Docker Compose pour le développement et les tests locaux.
  - Manifests Kubernetes (namespace, déploiements, service, ingress) prêts pour une mise en production.

## Structure du dépôt
```text
.
├── backend/                # API FastAPI + logique MongoDB
│   ├── app/
│   │   ├── api/            # Routes FastAPI
│   │   ├── crud/           # Opérations MongoDB
│   │   ├── db/             # Connexion MongoDB
│   │   ├── schemas/        # Pydantic models
│   │   ├── utils/          # Gestion des images
│   │   └── static/images/  # Fichiers d'illustration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # SPA React + Tailwind
│   ├── src/                # Composants, pages, hooks
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── .env.example
├── compose.yml             # Stack docker-compose (frontend + backend)
├── k8s/                    # Manifests Kubernetes (namespace, deployments, ingress…)
└── README.md
```

## Prérequis
- **Node.js** ≥ 18 & npm
- **Python** ≥ 3.11
- **MongoDB** (cluster externe ou local). Les manifestes Docker Compose/Kubernetes supposent une connexion externe (Atlas).
- **Docker** et **Docker Compose** pour les workflows conteneurisés
- **kubectl** et éventuellement **kind** ou un cluster compatible Kubernetes pour l’orchestration

## Variables d'environnement
| Variable | Où | Description |
|----------|----|-------------|
| `MONGO_URI` | backend (`.env` à la racine, référencé par `compose.yml`) | Chaîne de connexion MongoDB. |
| `MONGO_DATABASE` | backend | Nom de la base (par défaut `recipes_db`). |
| `VITE_API_URL` | frontend | URL appelée par le frontend (ex. `/api` en mode proxy ou `https://mon-backend/api`). |
| `VITE_BACKEND_ORIGIN` | frontend | Origine publique du backend (ex. `https://mon-backend`). Sert à résoudre les images. Laisser vide pour utiliser la même origine que le frontend. |
| `VITE_BACKEND_PROXY_TARGET` | frontend | Cible utilisée par Vite en dev pour proxifier `/api` et `/static`. Par défaut `http://localhost:8000`. Automatiquement définie à `http://backend:8000` via Docker Compose. |

Créez les fichiers suivants si besoin :
- `./.env` : variables backend (ex. `MONGO_URI=...`, `MONGO_DATABASE=recipes_db`).
- `frontend/.env` (copie de `.env.example`) : variables frontend.

## Démarrage rapide en local

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # sous Windows: .venv\Scripts\activate
pip install -r requirements.txt
export MONGO_URI="mongodb+srv://..."  # ou via .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
L’API est exposée sur `http://localhost:8000`. La documentation interactive est accessible via `http://localhost:8000/docs`.

### Frontend (React + Vite)
```bash
cd frontend
cp .env.example .env   # ajustez les valeurs si nécessaire
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
L’interface est accessible sur `http://localhost:5173`. Les requêtes `/api` et `/static` sont proxifiées vers le backend.

## Docker Compose
```bash
docker compose up --build
```
Services disponibles :
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:8001 (port mappé depuis le conteneur 8000)

Astuce : pour recompiler le frontend après une modification des dépendances, relancez `docker compose up --build frontend`.

## Kubernetes
Des manifests prêts à l’emploi sont disponibles dans `k8s/`. Ils supposent l’existence d’un secret `backend-secret.yaml` (MONGO_URI) et d’un configmap pour les variables frontend.

Exemple de déploiement sur un cluster local `kind` :
```bash
kind create cluster --config k8s/kind-config.yaml
kubectl apply -k k8s
kubectl get all -n recipes-app
```

L’Ingress (`k8s/ingress.yaml`) est configuré pour router :
- `http://recipes.localhost/` → frontend
- `http://recipes.localhost/api` → backend

Ajoutez l’entrée suivante dans `/etc/hosts` (ou `C:\Windows\System32\drivers\etc\hosts`) :
```
127.0.0.1 recipes.localhost
```

## API du backend
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/recipes` | Liste toutes les recettes. |
| `POST` | `/api/recipes` | Crée une recette (multipart/form-data avec champs texte + `image`). |
| `GET` | `/api/recipes/{id}` | Récupère une recette par identifiant. |
| `PUT` | `/api/recipes/{id}` | Met à jour une recette (champs optionnels + nouvelle image). |
| `DELETE` | `/api/recipes/{id}` | Supprime une recette. |
| `GET` | `/api/recipes/search?query=...` | Recherche plein texte sur titre, description, ingrédients et instructions. |

Les images uploadées sont accessibles via `/static/images/<fichier>`.

## Fonctionnalités du frontend
- Liste des recettes sous forme de cartes (grille responsive, animation au survol, indicateur de sélection).
- Affichage des images (URL absolue, proxy `/static` pour le mode dev).
- Formulaire de création (titre, description, ingrédients, instructions, image optionnelle).
- Formulaire d’édition avec pré-remplissage et possibilité de remplacer l’image.
- Recherche plein texte avec affichage des résultats.
- Messages de succès/erreur contextualisés.

## Dépannage
- **Les images n’apparaissent pas** : vérifiez `VITE_BACKEND_ORIGIN` (production) ou la variable proxy (`VITE_BACKEND_PROXY_TARGET`) en développement. Confirmez également que le backend expose `/static` et que le dossier `backend/app/static/images` est monté en volume si nécessaire.
- **`vite: not found` lors d’un build local** : exécutez `npm install` depuis `frontend/` pour installer les dépendances.
- **Erreur MongoDB** : assurez-vous que `MONGO_URI` pointe vers un cluster accessible et que le pare-feu autorise l’IP utilisée.
- **CORS** : le backend autorise toutes les origines par défaut (`allow_origins=["*"]`). Ajustez si besoin pour un déploiement production.

## Commandes utiles
```bash
# Lancer les tests de compilation frontend
cd frontend && npm run build

# Vérifier l'état du cluster Kubernetes
kubectl get pods -n recipes-app

# Inspecter les logs du backend (Docker Compose)
docker compose logs backend -f

# Nettoyer les conteneurs
docker compose down --volumes --remove-orphans
```

---

Projet réalisé dans le cadre du hackathon – n’hésitez pas à adapter cette base à vos besoins (authentification, rôles utilisateur, stockage distant des images, etc.). Contributions et issues bienvenues !
