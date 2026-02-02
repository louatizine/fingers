using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using FingerprintAttendanceApp.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp;

class Program
{
    private static ILogger<Program>? _logger;
    private static FingerprintService? _fingerprintService;
    private static ApiClient? _apiClient;
    private static ILoggerFactory? _loggerFactory;
    private static IConfiguration? _configuration;
    private static BackendPollingService? _pollingService;
    private static FingerprintEnrollmentService? _enrollmentService;
    private static AttendanceMonitoringService? _attendanceMonitoring;
    private static bool _isRunning = true;
    private static readonly Queue<PendingUser> _pendingEnrollments = new Queue<PendingUser>();

    static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 Starting Fingerprint Attendance Application...");
        Console.WriteLine("=============================================\n");
        
        var services = ConfigureServices();
        var serviceProvider = services.BuildServiceProvider();

        _loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
        _logger = _loggerFactory.CreateLogger<Program>();
        _configuration = serviceProvider.GetRequiredService<IConfiguration>();
        _apiClient = serviceProvider.GetRequiredService<ApiClient>();
        _fingerprintService = serviceProvider.GetRequiredService<FingerprintService>();
        _enrollmentService = serviceProvider.GetRequiredService<FingerprintEnrollmentService>();
        _pollingService = serviceProvider.GetRequiredService<BackendPollingService>();
        _attendanceMonitoring = serviceProvider.GetRequiredService<AttendanceMonitoringService>();

        if (await InitializeSystemAsync())
        {
            // Start background polling for new user enrollments
            StartEnrollmentPolling();
            
            // Start attendance monitoring
            StartAttendanceMonitoring();
            
            while (_isRunning)
            {
                // Check for pending enrollments first
                if (_pendingEnrollments.Count > 0)
                {
                    var user = _pendingEnrollments.Dequeue();
                    await HandlePendingEnrollment(user);
                    continue;
                }
                
                DisplayMenu();
                var choice = Console.ReadLine();
                
                switch (choice)
                {
                    case "1":
                        await EnrollUser();
                        break;
                    case "2":
                        await TestDeviceConnection();
                        break;
                    case "3":
                        await SyncUsers();
                        break;
                    case "4":
                        await ListUsersFromApi();
                        break;
                    case "5":
                        await NetworkDiagnostics();
                        break;
                    case "6":
                        await ScanForDevices();
                        break;
                    case "7":
                        await TryCommonIPs();
                        break;
                    case "8":
                        _isRunning = false;
                        Console.WriteLine("👋 Exiting application...");
                        break;
                    case "9":
                        // Debug option
                        await DebugApiResponse();
                        break;
                    case "10":
                        await ListUsersFromDevice();
                        break;
                    default:
                        Console.WriteLine("❌ Invalid choice. Please try again.");
                        break;
                }
            }
        }
        
