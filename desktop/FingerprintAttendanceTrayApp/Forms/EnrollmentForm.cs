using System;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using FingerprintAttendanceApp.Models;
using FingerprintAttendanceApp.Services;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Forms
{
    public class EnrollmentForm : Form
    {
        private readonly ApiClient _apiClient;
        private readonly FingerprintService _fingerprintService;
        private readonly ILogger? _logger;
        
        private TextBox txtEmployeeId;
        private Label lblStatus;
        private Label lblUserInfo;
        private Button btnLookup;
        private Button btnEnroll;
        private Button btnCancel;
        private ProgressBar progressBar;
        private User? _currentUser;
        private bool _enrollmentInProgress = false;

        public EnrollmentForm(ApiClient apiClient, FingerprintService fingerprintService, ILogger? logger = null)
        {
            _apiClient = apiClient;
            _fingerprintService = fingerprintService;
            _logger = logger;
            
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "Enroll User Fingerprint";
            this.Size = new Size(500, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;

            // Employee ID Label
            var lblEmployeeId = new Label
            {
                Text = "Employee ID:",
                Location = new Point(20, 20),
                Size = new Size(100, 20)
            };

            // Employee ID TextBox
            txtEmployeeId = new TextBox
            {
                Location = new Point(130, 20),
                Size = new Size(200, 20)
            };
            txtEmployeeId.KeyPress += TxtEmployeeId_KeyPress;

            // Lookup Button
            btnLookup = new Button
            {
                Text = "Lookup",
                Location = new Point(340, 18),
                Size = new Size(80, 25)
            };
            btnLookup.Click += BtnLookup_Click;

            // User Info Label
            lblUserInfo = new Label
            {
                Location = new Point(20, 60),
                Size = new Size(440, 80),
                BorderStyle = BorderStyle.FixedSingle,
                BackColor = Color.WhiteSmoke,
                Text = "Enter Employee ID and click Lookup",
                TextAlign = ContentAlignment.MiddleCenter
            };

            // Status Label
            lblStatus = new Label
            {
                Location = new Point(20, 150),
                Size = new Size(440, 60),
                BorderStyle = BorderStyle.FixedSingle,
                BackColor = Color.LightYellow,
                Text = "",
                TextAlign = ContentAlignment.MiddleLeft,
                Font = new Font(this.Font.FontFamily, 9)
            };

            // Progress Bar
            progressBar = new ProgressBar
            {
                Location = new Point(20, 220),
                Size = new Size(440, 20),
                Visible = false
            };

            // Enroll Button
            btnEnroll = new Button
            {
                Text = "Start Enrollment",
                Location = new Point(100, 260),
                Size = new Size(120, 35),
                Enabled = false
            };
            btnEnroll.Click += BtnEnroll_Click;

            // Cancel Button
            btnCancel = new Button
            {
                Text = "Close",
                Location = new Point(260, 260),
                Size = new Size(120, 35)
            };
            btnCancel.Click += (s, e) => this.Close();

            // Add controls
            this.Controls.AddRange(new Control[] 
            {
                lblEmployeeId, txtEmployeeId, btnLookup,
                lblUserInfo, lblStatus, progressBar,
                btnEnroll, btnCancel
            });
        }

        private void TxtEmployeeId_KeyPress(object? sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                BtnLookup_Click(sender, EventArgs.Empty);
            }
        }

        private async void BtnLookup_Click(object? sender, EventArgs e)
        {
            string employeeId = txtEmployeeId.Text.Trim();
            
            if (string.IsNullOrEmpty(employeeId))
            {
                MessageBox.Show("Please enter an Employee ID", "Validation", 
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnLookup.Enabled = false;
            btnEnroll.Enabled = false;
            lblStatus.Text = "Looking up employee...";
            lblUserInfo.Text = "Please wait...";

            try
            {
                var user = await _apiClient.GetUserByEmployeeIdAsync(employeeId);
                
                if (user == null)
                {
                    lblUserInfo.Text = $"❌ Employee '{employeeId}' not found in database.\n\n" +
                                      "Please create the employee in the web application first.";
                    lblStatus.Text = "User not found";
                    _currentUser = null;
                    return;
                }

                // Check if already has fingerprint
                var fingerprintStatus = await _apiClient.GetUserFingerprintStatusAsync(employeeId);
                
                _currentUser = user;
                
                lblUserInfo.Text = $"✅ Employee Found:\n\n" +
                                 $"Name: {user.DisplayName}\n" +
                                 $"ID: {user.EmployeeId}\n" +
                                 $"Department: {user.Department ?? "N/A"}\n" +
                                 $"Position: {user.Position ?? "N/A"}";

                if (fingerprintStatus?.HasFingerprint == true)
                {
                    lblStatus.Text = $"⚠️ Fingerprint already enrolled (Device ID: {fingerprintStatus.FingerprintDeviceId})\n" +
                                   "You can re-enroll if needed.";
                    lblStatus.BackColor = Color.LightCoral;
                }
                else
                {
                    lblStatus.Text = "✅ User found. Ready to enroll fingerprint.";
                    lblStatus.BackColor = Color.LightGreen;
                }

                btnEnroll.Enabled = true;
            }
            catch (Exception ex)
            {
                lblUserInfo.Text = $"❌ Error looking up employee:\n{ex.Message}";
                lblStatus.Text = "Lookup failed";
                _currentUser = null;
                _logger?.LogError($"Error looking up employee: {ex.Message}");
            }
            finally
            {
                btnLookup.Enabled = true;
            }
        }

        private async void BtnEnroll_Click(object? sender, EventArgs e)
        {
            if (_currentUser == null || _enrollmentInProgress)
                return;

            if (!_fingerprintService.IsConnected)
            {
                MessageBox.Show("Fingerprint device is not connected.\nPlease check device connection.", 
                    "Device Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            _enrollmentInProgress = true;
            btnEnroll.Enabled = false;
            btnLookup.Enabled = false;
            txtEmployeeId.Enabled = false;
            progressBar.Visible = true;
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                string employeeId = _currentUser.EmployeeId ?? txtEmployeeId.Text.Trim();
                string fullName = _currentUser.DisplayName ?? $"{_currentUser.FirstName} {_currentUser.LastName}".Trim();

                if (string.IsNullOrEmpty(fullName))
                    fullName = employeeId;

                lblStatus.Text = "Starting enrollment on device...";
                lblStatus.BackColor = Color.LightBlue;

                var result = await _fingerprintService.EnrollUserAsync(employeeId, fullName);
                
                if (!result.Success)
                {
                    MessageBox.Show($"Failed to start enrollment:\n{result.Message}", 
                        "Enrollment Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                lblStatus.Text = "👆 Please scan finger on device (3 times)...\n" +
                               "Follow the prompts on the fingerprint device.";

                // Wait for user to complete scans on device
                var enrollmentDialog = MessageBox.Show(
                    "Please complete the fingerprint scans on the device.\n\n" +
                    "The device will beep and show instructions.\n" +
                    "Scan the same finger 3 times.\n\n" +
                    "Click OK when you've completed all scans.",
                    "Fingerprint Enrollment",
                    MessageBoxButtons.OKCancel,
                    MessageBoxIcon.Information);

                if (enrollmentDialog == DialogResult.Cancel)
                {
                    lblStatus.Text = "Enrollment cancelled by user";
                    lblStatus.BackColor = Color.LightYellow;
                    return;
                }

                lblStatus.Text = "Completing enrollment...";

                var completeResult = await _fingerprintService.CompleteEnrollmentAsync(employeeId);
                
                if (completeResult.Success)
                {
                    lblStatus.Text = "Updating database...";
                    
                    // Update database
                    bool updated = await _apiClient.UpdateFingerprintStatusAsync(
                        employeeId, 
                        completeResult.DeviceUserId ?? "0");

                    if (updated)
                    {
                        lblStatus.Text = $"🎉 Enrollment Completed Successfully!\n" +
                                       $"Device User ID: {completeResult.DeviceUserId}";
                        lblStatus.BackColor = Color.LightGreen;
                        
                        MessageBox.Show(
                            $"Fingerprint enrolled successfully!\n\n" +
                            $"Employee: {fullName}\n" +
                            $"Device User ID: {completeResult.DeviceUserId}\n" +
                            $"Status: Active",
                            "Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                    }
                    else
                    {
                        lblStatus.Text = "⚠️ Enrolled on device but database update failed";
                        lblStatus.BackColor = Color.LightCoral;
                        
                        MessageBox.Show(
                            "Fingerprint was enrolled on the device but failed to update the database.\n" +
                            "Please update the status manually in the web application.",
                            "Partial Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Warning);
                    }
                }
                else
                {
                    lblStatus.Text = $"❌ Enrollment failed: {completeResult.Message}";
                    lblStatus.BackColor = Color.LightCoral;
                    
                    MessageBox.Show($"Enrollment failed:\n{completeResult.Message}", 
                        "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"❌ Error: {ex.Message}";
                lblStatus.BackColor = Color.LightCoral;
                
                MessageBox.Show($"Error during enrollment:\n{ex.Message}", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                
                _logger?.LogError($"Enrollment error: {ex.Message}");
            }
            finally
            {
                _enrollmentInProgress = false;
                progressBar.Visible = false;
                btnEnroll.Enabled = _currentUser != null;
                btnLookup.Enabled = true;
                txtEmployeeId.Enabled = true;
            }
        }
    }
}
