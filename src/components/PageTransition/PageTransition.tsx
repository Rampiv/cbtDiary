import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import './PageTransition.scss'

export const PageTransition = () => {
  const location = useLocation()
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(prev => prev + 1)
  }, [location.key])

  return (
    <div key={key} className="page-transition">
      <Outlet />
    </div>
  )
}
