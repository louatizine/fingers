namespace FingerprintAttendanceApp.Models
{
    public class AttendanceLog
    {
        public string? Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string? Notes { get; set; }
    }
}