using System;
using System.Threading.Tasks;
using System.Windows.Input;
using Fingerprint.AdminUI.Helpers;
using Fingerprint.AdminUI.Models;
using Fingerprint.AdminUI.Services;

namespace Fingerprint.AdminUI.ViewModels
{
    /// <summary>
    /// ViewModel for attendance settings configuration
    /// Allows admins to configure:
    /// - Check-in start time
    /// - Check-out end time
    /// - Lunch break times
    /// </summary>
    public class SettingsViewModel : ViewModelBase
    {
        private readonly ApiService _apiService;
        
        private string _checkInStart = "08:00";
        private string _checkOutEnd = "17:00";
        private string _lunchBreakStart = "12:00";
        private string _lunchBreakEnd = "13:00";
        
        private bool _isLoading;
        private bool _isSaving;
        private string _statusMessage = string.Empty;
        private bool _saveSuccess;

        public SettingsViewModel(ApiService apiService)
        {
            _apiService = apiService;
            
            // Initialize commands
            LoadSettingsCommand = new AsyncRelayCommand(async _ => await LoadSettingsAsync());
            SaveSettingsCommand = new AsyncRelayCommand(
                async _ => await SaveSettingsAsync(),
                _ => !IsSaving
            );

            // Load settings on initialization
            _ = LoadSettingsAsync();
        }

        #region Properties

        /// <summary>
        /// Check-in start time (HH:mm format)
        /// Example: "08:00"
        /// </summary>
        public string CheckInStart
        {
            get => _checkInStart;
            set => SetProperty(ref _checkInStart, value);
        }

        /// <summary>
        /// Check-out end time (HH:mm format)
        /// Example: "17:00"
        /// </summary>
        public string CheckOutEnd
        {
            get => _checkOutEnd;
            set => SetProperty(ref _checkOutEnd, value);
        }

        /// <summary>
        /// Lunch break start time (HH:mm format)
        /// Example: "12:00"
        /// </summary>
        public string LunchBreakStart
        {
            get => _lunchBreakStart;
            set => SetProperty(ref _lunchBreakStart, value);
        }

        /// <summary>
        /// Lunch break end time (HH:mm format)
        /// Example: "13:00"
        /// </summary>
        public string LunchBreakEnd
        {
            get => _lunchBreakEnd;
            set => SetProperty(ref _lunchBreakEnd, value);
        }

        /// <summary>
        /// Is data currently loading?
        /// </summary>
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        /// <summary>
        /// Is save operation in progress?
        /// </summary>
        public bool IsSaving
        {
            get => _isSaving;
            set
            {
                if (SetProperty(ref _isSaving, value))
                {
                    CommandManager.InvalidateRequerySuggested();
                }
            }
        }

        /// <summary>
        /// Status message to display
        /// </summary>
        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        /// <summary>
        /// Was the last save successful?
        /// </summary>
        public bool SaveSuccess
        {
            get => _saveSuccess;
            set => SetProperty(ref _saveSuccess, value);
        }

        #endregion

        #region Commands

        public ICommand LoadSettingsCommand { get; }
        public ICommand SaveSettingsCommand { get; }

        #endregion

        #region Methods

        /// <summary>
        /// Load current attendance settings from the backend
        /// </summary>
        private async Task LoadSettingsAsync()
        {
            IsLoading = true;
            StatusMessage = "Loading settings...";

            try
            {
                var settings = await _apiService.GetAttendanceSettingsAsync();

                if (settings != null)
                {
                    CheckInStart = settings.CheckInStart;
                    CheckOutEnd = settings.CheckOutEnd;
                    LunchBreakStart = settings.LunchBreakStart;
                    LunchBreakEnd = settings.LunchBreakEnd;
                    
                    StatusMessage = "Settings loaded successfully";
                }
                else
                {
                    StatusMessage = "Failed to load settings";
                }
            }
            catch (Exception ex)
            {
                StatusMessage = $"Error loading settings: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        /// <summary>
        /// Save attendance settings to the backend
        /// </summary>
        private async Task SaveSettingsAsync()
        {
            IsSaving = true;
            SaveSuccess = false;
            StatusMessage = "Saving settings...";

            try
            {
                var settings = new AttendanceSettings
                {
                    CheckInStart = CheckInStart,
                    CheckOutEnd = CheckOutEnd,
                    LunchBreakStart = LunchBreakStart,
                    LunchBreakEnd = LunchBreakEnd,
                    WorkingDays = new[] { "Mon", "Tue", "Wed", "Thu", "Fri" }
                };

                bool success = await _apiService.UpdateAttendanceSettingsAsync(settings);

                if (success)
                {
                    SaveSuccess = true;
                    StatusMessage = "✓ Settings saved successfully!";
                    
                    // Clear success message after 3 seconds
                    await Task.Delay(3000);
                    if (SaveSuccess)
                    {
                        StatusMessage = string.Empty;
                        SaveSuccess = false;
                    }
                }
                else
                {
                    StatusMessage = "✗ Failed to save settings";
                }
            }
            catch (Exception ex)
            {
                StatusMessage = $"✗ Error: {ex.Message}";
            }
            finally
            {
                IsSaving = false;
            }
        }

        #endregion
    }
}
