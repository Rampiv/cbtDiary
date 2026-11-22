import { describe, it, expect } from 'vitest'
import {
  addThoughtReducer,
  deleteThoughtReducer,
  startWorkOnThoughtReducer,
  updateThoughtWorkReducer,
} from './reducers'
import type { DiaryPage } from '../../types/diary'

const makePage = (overrides: Partial<DiaryPage> = {}): DiaryPage => ({
  id: 'page-1',
  createdAt: 1000,
  updatedAt: 1000,
  resource: null,
  situation: null,
  thoughts: [
    {
      id: 'thought-1',
      automaticThought: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I am bad' }] }] },
      emotion: [{ name: 'sad', intensity: 80 }],
      behavioralReaction: null,
    },
    {
      id: 'thought-2',
      automaticThought: null,
      emotion: [],
      behavioralReaction: null,
    },
  ],
  thoughtWorks: [
    {
      thoughtId: 'thought-1',
      specification: null,
      beliefScore: 0,
      cognitiveDistortions: [],
      distortionsExplanation: null,
      usefulness: { helps: null, complicates: null },
      evidence: { for: null, against: null },
      alternative: null,
      catastrophizing: {
        worst: { content: null, belief: 0 },
        best: { content: null, belief: 0 },
        realistic: { content: null, belief: 0 },
      },
      distancing: null,
      reformulation: { originalThought: '', response: null, belief: 0 },
      actionPlan: null,
    },
  ],
  ...overrides,
})

// ── addThoughtReducer ──────────────────────────────────────────────

describe('addThoughtReducer', () => {
  it('adds a new thought with unique id', () => {
    const prev = makePage()
    const next = addThoughtReducer(prev)

    expect(next.thoughts).toHaveLength(3)
    expect(next.thoughts[2].id).toMatch(/^thought-\d+-[a-z0-9]+$/)
    expect(next.thoughts[2].automaticThought).toBeNull()
    expect(next.thoughts[2].emotion).toEqual([])
    expect(next.thoughts[2].behavioralReaction).toBeNull()
  })

  it('preserves existing thoughts', () => {
    const prev = makePage()
    const next = addThoughtReducer(prev)

    expect(next.thoughts[0].id).toBe('thought-1')
    expect(next.thoughts[1].id).toBe('thought-2')
  })

  it('preserves existing thoughtWorks', () => {
    const prev = makePage()
    const next = addThoughtReducer(prev)

    expect(next.thoughtWorks).toHaveLength(1)
    expect(next.thoughtWorks[0].thoughtId).toBe('thought-1')
  })

  it('preserves other fields', () => {
    const prev = makePage({ id: 'custom-id', createdAt: 42 })
    const next = addThoughtReducer(prev)

    expect(next.id).toBe('custom-id')
    expect(next.createdAt).toBe(42)
  })

  it('generates different ids on consecutive calls', () => {
    const prev = makePage()
    const next1 = addThoughtReducer(prev)
    const next2 = addThoughtReducer(next1)

    expect(next2.thoughts[2].id).not.toBe(next1.thoughts[1].id)
  })
})

// ── deleteThoughtReducer ───────────────────────────────────────────

describe('deleteThoughtReducer', () => {
  it('removes the thought by id', () => {
    const prev = makePage()
    const next = deleteThoughtReducer(prev, 'thought-1')

    expect(next.thoughts).toHaveLength(1)
    expect(next.thoughts[0].id).toBe('thought-2')
  })

  it('removes thoughtWorks for the deleted thought', () => {
    const prev = makePage()
    const next = deleteThoughtReducer(prev, 'thought-1')

    expect(next.thoughtWorks).toHaveLength(0)
  })

  it('does NOT remove thoughtWorks for other thoughts', () => {
    const pageWithTwoWorks = makePage({
      thoughtWorks: [
        {
          thoughtId: 'thought-1',
          specification: null,
          beliefScore: 0,
          cognitiveDistortions: [],
          distortionsExplanation: null,
          usefulness: { helps: null, complicates: null },
          evidence: { for: null, against: null },
          alternative: null,
          catastrophizing: {
            worst: { content: null, belief: 0 },
            best: { content: null, belief: 0 },
            realistic: { content: null, belief: 0 },
          },
          distancing: null,
          reformulation: { originalThought: '', response: null, belief: 0 },
          actionPlan: null,
        },
        {
          thoughtId: 'thought-2',
          specification: null,
          beliefScore: 50,
          cognitiveDistortions: [],
          distortionsExplanation: null,
          usefulness: { helps: null, complicates: null },
          evidence: { for: null, against: null },
          alternative: null,
          catastrophizing: {
            worst: { content: null, belief: 0 },
            best: { content: null, belief: 0 },
            realistic: { content: null, belief: 0 },
          },
          distancing: null,
          reformulation: { originalThought: '', response: null, belief: 0 },
          actionPlan: null,
        },
      ],
    })
    const next = deleteThoughtReducer(pageWithTwoWorks, 'thought-1')

    expect(next.thoughtWorks).toHaveLength(1)
    expect(next.thoughtWorks[0].thoughtId).toBe('thought-2')
  })

  it('does nothing if thoughtId does not exist', () => {
    const prev = makePage()
    const next = deleteThoughtReducer(prev, 'non-existent')

    expect(next.thoughts).toHaveLength(2)
    expect(next.thoughtWorks).toHaveLength(1)
  })

  it('preserves other fields', () => {
    const prev = makePage({ id: 'custom-id' })
    const next = deleteThoughtReducer(prev, 'thought-1')

    expect(next.id).toBe('custom-id')
  })
})

