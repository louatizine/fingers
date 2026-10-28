import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CommandPalette from '../components/CommandPalette'

const STORAGE_KEY = 'dynamix.sidebar.collapsed'

const ShellContext = createContext(null)

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within ShellProvider')
  return ctx
}

export function ShellProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [commandOpen, setCommandOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore quota / private mode */
      }
      return next
    })
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, commandOpen, setCommandOpen }),
    [collapsed, toggleCollapsed, commandOpen]
  )

  return (
    <ShellContext.Provider value={value}>
      {children}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </ShellContext.Provider>
  )
}
