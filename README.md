# HR Management System - Complete ERP Solution

A comprehensive web-based HR Management System built with React, Flask, and MongoDB. Features include employee management, biometric attendance, leave tracking, salary advances, and project management with role-based access control and multi-language support.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Supervisor, Employee)
- Secure password hashing
- Session management
- User profile management

### Employee Management
- Create, update, and deactivate employees
- Assign employees to projects
- Company-based organization
- Leave balance tracking
- Fingerprint enrollment and management
- Employee search and filtering

### Biometric Attendance System
- ZKTeco fingerprint device integration
- Real-time attendance tracking
- Fingerprint enrollment and verification
- Attendance history and reports
- Device status monitoring
- Desktop fingerprint management UI (WPF)

### Leave Management
- Multiple leave types (annual, sick, unpaid)
- Automatic balance calculation
- Company-specific leave policies
- Approval/rejection workflow
- Email notifications
- Real-time balance updates
- Leave trends analytics

### Salary Advance Requests
- Employee request submission
- Admin/Supervisor approval workflow
- Request history tracking
- Email notifications
- Approval status tracking

### Dashboard & Analytics
- Role-specific dashboards (Admin, Supervisor, Employee)
- Interactive charts (Recharts)
- Real-time statistics
- Pending approvals overview
- Recent activity tracking
- System health monitoring
- Attendance summaries
- Leave balance visualization

### Notification System
- In-app real-time notifications
- Configurable SMTP settings
- Email templates
- Automatic notifications for approvals/rejections
- Mark as read/unread functionality
- Notification history

### Multi-Language Support (i18n)
- English, French, and Arabic
- RTL support for Arabic
- Real-time language switching
- Comprehensive translation coverage
- Localized date and number formats

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Modern blue & white theme
- Professional UI with Tailwind CSS
- Accessible components with Headless UI

## 📋 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router 6** - Routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Headless UI** - Accessible components
- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18n
- **Vite** - Build tool

### Backend
- **Flask 3.0** - Web framework
- **Flask-JWT-Extended** - JWT authentication
- **PyMongo** - MongoDB driver
- **Flask-CORS** - Cross-origin resource sharing
- **Python 3.8+**
- **Flask-Mail** - Email notifications

### Desktop Applications
- **WPF (Windows Presentation Foundation)** - Fingerprint Admin UI
- **.NET 6.0** - Console Application for attendance
- **C#** - Desktop development
- **ZKTeco SDK** - Fingerprint device integration

### Database
- **MongoDB** - NoSQL database

## 📁 Project Structure

