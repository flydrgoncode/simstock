# SimStock on Hostinger VPS (Ubuntu)

## Chosen path

Use:

- Node.js directly on Ubuntu
- PM2 for process management
- Nginx as reverse proxy

Do not use Docker for now.

Why:

- the app currently uses `better-sqlite3`
- SQLite file persistence is simpler without container volume work
- faster path to production on a VPS
- easier debugging for a single-app machine

## Expected server stack

- Ubuntu
- Node.js 22
- npm
- PM2
- Nginx
- SQLite

## Production requirements

Before going live, production must have:

- a real domain
- HTTPS
- `AUTH_BASE_URL` set to the public URL
- `AUTH_EMAIL_FROM` configured
- `RESEND_API_KEY` configured

In production, SimStock will not expose local magic-link previews if email delivery is not configured.

## Files added for VPS deploy

- `/Users/ruipereira/Documents/New project/simstock/ecosystem.config.cjs`
- `/Users/ruipereira/Documents/New project/simstock/.env.production.example`
- `/Users/ruipereira/Documents/New project/simstock/deploy/hostinger-nginx.conf`
- `/Users/ruipereira/Documents/New project/simstock/deploy/hostinger-bootstrap.sh`

## Initial bootstrap on the VPS

After copying the repo to the server:

```bash
cd /var/www/simstock
bash deploy/hostinger-bootstrap.sh
```

## Deploy flow

### 1. Copy the app to the VPS

Recommended target:

```bash
/var/www/simstock
```

### 2. Install dependencies

```bash
cd /var/www/simstock
npm ci
```

### 3. Create the production env file

```bash
cp .env.production.example .env.production
```

Edit:

- `AUTH_BASE_URL`
- `AUTH_EMAIL_FROM`
- `RESEND_API_KEY`

### 4. Build

```bash
npm run build
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 6. Configure Nginx

Copy the sample:

```bash
sudo cp deploy/hostinger-nginx.conf /etc/nginx/sites-available/simstock
```

Edit the domain:

- change `simstock.example.com` to the real hostname

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/simstock /etc/nginx/sites-enabled/simstock
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Add HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d simstock.example.com
```

## Runtime management

```bash
pm2 status
pm2 logs simstock
pm2 restart simstock
pm2 stop simstock
```

## Update flow

```bash
cd /var/www/simstock
git pull
npm ci
npm run build
pm2 restart simstock
```

## Notes

- database files stay in `data/`
- keep regular backups of `data/simstock.db`
- this is the recommended production path right now
- Cloudflare migration remains a separate track
