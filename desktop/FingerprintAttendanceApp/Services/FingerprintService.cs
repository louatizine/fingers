using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Services
{
    public class FingerprintService : IDisposable
    {
        private readonly ILogger<FingerprintService> _logger;
        private readonly string _ipAddress;
        private readonly int _port;
        private readonly int _deviceId;
        private dynamic? _zkem;
        private bool _isConnected = false;
        private Dictionary<string, int> _idMappings = new();

        public FingerprintService(ILogger<FingerprintService> logger, string ipAddress, int port, int deviceId = 1)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _ipAddress = ipAddress ?? throw new ArgumentNullException(nameof(ipAddress));
            _port = port;
            _deviceId = deviceId;
            InitializeComObject();
        }

        private void InitializeComObject()
        {
            try
            {
                _logger?.LogInformation("Initializing COM object for fingerprint device...");
                var type = Type.GetTypeFromProgID("zkemkeeper.ZKEM.1") ?? Type.GetTypeFromProgID("zkemkeeper.ZKEM");
                if (type != null) 
                {
                    _zkem = Activator.CreateInstance(type);
                    _logger?.LogInformation("✅ COM object initialized successfully");
                }
                else 
                {
                    _logger?.LogError("❌ COM object zkemkeeper not found. Make sure zkemkeeper.dll is registered.");
                }
            }
            catch (Exception ex) 
            { 
                _logger?.LogError($"❌ COM Error: {ex.Message}");
            }
        }

        public bool TestConnection()
        {
            Console.WriteLine($"\n🔍 Testing connection to {_ipAddress}:{_port}...");
            
            // Test ping
            Console.Write("   Ping test... ");
            bool canPing = PingDevice(_ipAddress);
            Console.WriteLine(canPing ? "✅ Success" : "❌ Failed");
            
            // Test TCP port
            Console.Write($"   Port {_port} test... ");
            bool portOpen = TestTcpPort(_ipAddress, _port);
            Console.WriteLine(portOpen ? "✅ Open" : "❌ Closed");
            
            return canPing && portOpen;
        }

        private bool PingDevice(string ipAddress)
        {
            try
            {
                using (var ping = new System.Net.NetworkInformation.Ping())
                {
                    var reply = ping.Send(ipAddress, 1000);
                    return reply?.Status == System.Net.NetworkInformation.IPStatus.Success;
                }
            }
            catch
            {
                return false;
            }
        }

        private bool TestTcpPort(string ipAddress, int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect(ipAddress, port, null, null);
                    var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromSeconds(2));
                    if (!success)
                    {
                        return false;
                    }
                    
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        public bool Connect()
        {
            try
            {
                if (_zkem == null) 
                {
                    _logger?.LogError("COM object not initialized");
                    Console.WriteLine("❌ COM object not initialized. Check if zkemkeeper.dll is registered.");
                    return false;
                }
                
                Console.WriteLine($"\n🔌 Attempting to connect to device at {_ipAddress}:{_port}...");
                
                // Test network connection first
                if (!TestConnection())
                {
                    Console.WriteLine("❌ Network connection test failed. Cannot proceed.");
                    Console.WriteLine("   Possible issues:");
                    Console.WriteLine("   1. Wrong IP address");
                    Console.WriteLine("   2. Device is offline");
                    Console.WriteLine("   3. Device in USB mode");
                    Console.WriteLine("   4. Firewall blocking");
                    return false;
                }
                
                Console.Write("   Connecting via COM interface... ");
                
                // Try to connect to device
                if (_zkem != null)
                {
                    _isConnected = _zkem.Connect_Net(_ipAddress, _port);
                }
                else
                {
                    _isConnected = false;
                }
                
                if (_isConnected)
                {
                    Console.WriteLine("✅ Success");
                    
                    // Try to get device information
                    try
                    {
                        int dwMachineNumber = 1;
                        string dwInfo = "";
                        
                        if (_zkem != null)
                        {
                            if (_zkem.GetSerialNumber(dwMachineNumber, ref dwInfo))
                            {
                                Console.WriteLine($"   📟 Serial: {dwInfo}");
                            }
                            
                            if (_zkem.GetDeviceIP(dwMachineNumber, ref dwInfo))
                            {
                                Console.WriteLine($"   🌐 Device IP: {dwInfo}");
                            }
                            
                            // Register for events
                            _zkem.RegEvent(_deviceId, 65535);
                            
                            // Load existing users
                            LoadExistingUsersFromDevice();
                            Console.WriteLine($"   👥 Device has {_idMappings.Count} enrolled users");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"   ⚠️ Could not read device info: {ex.Message}");
                    }
                }
                else
                {
                    Console.WriteLine("❌ Failed");
                    Console.WriteLine("   Common solutions:");
                    Console.WriteLine("   1. Check if device is in Network mode (not USB)");
                    Console.WriteLine("   2. Try default IP: 192.168.1.201");
                    Console.WriteLine("   3. Connect via USB first to configure network");
                    Console.WriteLine("   4. Restart the device");
                }
                return _isConnected;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Connection error: {ex.Message}");
                return false;
            }
        }

        public void Disconnect()
        {
            if (_isConnected && _zkem != null) 
            {
                _zkem.Disconnect();
                Console.WriteLine("📴 Device disconnected");
            }
            _isConnected = false;
        }

        public bool IsDeviceConnected() => _isConnected;

        public string GetDeviceIp() => _ipAddress;
        
        public int GetDevicePort() => _port;
        
        public int GetUserCount()
        {
            if (!_isConnected || _zkem == null) return 0;
            return _idMappings.Count;
        }

        private void LoadExistingUsersFromDevice()
        {
            if (_zkem == null || !_isConnected) return;
            
            try
            {
                _idMappings.Clear();
                if (_zkem.ReadAllUserID(_deviceId))
                {
                    // Try different method signatures for compatibility
                    try
                    {
                        // Method 1: Try with all parameters as strings first
                        string id = "", name = "", password = "", priv = "", enabled = "";
                        while (_zkem.SSR_GetAllUserInfo(_deviceId, ref id, ref name, ref password, ref priv, ref enabled))
                        {
                            if (int.TryParse(id, out int userId))
                            {
                                _idMappings[id] = userId;
                            }
                        }
                    }
                    catch
                    {
                        try
                        {
                            // Method 2: Try with different parameter types
                            int id = 0;
                            string name = "", password = "";
                            int priv = 0;
                            bool enabled = false;
                            
                            // Clear any previous error state
                            int error = 0;
                            _zkem.GetLastError(ref error);
                            
                            // Reset the user reading
                            _zkem.ReadAllUserID(_deviceId);
                            
                            while (_zkem.SSR_GetAllUserInfo(_deviceId, out id, out name, out password, out priv, out enabled))
                            {
                                _idMappings[id.ToString()] = id;
                            }
                        }
                        catch (Exception ex2)
                        {
                            _logger?.LogError($"Alternative method failed: {ex2.Message}");
                            
                            // Method 3: Try the basic GetUserInfo method
                            try
                            {
                                int totalUsers = 0;
                                if (_zkem.GetDeviceStatus(_deviceId, 6, ref totalUsers)) // 6 = user count
                                {
                                    _logger?.LogInformation($"Device has {totalUsers} users");
                                    
                                    for (int i = 1; i <= totalUsers; i++)
                                    {
                                        string name = "";
                                        string password = "";
                                        int priv = 0;
                                        bool enabled = false;
                                        
                                        if (_zkem.GetUserInfo(_deviceId, i, ref name, ref password, ref priv, ref enabled))
                                        {
                                            _idMappings[i.ToString()] = i;
                                        }
                                    }
                                }
                            }
                            catch (Exception ex3)
                            {
                                _logger?.LogError($"GetUserInfo also failed: {ex3.Message}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError($"Error loading users from device: {ex.Message}");
                Console.WriteLine($"⚠️ Warning: Could not load users from device: {ex.Message}");
            }
        }

        public async Task<EnrollmentResult> EnrollUserAsync(string employeeId, string fullName)
        {
            try
            {
                await Task.Yield();
                
                if (!_isConnected || _zkem == null) 
                    return new EnrollmentResult { Success = false, Message = "❌ Device not connected" };
                
                int deviceId = GenerateDeviceId(employeeId);
                
                // Check if user already exists on device
                if (_idMappings.ContainsKey(deviceId.ToString()))
                {
                    return new EnrollmentResult 
                    { 
                        Success = false, 
                        Message = $"❌ User with ID {deviceId} already exists on device"
                    };
                }
                
                Console.WriteLine($"\n📝 Creating user on device...");
                Console.WriteLine($"   Employee ID: {employeeId}");
                Console.WriteLine($"   Device User ID: {deviceId}");
                Console.WriteLine($"   Full Name: {fullName}");
                
                // Create user on device first
                bool userCreated = false;
                if (_zkem != null)
                {
                    userCreated = _zkem.SSR_SetUserInfo(
                        _deviceId, 
                        deviceId.ToString(), 
                        fullName, 
                        "",  // password
                        0,   // privilege (0=normal user)
                        true // enabled
                    );
                }
                
                if (!userCreated)
                    return new EnrollmentResult { Success = false, Message = "❌ Failed to create user on device" };
                
                Console.WriteLine("✅ User created on device");
                Console.WriteLine("\n👆 Fingerprint Enrollment Instructions:");
                Console.WriteLine("   1. Place finger on scanner");
                Console.WriteLine("   2. Lift finger when light flashes");
                Console.WriteLine("   3. Repeat 2 more times (total 3 scans)");
                Console.WriteLine("   4. Wait for success beep");
                Console.WriteLine("\nPress Enter when ready to start enrollment...");
                Console.ReadLine();
                
                // Start enrollment
                if (_zkem != null)
                {
                    _zkem.CancelOperation();
                    bool startEnroll = _zkem.StartEnrollEx(deviceId, 0, 1);
                    
                    if (!startEnroll)
                        return new EnrollmentResult { Success = false, Message = "❌ Failed to start enrollment" };
                }
                else
                {
                    return new EnrollmentResult { Success = false, Message = "❌ COM object not available" };
                }
                
                // Add to mappings
                _idMappings[deviceId.ToString()] = deviceId;
                
                return new EnrollmentResult 
                { 
                    Success = true, 
                    Message = "✅ Ready for fingerprint scan. Place finger on device now.",
                    DeviceUserId = deviceId.ToString(),
                    Instructions = "Scan finger 3 times"
                };
            }
            catch (Exception ex)
            {
                return new EnrollmentResult { Success = false, Message = $"❌ Error: {ex.Message}" };
            }
        }

        public async Task<EnrollmentResult> CompleteEnrollmentAsync(string employeeId)
        {
            try
            {
                await Task.Yield();
                
                if (!_isConnected || _zkem == null) 
                    return new EnrollmentResult { Success = false, Message = "❌ Device not connected" };
                
                int deviceId = GenerateDeviceId(employeeId);
                
                // Stop enrollment
                if (_zkem != null)
                {
                    _zkem.CancelOperation();
                }
                
                // Verify template was saved
                bool hasTemplate = false;
                
                if (_zkem != null)
                {
                    // Try different method signatures
                    try
                    {
                        // Method 1: Try with byte array (most common)
                        byte[] data = new byte[2048];
                        int size = 0;
                        hasTemplate = _zkem.GetUserTmp(_deviceId, deviceId, 0, ref data, ref size);
                        
                        if (hasTemplate && size > 0)
                        {
                            return new EnrollmentResult 
                            { 
                                Success = true, 
                                Message = "✅ Fingerprint enrolled successfully!",
                                DeviceUserId = deviceId.ToString()
                            };
                        }
                    }
                    catch
                    {
                        try
                        {
                            // Method 2: Try GetUserInfo to verify user exists
                            string name = "", password = "";
                            int priv = 0;
                            bool enabled = false;
                            
                            hasTemplate = _zkem.GetUserInfo(_deviceId, deviceId, ref name, ref password, ref priv, ref enabled);
                            
                            if (hasTemplate)
                            {
                                return new EnrollmentResult 
                                { 
                                    Success = true, 
                                    Message = "✅ Fingerprint enrollment completed (user verified on device)",
                                    DeviceUserId = deviceId.ToString()
                                };
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger?.LogError($"GetUserInfo failed: {ex.Message}");
                            hasTemplate = false;
                        }
                    }
                }
                
                return new EnrollmentResult 
                { 
                    Success = false, 
                    Message = "❌ No fingerprint template saved. Please try again."
                };
            }
            catch (Exception ex)
            {
                return new EnrollmentResult { Success = false, Message = $"❌ Error: {ex.Message}" };
            }
        }

        public async Task<FingerprintTemplate?> ReadTemplateAsync(string employeeId)
        {
            try
            {
                await Task.Yield();
                if (_zkem == null) return null;
                
                int devId = GenerateDeviceId(employeeId);
                
                // Try different method signatures
                try
                {
                    // Method 1: Try with byte array
                    byte[] data = new byte[2048];
                    int size = 0;
                    if (_zkem.GetUserTmp(_deviceId, devId, 0, ref data, ref size))
                    {
                        return new FingerprintTemplate 
                        { 
                            TemplateData = data.Take(size).ToArray(),
                            DeviceUserId = devId,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                catch
                {
                    // Method 2: Try alternative
                    try
                    {
                        string templateData = "";
                        if (_zkem.GetUserTmpStr(_deviceId, devId, 0, out templateData))
                        {
                            return new FingerprintTemplate 
                            { 
                                TemplateData = System.Text.Encoding.UTF8.GetBytes(templateData),
                                DeviceUserId = devId,
                                CreatedAt = DateTime.Now
                            };
                        }
                    }
                    catch
                    {
                        return null;
                    }
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger?.LogError($"Read template error: {ex.Message}");
                return null;
            }
        }

        public async Task<List<KeyValuePair<int, string>>> GetDeviceUsersAsync()
        {
            var users = new List<KeyValuePair<int, string>>();
            
            try
            {
                await Task.Yield();
                if (_zkem == null || !_isConnected) return users;
                
                if (_zkem.ReadAllUserID(_deviceId))
                {
                    int id = 0; string name = "", pass = ""; int priv = 0; bool en = false;
                    while (_zkem.SSR_GetAllUserInfo(_deviceId, out id, out name, out pass, out priv, out en))
                    {
                        users.Add(new KeyValuePair<int, string>(id, name));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError($"Get device users error: {ex.Message}");
            }
            
            return users;
        }

        private int GenerateDeviceId(string employeeId) 
        {
            // Try to extract numbers from employee ID (like EMP0004 -> 4)
            if (employeeId?.StartsWith("EMP", StringComparison.OrdinalIgnoreCase) == true)
            {
                string numbers = employeeId.Substring(3);
                if (int.TryParse(numbers, out int id) && id > 0 && id <= 9999)
                    return id;
            }
            
            // Fallback to hash
            return Math.Abs((employeeId ?? "").GetHashCode()) % 10000;
        }

        public void Dispose()
        {
            Disconnect();
            
            if (_zkem != null)
            {
                try
                {
                    System.Runtime.InteropServices.Marshal.ReleaseComObject(_zkem);
                }
                catch { }
                _zkem = null;
            }
            
            GC.SuppressFinalize(this);
        }
    }
}