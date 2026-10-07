import { describe, it, expect } from 'vitest'
import {
  createEmptyThought,
  createEmptyThoughtWork,
  createEmptyDiaryPage,
} from '../types/diary'

describe('createEmptyThought', () => {
  it('should create a thought with correct structure', () => {
    const thought = createEmptyThought()

    expect(thought).toHaveProperty('id')
    expect(thought.automaticThought).toBeNull()
    expect(thought.emotion).toEqual([])
    expect(thought.behavioralReaction).toBeNull()
  })

  it('should generate unique IDs', () => {
    const thought1 = createEmptyThought()
    const thought2 = createEmptyThought()

    expect(thought1.id).toMatch(/^thought-/)
    expect(thought2.id).toMatch(/^thought-/)
    expect(thought1.id).not.toBe(thought2.id)
  })
})

describe('createEmptyThoughtWork', () => {
  it('should create a thought work with correct structure', () => {
    const thoughtId = 'thought-test-123'
    const work = createEmptyThoughtWork(thoughtId)

    expect(work.thoughtId).toBe(thoughtId)
    expect(work.specification).toBeNull()
    expect(work.beliefScore).toBe(0)
    expect(work.usefulness).toEqual({ helps: null, complicates: null })
    expect(work.evidence).toEqual({ for: null, against: null })
    expect(work.alternative).toBeNull()
    expect(work.distancing).toBeNull()
    expect(work.actionPlan).toBeNull()
  })

  it('should initialize catastrophizing with default values', () => {
    const work = createEmptyThoughtWork('thought-1')

    expect(work.catastrophizing.worst).toEqual({ content: null, belief: 0 })
    expect(work.catastrophizing.best).toEqual({ content: null, belief: 0 })
    expect(work.catastrophizing.realistic).toEqual({ content: null, belief: 0 })
  })

  it('should initialize reformulation with default values', () => {
    const work = createEmptyThoughtWork('thought-1')

    expect(work.reformulation).toEqual({
      originalThought: '',
      response: null,
      belief: 0,
    })
  })
})

describe('createEmptyDiaryPage', () => {
  it('should create a diary page with correct structure', () => {
    const pageId = 'page-test-123'
    const page = createEmptyDiaryPage(pageId)

    expect(page.id).toBe(pageId)
    expect(typeof page.createdAt).toBe('number')
    expect(typeof page.updatedAt).toBe('number')
    expect(page.resource).toBeNull()
    expect(page.situation).toBeNull()
    expect(Array.isArray(page.thoughts)).toBe(true)
    expect(page.thoughts.length).toBe(1)
    expect(page.thoughtWorks).toEqual([])
  })

  it('should have createdAt and updatedAt set to current time', () => {
    const before = Date.now()
    const page = createEmptyDiaryPage('page-1')
    const after = Date.now()

    expect(page.createdAt).toBeGreaterThanOrEqual(before)
    expect(page.createdAt).toBeLessThanOrEqual(after)
    expect(page.updatedAt).toBeGreaterThanOrEqual(before)
    expect(page.updatedAt).toBeLessThanOrEqual(after)
  })

  it('should create a page with one empty thought', () => {
    const page = createEmptyDiaryPage('page-1')

    expect(page.thoughts[0]).toHaveProperty('id')
    expect(page.thoughts[0]).toHaveProperty('automaticThought')
    expect(page.thoughts[0]).toHaveProperty('emotion')
    expect(page.thoughts[0]).toHaveProperty('behavioralReaction')
  })
})
