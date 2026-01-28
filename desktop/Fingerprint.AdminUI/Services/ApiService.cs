using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Fingerprint.AdminUI.Models;

namespace Fingerprint.AdminUI.Services
{
    /// <summary>
    /// Central API service for communicating with:
    /// 1. Local Windows Service (http://localhost:5001) - for fingerprint operations
    /// 2. Backend API (http://localhost:5000) - for attendance data
    /// 
    /// This class handles ALL HTTP communication
    /// Uses dependency injection and is registered as a singleton
    /// </summary>
    public class ApiService
    {
        private readonly HttpClient _localServiceClient;
        private readonly HttpClient _backendClient;
        private readonly JsonSerializerOptions _jsonOptions;

        // API Endpoints
        private const string LOCAL_SERVICE_BASE_URL = "http://localhost:5001";
        private const string BACKEND_BASE_URL = "http://localhost:5000/api";

        public ApiService(IHttpClientFactory httpClientFactory)
        {
            _localServiceClient = httpClientFactory.CreateClient("LocalService");
            _backendClient = httpClientFactory.CreateClient("Backend");

            // Configure JSON serialization (camelCase for backend)
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
        }

        #region Device Operations (Local Service)

        /// <summary>
        /// Get the status of the fingerprint device
        /// Endpoint: GET /device/status
        /// </summary>
        public async Task<DeviceStatus?> GetDeviceStatusAsync()
        {
            try
            {
                var response = await _localServiceClient.GetAsync("/device/status");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<DeviceStatus>(_jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting device status: {ex.Message}");
                return null;
            }
        }

        #endregion

        #region Enrollment Operations (Local Service)

        /// <summary>
        /// Start fingerprint enrollment for a new user
        /// Endpoint: POST /enroll
        /// The Windows Service will handle the actual fingerprint scanning
        /// </summary>
        public async Task<EnrollmentResponse?> StartEnrollmentAsync(EnrollmentRequest request)
        {
            try
            {
                var response = await _localServiceClient.PostAsJsonAsync("/enroll", request, _jsonOptions);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<EnrollmentResponse>(_jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error starting enrollment: {ex.Message}");
                return new EnrollmentResponse
                {
                    Success = false,
                    Message = $"Enrollment failed: {ex.Message}"
                };
            }
        }

        #endregion

        #region Attendance Operations (Backend API)

        /// <summary>
        /// Get recent attendance logs
        /// Endpoint: GET /attendance?limit=20
        /// </summary>
        public async Task<List<AttendanceLog>> GetRecentAttendanceAsync(int limit = 20)
        {
            try
            {
                var response = await _backendClient.GetAsync($"attendance?limit={limit}");
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<AttendanceApiResponse>(_jsonOptions);
                return result?.Data ?? new List<AttendanceLog>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting attendance logs: {ex.Message}");
                return new List<AttendanceLog>();
            }
        }

        /// <summary>
        /// Get daily summary for an employee
        /// Endpoint: GET /attendance/daily-summary/{employeeId}?date={date}
        /// </summary>
        public async Task<DailySummary?> GetDailySummaryAsync(string employeeId, string date)
        {
            try
            {
                var response = await _backendClient.GetAsync($"attendance/daily-summary/{employeeId}?date={date}");
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<DailySummaryResponse>(_jsonOptions);
                return result?.Data;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting daily summary: {ex.Message}");
                return null;
            }
        }

        #endregion

        #region Settings Operations (Backend API)

        /// <summary>
        /// Get attendance settings from backend
        /// Endpoint: GET /settings/attendance
        /// </summary>
        public async Task<AttendanceSettings?> GetAttendanceSettingsAsync()
        {
            try
            {
                var response = await _backendClient.GetAsync("settings/attendance");
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<SettingsApiResponse>(_jsonOptions);
                return result?.Data;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting attendance settings: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Update attendance settings
        /// Endpoint: PUT /settings/attendance
        /// </summary>
        public async Task<bool> UpdateAttendanceSettingsAsync(AttendanceSettings settings)
        {
            try
            {
                var response = await _backendClient.PutAsJsonAsync("settings/attendance", settings, _jsonOptions);
                response.EnsureSuccessStatusCode();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating attendance settings: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region User Operations (Backend API)

        /// <summary>
        /// Get next available employee ID from backend
        /// Endpoint: GET /terminal/next-employee-id
        /// </summary>
        public async Task<string?> GetNextEmployeeIdAsync()
        {
            try
            {
                Console.WriteLine($"[ApiService] Fetching next employee ID from: {_backendClient.BaseAddress}terminal/next-employee-id");
                
                var response = await _backendClient.GetAsync("terminal/next-employee-id");
                
                Console.WriteLine($"[ApiService] Response status: {response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<NextEmployeeIdResponse>(_jsonOptions);
                    Console.WriteLine($"[ApiService] Parsed Employee ID: {result?.EmployeeId}");
                    
                    return result?.EmployeeId;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[ApiService] Error response: {errorContent}");
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ApiService] Exception getting next employee ID: {ex.Message}");
                Console.WriteLine($"[ApiService] Stack trace: {ex.StackTrace}");
                return null;
            }
        }

        /// <summary>
        /// Create user directly in backend (without fingerprint for now)
        /// Endpoint: POST /terminal/users
        /// </summary>
        public async Task<EnrollmentResponse> CreateUserDirectlyAsync(EnrollmentRequest request)
        {
            try
            {
                var userData = new
                {
                    employee_id = request.EmployeeId,
                    email = $"{request.EmployeeId.ToLower()}@company.com", // Auto-generate email
                    first_name = request.FirstName,
                    last_name = request.LastName,
                    department = request.Department ?? "",
                    role = "employee",
                    company_id = (string?)null
                };

                Console.WriteLine($"[ApiService] Attempting to create user at: {_backendClient.BaseAddress}terminal/users");
                Console.WriteLine($"[ApiService] User data: {JsonSerializer.Serialize(userData, _jsonOptions)}");

                var response = await _backendClient.PostAsJsonAsync("terminal/users", userData, _jsonOptions);
                
                Console.WriteLine($"[ApiService] Response status: {response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[ApiService] Success response: {responseContent}");
                    
                    return new EnrollmentResponse
                    {
                        Success = true,
                        Message = "User created successfully (fingerprint enrollment pending SDK integration)",
                        Quality = 100
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[ApiService] Error response: {errorContent}");
                    
                    // Try to parse error as JSON
                    try
                    {
                        var errorJson = JsonSerializer.Deserialize<ErrorResponse>(errorContent, _jsonOptions);
                        var errorMsg = errorJson?.Error ?? errorJson?.Message ?? errorContent;
                        
                        // Improve the error message for duplicate employee ID
                        if (errorMsg.Contains("already exists") || errorMsg.Contains("duplicate"))
                        {
                            errorMsg += "\n\nTip: The Employee ID is auto-generated when you open this form. If you see this error, please close and reopen the Enroll User tab to get a fresh ID.";
                        }
                        
                        return new EnrollmentResponse
                        {
                            Success = false,
                            Message = errorMsg
                        };
                    }
                    catch
                    {
                        // If not JSON, return raw content (might be HTML error page)
                        return new EnrollmentResponse
                        {
                            Success = false,
                            Message = $"Server error ({response.StatusCode}): Backend may not be running. Please ensure the Flask backend is running on http://localhost:5000"
                        };
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"[ApiService] HTTP Request error: {ex.Message}");
                return new EnrollmentResponse
                {
                    Success = false,
                    Message = $"Cannot connect to backend server. Please ensure the Flask backend is running on http://localhost:5000.\n\nError: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ApiService] Unexpected error: {ex.Message}");
                Console.WriteLine($"[ApiService] Stack trace: {ex.StackTrace}");
                return new EnrollmentResponse
                {
                    Success = false,
                    Message = $"Unexpected error: {ex.Message}"
                };
            }
        }

        #endregion

        #region API Response Models

        // These classes match the backend API response format
        private class AttendanceApiResponse
        {
            public bool Success { get; set; }
            public List<AttendanceLog>? Data { get; set; }
        }

        private class DailySummaryResponse
        {
            public bool Success { get; set; }
            public DailySummary? Data { get; set; }
        }

        private class SettingsApiResponse
        {
            public bool Success { get; set; }
            public AttendanceSettings? Data { get; set; }
        }
        
        private class NextEmployeeIdResponse
        {
            public string? EmployeeId { get; set; }
        }
        
        private class ErrorResponse
        {
            public string? Error { get; set; }
            public string? Message { get; set; }
        }

        #endregion
    }

    #region Additional Models

    /// <summary>
    /// Daily attendance summary with worked hours
    /// </summary>
    public class DailySummary
    {
        public string Date { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string? CheckIn { get; set; }
        public string? CheckOut { get; set; }
        public double? WorkedHours { get; set; }
        public double? TotalHours { get; set; }
        public double? LunchBreakHours { get; set; }
        public bool IsComplete { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    #endregion
}
