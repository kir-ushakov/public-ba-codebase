#!/usr/bin/env bash
# Copy /etc/letsencrypt/live/<domain> into nginx paths and reload if files changed.
#
# Source (renewed by Hysteria / certbot):
#   /etc/letsencrypt/live/brainassistant.app/fullchain.pem
#   /etc/letsencrypt/live/brainassistant.app/privkey.pem
#
# Destinations:
#   ./nginx/ssl/brainassistant.app.{crt,key}  — Docker nginx + backend
#   /etc/nginx/ssl/brainassistant.app.{crt,key} — host nginx (if directory exists)
#
# Does not request or renew certificates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOMAIN="${CERTBOT_DOMAIN:-brainassistant.app}"
LIVE="/etc/letsencrypt/live/$DOMAIN"
HOST_SSL_DIR="${HOST_SSL_DIR:-/etc/nginx/ssl}"
changed=0

if [[ ! -r "$LIVE/fullchain.pem" || ! -r "$LIVE/privkey.pem" ]]; then
  echo "Certificate not found or not readable: $LIVE"
  echo "Check: sudo certbot certificates"
  exit 1
fi

install_if_changed() {
  local src="$1" dest="$2" as_root="${3:-0}"
  if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
    return 0
  fi
  if [[ "$as_root" == "1" ]]; then
    sudo cp -L "$src" "$dest"
    sudo chmod 644 "$dest"
  else
    cp -L "$src" "$dest"
    chmod 644 "$dest"
  fi
  changed=1
}

mkdir -p "$ROOT/nginx/ssl"
install_if_changed "$LIVE/fullchain.pem" "$ROOT/nginx/ssl/$DOMAIN.crt"
install_if_changed "$LIVE/privkey.pem" "$ROOT/nginx/ssl/$DOMAIN.key"

if [[ -d "$HOST_SSL_DIR" ]]; then
  install_if_changed "$LIVE/fullchain.pem" "$HOST_SSL_DIR/$DOMAIN.crt" 1
  install_if_changed "$LIVE/privkey.pem" "$HOST_SSL_DIR/$DOMAIN.key" 1
fi

if [[ "$changed" -eq 0 ]]; then
  echo "Certificate unchanged; nothing to reload."
  exit 0
fi

echo "Certificate updated."

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo nginx -s reload
fi

COMPOSE=(docker compose -f "$ROOT/docker-compose.yml" -f "$ROOT/production.yml")

if "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx nginx; then
  "${COMPOSE[@]}" exec -T nginx nginx -s reload
fi

if "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx backend; then
  "${COMPOSE[@]}" restart backend
fi
