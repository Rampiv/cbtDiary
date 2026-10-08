import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MenuOutlined } from '@ant-design/icons'
import DiaryIcon from '../../assets/image/DiaryIcon.svg'
import './Header.scss'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = [
    { title: 'Профиль', link: '/profile' },
    { title: 'Дневник', link: '/' },
    { title: 'Полезное', link: '/helpful' },
    { title: 'FAQ', link: '/FAQ' },
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/auth')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  const handleMenuClick = (link: string) => {
    setMenuOpen(false)
    if (location.pathname === link) return
    navigate(link)
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__link">
          <img
            src={DiaryIcon}
            alt="Дневник мыслей"
            className="header__icon"
            width={48}
            height={48}
          />
        </Link>

        <nav className="header__nav">
          <ul className="header__list">
            {tabs.map((item) => {
              const isActive = location.pathname === item.link
              return (
                <li className="header__item" key={item.title}>
                  <Link
                    to={item.link}
                    className={isActive ? 'active' : ''}
                    onClick={(e) => {
                      if (isActive) e.preventDefault()
                    }}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <button className="header__logout" onClick={handleLogout} type="button">
          Выйти
        </button>

        {/* Burger button — visible only on small screens */}
        <button
          className={`header__burger ${menuOpen ? 'header__burger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-label="Меню"
          aria-expanded={menuOpen}
        >
          <MenuOutlined />
        </button>
      </div>

      {/* Burger menu dropdown */}
      {menuOpen && (
        <div className="header__burger-menu" onClick={() => setMenuOpen(false)}>
          <div className="header__burger-menu-content" onClick={(e) => e.stopPropagation()}>
            {tabs.map((item) => {
              const isActive = location.pathname === item.link
              return (
                <button
                  key={item.title}
                  className={`header__burger-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.link)}
                >
                  {item.title}
                </button>
              )
            })}
            <button className="header__burger-menu-item header__burger-menu-item--logout" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
