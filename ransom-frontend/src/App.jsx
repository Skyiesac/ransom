import { useState, useEffect } from 'react'
import { DemoOne } from '@/components/ui/demo'
import { EtherealShadowPage } from '@/components/ui/etheral-shadow-demo'

function App() {
  const [page, setPage] = useState('/')

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname
      setPage(path)
    }

    window.addEventListener('popstate', handleRouteChange)
    handleRouteChange()

    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setPage(path)
  }

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      {page === '/' && <DemoOne navigate={navigate} />}
      {page === '/new' && <EtherealShadowPage navigate={navigate} />}
    </div>
  )
}

export default App
