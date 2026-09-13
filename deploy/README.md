# Pi deployment setup (one-time)

These steps prep the Pi so `.github/workflows/deploy.yml` can push builds to it on
every push to `main`. Run them once per Pi.

The `deploy` job runs directly on the Pi itself, via a self-hosted GitHub Actions
runner (already installed). Only `build-backend` and `build-frontend` run on
GitHub's cloud runners.

The two health-check services are registered as **system-level** systemd units
(in `/etc/systemd/system/`), matching how your other apps on this Pi are set
up — consistent with the passwordless-sudo pattern your other pipelines
already use.

## 1. Install Java 17 and Node's `serve` package

```bash
sudo apt update
sudo apt install openjdk-17-jre-headless
npm install -g serve   # requires Node/npm already on the Pi; no sudo needed
                        # if Node was installed as your user (e.g. via nvm)
```

Run `which serve` afterward and check the path matches what's in
`deploy/systemd/raspi-health-frontend.service`'s `ExecStart` — update the unit
file if it differs (npm global installs without sudo often land somewhere a
system-level service can't find via its default `PATH`).

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

## 4. Add a GitHub Actions repo variable

In the repo's Settings -> Secrets and variables -> Actions -> Variables:

- **Variable** `PI_API_BASE_URL` — e.g. `http://raspberrypi.local:8080`, baked
  into the frontend build (which happens on GitHub's cloud runner) so it
  knows where to find the backend once deployed

## 5. Update backend CORS to allow the Pi's frontend origin

In `backend/.../config/WebConfig.java`, add the Pi's real frontend address
(port 4173, per the `serve` unit) to `allowedOrigins(...)`, alongside
`localhost:5173` for local dev.

## 6. One-time enable, after the first successful deploy

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

Ports: backend on `8080`, frontend on `4173` (from the `serve` unit's `-l` flag).
