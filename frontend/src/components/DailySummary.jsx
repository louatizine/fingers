import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Daily Attendance Summary Component
 * Shows check-in, check-out, and total hours for a specific employee and date
 */
function DailySummary() {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDailySummary = async () => {
    if (!employeeId) {
      setError('Please enter an employee ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/attendance/daily-summary/${employeeId}?date=${date}`
      );

      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        setError(response.data.message || 'No data found');
        setSummary(null);
      }
    } catch (err) {
      console.error('Error fetching daily summary:', err);
      setError('Failed to fetch daily summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Daily Attendance Summary</h2>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee ID
          </label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchDailySummary}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Summary'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Summary Display */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Check In</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatTime(summary.check_in)}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Check Out</div>
            <div className="text-2xl font-bold text-green-900">
              {formatTime(summary.check_out)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">Total Hours</div>
            <div className="text-2xl font-bold text-purple-900">
              {summary.total_hours ? `${summary.total_hours}h` : 'N/A'}
            </div>
          </div>

          <div className={`rounded-lg p-4 ${
            summary.status === 'complete' ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className={`text-sm font-medium mb-1 ${
              summary.status === 'complete' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              Status
            </div>
            <div className={`text-2xl font-bold ${
              summary.status === 'complete' ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {summary.status === 'complete' ? '✓ Complete' : '⚠ Incomplete'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailySummary;
