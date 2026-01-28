using System;
using System.Threading.Tasks;
using System.Windows.Input;
using Fingerprint.AdminUI.Helpers;
using Fingerprint.AdminUI.Models;
using Fingerprint.AdminUI.Services;

namespace Fingerprint.AdminUI.ViewModels
{
    /// <summary>
    /// ViewModel for enrolling new users with fingerprint
    /// Handles the enrollment workflow:
    /// 1. User fills in employee details
    /// 2. Clicks "Start Enrollment"
    /// 3. Windows Service captures fingerprint
    /// 4. Template is saved to backend
    /// </summary>
    public class EnrollUserViewModel : ViewModelBase
    {
        private readonly ApiService _apiService;
        
        private string _employeeId = string.Empty;
        private string _firstName = string.Empty;
        private string _lastName = string.Empty;
        private string _department = string.Empty;
        
        private bool _isEnrolling;
        private string _enrollmentStatus = "Ready to enroll";
        private bool _enrollmentSuccess;
        private string _errorMessage = string.Empty;

        public EnrollUserViewModel(ApiService apiService)
        {
            _apiService = apiService;
            
            // Initialize commands
            StartEnrollmentCommand = new AsyncRelayCommand(
                async _ => await StartEnrollmentAsync(),
                _ => CanStartEnrollment()
            );
            
            ClearFormCommand = new RelayCommand(_ => ClearForm());
            RefreshEmployeeIdCommand = new AsyncRelayCommand(
                async _ => await GenerateNextEmployeeIdAsync(),
                _ => !IsEnrolling
            );
            
            // Auto-generate first employee ID
            _ = GenerateNextEmployeeIdAsync();
        }

        #region Properties

        /// <summary>
        /// Employee ID input
        /// </summary>
        public string EmployeeId
        {
            get => _employeeId;
            set
            {
                if (SetProperty(ref _employeeId, value))
                {
                    CommandManager.InvalidateRequerySuggested();
                }
            }
        }

        /// <summary>
        /// First name input
        /// </summary>
        public string FirstName
        {
            get => _firstName;
            set
            {
                if (SetProperty(ref _firstName, value))
                {
                    CommandManager.InvalidateRequerySuggested();
                }
            }
        }

        /// <summary>
        /// Last name input
        /// </summary>
        public string LastName
        {
            get => _lastName;
            set
            {
                if (SetProperty(ref _lastName, value))
                {
                    CommandManager.InvalidateRequerySuggested();
                }
            }
        }

        /// <summary>
        /// Department input
        /// </summary>
        public string Department
        {
            get => _department;
            set => SetProperty(ref _department, value);
        }

        /// <summary>
        /// Is enrollment currently in progress?
        /// </summary>
        public bool IsEnrolling
        {
            get => _isEnrolling;
            set => SetProperty(ref _isEnrolling, value);
        }

        /// <summary>
        /// Current enrollment status message
        /// Shows: "Ready", "Scanning...", "Success", "Error"
        /// </summary>
        public string EnrollmentStatus
        {
            get => _enrollmentStatus;
            set => SetProperty(ref _enrollmentStatus, value);
        }

        /// <summary>
        /// Was the last enrollment successful?
        /// </summary>
        public bool EnrollmentSuccess
        {
            get => _enrollmentSuccess;
            set => SetProperty(ref _enrollmentSuccess, value);
        }

        /// <summary>
        /// Error message if enrollment failed
        /// </summary>
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        #endregion

        #region Commands

        public ICommand StartEnrollmentCommand { get; }
        public ICommand ClearFormCommand { get; }
        public ICommand RefreshEmployeeIdCommand { get; }

        #endregion

        #region Methods

        /// <summary>
        /// Check if enrollment can start
        /// Requires: EmployeeId, FirstName, LastName
        /// </summary>
        private bool CanStartEnrollment()
        {
            return !IsEnrolling 
                && !string.IsNullOrWhiteSpace(EmployeeId)
                && !string.IsNullOrWhiteSpace(FirstName)
                && !string.IsNullOrWhiteSpace(LastName);
        }

