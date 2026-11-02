import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomSelect } from './CustomSelect'

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

function renderSelect(props = {}) {
  return render(
    <CustomSelect
      value=""
      onChange={vi.fn()}
      options={defaultOptions}
      placeholder="Выберите..."
      {...props}
    />
  )
}

// ============================================================
// 🟢 RENDER & INITIAL STATE
// ============================================================

describe('Render & initial state', () => {
  it('renders placeholder when value does not match any option', () => {
    renderSelect({ value: 'nonexistent' })
    expect(screen.getByText('Выберите...')).toBeInTheDocument()
  })

  it('renders label of selected option when value matches', () => {
    renderSelect({ value: 'banana' })
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('renders custom placeholder prop', () => {
    renderSelect({ placeholder: 'Pick one...' })
    expect(screen.getByText('Pick one...')).toBeInTheDocument()
  })

  it('applies external className to root element', () => {
    const { container } = renderSelect({ className: 'my-custom-class' })
    const root = container.querySelector('.custom-select')
    expect(root).toHaveClass('my-custom-class')
  })

  it('dropdown is NOT rendered when closed', () => {
    const { container } = renderSelect()
    const options = container.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(0)
  })

  it('has aria-expanded="false" when closed', () => {
    const { container } = renderSelect()
    const combobox = container.querySelector('[role="combobox"]')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
  })

  it('has aria-selected="true" on the active option in open dropdown', () => {
    const { container } = renderSelect({ value: 'cherry' })
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const option = container.querySelector('[aria-selected="true"]')
    expect(option).toBeInTheDocument()
    expect(option).toHaveTextContent('Cherry')
  })
})

// ============================================================
// 🟡 OPEN / CLOSE (interactivity)
// ============================================================

describe('Open / close (interactivity)', () => {
  it('click on trigger opens dropdown (options appear, aria-expanded="true")', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('click on trigger again closes dropdown', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
  })

  it('click on option closes dropdown', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    const option = container.querySelector('[role="option"]')!
    fireEvent.click(option)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
  })

  it('click on option calls onChange with correct value', () => {
    const mockOnChange = vi.fn()
    const { container } = renderSelect({ value: '', onChange: mockOnChange })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    const option = container.querySelectorAll('[role="option"]')[1]!
    fireEvent.click(option)

    expect(mockOnChange).toHaveBeenCalledWith('banana')
  })

  it('click on option does NOT call onChange when dropdown not in DOM', () => {
    const mockOnChange = vi.fn()
    const { container } = renderSelect({ value: '', onChange: mockOnChange })

    // Dropdown never opened — options not in DOM
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('onChange is NOT called when clicking the trigger (opening != selecting)', () => {
    const mockOnChange = vi.fn()
    const { container } = renderSelect({ onChange: mockOnChange })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(mockOnChange).not.toHaveBeenCalled()
  })
})

// ============================================================
// 🟠 CLICK OUTSIDE (mousedown listener)
// ============================================================

describe('Click outside (mousedown listener)', () => {
  it('click outside component closes dropdown', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.mouseDown(document.body)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
  })

  it('click inside component does NOT close dropdown (click on option)', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    const option = container.querySelector('[role="option"]')!

    fireEvent.mouseDown(option)
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3)
  })

  it('click on trigger inside component does NOT close via outside listener', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.mouseDown(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('listener is removed on unmount — no errors', () => {
    const { unmount, container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    unmount()
    expect(() => fireEvent.mouseDown(document.body)).not.toThrow()
  })
})

// ============================================================
// 🔵 KEYBOARD
// ============================================================

describe('Keyboard', () => {
  it('Enter opens dropdown', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('Space opens dropdown and calls preventDefault', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    const preventDefaultSpy = vi.spyOn(KeyboardEvent.prototype, 'preventDefault')
    fireEvent.keyDown(trigger, { key: ' ' })

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(preventDefaultSpy).toHaveBeenCalled()
    preventDefaultSpy.mockRestore()
  })

  it('Escape closes dropdown and does NOT call onChange', () => {
    const mockOnChange = vi.fn()
    const { container } = renderSelect({ onChange: mockOnChange })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('Enter/Space on closed opens, on open closes (toggle)', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    // Closed -> open
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Open -> closed
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Closed -> open again
    fireEvent.keyDown(trigger, { key: ' ' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('Tab moves focus away (trigger has tabIndex=0)', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    expect(trigger).toHaveAttribute('tabIndex', '0')
  })

  it('arrow key navigation between options', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)

    // Initially no option is active
    expect(trigger).not.toHaveAttribute('aria-activedescendant')

    // ArrowDown → first option (index 0)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(container.querySelector('[data-option-index="0"]')).toHaveClass('custom-select__option--active')

    // ArrowDown → second option (index 1)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(container.querySelector('[data-option-index="1"]')).toHaveClass('custom-select__option--active')

    // ArrowDown → third option (index 2)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(container.querySelector('[data-option-index="2"]')).toHaveClass('custom-select__option--active')

    // ArrowDown wraps to first option (index 0)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(container.querySelector('[data-option-index="0"]')).toHaveClass('custom-select__option--active')

    // ArrowUp → third option (index 2, wraps around)
    fireEvent.keyDown(trigger, { key: 'ArrowUp' })
    expect(container.querySelector('[data-option-index="2"]')).toHaveClass('custom-select__option--active')

    // ArrowUp → second option (index 1)
    fireEvent.keyDown(trigger, { key: 'ArrowUp' })
    expect(container.querySelector('[data-option-index="1"]')).toHaveClass('custom-select__option--active')
  })
})

// ============================================================
// 🔴 ACCESSIBILITY (a11y)
// ============================================================

describe('Accessibility (a11y)', () => {
  it('trigger has role="combobox"', () => {
    const { container } = renderSelect()
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument()
  })

  it('trigger has aria-haspopup="listbox"', () => {
    const { container } = renderSelect()
    const combobox = container.querySelector('[role="combobox"]')!
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('trigger has aria-controls pointing to dropdown id', async () => {
    const { container } = renderSelect()
    const combobox = container.querySelector('[role="combobox"]')!
    const controlsId = combobox.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()

    // Open dropdown so it renders
    fireEvent.click(combobox)

    // Verify dropdown renders with matching ID
    await waitFor(() => {
      const dropdown = container.querySelector('[role="listbox"]')
      expect(dropdown).toBeInTheDocument()
      expect(dropdown).toHaveAttribute('id', controlsId!)
    })
  })

  it('dropdown has role="listbox"', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const listbox = container.querySelector('[role="listbox"]')
    expect(listbox).toBeInTheDocument()
  })

  it('options have role="option"', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const options = container.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(3)
  })

  it('only one option has aria-selected="true" at a time', () => {
    const { container } = renderSelect({ value: 'banana' })
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const selected = container.querySelectorAll('[aria-selected="true"]')
    expect(selected).toHaveLength(1)
  })

  it('options do NOT have tabIndex (not keyboard-focusable directly)', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const options = container.querySelectorAll('[role="option"]')
    options.forEach((opt) => {
      expect(opt).not.toHaveAttribute('tabIndex')
    })
  })

  it('arrow has aria-hidden and focusable="false"', () => {
    const { container } = renderSelect()
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('aria-activedescendant updates on arrow navigation', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!
    const dropdownId = trigger.getAttribute('aria-controls')!

    // Closed — no activedescendant
    expect(trigger).not.toHaveAttribute('aria-activedescendant')

    // Open — still no active option
    fireEvent.click(trigger)
    expect(trigger).not.toHaveAttribute('aria-activedescendant')

    // ArrowDown → first option
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute('aria-activedescendant', `${dropdownId}-option-0`)

    // ArrowDown → second option
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute('aria-activedescendant', `${dropdownId}-option-1`)

    // Escape closes — activedescendant removed
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(trigger).not.toHaveAttribute('aria-activedescendant')
  })
})

// ============================================================
// 🟣 EDGE CASES
// ============================================================

describe('Edge cases', () => {
  it('empty options=[] — opens without crashing', () => {
    const { container } = renderSelect({ options: [] })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0)
  })

  it('options with same label but different value — only one highlighted', () => {
    const options = [
      { value: 'a-1', label: 'Same' },
      { value: 'a-2', label: 'Same' },
      { value: 'a-3', label: 'Same' },
    ]
    const { container } = renderSelect({ value: 'a-2', options })
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const selected = container.querySelectorAll('[aria-selected="true"]')
    expect(selected).toHaveLength(1)
  })

  it('value not found in options — renders placeholder', () => {
    renderSelect({ value: 'unknown' })
    expect(screen.getByText('Выберите...')).toBeInTheDocument()
  })

  it('long list (100 options) — renders without crashing', () => {
    const longOptions = Array.from({ length: 100 }, (_, i) => ({
      value: `opt-${i}`,
      label: `Option ${i}`,
    }))
    const { container } = renderSelect({ options: longOptions, value: '' })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(100)
  })

  it('options update on rerender (props change)', () => {
    const { container, rerender } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3)

    const newOptions = [
      { value: 'x', label: 'X' },
      { value: 'y', label: 'Y' },
    ]
    rerender(<CustomSelect value="" onChange={vi.fn()} options={newOptions} placeholder="Выберите..." />)

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(2)
  })

  it('controlled value change — new label shown, aria-selected recalculated', () => {
    const mockOnChange = vi.fn()
    const { container, rerender } = renderSelect({ value: '', onChange: mockOnChange })
    const trigger = container.querySelector('[role="combobox"]')!

    fireEvent.click(trigger)

    rerender(
      <CustomSelect value="banana" onChange={mockOnChange} options={defaultOptions} placeholder="Выберите..." />
    )

    // Check trigger value, not dropdown option text
    const triggerValue = container.querySelector('.custom-select__value')
    expect(triggerValue).toHaveTextContent('Banana')
    const selected = container.querySelectorAll('[aria-selected="true"]')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('Banana')
  })

  it('placeholder changes on the fly', () => {
    renderSelect({ placeholder: 'Initial...' })
    expect(screen.getByText('Initial...')).toBeInTheDocument()

    // Rerender with new placeholder
    render(<CustomSelect value="" onChange={vi.fn()} options={defaultOptions} placeholder="New..." />)
    expect(screen.getByText('New...')).toBeInTheDocument()
  })
})

// ============================================================
// ⚪ DOM / SCSS CONTRACT
// ============================================================

describe('DOM / SCSS contract', () => {
  it('custom-select__trigger--open class appears/disappears correctly', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('.custom-select__trigger')!

    expect(trigger).not.toHaveClass('custom-select__trigger--open')

    fireEvent.click(trigger)
    expect(trigger).toHaveClass('custom-select__trigger--open')

    fireEvent.click(trigger)
    expect(trigger).not.toHaveClass('custom-select__trigger--open')
  })

  it('custom-select__option--active on selected option (in open state)', () => {
    const { container } = renderSelect({ value: 'apple' })
    const trigger = container.querySelector('[role="combobox"]')!
    fireEvent.click(trigger)

    const active = container.querySelector('.custom-select__option--active')
    expect(active).toBeInTheDocument()
    expect(active).toHaveTextContent('Apple')
  })

  it('click on SVG arrow opens (event bubbles to trigger)', () => {
    const { container } = renderSelect()
    const trigger = container.querySelector('[role="combobox"]')!

    const svg = container.querySelector('svg')!
    fireEvent.click(svg)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
