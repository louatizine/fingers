using System;
using System.Windows.Forms;

namespace FingerprintAttendanceApp
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            // Handle unhandled exceptions
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += (sender, e) => 
            {
                MessageBox.Show($"Application error: {e.Exception.Message}", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            };
            
            // Run the tray application
            Application.Run(new TrayApplicationContext());
        }
    }
}