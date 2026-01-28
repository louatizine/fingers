using System.Collections.ObjectModel;
using System.Windows.Input;
using Fingerprint.AdminUI.Helpers;
using Fingerprint.AdminUI.Models;
using Fingerprint.AdminUI.Services;

namespace Fingerprint.AdminUI.ViewModels
{
    /// <summary>
    /// Main ViewModel for the application
    /// Manages navigation and overall application state
    /// This is the parent ViewModel that hosts all other views
    /// </summary>
    public class MainViewModel : ViewModelBase
    {
        private readonly ApiService _apiService;
        private ViewModelBase _currentView;
        private DeviceStatus? _deviceStatus;
        private string _statusMessage = "Ready";

        public MainViewModel(
            ApiService apiService,
            DashboardViewModel dashboardViewModel,
            EnrollUserViewModel enrollUserViewModel,
            AttendanceViewModel attendanceViewModel,
            SettingsViewModel settingsViewModel)
        {
            _apiService = apiService;

            // Inject child ViewModels
            DashboardViewModel = dashboardViewModel;
            EnrollUserViewModel = enrollUserViewModel;
            AttendanceViewModel = attendanceViewModel;
            SettingsViewModel = settingsViewModel;

            // Set initial view
            _currentView = DashboardViewModel;

            // Initialize commands
            NavigateToDashboardCommand = new RelayCommand(_ => CurrentView = DashboardViewModel);
            NavigateToEnrollCommand = new RelayCommand(_ => CurrentView = EnrollUserViewModel);
            NavigateToSettingsCommand = new RelayCommand(_ => CurrentView = SettingsViewModel);
            RefreshDeviceStatusCommand = new AsyncRelayCommand(async _ => await RefreshDeviceStatusAsync());

            // Load initial data
            _ = RefreshDeviceStatusAsync();
        }

        #region Properties

        /// <summary>
        /// Currently displayed view (Dashboard, Enroll, or Settings)
        /// Bound to ContentControl in MainWindow
        /// </summary>
        public ViewModelBase CurrentView
        {
            get => _currentView;
            set => SetProperty(ref _currentView, value);
        }

        /// <summary>
        /// Current fingerprint device status
        /// </summary>
        public DeviceStatus? DeviceStatus
        {
            get => _deviceStatus;
            set => SetProperty(ref _deviceStatus, value);
        }

        /// <summary>
        /// Status message displayed in the UI
        /// </summary>
        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        /// <summary>
        /// Is the device connected?
        /// </summary>
        public bool IsDeviceConnected => DeviceStatus?.IsConnected ?? false;

        #endregion

        #region Child ViewModels

        public DashboardViewModel DashboardViewModel { get; }
        public EnrollUserViewModel EnrollUserViewModel { get; }
        public AttendanceViewModel AttendanceViewModel { get; }
        public SettingsViewModel SettingsViewModel { get; }

        #endregion

        #region Commands

        public ICommand NavigateToDashboardCommand { get; }
        public ICommand NavigateToEnrollCommand { get; }
        public ICommand NavigateToSettingsCommand { get; }
        public ICommand RefreshDeviceStatusCommand { get; }

        #endregion

        #region Methods

        private async System.Threading.Tasks.Task RefreshDeviceStatusAsync()
        {
            StatusMessage = "Checking device...";
            DeviceStatus = await _apiService.GetDeviceStatusAsync();
            
            if (DeviceStatus != null)
            {
                StatusMessage = DeviceStatus.IsConnected 
                    ? $"Device connected: {DeviceStatus.DeviceName}" 
                    : "Device disconnected";
            }
            else
            {
                StatusMessage = "Cannot connect to device service";
            }

            OnPropertyChanged(nameof(IsDeviceConnected));
        }

        #endregion
    }
}
