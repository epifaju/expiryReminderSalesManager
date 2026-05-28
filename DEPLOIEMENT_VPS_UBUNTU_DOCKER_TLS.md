# Déploiement production sur VPS (Ubuntu 24.04) — Docker + Nginx + Let’s Encrypt

Ce guide décrit une installation **production** complète, en supposant :

- **VPS**: Ubuntu 24.04 LTS
- **API**: Spring Boot dans un **conteneur Docker**
- **DB**: PostgreSQL dans un **conteneur Docker** (volume persistant)
- **Reverse proxy**: Nginx dans un **conteneur Docker**
- **TLS**: Let’s Encrypt (gratuit) via **certbot** (conteneur) + renouvellement automatique
- **Auto-start**: `systemd` pilote `docker compose`
- **Logs**: `docker compose logs` + rotation `json-file`

> Exemple de domaine dans ce guide : **`api.mondomaine.com`**  
> Let’s Encrypt nécessite un **vrai domaine** pointant vers votre VPS (A/AAAA).

---

## 1) Pré-requis (VPS)

Mettre à jour et installer les utilitaires :

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg ufw
```

Vérifier Docker + Compose :

```bash
docker --version
docker compose version
```

Pare-feu (ouvrir SSH/HTTP/HTTPS) :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## 2) Arborescence recommandée

```bash
sudo mkdir -p /opt/expiryreminder/nginx/conf.d
sudo mkdir -p /opt/expiryreminder/nginx/www
sudo mkdir -p /opt/expiryreminder/nginx/logs
sudo mkdir -p /opt/expiryreminder/letsencrypt
sudo chown -R $USER:$USER /opt/expiryreminder
cd /opt/expiryreminder
```

---

## 3) Fichier `.env` (secrets + paramètres)

Créer `/opt/expiryreminder/.env` :

```env
DOMAIN=api.mondomaine.com
LE_EMAIL=admin@mondomaine.com

DB_NAME=salesmanager
DB_USERNAME=salesmanager
DB_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=CHANGE_ME_LONG_RANDOM

# Image de votre API (ex: GHCR/DockerHub)
API_IMAGE=ghcr.io/<org>/<repo>:latest
```

Bonnes pratiques :
- `DB_PASSWORD` et `JWT_SECRET` doivent être **forts** et **secrets**.
- Ne commitez jamais ce fichier.

---

## 4) `docker-compose` production

Créer `/opt/expiryreminder/docker-compose.prod.yml` :

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 30
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  api:
    image: ${API_IMAGE}
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    expose:
      - "8082"
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/www:/var/www/certbot:ro
      - ./letsencrypt:/etc/letsencrypt:ro
      - ./nginx/logs:/var/log/nginx
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  certbot:
    image: certbot/certbot:v2.11.0
    volumes:
      - ./letsencrypt:/etc/letsencrypt
      - ./nginx/www:/var/www/certbot
    entrypoint: /bin/sh -c
    command: >
      "trap exit TERM;
       while :; do
         certbot renew --webroot -w /var/www/certbot --quiet;
         sleep 12h;
       done"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: \"10m\"
        max-file: \"5\"

volumes:
  pgdata:
```

Notes :
- PostgreSQL **n’expose pas** de port vers Internet (bonne pratique).
- Nginx publie uniquement **80/443**.

---

## 5) Nginx — phase 1 (HTTP + Let’s Encrypt challenge)

Créer `/opt/expiryreminder/nginx/conf.d/api.conf` :

```nginx
server {
  listen 80;
  server_name api.mondomaine.com;

  # Let’s Encrypt HTTP-01 challenge
  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  client_max_body_size 20m;

  location / {
    proxy_pass http://api:8082;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }
}
```

Démarrer le stack (sans certbot en continu pour l’instant) :

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml up -d postgres api nginx
docker compose -f docker-compose.prod.yml ps
```

---

## 6) Obtenir le certificat Let’s Encrypt (quand DNS prêt)

### Prérequis obligatoires
- Enregistrement DNS :
  - **A**: `api.mondomaine.com` → **IP publique IPv4** du VPS
  - (optionnel) **AAAA** si vous utilisez IPv6
- Les ports **80** et **443** doivent être accessibles depuis Internet

### Commande one-shot (certificat)

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d api.mondomaine.com \
  --email admin@mondomaine.com \
  --agree-tos --no-eff-email
```

Les fichiers seront créés dans `/opt/expiryreminder/letsencrypt/live/api.mondomaine.com/`.

---

## 7) Nginx — phase 2 (HTTPS + redirect)

Modifier `/opt/expiryreminder/nginx/conf.d/api.conf` :

```nginx
server {
  listen 80;
  server_name api.mondomaine.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name api.mondomaine.com;

  ssl_certificate     /etc/letsencrypt/live/api.mondomaine.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.mondomaine.com/privkey.pem;

  client_max_body_size 20m;

  location / {
    proxy_pass http://api:8082;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }
}
```

Redémarrer Nginx :

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml up -d nginx
```

Activer certbot en renouvellement automatique (daemon) :

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml up -d certbot
```

> Conseil: après un renouvellement, Nginx n’a généralement pas besoin de restart (les certs sont relus au reload).  
> Si vous voulez être strict, vous pouvez planifier un `docker exec nginx nginx -s reload`.

---

## 8) Démarrage automatique au reboot (systemd)

Créer `/etc/systemd/system/expiryreminder.service` :

```ini
[Unit]
Description=ExpiryReminder stack (docker compose)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/expiryreminder
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
RemainAfterExit=yes
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Activer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now expiryreminder
sudo systemctl status expiryreminder
```

---

## 9) Logs & diagnostic

Logs live :

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres
```

Logs systemd :

```bash
journalctl -u expiryreminder -f
```

Rotation des logs Docker :
- configurée via `json-file` (`max-size` / `max-file`) dans le compose.

---

## 10) Mise à jour de l’API (rolling simple)

```bash
cd /opt/expiryreminder
docker compose -f docker-compose.prod.yml pull api
docker compose -f docker-compose.prod.yml up -d api
```

---

## 11) Checklist production minimale

- **Ne pas exposer PostgreSQL** publiquement
- Secrets forts (`DB_PASSWORD`, `JWT_SECRET`)
- Sauvegardes DB (cron `pg_dump` vers stockage externe)
- Surveillance disque (`df -h`) et logs
- Un reverse proxy TLS (Nginx + Let’s Encrypt)

