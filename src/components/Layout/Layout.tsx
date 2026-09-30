import { Outlet } from 'react-router-dom'
import { Header } from '..'
import './Layout.scss'

export const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  )
}
