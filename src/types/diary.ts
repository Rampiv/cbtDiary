export interface EditorContentNode {
  type: string
  content?: EditorContentNode[]
  text?: string
  attrs?: Record<string, unknown>
  [key: string]: unknown
}

export type EditorContent = EditorContentNode | null

export interface Thought {
  id: string
  automaticThought: EditorContent
  emotion: { name: string; intensity: number }[]
  behavioralReaction: EditorContent
}

export interface ThoughtWork {
  thoughtId: string
  specification: EditorContent
  beliefScore: number
  usefulness: {
    helps: EditorContent
    complicates: EditorContent
  }
  evidence: {
    for: EditorContent
    against: EditorContent
  }
  alternative: EditorContent
  catastrophizing: {
    worst: { content: EditorContent; belief: number }
    best: { content: EditorContent; belief: number }
    realistic: { content: EditorContent; belief: number }
  }
  distancing: EditorContent
  reformulation: {
    originalThought: string
    response: EditorContent
    belief: number
  }
  actionPlan: EditorContent
}

export interface DiaryPage {
  id: string
  createdAt: number
  updatedAt: number
  resource: EditorContent
  situation: EditorContent
  thoughts: Thought[]
  thoughtWorks: ThoughtWork[]
  _encrypted?: {
    encrypted: string
    salt: string
    iv: string
    version: number
  }
}

export const createEmptyThought = (index: number): Thought => ({
  id: `thought-${index}`,
  automaticThought: null,
  emotion: [],
  behavioralReaction: null,
})

export const createEmptyThoughtWork = (thoughtId: string): ThoughtWork => ({
  thoughtId,
  specification: null,
  beliefScore: 0,
  usefulness: { helps: null, complicates: null },
  evidence: { for: null, against: null },
  alternative: null,
  catastrophizing: {
    worst: { content: null, belief: 0 },
    best: { content: null, belief: 0 },
    realistic: { content: null, belief: 0 },
  },
  distancing: null,
  reformulation: {
    originalThought: '',
    response: null,
    belief: 0,
  },
  actionPlan: null,
})

export const createEmptyDiaryPage = (id: string): DiaryPage => ({
  id,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  resource: null,
  situation: null,
  thoughts: [createEmptyThought(1)],
  thoughtWorks: [],
})
