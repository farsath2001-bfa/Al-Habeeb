import { useEffect, useState } from 'react'

// Load data from the API. While loading (or if the backend is asleep / offline)
// we show the fallback data so the page is never empty.
export function useApi(fetcher, fallback) {
  const [data, setData] = useState(fallback)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((result) => {
        if (!cancelled && Array.isArray(result) && result.length) {
          setData(result)
          setLive(true)
        }
      })
      .catch(() => {}) // keep the fallback
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, live }
}
