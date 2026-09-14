#!/usr/bin/env bash
# Déploiement automatique : lancé chaque minute par gaulia-deploy.timer (installé via deploy/install.sh).
# Aligne le dossier sur origin/<branche>, puis reconstruit la stack : les anciens conteneurs tournent
# pendant le build et seuls les services modifiés sont recréés. Les données Postgres (volume nommé) et
# le .env (ignoré par git) ne sont jamais touchés.
#
# Usage manuel : bash deploy/deploy.sh [--force]   (--force redéploie même sans nouveau commit)
set -Eeuo pipefail

# Tout le script est dans main() : bash le lit en entier avant de l'exécuter, ce qui permet au
# `git reset` de remplacer ce fichier en cours de route sans casser l'exécution.
main() {
  local repo_dir branch force target last_attempt
  repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  branch="${DEPLOY_BRANCH:-main}"
  force=false
  [[ "${1:-}" == "--force" ]] && force=true
  cd "$repo_dir"

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

  if [[ ! -f .env ]]; then
    log "Fichier .env introuvable dans $repo_dir : déploiement annulé."
    return 1
  fi

  log "Déploiement de ${target:0:7} : $(git log -1 --format=%s "$target")"
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

trap 'log "Échec du déploiement (ligne $LINENO). Relance après correction : bash deploy/deploy.sh --force"' ERR

main "$@"
exit
