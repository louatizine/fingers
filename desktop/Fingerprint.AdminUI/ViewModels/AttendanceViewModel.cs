using Fingerprint.AdminUI.Helpers;
using System;
using System.ComponentModel;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace Fingerprint.AdminUI.ViewModels
{
    public class AttendanceViewModel : ViewModelBase
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:5000/api";

        private string _employeeId = string.Empty;
        private string _employeeName = string.Empty;
        private string _statusMessage = string.Empty;
        private Brush _statusColor = Brushes.Black;
        private DateTime? _lastActionTime;
        private DateTime? _todayCheckIn;
        private DateTime? _todayCheckOut;
        private double? _workedHours;
        private bool _showSummary;

        public AttendanceViewModel()
        {
            _httpClient = new HttpClient();
            CheckInCommand = new RelayCommand(async _ => await CheckInAsync(), _ => CanExecuteAttendance());
            CheckOutCommand = new RelayCommand(async _ => await CheckOutAsync(), _ => CanExecuteAttendance());
        }

        public ICommand CheckInCommand { get; }
        public ICommand CheckOutCommand { get; }

        public string EmployeeId
        {
            get => _employeeId;
            set
            {
                if (SetProperty(ref _employeeId, value))
                {
                    CommandManager.InvalidateRequerySuggested();
                    _ = LoadEmployeeInfoAsync();
                }
            }
        }

        public string EmployeeName
        {
            get => _employeeName;
            set => SetProperty(ref _employeeName, value);
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public Brush StatusColor
        {
            get => _statusColor;
            set => SetProperty(ref _statusColor, value);
        }

        public DateTime? LastActionTime
        {
            get => _lastActionTime;
            set => SetProperty(ref _lastActionTime, value);
        }

        public DateTime? TodayCheckIn
        {
            get => _todayCheckIn;
            set => SetProperty(ref _todayCheckIn, value);
        }

        public DateTime? TodayCheckOut
        {
            get => _todayCheckOut;
            set => SetProperty(ref _todayCheckOut, value);
        }

        public double? WorkedHours
        {
            get => _workedHours;
            set => SetProperty(ref _workedHours, value);
        }

        public bool ShowSummary
        {
            get => _showSummary;
            set => SetProperty(ref _showSummary, value);
        }

        private bool CanExecuteAttendance()
        {
            return !string.IsNullOrWhiteSpace(EmployeeId);
        }

        private async Task LoadEmployeeInfoAsync()
        {
            if (string.IsNullOrWhiteSpace(EmployeeId))
            {
                EmployeeName = string.Empty;
                ShowSummary = false;
                return;
            }

            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/users/public/{EmployeeId}");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<JsonElement>(json);
                    
                    var firstName = user.GetProperty("first_name").GetString() ?? "";
                    var lastName = user.GetProperty("last_name").GetString() ?? "";
                    EmployeeName = $"{firstName} {lastName}";

                    await LoadTodayAttendanceAsync();
                }
                else
                {
                    EmployeeName = string.Empty;
                    ShowSummary = false;
                }
            }
            catch
            {
                EmployeeName = string.Empty;
                ShowSummary = false;
            }
        }

        private async Task LoadTodayAttendanceAsync()
        {
            try
            {
                var today = DateTime.Now.ToString("yyyy-MM-dd");
                var response = await _httpClient.GetAsync($"{_baseUrl}/attendance/employee/{EmployeeId}?date={today}");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var data = JsonSerializer.Deserialize<JsonElement>(json);

                    TodayCheckIn = null;
                    TodayCheckOut = null;
                    WorkedHours = null;

                    if (data.TryGetProperty("attendance", out var attendance) && attendance.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var log in attendance.EnumerateArray())
                        {
                            var eventType = log.GetProperty("event_type").GetString();
                            var timestampStr = log.GetProperty("timestamp").GetString();
                            if (timestampStr != null)
                            {
                                var timestamp = DateTime.Parse(timestampStr);

                                if (eventType == "check_in")
                                    TodayCheckIn = timestamp;
                                else if (eventType == "check_out")
                                    TodayCheckOut = timestamp;
                            }
                        }
                    }

                    if (TodayCheckIn.HasValue && TodayCheckOut.HasValue)
                    {
                        WorkedHours = (TodayCheckOut.Value - TodayCheckIn.Value).TotalHours;
                    }

                    ShowSummary = TodayCheckIn.HasValue || TodayCheckOut.HasValue;
                }
            }
            catch
            {
                // Silently fail
            }
        }

        private async Task CheckInAsync()
        {
            await RecordAttendanceAsync("check_in");
        }

        private async Task CheckOutAsync()
        {
            await RecordAttendanceAsync("check_out");
        }

        private async Task RecordAttendanceAsync(string eventType)
        {
            try
            {
                StatusMessage = $"Recording {eventType.Replace("_", "-")}...";
                StatusColor = Brushes.Gray;

                var payload = new
                {
                    employee_id = EmployeeId,
                    event_type = eventType,
                    timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    device_id = "DESKTOP-MANUAL",
                    match_score = 100
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/attendance/manual", content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    LastActionTime = DateTime.Now;
                    StatusMessage = $"✓ {(eventType == "check_in" ? "Check-In" : "Check-Out")} recorded successfully!";
                    StatusColor = Brushes.Green;

                    // Reload today's attendance
                    await LoadTodayAttendanceAsync();
                }
                else
                {
                    var error = JsonSerializer.Deserialize<JsonElement>(responseJson);
                    var message = error.TryGetProperty("error", out var errorMsg) ? errorMsg.GetString() : "Unknown error";
                    StatusMessage = $"✗ Error: {message}";
                    StatusColor = Brushes.Red;
                }
            }
            catch (Exception ex)
            {
                StatusMessage = $"✗ Error: {ex.Message}";
                StatusColor = Brushes.Red;
            }
        }
    }
}
