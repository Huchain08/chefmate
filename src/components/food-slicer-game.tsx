'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type EntityKind = 'fruit' | 'vegetable' | 'sandwich' | 'dish' | 'bomb'
interface Entity {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vrot: number
  kind: EntityKind
  label: string
  color: string
  sliced: boolean
  emoji?: string
  r: number
}

const KIND_LABELS: Record<EntityKind, string[]> = {
  fruit: ['Apple', 'Banana', 'Orange', 'Strawberry', 'Mango', 'Watermelon', 'Pineapple', 'Grapes'],
  vegetable: ['Tomato', 'Carrot', 'Onion', 'Cucumber', 'Pepper', 'Potato', 'Spinach', 'Broccoli'],
  sandwich: ['Sandwich', 'Burger', 'Wrap', 'Panini', 'Taco'],
  dish: ['Pizza', 'Pasta', 'Biryani', 'Dosa', 'Noodles', 'Pancake'],
  bomb: ['Bomb'],
}

const KIND_COLORS: Record<EntityKind, string> = {
  fruit: '#dc2626',
  vegetable: '#16a34a',
  sandwich: '#ca8a04',
  dish: '#ea580c',
  bomb: '#1f2937',
}

function pickKind(): EntityKind {
  const r = Math.random()
  if (r < 0.07) return 'bomb'
  if (r < 0.35) return 'fruit'
  if (r < 0.6) return 'vegetable'
  if (r < 0.8) return 'sandwich'
  return 'dish'
}

function pickLabel(kind: EntityKind): string {
  const arr = KIND_LABELS[kind]
  return arr[Math.floor(Math.random() * arr.length)]
}

