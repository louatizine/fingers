# Fingerprint Admin UI - Context & Architecture

**Last Updated:** January 22, 2026

## Overview
WPF Desktop application for fingerprint enrollment and attendance management. This app connects to both a local Windows Service (for fingerprint operations) and a Flask backend (for data persistence).

---

## Current Architecture

### 1. **Application Structure**

```
Fingerprint.AdminUI/
├── App.xaml / App.xaml.cs          # Application entry point with DI
├── MainWindow.xaml                  # Main window with tab navigation
├── Helpers/
│   ├── Converters.cs                # XAML value converters
│   ├── RelayCommand.cs              # ICommand implementations
│   └── ViewModelBase.cs             # Base class for ViewModels
├── Models/
│   ├── AttendanceLog.cs             # Attendance record model
│   ├── AttendanceSettings.cs        # Attendance configuration
│   ├── DeviceStatus.cs              # Fingerprint device status
│   ├── Employee.cs                  # Employee model
│   └── EnrollmentModels.cs          # Enrollment request/response
├── Services/
│   └── ApiService.cs                # HTTP client for backend/service
├── ViewModels/
│   ├── MainViewModel.cs             # Main window VM (hosts all views)
│   ├── EnrollUserViewModel.cs       # Fingerprint enrollment
│   ├── AttendanceViewModel.cs       # Manual check-in/check-out
│   ├── DashboardViewModel.cs        # View attendance logs
│   └── SettingsViewModel.cs         # Configure attendance rules
└── Views/
    ├── EnrollUserView.xaml          # Enrollment UI
    ├── AttendanceView.xaml          # Check-in/check-out UI
    ├── DashboardView.xaml           # Attendance logs grid
    └── SettingsView.xaml            # Settings configuration
```

### 2. **Dependency Injection Setup**

**File:** `App.xaml.cs`

```csharp
// HTTP Clients
services.AddHttpClient("LocalService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5001");
    client.Timeout = TimeSpan.FromSeconds(30);
});

services.AddHttpClient("Backend", client =>
{
    client.BaseAddress = new Uri("http://localhost:5000/api");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Services
services.AddSingleton<ApiService>();

// ViewModels
services.AddSingleton<MainViewModel>();
services.AddTransient<DashboardViewModel>();
services.AddTransient<EnrollUserViewModel>();
services.AddTransient<AttendanceViewModel>();
services.AddTransient<SettingsViewModel>();

// Main Window
services.AddSingleton<MainWindow>();
```

---

## API Endpoints Used

### Backend API (Flask - Port 5000)

**Base URL:** `http://localhost:5000/api`

#### User Endpoints
- `GET /users/public/{employee_id}` - Get employee info (no auth required)
- `GET /users/{user_id}` - Get user by ID (requires JWT)

#### Attendance Endpoints
- `POST /attendance/manual` - Record manual attendance (check-in/check-out)
- `GET /attendance/employee/{employee_id}?date=YYYY-MM-DD` - Get attendance for date
- `GET /attendance` - Get attendance records with filters
- `GET /attendance/daily-summary/{employee_id}?date=YYYY-MM-DD` - Daily summary

#### Fingerprint Endpoints
- `POST /fingerprint/enroll` - Register fingerprint template
- `GET /fingerprint/employee/{employee_id}` - Get employee fingerprints

### Local Windows Service (Port 5001)

**Base URL:** `http://localhost:5001`

#### Device Operations
- `GET /device/status` - Check fingerprint device status

#### Enrollment Operations
- `POST /enroll` - Start fingerprint enrollment
  ```json
  {
    "employee_id": "EMP0001",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

---

## Key Components

### 1. **AttendanceViewModel** (NEW)
**Purpose:** Manual check-in/check-out testing

**Features:**
- Enter employee ID to load info
- Green "Check In" button
- Blue "Check Out" button
- Real-time summary (check-in time, check-out time, worked hours)
- Status messages with color coding

**Key Methods:**
- `LoadEmployeeInfoAsync()` - Fetch employee from backend
- `LoadTodayAttendanceAsync()` - Get today's attendance records
- `RecordAttendanceAsync(eventType)` - Post check-in/check-out

**API Calls:**
```csharp
// Get employee info (public endpoint - no auth)
GET /api/users/public/{employeeId}

// Record attendance
POST /api/attendance/manual
{
  "employee_id": "EMP0001",
  "event_type": "check_in", // or "check_out"
  "timestamp": "2026-01-22T10:30:00.000Z",
  "device_id": "DESKTOP-MANUAL",
  "match_score": 100
}

