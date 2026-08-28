import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, FocusEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck, IconClose } from './Icon'
import './toast.css'

type ToastTone = 'neutral' | 'success' | 'warning' | 'error'

export interface ToastOpts {
  title: string
  desc?: string
  tone?: ToastTone
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastRecord extends ToastOpts {
  id: number
  tone: ToastTone
  duration: number
}

type PushToast = (options: ToastOpts) => void

const ToastContext = createContext<PushToast | null>(null)

function ToastGlyph({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <IconCheck size={20} />
  if (tone === 'error') return <IconClose size={20} />
  if (tone === 'warning') return <span aria-hidden>!</span>
  return <span className="toast-dot" aria-hidden />
}

function ToastItem({ toast, onRemove }: { toast: ToastRecord; onRemove: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toast.duration)
  const startedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const leavingRef = useRef(false)
  const pausedRef = useRef(false)
  const hoverRef = useRef(false)
  const focusRef = useRef(false)

  const beginLeave = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    clearTimeout(timerRef.current)
    leaveTimerRef.current = setTimeout(() => onRemove(toast.id), 180)
  }, [onRemove, toast.id])

  const schedule = useCallback(() => {
    clearTimeout(timerRef.current)
    startedAtRef.current = Date.now()
    timerRef.current = setTimeout(beginLeave, remainingRef.current)
  }, [beginLeave])

  const pause = useCallback(() => {
    if (leavingRef.current || pausedRef.current) return
    pausedRef.current = true
    clearTimeout(timerRef.current)
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current))
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    if (leavingRef.current || !pausedRef.current || hoverRef.current || focusRef.current) return
    pausedRef.current = false
    setPaused(false)
    schedule()
  }, [schedule])

  useEffect(() => {
    schedule()
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(leaveTimerRef.current)
    }
  }, [schedule])

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    focusRef.current = false
    resume()
  }

  return (
    <article
      className={`toast ${toast.tone} ${leaving ? 'leave' : 'enter'}${paused ? ' is-paused' : ''}`}
      style={{ '--dur': `${toast.duration}ms` } as CSSProperties}
      onMouseEnter={() => {
        hoverRef.current = true
        pause()
      }}
      onMouseLeave={() => {
        hoverRef.current = false
        resume()
      }}
      onFocus={() => {
        focusRef.current = true
        pause()
      }}
      onBlur={onBlur}
    >
      <span className="toast-icon" aria-hidden><ToastGlyph tone={toast.tone} /></span>
      <span className="toast-copy">
        <span className="toast-title">{toast.title}</span>
        {toast.desc && <span className="toast-desc">{toast.desc}</span>}
        {toast.action && (
          <button
            type="button"
            className="toast-action"
            onClick={() => {
              toast.action?.onClick()
              beginLeave()
            }}
          >
            {toast.action.label}
          </button>
        )}
      </span>
      <button type="button" className="toast-x pressable" aria-label="Dismiss notification" onClick={beginLeave}>
        <IconClose size={16} />
      </button>
      <span className="toast-progress" aria-hidden />
    </article>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)

  const push = useCallback((options: ToastOpts) => {
    nextId.current += 1
    setToasts((current) => [
      ...current,
      {
        ...options,
        id: nextId.current,
        tone: options.tone ?? 'neutral',
        duration: options.duration ?? 4200,
      },
    ])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onRemove={remove} />)}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): PushToast {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast must be used within a ToastProvider')
  return push
}
