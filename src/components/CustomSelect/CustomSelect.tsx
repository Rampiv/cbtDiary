import { useState, useRef, useEffect, useCallback, useId } from 'react'
import './CustomSelect.scss'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
  placeholder?: string
  'aria-label'?: string
}

export const CustomSelect = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Выберите...',
  'aria-label': ariaLabel,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownId = useId()

  const selectedOption = options.find((opt) => opt.value === value)

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
      setActiveIndex(-1)
      // Возвращаем фокус на триггер после выбора
      triggerRef.current?.focus()
    },
    [onChange]
  )

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setActiveIndex(selectedOption ? options.findIndex((o) => o.value === value) : -1)
      return !prev
    })
  }, [value, options, selectedOption])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        toggleDropdown()
        return
      }

      if (isOpen && e.key === 'Escape') {
        e.preventDefault()
        closeDropdown()
        return
      }

      if (isOpen && e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
        return
      }

      if (isOpen && e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
        return
      }

      if (isOpen && e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSelect(options[activeIndex].value)
        } else {
          closeDropdown()
        }
        return
      }

      if (isOpen && e.key === ' ' && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(options[activeIndex].value)
        return
      }
    },
    [isOpen, toggleDropdown, closeDropdown, activeIndex, options, handleSelect]
  )

  // Скролл активной опции в видимую область
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && containerRef.current) {
      const option = containerRef.current.querySelector(
        `[data-option-index="${activeIndex}"]`
      )
      // scrollIntoView может отсутствовать в некоторых тестовых средах
      if (option && typeof (option as HTMLElement).scrollIntoView === 'function') {
        ;(option as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, activeIndex])

  return (
    <div className={`custom-select ${className}`} ref={containerRef}>
      <div
        ref={triggerRef}
        className={`custom-select__trigger ${isOpen ? 'custom-select__trigger--open' : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={dropdownId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${dropdownId}-option-${activeIndex}` : undefined}
        aria-label={ariaLabel || placeholder}
        tabIndex={0}
      >
        <span className="custom-select__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className="custom-select__arrow"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          id={dropdownId}
          className="custom-select__dropdown"
          role="listbox"
          aria-label={ariaLabel || placeholder}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${dropdownId}-option-${index}`}
              data-option-index={index}
              className={`custom-select__option ${
                option.value === value ? 'custom-select__option--active' : ''
              } ${index === activeIndex ? 'custom-select__option--active' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
