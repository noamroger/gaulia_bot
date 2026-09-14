#!/usr/bin/env bash
# Installe le déploiement automatique (service + timer systemd) d'une instance. À lancer une fois
# depuis la racine du dépôt cloné sur le serveur, placé sur la branche à suivre :
#   production (~/gaulia_bot, branche main) : sudo bash deploy/install.sh
#   test (~/gaulia_test, branche dev)       : sudo bash deploy/install.sh gaulia-test-deploy
# L'argument est le nom des unités systemd (gaulia-deploy par défaut). Le service tourne sous
# l'utilisateur propriétaire du dossier.
set -Eeuo pipefail

fail() {
  echo "$*" >&2
  exit 1
}

[[ $EUID -eq 0 ]] || fail "Lance ce script avec sudo : sudo bash deploy/install.sh [nom-des-unités]"

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
run_user="$(stat -c %U "$repo_dir")"
unit="${1:-gaulia-deploy}"

[[ "$unit" =~ ^[a-z0-9][a-z0-9-]*$ ]] || fail "Nom d'unité invalide : $unit (minuscules, chiffres et tirets)."

for cmd in git docker flock systemctl; do
  command -v "$cmd" >/dev/null || fail "Commande manquante : $cmd"
done
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 (« docker compose ») est requis."
[[ -d "$repo_dir/.git" ]] || fail "$repo_dir n'est pas un dépôt git."
[[ -f "$repo_dir/.env" ]] || fail "$repo_dir/.env est introuvable."

if [[ "$run_user" != "root" ]] && ! id -nG "$run_user" | tr ' ' '\n' | grep -qx docker; then
  fail "L'utilisateur $run_user doit être dans le groupe docker : sudo usermod -aG docker $run_user"
fi

branch="$(git -c safe.directory="$repo_dir" -C "$repo_dir" symbolic-ref --quiet --short HEAD || true)"
[[ -n "$branch" ]] || fail "$repo_dir doit être placé sur une branche (ex : git checkout dev)."

project="$(sed -n 's/^[[:space:]]*COMPOSE_PROJECT_NAME[[:space:]]*=//p' "$repo_dir/.env" | tail -n 1 |
  tr -d "\"'\r" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
if [[ "$branch" != "main" && (-z "$project" || "$project" == "gaulia_bot") ]]; then
  fail "Définis COMPOSE_PROJECT_NAME (différent de gaulia_bot) dans $repo_dir/.env : sinon cette instance remplacerait la production."
fi

sed -e "s|@REPO_DIR@|$repo_dir|g" -e "s|@RUN_USER@|$run_user|g" \
  "$repo_dir/deploy/gaulia-deploy.service" >"/etc/systemd/system/$unit.service"
install -m 644 "$repo_dir/deploy/gaulia-deploy.timer" "/etc/systemd/system/$unit.timer"

systemctl daemon-reload
systemctl enable --now "$unit.timer"

echo "Déploiement automatique installé : $repo_dir, branche $branch, projet ${project:-gaulia_bot}, utilisateur $run_user."
echo "Suivi : journalctl -u $unit.service -f"
