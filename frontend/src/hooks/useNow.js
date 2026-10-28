import { useEffect, useState } from 'react'

/** A ticking clock. Pass a larger interval for labels that only need minutes. */
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
