# HR Management System - Running Guide

## 📦 System Components

This system consists of **4 services**:
1. **Backend API** (Flask) - Port 5000
2. **Frontend Web** (React) - Port 3001
3. **Fingerprint Web Service** (.NET) - Port 5001
4. **Desktop Admin UI** (WPF) - Standalone application

---

## 🚀 Quick Start (All Services)

### Prerequisites
- Python 3.8+ with virtual environment
- Node.js 16+
- .NET 7 SDK
- MongoDB (local or Atlas)

### Start All Services

**1. Backend API (Terminal 1)**
```bash
cd D:/Employees_Managements
source .venv/Scripts/activate
cd backend
python app.py
```
✅ Running on: `http://localhost:5000`

**2. Frontend Web (Terminal 2)**
```bash
cd D:/Employees_Managements/frontend
npm run dev
```
✅ Running on: `http://localhost:3001`

**3. Fingerprint Service (Terminal 3)**
```bash
cd D:/Employees_Managements/desktop/FingerprintWebService
dotnet run
```
✅ Running on: `http://localhost:5001`

**4. Desktop Admin UI (Terminal 4 or double-click exe)**
```bash
cd D:/Employees_Managements/desktop/Fingerprint.AdminUI
dotnet run
# OR
./bin/Release/net7.0-windows/Fingerprint.AdminUI.exe
```
✅ Opens WPF window

---

## 📋 Service Details

### 1️⃣ Backend API (Flask - Python)

**Purpose:** REST API for all business logic, database operations, and authentication

**Location:** `backend/`

**Start Command:**
```bash
cd D:/Employees_Managements
source .venv/Scripts/activate  # Activate virtual environment
cd backend
python app.py
```

**Output:**
```
MongoDB connected successfully
Database indexes created successfully
* Running on all addresses (0.0.0.0)
* Running on http://127.0.0.1:5000
```

**Endpoints:**
- Authentication: `/api/auth/login`, `/api/auth/register`
- Users: `/api/users/*`
- Attendance: `/api/attendance/*`
- Leaves: `/api/leave/*`
- Settings: `/api/settings/*`
- Terminal: `/api/terminal/*` (for fingerprint enrollment)
- Fingerprint: `/api/fingerprint/*`

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Stop:** Press `Ctrl+C` in terminal

---

### 2️⃣ Frontend Web (React + Vite)

**Purpose:** Web-based admin dashboard for HR management

**Location:** `frontend/`

**Start Command:**
```bash
cd D:/Employees_Managements/frontend
npm run dev
```

**Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3001/
➜  Network: use --host to expose
```

**Access:** Open browser at `http://localhost:3001`

**Default Login:**
```
Email: admin@hrmanagement.com
Password: admin123
```

**Features:**
- Dashboard with charts
- Employee management
- Leave management
- Attendance tracking
- Salary advances
- Project management
- Multi-language (English/French/Arabic)
- RTL support

**Stop:** Press `Ctrl+C` in terminal

---

### 3️⃣ Fingerprint Web Service (.NET Web API)

**Purpose:** HTTP service for fingerprint enrollment and verification

**Location:** `desktop/FingerprintWebService/`

**Start Command:**
```bash
cd D:/Employees_Managements/desktop/FingerprintWebService
dotnet run
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║   FINGERPRINT WEB SERVICE                                  ║
║   Running on: http://localhost:5001                        ║
╚════════════════════════════════════════════════════════════╝

API Endpoints:
  GET  /status          - Device status
  POST /enroll          - Enroll new user
  POST /verify          - Verify fingerprint

Now listening on: http://localhost:5001
```

**Endpoints:**
- `GET /status` - Check device/service status
- `POST /enroll` - Enroll new employee with fingerprint
- `POST /verify` - Verify fingerprint for attendance

**Testing:**
```bash
curl http://localhost:5001/status
```

**Stop:** Press `Ctrl+C` in terminal

---

### 4️⃣ Desktop Admin UI (WPF - .NET)

**Purpose:** Desktop application for fingerprint enrollment

**Location:** `desktop/Fingerprint.AdminUI/`

**Start Command (Option A - Run from source):**
```bash
cd D:/Employees_Managements/desktop/Fingerprint.AdminUI
dotnet run
```

**Start Command (Option B - Run compiled exe):**
```bash
cd D:/Employees_Managements/desktop/Fingerprint.AdminUI
./bin/Release/net7.0-windows/Fingerprint.AdminUI.exe
```

**Build & Run Script:**
```bash
cd D:/Employees_Managements/desktop/Fingerprint.AdminUI
./build.bat
```

