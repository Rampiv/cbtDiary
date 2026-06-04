import { useState } from 'react'
import { Slider } from 'antd'
import type { DiaryPage, Thought } from '../../../../types/diary'
import { Accordion, InfoModal, TextEditor } from '../../../../components'

interface RevealPageProps {
  page: DiaryPage
  updatePage: (updater: (prev: DiaryPage) => DiaryPage) => void
  autoSave: () => void
  addThought: () => void
  deleteThought: (thoughtId: string) => void
  startWorkOnThought: (thoughtId: string) => void
}

export const RevealPage = ({
  page,
  updatePage,
  autoSave,
  addThought,
  deleteThought,
  startWorkOnThought,
}: RevealPageProps) => {
  const [showSituationModal, setShowSituationModal] = useState(false)
  const [showHeaderThoughtModal, setShowHeaderThoughtModal] = useState(false)
  const [showHeaderEmotionModal, setShowHeaderEmotionModal] = useState(false)
  const [showHeaderBehaviorModal, setShowHeaderBehaviorModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const updateThought = (thoughtId: string, updater: (t: Thought) => Thought) => {
    updatePage((prev) => ({
      ...prev,
      thoughts: prev.thoughts.map((t) => (t.id === thoughtId ? updater(t) : t)),
    }))
  }

  const handleDeleteThought = (thoughtId: string) => {
    deleteThought(thoughtId)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="reveal-page">
      {/* Аккордеон 1: Ресурс */}
      <Accordion
        title="Ресурс"
        description="Прежде чем погрузиться в рассуждения, нужно вспомнить о хорошем."
        defaultOpen={true}
      >
        <p className="reveal-page__hint">Что хорошего произошло за день?</p>
        <TextEditor
          editorId="resource"
          content={page.resource}
          onChange={(content) => updatePage((prev) => ({ ...prev, resource: content }))}
          onBlur={autoSave}
          placeholder="Опишите хорошие моменты..."
        />
      </Accordion>

      {/* Аккордеон 2: Выявление */}
      <Accordion
        title="Выявление"
        description="Опишите проблемную ситуацию, в которой Вы почувствовали возникновение негативных эмоций."
        defaultOpen={true}
      >
        <div className="reveal-page__field">
          <div className="reveal-page__field-header">
            <label className="reveal-page__label">Ситуация</label>
            <button
              type="button"
              className="reveal-page__info-btn"
              onClick={() => setShowSituationModal(true)}
            >
              ?
            </button>
          </div>
          <TextEditor
            editorId="situation"
            content={page.situation}
            onChange={(content) => updatePage((prev) => ({ ...prev, situation: content }))}
            onBlur={autoSave}
            placeholder="Опишите ситуацию..."
          />
        </div>

        {/* Таблица мыслей */}
        <table className="reveal-page__thoughts-table">
          <thead>
            <tr>
              <th className="reveal-page__table-col reveal-page__table-col_header">
                <div className="reveal-page__col-header">
                  <span>Автоматическая мысль</span>
                  <button
                    type="button"
                    className="reveal-page__info-btn reveal-page__info-btn--header"
                    onClick={() => setShowHeaderThoughtModal(true)}
                  >
                    ?
                  </button>
                </div>
              </th>
              <th className="reveal-page__table-col reveal-page__table-col_header">
                <div className="reveal-page__col-header">
                  <span>Эмоциональная реакция</span>
                  <button
                    type="button"
                    className="reveal-page__info-btn reveal-page__info-btn--header"
                    onClick={() => setShowHeaderEmotionModal(true)}
                  >
                    ?
                  </button>
                </div>
              </th>
              <th className="reveal-page__table-col reveal-page__table-col_header">
                <div className="reveal-page__col-header">
                  <span>Поведенческая реакция</span>
                  <button
                    type="button"
                    className="reveal-page__info-btn reveal-page__info-btn--header"
                    onClick={() => setShowHeaderBehaviorModal(true)}
                  >
                    ?
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {page.thoughts &&
              page.thoughts.map((thought, thoughtIndex) => (
                <tr key={thought.id}>
                  <td className="reveal-page__table-col">
                    <div className="reveal-page__mobile-header">
                      <span>Автоматическая мысль</span>
                      <div className="reveal-page__mobile-header-actions">
                        <button
                          type="button"
                          className="reveal-page__info-btn"
                          onClick={() => setShowHeaderThoughtModal(true)}
                        >
                          ?
                        </button>
                        <button
                          type="button"
                          className="reveal-page__delete-thought-btn"
                          onClick={() => setShowDeleteConfirm(thought.id)}
                          title="Удалить мысль"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <TextEditor
                      editorId={`thought-${thought.id}-auto`}
                      content={thought.automaticThought}
                      onChange={(content) =>
                        updateThought(thought.id, (t) => ({ ...t, automaticThought: content }))
                      }
                      onBlur={autoSave}
                      placeholder="О чем вы думаете/подумали?"
                    />
                    <div className="reveal-page__desktop-actions">
                      <button
                        type="button"
                        className="reveal-page__delete-thought-btn reveal-page__delete-thought-btn_desctop"
                        onClick={() => setShowDeleteConfirm(thought.id)}
                        title="Удалить мысль"
                      >
                        Удалить мысль
                      </button>
                    </div>
                  </td>
                  <td className="reveal-page__table-col">
                    <div className="reveal-page__mobile-header">
                      <span>Эмоциональная реакция</span>
                      <button
                        type="button"
                        className="reveal-page__info-btn"
                        onClick={() => setShowHeaderEmotionModal(true)}
                      >
                        ?
                      </button>
                    </div>
                    <div className="reveal-page__emotions-list">
                      {thought.emotion?.map((emotion, emotionIndex) => (
                        <div key={emotionIndex} className="reveal-page__emotion-block">
                          <div className="reveal-page__emotion-top">
                            <input
                              type="text"
                              className="reveal-page__emotion-input"
                              placeholder="Эмоция?"
                              value={emotion.name}
                              onChange={(e) =>
                                updateThought(thought.id, (t) => {
                                  const newEmotions = [...(t.emotion || [])]
                                  newEmotions[emotionIndex] = {
                                    ...newEmotions[emotionIndex],
                                    name: e.target.value,
                                  }
                                  return { ...t, emotion: newEmotions }
                                })
                              }
                              onBlur={autoSave}
                            />
                            {thought.emotion.length > 1 && (
                              <button
                                type="button"
                                className="reveal-page__emotion-remove"
                                onClick={() =>
                                  updateThought(thought.id, (t) => ({
                                    ...t,
                                    emotion: t.emotion.filter((_, i) => i !== emotionIndex),
                                  }))
                                }
                                aria-label="Удалить эмоцию"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <span className="reveal-page__hint marginNone">
                            На сколько выражена эмоция?
                          </span>
                          <Slider
                            min={0}
                            max={100}
                            value={emotion.intensity}
                            onChange={(value) =>
                              updateThought(thought.id, (t) => {
                                const newEmotions = [...(t.emotion || [])]
                                newEmotions[emotionIndex] = {
                                  ...newEmotions[emotionIndex],
                                  intensity: value,
                                }
                                return { ...t, emotion: newEmotions }
                              })
                            }
                            tooltip={{ formatter: (v) => `${v}%` }}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        className="reveal-page__add-emotion-btn"
                        onClick={() =>
                          updateThought(thought.id, (t) => ({
                            ...t,
                            emotion: [...(t.emotion || []), { name: '', intensity: 0 }],
                          }))
                        }
                      >
                        + Добавить эмоцию
                      </button>
                    </div>
                  </td>
                  <td className="reveal-page__table-col">
                    <div className="reveal-page__mobile-header">
                      <span>Поведенческая реакция</span>
                      <button
                        type="button"
                        className="reveal-page__info-btn"
                        onClick={() => setShowHeaderBehaviorModal(true)}
                      >
                        ?
                      </button>
                    </div>
                    <TextEditor
                      editorId={`thought-${thought.id}-behavior`}
                      content={thought.behavioralReaction}
                      onChange={(content) =>
                        updateThought(thought.id, (t) => ({ ...t, behavioralReaction: content }))
                      }
                      onBlur={autoSave}
                      placeholder="Как вы отреагировали?"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <button type="button" className="reveal-page__add-btn" onClick={addThought}>
          + Добавить мысль
        </button>

        <div className="reveal-page__actions">
          {page.thoughts && page.thoughts.map((thought, index) => (
            <div key={thought.id} className="reveal-page__action-row">
              <button
                type="button"
                className="reveal-page__work-btn"
                onClick={() => startWorkOnThought(thought.id)}
              >
                Работать с мыслью {index + 1}
              </button>
            </div>
          ))}
        </div>

        {/* Модалка подтверждения удаления мысли */}
        {showDeleteConfirm && (
          <div className="reveal-page__modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="reveal-page__modal" onClick={(e) => e.stopPropagation()}>
              <h3>Удалить мысль?</h3>
              <p>Это действие нельзя отменить. Все данные мысли будут удалены.</p>
              <div className="reveal-page__modal-actions">
                <button
                  type="button"
                  className="reveal-page__modal-btn reveal-page__modal-btn--cancel"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="reveal-page__modal-btn reveal-page__modal-btn--delete"
                  onClick={() => handleDeleteThought(showDeleteConfirm)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </Accordion>

      {/* Модалки */}
      <InfoModal
        isOpen={showSituationModal}
        onClose={() => setShowSituationModal(false)}
        title="Что за ситуация?"
      >
        <p>Когда ситуация возникла:</p>
        <ul>
          <li>До ситуации («Что, если на меня накричат»)</li>
          <li>Во время ситуации («Она думает, что я глупый(-ая)»)</li>
          <li>
            После ситуации («Не надо было даже пытаться, у меня все равно бы ничего не вышло»)
          </li>
        </ul>
      </InfoModal>

      {page.thoughts &&page.thoughts.map((thought) => (
        <InfoModal
          key={`thought-${thought.id}`}
          isOpen={showHeaderThoughtModal}
          onClose={() => setShowHeaderThoughtModal(false)}
          title="Автоматическая мысль"
        >
          <p>
            <strong>Примеры:</strong> «Я ничего не понимаю», «Я никогда не пойму», «Я неудачник»,
            «Он/она меня не ценит», «Всё ужасно», «Слишком тяжело», «У меня никогда не получится»
          </p>
          <p>
            Это спонтанные мысли, которые могут быть оценивающего характера, как правило,
            категоричные.
          </p>
          <p>
            <strong>Подсказки:</strong>
          </p>
          <ul>
            <li>О чем вы подумали, когда заметили смену настроения?</li>
            <li>Что вы представили в этой ситуации?</li>
            <li>Что эта ситуация значит для вас? (или говорит о вас?)</li>
          </ul>
        </InfoModal>
      ))}

      {page.thoughts &&page.thoughts.map((thought) => (
        <InfoModal
          key={`emotion-${thought.id}`}
          isOpen={showHeaderEmotionModal}
          onClose={() => setShowHeaderEmotionModal(false)}
          title="Эмоциональная реакция"
        >
          <p>Эмоции нужно отличать от мыслей</p>
          <p>
            Вы предполагаете, что это чувствуете/чувствовали? Или же вы действительно испытываете?
          </p>
          <p>
            <strong>Подсказка:</strong>
          </p>
          <ul>
            <li>Грусть, подавленность, одиночество, несчастье</li>
            <li>Тревога, волнение, страх, напряжение</li>
            <li>Злость, ярость, раздражение</li>
            <li>Стыд, смущение, унижение</li>
            <li>Разочарование</li>
            <li>Ревность, зависть</li>
            <li>Вина</li>
            <li>Боль</li>
            <li>Подозрительность</li>
          </ul>
        </InfoModal>
      ))}

      {page.thoughts &&page.thoughts.map((thought) => (
        <InfoModal
          key={`behavior-${thought.id}`}
          isOpen={showHeaderBehaviorModal}
          onClose={() => setShowHeaderBehaviorModal(false)}
          title="Поведенческая реакция"
        >
          <p>Ваша поведенческая реакиция на событие</p>
          <p>
            <strong>Подсказка:</strong>
          </p>
          <ul>
            <li>Бей</li>
            <li>Беги</li>
            <li>Замри</li>
          </ul>
          <p>Копинг-стратегии</p>
          <ul>
            <li>Избегать негативных эмоций</li>
           <li> Показывать яркие эмоции (например, привлекать внимание)</li>
           <li>Пытаться быть совершенным</li>
           <li>специально казаться некомпетентным и беззащитным</li>
           <li>Быть слишком ответственным</li>
           <li>Избегать ответственности</li>
           <li>Искать признание</li>
           <li>Избегать внимания</li>
           <li>Избегать конфронтации</li>
           <li>Провоцировать других</li>
           <li>Пытаться контролировать ситуация</li>
           <li>Передавать контроль другим</li>
           <li>Вести себя инфантильно</li>
           <li>Вести себя авторитарно</li>
           <li>Пытаться угодить другим</li>
           <li>Отдаляться от других или пытаться удовлетворить только себя</li>
          </ul>
        </InfoModal>
      ))}
    </div>
  )
}
