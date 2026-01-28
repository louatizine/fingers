namespace Fingerprint.AdminUI.Models
{
    /// <summary>
    /// Attendance system settings for working hours and breaks
    /// </summary>
    public class AttendanceSettings
    {
        public string CheckInStart { get; set; } = "08:00";
        public string CheckOutEnd { get; set; } = "17:00";
        public string LunchBreakStart { get; set; } = "12:00";
        public string LunchBreakEnd { get; set; } = "13:00";
        public string[] WorkingDays { get; set; } = new[] { "Mon", "Tue", "Wed", "Thu", "Fri" };
    }
}
