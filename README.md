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
- **MongoDB** : un cluster externe (Atlas) *ou* le service MongoDB local intégré à Docker Compose.
- **Docker** et **Docker Compose** pour les workflows conteneurisés
- **kubectl** et éventuellement **kind** ou un cluster compatible Kubernetes pour l’orchestration

## Variables d'environnement
| Variable | Où | Description |
|----------|----|-------------|
| `MONGO_URI` | backend (`.env` à la racine, référencé par `compose.yml`) | Chaîne de connexion MongoDB. Par défaut en Docker Compose : `mongodb://recipeadmin:recipepass@mongo:27017/recipes_db?authSource=admin`. |
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
- **MongoDB** : port 27017 exposé (admin : `recipeadmin` / `recipepass`)
- **Backend** : http://localhost:8001 (port mappé depuis le conteneur 8000)
- **Frontend** : http://localhost:5173
- **Mongo Express** : http://localhost:8081 (auth basique `admin` / `admin`)

Astuce : pour recompiler le frontend après une modification des dépendances, relancez `docker compose up --build frontend`.

### Connexion à MongoDB local
```bash
docker compose exec mongo mongosh -u recipeadmin -p recipepass --authenticationDatabase admin
```
La base par défaut est `recipes_db`. Les données sont conservées dans le volume Docker `mongo-data`.

### Visualiser les données
Ouvrez Mongo Express sur http://localhost:8081 et connectez-vous avec `admin` / `admin`.  
Vous pourrez lister les bases, parcourir les collections (`recipes_db.recipes`) et éditer les documents directement.

## Kubernetes
Des manifests prêts à l’emploi sont disponibles dans `k8s/`. Ils supposent l’existence d’un secret `backend-secret.yaml` (MONGO_URI) et d’un configmap pour les variables frontend.

Exemple de déploiement sur un cluster local `kind` :
```bash
kind create cluster --config k8s/kind-config.yaml
docker build -t recipes-backend:local ./backend
docker build -t recipes-frontend:local ./frontend
kind load docker-image recipes-backend:local
kind load docker-image recipes-frontend:local
kubectl apply -k k8s
kubectl get all -n recipes-app
```

**Automatisation** : un script est disponible pour exécuter ces étapes d’un coup :
```bash
./k8s/deploy-kind.sh
```
Variables utiles :
- `CLUSTER_NAME` : nom du cluster kind cible (défaut `recipes-kind`)
- `SKIP_BUILD=1` : réutilise des images déjà construites
- `SKIP_LOAD=1` : saute le chargement des images dans kind

Les services sont exposés via des NodePorts Kind :
- `http://127.0.0.1:30573/` → frontend
- `http://127.0.0.1:30800/api` → backend
- `http://127.0.0.1:30881/` → Mongo Express (UI)

Lorsque disponible, le script détecte automatiquement la première IP non-loopback (`hostname -I`). Déployé sur un VPS ? exportez `PUBLIC_HOST` avant d’exécuter le script (ex. `PUBLIC_HOST=$(curl -4 ifconfig.co) ./k8s/deploy-kind.sh`) pour que les URLs de sortie affichent directement l’adresse publique du serveur.

> Besoin d’un Ingress ? Le manifest `k8s/ingress.yaml` reste disponible mais n’est plus appliqué par défaut. Installez un contrôleur `ingress-nginx` (ou équivalent) et ajoutez ce fichier à `kustomization.yaml` si vous souhaitez gérer un domaine personnalisé.

## CI/CD (GitHub Actions)

Deux workflows résident dans `.github/workflows/` et sont abondamment commentés pour expliquer chaque étape.

| Workflow | Fichier | Déclencheurs | Description |
|----------|---------|--------------|-------------|
| Continuous Integration | `ci.yml` | `push` sur `main`, `pull_request` → `main` | Vérifie que le backend Python s’installe et que la compilation Vite passe. La commande `pytest` est lancée si un dossier `backend/tests/` est présent. |
| Continuous Deployment | `cd.yml` | Tags `v*`, déclenchement manuel | Construit et pousse deux images Docker (`recipes-backend`, `recipes-frontend`), puis applique les manifests Kubernetes et force le rollout sur le namespace `recipes-app`. |

### Secrets requis

Ajoutez les secrets GitHub suivants avant d’activer les workflows :

| Secret | Utilisation | Comment l’obtenir |
|--------|-------------|-------------------|
| `REGISTRY_USERNAME` | Connexion au registre Docker (`docker/login-action`). | Identifiant de votre compte (ex. GitHub → `${{ github.repository_owner }}`). |
| `REGISTRY_PASSWORD` | Mot de passe/token personnel pour le registre. | Token PAT (scope `write:packages` pour GHCR) ou mot de passe Docker Hub. |
| `KUBE_CONFIG` | Accès au cluster Kubernetes pour `kubectl`. | `cat ~/.kube/config | base64 -w0` et collez la valeur. |

> Astuce : si vous utilisez GHCR, pensez à cocher « Enable SSO » pour l’organisation visée après avoir créé le PAT.

### Personnalisation rapide
- Modifier la branche surveillée par la CI (`on.push.branches`) si nécessaire.
- Ajuster le registre (`REGISTRY`, `IMAGE_NAMESPACE`) dans `cd.yml`. Exemple Docker Hub : `REGISTRY: docker.io`, `IMAGE_NAMESPACE: mon-compte`.
- Adapter la commande de build frontend (p. ex. produire un bundle statique et servir via Nginx) en modifiant `frontend/Dockerfile` et la section correspondante du workflow CD.
- Adapter les noms des Deployments et namespace dans `k8s/` si vous changez la topologie du cluster.

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
- **Connexion impossible à Mongo local** : vérifiez que le service `mongo` est démarré (`docker compose ps`) et que l’URI inclut `authSource=admin` si vous utilisez les identifiants par défaut (`recipeadmin`/`recipepass`).
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
