import React from 'react'

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  red: 'bg-red-50 text-red-700 ring-red-200'
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow cursor-pointer`}>
      {/* Colored icon circle */}
      <div className={`flex items-center justify-center h-12 w-12 rounded-xl ring-2 ${colorMap[color]} mb-3`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Stat text */}
      <div>
        <p className="text-xs font-semibold text-neutral-dark uppercase">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-neutral-charcoal">{value}</p>
        {subtitle && <p className="mt-1 text-sm text-neutral-medium">{subtitle}</p>}
      </div>

      {/* Glow effect */}
      <div className={`absolute -top-3 -right-3 h-16 w-16 rounded-full opacity-20 ${colorMap[color].split(' ')[1]} blur-3xl`}></div>
    </div>
  )
}
