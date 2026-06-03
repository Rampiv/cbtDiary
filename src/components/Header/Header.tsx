import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import DiaryIcon from '../../assets/image/DiaryIcon.svg'
import './Header.scss'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { title: 'Профиль', link: '/profile' },
    { title: 'Дневник', link: '/' },
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
            {tabs.map((item) => (
              <li className="header__item" key={item.title}>
                <Link to={item.link} className={location.pathname === item.link ? 'active' : ''}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button className="header__logout" onClick={handleLogout} type="button">
          Выйти
        </button>
      </div>
    </header>
  )
}
