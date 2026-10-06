import React from 'react'

const colorMap = {
  blue: 'bg-[#E7EEF8] text-brand-blue ring-[#C5D4EC]',
  green: 'bg-[#E7F6EA] text-brand-green ring-[#B7E4BD]',
  yellow: 'bg-[#FDF6D4] text-[#8A6800] ring-[#F6E48A]',
  purple: 'bg-primary-50 text-primary ring-primary-200',
  red: 'bg-[#FDE8EB] text-brand-red ring-[#F5C2C8]'
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
