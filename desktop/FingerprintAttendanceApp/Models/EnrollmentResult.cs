namespace FingerprintAttendanceApp.Models
{
    public class EnrollmentResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? DeviceUserId { get; set; }
        public string? Instructions { get; set; }
    }
}git init