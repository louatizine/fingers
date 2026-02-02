import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function LeaveTrendsChart() {
  const leaveTrendData = [
    { month: 'Jan', leaves: 2 },
    { month: 'Feb', leaves: 3 },
    { month: 'Mar', leaves: 1 },
    { month: 'Apr', leaves: 4 },
    { month: 'May', leaves: 2 },
    { month: 'Jun', leaves: 3 }
  ]

  return (
    <div className="bg-white shadow-sm border border-[#d2d0ce] rounded-sm p-6">
      <h3 className="text-lg font-semibold text-[#323130] mb-4">{t('attendance.leaveTrends')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={leaveTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1dfdd" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#605e5c', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#605e5c', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #d2d0ce', 
                borderRadius: '2px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="leaves" 
              stroke="#0078d4" 
              fill="#deecf9"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
