using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using FingerprintAttendanceApp.Services;
using FingerprintAttendanceApp.Models;
using FingerprintAttendanceApp.Forms;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp
{
    public class TrayApplicationContext : ApplicationContext
    {
        private NotifyIcon? trayIcon;
        private ILogger<TrayApplicationContext>? _logger;
        private FingerprintService? _fingerprintService;
        private ApiClient? _apiClient;
        private BackendPollingService? _pollingService;
        private FingerprintEnrollmentService? _enrollmentService;
        private AttendanceMonitoringService? _attendanceMonitoring;
        private IConfiguration? _configuration;
        private IServiceProvider? _serviceProvider;
        private SynchronizationContext? _uiContext;

        public TrayApplicationContext()
        {
            try
            {
                // Capture UI synchronization context
                _uiContext = SynchronizationContext.Current;
                
                // Initialize tray icon first
                InitializeTrayIcon();
                
                // Initialize services in background
                _ = Task.Run(async () => await InitializeServicesAsync());
                
                // Show startup notification
                ShowNotification("Fingerprint Attendance", 
                    "Application is starting...", ToolTipIcon.Info);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to start application: {ex.Message}", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Application.Exit();
            }
        }

        private void InitializeTrayIcon()
        {
            trayIcon = new NotifyIcon
            {
                Icon = LoadCustomIcon() ?? SystemIcons.Application,
                Text = "Fingerprint Attendance",
                Visible = true
            };

            var contextMenu = new ContextMenuStrip();
            
            // Device status header (non-clickable)
            var statusItem = new ToolStripLabel("⚙️ Loading...")
            {
                Font = new Font(contextMenu.Font, FontStyle.Bold),
                ForeColor = Color.Gray
            };
            contextMenu.Items.Add(statusItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            
            // Main actions
            contextMenu.Items.Add("👤 Enroll User", null, ShowEnrollmentWindow);
            contextMenu.Items.Add("📋 List Users (API)", null, ListApiUsers);
            contextMenu.Items.Add("👥 List Users (Device)", null, ListDeviceUsers);
            contextMenu.Items.Add("🔄 Sync Users", null, SyncUsers);
            
            contextMenu.Items.Add(new ToolStripSeparator());
            
            // Device actions
            contextMenu.Items.Add("🔌 Test Device Connection", null, TestConnection);
            contextMenu.Items.Add("🔍 Network Scan", null, NetworkScan);
            
            contextMenu.Items.Add(new ToolStripSeparator());
            
            // Other options
            contextMenu.Items.Add("💻 Open Console Version", null, OpenConsoleVersion);
            contextMenu.Items.Add("⚙️ Settings Folder", null, OpenSettingsFolder);
            
            contextMenu.Items.Add(new ToolStripSeparator());
            
            contextMenu.Items.Add("🚪 Exit", null, ExitApplication);

            trayIcon.ContextMenuStrip = contextMenu;
            trayIcon.DoubleClick += (sender, e) => ShowEnrollmentWindow(sender, e);
            
            // Update status periodically
            _ = Task.Run(async () =>
            {
                await Task.Delay(3000); // Wait for initialization
                
                while (trayIcon != null && trayIcon.Visible)
                {
                    UpdateTrayIconStatus(statusItem);
                    await Task.Delay(10000); // Update every 10 seconds
                }
            });
        }

        private Icon? LoadCustomIcon()
        {
            try
            {
                string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Icons", "app.ico");
                if (File.Exists(iconPath) && new FileInfo(iconPath).Length > 0)
                {
                    return new Icon(iconPath);
                }
            }
            catch { }
            
            return null;
        }

        private async Task InitializeServicesAsync()
        {
            try
            {
                var services = new ServiceCollection();
                
                // Load configuration
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                    .Build();
                
                services.AddSingleton<IConfiguration>(configuration);
                
                // Add logging
                services.AddLogging(builder => 
                {
                    builder.AddConsole();
                    builder.SetMinimumLevel(LogLevel.Information);
                });
                
                var deviceSettings = configuration.GetSection("DeviceSettings");
                var ipAddress = deviceSettings["IpAddress"] ?? "192.168.100.100";
                var port = int.Parse(deviceSettings["Port"] ?? "4370");
                var deviceId = int.Parse(deviceSettings["DeviceId"] ?? "1");
                
                // Register services
                services.AddSingleton<FingerprintService>(sp => 
                {
                    var logger = sp.GetRequiredService<ILogger<FingerprintService>>();
                    return new FingerprintService(logger, ipAddress, port, deviceId);
                });
                
                services.AddSingleton<ApiClient>();
                services.AddSingleton<FingerprintEnrollmentService>();
                services.AddSingleton<BackendPollingService>();
                services.AddSingleton<AttendanceMonitoringService>();
                services.AddSingleton<ILogger<TrayApplicationContext>>(sp => 
                    sp.GetRequiredService<ILoggerFactory>().CreateLogger<TrayApplicationContext>());
                
                _serviceProvider = services.BuildServiceProvider();
                
                _configuration = _serviceProvider.GetRequiredService<IConfiguration>();
                _logger = _serviceProvider.GetRequiredService<ILogger<TrayApplicationContext>>();
                _fingerprintService = _serviceProvider.GetRequiredService<FingerprintService>();
                _apiClient = _serviceProvider.GetRequiredService<ApiClient>();
                _enrollmentService = _serviceProvider.GetRequiredService<FingerprintEnrollmentService>();
                _pollingService = _serviceProvider.GetRequiredService<BackendPollingService>();
                _attendanceMonitoring = _serviceProvider.GetRequiredService<AttendanceMonitoringService>();
                
                // Subscribe to events
                if (_pollingService != null)
                {
                    _pollingService.NewUserDetected += OnNewUserDetected;
                    _logger?.LogInformation("Subscribed to NewUserDetected event");
                }
                
                // Test connection
                await Task.Delay(1000); // Give device time to initialize
                
                if (_fingerprintService != null)
                {
                    bool connected = _fingerprintService.Connect();
                    
                    if (connected)
                    {
                        var deviceIp = _fingerprintService.GetDeviceIp();
                        ShowNotification("Device Connected", 
                            $"Fingerprint device connected at {deviceIp}", ToolTipIcon.Info);
                        _logger?.LogInformation("Device connected successfully at {IpAddress}", deviceIp);
                        
                        // Start background services
                        _pollingService?.Start();
                        _attendanceMonitoring?.Start();
                        
                        _logger?.LogInformation("Background services started");
                        ShowNotification("Services Started", 
                            "Monitoring for new employees and attendance events", ToolTipIcon.Info);
                    }
                    else
                    {
                        ShowNotification("Connection Warning", 
                            "Could not connect to fingerprint device. Check settings.", ToolTipIcon.Warning);
                        _logger?.LogWarning("Device connection failed - services not started");
                        
                        // Ask user if they want to scan for device
                        await Task.Delay(2000); // Wait for tray to be ready
                        
                        RunOnUIThread(() =>
                        {
                            var result = MessageBox.Show(
                                "Could not connect to fingerprint device.\n\n" +
                                "Would you like to scan your network for the device?",
                                "Device Connection Failed",
                                MessageBoxButtons.YesNo,
                                MessageBoxIcon.Question);

                            if (result == DialogResult.Yes)
                            {
                                NetworkScan(null, EventArgs.Empty);
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                ShowNotification("Initialization Error", 
                    $"Failed to initialize: {ex.Message}", ToolTipIcon.Error);
                _logger?.LogError($"Initialization error: {ex.Message}");
            }
        }

        private void ShowNotification(string title, string message, ToolTipIcon icon)
        {
            if (trayIcon != null && trayIcon.Visible)
            {
                trayIcon.ShowBalloonTip(3000, title, message, icon);
            }
        }

        /// <summary>
        /// Update the tray icon status label with current device and service status
        /// </summary>
        private void UpdateTrayIconStatus(ToolStripLabel statusLabel)
        {
            try
            {
                if (trayIcon?.ContextMenuStrip != null && !trayIcon.ContextMenuStrip.IsDisposed)
                {
                    RunOnUIThread(() =>
                    {
                        bool deviceConnected = _fingerprintService?.IsConnected ?? false;
                        bool servicesRunning = (_pollingService != null) && (_attendanceMonitoring != null);

                        if (deviceConnected && servicesRunning)
                        {
                            statusLabel.Text = "✅ Device Ready - Monitoring Active";
                            statusLabel.ForeColor = Color.DarkGreen;
                        }
                        else if (deviceConnected)
                        {
                            statusLabel.Text = "⚠️ Device Ready - Services Stopped";
                            statusLabel.ForeColor = Color.DarkOrange;
                        }
                        else
                        {
                            statusLabel.Text = "❌ Device Disconnected";
                            statusLabel.ForeColor = Color.DarkRed;
                        }
                    });
                }
            }
            catch
            {
                // Ignore errors during status update
            }
        }

        /// <summary>
        /// Run an action on the UI thread safely
        /// </summary>
        private void RunOnUIThread(Action action)
        {
            if (_uiContext != null)
            {
                _uiContext.Post(_ => 
                {
                    try
                    {
                        action();
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogError($"Error in UI thread action: {ex.Message}");
                    }
                }, null);
            }
            else
            {
                // Fallback: try to run directly
                try
                {
                    action();
                }
                catch (Exception ex)
                {
                    _logger?.LogError($"Error running action without UI context: {ex.Message}");
                }
            }
        }

        private void OnNewUserDetected(object? sender, PendingUser user)
        {
            try
            {
                _logger?.LogInformation($"New user detected: {user.DisplayName} ({user.EmployeeId})");

                // Step 1: Show system tray balloon notification
                ShowNotification(
                    "🔔 New Employee Detected!", 
                    $"{user.DisplayName} ({user.EmployeeId}) needs fingerprint enrollment", 
                    ToolTipIcon.Info);

                // Step 2: Check device readiness
                bool deviceReady = _fingerprintService?.IsConnected ?? false;
                
                RunOnUIThread(() =>
                {
                    try
                    {
                        // Show custom enrollment prompt form
                        using (var promptForm = new EnrollmentPromptForm(user, deviceReady))
                        {
                            var result = promptForm.ShowDialog();

                            switch (result)
                            {
                                case DialogResult.Yes:
                                    // User wants to enroll now
                                    _logger?.LogInformation($"User confirmed enrollment for {user.EmployeeId}");
                                    _ = Task.Run(async () => await HandleEnrollmentAsync(user));
                                    break;

                                case DialogResult.Retry:
                                    // Remind later - reset processed status
                                    _logger?.LogInformation($"Enrollment postponed for {user.EmployeeId}");
                                    ShowNotification("Enrollment Postponed", 
                                        $"You will be reminded about {user.DisplayName} later", 
                                        ToolTipIcon.Info);
                                    
                                    // Reset after 5 minutes
                                    _ = Task.Run(async () =>
                                    {
                                        await Task.Delay(TimeSpan.FromMinutes(5));
                                        _pollingService?.ResetProcessedUser(user.BiometricId);
                                    });
                                    break;

                                case DialogResult.No:
                                    // User skipped - permanently mark as processed
                                    _logger?.LogInformation($"Enrollment skipped for {user.EmployeeId}");
                                    ShowNotification("Enrollment Skipped", 
                                        $"Skipped enrollment for {user.DisplayName}", 
                                        ToolTipIcon.Warning);
                                    break;

                                case DialogResult.Cancel:
                                    // Device not ready - reset for retry
                                    _pollingService?.ResetProcessedUser(user.BiometricId);
                                    break;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogError($"Error showing enrollment prompt: {ex.Message}");
                        MessageBox.Show(
                            $"Error showing enrollment prompt:\n{ex.Message}",
                            "Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error);
                    }
                });
            }
            catch (Exception ex)
            {
                _logger?.LogError($"Error in OnNewUserDetected: {ex.Message}");
                ShowNotification("Error", 
                    $"Failed to process new user notification: {ex.Message}", 
                    ToolTipIcon.Error);
            }
        }

        /// <summary>
        /// Handle the complete enrollment process for a pending user
        /// </summary>
        private async Task HandleEnrollmentAsync(PendingUser user)
        {
            try
            {
                // Verify device connection
                if (_fingerprintService == null || !_fingerprintService.IsConnected)
                {
                    ShowNotification("Device Error", 
                        "Fingerprint device is not connected. Please check connection.", 
                        ToolTipIcon.Error);
                    
                    // Reset processed status so user appears again
                    _pollingService?.ResetProcessedUser(user.BiometricId);
                    return;
                }

                if (_enrollmentService == null)
                {
                    ShowNotification("Service Error", 
                        "Enrollment service not available", 
                        ToolTipIcon.Error);
                    return;
                }

                // Show progress notification
                ShowNotification("Starting Enrollment", 
                    $"Preparing to enroll {user.DisplayName}...", 
                    ToolTipIcon.Info);

                _logger?.LogInformation($"Starting enrollment process for {user.EmployeeId}");

                // Execute enrollment through the enrollment service
                var enrollmentResult = await _enrollmentService.EnrollUserAsync(user);

                // Handle enrollment result
                if (enrollmentResult.Success)
                {
                    _logger?.LogInformation($"Enrollment successful for {user.EmployeeId}");
                    
                    ShowNotification("✅ Enrollment Successful!", 
                        $"{user.DisplayName} has been enrolled successfully!\n" +
                        $"Biometric ID: {user.BiometricId:000}", 
                        ToolTipIcon.Info);

                    // Show success dialog on UI thread
                    RunOnUIThread(() =>
                    {
                        MessageBox.Show(
                            $"🎉 ENROLLMENT SUCCESSFUL!\n\n" +
                            $"Employee: {user.DisplayName}\n" +
                            $"Employee ID: {user.EmployeeId}\n" +
                            $"Biometric ID: {user.BiometricId:000}\n" +
                            $"Department: {user.Department ?? "N/A"}\n\n" +
                            $"Status: Enrolled and Confirmed\n" +
                            $"Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}",
                            "Enrollment Complete",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                    });
                }
                else
                {
                    _logger?.LogError($"Enrollment failed for {user.EmployeeId}: {enrollmentResult.Message}");
                    
                    ShowNotification("❌ Enrollment Failed", 
                        $"Failed to enroll {user.DisplayName}: {enrollmentResult.Message}", 
                        ToolTipIcon.Error);

                    // Show error dialog and reset processed status
                    RunOnUIThread(() =>
                    {
                        var retry = MessageBox.Show(
                            $"Enrollment failed for {user.DisplayName}\n\n" +
                            $"Error: {enrollmentResult.Message}\n\n" +
                            "Do you want to try again?",
                            "Enrollment Failed",
                            MessageBoxButtons.YesNo,
                            MessageBoxIcon.Error);

                        if (retry == DialogResult.Yes)
                        {
                            // Reset processed status to allow retry
                            _pollingService?.ResetProcessedUser(user.BiometricId);
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError($"Exception during enrollment for {user.EmployeeId}: {ex.Message}");
                
                ShowNotification("Enrollment Error", 
                    $"An error occurred during enrollment: {ex.Message}", 
                    ToolTipIcon.Error);

                // Reset processed status on exception
                _pollingService?.ResetProcessedUser(user.BiometricId);
            }
        }

        #region Menu Event Handlers

        private void ShowEnrollmentWindow(object? sender, EventArgs e)
        {
            if (_apiClient == null || _fingerprintService == null)
            {
                MessageBox.Show("Services not initialized yet. Please wait a moment and try again.",
                    "Not Ready", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            try
            {
                var form = new EnrollmentForm(_apiClient, _fingerprintService, _logger);
                form.ShowDialog();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error opening enrollment window:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error opening enrollment window: {ex.Message}");
            }
        }

        private void ListApiUsers(object? sender, EventArgs e)
        {
            if (_apiClient == null)
            {
                MessageBox.Show("API client not initialized.",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                var form = new UserListForm(_apiClient, _fingerprintService, _logger);
                form.ShowDialog();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error opening user list: {ex.Message}");
            }
        }

        private void ListDeviceUsers(object? sender, EventArgs e)
        {
            if (_apiClient == null || _fingerprintService == null)
            {
                MessageBox.Show("Services not initialized.",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (!_fingerprintService.IsConnected)
            {
                MessageBox.Show("Fingerprint device is not connected.\nPlease test connection first.",
                    "Device Not Connected", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                var form = new UserListForm(_apiClient, _fingerprintService, _logger);
                form.ShowDialog();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error opening device users: {ex.Message}");
            }
        }

        private async void SyncUsers(object? sender, EventArgs e)
        {
            if (_apiClient == null)
            {
                MessageBox.Show("API client not initialized.",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                ShowNotification("Syncing", "Syncing users from server...", ToolTipIcon.Info);
                
                var users = await _apiClient.GetUsersAsync();
                
                if (users != null)
                {
                    ShowNotification("Sync Complete", 
                        $"Successfully synced {users.Count} users", ToolTipIcon.Info);
                    
                    MessageBox.Show($"Synced {users.Count} users from server",
                        "Sync Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    ShowNotification("Sync Failed", "No users returned from server", ToolTipIcon.Warning);
                }
            }
            catch (Exception ex)
            {
                ShowNotification("Sync Failed", ex.Message, ToolTipIcon.Error);
                MessageBox.Show($"Sync failed:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Sync error: {ex.Message}");
            }
        }

        private void TestConnection(object? sender, EventArgs e)
        {
            if (_fingerprintService == null)
            {
                MessageBox.Show("Fingerprint service not initialized.",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                ShowNotification("Testing", "Testing device connection...", ToolTipIcon.Info);
                
                bool connected = _fingerprintService.Connect();
                
                if (connected)
                {
                    var deviceIp = _fingerprintService.GetDeviceIp();
                    var devicePort = _fingerprintService.GetDevicePort();
                    
                    ShowNotification("Connection Success", 
                        $"Device connected at {deviceIp}:{devicePort}", ToolTipIcon.Info);
                    
                    MessageBox.Show($"✅ Device Connected Successfully\n\n" +
                                  $"IP Address: {deviceIp}\n" +
                                  $"Port: {devicePort}\n" +
                                  $"Status: Ready",
                        "Connection Test", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    ShowNotification("Connection Failed", 
                        "Could not connect to device", ToolTipIcon.Error);
                    
                    var result = MessageBox.Show($"❌ Device Connection Failed\n\n" +
                                               "Do you want to scan for devices?",
                        "Connection Test", MessageBoxButtons.YesNo, MessageBoxIcon.Error);
                    
                    if (result == DialogResult.Yes)
                    {
                        NetworkScan(sender, e);
                    }
                }
            }
            catch (Exception ex)
            {
                ShowNotification("Error", ex.Message, ToolTipIcon.Error);
                MessageBox.Show($"Error testing connection:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Connection test error: {ex.Message}");
            }
        }

        private void NetworkScan(object? sender, EventArgs e)
        {
            try
            {
                var form = new NetworkScanForm(_logger);
                var result = form.ShowDialog();
                
                if (result == DialogResult.OK && !string.IsNullOrEmpty(form.SelectedIpAddress))
                {
                    // Update configuration with new IP
                    UpdateAppSettingsIp(form.SelectedIpAddress);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Network scan error: {ex.Message}");
            }
        }

        private void UpdateAppSettingsIp(string newIp)
        {
            try
            {
                string appSettingsPath = Path.Combine(
                    AppDomain.CurrentDomain.BaseDirectory,
                    "appsettings.json");
                
                if (File.Exists(appSettingsPath))
                {
                    string content = File.ReadAllText(appSettingsPath);
                    content = System.Text.RegularExpressions.Regex.Replace(
                        content,
                        @"""IpAddress""\s*:\s*""[^""]*""",
                        $@"""IpAddress"": ""{newIp}""");
                    
                    File.WriteAllText(appSettingsPath, content);
                    
                    MessageBox.Show(
                        $"Configuration updated with IP: {newIp}\n\n" +
                        "Please restart the application for changes to take effect.",
                        "Settings Updated",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to update settings:\n{ex.Message}\n\n" +
                              $"Please manually update appsettings.json with IP: {newIp}",
                    "Update Failed", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void OpenConsoleVersion(object? sender, EventArgs e)
        {
            try
            {
                string consoleAppPath = Path.Combine(
                    AppDomain.CurrentDomain.BaseDirectory,
                    "..", "..",
                    "FingerprintAttendanceApp",
                    "bin", "Debug", "net7.0-windows",
                    "FingerprintAttendanceApp.exe");
                
                consoleAppPath = Path.GetFullPath(consoleAppPath);
                
                if (File.Exists(consoleAppPath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = consoleAppPath,
                        UseShellExecute = true,
                        WorkingDirectory = Path.GetDirectoryName(consoleAppPath)
                    });
                    
                    ShowNotification("Console Launched", 
                        "Console version started", ToolTipIcon.Info);
                }
                else
                {
                    MessageBox.Show($"Console application not found at:\n{consoleAppPath}\n\n" +
                                  "Please build the console application first.",
                        "Not Found", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error opening console version:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error opening console: {ex.Message}");
            }
        }

        private void OpenSettingsFolder(object? sender, EventArgs e)
        {
            try
            {
                string appFolder = AppDomain.CurrentDomain.BaseDirectory;
                Process.Start(new ProcessStartInfo
                {
                    FileName = appFolder,
                    UseShellExecute = true,
                    Verb = "open"
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error opening folder:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ExitApplication(object? sender, EventArgs e)
        {
            var result = MessageBox.Show(
                "Are you sure you want to exit?",
                "Exit Application",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result == DialogResult.Yes)
            {
                // Cleanup
                try
                {
                    _pollingService?.Stop();
                    _attendanceMonitoring?.Stop();
                    _fingerprintService?.Dispose();
                    
                    if (trayIcon != null)
                    {
                        trayIcon.Visible = false;
                        trayIcon.Dispose();
                    }
                }
                catch (Exception ex)
                {
                    _logger?.LogError($"Error during cleanup: {ex.Message}");
                }
                
                Application.Exit();
            }
        }

        #endregion

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                try
                {
                    _pollingService?.Dispose();
                    _attendanceMonitoring?.Dispose();
                    _fingerprintService?.Dispose();
                    trayIcon?.Dispose();
                }
                catch { }
            }
            base.Dispose(disposing);
        }
    }
}