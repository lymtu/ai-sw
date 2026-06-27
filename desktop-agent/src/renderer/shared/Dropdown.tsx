import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@renderer/shared/cn'

export type DropdownOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type DropdownProps = {
  label?: string
  hint?: string
  value: string
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
  optionClassName?: string
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'size-4 shrink-0 text-[var(--color-muted)] transition-transform',
        open && 'rotate-180',
      )}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Dropdown({
  label,
  hint,
  value,
  options,
  placeholder = '请选择',
  disabled = false,
  onChange,
  className,
  buttonClassName,
  menuClassName,
  optionClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = (option: DropdownOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const control = (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)]',
          'bg-[var(--color-surface-elevated)] px-3 py-2 text-left text-sm outline-none',
          'transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-[var(--color-muted)]',
          selected && 'text-[var(--color-text)]',
          buttonClassName,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <IconChevron open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            'dropdown-menu custom-scrollbar absolute top-[calc(100%+4px)] z-50 max-h-56 w-full',
            'overflow-y-auto rounded-lg border border-[var(--color-border)]',
            'bg-[var(--color-surface-elevated)] py-1 shadow-lg',
            menuClassName,
          )}
        >
          {options.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-[var(--color-muted)]">
              {placeholder}
            </li>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value || option.label} role="option">
                  <button
                    type="button"
                    disabled={option.disabled}
                    aria-selected={isSelected}
                    onClick={() => pick(option)}
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                      isSelected
                        ? 'bg-[var(--color-accent)] font-medium text-white'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]',
                      !isSelected &&
                        !option.disabled &&
                        'hover:text-[var(--color-text)]',
                      optionClassName,
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span
                        className={cn(
                          'truncate text-xs font-normal',
                          isSelected
                            ? 'text-white/80'
                            : 'text-[var(--color-muted)]',
                        )}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )

  if (!label) {
    return control
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {control}
      {hint ? (
        <span className="text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  )
}
