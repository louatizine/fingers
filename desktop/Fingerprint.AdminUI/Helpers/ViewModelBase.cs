using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Fingerprint.AdminUI.Helpers
{
    /// <summary>
    /// Base class for ViewModels implementing INotifyPropertyChanged
    /// This is the foundation of MVVM - it notifies the UI when properties change
    /// </summary>
    public class ViewModelBase : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        /// <summary>
        /// Raises the PropertyChanged event
        /// CallerMemberName automatically gets the property name
        /// </summary>
        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        /// <summary>
        /// Sets a property value and raises PropertyChanged if it changes
        /// Usage: SetProperty(ref _field, value);
        /// </summary>
        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (Equals(field, value)) return false;
            
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}