        // Cleanup
        _pollingService?.Stop();
        _pollingService?.Dispose();
        _attendanceMonitoring?.Stop();
        _attendanceMonitoring?.Dispose();
        _fingerprintService?.Dispose();
        Console.WriteLine("\n✅ Application closed.");
    }

    private static void DisplayMenu()
    {
        Console.WriteLine("\n📱 === Fingerprint Attendance Menu ===");
        Console.WriteLine("1. 👤 Enroll User");
        Console.WriteLine("2. 🔌 Test Device Connection");
        Console.WriteLine("3. 🔄 Sync Users from API");
        Console.WriteLine("4. 📋 List Users from API");
        Console.WriteLine("5. 🌐 Network Diagnostics");
        Console.WriteLine("6. 🔍 Scan Network for Devices");
        Console.WriteLine("7. 🔢 Try Common IPs");
        Console.WriteLine("8. 🚪 Exit");
        Console.WriteLine("9. 🔧 Debug API (Hidden)");
        Console.WriteLine("10. 👥 List Users from Device");
        Console.Write("👉 Enter your choice (1-10): ");
    }

    private static IServiceCollection ConfigureServices()
    {
        try
        {
            Console.WriteLine("📂 Loading configuration...");
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json", false, true)
                .Build();

            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(configuration);
            
            // Add logging
            services.AddLogging(builder => 
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });
            
            // Add logger factory
            services.AddSingleton<ILoggerFactory, LoggerFactory>();
            
            var deviceSettings = configuration.GetSection("DeviceSettings");
            var ipAddress = deviceSettings["IpAddress"] ?? "192.168.100.100";
            var port = int.Parse(deviceSettings["Port"] ?? "4370");
            var deviceId = int.Parse(deviceSettings["DeviceId"] ?? "1");
            
            Console.WriteLine($"📟 Device Configuration:");
            Console.WriteLine($"   IP Address: {ipAddress}");
            Console.WriteLine($"   Port: {port}");
            Console.WriteLine($"   Device ID: {deviceId}");
            
            // Register FingerprintService with proper logger
            services.AddSingleton<FingerprintService>(sp => 
            {
                var logger = sp.GetRequiredService<ILogger<FingerprintService>>();
                return new FingerprintService(logger, ipAddress, port, deviceId);
            });

            services.AddSingleton<ApiClient>();
            
            // Register enrollment services
            services.AddSingleton<FingerprintEnrollmentService>();
            services.AddSingleton<BackendPollingService>();
            services.AddSingleton<AttendanceMonitoringService>();
            
            services.AddSingleton<ILogger<Program>>(sp => 
                sp.GetRequiredService<ILoggerFactory>().CreateLogger<Program>());
            
            return services;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Configuration error: {ex.Message}");
            throw;
        }
    }

    private static async Task<bool> InitializeSystemAsync()
    {
        try 
        {
            Console.WriteLine("\n⚙️ Initializing system...");
            
            // Test API connection first
            Console.Write("🔗 Checking API connection... ");
            
            if (_configuration == null)
            {
                Console.WriteLine("❌ Configuration not loaded");
                return false;
            }
            
            string baseUrl = _configuration.GetSection("ApiSettings")["BaseUrl"] ?? "http://localhost:5000/api";
            Console.WriteLine($"Base URL from config: {baseUrl}");
            
            // Test the health endpoint
            string healthUrl = $"{baseUrl.TrimEnd('/')}/health";
            Console.WriteLine($"Testing health endpoint: {healthUrl}");
            
            try
            {
                using (var testClient = new HttpClient())
                {
                    testClient.Timeout = TimeSpan.FromSeconds(3);
                    var response = await testClient.GetAsync(healthUrl);
                    
                    if (response != null)
                    {
                        if (response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"✅ Server health check passed at {healthUrl}");
                            Console.WriteLine($"   Status: {response.StatusCode}");
                        }
                        else
                        {
                            Console.WriteLine($"⚠️ Health check returned: {response.StatusCode}");
                        }
                    }
                }
            }
            catch (Exception apiEx)
            {
                Console.WriteLine($"❌ Cannot connect to server: {apiEx.Message}");
                Console.WriteLine($"   Attempted URL: {healthUrl}");
                Console.WriteLine("⚠️  Warning: Web server might not be running.");
                Console.WriteLine("   Make sure Flask app is running: python app.py");
                Console.WriteLine("\n💡 Tips:");
                Console.WriteLine("   1. Check if Flask app is running on port 5000");
                Console.WriteLine("   2. Run: python app.py");
                Console.WriteLine("   3. Check firewall settings");
            }
            
            // Test device connection
            Console.WriteLine("\n📟 Testing fingerprint device connection...");
            bool deviceConnected = _fingerprintService?.Connect() ?? false;
            
            if (!deviceConnected)
            {
                Console.WriteLine("\n⚠️  Device connection failed!");
                Console.WriteLine("   Please choose option 6 to scan for devices");
                Console.WriteLine("   or option 7 to try common IPs");
            }
            
            return true; 
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Initialization failed: {ex.Message}");
            return false;
        }
    }

    private static async Task TestDeviceConnection()
    {
        Console.WriteLine("\n🔌 Testing device connection...");
        bool connected = _fingerprintService?.Connect() ?? false;
        
        if (connected)
        {
            Console.WriteLine("✅ Device is connected and ready!");
        }
        else
        {
            Console.WriteLine("❌ Device connection failed");
        }
        await Task.CompletedTask;
    }

    private static async Task NetworkDiagnostics()
    {
        Console.WriteLine("\n🔍 === Network Diagnostics ===");
        Console.WriteLine($"📟 Target Device: {_fingerprintService?.GetDeviceIp()}:{_fingerprintService?.GetDevicePort()}");
        
        Console.WriteLine("\n💻 Your Computer Network Info:");
        Console.WriteLine($"   Your IPv4: 192.168.100.20");
        Console.WriteLine($"   Subnet Mask: 255.255.255.0");
        Console.WriteLine($"   Default Gateway: 192.168.100.1");
        Console.WriteLine($"   Subnet: 192.168.100.0/24");
        Console.WriteLine($"   Possible Device IPs: 192.168.100.1 to 192.168.100.254");
        
        Console.WriteLine("\n💡 Recommendations:");
        Console.WriteLine("   1. Choose option 6 to scan your network");
        Console.WriteLine("   2. Try common IPs with option 7");
        Console.WriteLine("   3. Check device power and Ethernet cable");
        Console.WriteLine("   4. Look at device screen for IP address");
        
        await Task.CompletedTask;
    }

    private static async Task ScanForDevices()
    {
        Console.WriteLine("\n🔍 Scanning your network for fingerprint devices...");
        Console.WriteLine("Network: 192.168.100.0/24");
        Console.WriteLine("This will scan IPs 192.168.100.1 to 192.168.100.254");
        Console.WriteLine("Port: 4370 (standard fingerprint device port)");
        Console.WriteLine("\n⏳ Scanning... (This will take 2-3 minutes)");
        
        List<string> foundDevices = new List<string>();
        int totalScanned = 0;
        
        // Create a list of IPs to scan (skip your own IP and gateway)
        for (int i = 1; i <= 254; i++)
        {
            // Skip common reserved IPs
            if (i == 20) continue; // Your computer
            if (i == 1) continue;  // Gateway
            if (i == 255) continue; // Broadcast
            
            string ip = $"192.168.100.{i}";
            
            // Test port 4370
            if (TestTcpPort(ip, 4370))
            {
                foundDevices.Add(ip);
                Console.WriteLine($"\n✅ Found device at: {ip}:4370");
                Console.WriteLine($"   👉 Update appsettings.json with: \"IpAddress\": \"{ip}\"");
                
                // Test if it responds to ping
                if (PingHost(ip))
                {
                    Console.WriteLine($"   📡 Device is pingable");
                }
            }
            
            totalScanned++;
            
            // Show progress
            if (totalScanned % 10 == 0)
            {
                Console.Write($"Scanned {totalScanned}/253 IPs...\r");
            }
            
            // Small delay to not flood network
            await Task.Delay(10);
        }
        
        Console.WriteLine($"\n\n📊 Scan complete! Scanned {totalScanned} IP addresses.");
        
        if (foundDevices.Count > 0)
        {
            Console.WriteLine($"\n🎯 Found {foundDevices.Count} potential fingerprint devices:");
            foreach (var device in foundDevices)
            {
                Console.WriteLine($"   📍 {device}:4370");
                
                // Try to connect to verify
                Console.Write($"   Testing connection to {device}... ");
                if (await TestDeviceConnectionAsync(device, 4370))
                {
                    Console.WriteLine("✅ Works!");
                    Console.WriteLine($"   💡 Set this IP in appsettings.json and restart");
                }
                else
                {
                    Console.WriteLine("❌ Failed");
                }
            }
            
            // Ask if user wants to update config
            if (foundDevices.Count == 1)
            {
                Console.Write($"\n💡 Do you want to update appsettings.json with {foundDevices[0]}? (y/n): ");
                var response = Console.ReadLine()?.ToLower();
                if (response == "y")
                {
                    UpdateAppSettings(foundDevices[0]);
                }
            }
        }
        else
        {
            Console.WriteLine("\n❌ No devices found on port 4370.");
            Console.WriteLine("\n💡 Possible reasons:");
            Console.WriteLine("   1. Device is powered off");
            Console.WriteLine("   2. Device is in USB mode (not network)");
            Console.WriteLine("   3. Device uses different port (try option 7)");
            Console.WriteLine("   4. Firewall blocking port 4370");
            Console.WriteLine("   5. Device not connected to network");
            
            Console.WriteLine("\n🔧 Solutions:");
            Console.WriteLine("   1. Check device power and Ethernet cable");
            Console.WriteLine("   2. Look at device screen for IP address");
            Console.WriteLine("   3. Try option 7 (common IPs)");
            Console.WriteLine("   4. Connect via USB first to configure");
        }
    }

    private static async Task TryCommonIPs()
    {
        Console.WriteLine("\n🔢 Trying common fingerprint device IPs...");
        
        List<string> commonIPs = new List<string>
        {
            "192.168.100.100",  // Common in your subnet
            "192.168.100.200",
            "192.168.100.201",
            "192.168.100.202",
            "192.168.100.50",
            "192.168.100.101",
            "192.168.100.102",
            "192.168.1.201",    // ZKTeco default
            "192.168.1.202",
            "192.168.0.100",
            "192.168.0.200",
            "192.168.0.201"
        };
        
        Console.WriteLine("Testing common fingerprint device IPs on port 4370...\n");
        
        foreach (var ip in commonIPs)
        {
            Console.Write($"Testing {ip}:4370... ");
            
            // Check if IP is pingable
            bool canPing = PingHost(ip);
            
            // Check if port is open
            bool portOpen = TestTcpPort(ip, 4370);
            
            if (portOpen)
            {
                Console.WriteLine($"✅ Port OPEN! (Ping: {(canPing ? "✅" : "❌")})");
                Console.WriteLine($"   💡 Try this IP! Update appsettings.json with: \"{ip}\"");
                
                // Test actual connection
                Console.Write($"   Testing device connection... ");
                if (await TestDeviceConnectionAsync(ip, 4370))
                {
                    Console.WriteLine("✅ Device responds!");
                    Console.Write($"   Update config with {ip}? (y/n): ");
                    var response = Console.ReadLine()?.ToLower();
                    if (response == "y")
                    {
                        UpdateAppSettings(ip);
                        return;
                    }
                }
                else
                {
                    Console.WriteLine("❌ Not a fingerprint device");
                }
            }
            else
            {
                Console.WriteLine($"❌ Closed (Ping: {(canPing ? "✅" : "❌")})");
            }
            
            // Small delay between tests
            await Task.Delay(100);
        }
        
        Console.WriteLine("\n❌ None of the common IPs worked.");
        Console.WriteLine("💡 Try scanning your network (option 6)");
    }

    private static bool PingHost(string host)
    {
        try
        {
            using (var ping = new System.Net.NetworkInformation.Ping())
            {
                var reply = ping.Send(host, 500); // 500ms timeout
                return reply?.Status == System.Net.NetworkInformation.IPStatus.Success;
            }
        }
        catch
        {
            return false;
        }
    }

    private static bool TestTcpPort(string ip, int port)
    {
        try
        {
            using (var client = new TcpClient())
            {
                var result = client.BeginConnect(ip, port, null, null);
                var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(300));
                if (success)
                {
                    client.EndConnect(result);
                    return true;
                }
            }
        }
        catch { }
        return false;
    }

    private static async Task<bool> TestDeviceConnectionAsync(string ip, int port)
    {
        try
        {
            if (_loggerFactory == null) return false;
            
            // Create temporary service to test
            var logger = _loggerFactory.CreateLogger<FingerprintService>();
            var tempService = new FingerprintService(logger, ip, port, 1);
            
            bool connected = tempService.Connect();
            tempService.Dispose();
            
            return connected;
        }
        catch
        {
            return false;
        }
    }

    private static async Task DebugApiResponse()
    {
        try
        {
            Console.WriteLine("\n🔍 Debugging API response...");
            string baseUrl = _configuration?.GetSection("ApiSettings")["BaseUrl"] ?? "http://localhost:5000/api";
            string testUrl = $"{baseUrl.TrimEnd('/')}/users";
            
            Console.WriteLine($"Testing URL: {testUrl}");
            
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                
                // Try with authentication
                if (_apiClient != null)
                {
                    // Use reflection to get auth token if available
                    var tokenField = _apiClient.GetType().GetField("_jwtToken", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    if (tokenField != null)
                    {
                        var token = tokenField.GetValue(_apiClient) as string;
                        if (!string.IsNullOrEmpty(token))
                        {
                            client.DefaultRequestHeaders.Authorization = 
                                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                            Console.WriteLine("✓ Using auth token");
                        }
                    }
                }
                
                var response = await client.GetAsync(testUrl);
                var content = await response.Content.ReadAsStringAsync();
                
                Console.WriteLine($"\n📊 Response Status: {response.StatusCode}");
                Console.WriteLine($"📦 Response Length: {content.Length} characters");
                
                if (content.Length > 0)
                {
                    Console.WriteLine("\n📄 Response Content (first 1000 chars):");
                    Console.WriteLine(new string('-', 50));
                    Console.WriteLine(content.Substring(0, Math.Min(1000, content.Length)));
                    Console.WriteLine(new string('-', 50));
                    
                    if (content.Length > 1000)
                    {
                        Console.WriteLine($"... (truncated, total {content.Length} chars)");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }

    private static void UpdateAppSettings(string newIp)
    {
        try
        {
            string appSettingsPath = System.IO.Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                "appsettings.json"
            );
            
            if (System.IO.File.Exists(appSettingsPath))
            {
                string content = System.IO.File.ReadAllText(appSettingsPath);
                content = System.Text.RegularExpressions.Regex.Replace(
                    content,
                    @"""IpAddress""\s*:\s*""[^""]*""",
                    $@"""IpAddress"": ""{newIp}"""
                );
                
                System.IO.File.WriteAllText(appSettingsPath, content);
                Console.WriteLine($"✅ Updated appsettings.json with IP: {newIp}");
                Console.WriteLine("   Restart the application for changes to take effect");
            }
            else
            {
                Console.WriteLine($"❌ Could not find appsettings.json at: {appSettingsPath}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error updating config: {ex.Message}");
            Console.WriteLine($"💡 Manually update appsettings.json with: \"IpAddress\": \"{newIp}\"");
        }
    }

    private static async Task SyncUsers()
    {
        Console.WriteLine("\n🔄 Syncing users from API...");
        var users = await _apiClient?.GetUsersAsync()!;
        Console.WriteLine($"✅ Fetched {users.Count} users from API.");
    }

    private static async Task ListUsersFromApi()
    {
        Console.WriteLine("\n📋 Fetching users from API...");
        var users = await _apiClient?.GetUsersAsync()!;
        
        if (users.Count == 0)
        {
            Console.WriteLine("📭 No users found in API.");
            return;
        }
        
        Console.WriteLine($"\n✅ Total Users: {users.Count}\n");
        
        foreach (var user in users)
        {
            Console.WriteLine($"📌 Employee ID: {user.EmployeeId ?? "N/A"}");
            Console.WriteLine($"   👤 Name: {user.DisplayName}");
            if (!string.IsNullOrEmpty(user.Department))
                Console.WriteLine($"   🏢 Department: {user.Department}");
            if (!string.IsNullOrEmpty(user.Position))
                Console.WriteLine($"   💼 Position: {user.Position}");
            if (user.HasFingerprint)
                Console.WriteLine($"   👆 Fingerprint: Enrolled (Device ID: {user.FingerprintDeviceId})");
            Console.WriteLine("   ---");
        }
    }

    private static async Task ListUsersFromDevice()
    {
        Console.WriteLine("\n👥 Fetching enrolled users from fingerprint device...");
        
        if (_fingerprintService == null)
        {
            Console.WriteLine("❌ Fingerprint service not available");
            return;
        }

        if (!_fingerprintService.IsConnected)
        {
            Console.WriteLine("❌ Device is not connected. Please run option 2 first.");
            return;
        }

        try
        {
            await Task.Yield();

            var zkem = _fingerprintService.GetZKemDevice();
            var deviceId = _fingerprintService.GetDeviceId();

            if (zkem == null)
            {
                Console.WriteLine("❌ Device object not initialized");
                return;
            }

            Console.WriteLine("🔄 Reading users from device...\n");

            // Disable device for reading
            zkem.EnableDevice(deviceId, false);

            try
            {
                // Read all user IDs first
                if (zkem.ReadAllUserID(deviceId))
                {
                    var deviceUsers = new List<(string enrollNumber, string name, string password, int privilege, bool enabled)>();
                    
                    string enrollNumber = "";
                    string name = "";
                    string password = "";
                    int privilege = 0;
                    bool enabled = false;

                    // Get all user info
                    while (zkem.SSR_GetAllUserInfo(deviceId, out enrollNumber, out name, out password, out privilege, out enabled))
                    {
                        deviceUsers.Add((enrollNumber, name, password, privilege, enabled));
                    }

                    if (deviceUsers.Count == 0)
                    {
                        Console.WriteLine("📭 No users found on device.");
                    }
                    else
                    {
                        Console.WriteLine($"✅ Found {deviceUsers.Count} enrolled users:\n");
                        Console.WriteLine(new string('=', 80));
                        Console.WriteLine($"{"Biometric ID",-15} {"Name",-30} {"Privilege",-15} {"Status",-10}");
                        Console.WriteLine(new string('=', 80));

                        foreach (var (id, userName, pwd, priv, isEnabled) in deviceUsers.OrderBy(u => int.TryParse(u.enrollNumber, out int n) ? n : 0))
                        {
                            string privilegeStr = priv switch
                            {
                                0 => "User",
                                1 => "Enroller",
                                2 => "Manager",
                                3 => "Admin",
                                _ => $"Level {priv}"
                            };

                            string statusStr = isEnabled ? "✅ Enabled" : "❌ Disabled";
                            string biometricId = int.TryParse(id, out int bioId) ? $"{bioId:000}" : id;

                            Console.WriteLine($"{biometricId,-15} {userName,-30} {privilegeStr,-15} {statusStr,-10}");

                            // Try to match with backend user
                            if (int.TryParse(id, out int biometricIdNum))
                            {
                                var backendUser = await _apiClient?.GetUserByBiometricIdAsync(biometricIdNum)!;
                                if (backendUser != null)
                                {
                                    Console.WriteLine($"{"",15} → Employee: {backendUser.EmployeeId} ({backendUser.Department})");
                                }
                            }
                        }
                        Console.WriteLine(new string('=', 80));

                        // Summary
                        Console.WriteLine($"\n📊 Summary:");
                        Console.WriteLine($"   Total Users: {deviceUsers.Count}");
                        Console.WriteLine($"   Enabled: {deviceUsers.Count(u => u.enabled)}");
                        Console.WriteLine($"   Disabled: {deviceUsers.Count(u => !u.enabled)}");
                        Console.WriteLine($"   Admins: {deviceUsers.Count(u => u.privilege == 3)}");
                        Console.WriteLine($"   Managers: {deviceUsers.Count(u => u.privilege == 2)}");
                        Console.WriteLine($"   Regular Users: {deviceUsers.Count(u => u.privilege == 0)}");
                    }
                }
                else
                {
                    int errorCode = 0;
                    zkem.GetLastError(ref errorCode);
                    Console.WriteLine($"❌ Failed to read users from device. Error code: {errorCode}");
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
            Console.WriteLine($"❌ Error reading users from device: {ex.Message}");
            _logger?.LogError($"Error listing device users: {ex.Message}");
        }
    }

    private static async Task EnrollUser()
    {
        Console.Write("\n👤 Enter Employee ID (e.g., EMP0004): ");
        string? employeeId = Console.ReadLine()?.Trim();
        
        if (string.IsNullOrEmpty(employeeId))
        {
            Console.WriteLine("❌ Employee ID cannot be empty.");
            return;
        }

        Console.WriteLine($"🔍 Looking for user '{employeeId}' in API...");
        
        try
        {
            // Use the public endpoint method
            var user = await _apiClient?.GetUserByEmployeeIdAsync(employeeId)!;
            
            if (user == null)
            {
                Console.WriteLine($"❌ User '{employeeId}' not found in API.");
                Console.WriteLine("   Please create the user in the web application first.");
                Console.WriteLine("   Then run option 4 to see all available users.");
                return;
            }

            // Check if already has fingerprint
            var fingerprintStatus = await _apiClient?.GetUserFingerprintStatusAsync(employeeId)!;
            if (fingerprintStatus?.HasFingerprint == true)
            {
                Console.WriteLine($"⚠️ User already has fingerprint enrolled on device ID: {fingerprintStatus.FingerprintDeviceId}");
                Console.Write("   Do you want to re-enroll? (y/n): ");
                var response = Console.ReadLine()?.ToLower();
                if (response != "y")
                {
                    return;
                }
            }

            Console.WriteLine($"✅ Found user: {user.DisplayName}");
            Console.WriteLine($"   Employee ID: {user.EmployeeId}");
            
            if (!string.IsNullOrEmpty(user.Department))
                Console.WriteLine($"   Department: {user.Department}");
            
            if (!string.IsNullOrEmpty(user.Email))
                Console.WriteLine($"   Email: {user.Email}");
            
            if (!string.IsNullOrEmpty(user.Position))
                Console.WriteLine($"   Position: {user.Position}");
            
            // Check device connection
            if (!_fingerprintService?.IsDeviceConnected() ?? false)
            {
                Console.WriteLine("❌ Device is not connected. Please run option 2 first.");
                return;
            }

            Console.WriteLine("\n🎯 === Starting Fingerprint Enrollment ===");
            
            // Ensure we have non-null values for required parameters
            string safeEmployeeId = user.EmployeeId ?? employeeId;
            string safeFullName = user.DisplayName ?? $"{user.FirstName} {user.LastName}".Trim();
            
            if (string.IsNullOrEmpty(safeFullName))
            {
                safeFullName = safeEmployeeId;
            }
            
            var result = await _fingerprintService?.EnrollUserAsync(safeEmployeeId, safeFullName)!;
            Console.WriteLine($"\n{result.Message}");
            
            if (result.Success)
            {
                Console.WriteLine("\n⏳ Waiting for fingerprint scans...");
                Console.WriteLine("   Complete the scans on the device, then press Enter here...");
                Console.ReadLine();
                
                // Complete enrollment
                var completeResult = await _fingerprintService?.CompleteEnrollmentAsync(safeEmployeeId)!;
                Console.WriteLine($"\n{completeResult.Message}");
                
                if (completeResult.Success)
                {
                    Console.WriteLine("\n🎉 Enrollment completed successfully on device!");
                    Console.WriteLine($"   Employee: {safeFullName}");
                    Console.WriteLine($"   Device User ID: {completeResult.DeviceUserId}");
                    Console.WriteLine($"   Timestamp: {DateTime.Now}");
                    
                    // Update fingerprint status in backend
                    Console.WriteLine("\n💾 Updating fingerprint status in database...");
                    bool updated = await _apiClient?.UpdateFingerprintStatusAsync(employeeId, completeResult.DeviceUserId ?? "0")!;
                    
                    if (updated)
                    {
                        Console.WriteLine("✅ Fingerprint status updated in database!");
                    }
                    else
                    {
                        Console.WriteLine("⚠️ Device enrollment succeeded but failed to update database status.");
                        Console.WriteLine("   Please update fingerprint status manually in web app.");
                    }
                }
                else
                {
                    Console.WriteLine($"❌ Enrollment failed: {completeResult.Message}");
                }
            }
            else
            {
                Console.WriteLine($"❌ Enrollment failed: {result.Message}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error during enrollment: {ex.Message}");
        }
    }

    private static void StartEnrollmentPolling()
    {
        try
        {
            if (_pollingService == null || _configuration == null)
            {
                Console.WriteLine("⚠️ Polling service not available");
                return;
            }

            // Check if polling is enabled in configuration
            var pollingConfig = _configuration.GetSection("EnrollmentPolling");
            bool enabled = bool.Parse(pollingConfig["Enabled"] ?? "true");

            if (!enabled)
            {
                Console.WriteLine("ℹ️ Enrollment polling is disabled in configuration");
                return;
            }

            // Subscribe to new user detection events
            _pollingService.NewUserDetected += OnNewUserDetected;

            // Start the polling service
            _pollingService.Start();

            Console.WriteLine("✅ Enrollment polling started - listening for new users...\n");
        }
        catch (Exception ex)
        {
            _logger?.LogError($"Error starting enrollment polling: {ex.Message}");
            Console.WriteLine($"⚠️ Could not start enrollment polling: {ex.Message}");
        }
    }

    private static void StartAttendanceMonitoring()
    {
        try
        {
            if (_attendanceMonitoring == null || _configuration == null)
            {
                Console.WriteLine("⚠️ Attendance monitoring service not available");
                return;
            }

            // Check if attendance monitoring is enabled in configuration
            var attendanceConfig = _configuration.GetSection("AttendanceMonitoring");
            bool enabled = bool.Parse(attendanceConfig["Enabled"] ?? "true");

            if (!enabled)
            {
                Console.WriteLine("ℹ️ Attendance monitoring is disabled in configuration");
                return;
            }

            // Start the attendance monitoring service
            _attendanceMonitoring.Start();
        }
        catch (Exception ex)
        {
            _logger?.LogError($"Error starting attendance monitoring: {ex.Message}");
            Console.WriteLine($"⚠️ Could not start attendance monitoring: {ex.Message}");
        }
    }

    private static async void OnNewUserDetected(object? sender, PendingUser user)
    {
        try
        {
            // Queue the enrollment instead of blocking
            _pendingEnrollments.Enqueue(user);
            
            // Show brief notification
            Console.WriteLine("\n");
            Console.WriteLine("🔔 NEW EMPLOYEE DETECTED!");
            Console.WriteLine($"   {user.DisplayName} (ID: {user.EmployeeId})");
            Console.WriteLine("   Enrollment prompt will appear next...");
            Console.WriteLine();
        }
        catch (Exception ex)
        {
            _logger?.LogError($"Error handling new user detection: {ex.Message}");
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }

    private static async Task HandlePendingEnrollment(PendingUser user)
    {
        try
        {
            Console.WriteLine("\n");
            Console.WriteLine("═══════════════════════════════════════════════════════════");
            Console.WriteLine("🔔 NEW EMPLOYEE DETECTED!");
            Console.WriteLine("═══════════════════════════════════════════════════════════");
            Console.WriteLine($"   Name: {user.DisplayName}");
            Console.WriteLine($"   Employee ID: {user.EmployeeId}");
            Console.WriteLine($"   Department: {user.Department ?? "N/A"}");
            Console.WriteLine($"   Position: {user.Position ?? "N/A"}");
            Console.WriteLine($"   Biometric ID: {user.BiometricId:000}");
            Console.WriteLine("═══════════════════════════════════════════════════════════");
            Console.WriteLine();

            // Prompt for enrollment
            Console.Write("📌 Do you want to enroll fingerprint now? (Y/N): ");
            var response = Console.ReadLine()?.Trim().ToUpper();

            if (response == "Y" || response == "YES")
            {
                await EnrollNewUser(user);
            }
            else
            {
                Console.WriteLine("⏭️ Enrollment skipped. You can enroll this user later.");
                // Reset the processed status so it appears again on next poll
                _pollingService?.ResetProcessedUser(user.BiometricId);
            }

            Console.WriteLine();
            Console.Write("👉 Press any key to continue...");
            Console.ReadKey();
            Console.WriteLine("\n");
        }
        catch (Exception ex)
        {
            _logger?.LogError($"Error handling pending enrollment: {ex.Message}");
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }

    private static async Task EnrollNewUser(PendingUser user)
    {
        try
        {
            if (_enrollmentService == null)
            {
                Console.WriteLine("❌ Enrollment service not available");
                return;
            }

            if (_fingerprintService == null || !_fingerprintService.IsConnected)
            {
                Console.WriteLine("❌ Fingerprint device is not connected");
                Console.WriteLine("   Please connect the device first (Option 2: Test Device Connection)");
                return;
            }

            Console.WriteLine($"\n🚀 Starting enrollment for {user.DisplayName}...");
            Console.WriteLine($"   Using biometric ID: {user.BiometricId:000}");
            Console.WriteLine();

            var result = await _enrollmentService.EnrollUserAsync(user);

            if (result.Success)
            {
                Console.WriteLine("\n" + new string('=', 60));
                Console.WriteLine("🎉 ENROLLMENT SUCCESSFUL!");
                Console.WriteLine(new string('=', 60));
                Console.WriteLine($"   Employee: {user.DisplayName}");
                Console.WriteLine($"   Employee ID: {user.EmployeeId}");
                Console.WriteLine($"   Biometric ID: {user.BiometricId:000}");
                Console.WriteLine($"   Status: Enrolled and confirmed");
                Console.WriteLine($"   Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                Console.WriteLine(new string('=', 60));
            }
            else
            {
                Console.WriteLine($"\n❌ Enrollment failed: {result.Message}");
                Console.WriteLine("   You can try again later from the main menu.");
                
                // Reset processed status so user appears in next poll
                _pollingService?.ResetProcessedUser(user.BiometricId);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError($"Error enrolling new user: {ex.Message}");
            Console.WriteLine($"❌ Error during enrollment: {ex.Message}");
            
            // Reset processed status on error
            _pollingService?.ResetProcessedUser(user.BiometricId);
        }
    }
}