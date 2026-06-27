import { cn } from '@renderer/shared/cn'

export const inputClass = cn(
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
  'px-3 py-2 text-sm text-[var(--color-text)] outline-none',
  'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
)

export const selectClass = cn(
  inputClass,
  'select-field cursor-pointer appearance-none pr-9',
)

export const deleteButtonClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent',
  'px-2.5 py-2 text-xs text-[var(--color-muted)] transition-colors',
  'hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-error-bg)] hover:text-[var(--color-danger)]',
  'disabled:pointer-events-none disabled:opacity-40',
)

export const modelSelectClass = cn(selectClass, 'select-field--model')

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  )
}

export function SelectField({
  label,
  hint,
  className,
  ...props
}: {
  label: string
  hint?: string
  className?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint}>
      <select className={cn(selectClass, className)} {...props} />
    </Field>
  )
}
