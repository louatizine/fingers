using Newtonsoft.Json;
using System;

namespace FingerprintAttendanceApp.Models
{
    public class PendingUser
    {
        [JsonProperty("employee_id")]
        public string? EmployeeId { get; set; }
        
        [JsonProperty("biometric_id")]
        public int BiometricId { get; set; }
        
        [JsonProperty("first_name")]
        public string? FirstName { get; set; }
        
        [JsonProperty("last_name")]
        public string? LastName { get; set; }
        
        [JsonProperty("full_name")]
        public string? FullName { get; set; }
        
        [JsonProperty("department")]
        public string? Department { get; set; }
        
        [JsonProperty("position")]
        public string? Position { get; set; }
        
        [JsonProperty("fingerprint_status")]
        public string? FingerprintStatus { get; set; }
        
        [JsonProperty("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        // Helper property for display
        public string DisplayName => FullName ?? $"{FirstName} {LastName}".Trim();
        
        public string DisplayInfo => $"{DisplayName} ({EmployeeId}) - {Department ?? "N/A"}";
    }
}
