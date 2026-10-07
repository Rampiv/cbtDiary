import './PrivacyPage.scss'

export const PrivacyPage = () => {
  return (
    <div className="privacy-page">
      <h1 className="privacy-page__title">Политика конфиденциальности</h1>
      <p className="privacy-page__last-updated">Последнее обновление: 5 октября 2026 г.</p>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">1. Введение</h2>
        <p className="privacy-page__text">
          Данный pet-проект (CBT Diary) разработан как личное приложение для ведения дневника с
          использованием когнитивно-поведенческой терапии (КПТ). Мы серьёзно относимся к защите ваших
          персональных данных и конфиденциальности.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">2. Какие данные мы собираем</h2>
        <div className="privacy-page__data-list">
          <div className="privacy-page__data-item">
            <strong>2.1. Данные аккаунта:</strong>
            <p>
              • Email — используется для аутентификации через Firebase Authentication.
              <br />
              • Пароль — хранится в зашифрованном виде на серверах Firebase.
            </p>
          </div>
          <div className="privacy-page__data-item">
            <strong>2.2. Данные дневника:</strong>
            <p>
              • Записи дневника — ситуации, автоматические мысли, эмоции, поведенческие реакции,
              результаты работы с мыслями.
              <br />
              • Временные метки — дата и время создания/обновления записей.
            </p>
          </div>
          <div className="privacy-page__data-item">
            <strong>2.3. Настройки:</strong>
            <p>
              • Тема оформления (светлая/тёмная) — сохраняется в Firebase для синхронизации между
              устройствами.
            </p>
          </div>
        </div>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">3. Как мы храним данные</h2>
        <p className="privacy-page__text">
          Все данные хранятся в <strong>Firebase Realtime Database</strong> — облачном сервисе от
          Google. Данные привязаны к вашему аккаунту и доступны только вам после авторизации.
        </p>
        <p className="privacy-page__text">
          <strong>Безопасность:</strong>
        </p>
        <ul className="privacy-page__list">
          <li>Доступ к данным ограничен правилами Firebase Security Rules.</li>
          <li>Данные привязаны к вашему аккаунту и доступны только вам после авторизации.</li>
        </ul>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">4. Передача данных третьим лицам</h2>
        <p className="privacy-page__text">
          <strong>Мы НЕ передаём ваши данные третьим лицам.</strong>
        </p>
        <p className="privacy-page__text">
          Ваши записи дневника остаются полностью приватными. Firebase используется исключительно для
          хранения и синхронизации данных, и мы не предоставляем доступ к вашим данным каким-либо
          сторонним организациям.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">5. Ваши права</h2>
        <div className="privacy-page__rights-list">
          <div className="privacy-page__right-item">
            <strong>5.1. Просмотр данных:</strong>
            <p>Вы можете просмотреть все свои записи в любое время через приложение.</p>
          </div>
          <div className="privacy-page__right-item">
            <strong>5.2. Экспорт данных:</strong>
            <p>
              Вы можете скачать все свои записи в формате DOCX через раздел «Личный кабинет» →
              «Экспорт в docx».
            </p>
          </div>
          <div className="privacy-page__right-item">
            <strong>5.3. Удаление данных:</strong>
            <p>
              Вы можете удалить свои данные двумя способами:
              <br />
              • Через приложение — удалить отдельные записи или всю страницу.
              <br />
              • Удаление аккаунта — при удалении аккаунта Firebase все связанные данные будут
              удалены безвозвратно.
            </p>
          </div>
          <div className="privacy-page__right-item">
            <strong>5.4. Изменение настроек:</strong>
            <p>Вы можете изменить тему оформления в любой момент.</p>
          </div>
        </div>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">7. Cookies и localStorage</h2>
        <p className="privacy-page__text">
          Приложение использует localStorage для хранения:
        </p>
        <ul className="privacy-page__list">
          <li>Настроек темы оформления</li>
          <li>Состояния авторизации</li>
        </ul>
        <p className="privacy-page__text">
          Это необходимо для корректной работы приложения. Мы не используем cookies или другие
          технологии отслеживания.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">8. Изменения в политике</h2>
        <p className="privacy-page__text">
          Мы можем периодически обновлять данную политику конфиденциальности. О любых изменениях мы
          сообщим через приложение или на этой странице. Рекомендуем периодически проверять эту
          страницу на наличие обновлений.
        </p>
      </section>

      <section className="privacy-page__section">
        <h2 className="privacy-page__section-title">9. Контактная информация</h2>
        <p className="privacy-page__text">
          Если у вас есть вопросы или предложения по поводу данной политики конфиденциальности, вы
          можете связаться с разработчиком через раздел FAQ приложения.
        </p>
      </section>
    </div>
  )
}
