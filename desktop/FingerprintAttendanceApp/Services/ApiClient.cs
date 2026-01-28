using System.Net.Http.Json;
using System.Text;
using FingerprintAttendanceApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FingerprintAttendanceApp.Services;

public class ApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ApiClient> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _baseUrl;
    private string? _jwtToken;
    private DateTime _tokenExpiry;

    public ApiClient(ILogger<ApiClient> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        var apiSettings = configuration.GetSection("ApiSettings");
        
        // Get base URL and ensure it doesn't end with slash
        _baseUrl = (apiSettings["BaseUrl"] ?? "http://localhost:5000/api").TrimEnd('/');
        
        _logger.LogInformation($"API Base URL: {_baseUrl}");
        
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(int.Parse(apiSettings["Timeout"] ?? "30"))
        };
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        
        // Try to authenticate immediately
        Task.Run(async () => await InitializeAuthenticationAsync()).Wait();
    }

    private async Task<bool> InitializeAuthenticationAsync()
    {
        try
        {
            var credentials = _configuration.GetSection("Credentials");
            var email = credentials["Email"] ?? "admin@example.com";
            var password = credentials["Password"] ?? "admin123";
            
            _logger.LogInformation($"Attempting to authenticate with email: {email}");
            return await LoginAsync(email, password);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Initial authentication failed: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> LoginAsync(string email, string password)
    {
        try
        {
            _logger.LogInformation($"Logging in with email: {email}");
            
            var loginData = new { email, password };
            var jsonContent = JsonConvert.SerializeObject(loginData);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            
            // Construct full URL manually
            string fullUrl = $"{_baseUrl}/auth/login";
            _logger.LogInformation($"Login URL: {fullUrl}");
            
            var response = await _httpClient.PostAsync(fullUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Login failed. Status: {response.StatusCode}, Response: {errorContent}");
                return false;
            }
            
            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogDebug($"Login response: {responseContent}");
            
            var result = JsonConvert.DeserializeObject<LoginResponse>(responseContent);
            
            if (result?.AccessToken != null)
            {
                _jwtToken = result.AccessToken;
                _tokenExpiry = DateTime.Now.AddHours(1);
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _jwtToken);
                _logger.LogInformation("✅ Authentication successful");
                return true;
            }
            else
            {
                _logger.LogError("No access token in response");
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Login error: {ex.Message}");
            if (ex.InnerException != null)
            {
                _logger.LogError($"Inner exception: {ex.InnerException.Message}");
            }
            return false;
        }
    }

    private async Task<bool> EnsureAuthenticatedAsync()
    {
        if (string.IsNullOrEmpty(_jwtToken) || DateTime.Now >= _tokenExpiry.AddMinutes(-5))
        {
            _logger.LogWarning("Token expired or missing, re-authenticating...");
            return await InitializeAuthenticationAsync();
        }
        return true;
    }

    public async Task<List<User>> GetUsersAsync()
    {
        try
        {
            if (!await EnsureAuthenticatedAsync())
            {
                _logger.LogError("Cannot authenticate to get users");
                return new List<User>();
            }
            
            _logger.LogInformation("Fetching users from API...");
            string fullUrl = $"{_baseUrl}/users";
            var response = await _httpClient.GetAsync(fullUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug($"Raw users response: {responseContent}");
                
                try
                {
                    // Your Flask API returns: {"users": [...]}
                    var usersResponse = JsonConvert.DeserializeObject<UsersListResponse>(responseContent);
                    
                    if (usersResponse?.Users != null)
                    {
                        _logger.LogInformation($"✅ Successfully fetched {usersResponse.Users.Count} users");
                        
                        // Ensure FullName is populated for each user
                        foreach (var user in usersResponse.Users)
                        {
                            if (string.IsNullOrEmpty(user.FullName) && 
                                (!string.IsNullOrEmpty(user.FirstName) || !string.IsNullOrEmpty(user.LastName)))
                            {
                                user.FullName = $"{user.FirstName} {user.LastName}".Trim();
                            }
                        }
                        
                        return usersResponse.Users;
                    }
                    else
                    {
                        _logger.LogError("Users list is null in response");
                        return new List<User>();
                    }
                }
                catch (Exception parseEx)
                {
                    _logger.LogError($"Error parsing users response: {parseEx.Message}");
                    _logger.LogDebug($"Response content that failed to parse: {responseContent}");
                    return new List<User>();
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Failed to get users. Status: {response.StatusCode}, Response: {errorContent}");
                return new List<User>();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error getting users: {ex.Message}");
            return new List<User>();
        }
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        try
        {
            if (!await EnsureAuthenticatedAsync())
            {
                _logger.LogError("Cannot authenticate to get user");
                return null;
            }
            
            _logger.LogInformation($"Fetching user with ID: {id}");
            string fullUrl = $"{_baseUrl}/users/{id}";
            var response = await _httpClient.GetAsync(fullUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug($"User response: {responseContent}");
                
                try
                {
                    // Your Flask API returns: {"user": {...}}
                    var userResponse = JsonConvert.DeserializeObject<UserResponse>(responseContent);
                    
                    if (userResponse?.User != null)
                    {
                        var user = userResponse.User;
                        
                        // Ensure FullName is populated
                        if (string.IsNullOrEmpty(user.FullName) && 
                            (!string.IsNullOrEmpty(user.FirstName) || !string.IsNullOrEmpty(user.LastName)))
                        {
                            user.FullName = $"{user.FirstName} {user.LastName}".Trim();
                        }
                        
                        _logger.LogInformation($"✅ Found user: {user.FullName}");
                        return user;
                    }
                    else
                    {
                        _logger.LogWarning($"User not found or API error");
                        return null;
                    }
                }
                catch (Exception parseEx)
                {
                    _logger.LogError($"Error parsing user response: {parseEx.Message}");
                    return null;
                }
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                _logger.LogWarning("Unauthorized access to user endpoint");
                return null;
            }
            else
            {
                _logger.LogError($"Failed to get user {id}: {response.StatusCode}");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error getting user {id}: {ex.Message}");
            return null;
        }
    }

    public async Task<User?> GetUserByEmployeeIdAsync(string employeeId)
    {
        try
        {
            _logger.LogInformation($"Fetching user by employee ID: {employeeId}");
            
            string fullUrl = $"{_baseUrl}/users/public/{employeeId}";
            _logger.LogInformation($"Public endpoint URL: {fullUrl}");
            
            var response = await _httpClient.GetAsync(fullUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug($"Public user response: {responseContent}");
                
                try
                {
                    // Public endpoint returns direct User object
                    var user = JsonConvert.DeserializeObject<User>(responseContent);
                    
                    if (user != null)
                    {
                        // Set employee ID if not already set
                        if (string.IsNullOrEmpty(user.EmployeeId))
                        {
                            user.EmployeeId = employeeId;
                        }
                        
                        // Ensure FullName is populated
                        if (string.IsNullOrEmpty(user.FullName))
                        {
                            if (!string.IsNullOrEmpty(user.FirstName) || !string.IsNullOrEmpty(user.LastName))
                            {
                                user.FullName = $"{user.FirstName} {user.LastName}".Trim();
                            }
                        }
                        
                        _logger.LogInformation($"✅ Found user via public endpoint: {user.FullName ?? user.EmployeeId}");
                        return user;
                    }
                    else
                    {
                        _logger.LogWarning("Could not deserialize user from public endpoint");
                        return null;
                    }
                }
                catch (Exception parseEx)
                {
                    _logger.LogError($"Error parsing public user response: {parseEx.Message}");
                    _logger.LogDebug($"Response content: {responseContent}");
                    return null;
                }
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning($"User with employee ID {employeeId} not found");
                return null;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Public endpoint failed. Status: {response.StatusCode}, Response: {errorContent}");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error getting user by employee ID {employeeId}: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> UpdateUserAsync(string id, User user)
    {
        try
        {
            if (!await EnsureAuthenticatedAsync())
            {
                _logger.LogError("Cannot authenticate to update user");
                return false;
            }
            
            _logger.LogInformation($"Updating user {id}");
            var jsonContent = JsonConvert.SerializeObject(user);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            
            string fullUrl = $"{_baseUrl}/users/{id}";
            var response = await _httpClient.PutAsync(fullUrl, content);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"✅ User {id} updated successfully");
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Failed to update user. Status: {response.StatusCode}, Response: {errorContent}");
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating user {id}: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> HealthCheckAsync()
    {
        try
        {
            _logger.LogInformation("Performing API health check...");
            
            string healthUrl = $"{_baseUrl}/health";
            _logger.LogInformation($"Health check URL: {healthUrl}");
            
            var testClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(3)
            };
            
            try
            {
                var response = await testClient.GetAsync(healthUrl);
                
                _logger.LogInformation($"✅ API server is reachable (Status: {response.StatusCode})");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"API server not reachable: {ex.Message}");
                _logger.LogWarning($"Attempted URL: {healthUrl}");
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Health check failed: {ex.Message}");
            return false;
        }
    }

    public string GetBaseUrl()
    {
        return _baseUrl;
    }
}

// Response wrapper classes for Flask API structure
public class LoginResponse
{
    [JsonProperty("access_token")]
    public string? AccessToken { get; set; }
    
    [JsonProperty("refresh_token")]
    public string? RefreshToken { get; set; }
    
    [JsonProperty("user")]
    public User? User { get; set; }
    
    [JsonProperty("message")]
    public string? Message { get; set; }
}

public class UsersListResponse
{
    [JsonProperty("users")]
    public List<User>? Users { get; set; }
}

public class UserResponse
{
    [JsonProperty("user")]
    public User? User { get; set; }
}