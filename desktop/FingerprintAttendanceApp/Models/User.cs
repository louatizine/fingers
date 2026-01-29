using Newtonsoft.Json;
using System;

namespace FingerprintAttendanceApp.Models
{
    public class User
    {
        [JsonProperty("_id")]
        public string? Id { get; set; }
        
        [JsonProperty("employee_id")]
        public string? EmployeeId { get; set; }
        
        [JsonProperty("first_name")]
        public string? FirstName { get; set; }
        
        [JsonProperty("last_name")]
        public string? LastName { get; set; }
        
        [JsonProperty("full_name")]
        public string? FullName { get; set; }
        
        [JsonProperty("email")]
        public string? Email { get; set; }
        
        [JsonProperty("department")]
        public string? Department { get; set; }
        
        [JsonProperty("position")]
        public string? Position { get; set; }
        
        [JsonProperty("has_fingerprint")]
        public bool HasFingerprint { get; set; }
        
        [JsonProperty("fingerprint_device_id")]
        public string? FingerprintDeviceId { get; set; }
        
        [JsonProperty("fingerprint_template_id")]
        public string? FingerprintTemplateId { get; set; }
        
        [JsonProperty("fingerprint_enrolled_at")]
        public DateTime? FingerprintEnrolledAt { get; set; }
        
        [JsonProperty("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        [JsonProperty("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        
        // Helper property for display
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : $"{FirstName} {LastName}".Trim();
        
        public override string ToString()
        {
            return $"User: {DisplayName} (ID: {EmployeeId}, Email: {Email}, Department: {Department})";
        }
    }
}