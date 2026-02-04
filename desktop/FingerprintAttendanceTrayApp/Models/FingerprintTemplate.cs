using System;

namespace FingerprintAttendanceApp.Services
{
    public class FingerprintTemplate
    {
        public byte[] TemplateData { get; set; } = Array.Empty<byte>();
        public int DeviceUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}