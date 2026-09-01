#!/usr/bin/env bash
# One-time setup: auto-run sync-ssl-cert.sh when the certificate may have changed.
#
# 1. certbot deploy hook — runs sync-ssl-cert.sh after each successful "certbot renew"
# 2. cron (03:00, 15:00) — optional fallback when Hysteria renews without certbot
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

if command -v systemctl >/dev/null 2>&1 && systemctl is-enabled certbot.timer >/dev/null 2>&1; then
  echo "certbot.timer is enabled — renewals will trigger the hook above."
elif command -v crontab >/dev/null 2>&1; then
  if crontab -l 2>/dev/null | grep -F "$SYNC" >/dev/null; then
    echo "Cron already installed."
  else
    (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
    echo "Installed cron: $CRON_LINE"
  fi
else
  echo "No crontab on this system — skipped cron fallback."
  echo "The certbot hook above is enough if renewals go through certbot."
  echo "If Hysteria renews alone, run sync manually or install cron."
fi
