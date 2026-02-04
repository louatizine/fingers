using System;
using System.Drawing;
using System.Windows.Forms;
using FingerprintAttendanceApp.Models;

namespace FingerprintAttendanceApp.Forms
{
    /// <summary>
    /// Specialized prompt form for new employee enrollment notifications
    /// </summary>
    public class EnrollmentPromptForm : Form
    {
        private readonly PendingUser _user;
        private readonly bool _deviceReady;
        private Label lblTitle;
        private Label lblUserInfo;
        private Label lblDeviceStatus;
        private Button btnYes;
        private Button btnNo;
        private Button btnLater;
        private PictureBox picIcon;

        public EnrollmentPromptForm(PendingUser user, bool deviceReady)
        {
            _user = user;
            _deviceReady = deviceReady;
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "New Employee Detected";
            this.Size = new Size(500, 350);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;
            this.TopMost = true; // Keep on top to ensure visibility

            // Icon
            picIcon = new PictureBox
            {
                Location = new Point(20, 20),
                Size = new Size(64, 64),
                SizeMode = PictureBoxSizeMode.CenterImage
            };
            
            // Set icon based on device status
            if (_deviceReady)
            {
                picIcon.Image = SystemIcons.Information.ToBitmap();
            }
            else
            {
                picIcon.Image = SystemIcons.Warning.ToBitmap();
            }

            // Title
            lblTitle = new Label
            {
                Text = "🔔 NEW EMPLOYEE DETECTED",
                Location = new Point(100, 20),
                Size = new Size(370, 30),
                Font = new Font("Segoe UI", 14, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 120, 215)
            };

            // User Info Panel
            var pnlUserInfo = new Panel
            {
                Location = new Point(20, 70),
                Size = new Size(450, 120),
                BorderStyle = BorderStyle.FixedSingle,
                BackColor = Color.FromArgb(240, 248, 255)
            };

            lblUserInfo = new Label
            {
                Location = new Point(10, 10),
                Size = new Size(430, 100),
                Font = new Font("Segoe UI", 10),
                Text = $"Employee Name: {_user.DisplayName}\n" +
                       $"Employee ID: {_user.EmployeeId}\n" +
                       $"Department: {_user.Department ?? "N/A"}\n" +
                       $"Position: {_user.Position ?? "N/A"}\n" +
                       $"Biometric ID: {_user.BiometricId:000}"
            };

            pnlUserInfo.Controls.Add(lblUserInfo);

            // Device Status
            lblDeviceStatus = new Label
            {
                Location = new Point(20, 200),
                Size = new Size(450, 50),
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                BorderStyle = BorderStyle.FixedSingle
            };

            if (_deviceReady)
            {
                lblDeviceStatus.Text = "✅ Device Ready for Enrollment\n\nFingerprint device is connected and ready";
                lblDeviceStatus.BackColor = Color.FromArgb(220, 255, 220);
                lblDeviceStatus.ForeColor = Color.DarkGreen;
            }
            else
            {
                lblDeviceStatus.Text = "⚠️ Device Not Ready\n\nPlease connect the fingerprint device first";
                lblDeviceStatus.BackColor = Color.FromArgb(255, 240, 220);
                lblDeviceStatus.ForeColor = Color.DarkOrange;
            }

            // Buttons
            if (_deviceReady)
            {
                btnYes = new Button
                {
                    Text = "✓ Enroll Now",
                    Location = new Point(50, 270),
                    Size = new Size(120, 40),
                    Font = new Font("Segoe UI", 10, FontStyle.Bold),
                    BackColor = Color.FromArgb(0, 120, 215),
                    ForeColor = Color.White,
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand
                };
                btnYes.FlatAppearance.BorderSize = 0;
                btnYes.Click += (s, e) => { this.DialogResult = DialogResult.Yes; this.Close(); };

                btnLater = new Button
                {
                    Text = "⏰ Remind Me Later",
                    Location = new Point(190, 270),
                    Size = new Size(140, 40),
                    Font = new Font("Segoe UI", 10),
                    BackColor = Color.FromArgb(240, 240, 240),
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand
                };
                btnLater.Click += (s, e) => { this.DialogResult = DialogResult.Retry; this.Close(); };

                btnNo = new Button
                {
                    Text = "✗ Skip",
                    Location = new Point(350, 270),
                    Size = new Size(100, 40),
                    Font = new Font("Segoe UI", 10),
                    BackColor = Color.FromArgb(240, 240, 240),
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand
                };
                btnNo.Click += (s, e) => { this.DialogResult = DialogResult.No; this.Close(); };

                this.Controls.AddRange(new Control[] { btnYes, btnLater, btnNo });
            }
            else
            {
                // Device not ready - only show Close button
                var btnClose = new Button
                {
                    Text = "Close",
                    Location = new Point(200, 270),
                    Size = new Size(100, 40),
                    Font = new Font("Segoe UI", 10),
                    BackColor = Color.FromArgb(240, 240, 240),
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand
                };
                btnClose.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };
                this.Controls.Add(btnClose);
            }

            // Add all controls
            this.Controls.AddRange(new Control[]
            {
                picIcon, lblTitle, pnlUserInfo, lblDeviceStatus
            });

            // Play notification sound
            System.Media.SystemSounds.Asterisk.Play();
        }
    }
}
