# HR Management System - Complete ERP Solution

A comprehensive web-based HR Management System built with React, Flask, and MongoDB. Features include employee management, leave tracking, salary advances, and project management with role-based access control.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Supervisor, Employee)
- Secure password hashing
- Session management

### Employee Management
- Create, update, and deactivate employees
- Assign employees to projects
- Company-based organization
- Leave balance tracking

### Leave Management
- Multiple leave types (annual, sick, unpaid)
- Automatic balance calculation
- Company-specific leave policies
- Approval/rejection workflow
- Email notifications
- Real-time balance updates

### Salary Advance Requests
- Employee request submission
- Admin/Supervisor approval workflow
- Request history tracking
- Email notifications

### Dashboard & Analytics
- Role-specific dashboards
- Interactive charts (Recharts)
- Real-time statistics
- Pending approvals overview

### Notification System
- Configurable SMTP settings
- Email templates
- Automatic notifications for approvals/rejections

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Clean blue & white theme
- Professional UI with Tailwind CSS

## 📋 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router 6** - Routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Headless UI** - Accessible components
- **Vite** - Build tool

### Backend
- **Flask 3.0** - Web framework
- **Flask-JWT-Extended** - JWT authentication
- **PyMongo** - MongoDB driver
- **Flask-CORS** - Cross-origin resource sharing
- **Python 3.8+**

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
│   ├── models/
│   │   ├── user_model.py
│   │   ├── leave_model.py
│   │   ├── salary_advance_model.py
│   │   ├── project_model.py
│   │   └── company_model.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── user_routes.py
│   │   ├── leave_routes.py
│   │   ├── salary_advance_routes.py
│   │   ├── project_routes.py
│   │   ├── company_routes.py
│   │   ├── dashboard_routes.py
│   │   └── notification_routes.py
│   ├── services/
│   │   └── email_service.py
│   └── utils/
│       └── auth_utils.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Layout.jsx
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Employees.jsx
        │   ├── Leaves.jsx
        │   ├── SalaryAdvances.jsx
        │   ├── Projects.jsx
        │   ├── Profile.jsx
        │   ├── Settings.jsx
        │   └── NotFound.jsx
        └── services/
            └── api.js
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB 4.4+

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

6. **Run the backend:**
```bash
python app.py
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

3. **Start development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

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
- SMTP configuration
- System-wide dashboard

### Supervisor
- View employees in their company
- Approve/reject leave requests
- Approve/reject salary advances
- Project management
- Company-specific dashboard

### Employee
- View personal dashboard
- Submit leave requests
- Submit salary advance requests
- View personal leave balance
- Update profile

## 📧 Email Notifications

Configure SMTP settings in admin panel:
- Leave approval/rejection notifications
- Salary advance approval/rejection notifications
- Customizable email templates
- Test email functionality

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

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: support@hrmanagement.com

## 🎯 Roadmap

- [ ] Performance reporting
- [ ] Attendance tracking
- [ ] Payroll management
- [ ] Document management
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics

---

**Built with ❤️ using React, Flask, and MongoDB**
