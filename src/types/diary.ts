export interface EditorContent {
  type: string
  content?: any[]
  text?: string
  [key: string]: any
}

export interface Thought {
  id: string
  automaticThought: EditorContent | null
  emotion: { name: string; intensity: number }[]
  behavioralReaction: EditorContent | null
}

export interface ThoughtWork {
  thoughtId: string
  specification: EditorContent | null
  beliefScore: number
  usefulness: {
    helps: EditorContent | null
    complicates: EditorContent | null
  }
  evidence: {
    for: EditorContent | null
    against: EditorContent | null
  }
  alternative: EditorContent | null
  catastrophizing: {
    worst: { content: EditorContent | null; belief: number }
    best: { content: EditorContent | null; belief: number }
    realistic: { content: EditorContent | null; belief: number }
  }
  distancing: EditorContent | null
  reformulation: {
    originalThought: string
    response: EditorContent | null
    belief: number
  }
  actionPlan: EditorContent | null
}

export interface DiaryPage {
  id: string
  createdAt: number
  updatedAt: number
  resource: EditorContent | null
  situation: EditorContent | null
  thoughts: Thought[]
  thoughtWorks: ThoughtWork[]
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
