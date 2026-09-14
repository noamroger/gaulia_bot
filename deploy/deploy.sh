#!/usr/bin/env bash
# Déploiement automatique : lancé chaque minute par le timer systemd de l'instance (voir
# deploy/install.sh). Suit la branche sur laquelle le dossier est placé (main en production, dev pour
# l'instance de test) : aligne le dossier sur origin/<branche>, puis reconstruit la stack. Les anciens
# conteneurs tournent pendant le build et seuls les services modifiés sont recréés. Les données
# Postgres (volume nommé) et le .env (ignoré par git) ne sont jamais touchés.
#
# Usage manuel : bash deploy/deploy.sh [--force]   (--force redéploie même sans nouveau commit)
set -Eeuo pipefail

# Tout le script est dans main() : bash le lit en entier avant de l'exécuter, ce qui permet au
# `git reset` de remplacer ce fichier en cours de route sans casser l'exécution.
main() {
  local repo_dir branch force target last_attempt project
  repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  cd "$repo_dir"

  branch="${DEPLOY_BRANCH:-$(git symbolic-ref --quiet --short HEAD || true)}"
  if [[ -z "$branch" ]]; then
    log "Le dossier $repo_dir n'est sur aucune branche : déploiement annulé."
    return 1
  fi

  force=false
  [[ "${1:-}" == "--force" ]] && force=true

  if [[ ! -f .env ]]; then
    log "Fichier .env introuvable dans $repo_dir : déploiement annulé."
    return 1
  fi

  # Sans nom de projet propre, une instance hors production reprendrait les conteneurs et la base
  # de données de la production (projet gaulia_bot par défaut).
  project="$(env_value COMPOSE_PROJECT_NAME)"
  if [[ "$branch" != "main" && (-z "$project" || "$project" == "gaulia_bot") ]]; then
    log "COMPOSE_PROJECT_NAME doit être défini dans .env (et différent de gaulia_bot) pour déployer la branche $branch : déploiement annulé."
    return 1
  fi

  exec 9>".git/gaulia-deploy.lock"
  if ! flock -n 9; then
    log "Un déploiement est déjà en cours."
    return 0
  fi

  git fetch --quiet origin "$branch"
  target="$(git rev-parse "origin/$branch")"
  last_attempt="$(cat .git/gaulia-deploy-last 2>/dev/null || true)"

  if [[ "$force" == false && "$target" == "$last_attempt" ]]; then
    return 0
  fi

  log "Déploiement de ${target:0:7} ($branch) : $(git log -1 --format=%s "$target")"
  # Enregistré avant le build : un commit qui échoue n'est pas retenté chaque minute.
  echo "$target" >.git/gaulia-deploy-last

  git reset --hard --quiet "$target"
  git clean -fd --quiet

  docker compose up -d --build --remove-orphans
  docker image prune -f >/dev/null
  docker builder prune -f --filter "until=168h" >/dev/null

  log "Déploiement de ${target:0:7} terminé."
}

log() {
  printf '%s\n' "$*"
}

# Dernière valeur d'une variable du .env, sans guillemets ni espaces autour.
env_value() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=//p" .env | tail -n 1 | tr -d "\"'\r" |
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

trap 'log "Échec du déploiement (ligne $LINENO). Relance après correction : bash deploy/deploy.sh --force"' ERR

main "$@"
exit
