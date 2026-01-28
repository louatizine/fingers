# 🔧 Troubleshooting Common Errors

## Error: "404 Not Found" when enrolling users

### Problem
When you click "Start Fingerprint Enrollment", you get an error dialog:
```
User creation failed: Failed to create user: <!doctype html>
<title>404 Not Found</title>
<h1>Not Found</h1>
<p>The requested URL was not found on the server...</p>
```

### Root Cause
The Flask backend server is **NOT running**. The desktop application cannot connect to `http://localhost:5000`.

### Solution

#### Quick Fix (2 steps):
1. **Start the backend server**:
   ```bash
   # Open a NEW terminal
   cd backend
   start-backend.bat
   ```

2. **Wait for this message**:
   ```
   * Running on http://127.0.0.1:5000
   ```

3. **Try enrolling again** in the desktop app

#### Verify Backend is Running:
```bash
cd backend
check-backend.bat
```

You should see:
```json
{
  "message": "HR Management System API is running",
  "status": "healthy"
}
```

---

## Error: "Cannot connect to backend server"

### Problem
The desktop app shows: "Cannot connect to backend server. Please ensure the Flask backend is running..."

### Solution
Same as above - start the backend server:
```bash
cd backend
start-backend.bat
```

---

## Error: HTTP Client timeout

### Problem
Request takes too long and times out after 30 seconds.

### Solution
1. Check if MongoDB is running
2. Check backend logs for errors
3. Restart the backend server

---

## Error: User creation succeeds but shows wrong data

### Problem
User is created but with incorrect information.

### Solution
Check that you're filling all required fields:
- Employee ID (required)
- First Name (required)
- Last Name (required)
- Department (optional)

---

## Best Practices

### Always Start Backend First!
```bash
# Terminal 1: Start backend
cd backend
start-backend.bat

# Terminal 2: Start desktop app (after backend is running)
cd desktop/Fingerprint.AdminUI
start-app.bat
```

### Check Health Before Running
The updated `start-app.bat` now automatically checks if the backend is running before launching the desktop app.

---

## Still Having Issues?

1. **Check Backend Logs**: Look at the terminal where backend is running
2. **Check Desktop Logs**: Look for `FingerprintUI_Error.txt` on your Desktop
3. **Verify Ports**: Ensure nothing else is using port 5000
4. **Restart Everything**:
   ```bash
   # Stop backend (Ctrl+C in backend terminal)
   # Close desktop app
   # Start backend again
   # Start desktop app again
   ```
