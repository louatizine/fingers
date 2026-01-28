using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Windows;
using Fingerprint.AdminUI.Services;
using Fingerprint.AdminUI.ViewModels;

namespace Fingerprint.AdminUI
{
    /// <summary>
    /// Application entry point with Dependency Injection
    /// </summary>
    public partial class App : Application
    {
        private readonly IHost _host;

        public App()
        {
            // Configure dependency injection
            _host = Host.CreateDefaultBuilder()
                .ConfigureServices((context, services) =>
                {
                    // Register HTTP clients
                    services.AddHttpClient("LocalService", client =>
                    {
                        client.BaseAddress = new System.Uri("http://localhost:5001");
                        client.Timeout = System.TimeSpan.FromSeconds(30);
                    });

                    services.AddHttpClient("Backend", client =>
                    {
                        client.BaseAddress = new System.Uri("http://localhost:5000/api/");
                        client.Timeout = System.TimeSpan.FromSeconds(30);
                    });

                    // Register services
                    services.AddSingleton<ApiService>();

                    // Register ViewModels
                    services.AddSingleton<MainViewModel>();
                    services.AddTransient<DashboardViewModel>();
                    services.AddTransient<EnrollUserViewModel>();
                    services.AddTransient<AttendanceViewModel>();
                    services.AddTransient<SettingsViewModel>();

                    // Register Main Window
                    services.AddSingleton<MainWindow>();
                })
                .Build();
        }

        protected override async void OnStartup(StartupEventArgs e)
        {
            try
            {
                await _host.StartAsync();

                var mainWindow = _host.Services.GetRequiredService<MainWindow>();
                mainWindow.Show();

                base.OnStartup(e);
            }
            catch (Exception ex)
            {
                var errorLog = System.IO.Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.Desktop), 
                    "FingerprintUI_Error.txt");
                
                System.IO.File.WriteAllText(errorLog, 
                    $"Application startup error at {DateTime.Now}\n\n" +
                    $"Message: {ex.Message}\n\n" +
                    $"Stack Trace:\n{ex.StackTrace}\n\n" +
                    $"Inner Exception: {ex.InnerException?.Message}");
                
                MessageBox.Show($"Application startup error. Check desktop for error log:\n{errorLog}", 
                    "Startup Error", 
                    MessageBoxButton.OK, 
                    MessageBoxImage.Error);
                Shutdown(1);
            }
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            await _host.StopAsync();
            _host.Dispose();

            base.OnExit(e);
        }
    }
}
