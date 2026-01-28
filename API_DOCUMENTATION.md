# API Documentation

Base URL: `http://localhost:5000/api`

All endpoints (except authentication) require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Leaves](#leaves)
4. [Salary Advances](#salary-advances)
5. [Projects](#projects)
6. [Companies](#companies)
7. [Dashboard](#dashboard)
8. [Notifications](#notifications)

---

## Authentication

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "admin@hrmanagement.com",
  "password": "admin123"
}
```

Response:
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@hrmanagement.com",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin",
    "company_id": "507f1f77bcf86cd799439012",
    "leave_balance": {
      "annual": 20,
      "sick": 10,
      "unpaid": 5
    }
  }
}
```

### Get Current User
**GET** `/auth/me`

Response:
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@hrmanagement.com",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin"
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Headers:
```
Authorization: Bearer <refresh_token>
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Logout
**POST** `/auth/logout`

Response:
```json
{
  "message": "Logout successful"
}
```

---

## Users

### Get All Users
**GET** `/users`

**Role:** Admin, Supervisor

Response:
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "employee_id": "EMP001",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "employee",
      "company_id": "507f1f77bcf86cd799439012",
      "department": "Engineering",
      "position": "Software Engineer",
      "is_active": true,
      "leave_balance": {
        "annual": 15,
        "sick": 8,
        "unpaid": 5
      }
    }
  ]
}
```

### Get User by ID
**GET** `/users/:id`

Response:
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "employee_id": "EMP001",
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Create User
**POST** `/users`

**Role:** Admin

Request:
```json
{
  "employee_id": "EMP002",
  "email": "jane.smith@company.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "employee",
  "company_id": "507f1f77bcf86cd799439012",
  "department": "HR",
  "position": "HR Manager",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "message": "User created successfully",
  "user_id": "507f1f77bcf86cd799439013"
}
```

### Update User
**PUT** `/users/:id`

Request:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1234567890",
  "department": "Human Resources"
}
```

Response:
```json
{
  "message": "User updated successfully"
}
```

### Deactivate User
**DELETE** `/users/:id`

**Role:** Admin

Response:
```json
{
  "message": "User deactivated successfully"
}
```

---

## Leaves

### Get Leave Requests
**GET** `/leaves`

Response:
```json
{
  "leaves": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "user_id": "507f1f77bcf86cd799439011",
      "user_name": "John Doe",
      "user_email": "john.doe@company.com",
      "leave_type": "annual",
      "start_date": "2026-02-01",
      "end_date": "2026-02-05",
      "days": 5,
      "reason": "Family vacation",
      "status": "pending",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Get Leave by ID
**GET** `/leaves/:id`

Response:
```json
{
  "leave": {
    "_id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439011",
    "leave_type": "annual",
    "start_date": "2026-02-01",
    "end_date": "2026-02-05",
    "days": 5,
    "reason": "Family vacation",
    "status": "pending"
  }
}
```

### Create Leave Request
**POST** `/leaves`

Request:
```json
{
  "leave_type": "annual",
  "start_date": "2026-02-01",
  "end_date": "2026-02-05",
  "days": 5,
  "reason": "Family vacation"
}
```

Response:
```json
{
  "message": "Leave request created successfully",
  "leave_id": "507f1f77bcf86cd799439014"
}
```

### Approve Leave
**POST** `/leaves/:id/approve`

**Role:** Admin, Supervisor

Request:
```json
{
  "comment": "Approved for vacation"
}
```

Response:
```json
{
  "message": "Leave request approved"
}
```

### Reject Leave
**POST** `/leaves/:id/reject`

**Role:** Admin, Supervisor

Request:
```json
{
  "comment": "Please reschedule due to project deadline"
}
```

Response:
```json
{
  "message": "Leave request rejected"
}
```

### Delete Leave Request
**DELETE** `/leaves/:id`

Response:
```json
{
  "message": "Leave request deleted"
}
```

### Get Leave Statistics
**GET** `/leaves/statistics`

Response:
```json
{
  "statistics": {
    "pending": 3,
    "approved": 12,
    "rejected": 2,
    "total_days_taken": 45
  }
}
```

---

## Salary Advances

### Get Salary Advance Requests
**GET** `/salary-advances`

Response:
```json
{
  "salary_advances": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "user_id": "507f1f77bcf86cd799439011",
      "user_name": "John Doe",
      "user_email": "john.doe@company.com",
      "amount": 1000,
      "reason": "Medical emergency",
      "status": "pending",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Get Salary Advance by ID
**GET** `/salary-advances/:id`

Response:
```json
{
  "salary_advance": {
    "_id": "507f1f77bcf86cd799439015",
    "user_id": "507f1f77bcf86cd799439011",
    "amount": 1000,
    "reason": "Medical emergency",
    "status": "pending"
  }
}
```

### Create Salary Advance Request
**POST** `/salary-advances`

Request:
```json
{
  "amount": 1000,
  "reason": "Medical emergency"
}
```

Response:
```json
{
  "message": "Salary advance request created successfully",
  "advance_id": "507f1f77bcf86cd799439015"
}
```

### Approve Salary Advance
**POST** `/salary-advances/:id/approve`

**Role:** Admin, Supervisor

Request:
```json
{
  "comment": "Approved due to emergency"
}
```

Response:
```json
{
  "message": "Salary advance request approved"
}
```

### Reject Salary Advance
**POST** `/salary-advances/:id/reject`

**Role:** Admin, Supervisor

Request:
```json
{
  "comment": "Insufficient justification"
}
```

Response:
```json
{
  "message": "Salary advance request rejected"
}
```

### Delete Salary Advance Request
**DELETE** `/salary-advances/:id`

Response:
```json
{
  "message": "Salary advance request deleted"
}
```

### Get Salary Advance Statistics
**GET** `/salary-advances/statistics`

Response:
```json
{
  "statistics": {
    "pending": 2,
    "approved": 8,
    "rejected": 1,
    "total_amount_approved": 15000
  }
}
```

---

## Projects

### Get All Projects
**GET** `/projects`

Response:
```json
{
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Website Redesign",
      "description": "Complete redesign of company website",
      "company_id": "507f1f77bcf86cd799439012",
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "is_active": true,
      "assigned_employees": ["507f1f77bcf86cd799439011"]
    }
  ]
}
```

### Get Project by ID
**GET** `/projects/:id`

Response:
```json
{
  "project": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Website Redesign",
    "description": "Complete redesign of company website"
  }
}
```

### Create Project
**POST** `/projects`

**Role:** Admin, Supervisor

Request:
```json
{
  "name": "Mobile App Development",
  "description": "Develop iOS and Android apps",
  "company_id": "507f1f77bcf86cd799439012",
  "start_date": "2026-02-01",
  "end_date": "2026-12-31"
}
```

Response:
```json
{
  "message": "Project created successfully",
  "project_id": "507f1f77bcf86cd799439016"
}
```

### Update Project
**PUT** `/projects/:id`

**Role:** Admin, Supervisor

Request:
```json
{
  "description": "Updated project description",
  "end_date": "2026-07-31"
}
```

Response:
```json
{
  "message": "Project updated successfully"
}
```

### Assign Employee to Project
**POST** `/projects/:projectId/assign/:userId`

**Role:** Admin, Supervisor

Response:
```json
{
  "message": "Employee assigned to project"
}
```

### Remove Employee from Project
**POST** `/projects/:projectId/remove/:userId`

**Role:** Admin, Supervisor

Response:
```json
{
  "message": "Employee removed from project"
}
```

### Delete Project
**DELETE** `/projects/:id`

**Role:** Admin, Supervisor

Response:
```json
{
  "message": "Project deleted successfully"
}
```

---

## Companies

### Get All Companies
**GET** `/companies`

Response:
```json
{
  "companies": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Tech Solutions Inc.",
      "annual_leave_days": 20,
      "sick_leave_days": 10,
      "unpaid_leave_days": 5
    }
  ]
}
```

### Get Company by ID
**GET** `/companies/:id`

Response:
```json
{
  "company": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Tech Solutions Inc.",
    "annual_leave_days": 20,
    "sick_leave_days": 10,
    "unpaid_leave_days": 5
  }
}
```

### Create Company
**POST** `/companies`

**Role:** Admin

Request:
```json
{
  "name": "New Company Ltd.",
  "annual_leave_days": 22,
  "sick_leave_days": 12,
  "unpaid_leave_days": 5
}
```

Response:
```json
{
  "message": "Company created successfully",
  "company_id": "507f1f77bcf86cd799439017"
}
```

### Update Company
**PUT** `/companies/:id`

**Role:** Admin

Request:
```json
{
  "annual_leave_days": 25,
  "sick_leave_days": 15
}
```

Response:
```json
{
  "message": "Company updated successfully"
}
```

### Delete Company
**DELETE** `/companies/:id`

**Role:** Admin

Response:
```json
{
  "message": "Company deleted successfully"
}
```

---

## Dashboard

### Get Dashboard Statistics
**GET** `/dashboard/statistics`

Response (Admin):
```json
{
  "statistics": {
    "total_employees": 50,
    "active_employees": 48,
    "leave_stats": {
      "pending": 3,
      "approved": 25,
      "rejected": 2,
      "total_days_taken": 120
    },
    "salary_advance_stats": {
      "pending": 2,
      "approved": 15,
      "rejected": 1,
      "total_amount_approved": 25000
    },
    "pending_leaves": 3,
    "pending_salary_advances": 2,
    "total_projects": 10,
    "recent_leaves": [...],
    "recent_salary_advances": [...]
  }
}
```

### Get Pending Approvals
**GET** `/dashboard/pending-approvals`

**Role:** Admin, Supervisor

Response:
```json
{
  "pending_leaves": [...],
  "pending_salary_advances": [...]
}
```

---

## Notifications

### Get SMTP Settings
**GET** `/notifications/smtp-settings`

**Role:** Admin

Response:
```json
{
  "smtp_settings": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "noreply@company.com",
    "from_email": "noreply@company.com",
    "use_tls": true
  }
}
```

### Update SMTP Settings
**POST** `/notifications/smtp-settings`

**Role:** Admin

Request:
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "noreply@company.com",
  "password": "app-specific-password",
  "from_email": "noreply@company.com",
  "use_tls": true
}
```

Response:
```json
{
  "message": "SMTP settings updated successfully"
}
```

### Send Test Email
**POST** `/notifications/test-email`

**Role:** Admin

Request:
```json
{
  "test_email": "test@example.com"
}
```

Response:
```json
{
  "message": "Test email sent successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "An error occurred"
}
```

---

## Rate Limiting

Currently, there are no rate limits. In production, implement rate limiting to prevent abuse.

## Pagination

Currently, all list endpoints return all items. For production, implement pagination:

```
GET /users?page=1&limit=20
```

---

**API Version:** 1.0.0  
**Last Updated:** January 15, 2026
