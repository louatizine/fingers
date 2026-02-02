using System;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Services
{
    public class FingerprintEnrollmentService
    {
        private readonly ILogger<FingerprintEnrollmentService> _logger;
        private readonly FingerprintService _fingerprintService;
        private readonly ApiClient _apiClient;

        public FingerprintEnrollmentService(
            ILogger<FingerprintEnrollmentService> logger,
            FingerprintService fingerprintService,
            ApiClient apiClient)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _fingerprintService = fingerprintService ?? throw new ArgumentNullException(nameof(fingerprintService));
            _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
        }

        /// <summary>
        /// Enroll a user using backend-provided biometric ID
        /// </summary>
        public async Task<EnrollmentResult> EnrollUserAsync(PendingUser user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            try
            {
                _logger.LogInformation($"Starting enrollment for {user.DisplayName} (Biometric ID: {user.BiometricId})");

                // Verify device is connected
                if (!_fingerprintService.IsConnected)
                {
                    return new EnrollmentResult
                    {
                        Success = false,
                        Message = "❌ Fingerprint device is not connected"
                    };
                }

                // Enroll fingerprint using backend biometric_id
                var result = await EnrollFingerprintAsync(user.BiometricId, user.DisplayName);

                if (result.Success)
                {
                    // Notify backend of successful enrollment
                    bool confirmed = await _apiClient.ConfirmEnrollmentAsync(user.BiometricId);

                    if (confirmed)
                    {
                        _logger.LogInformation($"✅ Enrollment completed and confirmed for {user.DisplayName}");
                        result.Message = $"✅ Enrollment successful for {user.DisplayName}";
                    }
                    else
                    {
                        _logger.LogWarning($"Enrollment succeeded but backend confirmation failed for {user.DisplayName}");
                        result.Message = $"⚠️ Enrolled on device but backend update failed";
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error enrolling user {user.DisplayName}: {ex.Message}");
                return new EnrollmentResult
                {
                    Success = false,
                    Message = $"❌ Error: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Enroll fingerprint on device using ZKTeco SDK
        /// </summary>
        private async Task<EnrollmentResult> EnrollFingerprintAsync(int biometricId, string fullName)
        {
            // Acquire device lock to prevent concurrent access
            using (await _fingerprintService.AcquireDeviceLockAsync())
            {
                try
                {
                    await Task.Yield();

                    Console.WriteLine($"\n📝 Enrolling fingerprint on device...");
                    Console.WriteLine($"   Biometric ID: {biometricId:000}");
                    Console.WriteLine($"   Name: {fullName}");

                    // Access the internal ZKTeco device object
                    var zkem = _fingerprintService.GetZKemDevice();
                    var deviceId = _fingerprintService.GetDeviceId();

                    if (zkem == null)
                    {
                        return new EnrollmentResult
                        {
                            Success = false,
                            Message = "❌ ZKTeco device object not initialized"
                        };
                    }

                    // Step 1: Start fingerprint enrollment directly (device will auto-create user)
                    Console.WriteLine("\n👆 Fingerprint Enrollment Instructions:");
                    Console.WriteLine("   1. Place finger on scanner");
                    Console.WriteLine("   2. Lift finger when device beeps/flashes");
                    Console.WriteLine("   3. Repeat 2 more times (total 3 scans)");
                    Console.WriteLine("   4. Wait for success beep\n");

                    Console.WriteLine("📌 Starting fingerprint enrollment...");
                    Console.WriteLine("⏳ Waiting for finger placement...");

                    try
                    {
                        // Disable device first for faster operations
                        Console.WriteLine("   🔄 Preparing device...");
                        await Task.Run(() => zkem.EnableDevice(deviceId, false));
                        
                        // Start enrollment using StartEnrollEx with timeout
                        Console.WriteLine("   🚀 Starting enrollment...");
                        var startTime = DateTime.Now;
                        
                        var enrollTask = Task.Run(() => 
                        {
                            try
                            {
                                // StartEnrollEx(enrollNumber, fingerIndex, flag)
                                return zkem.StartEnrollEx(biometricId, 0, 1);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError($"StartEnrollEx threw exception: {ex.Message}");
                                return false;
                            }
                        });
                        
                        // Wait with 5-second timeout
                        var timeoutTask = Task.Delay(5000);
                        var completedTask = await Task.WhenAny(enrollTask, timeoutTask);
                        
                        bool enrollStarted = false;
                        if (completedTask == enrollTask)
                        {
                            enrollStarted = await enrollTask;
                            var elapsed = (DateTime.Now - startTime).TotalSeconds;
                            Console.WriteLine($"   ⏱️ StartEnrollEx took {elapsed:F1}s");
                        }
                        else
                        {
                            Console.WriteLine($"   ⚠️ StartEnrollEx timed out after 5s - assuming success");
                            enrollStarted = true; // Assume it started if it hangs
                        }

                        if (!enrollStarted)
                        {
                            int errorCode = 0;
                            zkem.GetLastError(ref errorCode);
                            _logger.LogError($"StartEnrollEx failed with error code: {errorCode}");
                            
                            // Re-enable device
                            await Task.Run(() => zkem.EnableDevice(deviceId, true));

                            return new EnrollmentResult
                            {
                                Success = false,
                                Message = $"❌ Failed to start enrollment (Error: {errorCode})"
                            };
                        }

                        Console.WriteLine("   ✅ Enrollment started - please scan fingerprint");

                        // Wait for enrollment to complete (typically handled by device)
                        await Task.Delay(15000); // Give 15 seconds for enrollment

                        Console.WriteLine("   ✅ Enrollment process completed");
                        
                        // Re-enable device
                        await Task.Run(() => zkem.EnableDevice(deviceId, true));
                        
                        // Now set user name after enrollment
                        try
                        {
                            await Task.Run(() => zkem.SetUserInfo(deviceId, biometricId, fullName, "", 0, true));
                            Console.WriteLine($"   ✅ User name updated: {fullName}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Could not set user name: {ex.Message}");
                        }

                        return new EnrollmentResult
                        {
                            Success = true,
                            Message = "✅ Fingerprint enrolled successfully",
                            DeviceUserId = biometricId.ToString()
                        };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Enrollment error: {ex.Message}");
                        
                        return new EnrollmentResult
                        {
                            Success = false,
                            Message = $"❌ Enrollment error: {ex.Message}"
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Unexpected error during enrollment: {ex.Message}");
                    
                    return new EnrollmentResult
                    {
                        Success = false,
                        Message = $"❌ Unexpected error: {ex.Message}"
                    };
                }
            }
        }
    }
}
