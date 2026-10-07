import { Link } from 'react-router-dom'
import './HelpfulPage.scss'

interface ContentCard {
  id: string
  title: string
  description: string
  type: 'article' | 'test' | 'material'
  link: string
  icon: string
}

const contentCards: ContentCard[] = [
  {
    id: 'cognitive-distortions',
    title: 'Когнитивные искажения',
    description: '13 основных когнитивных искажений с примерами и объяснениями',
    type: 'article',
    link: '/helpful/cognitive-distortions',
    icon: '🧠',
  },
  // {
  //   id: 'techniques',
  //   title: 'Техники самопомощи',
  //   description: 'Практические техники для работы с тревожностью и депрессией',
  //   type: 'material',
  //   link: '/helpful/techniques',
  //   icon: '🛠️',
  // },
  // {
  //   id: 'self-test',
  //   title: 'Самопроверка',
  //   description: 'Тесты для самооценки уровня тревожности и депрессии',
  //   type: 'test',
  //   link: '/helpful/self-test',
  //   icon: '📝',
  // },
]

export const HelpfulPage = () => {
  return (
    <div className="helpful-page">
      <div className="helpful-page__header">
        <h1 className="helpful-page__title">Полезное</h1>
        <p className="helpful-page__description">
          Здесь вы найдёте полезные материалы, статьи и тесты для самопомощи. Выберите интересующую
          вас тему, чтобы узнать больше.
        </p>
      </div>

      <div className="helpful-page__cards">
        {contentCards.map((card) => (
          <Link to={card.link} className="helpful-page__card-link" key={card.id}>
            <div className="helpful-page__card">
              <div className="helpful-page__card-icon">{card.icon}</div>
              <div className="helpful-page__card-content">
                <span className="helpful-page__card-type">
                  {card.type === 'article' && 'Статья'}
                  {card.type === 'test' && 'Тест'}
                  {card.type === 'material' && 'Материал'}
                </span>
                <h3 className="helpful-page__card-title">{card.title}</h3>
                <p className="helpful-page__card-description">{card.description}</p>
              </div>
              <svg
                className="helpful-page__card-arrow"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
