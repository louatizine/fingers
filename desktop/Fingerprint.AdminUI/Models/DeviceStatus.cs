namespace Fingerprint.AdminUI.Models
{
    /// <summary>
    /// Device status from the Windows Service
    /// </summary>
    public class DeviceStatus
    {
        public bool IsConnected { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string LastScanTime { get; set; } = string.Empty;
    }
}
