using System;
using System.Threading;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Services
{
    /// <summary>
    /// Continuously monitors the fingerprint device for attendance events (check-in/check-out)
    /// </summary>
    public class AttendanceMonitoringService : IDisposable
    {
        private readonly ILogger<AttendanceMonitoringService> _logger;
        private readonly FingerprintService _fingerprintService;
        private readonly ApiClient _apiClient;
        private Timer? _monitoringTimer;
        private bool _isRunning;
        private DateTime _lastCheckTime;
        private readonly int _pollingIntervalSeconds;

        public event EventHandler<AttendanceLog>? AttendanceDetected;

        public AttendanceMonitoringService(
            ILogger<AttendanceMonitoringService> logger,
            FingerprintService fingerprintService,
            ApiClient apiClient,
            int pollingIntervalSeconds = 5)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _fingerprintService = fingerprintService ?? throw new ArgumentNullException(nameof(fingerprintService));
            _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
            _pollingIntervalSeconds = pollingIntervalSeconds;
            _lastCheckTime = DateTime.Now;
            
            _logger.LogInformation($"AttendanceMonitoringService initialized with {pollingIntervalSeconds}s interval");
        }

        public void Start()
        {
            if (_isRunning)
            {
                _logger.LogWarning("Attendance monitoring is already running");
                return;
            }

            _isRunning = true;
            _lastCheckTime = DateTime.Now;
            
            _monitoringTimer = new Timer(
                async _ => await MonitorAttendanceAsync(),
                null,
                TimeSpan.Zero,
                TimeSpan.FromSeconds(_pollingIntervalSeconds)
            );

            _logger.LogInformation("🔄 Starting attendance monitoring service...");
            Console.WriteLine($"✅ Attendance monitoring started (checking every {_pollingIntervalSeconds} seconds)");
        }

        public void Stop()
        {
            if (!_isRunning)
                return;

            _isRunning = false;
            _monitoringTimer?.Change(Timeout.Infinite, 0);
            _logger.LogInformation("Attendance monitoring stopped");
        }

        private async Task MonitorAttendanceAsync()
        {
            if (!_isRunning)
                return;

            try
            {
                // Check if device is connected
                if (!_fingerprintService.IsConnected)
                {
                    _logger.LogWarning("Device not connected, skipping attendance check");
                    return;
                }

                // Get attendance logs from device since last check
                var logs = await GetAttendanceLogsFromDeviceAsync();

                foreach (var log in logs)
                {
                    _logger.LogInformation($"📌 Attendance detected: {log.EmployeeId} - {log.EventType} at {log.Timestamp}");
                    
                    // Send to backend
                    bool sent = await SendAttendanceToBackendAsync(log);
                    
                    if (sent)
                    {
                        _logger.LogInformation($"✅ Attendance recorded for {log.EmployeeId}");
                        
                        // Fire event
                        AttendanceDetected?.Invoke(this, log);
                        
                        // Show console notification
                        Console.WriteLine($"\n👆 ATTENDANCE: {log.EmployeeId} - {log.EventType} at {log.Timestamp:HH:mm:ss}");
                    }
                    else
                    {
                        _logger.LogError($"❌ Failed to record attendance for {log.EmployeeId}");
                    }
                }

                _lastCheckTime = DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error monitoring attendance: {ex.Message}");
            }
        }

        private async Task<List<AttendanceLog>> GetAttendanceLogsFromDeviceAsync()
        {
            var logs = new List<AttendanceLog>();

            try
            {
                await Task.Yield();

                var zkem = _fingerprintService.GetZKemDevice();
                var deviceId = _fingerprintService.GetDeviceId();

                if (zkem == null)
                    return logs;

                // Read attendance logs from device
                // ZKTeco SDK method: ReadAllGLogData or SSR_GetGeneralLogData
                int enrollNumber = 0;
                int verifyMode = 0;
                int inOutMode = 0;
                int year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0;
                int workCode = 0;

                // Enable device to read logs
                zkem.EnableDevice(deviceId, false);

                try
                {
                    // Try to read general log data
                    if (zkem.ReadGeneralLogData(deviceId))
                    {
                        while (zkem.SSR_GetGeneralLogData(
                            deviceId,
                            out string enrollNumberStr,
                            out verifyMode,
                            out inOutMode,
                            out year,
                            out month,
                            out day,
                            out hour,
                            out minute,
                            out second,
                            ref workCode))
                        {
                            try
                            {
                                DateTime logTime = new DateTime(year, month, day, hour, minute, second);

                                // Only process logs newer than last check
                                if (logTime > _lastCheckTime)
                                {
                                    // Determine event type based on inOutMode
                                    // 0 = Check-in, 1 = Check-out, 2 = Break-out, 3 = Break-in, 4 = Overtime-in, 5 = Overtime-out
                                    string eventType = inOutMode switch
                                    {
                                        0 => "check_in",
                                        1 => "check_out",
                                        2 => "break_out",
                                        3 => "break_in",
                                        _ => "check_in" // Default to check_in
                                    };

                                    // Find employee by biometric_id
                                    if (int.TryParse(enrollNumberStr, out int biometricId))
                                    {
                                        var user = await _apiClient.GetUserByBiometricIdAsync(biometricId);
                                        
                                        if (user != null && !string.IsNullOrEmpty(user.EmployeeId))
                                        {
                                            logs.Add(new AttendanceLog
                                            {
                                                EmployeeId = user.EmployeeId,
                                                Timestamp = logTime,
                                                EventType = eventType,
                                                DeviceId = deviceId.ToString(),
                                                MatchScore = verifyMode == 1 ? 100 : 80, // 1 = fingerprint, 0 = password
                                                Notes = $"Auto-detected from device (Verify mode: {verifyMode})"
                                            });
                                        }
                                        else
                                        {
                                            _logger.LogWarning($"Unknown biometric ID detected: {biometricId}");
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError($"Error parsing log entry: {ex.Message}");
                            }
                        }
                    }
                }
                finally
                {
                    // Re-enable device
                    zkem.EnableDevice(deviceId, true);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error reading attendance logs from device: {ex.Message}");
            }

            return logs;
        }

        private async Task<bool> SendAttendanceToBackendAsync(AttendanceLog log)
        {
            try
            {
                var response = await _apiClient.RecordAttendanceAsync(log);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending attendance to backend: {ex.Message}");
                return false;
            }
        }

        public void Dispose()
        {
            Stop();
            _monitoringTimer?.Dispose();
        }
    }
}
