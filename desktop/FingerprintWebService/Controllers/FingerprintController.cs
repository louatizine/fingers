using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Text.Json;

namespace FingerprintWebService.Controllers;

[ApiController]
[Route("")]
public class FingerprintController : ControllerBase
{
    private static bool _deviceConnected = true; // Simulated for now
    private static readonly Random _random = new();
    private static readonly HttpClient _backendClient = new()
    {
        BaseAddress = new Uri("http://localhost:5000")
    };

    /// <summary>
    /// Get device status
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            isConnected = _deviceConnected,
            deviceName = "Simulated Fingerprint Scanner",
            lastCheck = DateTime.Now
        });
    }

    /// <summary>
    /// Enroll a new user
    /// </summary>
    [HttpPost("enroll")]
    public async Task<IActionResult> EnrollUser([FromBody] EnrollRequest request)
    {
        if (string.IsNullOrEmpty(request.EmployeeId))
            return BadRequest(new { success = false, message = "Employee ID required" });

        Console.WriteLine($"[ENROLL] Starting enrollment for: {request.FirstName} {request.LastName} (ID: {request.EmployeeId})");

        // Simulate enrollment process
        await Task.Delay(2000); // Simulate fingerprint capture

        // Always succeed for testing (change to _random.Next(0, 10) > 1 for 90% success rate)
        var success = true;

        if (success)
        {
            var templateId = Guid.NewGuid().ToString();
            Console.WriteLine($"[ENROLL] ✅ Success! Template ID: {templateId}");
            
            // Save to backend database
            try
            {
                var userData = new
                {
                    employee_id = request.EmployeeId,
                    first_name = request.FirstName,
                    last_name = request.LastName,
                    email = $"{request.FirstName.ToLower()}.{request.LastName.ToLower()}@company.com",
                    department = request.Department ?? "General",
                    role = "employee"
                };

                var response = await _backendClient.PostAsJsonAsync("/api/terminal/users", userData);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[ENROLL] 💾 User saved to database");
                }
                else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    // User might already exist - that's okay, just update fingerprint
                    Console.WriteLine($"[ENROLL] ℹ️ User exists, updating fingerprint only");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[ENROLL] ⚠️ Database save failed: {error}");
                }
                
                // Always save/update the fingerprint template
                var templateData = new
                {
                    template_id = templateId,
                    device_id = "WEB_ENROLLMENT"
                };
                
                var templateResponse = await _backendClient.PostAsJsonAsync(
                    $"/api/fingerprint/update-template/{request.EmployeeId}", 
                    templateData);
                
                if (templateResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[ENROLL] ✅ Fingerprint template saved");
                }
                else
                {
                    Console.WriteLine($"[ENROLL] ⚠️ Template save warning: {await templateResponse.Content.ReadAsStringAsync()}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ENROLL] ⚠️ Database error: {ex.Message}");
            }
            
            return Ok(new
            {
                success = true,
                message = "Enrollment successful",
                templateId = templateId,
                employeeId = request.EmployeeId
            });
        }
        else
        {
            Console.WriteLine($"[ENROLL] ❌ Failed - Poor fingerprint quality");
            return Ok(new
            {
                success = false,
                message = "Enrollment failed - Please try again with better finger placement"
            });
        }
    }

    /// <summary>
    /// Verify a fingerprint
    /// </summary>
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyFingerprint()
    {
        Console.WriteLine($"[VERIFY] Waiting for fingerprint...");

        // Simulate verification
        await Task.Delay(1500);

        var success = _random.Next(0, 10) > 2; // 80% success rate

        if (success)
        {
            var employeeId = $"EMP{_random.Next(1000, 9999)}";
            Console.WriteLine($"[VERIFY] ✅ Match found! Employee: {employeeId}");
            
            return Ok(new
            {
                success = true,
                message = "Fingerprint verified",
                employeeId = employeeId,
                timestamp = DateTime.Now
            });
        }
        else
        {
            Console.WriteLine($"[VERIFY] ❌ No match found");
            return Ok(new
            {
                success = false,
                message = "Fingerprint not recognized"
            });
        }
    }
}

public record EnrollRequest(
    string EmployeeId,
    string FirstName,
    string LastName,
    string? Department
);
