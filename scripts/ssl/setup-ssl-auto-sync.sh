#!/usr/bin/env bash
# One-time setup: auto-run sync-ssl-cert.sh when the certificate may have changed.
#
# 1. certbot deploy hook — runs sync-ssl-cert.sh after each successful "certbot renew"
# 2. cron (03:00, 15:00) — fallback when Hysteria renews without certbot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SYNC="$ROOT/scripts/ssl/sync-ssl-cert.sh"
HOOK="/etc/letsencrypt/renewal-hooks/deploy/brainassistant-sync-ssl-cert.sh"
CRON_LINE="0 3,15 * * * $SYNC >> /var/log/ssl-cert-sync.log 2>&1"

if [[ ! -x "$SYNC" ]]; then
  echo "Not found or not executable: $SYNC"
  exit 1
fi

if [[ -d /etc/letsencrypt ]]; then
  sudo mkdir -p "$(dirname "$HOOK")"
  sudo tee "$HOOK" >/dev/null <<EOF
#!/usr/bin/env bash
exec "$SYNC"
EOF
  sudo chmod +x "$HOOK"
  echo "Installed certbot hook: $HOOK"
fi

if crontab -l 2>/dev/null | grep -F "$SYNC" >/dev/null; then
  echo "Cron already installed."
else
  (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
  echo "Installed cron: $CRON_LINE"
fi