```
Employees_Managements/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py              # Configuration settings
│   ├── database.py            # MongoDB connection
│   ├── requirements.txt       # Python dependencies
│   ├── create_admin.py        # Admin user creation script
│   ├── models/
│   │   ├── user_model.py
│   │   ├── leave_model.py
│   │   ├── salary_advance_model.py
│   │   ├── project_model.py
│   │   ├── company_model.py
│   │   ├── fingerprint_model.py
│   │   ├── attendance_model.py
│   │   ├── notif_model.py
│   │   └── settings_model.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── user_routes.py
│   │   ├── leave_routes.py
│   │   ├── salary_advance_routes.py
│   │   ├── project_routes.py
│   │   ├── company_routes.py
│   │   ├── dashboard_routes.py
│   │   ├── notification_routes.py
│   │   ├── notif_routes.py
│   │   ├── fingerprint_routes.py
│   │   ├── attendance_routes.py
│   │   └── settings_route.py
│   ├── services/
│   │   ├── email_service.py
│   │   └── attendance_service.py
│   └── utils/
│       └── auth_utils.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Toast.jsx
│       │   ├── ConfirmDialog.jsx
│       │   ├── AttendanceSummary.jsx
│       │   ├── DailySummary.jsx
│       │   ├── LeaveBalanceChart.jsx
│       │   ├── LeaveTrendsChart.jsx
│       │   ├── RecentActivityCard.jsx
│       │   ├── RequestsOverviewChart.jsx
│       │   ├── SystemHealthCard.jsx
│       │   └── employees/
│       │       └── AddEmployeeModal.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── i18n/
│       │   ├── config.js
│       │   └── locales/
│       │       ├── en/
│       │       ├── fr/
│       │       └── ar/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── SupervisorDashboard.jsx
│       │   ├── EmployeeDashboard.jsx
│       │   ├── Employees.jsx
│       │   ├── Leaves.jsx
│       │   ├── SalaryAdvances.jsx
│       │   ├── Projects.jsx
│       │   ├── Attendance.jsx
│       │   ├── FingerprintManagement.jsx
│       │   ├── Profile.jsx
│       │   ├── Settings.jsx
│       │   └── NotFound.jsx
│       └── services/
│           └── api.js
└── desktop/
    ├── Fingerprint.AdminUI/     # WPF Admin Application
    │   ├── App.xaml
    │   ├── MainWindow.xaml
    │   ├── ViewModels/
    │   ├── Views/
    │   ├── Services/
    │   └── Models/
    └── FingerprintAttendanceApp/ # Console Attendance App
        ├── Program.cs
        ├── Services/
        └── Models/
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB 4.4+
- .NET 6.0+ (for desktop applications)
- ZKTeco fingerprint device (optional, for attendance)

### Quick Start

**Windows Users:** Use the provided batch files for easy setup!

#### Backend
```bash
cd backend
start-backend.bat
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Detailed Setup

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
# Copy example env file
copy .env.example .env

# Edit .env file with your configuration:
# - MongoDB URI
# - JWT secrets
# - SMTP settings
```

5. **Start MongoDB:**
```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGO_URI in .env
```

6. **Create admin user (first time only):**
```bash
python create_admin.py
```

7. **Run the backend:**
```bash
python app.py
# Or use: start-backend.bat
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (optional):**
```bash
# Create .env file if you need to change API URL
VITE_API_URL=http://localhost:5000
```

4. **Start development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Desktop Applications Setup (Optional)

#### Fingerprint Admin UI (WPF)

1. **Navigate to desktop directory:**
```bash
cd desktop/Fingerprint.AdminUI
```

2. **Build and run:**
```bash
dotnet build
dotnet run
# Or use: run.bat
```

#### Fingerprint Attendance Console App

1. **Navigate to attendance app:**
```bash
cd desktop/FingerprintAttendanceApp
```

2. **Configure settings:**
Edit `appsettings.json` with your backend API URL and device settings.

3. **Run the application:**
```bash
dotnet run
```

## 🔑 Default Credentials

```
Email: admin@hrmanagement.com
Password: admin123
```

**⚠️ IMPORTANT:** Change these credentials in production!

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  employee_id: String (unique),
  email: String (unique),
  password: String (hashed),
  first_name: String,
  last_name: String,
  role: String (admin|supervisor|employee),
  company_id: String,
  department: String,
  position: String,
  phone: String,
  is_active: Boolean,
  leave_balance: {
    annual: Number,
    sick: Number,
    unpaid: Number
  },
  created_at: Date,
  updated_at: Date
}
```

### Leaves Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  user_name: String,
  user_email: String,
  company_id: String,
  leave_type: String (annual|sick|unpaid),
  start_date: String,
  end_date: String,
  days: Number,
  reason: String,
  status: String (pending|approved|rejected),
  reviewed_by: String,
  reviewed_at: Date,
  review_comment: String,
  created_at: Date,
  updated_at: Date
}
```

### Salary Advances Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  user_name: String,
  user_email: String,
  company_id: String,
  amount: Number,
  reason: String,
  status: String (pending|approved|rejected),
  reviewed_by: String,
  reviewed_at: Date,
  review_comment: String,
  created_at: Date,
  updated_at: Date
}
```

### Companies Collection
```javascript
{
  _id: ObjectId,
  name: String,
  annual_leave_days: Number,
  sick_leave_days: Number,
  unpaid_leave_days: Number,
  created_at: Date,
  updated_at: Date
}
```

### Projects Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  company_id: String,
  start_date: String,
  end_date: String,
  is_active: Boolean,
  assigned_employees: [String],
  created_at: Date,
  updated_at: Date
}
```

