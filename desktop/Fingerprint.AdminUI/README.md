# Fingerprint Attendance Admin UI

## 🎯 Overview
Modern WPF desktop application for managing fingerprint attendance system. Designed for HR/IT administrators.

## ✨ Features
- **User Enrollment**: Enroll employees with fingerprint biometrics
- **Device Status**: Monitor fingerprint scanner connection
- **Attendance Dashboard**: View recent attendance logs with worked hours
- **Settings Management**: Configure working hours and lunch breaks

## 🏗️ Architecture

### MVVM Pattern
```
├── Models/          - Data structures
├── Views/           - XAML UI files
├── ViewModels/      - Business logic and commands
├── Services/        - API communication layer
└── Helpers/         - Utilities (RelayCommand, Converters)
```

### Communication Flow
```
WPF UI → ViewModel → ApiService → HTTP → Windows Service (localhost:5001)
                                  └─────→ Backend API (localhost:5000)
```

## 🔧 Technology Stack
- **.NET 7** - Modern framework
- **WPF** - Windows Presentation Foundation
- **Material Design** - Modern UI components
- **MVVM** - Clean separation of concerns
- **Dependency Injection** - Proper service management
- **HttpClient** - Async API communication

## 📦 Dependencies
```xml
<PackageReference Include="MaterialDesignThemes" Version="4.9.0" />
<PackageReference Include="MaterialDesignColors" Version="2.1.4" />
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="7.0.0" />
<PackageReference Include="Microsoft.Extensions.Hosting" Version="7.0.1" />
<PackageReference Include="Microsoft.Extensions.Http" Version="7.0.0" />
<PackageReference Include="System.Text.Json" Version="7.0.3" />
```

## 🚀 Building the Application

### Prerequisites
- .NET 7 SDK or later
- Windows 10/11
- Visual Studio 2022 (optional, but recommended)

### Using Visual Studio
1. Open `Fingerprint.AdminUI.csproj`
2. Restore NuGet packages (automatic)
3. Build Solution (Ctrl+Shift+B)
4. Run (F5)

### Using .NET CLI
```bash
cd desktop/Fingerprint.AdminUI
dotnet restore
dotnet build --configuration Release
dotnet run
```

## 🔌 API Endpoints

### Local Windows Service (localhost:5001)
- `GET /device/status` - Get fingerprint device status
- `POST /enroll` - Start fingerprint enrollment

### Backend API (localhost:5000)
- `GET /api/attendance?limit=20` - Get recent attendance logs
- `GET /api/attendance/daily-summary/{employeeId}` - Get daily summary with worked hours
- `GET /api/settings/attendance` - Get attendance settings
- `PUT /api/settings/attendance` - Update attendance settings

## 📖 User Guide

### Enrollment Workflow
1. Click **"Enroll User"** tab
2. Fill in employee details:
   - Employee ID (required)
   - First Name (required)
   - Last Name (required)
   - Department (optional)
3. Click **"Start Fingerprint Enrollment"**
4. Windows Service will handle fingerprint scanning
5. Wait for confirmation
6. Form clears automatically on success

### Settings Configuration
1. Click **"Settings"** tab
2. Configure times (HH:mm format):
   - Check-in start: `08:00`
   - Check-out end: `17:00`
   - Lunch break: `12:00` to `13:00`
3. Click **"Save Settings"**
4. Settings apply to all attendance calculations

### Dashboard
- Displays last 20 attendance records
- Shows worked hours (auto-calculated)
- Color-coded event types:
  - 🟢 Green = Check-in
  - 🔵 Blue = Check-out
- Click **"Refresh"** to update data

## 🎨 UI Design

### Color Scheme
- **Primary**: Blue (#2196F3)
- **Secondary**: Light Blue
- **Theme**: Material Design Light

### Layout
```
┌─────────────────────────────────────────┐
│ Header: Logo | Navigation | Device Status│
├─────────────────────────────────────────┤
│                                         │
│            Dynamic Content              │
│         (Dashboard/Enroll/Settings)     │
│                                         │
├─────────────────────────────────────────┤
│ Status Bar: Message | Copyright         │
└─────────────────────────────────────────┘
```

## 🔍 Code Organization

### ViewModels
**MainViewModel** - App navigation and device status
- Manages child ViewModels
- Handles view switching
- Monitors device connection

**DashboardViewModel** - Attendance logs display
- Loads recent attendance data
- Refresh command
- Observable collection for DataGrid

**EnrollUserViewModel** - User enrollment
- Form validation
- Enrollment workflow
- Status updates

**SettingsViewModel** - Configuration management
- Load/save settings
- Time format validation

### Services
**ApiService** - Central API communication
- Typed HttpClient instances
- JSON serialization
- Error handling
- Async/await pattern

## ⚙️ Configuration

### API URLs (App.xaml.cs)
```csharp
// Local Windows Service
client.BaseAddress = new Uri("http://localhost:5001");

// Backend API
client.BaseAddress = new Uri("http://localhost:5000/api");
```

### Timeouts
- Default: 30 seconds
- Configurable in HttpClient setup

## 🐛 Troubleshooting

### Cannot connect to service
**Problem**: Device status shows "Cannot connect"
**Solution**: 
- Ensure Windows Service is running on port 5001
- Check firewall settings

### Enrollment fails
**Problem**: Enrollment button disabled
**Solution**:
- Fill all required fields (Employee ID, First Name, Last Name)
- Check device is connected

### Settings not saving
**Problem**: Save button does nothing
**Solution**:
- Check backend API is running on port 5000
- Verify admin permissions
- Check console for error messages

## 📝 Development Notes

### Adding New Views
1. Create ViewModel in `ViewModels/`
2. Create View in `Views/`
3. Add DataTemplate in `MainWindow.xaml`
4. Add navigation button in header
5. Wire command in `MainViewModel`

### Adding API Endpoints
1. Add method in `ApiService.cs`
2. Create response model if needed
3. Call from ViewModel
4. Update UI bindings

## 🔐 Security Notes
- All API calls use HttpClient (no credentials stored)
- Runs on localhost only
- Admin-only application
- No sensitive data cached

## 📊 Performance
- Async/await for all I/O operations
- Lazy loading of data
- Observable collections for efficient updates
- Minimal memory footprint

## 🎯 Best Practices Used
✅ MVVM pattern (no code-behind logic)
✅ Dependency Injection
✅ Async programming
✅ Strong typing
✅ Error handling
✅ Clean architecture
✅ Material Design
✅ Comments and documentation

## 📄 License
Part of HR Management System
© 2026 All Rights Reserved

## 👥 Support
For issues or questions, contact IT department.

---

**Version**: 1.0.0  
**Last Updated**: January 21, 2026  
**Status**: ✅ Production Ready
