import { useState } from 'react'
import { Slider } from 'antd'
import type { DiaryPage, ThoughtWork } from '../../../../types/diary'
import { Accordion, InfoModal, ReadOnlyContent, TextEditor } from '../../../../components'

interface ThoughtWorkPageProps {
  page: DiaryPage
  thoughtId: string
  updateThoughtWork: (thoughtId: string, updater: (work: ThoughtWork) => ThoughtWork) => void
  autoSave: () => void
  onNextThought?: () => void
}

export const ThoughtWorkPage = ({
  page,
  thoughtId,
  updateThoughtWork,
  autoSave,
  onNextThought,
}: ThoughtWorkPageProps) => {
  const [showSpecModal, setShowSpecModal] = useState(false)
  const work = page.thoughtWorks?.find((w) => w.thoughtId === thoughtId)
  const thought = page.thoughts?.find((t) => t.id === thoughtId)

  if (!work || !thought) return <div>Мысль не найдена</div>

  return (
    <div className="thought-work-page">
      {/* Аккордеон 1: Работа */}
      <Accordion title="Работа" defaultOpen={true}>
        <div className="thought-work-page__summary-table">
          <div className="thought-work-page__summary-row">
            <div className="thought-work-page__summary-col">
              <strong>Автоматическая мысль</strong>
              <div className="thought-work-page__summary-content">
                {thought.automaticThought ? (
                  <ReadOnlyContent content={thought.automaticThought} />
                ) : (
                  <span className="thought-work-page__empty">Не заполнено</span>
                )}
              </div>
            </div>
            <div className="thought-work-page__summary-col">
              <strong>Эмоциональная реакция</strong>
              <div className="thought-work-page__summary-content">
                {thought.emotion?.length > 0 ? (
                  <ul className="thought-work-page__emotion-list">
                    {thought.emotion.map((emotion, index) => (
                      <li key={index}>
                        {emotion.name || '—'} — {emotion.intensity}%
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="thought-work-page__empty">Не заполнено</span>
                )}
              </div>
            </div>
            <div className="thought-work-page__summary-col">
              <strong>Поведенческая реакция</strong>
              <div className="thought-work-page__summary-content">
                {thought.behavioralReaction ? (
                  <ReadOnlyContent content={thought.behavioralReaction} />
                ) : (
                  <span className="thought-work-page__empty">Не заполнено</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="thought-work-page__field">
          <div className="thought-work-page__field-header">
            <label>Конкретизация мысли*</label>
            <button
              type="button"
              className="thought-work-page__info-btn"
              onClick={() => setShowSpecModal(true)}
            >
              ?
            </button>
          </div>
          <TextEditor
            editorId={`work-spec-${thought.id}-auto`}
            content={work.specification}
            onChange={(content) =>
              updateThoughtWork(thoughtId, (w) => ({ ...w, specification: content }))
            }
            onBlur={autoSave}
            placeholder="Уточните мысль..."
          />
        </div>

        <div className="thought-work-page__slider-field">
          <label>На сколько вы убеждены в реальности автоматической мысли?</label>
          <Slider
            min={0}
            max={100}
            value={work.beliefScore}
            onChange={(value) =>
              updateThoughtWork(thoughtId, (w) => ({ ...w, beliefScore: value }))
            }
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </div>
      </Accordion>

      {/* Аккордеон 2: Полезность */}
      <Accordion title="Анализ: Полезность">
        <div className="thought-work-page__two-col">
          <div className="thought-work-page__col">
            <label>Чем эта мысль мне помогает?</label>
            <TextEditor
              editorId={`work-helps-${thought.id}-auto`}
              content={work.usefulness?.helps}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  usefulness: { ...w.usefulness, helps: content },
                }))
              }
              onBlur={autoSave}
              placeholder="Как эта мысль помогает вам?"
            />
          </div>
          <div className="thought-work-page__col">
            <label>Как она усложняет мою жизнь?</label>
            <TextEditor
              editorId={`work-complicates-${thought.id}-auto`}
              content={work.usefulness?.complicates}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  usefulness: { ...w.usefulness, complicates: content },
                }))
              }
              onBlur={autoSave}
              placeholder="Как эта мысль мешает вам?"
            />
          </div>
        </div>
      </Accordion>

      {/* Аккордеон 3: Доказательства */}
      <Accordion title="Анализ: Доказательства">
        <p className="thought-work-page__hint">
          Не всегда автоматические мысли полностью ошибочны, иногда в них есть хотя бы зерно истины. Собаки действительно кусаются...
        </p>
        <div className="thought-work-page__two-col">
          <div className="thought-work-page__col">
            <label>Доказательства, подтверждающие реальность мысли</label>
            <TextEditor
              editorId={`work-evidence-for-${thought.id}-auto`}
              content={work.evidence?.for}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  evidence: { ...w.evidence, for: content },
                }))
              }
              onBlur={autoSave}
              placeholder="Какие есть доказательства, что эта мысль верна?"
            />
          </div>
          <div className="thought-work-page__col">
            <label>Доказательства, опровергающие реальность мысли</label>
            <TextEditor
              editorId={`work-evidence-against-${thought.id}-auto`}
              content={work.evidence?.against}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  evidence: { ...w.evidence, against: content },
                }))
              }
              onBlur={autoSave}
              placeholder="Какие есть доказательства, что эта мысль ложна?"
            />
          </div>
        </div>
      </Accordion>

      {/* Аккордеон 4: Альтернатива */}
      <Accordion title="Анализ: Альтернатива">
        <p className="thought-work-page__hint">
          Можно ли дать альтернативное объяснение случившемуся? Может ли оказаться, что все совсем
          не так, как я сейчас представляю?
        </p>
        <TextEditor
          editorId={`work-alternative-${thought.id}-auto`}
          content={work.alternative}
          onChange={(content) =>
            updateThoughtWork(thoughtId, (w) => ({ ...w, alternative: content }))
          }
          onBlur={autoSave}
          placeholder="Альтернативное объяснение..."
        />
      </Accordion>

      {/* Аккордеон 5: Катастрофизация */}
      <Accordion title="Анализ: Катастрофизация">
        <div className="thought-work-page__catastrophizing">
          <div className="thought-work-page__field">
            <label>Если мысль верна, то что самое худшее может произойти?</label>
            <TextEditor
              editorId={`work-catastrophizing-worst-${thought.id}-auto`}
              content={work.catastrophizing.worst.content}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  catastrophizing: {
                    ...w.catastrophizing,
                    worst: { ...w.catastrophizing.worst, content },
                  },
                }))
              }
              onBlur={autoSave}
            />
            <div className="thought-work-page__slider-field">
              <label>На сколько вы в это верите?</label>
              <Slider
                min={0}
                max={100}
                value={work.catastrophizing.worst.belief}
                onChange={(value) =>
                  updateThoughtWork(thoughtId, (w) => ({
                    ...w,
                    catastrophizing: {
                      ...w.catastrophizing,
                      worst: { ...w.catastrophizing.worst, belief: value },
                    },
                  }))
                }
                tooltip={{ formatter: (v) => `${v}%` }}
              />
            </div>
          </div>

          <div className="thought-work-page__field">
            <label>Если мысль верна, то что самое лучшее может произойти?</label>
            <TextEditor
              editorId={`work-catastrophizing-best-${thought.id}-auto`}
              content={work.catastrophizing.best.content}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  catastrophizing: {
                    ...w.catastrophizing,
                    best: { ...w.catastrophizing.best, content },
                  },
                }))
              }
              onBlur={autoSave}
            />
            <div className="thought-work-page__slider-field">
              <label>На сколько вы в это верите?</label>
              <Slider
                min={0}
                max={100}
                value={work.catastrophizing.best.belief}
                onChange={(value) =>
                  updateThoughtWork(thoughtId, (w) => ({
                    ...w,
                    catastrophizing: {
                      ...w.catastrophizing,
                      best: { ...w.catastrophizing.best, belief: value },
                    },
                  }))
                }
                tooltip={{ formatter: (v) => `${v}%` }}
              />
            </div>
          </div>

          <div className="thought-work-page__field">
            <label>Какой вариант развития самый реалистичный?</label>
            <TextEditor
              editorId={`work-catastrophizing-realistic-${thought.id}-auto`}
              content={work.catastrophizing.realistic.content}
              onChange={(content) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  catastrophizing: {
                    ...w.catastrophizing,
                    realistic: { ...w.catastrophizing.realistic, content },
                  },
                }))
              }
              onBlur={autoSave}
            />
            <div className="thought-work-page__slider-field">
              <label>На сколько вы в это верите?</label>
              <Slider
                min={0}
                max={100}
                value={work.catastrophizing.realistic.belief}
                onChange={(value) =>
                  updateThoughtWork(thoughtId, (w) => ({
                    ...w,
                    catastrophizing: {
                      ...w.catastrophizing,
                      realistic: { ...w.catastrophizing.realistic, belief: value },
                    },
                  }))
                }
                tooltip={{ formatter: (v) => `${v}%` }}
              />
            </div>
          </div>
        </div>
      </Accordion>

      {/* Аккордеон 6: Дистанцирование */}
      <Accordion title="Анализ: Дистанцирование">
        <p className="thought-work-page__hint">
          Что бы я сказал(-а) своему близкому человеку, если бы он(-а) оказался(-ась) в такой
          ситуации?
        </p>
        <TextEditor
          editorId={`work-distancing-${thought.id}-auto`}
          content={work.distancing}
          onChange={(content) =>
            updateThoughtWork(thoughtId, (w) => ({ ...w, distancing: content }))
          }
          onBlur={autoSave}
          placeholder="Что бы вы сказали близкому человеку?"
        />
      </Accordion>

      {/* Аккордеон 7: Переформулирование */}
      <Accordion title="Переформулирование">
        <p className="thought-work-page__hint">
          Если после анализа вы считаете, что мысль вам полезна, она соответствует реальности, то
          переходите к последнему пункту.
        </p>
        <div className="thought-work-page__field">
          <label>Изначальная мысль:</label>
          <div className="thought-work-page__original-thought">
            {work.specification && <ReadOnlyContent content={work.specification} />|| work.reformulation.originalThought || 'Не заполнено'}
          </div>
        </div>
        <div className="thought-work-page__field">
          <label>Реалистичный ответ на основе всего анализа:</label>
          <TextEditor
            editorId={`work-response-${thought.id}-auto`}
            content={work.reformulation.response}
            onChange={(content) =>
              updateThoughtWork(thoughtId, (w) => ({
                ...w,
                reformulation: { ...w.reformulation, response: content },
              }))
            }
            onBlur={autoSave}
            placeholder="Сформулируйте реалистичный ответ..."
          />
          <div className="thought-work-page__slider-field">
            <label>На сколько вы в это верите?</label>
            <Slider
              min={0}
              max={100}
              value={work.reformulation.belief}
              onChange={(value) =>
                updateThoughtWork(thoughtId, (w) => ({
                  ...w,
                  reformulation: { ...w.reformulation, belief: value },
                }))
              }
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>
        </div>
      </Accordion>

      {/* Аккордеон 8: Мысль реальна */}
      <Accordion title="Мысль реальна">
        <p className="thought-work-page__hint">
          Если мысль соответствует реальности. Что мне делать дальше? Какие шаги мне следует сделать, чтобы что-то поменять? Каковы рамки
          моей ответственности?
        </p>
        <TextEditor
          editorId={`work-action-${thought.id}-auto`}
          content={work.actionPlan}
          onChange={(content) =>
            updateThoughtWork(thoughtId, (w) => ({ ...w, actionPlan: content }))
          }
          onBlur={autoSave}
          placeholder="План действий..."
        />
      </Accordion>

      {onNextThought && (
        <button type="button" className="thought-work-page__next-btn" onClick={onNextThought}>
          Работать со следующей мыслью →
        </button>
      )}

      <InfoModal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        title="Конкретизация мысли"
      >
        <p>
          <strong>Нужно отличить автоматическую мысль от интерпретации:</strong>
        </p>
        <table className="thought-work-page__modal-table">
          <thead>
            <tr>
              <th>Интерпретация</th>
              <th>Мысль</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Не уверен, что обратившись к учителю, он мне поможет</td>
              <td>Никто ничего не знает, я уверен, что просто потрачу время зря</td>
            </tr>
            <tr>
              <td>Мне сложно заставить себя начать что-то делать</td>
              <td>У меня не получится</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Нужно переформулировать мысль из вопроса в утверждение:</strong>
        </p>
        <table className="thought-work-page__modal-table">
          <thead>
            <tr>
              <th>Вопрос</th>
              <th>Мысль</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Смогу ли я справиться?</td>
              <td>Я не справлюсь</td>
            </tr>
            <tr>
              <td>Вдруг разозлится?</td>
              <td>Разозлится и мне будет больно</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Иногда мысль широкая, обхватывает множество областей, попробуйте её конкретизировать</strong>
        </p>
      </InfoModal>
    </div>
  )
}