**Features:**
- Auto-generated Employee IDs (EMP0001, EMP0002, etc.)
- Fingerprint enrollment with real-time feedback
- Device status monitoring
- Success/failure alerts
- Material Design UI

**Requirements:**
- Backend API must be running (port 5000)
- Fingerprint Web Service must be running (port 5001)

**Window Shows:**
- Header: Device status (Connected/Disconnected)
- Form: Auto-generated Employee ID (read-only)
- Fields: First Name, Last Name, Department
- Button: Start Enrollment

**Stop:** Close the window or press `Alt+F4`

---

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

**Already configured!** Check `backend/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hr_management_db
```

No installation needed, works immediately.

### Option 2: Local MongoDB

**Install MongoDB Community Edition:**
1. Download: https://www.mongodb.com/try/download/community
2. Install and start service
3. Update `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/hr_management_db
```

**Start MongoDB:**
```bash
net start MongoDB
# OR
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

---

## 🔄 Complete Startup Sequence

### Recommended Order:

1. **Start Backend** (Required by all)
   ```bash
   cd backend && python app.py
   ```
   Wait for: `MongoDB connected successfully`

2. **Start Frontend** (For web access)
   ```bash
   cd frontend && npm run dev
   ```
   Wait for: `Local: http://localhost:3001/`

3. **Start Fingerprint Service** (For enrollment)
   ```bash
   cd desktop/FingerprintWebService && dotnet run
   ```
   Wait for: `Now listening on: http://localhost:5001`

4. **Launch Desktop UI** (For enrollment)
   ```bash
   cd desktop/Fingerprint.AdminUI && dotnet run
   ```
   Window appears with enrollment form

---

## 🧪 Testing the System

### Test Backend
```bash
curl http://localhost:5000/api/health
```

### Test Frontend
Open browser: `http://localhost:3001`
Login with: `admin@hrmanagement.com` / `admin123`

### Test Fingerprint Service
```bash
curl http://localhost:5001/status
```

### Test Desktop UI
1. Launch application
2. Check "Device Status" shows "Connected"
3. Fill enrollment form (Employee ID auto-generated)
4. Click "Start Enrollment"
5. Success popup appears
6. User saved to database

### Verify Enrollment in Database
Check MongoDB or frontend Users page for new employee

---

## 🛠️ Troubleshooting

### Backend Issues

**Error:** `MongoDB connection failed`
- Check MongoDB is running
- Verify `MONGO_URI` in `.env`
- Test Atlas connection string

**Error:** `Port 5000 already in use`
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Change port in app.py
app.run(port=5001)
```

**Error:** `Module not found`
```bash
pip install -r requirements.txt
```

### Frontend Issues

**Error:** `ECONNREFUSED 127.0.0.1:5000`
- Backend is not running
- Start backend first

**Error:** `Port 3001 already in use`
```bash
# Change port in vite.config.js
server: { port: 3002 }
```

### Fingerprint Service Issues

**Error:** `Build failed - file locked`
```bash
taskkill /F /IM FingerprintWebService.exe
dotnet build && dotnet run
```

**Error:** `Port 5001 already in use`
- Another process using port 5001
- Change port in `Program.cs`

### Desktop UI Issues

**Error:** `Device Status: Disconnected`
- Fingerprint Service not running
- Start service on port 5001

**Error:** `Employee ID not auto-generating`
- Backend API not running
- Check `http://localhost:5000/api/terminal/next-employee-id`

**Error:** `Enrollment failed`
- Check backend logs
- Verify backend is running
- Check fingerprint service logs

---

## 📊 Port Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend Web | 3001 | http://localhost:3001 |
| Fingerprint Service | 5001 | http://localhost:5001 |
| Desktop UI | N/A | Standalone Window |

---

## 🔐 Default Credentials

**Web Admin:**
```
Email: admin@hrmanagement.com
Password: admin123
```

**Database:**
- Database: `hr_management_db`
- Collections: `users`, `attendance`, `leaves`, `companies`, `projects`

---

## 📝 Logs & Debugging

**Backend Logs:** Terminal output from `python app.py`
**Frontend Logs:** Browser console (F12)
**Fingerprint Service Logs:** Terminal output from `dotnet run`
**Desktop UI:** Watch fingerprint service terminal for enrollment events

Example enrollment log:
```
[ENROLL] Starting enrollment for: John Doe (ID: EMP0001)
[ENROLL] ✅ Success! Template ID: xxx-xxx-xxx
[ENROLL] 💾 User saved to database
[ENROLL] ✅ Fingerprint template saved
```

---

**Need Help?** Check terminal logs or refer to API_DOCUMENTATION.md
