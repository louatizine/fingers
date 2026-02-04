using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Services
{
    public class BackendPollingService : IDisposable
    {
        private readonly ILogger<BackendPollingService> _logger;
        private readonly ApiClient _apiClient;
        private readonly IConfiguration _configuration;
        private readonly int _pollingIntervalSeconds;
        private System.Threading.Timer? _pollingTimer;
        private readonly HashSet<int> _processedBiometricIds = new HashSet<int>();
        private bool _isRunning = false;

        public event EventHandler<PendingUser>? NewUserDetected;

        public BackendPollingService(
            ILogger<BackendPollingService> logger,
            ApiClient apiClient,
            IConfiguration configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

            // Get polling interval from configuration (default: 10 seconds)
            var pollingConfig = configuration.GetSection("EnrollmentPolling");
            _pollingIntervalSeconds = int.Parse(pollingConfig["IntervalSeconds"] ?? "10");

            _logger.LogInformation($"BackendPollingService initialized with {_pollingIntervalSeconds}s interval");
        }

        public void Start()
        {
            if (_isRunning)
            {
                _logger.LogWarning("Polling service is already running");
                return;
            }

            _isRunning = true;
            _logger.LogInformation("🔄 Starting backend polling service...");

            // Start timer for periodic polling
            _pollingTimer = new System.Threading.Timer(
                async _ => await PollForPendingUsersAsync(),
                null,
                TimeSpan.Zero, // Start immediately
                TimeSpan.FromSeconds(_pollingIntervalSeconds)
            );

            Console.WriteLine($"✅ Backend polling started (checking every {_pollingIntervalSeconds} seconds)");
        }

        public void Stop()
        {
            if (!_isRunning)
            {
                return;
            }

            _isRunning = false;
            _pollingTimer?.Change(Timeout.Infinite, Timeout.Infinite);
            _logger.LogInformation("⏸️ Backend polling service stopped");
            Console.WriteLine("⏸️ Backend polling stopped");
        }

        private async Task PollForPendingUsersAsync()
        {
            try
            {
                // Fetch pending users from backend
                var response = await _apiClient.GetPendingEnrollmentsAsync();

                if (response?.Data == null || !response.Data.Any())
                {
                    // No pending users, silent return
                    return;
                }

                // Process each pending user
                foreach (var user in response.Data)
                {
                    // Skip if already processed
                    if (_processedBiometricIds.Contains(user.BiometricId))
                    {
                        continue;
                    }

                    // Mark as processed to avoid duplicate alerts
                    _processedBiometricIds.Add(user.BiometricId);

                    // Log detection
                    _logger.LogInformation(
                        $"📌 New user detected: {user.DisplayName} (Biometric ID: {user.BiometricId})"
                    );

                    // Trigger event for enrollment
                    OnNewUserDetected(user);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error polling for pending users: {ex.Message}");
                // Don't stop polling on errors, just log and continue
            }
        }

        protected virtual void OnNewUserDetected(PendingUser user)
        {
            NewUserDetected?.Invoke(this, user);
        }

        /// <summary>
        /// Remove a biometric ID from processed list (e.g., if enrollment was cancelled)
        /// </summary>
        public void ResetProcessedUser(int biometricId)
        {
            _processedBiometricIds.Remove(biometricId);
        }

        /// <summary>
        /// Clear all processed users (useful for fresh start)
        /// </summary>
        public void ClearProcessedUsers()
        {
            _processedBiometricIds.Clear();
            _logger.LogInformation("Cleared processed users list");
        }

        public void Dispose()
        {
            Stop();
            _pollingTimer?.Dispose();
        }
    }
}
