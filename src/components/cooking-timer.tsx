'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Timer as TimerIcon, Play, Pause, RotateCcw, X } from 'lucide-react'

interface CookingTimerState {
  open: boolean
  label: string
  durationSec: number
  remainingSec: number
  running: boolean
}

const INITIAL: CookingTimerState = {
  open: false,
  label: '',
  durationSec: 0,
  remainingSec: 0,
  running: false,
}

// Parse "10 minutes", "10-15 minutes", "1 hour 10 minutes", "30 seconds" → seconds
function parseDuration(text: string): number | null {
  const lower = text.toLowerCase()
  let total = 0
  let found = false

  const hourMatch = lower.match(/(\d+)\s*(?:hour|hr|h)\b/)
  if (hourMatch) {
    total += parseInt(hourMatch[1], 10) * 3600
    found = true
  }
  const minMatch = lower.match(/(\d+)\s*(?:minute|min|m)\b/)
  if (minMatch) {
    total += parseInt(minMatch[1], 10) * 60
    found = true
  }
  const secMatch = lower.match(/(\d+)\s*(?:second|sec|s)\b/)
  if (secMatch) {
    total += parseInt(secMatch[1], 10)
    found = true
  }
  // Take the lower bound of ranges like "10-15 minutes"
  return found ? total : null
}

// Detect duration phrases inside a step instruction. Returns the first match.
function findDurationPhrase(text: string): { phrase: string; seconds: number } | null {
  const patterns = [
    /(\d+\s*to\s*\d+\s*(?:hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s))/i,
    /(\d+\s*-\s*\d+\s*(?:hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s))/i,
    /(\d+\s*(?:hours?|hrs?|h)\s+\d+\s*(?:minutes?|mins?|m))/i,
    /(\d+\s*(?:hours?|hrs?|h))/i,
    /(\d+\s*(?:minutes?|mins?|m))/i,
    /(\d+\s*(?:seconds?|secs?|s))/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const phrase = m[1]
      const seconds = parseDuration(phrase)
      if (seconds !== null && seconds > 0) return { phrase, seconds }
    }
  }
  return null
}

export function CookingTimerController() {
  const [state, setState] = useState<CookingTimerState>(INITIAL)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for custom events emitted by step "Start timer" buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { label: string; seconds: number }
      setState({
        open: true,
        label: detail.label,
        durationSec: detail.seconds,
        remainingSec: detail.seconds,
        running: true,
      })
    }
    window.addEventListener('chefmate:start-timer', handler as EventListener)
    return () => window.removeEventListener('chefmate:start-timer', handler as EventListener)
  }, [])

  // Tick
  useEffect(() => {
    if (!state.running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.remainingSec <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          // Browser notification (if permitted)
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('ChefMate timer finished', { body: prev.label })
            }
          } catch {}
          return { ...prev, running: false, remainingSec: 0 }
        }
        return { ...prev, remainingSec: prev.remainingSec - 1 }
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.running])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={state.open} onOpenChange={(open) => { if (!open) setState(INITIAL) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5" /> Cooking timer
          </DialogTitle>
          <DialogDescription>{state.label || 'Your step timer is running.'}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="font-mono text-5xl font-bold tabular-nums" aria-live="polite">{format(state.remainingSec)}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={state.running ? 'Pause timer' : 'Start timer'}
              onClick={() => setState(prev => ({ ...prev, running: !prev.running }))}
            >
              {state.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Reset timer"
              onClick={() => setState(prev => ({ ...prev, running: false, remainingSec: prev.durationSec }))}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Original duration: {format(state.durationSec)}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface RecipeStepItemProps {
  stepNumber: number
  instruction: string
  durationMin?: number | null
}

export function RecipeStepItem({ stepNumber, instruction, durationMin }: RecipeStepItemProps) {
  const phrase = findDurationPhrase(instruction)
  const seconds = phrase?.seconds ?? (durationMin ? durationMin * 60 : null)

  const startTimer = () => {
    if (!seconds) return
    window.dispatchEvent(new CustomEvent('chefmate:start-timer', {
      detail: { label: `Step ${stepNumber}`, seconds }
    }))
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } catch {}
  }

  return (
    <li className="flex gap-4">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
        {stepNumber}
      </span>
      <div className="flex-1">
        <p className="text-sm text-foreground">{instruction}</p>
        {seconds && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={startTimer}
          >
            <TimerIcon className="mr-2 h-4 w-4" />
            Start {Math.floor(seconds / 60) > 0 ? `${Math.floor(seconds / 60)}m` : ''} {seconds % 60 > 0 ? `${seconds % 60}s` : ''} timer
          </Button>
        )}
      </div>
    </li>
  )
}
