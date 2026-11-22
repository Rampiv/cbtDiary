import type { DiaryPage, ThoughtWork } from '../../types/diary'
import { createEmptyThoughtWork } from '../../types/diary'

// ── addThoughtReducer ──────────────────────────────────────────────

export const addThoughtReducer = (prev: DiaryPage): DiaryPage => ({
  ...prev,
  thoughts: [
    ...(prev.thoughts || []),
    {
      id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      automaticThought: null,
      emotion: [],
      behavioralReaction: null,
    },
  ],
})

// ── deleteThoughtReducer ───────────────────────────────────────────

export const deleteThoughtReducer = (prev: DiaryPage, thoughtId: string): DiaryPage => ({
  ...prev,
  thoughts: (prev.thoughts || []).filter((t) => t.id !== thoughtId),
  thoughtWorks: (prev.thoughtWorks || []).filter((w) => w.thoughtId !== thoughtId),
})

// ── startWorkOnThoughtReducer ──────────────────────────────────────

export const startWorkOnThoughtReducer = (prev: DiaryPage, thoughtId: string): DiaryPage => {
  const existingWork = prev.thoughtWorks?.find((w) => w.thoughtId === thoughtId)
  if (existingWork) return prev

  const newWork = createEmptyThoughtWork(thoughtId)
  const thought = prev.thoughts?.find((t) => t.id === thoughtId)

  if (thought?.automaticThought) {
    const textContent = thought.automaticThought.content?.[0]?.content
    if (textContent && Array.isArray(textContent)) {
      const text = textContent.map((c: { text?: string }) => c.text || '').join('')
      newWork.reformulation.originalThought = text
    }
  }

  return {
    ...prev,
    thoughtWorks: [...(prev.thoughtWorks || []), newWork],
  }
}

// ── updateThoughtWorkReducer ───────────────────────────────────────

export const updateThoughtWorkReducer = (
  prev: DiaryPage,
  thoughtId: string,
  updater: (work: ThoughtWork) => ThoughtWork
): DiaryPage => ({
  ...prev,
  thoughtWorks: (prev.thoughtWorks || []).map((work) =>
    work.thoughtId === thoughtId ? updater(work) : work
  ),
})
