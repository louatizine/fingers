using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Windows.Forms;
using FingerprintAttendanceApp.Services;
using Microsoft.Extensions.Logging;

namespace FingerprintAttendanceApp.Forms
{
    public class NetworkScanForm : Form
    {
        private readonly ILogger? _logger;
        private TextBox txtSubnet;
        private ListBox lstResults;
        private Button btnScan;
        private Button btnTryCommon;
        private Button btnClose;
        private Label lblStatus;
        private ProgressBar progressBar;
        private bool _isScanning = false;

        public string? SelectedIpAddress { get; private set; }

        public NetworkScanForm(ILogger? logger = null)
        {
            _logger = logger;
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "Network Device Scanner";
            this.Size = new Size(600, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;

            // Subnet Label and TextBox
            var lblSubnet = new Label
            {
                Text = "Network Subnet:",
                Location = new Point(20, 20),
                Size = new Size(100, 20)
            };

            txtSubnet = new TextBox
            {
                Text = "192.168.100",
                Location = new Point(130, 20),
                Size = new Size(120, 20)
            };

            // Scan Button
            btnScan = new Button
            {
                Text = "Scan Network",
                Location = new Point(260, 18),
                Size = new Size(100, 25)
            };
            btnScan.Click += BtnScan_Click;

            // Try Common IPs Button
            btnTryCommon = new Button
            {
                Text = "Try Common IPs",
                Location = new Point(370, 18),
                Size = new Size(120, 25)
            };
            btnTryCommon.Click += BtnTryCommon_Click;

            // Status Label
            lblStatus = new Label
            {
                Location = new Point(20, 55),
                Size = new Size(540, 20),
                Text = "Enter subnet and click Scan Network (e.g., 192.168.100 will scan 192.168.100.1-254)"
            };

            // Progress Bar
            progressBar = new ProgressBar
            {
                Location = new Point(20, 80),
                Size = new Size(540, 20),
                Visible = false
            };

            // Results ListBox
            lstResults = new ListBox
            {
                Location = new Point(20, 110),
                Size = new Size(540, 280),
                Font = new Font("Consolas", 9)
            };
            lstResults.DoubleClick += LstResults_DoubleClick;

            // Close Button
            btnClose = new Button
            {
                Text = "Close",
                Location = new Point(460, 400),
                Size = new Size(100, 30)
            };
            btnClose.Click += (s, e) => this.Close();

            // Add controls
            this.Controls.AddRange(new Control[]
            {
                lblSubnet, txtSubnet, btnScan, btnTryCommon,
                lblStatus, progressBar, lstResults, btnClose
            });
        }

        private async void BtnScan_Click(object? sender, EventArgs e)
        {
            if (_isScanning) return;

            string subnet = txtSubnet.Text.Trim();
            if (string.IsNullOrEmpty(subnet))
            {
                MessageBox.Show("Please enter a subnet (e.g., 192.168.100)", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _isScanning = true;
            btnScan.Enabled = false;
            btnTryCommon.Enabled = false;
            lstResults.Items.Clear();
            progressBar.Visible = true;
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Maximum = 254;
            progressBar.Value = 0;

            lblStatus.Text = $"Scanning {subnet}.1 to {subnet}.254 on port 4370...";
            lstResults.Items.Add("=== Starting Network Scan ===");
            lstResults.Items.Add($"Subnet: {subnet}.0/24");
            lstResults.Items.Add($"Port: 4370 (fingerprint device)");
            lstResults.Items.Add("");

            await Task.Run(async () =>
            {
                int found = 0;
                for (int i = 1; i <= 254; i++)
                {
                    string ip = $"{subnet}.{i}";
                    
                    if (TestTcpPort(ip, 4370, 300))
                    {
                        found++;
                        this.Invoke((Action)(() =>
                        {
                            lstResults.Items.Add($"✅ FOUND: {ip}:4370 - Device responding!");
                            lstResults.TopIndex = lstResults.Items.Count - 1;
                        }));
                    }

                    this.Invoke((Action)(() =>
                    {
                        progressBar.Value = i;
                        lblStatus.Text = $"Scanning... {i}/254 - Found {found} device(s)";
                    }));

                    await Task.Delay(10); // Small delay
                }

                this.Invoke((Action)(() =>
                {
                    lstResults.Items.Add("");
                    lstResults.Items.Add($"=== Scan Complete: {found} device(s) found ===");
                    
                    if (found == 0)
                    {
                        lstResults.Items.Add("");
                        lstResults.Items.Add("❌ No devices found. Try:");
                        lstResults.Items.Add("   1. Check device is powered on");
                        lstResults.Items.Add("   2. Verify network cable is connected");
                        lstResults.Items.Add("   3. Try 'Try Common IPs' button");
                        lstResults.Items.Add("   4. Check device display for IP address");
                    }
                    else
                    {
                        lstResults.Items.Add("");
                        lstResults.Items.Add("💡 Double-click an IP address to select it");
                    }

                    lstResults.TopIndex = lstResults.Items.Count - 1;
                    lblStatus.Text = $"Scan complete - {found} device(s) found";
                }));
            });

            progressBar.Visible = false;
            btnScan.Enabled = true;
            btnTryCommon.Enabled = true;
            _isScanning = false;
        }

        private async void BtnTryCommon_Click(object? sender, EventArgs e)
        {
            if (_isScanning) return;

            _isScanning = true;
            btnScan.Enabled = false;
            btnTryCommon.Enabled = false;
            lstResults.Items.Clear();
            progressBar.Visible = true;
            progressBar.Style = ProgressBarStyle.Marquee;

            List<string> commonIPs = new List<string>
            {
                "192.168.100.100", "192.168.100.200", "192.168.100.201",
                "192.168.100.50", "192.168.100.101", "192.168.100.102",
                "192.168.1.201", "192.168.1.202", "192.168.1.100",
                "192.168.0.100", "192.168.0.200", "192.168.0.201"
            };

            lblStatus.Text = "Testing common fingerprint device IPs...";
            lstResults.Items.Add("=== Testing Common Device IPs ===");
            lstResults.Items.Add("Port: 4370");
            lstResults.Items.Add("");

            await Task.Run(() =>
            {
                int found = 0;
                foreach (var ip in commonIPs)
                {
                    this.Invoke((Action)(() =>
                    {
                        lstResults.Items.Add($"Testing {ip}...");
                        lstResults.TopIndex = lstResults.Items.Count - 1;
                    }));

                    if (TestTcpPort(ip, 4370, 500))
                    {
                        found++;
                        this.Invoke((Action)(() =>
                        {
                            lstResults.Items[lstResults.Items.Count - 1] = $"✅ {ip}:4370 - FOUND!";
                        }));
                    }
                    else
                    {
                        this.Invoke((Action)(() =>
                        {
                            lstResults.Items[lstResults.Items.Count - 1] = $"❌ {ip}:4370 - Not responding";
                        }));
                    }
                }

                this.Invoke((Action)(() =>
                {
                    lstResults.Items.Add("");
                    lstResults.Items.Add($"=== Test Complete: {found} device(s) found ===");
                    
                    if (found == 0)
                    {
                        lstResults.Items.Add("");
                        lstResults.Items.Add("💡 No common IPs worked. Try full network scan.");
                    }
                    else
                    {
                        lstResults.Items.Add("");
                        lstResults.Items.Add("💡 Double-click an IP address to select it");
                    }

                    lblStatus.Text = $"Test complete - {found} device(s) found";
                    lstResults.TopIndex = lstResults.Items.Count - 1;
                }));
            });

            progressBar.Visible = false;
            btnScan.Enabled = true;
            btnTryCommon.Enabled = true;
            _isScanning = false;
        }

        private void LstResults_DoubleClick(object? sender, EventArgs e)
        {
            if (lstResults.SelectedItem == null) return;

            string selected = lstResults.SelectedItem.ToString() ?? "";
            
            // Extract IP address from selected line
            if (selected.Contains("✅") && selected.Contains(":4370"))
            {
                int start = selected.IndexOf(' ') + 1;
                int end = selected.IndexOf(':');
                
                if (end > start)
                {
                    string ip = selected.Substring(start, end - start).Trim();
                    
                    var result = MessageBox.Show(
                        $"Use this IP address?\n\n{ip}:4370\n\n" +
                        "This will update your appsettings.json file.",
                        "Confirm IP Selection",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question);

                    if (result == DialogResult.Yes)
                    {
                        SelectedIpAddress = ip;
                        this.DialogResult = DialogResult.OK;
                        this.Close();
                    }
                }
            }
        }

        private bool TestTcpPort(string ip, int port, int timeoutMs)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect(ip, port, null, null);
                    var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(timeoutMs));
                    
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
    }
}
