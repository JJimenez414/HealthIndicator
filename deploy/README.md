# Pi deployment setup (one-time)

These steps prep the Pi so `.github/workflows/deploy.yml` can push builds to it on
every push to `main`. Run them once per Pi.

The `deploy` job runs directly on the Pi itself, via a self-hosted GitHub Actions
runner (already installed). `build-backend` and `build-frontend` run on
GitHub's cloud runners.

**Architecture:** the frontend and backend are each tunneled separately —
`health.jmzfinance.com` → the frontend, and a second Cloudflare Tunnel mapping
→ the backend (`localhost:8181`). Since the browser now makes a genuine
cross-origin request from the frontend's domain to the backend's domain,
both CORS (`WebConfig.java`) and `VITE_API_BASE_URL` (baked into the frontend
build) are required — not optional safety nets.

The two health-check services are registered as **system-level** systemd
units (in `/etc/systemd/system/`), matching how your other apps on this Pi
are set up.

## 1. Install Java 17 and Node's `serve` package

```bash
sudo apt update
sudo apt install openjdk-17-jre-headless
npm install -g serve   # requires Node/npm already on the Pi; no sudo needed
                        # if Node was installed as your user (e.g. via nvm)
```

Run `which serve` afterward and check the path matches what's in
`deploy/systemd/raspi-health-frontend.service`'s `ExecStart` — update the unit
file if it differs.

## 2. Create the app directory

```bash
mkdir -p ~/Documents/health-check
```

## 3. Allow passwordless sudo for just these two services

Since the deploy job runs as your normal user but needs `sudo` to install unit
files into `/etc/systemd/system/` and to restart them, add a scoped sudoers
rule (never edit `/etc/sudoers` directly — always go through `visudo` so a
syntax error can't lock you out of `sudo` entirely):

```bash
sudo visudo -f /etc/sudoers.d/health-check-deploy
```

Add:

```
jjimenez ALL=(ALL) NOPASSWD: /usr/bin/cp * /etc/systemd/system/*, /usr/bin/systemctl daemon-reload, /usr/bin/systemctl restart raspi-health-backend.service raspi-health-frontend.service
```

(Adjust the username if your self-hosted runner runs as a different user than
`jjimenez`.)

## 4. Create a second Cloudflare Tunnel mapping for the backend

Add an ingress rule (alongside the existing frontend one) routing a domain
to the backend directly, e.g.:

```yaml
ingress:
  - hostname: health.jmzfinance.com
    service: http://localhost:5174
  - hostname: api.jmzfinance.com
    service: http://localhost:8181
  - service: http_status:404
```

(Substitute whatever hostname you actually create — `api.jmzfinance.com` is
just an example.) Restart the tunnel after editing (`sudo systemctl restart
cloudflared`, or whatever the service is named on your setup).

## 5. Add a GitHub Actions repo variable

In the repo's Settings -> Secrets and variables -> Actions -> Variables:

- **Variable** `PI_API_BASE_URL` — the backend's new public tunnel address
  (e.g. `https://api.jmzfinance.com`), baked into the frontend build so it
  knows where to send API requests

## 6. Backend CORS

Already set in `backend/.../config/WebConfig.java`:
`allowedOrigins("http://localhost:5173", "https://health.jmzfinance.com")` —
this is genuinely required now (real cross-origin request), not just a
safety net. Update it if the frontend's domain ever changes.

## 7. One-time enable, after the first successful deploy

Once the first CI run has placed the unit files in `/etc/systemd/system/`,
enable them so they also start automatically on boot (CI's `restart` starts
them for that run, but doesn't mark them to auto-start after a reboot):

```bash
sudo systemctl daemon-reload
sudo systemctl enable raspi-health-backend.service raspi-health-frontend.service
```

## What happens after that

Every push to `main` triggers `.github/workflows/deploy.yml`, which:
1. Builds the backend jar (Java 17 + Maven) on a GitHub-hosted runner
2. Builds the frontend (`npm run build`, with `VITE_API_BASE_URL` baked in) on
   a GitHub-hosted runner
3. Deploy job runs on the Pi itself (self-hosted runner): copies both build
   artifacts into `~/Documents/health-check`, and the systemd unit files into
   `/etc/systemd/system/` (via the scoped passwordless-sudo rule)
4. Runs `sudo systemctl restart` for both services

Ports: backend on `8181`, frontend on `5174` (from the `serve` unit's `-l`
flag) — each mapped to its own public hostname via Cloudflare Tunnel.
