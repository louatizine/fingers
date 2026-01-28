using Newtonsoft.Json;

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
        
        [JsonProperty("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        // Helper property for display
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : $"{FirstName} {LastName}".Trim();
        
        public override string ToString()
        {
            return $"User: {DisplayName} (ID: {EmployeeId}, Email: {Email}, Department: {Department})";
        }
    }
}