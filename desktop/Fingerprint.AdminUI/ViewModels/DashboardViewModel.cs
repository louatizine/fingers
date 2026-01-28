using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Fingerprint.AdminUI.Helpers;
using Fingerprint.AdminUI.Models;
using Fingerprint.AdminUI.Services;

namespace Fingerprint.AdminUI.ViewModels
{
    /// <summary>
    /// ViewModel for the Dashboard view
    /// Shows recent attendance logs and statistics
    /// </summary>
    public class DashboardViewModel : ViewModelBase
    {
        private readonly ApiService _apiService;
        private bool _isLoading;
        private string _errorMessage = string.Empty;

        public DashboardViewModel(ApiService apiService)
        {
            _apiService = apiService;
            AttendanceLogs = new ObservableCollection<AttendanceLog>();
            RefreshCommand = new AsyncRelayCommand(async _ => await LoadAttendanceLogsAsync());

            // Load initial data
            _ = LoadAttendanceLogsAsync();
        }

        #region Properties

        /// <summary>
        /// Collection of recent attendance logs
        /// Bound to DataGrid in the view
        /// </summary>
        public ObservableCollection<AttendanceLog> AttendanceLogs { get; }

        /// <summary>
        /// Is data currently loading?
        /// Used to show/hide loading spinner
        /// </summary>
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        /// <summary>
        /// Error message to display
        /// </summary>
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        #endregion

        #region Commands

        public AsyncRelayCommand RefreshCommand { get; }

        #endregion

        #region Methods

        /// <summary>
        /// Load recent attendance logs from the backend
        /// </summary>
        private async Task LoadAttendanceLogsAsync()
        {
            IsLoading = true;
            ErrorMessage = string.Empty;

            try
            {
                var logs = await _apiService.GetRecentAttendanceAsync(20);
                
                AttendanceLogs.Clear();
                foreach (var log in logs)
                {
                    AttendanceLogs.Add(log);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load attendance logs: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        #endregion
    }
}