        /// <summary>
        /// Start the fingerprint enrollment process
        /// For now, creates user directly without fingerprint (until SDK is integrated)
        /// </summary>
        private async Task StartEnrollmentAsync()
        {
            IsEnrolling = true;
            EnrollmentSuccess = false;
            ErrorMessage = string.Empty;
            EnrollmentStatus = "Creating user...";

            try
            {
                // Create enrollment request
                var request = new EnrollmentRequest
                {
                    EmployeeId = EmployeeId,
                    FirstName = FirstName,
                    LastName = LastName,
                    Department = Department
                };

                // Update status
                EnrollmentStatus = "Saving user to database...";
                
                // Create user directly in backend (fingerprint will be added when SDK is integrated)
                // TODO: Replace with SDK fingerprint capture when SDK is integrated
                var response = await _apiService.CreateUserDirectlyAsync(request);

                if (response != null && response.Success)
                {
                    // Success!
                    EnrollmentSuccess = true;
                    EnrollmentStatus = $"✓ User created successfully!";
                    
                    // Show success message box
                    System.Windows.MessageBox.Show(
                        $"User {FirstName} {LastName} (ID: {EmployeeId}) created successfully!\n\n" +
                        $"Default email: {EmployeeId.ToLower()}@company.com\n" +
                        $"Default password: ChangeMe123!\n\n" +
                        $"Note: Fingerprint enrollment will be available when SDK is integrated.",
                        "User Created",
                        System.Windows.MessageBoxButton.OK,
                        System.Windows.MessageBoxImage.Information);
                    
                    // Clear form
                    ClearForm();
                }
                else
                {
                    // Failed
                    EnrollmentSuccess = false;
                    ErrorMessage = response?.Message ?? "User creation failed";
                    EnrollmentStatus = "✗ User creation failed";
                    
                    System.Windows.MessageBox.Show(
                        $"User creation failed: {ErrorMessage}",
                        "Creation Failed",
                        System.Windows.MessageBoxButton.OK,
                        System.Windows.MessageBoxImage.Error);
                }
            }
            catch (Exception ex)
            {
                EnrollmentSuccess = false;
                ErrorMessage = $"Error: {ex.Message}";
                EnrollmentStatus = "✗ Error occurred";
                
                System.Windows.MessageBox.Show(
                    $"Error: {ex.Message}",
                    "Error",
                    System.Windows.MessageBoxButton.OK,
                    System.Windows.MessageBoxImage.Error);
            }
            finally
            {
                IsEnrolling = false;
            }
        }

        /// <summary>
        /// Clear the enrollment form
        /// </summary>
        private void ClearForm()
        {
            FirstName = string.Empty;
            LastName = string.Empty;
            Department = string.Empty;
            EnrollmentStatus = "Ready to enroll";
            EnrollmentSuccess = false;
            ErrorMessage = string.Empty;
            
            // Generate next employee ID
            _ = GenerateNextEmployeeIdAsync();
        }
        
        /// <summary>
        /// Auto-generate next employee ID from backend
        /// </summary>
        private async System.Threading.Tasks.Task GenerateNextEmployeeIdAsync()
        {
            try
            {
                Console.WriteLine("[EnrollUserViewModel] Fetching next employee ID from backend...");
                
                // Call backend to get next available employee ID
                var response = await _apiService.GetNextEmployeeIdAsync();
                
                if (!string.IsNullOrEmpty(response))
                {
                    EmployeeId = response;
                    Console.WriteLine($"[EnrollUserViewModel] Auto-generated Employee ID: {response}");
                }
                else
                {
                    // Generate a random ID to avoid duplicates
                    var random = new Random();
                    var randomNum = random.Next(9000, 9999);
                    EmployeeId = $"EMP{randomNum}";
                    Console.WriteLine($"[EnrollUserViewModel] Backend returned empty, using random ID: {EmployeeId}");
                    
                    ErrorMessage = "Could not fetch next employee ID from backend. Using random ID. Please verify before saving.";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EnrollUserViewModel] Error fetching employee ID: {ex.Message}");
                
                // Generate a random ID to avoid duplicates
                var random = new Random();
                var randomNum = random.Next(9000, 9999);
                EmployeeId = $"EMP{randomNum}";
                
                ErrorMessage = "Could not connect to backend. Using random ID. Please ensure backend is running and verify the ID before saving.";
            }
        }

        #endregion
    }
}
