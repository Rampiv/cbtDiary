import { Outlet } from 'react-router-dom'
import { Header, NetworkStatus } from '..'
import './Layout.scss'

export const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        <Outlet />
      </main>
      <NetworkStatus />
    </div>
  )
}