// Get today's attendance
GET /api/attendance/employee/{employeeId}?date=2026-01-22
```

### 2. **EnrollUserViewModel**
**Purpose:** Enroll new fingerprints

**Current Implementation:**
- Communicates with local Windows Service (port 5001)
- Sends enrollment request to `/enroll` endpoint
- Receives fingerprint template from service
- Posts template to backend `/api/fingerprint/enroll`

**SDK Integration Point:** 
This is where the actual SDK will be integrated. Currently expects the Windows Service to handle fingerprint scanning.

### 3. **DashboardViewModel**
**Purpose:** View recent attendance logs

**Features:**
- DataGrid showing recent check-ins/check-out
- Color-coded event types (green=check-in, blue=check-out)
- Refresh button
- Displays: Date, Time, Employee ID, Event, Device, Match Score, Worked Hours

### 4. **SettingsViewModel**
**Purpose:** Configure attendance rules

**Settings:**
- Check-in start time
- Check-out end time  
- Lunch break duration
- Lunch break start/end times

---

## SDK Integration Notes

### Current State (PLACEHOLDER)
The `/SDK` folder currently contains documentation but NOT the actual NeuroTechnology SDK binaries.

### When Integrating Real SDK

**Location:** `D:\Employees_Managements\SDK\`

**Expected Files:**
```
SDK/
├── Bin/Win64_x64/           # DLL files
├── Include/Nffv/            # Header files (for C++ interop)
├── Lib/Win64_x64/           # Library files
└── Documentation/           # SDK docs
```

**Integration Points:**

1. **EnrollUserViewModel** - Replace Windows Service calls with direct SDK calls:
   ```csharp
   // TODO: Replace this
   await _localServiceClient.PostAsJsonAsync("/enroll", request);
   
   // With SDK calls like:
   // NFfv.Initialize();
   // var template = NFfv.CaptureAndCreateTemplate();
   ```

2. **Device Status** - Direct SDK device detection:
   ```csharp
   // TODO: Replace service call
   await _localServiceClient.GetAsync("/device/status");
   
   // With SDK:
   // var devices = NFfv.GetDevices();
   // return devices.Any() ? "Connected" : "Disconnected";
   ```

3. **Required NuGet Packages:**
   - Platform Invoke utilities (if needed)
   - COM interop helpers (if SDK uses COM)

4. **Project References:**
   - Add SDK DLLs to project
   - Set "Copy to Output Directory" = "Copy if newer"
   - May need to create C# wrapper classes for C++ SDK

---

## XAML Resources

### Converters Registered in App.xaml
```xml
<BooleanToVisibilityConverter x:Key="BooleanToVisibilityConverter"/>
<helpers:StringToVisibilityConverter x:Key="StringToVisibilityConverter"/>
<helpers:InverseBooleanToVisibilityConverter x:Key="InverseBooleanToVisibilityConverter"/>
<helpers:BoolToIconConverter x:Key="BoolToIconConverter"/>
<helpers:BoolToColorConverter x:Key="BoolToColorConverter"/>
<helpers:StringToBoolConverter x:Key="StringToBoolConverter"/>
<helpers:NullableToVisibilityConverter x:Key="NullableToVisibilityConverter"/>
```

### Material Design Icons Used
- `Fingerprint` - Enrollment tab
- `ClockOutline` - Attendance tab
- `ViewDashboard` - Dashboard tab
- `Settings` - Settings tab
- `Login` - Check-in button
- `Logout` - Check-out button
- `CheckCircle` - Device connected
- `CloseCircle` - Device disconnected
- `Refresh` - Refresh button

---

## Build & Run

### Debug Build
```bash
cd D:/Employees_Managements/desktop/Fingerprint.AdminUI
dotnet build -c Debug
```

### Run Application
```bash
# Option 1: Using dotnet
dotnet run

