# Docker Setup

This stack runs the HR Management frontend, Flask API, and MongoDB locally in the same shape you can later deploy in Portainer.

## Run Locally

```bash
docker compose up --build
```

Open the application at:

```text
http://localhost:8080
```

The API health endpoint is available at:

```text
http://localhost:5000/api/health
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

## Portainer Notes

Use `docker-compose.yml` as the stack file. Set production secrets and device/email values as Portainer environment variables:

```text
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

For local container testing, `ZK_SYNC_ENABLED` defaults to `false` so the backend can start without a reachable fingerprint terminal. Use the Attendance page sync button for manual imports, or set `ZK_SYNC_ENABLED=true` in Portainer when the container host can reach the device.
