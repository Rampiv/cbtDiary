import { PageTransition, Header } from '..'
import './Layout.scss'

export const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        <PageTransition />
      </main>
    </div>
  )
}
