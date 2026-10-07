export interface CognitiveDistortion {
  id: string
  name: string
}

export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  { id: 'confirmation_bias', name: 'Предвзятость подтверждения' },
  { id: 'base_rate', name: 'Игнорирование базовых показателей' },
  { id: 'polarized', name: 'Поляризованное мышление' },
  { id: 'overgeneralization', name: 'Чрезмерное обобщение' },
  { id: 'catastrophizing', name: 'Катастрофизация' },
  { id: 'personalization', name: 'Персонализация' },
  { id: 'mind_reading', name: 'Чтение мыслей' },
  { id: 'emotional_reasoning', name: 'Эмоциональное мышление' },
  { id: 'labeling', name: 'Навешивание ярлыков' },
  { id: 'should_statements', name: 'Утверждения «должен»' },
  { id: 'control', name: 'Ошибка контроля' },
  { id: 'fairness', name: 'Ошибка справедливости' },
  { id: 'change', name: 'Ошибка изменения' },
]
