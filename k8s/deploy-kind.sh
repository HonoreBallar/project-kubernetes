#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${ROOT_DIR}/k8s"
CLUSTER_NAME="${CLUSTER_NAME:-recipes-kind}"
KIND_CONFIG="${KIND_CONFIG:-${K8S_DIR}/kind-config.yaml}"
BACKEND_IMAGE="${BACKEND_IMAGE:-recipes-backend:local}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-recipes-frontend:local}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Commande requise manquante : $1" >&2
    exit 1
  fi
}

info() {
  echo "👉 $*"
}

require_cmd docker
require_cmd kind
require_cmd kubectl

if [[ ! -f "${KIND_CONFIG}" ]]; then
  echo "❌ Fichier de configuration kind introuvable : ${KIND_CONFIG}" >&2
  exit 1
fi

cd "${ROOT_DIR}"

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  info "Build de l'image backend (${BACKEND_IMAGE})"
  docker build -t "${BACKEND_IMAGE}" ./backend

  info "Build de l'image frontend (${FRONTEND_IMAGE})"
  docker build -t "${FRONTEND_IMAGE}" ./frontend
else
  info "Build des images ignoré (SKIP_BUILD=1)"
fi

if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
  info "Création du cluster kind (${CLUSTER_NAME})"
  kind create cluster --name "${CLUSTER_NAME}" --config "${KIND_CONFIG}"
else
  info "Cluster kind ${CLUSTER_NAME} déjà présent"
fi

if [[ "${SKIP_LOAD:-0}" != "1" ]]; then
  info "Chargement des images dans kind"
  kind load docker-image "${BACKEND_IMAGE}" --name "${CLUSTER_NAME}"
  kind load docker-image "${FRONTEND_IMAGE}" --name "${CLUSTER_NAME}"
else
  info "Chargement des images ignoré (SKIP_LOAD=1)"
fi

info "Déploiement des manifests Kubernetes"
kubectl apply -k "${K8S_DIR}"

info "Ressources déployées dans le namespace recipes-app :"
kubectl get pods,svc,ingress -n recipes-app

cat <<'EOT'

✅ Déploiement terminé.
- Frontend : http://127.0.0.1:30573/
- API      : http://127.0.0.1:30800/docs
- Mongo UI : http://127.0.0.1:30881/

Utilisez les NodePorts exposés par Kind ci-dessus pour accéder aux services.
EOT