// ── startWorkOnThoughtReducer ──────────────────────────────────────

describe('startWorkOnThoughtReducer', () => {
  it('creates a thoughtWork for the given thoughtId', () => {
    const prev = makePage()
    const next = startWorkOnThoughtReducer(prev, 'thought-2')

    expect(next.thoughtWorks).toHaveLength(2)
    expect(next.thoughtWorks[1].thoughtId).toBe('thought-2')
    expect(next.thoughtWorks[1].beliefScore).toBe(0)
    expect(next.thoughtWorks[1].cognitiveDistortions).toEqual([])
  })

  it('does NOT duplicate if thoughtWork already exists', () => {
    const prev = makePage()
    const next = startWorkOnThoughtReducer(prev, 'thought-1')

    expect(next.thoughtWorks).toHaveLength(1)
  })

  it('copies originalThought from automaticThought', () => {
    const prev = makePage({
      thoughts: [
        {
          id: 'thought-1',
          automaticThought: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I am bad' }] }] },
          emotion: [],
          behavioralReaction: null,
        },
      ],
      thoughtWorks: [],
    })
    const next = startWorkOnThoughtReducer(prev, 'thought-1')

    expect(next.thoughtWorks[0].reformulation.originalThought).toBe('I am bad')
  })

  it('handles thought with null automaticThought', () => {
    const prev = makePage()
    const next = startWorkOnThoughtReducer(prev, 'thought-2')

    expect(next.thoughtWorks[1].reformulation.originalThought).toBe('')
  })

  it('preserves existing thoughtWorks', () => {
    const prev = makePage()
    const next = startWorkOnThoughtReducer(prev, 'thought-2')

    expect(next.thoughtWorks[0].thoughtId).toBe('thought-1')
    expect(next.thoughtWorks[0].beliefScore).toBe(0)
  })

  it('preserves other fields', () => {
    const prev = makePage({ id: 'custom-id' })
    const next = startWorkOnThoughtReducer(prev, 'thought-2')

    expect(next.id).toBe('custom-id')
    expect(next.thoughts).toHaveLength(2)
  })
})

// ── updateThoughtWorkReducer ───────────────────────────────────────

describe('updateThoughtWorkReducer', () => {
  it('updates the matching thoughtWork', () => {
    const prev = makePage()
    const next = updateThoughtWorkReducer(prev, 'thought-1', (w) => ({
      ...w,
      beliefScore: 75,
    }))

    expect(next.thoughtWorks[0].beliefScore).toBe(75)
  })

  it('does NOT update non-matching thoughtWorks', () => {
    const prev = makePage()
    const next = updateThoughtWorkReducer(prev, 'thought-1', (w) => ({
      ...w,
      beliefScore: 75,
    }))

    // thought-2 doesn't exist, so no change
    expect(next.thoughtWorks).toHaveLength(1)
  })

  it('preserves other fields of updated thoughtWork', () => {
    const prev = makePage()
    const next = updateThoughtWorkReducer(prev, 'thought-1', (w) => ({
      ...w,
      beliefScore: 75,
    }))

    expect(next.thoughtWorks[0].thoughtId).toBe('thought-1')
    expect(next.thoughtWorks[0].cognitiveDistortions).toEqual([])
  })

  it('does nothing if thoughtId does not exist', () => {
    const prev = makePage()
    const next = updateThoughtWorkReducer(prev, 'non-existent', (w) => ({
      ...w,
      beliefScore: 75,
    }))

    expect(next.thoughtWorks[0].beliefScore).toBe(0)
  })

  it('preserves other fields of page', () => {
    const prev = makePage({ id: 'custom-id' })
    const next = updateThoughtWorkReducer(prev, 'thought-1', (w) => ({
      ...w,
      beliefScore: 75,
    }))

    expect(next.id).toBe('custom-id')
  })
})
