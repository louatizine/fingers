# Docker Setup

This stack runs the HR Management frontend, Flask API, and MongoDB locally in the same shape you can later deploy in Portainer.

## Run Locally

```bash
docker compose up --build
```

Open the application at:

```text
http://localhost:9093
```

The API health endpoint is available at:

```text
http://localhost:5559/api/health
```

Default login created by the backend on first database startup:

```text
Email: admin@hrmanagement.com
Password: admin123
```

## Useful Commands

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

To remove the local MongoDB data volume too:

```bash
docker compose down -v
```

## Portainer + Nginx Proxy Manager

Use `docker-compose.portainer.yml` as the stack file (backend + frontend only — MongoDB Atlas in the cloud).

Ports are chosen to avoid conflicts with existing services on `192.168.100.19`:

| Service | Host port | Notes |
|---------|-----------|-------|
| `frontend` | **9093** | Only public port (same pattern as dynasign `9091`, dynafacturation `9092`) |
| `backend` | *(none)* | Internal only on `5559`, reached via frontend `/api` proxy |
| Registry | `5000` | Already used by `Registry-local` — image URL only, not app port |

**Nginx Proxy Manager** (`Nginx_Manager`) keeps ports 80/443/81.

### 1. Deploy the stack

Set production secrets and device/email values as Portainer environment variables:

```text
MONGO_URI
SECRET_KEY
JWT_SECRET_KEY
FRONTEND_URL
ZK_SYNC_ENABLED
ZK_DEVICE_IP
ZK_DEVICE_PORT
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM_EMAIL
```

`FRONTEND_URL` must match the public URL users open in the browser (e.g. `http://192.168.100.19` or `https://hr.yourdomain.com`).

### 2. Add a Proxy Host in NPM (http://192.168.100.19:81)

| Field | Value |
|-------|-------|
| Domain | `192.168.100.19` or your domain |
| Scheme | `http` |
| Forward hostname | `192.168.100.19` |
| Forward port | `9093` |

No separate `/api` rule is needed — the frontend container proxies `/api` to the backend internally.

Direct access (without NPM): `http://192.168.100.19:9093`

For local container testing, `ZK_SYNC_ENABLED` defaults to `false` so the backend can start without a reachable fingerprint terminal. Use the Attendance page sync button for manual imports, or set `ZK_SYNC_ENABLED=true` in Portainer when the container host can reach the device.
