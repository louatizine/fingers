using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using FingerprintAttendanceApp.Models;
using FingerprintAttendanceApp.Services;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Forms
{
    public class UserListForm : Form
    {
        private readonly ApiClient _apiClient;
        private readonly FingerprintService? _fingerprintService;
        private readonly ILogger? _logger;
        
        private ListView listView;
        private Button btnRefresh;
        private Button btnClose;
        private Label lblStatus;
        private ComboBox cboSource;
        private ProgressBar progressBar;

        public UserListForm(ApiClient apiClient, FingerprintService? fingerprintService = null, ILogger? logger = null)
        {
            _apiClient = apiClient;
            _fingerprintService = fingerprintService;
            _logger = logger;
            
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "User List";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterScreen;

            // Source Selection
            var lblSource = new Label
            {
                Text = "Source:",
                Location = new Point(20, 20),
                Size = new Size(60, 20)
            };

            cboSource = new ComboBox
            {
                Location = new Point(85, 18),
                Size = new Size(150, 25),
                DropDownStyle = ComboBoxStyle.DropDownList
            };
            cboSource.Items.AddRange(new object[] { "API Server", "Fingerprint Device" });
            cboSource.SelectedIndex = 0;

            // Refresh Button
            btnRefresh = new Button
            {
                Text = "Refresh",
                Location = new Point(245, 17),
                Size = new Size(80, 25)
            };
            btnRefresh.Click += BtnRefresh_Click;

            // Status Label
            lblStatus = new Label
            {
                Location = new Point(345, 20),
                Size = new Size(400, 20),
                Text = "Click Refresh to load users"
            };

            // Progress Bar
            progressBar = new ProgressBar
            {
                Location = new Point(20, 50),
                Size = new Size(740, 20),
                Visible = false,
                Style = ProgressBarStyle.Marquee
            };

            // ListView
            listView = new ListView
            {
                Location = new Point(20, 80),
                Size = new Size(740, 440),
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("Consolas", 9)
            };

            listView.Columns.Add("Employee ID", 100);
            listView.Columns.Add("Name", 200);
            listView.Columns.Add("Department", 120);
            listView.Columns.Add("Position", 120);
            listView.Columns.Add("Fingerprint", 100);
            listView.Columns.Add("Device ID", 80);

            // Close Button
            btnClose = new Button
            {
                Text = "Close",
                Location = new Point(660, 530),
                Size = new Size(100, 30)
            };
            btnClose.Click += (s, e) => this.Close();

            // Add controls
            this.Controls.AddRange(new Control[]
            {
                lblSource, cboSource, btnRefresh, lblStatus, progressBar,
                listView, btnClose
            });
        }

        private async void BtnRefresh_Click(object? sender, EventArgs e)
        {
            if (cboSource.SelectedIndex == 0)
            {
                await LoadFromApi();
            }
            else
            {
                await LoadFromDevice();
            }
        }

        private async Task LoadFromApi()
        {
            btnRefresh.Enabled = false;
            progressBar.Visible = true;
            listView.Items.Clear();
            lblStatus.Text = "Loading users from API...";

            try
            {
                var users = await _apiClient.GetUsersAsync();

                if (users == null || users.Count == 0)
                {
                    lblStatus.Text = "No users found in API";
                    return;
                }

                foreach (var user in users)
                {
                    var item = new ListViewItem(user.EmployeeId ?? "N/A");
                    item.SubItems.Add(user.DisplayName ?? "");
                    item.SubItems.Add(user.Department ?? "");
                    item.SubItems.Add(user.Position ?? "");
                    item.SubItems.Add(user.HasFingerprint ? "✅ Yes" : "❌ No");
                    item.SubItems.Add(user.FingerprintDeviceId?.ToString() ?? "");
                    
                    listView.Items.Add(item);
                }

                lblStatus.Text = $"Loaded {users.Count} users from API";
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"Error loading users: {ex.Message}";
                MessageBox.Show($"Failed to load users from API:\n{ex.Message}", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error loading users from API: {ex.Message}");
            }
            finally
            {
                progressBar.Visible = false;
                btnRefresh.Enabled = true;
            }
        }

        private async Task LoadFromDevice()
        {
            if (_fingerprintService == null)
            {
                MessageBox.Show("Fingerprint service not available", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (!_fingerprintService.IsConnected)
            {
                MessageBox.Show("Fingerprint device is not connected", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            btnRefresh.Enabled = false;
            progressBar.Visible = true;
            listView.Items.Clear();
            lblStatus.Text = "Loading users from device...";

            try
            {
                await Task.Run(() =>
                {
                    var zkem = _fingerprintService.GetZKemDevice();
                    var deviceId = _fingerprintService.GetDeviceId();

                    if (zkem == null)
                    {
                        throw new Exception("Device not initialized");
                    }

                    // Disable device for reading
                    zkem.EnableDevice(deviceId, false);

                    try
                    {
                        if (zkem.ReadAllUserID(deviceId))
                        {
                            var deviceUsers = new List<(string id, string name, string password, int privilege, bool enabled)>();
                            
                            string enrollNumber = "";
                            string name = "";
                            string password = "";
                            int privilege = 0;
                            bool enabled = false;

                            while (zkem.SSR_GetAllUserInfo(deviceId, out enrollNumber, out name, 
                                   out password, out privilege, out enabled))
                            {
                                deviceUsers.Add((enrollNumber, name, password, privilege, enabled));
                            }

                            this.Invoke((Action)(() =>
                            {
                                foreach (var (id, userName, pwd, priv, isEnabled) in deviceUsers
                                         .OrderBy(u => int.TryParse(u.id, out int n) ? n : 0))
                                {
                                    var item = new ListViewItem(id);
                                    item.SubItems.Add(userName);
                                    item.SubItems.Add(""); // Department - not on device
                                    item.SubItems.Add(GetPrivilegeText(priv));
                                    item.SubItems.Add(isEnabled ? "✅ Enabled" : "❌ Disabled");
                                    item.SubItems.Add(id); // Device ID same as enroll number
                                    
                                    listView.Items.Add(item);
                                }

                                lblStatus.Text = $"Loaded {deviceUsers.Count} users from device";
                            }));
                        }
                        else
                        {
                            int errorCode = 0;
                            zkem.GetLastError(ref errorCode);
                            throw new Exception($"Failed to read users. Error code: {errorCode}");
                        }
                    }
                    finally
                    {
                        // Re-enable device
                        zkem.EnableDevice(deviceId, true);
                    }
                });
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"Error: {ex.Message}";
                MessageBox.Show($"Failed to load users from device:\n{ex.Message}", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                _logger?.LogError($"Error loading users from device: {ex.Message}");
            }
            finally
            {
                progressBar.Visible = false;
                btnRefresh.Enabled = true;
            }
        }

        private string GetPrivilegeText(int privilege)
        {
            return privilege switch
            {
                0 => "User",
                1 => "Enroller",
                2 => "Manager",
                3 => "Admin",
                _ => $"Level {privilege}"
            };
        }

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            // Auto-load on form open
            BtnRefresh_Click(null, EventArgs.Empty);
        }
    }
}
