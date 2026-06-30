# Quick Start Guide - Fingerprint Attendance System

## 🚀 5-Minute Setup

### Prerequisites Checklist
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] MongoDB (local or Atlas)
- [ ] ZKTeco K80 (or similar) on the same network as the backend server

---

## Step 1: Backend Setup (2 minutes)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `ZK_DEVICE_IP` — IP address of your ZKTeco terminal (default port `4370`)

```bash
python app.py
```

✅ Backend running on http://localhost:5000  
✅ **Auto-sync** pulls employees + attendance from the ZKTeco device every 5 minutes (configurable via `ZK_SYNC_INTERVAL_MINUTES`)

---

## Step 2: Frontend Setup (1 minute)

```bash
cd frontend
npm install
echo VITE_API_URL=http://localhost:5000/api > .env
npm run dev
```

✅ Frontend running on http://localhost:5173

---

## ZKTeco Device Sync

| Setting | Description |
|---------|-------------|
| `ZK_DEVICE_IP` | Device IP on your LAN |
| `ZK_DEVICE_PORT` | Usually `4370` |
| `ZK_SYNC_ENABLED` | `true` to enable background sync |
| `ZK_SYNC_INTERVAL_MINUTES` | How often to sync (default `5`) |

**Manual sync:** Attendance page → **Sync from Device** (admin only)

Auto-sync also runs in the background when `ZK_SYNC_ENABLED=true`.

### Enrolling fingerprints (without desktop app)

Enroll employees on the **ZKTeco device** using ZKTeco official software or the device screen. The backend sync will:
1. Import users from the device into MongoDB
2. Import all attendance punches
3. Display them on the **Attendance** page

---

## First Use

1. Login to the web app (http://localhost:5173)
2. Ensure the ZKTeco device is reachable from the server (`ZK_DEVICE_IP`)
3. Wait for auto-sync (~10s after backend start, then every N minutes) or click **Sync Device** on Attendance
4. View attendance logs, summaries, and exports

---

## Common Issues

### "Failed to connect to device"
- Verify `ZK_DEVICE_IP` in `.env`
- Ping the device from the same machine running the backend
- Check firewall / same subnet; port `4370` must be open

### "Backend Connection Failed" (frontend)
- Backend must run on http://localhost:5000
- Check `VITE_API_URL` in `frontend/.env`

### No attendance records
- Employees must be enrolled on the ZKTeco device first
- Use **Sync from Device** on the Attendance page (admin) and check backend logs
- Confirm users exist in MongoDB with matching `device_user_id` / `biometric_id`

---

## Next Steps

1. Adjust `ZK_SYNC_INTERVAL_MINUTES` for your needs (e.g. `1` for near-real-time)
2. Configure production MongoDB and deploy backend where it can reach the device LAN
3. Review security settings and admin accounts
