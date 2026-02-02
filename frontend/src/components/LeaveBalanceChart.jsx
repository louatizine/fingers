import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'

const COLOR_PALETTE = {
  dataViz: [
    '#0078d4', // Blue
    '#00b7c3', // Teal
    '#107c10', // Soft Green  
    '#8a8886', // Gray
    '#5c2d91', // Purple
    '#ffb900', // Yellow
    '#a4262c', // Red
    '#004578'  // Dark Blue
  ]
}

export default function LeaveBalanceChart({ leaveBalance }) {
  const { t } = useTranslation()
  
  const leaveBalanceData = leaveBalance
    ? [
        {
          name: t('leaves.types.annual'),
          value: leaveBalance.annual || 0,
          color: COLOR_PALETTE.dataViz[0]
        },
        {
          name: t('leaves.types.sick'),
          value: leaveBalance.sick || 0,
          color: COLOR_PALETTE.dataViz[1]
        },
        {
          name: t('leaves.types.unpaid'),
          value: leaveBalance.unpaid || 0,
          color: COLOR_PALETTE.dataViz[2]
        },
        {
          name: t('leaves.types.maternity'),
          value: leaveBalance.maternity || 0,
          color: COLOR_PALETTE.dataViz[3]
        }
      ]
    : []

  return (
    <div className="lg:col-span-2 bg-white shadow-sm border border-[#d2d0ce] rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#323130]">
            {t('leaves.balanceTitle')}
          </h3>
          <p className="text-sm text-[#605e5c]">
            {t('leaves.balanceDescription')}
          </p>
        </div>

        <select className="text-sm border border-[#8a8886] rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0078d4] focus:border-[#0078d4] text-[#323130]">
          <option>{t('common.thisYear')}</option>
          <option>{t('common.previousYear')}</option>
        </select>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={leaveBalanceData}
              dataKey="value"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} : ${(percent * 100).toFixed(0)} %`
              }
            >
              {leaveBalanceData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [`${value} ${t('common.days')}`, t('leaves.balance')]}
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
