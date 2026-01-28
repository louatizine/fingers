import { CalendarIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function UpcomingTimeOffCard() {
  const upcomingTimeOff = [
    { type: 'Vacances', date: '15–22 Juillet', status: 'approved' },
    { type: 'Congé Médical', date: '5 Août', status: 'pending' },
    { type: 'Congé Personnel', date: '10 Septembre', status: 'approved' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Congés à Venir
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ajouter un congé
        </button>
      </div>

      <div className="space-y-4">
        {upcomingTimeOff.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <div
              className={`p-2 rounded-lg ${
                item.status === 'approved'
                  ? 'bg-green-100'
                  : 'bg-yellow-100'
              } mr-3`}
            >
              <CalendarIcon
                className={`h-5 w-5 ${
                  item.status === 'approved'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {item.type}
              </p>
              <p className="text-sm text-gray-500">
                {item.date}
              </p>
            </div>

            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  )
}
