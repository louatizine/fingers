export default function FleetModalShell({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <div className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