export function FoodSlicerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const stateRef = useRef<{ entities: Entity[]; cursor: { x: number; y: number; trail: { x: number; y: number }[] } }>({
    entities: [],
    cursor: { x: -1, y: -1, trail: [] },
  })
  const nextId = useRef(1)
  const lastSpawn = useRef(0)
  const lastFrame = useRef(0)

  // Load high score from localStorage
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('chefmate.game.highScore') || '0')
      if (Number.isFinite(v) && v > 0) {
        setHighScore(prev => prev > v ? prev : v)
      }
    } catch {}
  }, [])

  const start = useCallback(() => {
    setScore(0)
    setLives(3)
    setTimeLeft(60)
    stateRef.current.entities = []
    stateRef.current.cursor.trail = []
    setRunning(true)
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    setScore(s => {
      if (s > highScore) {
        setHighScore(s)
        try { localStorage.setItem('chefmate.game.highScore', String(s)) } catch {}
      }
      return s
    })
  }, [highScore])

  // Pointer tracking
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)
      stateRef.current.cursor.x = x
      stateRef.current.cursor.y = y
      stateRef.current.cursor.trail.push({ x, y })
      if (stateRef.current.cursor.trail.length > 12) stateRef.current.cursor.trail.shift()
    }
    const handleLeave = () => {
      stateRef.current.cursor.x = -1
      stateRef.current.cursor.y = -1
      stateRef.current.cursor.trail = []
    }
    canvas.addEventListener('pointermove', handleMove)
    canvas.addEventListener('pointerleave', handleLeave)
    return () => {
      canvas.removeEventListener('pointermove', handleMove)
      canvas.removeEventListener('pointerleave', handleLeave)
    }
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0

    const spawn = () => {
      const w = canvas.width
      const h = canvas.height
      const kind = pickKind()
      const label = pickLabel(kind)
      const x = 60 + Math.random() * (w - 120)
      const vy = -(520 + Math.random() * 200)
      const vx = (Math.random() - 0.5) * 120
      stateRef.current.entities.push({
        id: nextId.current++,
        x, y: h + 20,
        vx, vy,
        rotation: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 4,
        kind,
        label,
        color: KIND_COLORS[kind],
        sliced: false,
        r: 36,
      })
    }

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastFrame.current) / 1000)
      lastFrame.current = t
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f1f1d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (running) {
        if (t - lastSpawn.current > 700) {
          lastSpawn.current = t
          spawn()
          if (Math.random() < 0.3) spawn()
        }

        const gravity = 900
        const next: Entity[] = []
        for (const e of stateRef.current.entities) {
          if (e.sliced) continue
          e.x += e.vx * dt
          e.y += e.vy * dt
          e.vy += gravity * dt
          e.rotation += e.vrot * dt
          // Cursor collision: check if cursor is near
          const c = stateRef.current.cursor
          if (c.x >= 0 && c.y >= 0) {
            const d2 = (e.x - c.x) ** 2 + (e.y - c.y) ** 2
            if (d2 < (e.r + 6) ** 2) {
              e.sliced = true
              if (e.kind === 'bomb') {
                setLives(l => {
                  const nl = l - 1
                  if (nl <= 0) stop()
                  return Math.max(0, nl)
                })
              } else {
                setScore(s => s + (e.kind === 'dish' ? 3 : e.kind === 'sandwich' ? 2 : 1))
              }
              continue
            }
          }
          if (e.y > canvas.height + 60) {
            // Missed
            if (e.kind !== 'bomb') {
              setLives(l => {
                const nl = l - 1
                if (nl <= 0) stop()
                return Math.max(0, nl)
              })
            }
            continue
          }
          next.push(e)
        }
        stateRef.current.entities = next
      }

      // Draw entities
      for (const e of stateRef.current.entities) {
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.rotate(e.rotation)
        ctx.beginPath()
        if (e.kind === 'bomb') {
          ctx.arc(0, 0, e.r, 0, Math.PI * 2)
          ctx.fillStyle = '#1f2937'
          ctx.fill()
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.fillStyle = '#fbbf24'
          ctx.beginPath()
          ctx.arc(0, -e.r + 4, 4, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const gradient = ctx.createRadialGradient(-e.r * 0.35, -e.r * 0.45, e.r * 0.12, 0, 0, e.r * 1.15)
          gradient.addColorStop(0, '#fff7e9')
          gradient.addColorStop(0.14, e.color)
          gradient.addColorStop(1, '#163b35')
          ctx.arc(0, 0, e.r, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.lineWidth = 2
          ctx.stroke()
          // Hand-drawn texture: seeds, grill marks, and herb flecks keep the food from reading as a flat circle.
          ctx.save()
          ctx.clip()
          for (let i = 0; i < 9; i++) {
            const angle = (i * 2.4 + e.id) % (Math.PI * 2)
            const radius = e.r * (0.25 + ((i * 13) % 7) / 14)
            ctx.fillStyle = i % 2 ? 'rgba(255,247,233,.48)' : 'rgba(22,59,53,.38)'
            ctx.beginPath()
            ctx.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius, 2.3, 1.1, angle, 0, Math.PI * 2)
            ctx.fill()
          }
          if (e.kind === 'sandwich' || e.kind === 'dish') {
            ctx.strokeStyle = 'rgba(255,247,233,.46)'
            ctx.lineWidth = 3
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath()
              ctx.moveTo(-e.r * 0.7, i * 12)
              ctx.lineTo(e.r * 0.7, i * 12 + 7)
              ctx.stroke()
            }
          }
          if (e.kind === 'fruit') {
            ctx.strokeStyle = 'rgba(255,247,233,.55)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(-e.r * .16, -e.r * .1, e.r * .5, .3, 2.1)
            ctx.stroke()
          }
          if (e.kind === 'vegetable') {
            ctx.fillStyle = 'rgba(255,247,233,.55)'
            for (let i = 0; i < 5; i++) {
              ctx.beginPath()
              ctx.arc(-e.r * .45 + i * e.r * .2, -e.r * .25 + (i % 2) * e.r * .35, 2.8, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.restore()
        }
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(e.label, 0, 0, e.r * 1.8)
        ctx.restore()
      }

      // Draw cursor trail
      const c = stateRef.current.cursor
      if (c.trail.length > 1) {
        ctx.beginPath()
        ctx.moveTo(c.trail[0].x, c.trail[0].y)
        for (let i = 1; i < c.trail.length; i++) ctx.lineTo(c.trail[i].x, c.trail[i].y)
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, stop])

  // Timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { stop(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, stop])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Chef Slice</span>
          <span className="text-xs text-muted-foreground">Best: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span>Score: <strong>{score}</strong></span>
          <span>Lives: <strong>{lives}</strong></span>
          <span>Time: <strong>{timeLeft}s</strong></span>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          className="w-full rounded-md border border-border touch-none"
          aria-label="Chef Slice game canvas"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {!running ? (
            <Button onClick={start}>Start game</Button>
          ) : (
            <Button variant="outline" onClick={stop}>End game</Button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Move your cursor or finger across the falling food to slice it. Bombs cost a life. Missing food also costs a life.
        </p>
      </CardContent>
    </Card>
  )
}
