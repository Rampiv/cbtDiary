import { Outlet, useLocation } from 'react-router-dom'
import './PageTransition.scss'

export const PageTransition = () => {
  const location = useLocation()

  return (
    <div key={location.key} className="page-transition">
      <Outlet />
    </div>
  )
}
