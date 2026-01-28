namespace FingerprintAttendanceApp.Models
{
    public class FingerprintTemplate
    {
        public byte[]? TemplateData { get; set; }
        public int DeviceUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}