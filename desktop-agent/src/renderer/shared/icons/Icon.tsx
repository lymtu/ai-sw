import { cn } from '@renderer/shared/cn'

type IconProps = {
  className?: string
  title?: string
}

export function IconMic({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6 11a6 6 0 0 0 12 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 17v3.5M9 20.5h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMicRecording({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 shrink-0 text-[var(--color-danger)]', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 11a6 6 0 0 0 12 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 17v3.5M9 20.5h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity={0.7}
      />
      <path d="M3 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <path d="M21 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

/** 新建会话 */
export function IconNewChat({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M7 5.5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSend({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M5 12h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M13 7l6 5-6 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconPrompt({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M7 5.5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9.5h7M8.5 12.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconApi({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M12 3v2M8.5 5.5l1.4 1.4M15.5 5.5l-1.4 1.4M7 12H5M19 12h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 16v5M9 21h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconHistory({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconKeyboard({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 13h4M13 13h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconClose({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconTheme({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSliders({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M4 8h10M20 8h-2M4 16h2M20 16H10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="8" cy="16" r="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export function IconInfo({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[18px] shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconMinimize({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-3.5 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function IconTrash({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-3.5 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 拖动窗口（用于无边框 Overlay 标题栏） */
export function IconGripDrag({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      pointerEvents="none"
      className={cn('pointer-events-none size-4 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="9" cy="7" r="1.35" pointerEvents="none" />
      <circle cx="15" cy="7" r="1.35" pointerEvents="none" />
      <circle cx="9" cy="12" r="1.35" pointerEvents="none" />
      <circle cx="15" cy="12" r="1.35" pointerEvents="none" />
      <circle cx="9" cy="17" r="1.35" pointerEvents="none" />
      <circle cx="15" cy="17" r="1.35" pointerEvents="none" />
    </svg>
  )
}

export function IconHide({ className, title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-3.5 shrink-0', className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
