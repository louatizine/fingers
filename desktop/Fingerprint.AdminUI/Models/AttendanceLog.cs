using System;

namespace Fingerprint.AdminUI.Models
{
    /// <summary>
    /// Attendance log entry from the backend
    /// </summary>
    public class AttendanceLog
    {
        public string Id { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string EventType { get; set; } = string.Empty; // "check_in" or "check_out"
        public string DeviceId { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        
        // Calculated fields (from backend)
        public double? WorkedHours { get; set; }
        public bool IsComplete { get; set; }
        
        // Display properties
        public string EventTypeDisplay => EventType == "check_in" ? "Check In" : "Check Out";
        public string TimeDisplay => Timestamp.ToLocalTime().ToString("HH:mm:ss");
        public string DateDisplay => Timestamp.ToLocalTime().ToString("yyyy-MM-dd");
    }
}
