# Quick Start Guide - Fingerprint Attendance System

## 🚀 5-Minute Setup

### Prerequisites Checklist
- [ ] Windows 10/11 (64-bit)
- [ ] .NET 8 Runtime installed
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] MongoDB Atlas account created
- [ ] Fingerprint scanner connected
- [ ] SDK folder at project root

---

## Step 1: Backend Setup (2 minutes)

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# 6. Edit .env and add your MongoDB connection string
# MONGO_URI=mongodb+srv://...

# 7. Run backend
python app.py
```

✅ Backend running on http://localhost:5000

---

## Step 2: Frontend Setup (1 minute)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env
echo VITE_API_URL=http://localhost:5000/api > .env

# 4. Run frontend
npm run dev
```

✅ Frontend running on http://localhost:5173

---

## Step 3: Desktop App Setup (2 minutes)

### Option A: Using Visual Studio
1. Open `desktop/FingerprintAttendanceApp.sln`
2. Verify SDK path in `.csproj`
3. Set platform to **x64**
4. Build → Build Solution
5. Run as Administrator

### Option B: Using .NET CLI
```bash
cd desktop/FingerprintAttendanceApp
dotnet restore
dotnet build --configuration Release
cd bin\x64\Release\net8.0-windows
# Run as Administrator:
FingerprintAttendanceApp.exe
```

✅ Desktop app running and connected to scanner

---

## First Use

### 1. Login to Web App
- URL: http://localhost:5173
- Default admin: (create via MongoDB or registration)

### 2. Enroll First User (Desktop App)
1. Run desktop app as Administrator
2. Select "1. Enroll New User"
3. Enter employee ID
4. Follow prompts to capture fingerprint (3 times)
5. Verify enrollment in web app

### 3. Test Verification (Desktop App)
1. Select "2. Verify Fingerprint"
2. Place finger on scanner
3. Check attendance recorded in web app

---

## Common Issues

### "SDK Not Found"
- Verify `SDK` folder exists at `../../SDK/Bin/Win64_x64`
- Check DLL paths in `.csproj`

### "Backend Connection Failed"
- Ensure backend is running on http://localhost:5000
- Check `appsettings.json` in desktop app

### "Scanner Not Detected"
- Install scanner drivers
- Run desktop app as Administrator
- Check Device Manager

---

## Next Steps

1. Read full documentation: `FINGERPRINT_SYSTEM_DOCUMENTATION.md`
2. Configure production settings
3. Deploy to production servers
4. Test with multiple users
5. Review security settings

---

**Support:** See full documentation for troubleshooting guide
