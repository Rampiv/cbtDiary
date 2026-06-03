import './Loader.scss'

interface LoaderProps {
  text?: string
  fullScreen?: boolean
}

export const Loader = ({ text = 'Загрузка...', fullScreen = true }: LoaderProps) => {
  return (
    <div className={`loader ${fullScreen ? 'loader--fullscreen' : ''}`}>
      <div className="loader__spinner">
        <div className="loader__circle"></div>
      </div>
      {text && <p className="loader__text">{text}</p>}
    </div>
  )
}