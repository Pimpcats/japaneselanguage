# Hosting Hanasou on your Debian 12 VPS

This serves the app over HTTPS and adds cross-device progress sync.
Architecture: **Caddy** (auto-HTTPS, serves the static app, proxies `/api/*`)
→ **Node** sync service on `127.0.0.1:8787` → progress stored in one JSON file.

Replace `nihongo.example.com` everywhere with your real subdomain.

---

## 1. Point DNS at the VPS

In your domain's DNS, add an **A record**:

```
nihongo   ->   <your VPS public IP>
```

Wait for it to resolve (`ping nihongo.example.com` should show the VPS IP).

## 2. Install Node.js and Caddy

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Caddy (official repo)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

## 3. Get the app onto the server

```bash
sudo git clone https://github.com/Pimpcats/japaneselanguage.git /opt/hanasou
cd /opt/hanasou
# use the branch we've been building on:
sudo git checkout claude/amazing-cannon-PPvmw
```

(Later, to update: `cd /opt/hanasou && sudo git pull`.)

## 4. Generate a sync token

```bash
openssl rand -hex 24
```

Copy the output — that's your secret token.

## 5. Install the sync service

```bash
sudo cp /opt/hanasou/deploy/hanasou-api.service /etc/systemd/system/
sudo nano /etc/systemd/system/hanasou-api.service   # paste your token into HANASOU_TOKEN=

# let the service user own the data dir
sudo mkdir -p /opt/hanasou/server/data
sudo chown -R www-data:www-data /opt/hanasou/server/data

sudo systemctl daemon-reload
sudo systemctl enable --now hanasou-api
sudo systemctl status hanasou-api        # should be "active (running)"
```

## 6. Configure Caddy

```bash
sudo cp /opt/hanasou/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile           # change nihongo.example.com -> your subdomain
sudo systemctl reload caddy
```

Caddy will fetch an HTTPS certificate automatically (give it ~30s the first time).

## 7. Open it and turn on sync

1. Visit `https://nihongo.example.com` — the app should load.
2. Tap **set up sync** in the footer, paste your token (same one from step 4).
3. It pulls/pushes from then on. Enter the same token on any other device to sync.

---

### Notes / troubleshooting

- **Firewall:** make sure ports 80 and 443 are open (`sudo ufw allow 80,443/tcp` if you use ufw). Port 80 is needed for the HTTPS cert challenge.
- **Logs:** `journalctl -u hanasou-api -f` (API) and `journalctl -u caddy -f` (Caddy).
- **Your data lives in** `/opt/hanasou/server/data/progress.json` — back that file up if you care about it.
- **The token is a shared secret.** Anyone who has it can read/write your progress. Keep it private; rotate by changing it in the service file and re-entering it in the app.
- **Disconnecting a device:** clear the site's localStorage in that browser (or we can add an explicit "turn off sync" button — just ask).
