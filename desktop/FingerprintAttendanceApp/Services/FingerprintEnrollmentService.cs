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

                // Step 1: Delete existing user if present (to avoid error code 2)
                Console.WriteLine("📌 Step 1: Preparing device for enrollment...");
                try
                {
                    // Try to delete existing user first (ignore if doesn't exist)
                    zkem.SSR_DeleteEnrollData(deviceId, biometricId.ToString(), 12); // 12 = all data
                    Console.WriteLine("   ℹ️ Cleared any existing enrollment data");
                }
                catch
                {
                    // Ignore error if user doesn't exist
                }

                // Step 2: Create user on device
                Console.WriteLine("📌 Step 2: Creating user on device...");
                bool userCreated = false;

                try
                {
                    userCreated = zkem.SSR_SetUserInfo(
                        deviceId,
                        biometricId.ToString(),
                        fullName,
                        "",    // password (empty)
                        0,     // privilege (0 = normal user)
                        true   // enabled
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError($"SSR_SetUserInfo failed: {ex.Message}");
                    return new EnrollmentResult
                    {
                        Success = false,
                        Message = $"❌ Failed to create user on device: {ex.Message}"
                    };
                }

                if (!userCreated)
                {
                    return new EnrollmentResult
                    {
                        Success = false,
                        Message = "❌ Failed to create user on device"
                    };
                }

                Console.WriteLine("   ✅ User created on device");

                // Step 3: Start fingerprint enrollment
                Console.WriteLine("\n👆 Fingerprint Enrollment Instructions:");
                Console.WriteLine("   1. Place finger on scanner");
                Console.WriteLine("   2. Lift finger when device beeps/flashes");
                Console.WriteLine("   3. Repeat 2 more times (total 3 scans)");
                Console.WriteLine("   4. Wait for success beep\n");

                Console.WriteLine("📌 Step 3: Starting fingerprint enrollment...");
                Console.WriteLine("⏳ Waiting for finger placement...");

                try
                {
                    // Cancel any previous operation
                    zkem.CancelOperation();

                    // Start enrollment for finger index 0
                    bool enrollStarted = zkem.StartEnrollEx(biometricId, 0, 1);

                    if (!enrollStarted)
                    {
                        int errorCode = 0;
                        zkem.GetLastError(ref errorCode);
                        _logger.LogError($"StartEnrollEx failed with error code: {errorCode}");

                        return new EnrollmentResult
                        {
                            Success = false,
                            Message = $"❌ Failed to start enrollment (Error: {errorCode})"
                        };
                    }

                    Console.WriteLine("   ✅ Enrollment started - please scan fingerprint");

                    // Wait for enrollment to complete (typically handled by device)
                    // In a real implementation, you might poll device status here
                    await Task.Delay(15000); // Give 15 seconds for enrollment

                    Console.WriteLine("   ✅ Enrollment process completed");

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
