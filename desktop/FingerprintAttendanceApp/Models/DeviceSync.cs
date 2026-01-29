namespace FingerprintAttendanceApp.Models
{
    public class DeviceSync
    {
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public int Port { get; set; } = 4370;
        public DateTime LastSync { get; set; }
        public int UserCount { get; set; }
        public bool IsOnline { get; set; }
        public string Location { get; set; } = string.Empty;
    }
}