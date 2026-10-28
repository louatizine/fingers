/** Keyboard shortcut chip, used in the command bar and sidebar. */
export default function Kbd({ children, className = '' }) {
  return (
    <kbd
      className={`inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-slate-500 shadow-[0_1px_0_rgba(22,17,40,0.06)] ${className}`}
    >
      {children}
    </kbd>
  )
}
