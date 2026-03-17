#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/simstock"
APP_USER="${SUDO_USER:-$USER}"

sudo apt update
sudo apt install -y nginx curl build-essential sqlite3

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo npm install -g pm2

sudo mkdir -p "$APP_DIR"
sudo chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "Bootstrap base concluido. Coloca o projeto em $APP_DIR e segue o guia HOSTINGER_VPS_DEPLOY.md"
