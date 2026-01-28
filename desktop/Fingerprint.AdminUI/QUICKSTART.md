# 🚀 Quick Start Guide - Fingerprint Admin UI

## ⚡ Get Started in 3 Minutes!

### Step 0: Start the Backend Server FIRST! 🔴
**IMPORTANT**: The desktop application requires the Flask backend server to be running.

```bash
# In a NEW terminal window, navigate to backend folder
cd backend

# Start the backend server
start-backend.bat

# OR check if it's already running
check-backend.bat
```

You should see:
```
* Running on http://0.0.0.0:5000
* Running on http://127.0.0.1:5000
```

Keep this terminal window open while using the desktop app!

### Step 1: Prerequisites Check ✅
```bash
# Check .NET version (should be 7.0 or higher)
dotnet --version
```

### Step 2: Build and Run 🏗️
```bash
# Option A: Use the build script (Recommended)
cd desktop/Fingerprint.AdminUI
build.bat

# Option B: Manual build
dotnet restore
dotnet build --configuration Release
dotnet run
```

### Step 3: First Launch 🎨
The application will open showing:
- **Dashboard** (default view)
- Navigation tabs at the top
- Device status in the header
- Status bar at the bottom

---

## 📚 Common Tasks

### Task 1: Enroll a New Employee
1. **ENSURE BACKEND IS RUNNING** (see Step 0 above)
2. Click **"Enroll User"** tab
3. Fill in:
   ```
   Employee ID: EMP001
   First Name: John
   Last Name: Doe
   Department: IT
   ```
4. Click **"Start Fingerprint Enrollment"**
5. Follow on-screen instructions
6. Wait for ✓ Success message

**Common Error**: If you get "404 Not Found" or "Creation Failed" error:
- The backend server is NOT running
- Run `backend/start-backend.bat` in a separate terminal
- Try the enrollment again

### Task 2: Configure Working Hours
1. Click **"Settings"** tab
2. Set times:
   ```
   Check-in Start:  08:00
   Check-out End:   17:00
   Lunch Break:     12:00 - 13:00
   ```
3. Click **"Save Settings"**
4. Wait for ✓ confirmation

### Task 3: View Attendance Logs
1. Click **"Dashboard"** tab
2. See recent 20 logs
3. Click **"Refresh"** to update
4. Check worked hours column

---

## 🎯 Testing the Application

### Test 1: Check Backend Connection
- Dashboard should load attendance logs
- If empty, backend might not be running

### Test 2: Check Device Service
- Header shows device status
- Green ✓ = Connected
- Red ✗ = Disconnected
- Click "Refresh" to retry

### Test 3: Enroll a Test User
- Use fake data for testing
- Check if enrollment status updates
- Verify no error messages

---

## 🔧 Configuration

### API Endpoints (App.xaml.cs)
```csharp
LocalService: http://localhost:5001  // Windows Service
Backend:      http://localhost:5000  // Flask API
```

### Change API URLs
Edit `App.xaml.cs`, lines 21-30:
```csharp
services.AddHttpClient("LocalService", client =>
{
    client.BaseAddress = new Uri("http://YOUR_SERVICE_URL");
});
```

---

## ❗ Troubleshooting

### Problem: Application won't start
**Error**: "Unable to locate .NET SDK"
**Fix**: Install .NET 7 SDK from Microsoft

### Problem: Build fails with NuGet errors
**Error**: "Package restore failed"
**Fix**: 
```bash
dotnet nuget locals all --clear
dotnet restore --force
```

### Problem: Device shows disconnected
**Error**: Red status in header
**Fix**:
- Ensure Windows Service is running
- Check port 5001 is available
- Verify service is localhost

### Problem: Dashboard is empty
**Error**: "No attendance records"
**Fix**:
- Check backend API is running (port 5000)
- Verify database has data
- Click "Refresh" button

---

## 🎨 UI Overview

### Layout
```
┌──────────────────────────────────────────────┐
│ 🔵 Fingerprint Attendance Admin  [Device ✓] │ <- Header
├──────────────────────────────────────────────┤
│  [Dashboard] [Enroll User] [Settings]        │ <- Tabs
├──────────────────────────────────────────────┤
│                                              │
│          Main Content Area                   │ <- Views
│                                              │
├──────────────────────────────────────────────┤
│ Status: Ready | © 2026 HR System            │ <- Status
└──────────────────────────────────────────────┘
```

### Navigation
- **Dashboard**: View attendance logs
- **Enroll User**: Add new employees
- **Settings**: Configure system

---

## 📖 Example Workflow

### Complete Enrollment Process
```
1. Launch app
   └─> Dashboard loads

2. Click "Enroll User"
   └─> Form appears

3. Fill employee details
   Employee ID: EMP001
   Name: John Doe
   └─> Button enables

4. Click "Start Fingerprint Enrollment"
   └─> Status: "Waiting for fingerprint..."
   └─> Service captures fingerprint
   └─> Status: "✓ Enrollment successful!"
   └─> Form clears

5. Return to Dashboard
   └─> New employee appears in logs
```

---

## 🔍 What's Next?

### Customize UI
- Edit `App.xaml` for colors
- Modify views in `Views/` folder
- Add new fields to models

### Add Features
- Export attendance reports
- Advanced filtering
- User management
- Statistics dashboard

### Integrate
- Connect to HR system
- Email notifications
- Report generation
- Data analytics

---

## 📞 Support

### Need Help?
- Check README.md for details
- Review code comments
- Contact IT department

### Report Issues
- Note exact error message
- Steps to reproduce
- Screenshot if possible

---

**Happy coding!** 🎉

**Project**: Fingerprint Attendance Admin UI  
**Version**: 1.0.0  
**Date**: January 21, 2026
