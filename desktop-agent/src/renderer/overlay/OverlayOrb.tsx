import { cn } from '@renderer/shared/cn'

type OverlayOrbProps = {
  className?: string
  active?: boolean
  recording?: boolean
  /** 模型流式响应中 */
  animating?: boolean
}

/** 圆形悬浮球（内部光斑略缩小） */
export function OverlayOrb({
  className,
  active,
  recording,
  animating,
}: OverlayOrbProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className={cn(
        'overlay-orb-svg size-12 shrink-0',
        active && 'overlay-orb-svg--active',
        recording && 'overlay-orb-svg--recording',
        animating && 'overlay-orb-svg--animating',
        className,
      )}
      role="img"
      aria-hidden
    >
      <defs>
        <filter id="overlay-orb-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
        </filter>
        <linearGradient id="overlay-orb-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id="overlay-orb-blue" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="overlay-orb-violet" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <radialGradient id="overlay-orb-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx="20"
        cy="20"
        r="19"
        className="overlay-orb-frame"
        stroke="currentColor"
        strokeWidth="1"
      />

      <g filter="url(#overlay-orb-blur)" className="overlay-orb-blobs">
        <circle
          cx="14"
          cy="16"
          r="6.5"
          fill="url(#overlay-orb-red)"
          className="overlay-orb-blob overlay-orb-blob--a"
        />
        <circle
          cx="26"
          cy="15"
          r="6"
          fill="url(#overlay-orb-blue)"
          className="overlay-orb-blob overlay-orb-blob--b"
        />
        <circle
          cx="20"
          cy="25"
          r="5.5"
          fill="url(#overlay-orb-violet)"
          className="overlay-orb-blob overlay-orb-blob--c"
        />
      </g>

      <circle cx="20" cy="20" r="4" fill="url(#overlay-orb-core)" className="overlay-orb-center" />
    </svg>
  )
}
