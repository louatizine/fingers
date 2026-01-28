using Fingerprint.AdminUI.ViewModels;
using System.Windows;

namespace Fingerprint.AdminUI
{
    /// <summary>
    /// Main window - uses dependency injection
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow(MainViewModel viewModel)
        {
            InitializeComponent();
            DataContext = viewModel;
        }
    }
}
