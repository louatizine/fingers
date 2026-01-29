namespace FingerprintAttendanceApp.Services
{
    public class EnrollmentResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? DeviceUserId { get; set; }
        public string? Instructions { get; set; }
    }
}