namespace Fingerprint.AdminUI.Models
{
    /// <summary>
    /// Employee model matching the backend schema
    /// </summary>
    public class Employee
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        
        public string FullName => $"{FirstName} {LastName}";
    }
}
