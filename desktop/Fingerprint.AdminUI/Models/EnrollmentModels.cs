namespace Fingerprint.AdminUI.Models
{
    /// <summary>
    /// Enrollment request to send to the Windows Service
    /// </summary>
    public class EnrollmentRequest
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
    }
    
    /// <summary>
    /// Enrollment response from the Windows Service
    /// </summary>
    public class EnrollmentResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string TemplateData { get; set; } = string.Empty;
        public int Quality { get; set; }
    }
}
