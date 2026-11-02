import { useTranslation } from 'react-i18next'
import StatCard from '../StatCard'
import { TruckIcon } from '../ui/icons'
import { driverLabel, statusClass, vehicleLabel } from './helpers'

export default function FleetDashboard({ dashboard, isManager, onNavigate }) {
  const { t } = useTranslation()
  if (!dashboard) return null

  const counts = dashboard.counts || {}
  const alerts = dashboard.alerts || {}
  const licenseAlerts = alerts.expiringLicenses || []
  const documentAlerts = alerts.expiringDocuments || []
  const maintenanceAlerts = alerts.dueMaintenance || []
  const hasAlerts = isManager && (licenseAlerts.length || documentAlerts.length || maintenanceAlerts.length)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button type="button" className="text-start" onClick={() => onNavigate?.('vehicles')}>
          <StatCard title={t('fleet.dashboard.totalVehicles')} value={counts.totalVehicles || 0} subtitle={`${counts.available || 0} ${t('fleet.status.available')}`} icon={TruckIcon} color="blue" />
        </button>
        <button type="button" className="text-start" onClick={() => onNavigate?.('assignments')}>
          <StatCard title={t('fleet.dashboard.activeAssignments')} value={counts.activeAssignments || 0} subtitle={`${counts.assigned || 0} ${t('fleet.status.assigned')}`} color="green" />
        </button>
        <button type="button" className="text-start" onClick={() => onNavigate?.('fuel')}>
          <StatCard title={t('fleet.dashboard.pendingFuel')} value={counts.pendingFuel || 0} subtitle={`${t('fleet.dashboard.monthSpend')}: ${counts.monthFuelSpend || 0}`} color="yellow" />
        </button>
        <button type="button" className="text-start" onClick={() => onNavigate?.('maintenance')}>
          <StatCard title={t('fleet.dashboard.openMaintenance')} value={counts.openMaintenance || 0} subtitle={`${counts.maintenance || 0} ${t('fleet.status.maintenance')}`} color="red" />
        </button>
      </div>

      {hasAlerts ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {!!licenseAlerts.length && (
            <AlertPanel title={t('fleet.dashboard.expiringLicenses')}>
              {licenseAlerts.map((driver) => (
                <li key={driver._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">{driverLabel(driver)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(driver.licenseStatus)}`}>
                    {t(`fleet.license.${driver.licenseStatus}`)}
                  </span>
                </li>
              ))}
            </AlertPanel>
          )}
          {!!documentAlerts.length && (
            <AlertPanel title={t('fleet.dashboard.expiringDocuments')}>
              {documentAlerts.map((document) => (
                <li key={document._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">{vehicleLabel(document.vehicle)} · {t(`fleet.docTypes.${document.type}`)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(document.status)}`}>
                    {document.expiryDate}
                  </span>
                </li>
              ))}
            </AlertPanel>
          )}
          {!!maintenanceAlerts.length && (
            <AlertPanel title={t('fleet.dashboard.dueMaintenance')}>
              {maintenanceAlerts.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">{vehicleLabel(item.vehicle)} · {t(`fleet.maintenanceTypes.${item.type}`)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(item.urgency)}`}>
                    {item.nextDueDate || item.nextDueMileage}
                  </span>
                </li>
              ))}
            </AlertPanel>
          )}
        </div>
      ) : (
        isManager && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
            {t('fleet.dashboard.allClear')}
          </p>
        )
      )}
    </div>
  )
}

function AlertPanel({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      <ul className="mt-3 divide-y divide-slate-100">{children}</ul>
    </section>
  )
}
