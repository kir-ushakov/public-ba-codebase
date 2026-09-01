# SSL for brainassistant.app

Hysteria / certbot already renew the certificate in:

```
/etc/letsencrypt/live/www.brainassistant.app/
```

Certbot names the folder after the **Certificate Name** (`www.brainassistant.app`), not the apex domain. The sync script copies files into `brainassistant.app.{crt,key}` — paths nginx already uses.

## Architecture

```
Internet :443  →  host nginx (/etc/nginx/ssl/brainassistant.app.crt)
                      ↓ proxy_pass
                  127.0.0.1:543  →  Docker nginx (nginx/ssl/brainassistant.app.crt)
                                        ↓
                                    backend (reads same files via volume)
```

## Scripts

### `sync-ssl-cert.sh`

Syncs `fullchain.pem` / `privkey.pem` from Let's Encrypt into:

- `nginx/ssl/brainassistant.app.{crt,key}` — project / Docker
- `/etc/nginx/ssl/brainassistant.app.{crt,key}` — host nginx

Reloads host nginx, Docker nginx, and backend **only if files actually changed**.

```bash
./scripts/ssl/sync-ssl-cert.sh
```

### `setup-ssl-auto-sync.sh`

Run **once** on the server:

- **certbot hook** — after `certbot renew` updates any certificate
- **cron** at 03:00 and 15:00 — catches renewals done by Hysteria alone

```bash
./scripts/ssl/setup-ssl-auto-sync.sh
```

## First-time on server

```bash
./scripts/ssl/sync-ssl-cert.sh
./scripts/ssl/setup-ssl-auto-sync.sh
```

Verify:

```bash
sudo certbot certificates
curl -I https://brainassistant.app
```
