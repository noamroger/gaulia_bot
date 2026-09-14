#!/usr/bin/env bash
# Installe le déploiement automatique (service + timer systemd). À lancer une fois depuis la racine
# du dépôt sur le serveur : sudo bash deploy/install.sh
# Le service tourne sous l'utilisateur propriétaire du dossier.
set -Eeuo pipefail

fail() {
  echo "$*" >&2
  exit 1
}

[[ $EUID -eq 0 ]] || fail "Lance ce script avec sudo : sudo bash deploy/install.sh"

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
run_user="$(stat -c %U "$repo_dir")"

for cmd in git docker flock systemctl; do
  command -v "$cmd" >/dev/null || fail "Commande manquante : $cmd"
done
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 (« docker compose ») est requis."
[[ -d "$repo_dir/.git" ]] || fail "$repo_dir n'est pas un dépôt git."
[[ -f "$repo_dir/.env" ]] || fail "$repo_dir/.env est introuvable."

if [[ "$run_user" != "root" ]] && ! id -nG "$run_user" | tr ' ' '\n' | grep -qx docker; then
  fail "L'utilisateur $run_user doit être dans le groupe docker : sudo usermod -aG docker $run_user"
fi

sed -e "s|@REPO_DIR@|$repo_dir|g" -e "s|@RUN_USER@|$run_user|g" \
  "$repo_dir/deploy/gaulia-deploy.service" >/etc/systemd/system/gaulia-deploy.service
install -m 644 "$repo_dir/deploy/gaulia-deploy.timer" /etc/systemd/system/gaulia-deploy.timer

systemctl daemon-reload
systemctl enable --now gaulia-deploy.timer

echo "Déploiement automatique installé pour $repo_dir (utilisateur : $run_user)."
echo "Suivi : journalctl -u gaulia-deploy.service -f"