# Option 2: Direct exe
bin/Debug/net7.0-windows/Fingerprint.AdminUI.exe
```

### Release Build
```bash
dotnet build -c Release
bin/Release/net7.0-windows/Fingerprint.AdminUI.exe
```

---

## Error Handling

**Startup Errors** are caught in `App.xaml.cs` and logged to:
```
C:\Users\{username}\Desktop\FingerprintUI_Error.txt
```

**Runtime Errors** in ViewModels:
- Display error messages in UI
- Log to console/debug output
- No application crash

---

## Database Models (Backend)

### Attendance Record
```json
{
  "_id": "ObjectId",
  "employee_id": "EMP0001",
  "event_type": "check_in", // or "check_out"
  "timestamp": "2026-01-22T08:30:00Z",
  "device_id": "DESKTOP-MANUAL",
  "match_score": 100,
  "notes": "Manual entry"
}
```

### Fingerprint Template
```json
{
  "_id": "ObjectId",
  "employee_id": "EMP0001",
  "template_data": "base64_encoded_template",
  "finger": "right_index",
  "quality_score": 95,
  "enrolled_at": "2026-01-22T10:00:00Z",
  "device_id": "FP_DEVICE_001"
}
```

---

## Configuration Files

### appsettings.json (If needed later)
```json
{
  "ApiSettings": {
    "BackendUrl": "http://localhost:5000/api",
    "LocalServiceUrl": "http://localhost:5001",
    "Timeout": 30
  },
  "FingerprintSettings": {
    "MinQualityScore": 60,
    "MaxRetries": 3,
    "CaptureTimeout": 30
  }
}
```

---

## Known Issues & TODOs

### Current Issues
1. ✅ **FIXED:** 401 error on user endpoint (added public endpoint)
2. ✅ **FIXED:** 404 error on attendance/manual (endpoint was added)
3. ✅ **FIXED:** TypeConverter error on invalid MaterialDesign icons

### TODOs for SDK Integration
- [ ] Replace Windows Service calls with direct SDK calls
- [ ] Implement real fingerprint capture
- [ ] Add fingerprint matching/verification
- [ ] Handle SDK initialization and cleanup
- [ ] Add device selection (if multiple devices)
- [ ] Implement fingerprint quality checking
- [ ] Add retry logic for poor quality scans
- [ ] Create SDK wrapper classes for better C# integration

---

## Testing Checklist

### Manual Testing - Attendance View
- [x] Enter valid employee ID → Name appears
- [x] Click Check In → Success message + timestamp
- [x] Click Check Out → Success message + worked hours calculated
- [x] Today's summary updates automatically
- [x] Invalid employee ID → No error crash

### Manual Testing - Enrollment View
- [ ] Connect fingerprint device
- [ ] Enter employee info
- [ ] Scan fingerprint (multiple times)
- [ ] Template saved to backend
- [ ] Can verify fingerprint after enrollment

### Manual Testing - Dashboard View
- [x] Recent logs display correctly
- [x] Refresh button works
- [x] Check-in events are green
- [x] Check-out events are blue
- [x] Worked hours calculated properly

---

## Dependencies

### NuGet Packages
```xml
<PackageReference Include="MaterialDesignThemes" Version="4.9.0" />
<PackageReference Include="MaterialDesignColors" Version="2.1.4" />
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="7.0.0" />
<PackageReference Include="Microsoft.Extensions.Hosting" Version="7.0.1" />
<PackageReference Include="Microsoft.Extensions.Http" Version="7.0.0" />
```

### Target Framework
- `.NET 7.0-windows`
- WPF Application
- x64 Platform

---

## Backend Requirements

### Flask Server Must Be Running
```bash
cd D:/Employees_Managements/backend
python app.py
```

### Required Backend Routes
- ✅ `/api/users/public/<employee_id>` - Public user lookup
- ✅ `/api/attendance/manual` - Manual attendance entry
- ✅ `/api/attendance/employee/<employee_id>` - Get employee attendance
- ✅ `/api/fingerprint/enroll` - Save fingerprint template

---

## Future Enhancements

### Phase 1: Basic Functionality (CURRENT)
- ✅ Manual check-in/check-out
- ✅ View attendance logs
- ✅ Basic settings configuration
- ✅ Employee lookup

### Phase 2: SDK Integration (NEXT)
- [ ] Real fingerprint capture using SDK
- [ ] Device detection and management
- [ ] Fingerprint quality validation
- [ ] Multiple finger enrollment (left/right, index/thumb)

### Phase 3: Advanced Features (FUTURE)
- [ ] Offline mode with local database sync
- [ ] Real-time fingerprint verification
- [ ] Export attendance reports
- [ ] User photos/avatars
- [ ] Biometric templates backup/restore
- [ ] Multi-device support
- [ ] Touch screen optimization

---

## Notes for Developers

1. **Authentication:** Desktop app uses public endpoints (no JWT required for basic operations)
2. **Error Logs:** Check desktop for `FingerprintUI_Error.txt` if app crashes
3. **Hot Reload:** Close and reopen app after code changes (no hot reload in WPF)
4. **MaterialDesign:** Use valid icon names from [MaterialDesignIcons.com](https://materialdesignicons.com/)
5. **MVVM Pattern:** All business logic in ViewModels, Views are just UI
6. **Async/Await:** All API calls are async to prevent UI freezing

---

**END OF CONTEXT DOCUMENT**
