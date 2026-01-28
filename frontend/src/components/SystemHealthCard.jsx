export default function SystemHealthCard() {
  const metrics = [
    { label: 'API Response', value: '98.7%', status: 'healthy', color: 'green' },
    { label: 'Database', value: '99.9%', status: 'healthy', color: 'green' },
    { label: 'Uptime', value: '99.5%', status: 'stable', color: 'blue' },
    { label: 'Active Users', value: '247', status: 'high', color: 'yellow' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                metric.color === 'green' ? 'bg-green-100 text-green-700' :
                metric.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {metric.status}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