## 🔌 API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🎨 Features by Role

### Admin
- Full system access
- Employee management (create, update, deactivate)
- Company management
- Project management
- Leave & salary advance approvals
- Fingerprint enrollment and management
- Attendance tracking and reports
- In-app notification management
- SMTP configuration
- System-wide dashboard with comprehensive analytics
- User role management

### Supervisor
- View employees in their company
- Approve/reject leave requests
- Approve/reject salary advances
- Project management within company
- View attendance records
- Company-specific dashboard
- Team analytics

### Employee
- View personal dashboard
- Submit leave requests
- Submit salary advance requests
- View personal leave balance
- View attendance history
- Update profile
- Receive real-time notifications
- Track request status

## 📧 Email Notifications

Configure SMTP settings in admin panel:
- Leave approval/rejection notifications
- Salary advance approval/rejection notifications
- Customizable email templates
- Test email functionality
- Automated notification delivery

## 🌐 Multi-Language Support

The application supports three languages:
- **English (en)** - Default
- **French (fr)**
- **Arabic (ar)** - with RTL support

**Switching Languages:**
- Click the language selector in the navbar
- Changes apply immediately across the entire application
- User preference is saved in localStorage

**Translation Coverage:**
- All UI components
- Form labels and validation messages
- Dashboard analytics
- Notification messages
- Date and time formats

For more details, see [I18N_TRANSLATION_SUMMARY.md](./I18N_TRANSLATION_SUMMARY.md)

## 🚀 Production Deployment

### Backend Deployment

1. **Update configuration:**
   - Set `SECRET_KEY` and `JWT_SECRET_KEY` to strong random values
   - Configure production MongoDB URI
   - Set up SMTP credentials

2. **Use production WSGI server:**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend Deployment

1. **Build for production:**
```bash
npm run build
```

2. **Deploy the `dist` folder to your hosting service**

3. **Update API URL:**
   - Set `VITE_API_URL` environment variable to your backend URL

## 🔒 Security Best Practices

- ✅ JWT token authentication
- ✅ Password hashing with Werkzeug
- ✅ Role-based access control
- ✅ Input validation
- ✅ CORS configuration
- ⚠️ Change default credentials
- ⚠️ Use environment variables for secrets
- ⚠️ Enable HTTPS in production
- ⚠️ Regular security updates

## 🧪 Testing

### Test User Accounts

Create test accounts with different roles to test the system:

**Admin:**
```
Email: admin@hrmanagement.com
Password: admin123
```

**Supervisor (Create via admin panel):**
```
Role: supervisor
```

**Employee (Create via admin panel):**
```
Role: employee
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## � Additional Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete REST API reference
- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed project architecture
- [Quick Start Guide](./QUICK_START.md) - Get started quickly
- [Running Guide](./RUNNING_GUIDE.md) - Detailed running instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [i18n Translation Summary](./I18N_TRANSLATION_SUMMARY.md) - Internationalization details

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Contact: support@hrmanagement.com

## 🎯 Roadmap

- [x] Multi-language support (English, French, Arabic)
- [x] Attendance tracking with fingerprint devices
- [x] Role-based dashboards
- [x] In-app notification system
- [x] Desktop fingerprint management UI
- [ ] Advanced performance reporting
- [ ] Payroll management integration
- [ ] Document management system
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and BI dashboards
- [ ] Shift scheduling
- [ ] Time-off calendars
- [ ] Employee self-service portal enhancements

---

**Built with ❤️ using React, Flask, MongoDB, and .NET**

**Key Technologies:** React 18 • Flask 3.0 • MongoDB • WPF • i18next • Tailwind CSS • ZKTeco SDK
