import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageBreak,
  convertMillimetersToTwip,
} from 'docx'
import { saveAs } from 'file-saver'
import type { DiaryPage, Thought } from '../types/diary'

// Извлекаем текст из Tiptap JSON
const extractText = (content: any): string => {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (content.text) return content.text
  if (content.content && Array.isArray(content.content)) {
    return content.content.map(extractText).join('\n')
  }
  return ''
}

const formatContent = (content: any): string => {
  if (!content) return '(не заполнено)'
  const text = extractText(content).trim()
  return text || '(не заполнено)'
}

// Создаёт параграф с форматированием
const makeParagraph = (
  text: string,
  options: {
    bold?: boolean
    size?: number // в полупунктах (24 = 12pt)
    color?: string
    spacing?: { before?: number; after?: number }
    alignment?: 'left' | 'center' | 'right'
  } = {}
): Paragraph => {
  const { bold = false, size = 24, color = '23272E', spacing = {}, alignment } = options

  return new Paragraph({
    spacing: {
      before: spacing.before || 0,
      after: spacing.after || 120,
    },
    alignment: alignment
      ? AlignmentType[alignment.toUpperCase() as keyof typeof AlignmentType]
      : AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold,
        size,
        color,
        font: 'Arial',
      }),
    ],
  })
}

// Создаёт заголовок
const makeHeading = (text: string, level: 0 | 1 | 2 | 3, color: string = '2319EE'): Paragraph => {
  const sizeMap = { 0: 36, 1: 32, 2: 26, 3: 22 }
  const headingMap = {
    0: HeadingLevel.HEADING_1,
    1: HeadingLevel.HEADING_2,
    2: HeadingLevel.HEADING_3,
    3: HeadingLevel.HEADING_4,
  } as const

  return new Paragraph({
    heading: headingMap[level],
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizeMap[level],
        color,
        font: 'Arial',
      }),
    ],
  })
}

// Создаёт параграф "label: value"
const makeLabelValue = (label: string, value: string): Paragraph => {
  return new Paragraph({
    spacing: { before: 40, after: 80 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: 20,
        color: '23272E',
        font: 'Arial',
      }),
      new TextRun({
        text: value,
        size: 20,
        color: '23272E',
        font: 'Arial',
      }),
    ],
  })
}

// Создаёт блок мысли
const createThoughtChildren = (
  thought: Thought,
  index: number,
  page: DiaryPage
): (Paragraph | Table)[] => {
  const children: (Paragraph | Table)[] = []

  // Заголовок мысли
  children.push(makeHeading(`Мысль ${index + 1}`, 2, '23272E'))

  // Таблица с тремя колонками
  const emotionsText = thought.emotion?.length
    ? thought.emotion.map((e) => `${e.name || '—'} (${e.intensity}%)`).join('\n')
    : '(не заполнено)'

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Автоматическая мысль',
                    bold: true,
                    size: 20,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: formatContent(thought.automaticThought),
                    size: 20,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Эмоции', bold: true, size: 20, font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [new TextRun({ text: emotionsText, size: 20, font: 'Arial' })],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            width: { size: 34, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Поведенческая реакция',
                    bold: true,
                    size: 20,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: formatContent(thought.behavioralReaction),
                    size: 20,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  })
  children.push(table)

  // Работа с мыслью
  const work = page.thoughtWorks?.find((w) => w.thoughtId === thought.id)
  if (work) {
    children.push(makeHeading('Работа с мыслью', 3, '2319EE'))
    children.push(makeLabelValue('Конкретизация', formatContent(work.specification)))
    children.push(makeLabelValue('Убеждённость', `${work.beliefScore}%`))
    children.push(makeLabelValue('Чем помогает', formatContent(work.usefulness?.helps)))
    children.push(
      makeLabelValue('Как усложняет жизнь', formatContent(work.usefulness?.complicates))
    )
    children.push(makeLabelValue('Доказательства "за"', formatContent(work.evidence?.for)))
    children.push(makeLabelValue('Доказательства "против"', formatContent(work.evidence?.against)))
    children.push(makeLabelValue('Альтернатива', formatContent(work.alternative)))
    children.push(
      makeLabelValue(
        'Худший сценарий',
        `${formatContent(work.catastrophizing?.worst?.content)} (${work.catastrophizing?.worst?.belief || 0}%)`
      )
    )
    children.push(
      makeLabelValue(
        'Лучший сценарий',
        `${formatContent(work.catastrophizing?.best?.content)} (${work.catastrophizing?.best?.belief || 0}%)`
      )
    )
    children.push(
      makeLabelValue(
        'Реалистичный сценарий',
        `${formatContent(work.catastrophizing?.realistic?.content)} (${work.catastrophizing?.realistic?.belief || 0}%)`
      )
    )
    children.push(makeLabelValue('Дистанцирование', formatContent(work.distancing)))
    children.push(
      makeLabelValue(
        'Реалистичный ответ',
        `${formatContent(work.reformulation?.response)} (${work.reformulation?.belief || 0}%)`
      )
    )
    children.push(makeLabelValue('План действий', formatContent(work.actionPlan)))
  }

  return children
}

// Создаёт секцию для одной страницы дневника
const createPageSection = (page: DiaryPage, pageIndex: number, isLast: boolean) => {
  const children: (Paragraph | Table)[] = []

  // Заголовок страницы
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: '2319EE' },
      },
      children: [
        new TextRun({
          text: `Страница ${pageIndex + 1}`,
          bold: true,
          size: 36,
          color: '2319EE',
          font: 'Arial',
        }),
      ],
    })
  )

  // Дата
  children.push(
    makeParagraph(new Date(page.createdAt).toLocaleString('ru-RU'), {
      size: 18,
      color: '6B7280',
      spacing: { after: 200 },
    })
  )

  // Ресурс
  children.push(makeHeading('Ресурс', 1))
  children.push(makeParagraph(formatContent(page.resource), { size: 22 }))

  // Ситуация
  children.push(makeHeading('Ситуация', 1))
  children.push(makeParagraph(formatContent(page.situation), { size: 22 }))

  // Мысли
  children.push(makeHeading('Мысли', 1))
  if (page.thoughts.length > 0) {
    page.thoughts.forEach((thought, i) => {
      children.push(...createThoughtChildren(thought, i, page))
    })
  } else {
    children.push(makeParagraph('(нет мыслей)', { size: 22, color: '6B7280' }))
  }

  // Разрыв страницы между записями
  if (!isLast) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
  }

  return { children }
}

// Генерация Word для одной страницы
export const generatePageDocx = async (page: DiaryPage, pageIndex: number): Promise<void> => {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(15),
              right: convertMillimetersToTwip(15),
              bottom: convertMillimetersToTwip(15),
              left: convertMillimetersToTwip(15),
            },
          },
        },
        children: createPageSection(page, pageIndex, true).children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `Дневник_Страница_${pageIndex + 1}.docx`)
}

// Генерация Word для всех страниц
export const generateAllPagesDocx = async (
  pages: DiaryPage[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  if (pages.length === 0) return

  const sections = pages.map((page, i) => {
    onProgress?.(i + 1, pages.length)
    return createPageSection(page, i, i === pages.length - 1)
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: sections.map((section) => ({
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(15),
            right: convertMillimetersToTwip(15),
            bottom: convertMillimetersToTwip(15),
            left: convertMillimetersToTwip(15),
          },
        },
      },
      children: section.children,
    })),
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, 'Дневник_все_страницы.docx')
}
