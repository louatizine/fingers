# 👆 Attendance Tracking System

## ✅ What Was Implemented

### 1. **Attendance Monitoring Service** (Desktop App)
**File:** `desktop/FingerprintAttendanceApp/Services/AttendanceMonitoringService.cs`

**What it does:**
- ✅ Continuously monitors the fingerprint device every 5 seconds
- ✅ Reads attendance logs from ZKTeco device using `SSR_GetGeneralLogData()`
- ✅ Automatically detects when employees scan their fingerprint
- ✅ Determines event type: `check_in`, `check_out`, `break_out`, `break_in`
- ✅ Sends attendance records to backend API automatically
- ✅ Shows console notifications when attendance is recorded

**How it works:**
1. Employee scans fingerprint on device
2. Device stores the scan with timestamp and biometric_id
3. Desktop app reads new scans every 5 seconds
4. Finds employee by biometric_id
5. Sends to backend: `POST /api/attendance/manual`
6. Backend saves to `attendance` collection

### 2. **Backend Attendance API**
**File:** `backend/routes/attendance_routes.py`

**Endpoints:**
- `POST /api/attendance/manual` - Record attendance (check-in/check-out)
- `GET /api/attendance/daily/:employee_id` - Get daily attendance
- `GET /api/attendance/summary/:employee_id` - Get worked hours summary
- `GET /api/attendance/monthly/:employee_id` - Monthly attendance report

**Database Collection: `attendance`**
```javascript
{
  _id: ObjectId,
  employee_id: "EMP001",
  event_type: "check_in" | "check_out",
  timestamp: ISODate("2026-02-02T08:00:00Z"),
  device_id: "1",
  match_score: 100,
  notes: "Auto-detected from device"
}
```

### 3. **Attendance Calculation Service**
**File:** `backend/services/attendance_service.py`

**Features:**
- ✅ Calculate total hours worked per day
- ✅ Match check-in with check-out pairs
- ✅ Handle lunch breaks
- ✅ Calculate overtime
- ✅ Monthly summaries with total days and hours

### 4. **User Lookup by Biometric ID**
**New Endpoint:** `GET /api/users/biometric/<biometric_id>`

Allows the desktop app to find which employee corresponds to a fingerprint scan.

## 📋 How It Works End-to-End

### **Enrollment Flow:**
1. Admin creates user in web app
2. Backend auto-assigns: `employee_id` (EMP001) and `biometric_id` (001)
3. Desktop app detects new user via polling
4. User scans fingerprint 3 times
5. Fingerprint stored on device with biometric_id
6. Backend updated: `fingerprint_status = ENROLLED`

### **Attendance Flow:**
1. Employee arrives at work
2. Scans finger on device → Device stores: `biometric_id=1, timestamp, event=check_in`
3. Desktop app reads log every 5 seconds
4. Desktop finds `EMP001` by `biometric_id=1`
5. Desktop sends to backend: `POST /api/attendance/manual`
6. Backend saves to `attendance` collection
7. Employee leaves work → Scans again → `event=check_out`
8. System automatically calculates hours worked

## 🎯 Testing the System

### **Test 1: Enroll a User**
1. Start desktop app: `dotnet run`
2. Create user in web app with Employee ID: EMP001
3. Desktop app will prompt for enrollment
4. Scan fingerprint 3 times on device
5. Verify: Backend shows `fingerprint_status: ENROLLED`

### **Test 2: Record Attendance**
1. Make sure desktop app is running
2. Go to fingerprint device
3. Place your enrolled finger on scanner
4. Check console output - should show: `👆 ATTENDANCE: EMP001 - check_in at 08:00:00`
5. Check database: `db.attendance.find({employee_id: "EMP001"})`

### **Test 3: Manual Attendance (Testing)**
```bash
curl -X POST http://localhost:5000/api/attendance/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employee_id": "EMP001",
    "event_type": "check_in",
    "device_id": "1",
    "match_score": 100
  }'
```

### **Test 4: Get Attendance Report**
```python
# Python script to check attendance
from database import get_db
from datetime import datetime

db = get_db()

# Today's attendance for EMP001
attendance = list(db.attendance.find({
    'employee_id': 'EMP001',
    'timestamp': {
        '$gte': datetime(2026, 2, 2, 0, 0, 0),
        '$lt': datetime(2026, 2, 3, 0, 0, 0)
    }
}).sort('timestamp', 1))

for record in attendance:
    print(f"{record['timestamp']} - {record['event_type']}")

# Expected output:
# 2026-02-02 08:00:00 - check_in
# 2026-02-02 17:00:00 - check_out
# Total hours: 9 hours
```

## 📊 Database Structure

### **users collection:**
```javascript
{
  _id: ObjectId,
  employee_id: "EMP001",
  biometric_id: 1,  // Links to fingerprint device
  first_name: "Zine",
  last_name: "Louati",
  fingerprint_status: "ENROLLED",
  has_fingerprint: true
}
```

### **attendance collection:** (NEW)
```javascript
{
  _id: ObjectId,
  employee_id: "EMP001",
  event_type: "check_in",
  timestamp: ISODate("2026-02-02T08:00:00Z"),
  device_id: "1",
  match_score: 100,
  notes: "Auto-detected from device"
}
```

## 🔧 Configuration

**appsettings.json:**
```json
{
  "AttendanceMonitoring": {
    "IntervalSeconds": "5",    // Check device every 5 seconds
    "Enabled": "true"          // Enable/disable attendance tracking
  }
}
```

## ⚙️ Services Running

When you start the desktop app, you'll see:
```
✅ Backend polling started (checking every 10 seconds)  ← For new enrollments
✅ Enrollment polling started - listening for new users...
✅ Attendance monitoring started (checking every 5 seconds)  ← NEW!
```

## 🎯 Hours Calculation

The backend automatically calculates:
- **Daily Hours:** Sum of (check_out - check_in) pairs
- **Break Time:** Excluded from hours worked
- **Overtime:** Hours beyond 8 hours/day
- **Monthly Total:** Sum of all daily hours

**API Example:**
```javascript
GET /api/attendance/summary/EMP001?start_date=2026-02-01&end_date=2026-02-28

Response:
{
  "total_days": 20,
  "total_hours": 160,
  "average_hours_per_day": 8,
  "overtime_hours": 5,
  "days": [
    {
      "date": "2026-02-02",
      "check_in": "08:00:00",
      "check_out": "17:00:00",
      "hours_worked": 9,
      "overtime": 1
    }
  ]
}
```

## 🚀 Next Steps

1. **Start the desktop app:** `dotnet run`
2. **Enroll yourself** (EMP001)
3. **Scan your finger** for check-in
4. **Check the database:**
   ```javascript
   db.attendance.find({employee_id: "EMP001"})
   ```
5. **View in web app** - Attendance reports page (if implemented)

## 📝 About Fingerprint Storage

**Important Note:**
- Fingerprint **templates** are stored **ONLY on the ZKTeco device**, not in database
- Database stores: `biometric_id`, `employee_id`, `fingerprint_status`
- This is for security and privacy reasons
- ZKTeco device handles all fingerprint matching locally

If you need to backup/restore fingerprints:
- Use ZKTeco's official software
- Or implement: `zkem.GetUserTmpExStr()` to extract templates

## ✅ System is Now Complete

You now have:
- ✅ Auto-enrollment from backend
- ✅ Real-time attendance tracking
- ✅ Automatic hours calculation
- ✅ Database records of all check-ins/check-outs
- ✅ Monthly/daily reports

The system will automatically track attendance whenever someone scans their fingerprint!
