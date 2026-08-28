import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck } from './Icon'
import './select.css'

export interface SelectOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: SelectOption<T>[]
  ariaLabel: string
  size?: 'sm' | 'md' | 'lg'
  placeholder?: string
}

interface MenuPosition {
  left: number
  top: number
  width: number
}

function firstEnabled<T extends string>(options: SelectOption<T>[]) {
  return options.findIndex((option) => !option.disabled)
}

function lastEnabled<T extends string>(options: SelectOption<T>[]) {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) return index
  }
  return -1
}

function nextEnabled<T extends string>(options: SelectOption<T>[], current: number, direction: 1 | -1) {
  if (!options.length) return -1
  for (let step = 1; step <= options.length; step += 1) {
    const index = (current + direction * step + options.length) % options.length
    if (!options[index]?.disabled) return index
  }
  return -1
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  placeholder,
}: SelectProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const listboxId = `sel-${rawId.replace(/:/g, '')}`
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : firstEnabled(options))
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0, width: 0 })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const estimatedHeight = Math.min(menuRef.current?.offsetHeight ?? options.length * 44 + 8, 280)
    const below = rect.bottom + 4
    const above = rect.top - estimatedHeight - 4
    const top = below + estimatedHeight > window.innerHeight && above >= 4 ? above : below
    setPosition({ left: rect.left, top, width: rect.width })
  }, [options.length])

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  const openMenu = useCallback((preferredIndex?: number) => {
    const fallback = selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : firstEnabled(options)
    setActiveIndex(preferredIndex ?? fallback)
    updatePosition()
    setOpen(true)
  }, [options, selectedIndex, updatePosition])

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    menuRef.current?.focus()

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close()
    }
    const onViewportChange = () => close()
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [close, open])

  const choose = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    close()
  }

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (open) return
      if (event.key === 'ArrowUp') openMenu(lastEnabled(options))
      else openMenu()
    }
  }

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => nextEnabled(options, current, event.key === 'ArrowDown' ? 1 : -1))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? firstEnabled(options) : lastEnabled(options))
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(activeIndex)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key === 'Tab') close()
  }

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`sel-trigger sel-${size}` + (!selected ? ' is-placeholder' : '')}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => open ? close() : openMenu()}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="sel-value">{selected?.label ?? placeholder ?? ''}</span>
        <svg className="sel-caret" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          className="sel-menu"
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={activeOptionId}
          style={{ left: position.left, top: position.top, width: position.width }}
          onKeyDown={onMenuKeyDown}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${listboxId}-opt-${index}`}
              className={`sel-opt${index === activeIndex ? ' is-active' : ''}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onPointerMove={() => {
                if (!option.disabled) setActiveIndex(index)
              }}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              <IconCheck className="sel-tick" size={16} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
