/** Project adaptation of the beUI Bookshelf geometry and motion. @see https://beui.dev/components/motion/bookshelf */
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import clsx from 'clsx'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/types'
import css from './ProjectBookshelf.module.css'

/** A project-backed book with a typeset cover. */
export interface ProjectBook {
  id: WorkspaceId
  title: string
  author?: string | undefined
  color: string
  ink: string
  thickness: number
}

interface Props {
  books: readonly ProjectBook[]
  value: WorkspaceId | undefined
  onValueChange: (id: WorkspaceId | undefined) => void
  onOpenProject: (id: WorkspaceId) => void
  label: string
}

const HEIGHT = 350
const COVER = Math.round(HEIGHT * 0.68)
const EASE_OUT = [0.16, 1, 0.3, 1] as const
const PULL = { duration: 0.42, ease: EASE_OUT }
const TURN = { duration: 0.5, ease: EASE_OUT }
const FADE = { duration: 0.2, ease: EASE_OUT }
const INSTANT = { duration: 0 }
const LAG = 0.08
const TILT = { stiffness: 200, damping: 15, mass: 0.3 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

interface Drag {
  id: number
  x: number
  y: number
  pan: number
  active: boolean
  lastX: number
  lastTime: number
  velocity: number
}

/**
 * Show life-size spines and the selected cover, with overflow panning.
 * @param props - project books, selection, navigation, and the shelf's accessible name.
 * @returns the interactive project shelf.
 */
export function ProjectBookshelf({ books, value, onValueChange, onOpenProject, label }: Props) {
  const [closing, setClosing] = useState<WorkspaceId>()
  const [hover, setHover] = useState<WorkspaceId>()
  const reduced = useReducedMotion() ?? false
  const viewport = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const drag = useRef<Drag | null>(null)
  const swallowClick = useRef(false)
  const pan = useMotionValue(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const openIndex = books.findIndex(book => book.id === value)
  let width = 0
  const positions = books.map((book, index) => {
    if (index > 0) width += index === openIndex || index - 1 === openIndex ? 16 : 3
    const x = width
    width += index === openIndex ? COVER : book.thickness
    return x
  })
  const visibleWidth = viewportWidth || width
  const overflowing = width > visibleWidth
  const leftEnd = visibleWidth / 2 - width
  const rightEnd = -visibleWidth / 2
  const openX = positions[openIndex]
  const start = overflowing
    ? openX === undefined ? rightEnd : clamp(-openX - COVER / 2, leftEnd, rightEnd)
    : -width / 2
  const min = overflowing ? leftEnd - start : 0
  const max = overflowing ? rightEnd - start : 0

  useLayoutEffect(() => {
    const frame = viewport.current
    if (frame === null) return
    const measure = (): void => { setViewportWidth(frame.clientWidth) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => { observer.disconnect() }
  }, [])

  useEffect(() => {
    const position = clamp(pan.get(), min, max)
    if (position !== pan.get()) pan.set(position)
  }, [min, max, pan])

  useEffect(() => {
    const frame = viewport.current
    if (frame === null || !overflowing) return
    const wheel = (event: WheelEvent): void => {
      if (event.ctrlKey) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (delta === 0) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frame.clientWidth : 1
      pan.stop()
      pan.set(clamp(pan.get() - delta * unit, min, max))
      event.preventDefault()
    }
    frame.addEventListener('wheel', wheel, { passive: false })
    return () => { frame.removeEventListener('wheel', wheel) }
  }, [max, min, overflowing, pan])

  const select = (id: WorkspaceId | undefined): void => {
    if (id === value) return
    setClosing(value)
    if (pan.get() !== 0) animate(pan, 0, reduced ? INSTANT : TURN)
    onValueChange(id)
  }

  const reveal = (index: number, size: number): void => {
    const x = start + (positions[index] ?? 0) + pan.get()
    const padding = overflowing ? 28 : 0
    const near = -visibleWidth / 2 + padding
    const far = visibleWidth / 2 - padding
    const shift = x < near ? near - x : x + size > far ? far - x - size : 0
    if (shift !== 0) pan.set(clamp(pan.get() + shift, min, max))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    const index = event.target instanceof HTMLButtonElement ? buttons.current.indexOf(event.target) : -1
    if (index < 0) return
    if (event.key === 'Escape' && value !== undefined) {
      event.preventDefault()
      event.stopPropagation()
      select(undefined)
      return
    }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? books.length - 1
      : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? index + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? index - 1 : undefined
    if (next === undefined) return
    event.preventDefault()
    const target = clamp(next, 0, books.length - 1)
    buttons.current[target]?.focus({ preventScroll: true })
    if (value !== undefined) select(books[target]?.id)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    swallowClick.current = false
    if (!overflowing || event.button !== 0) return
    pan.stop()
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: pan.get(),
      active: false, lastX: event.clientX, lastTime: performance.now(), velocity: 0 }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const gesture = drag.current
    if (gesture === null || gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.x
    if (!gesture.active) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - gesture.y)) return
      gesture.active = true
      try { event.currentTarget.setPointerCapture(event.pointerId) }
      catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
    }
    const raw = gesture.pan + dx
    const bound = clamp(raw, min, max)
    pan.set(bound + (raw - bound) * 0.3)
    const now = performance.now()
    if (now > gesture.lastTime) gesture.velocity = (event.clientX - gesture.lastX) * 1000 / (now - gesture.lastTime)
    gesture.lastX = event.clientX
    gesture.lastTime = now
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    const gesture = drag.current
    if (gesture === null || gesture.id !== event.pointerId) return
    drag.current = null
    if (!gesture.active) return
    swallowClick.current = true
    const target = clamp(pan.get() + (event.type === 'pointercancel' ? 0 : gesture.velocity * 0.22), min, max)
    if (reduced) pan.set(target)
    else animate(pan, target, TURN)
  }

  return <div ref={viewport} data-project-bookshelf="" className={clsx(css.frame, overflowing && css.overflowing)}
    style={{ height: HEIGHT + 64 }}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove}
    onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
    onPointerLeave={() => { if (drag.current?.active === false) drag.current = null }}
    onClickCapture={(event) => {
      if (!swallowClick.current) return
      swallowClick.current = false
      event.preventDefault()
      event.stopPropagation()
    }}>
    <ul className={css.row} aria-label={label} onKeyDown={onKeyDown} style={{ height: HEIGHT, marginTop: -HEIGHT / 2 }}>
      {books.map((book, index) => <Book key={book.id} book={book} x={start + (positions[index] ?? 0)} pan={pan}
        open={index === openIndex} closing={book.id === closing} hovered={book.id === hover} reduced={reduced}
        rowDelay={openIndex >= 0 ? LAG : 0}
        buttonRef={(element) => { buttons.current[index] = element }}
        onFocus={() => { reveal(index, index === openIndex ? COVER : book.thickness) }}
        onToggle={() => { select(index === openIndex ? undefined : book.id) }}
        onOpen={() => { onOpenProject(book.id) }}
        onHover={(active) => { setHover(previous => active ? book.id : previous === book.id ? undefined : previous) }}
        onSettled={() => { setClosing(previous => previous === book.id ? undefined : previous) }} />)}
    </ul>
  </div>
}

interface BookProps {
  book: ProjectBook
  x: number
  pan: MotionValue<number>
  open: boolean
  closing: boolean
  hovered: boolean
  reduced: boolean
  rowDelay: number
  buttonRef: (element: HTMLButtonElement | null) => void
  onFocus: () => void
  onToggle: () => void
  onOpen: () => void
  onHover: (active: boolean) => void
  onSettled: () => void
}

function Book({ book, x, pan, open, closing, hovered, reduced, rowDelay,
  buttonRef, onFocus, onToggle, onOpen, onHover, onSettled }: BookProps) {
  const { thickness } = book
  const turned = open && !reduced
  const lifted = hovered && !open && !reduced
  const turn = (COVER - thickness) / 2
  const angle = useMotionValue(turned ? -90 : 0)
  const coverShade = useTransform(angle, [-90, 0], [0, 0.5])
  const spineShade = useTransform(angle, [-90, 0], [0.5, 0])
  const front = useTransform(angle, value => value < -45 ? 3 : 1)
  const back = useTransform(angle, value => value < -45 ? 2 : 1)
  const zIndex = reduced ? open ? 3 : 1 : open ? front : closing ? back : 1
  const tiltX = useSpring(0, TILT)
  const tiltY = useSpring(0, TILT)
  const resetTilt = (): void => { tiltX.set(0); tiltY.set(0) }
  useEffect(() => {
    if (turned) return
    tiltX.set(0)
    tiltY.set(0)
  }, [tiltX, tiltY, turned])
  const size = { width: thickness, height: HEIGHT }
  const cloth = { backgroundColor: book.color, color: book.ink }

  return <motion.li className={css.book} style={{ ...size, zIndex }} initial={false} animate={{ x }}
    transition={reduced ? INSTANT : { ...TURN, delay: rowDelay }}>
    <motion.span className={css.pan} style={{ x: pan }}>
      <span className={css.picture} aria-hidden="true">
        <motion.span className={css.faceLayer} style={{ ...size, transformOrigin: '50% 100% 0' }}
          initial={false} animate={{ y: lifted ? -8 : 0, z: turned ? 40 : lifted ? 10 : 0, rotateX: lifted ? -5 : 0 }}
          transition={reduced ? INSTANT : { ...PULL, delay: closing && !open ? LAG : 0 }}
          onAnimationComplete={() => { if (closing && !open) onSettled() }}>
          <motion.span className={css.shadow} style={{ top: HEIGHT - 10, width: COVER, z: -40 }}
            initial={false} animate={{ opacity: open ? 1 : 0, scaleX: open || reduced ? 1 : 0.6 }}
            transition={reduced ? FADE : PULL} />
          <motion.span className={css.faceLayer} style={{ ...size, rotateX: tiltX, rotateY: tiltY, transformOrigin: `${COVER / 2}px 50% 0` }}>
            <motion.span className={css.faceLayer}
              style={{ ...size, transformOrigin: `${thickness / 2}px 50% ${-COVER / 2}px` }}
              initial={false} animate={{ x: turned ? turn : 0, z: turned ? turn : 0, rotateY: turned ? -90 : 0 }}
              transition={reduced ? INSTANT : { ...TURN, delay: open ? LAG : 0 }}
              onUpdate={(latest) => {
                const rotation = Number(latest.rotateY)
                if (Number.isFinite(rotation)) angle.set(rotation)
              }}>
              <motion.span className={css.spine} style={{ ...size, ...cloth }}
                initial={false} animate={{ opacity: open && reduced ? 0 : 1 }} transition={FADE}>
                <span className={css.spineLight} />
                <span className={css.ruleTop} />
                <span className={css.ruleBottom} />
                {book.author && <span className={css.spineAuthor}>{book.author}</span>}
                <span className={css.spineTitle}>{book.title}</span>
                {!reduced && <motion.span className={css.shade} style={{ opacity: spineShade }} />}
              </motion.span>
              <motion.span className={css.cover} style={{ ...cloth, width: COVER, height: HEIGHT,
                transform: reduced ? 'none' : `translateX(${thickness}px) rotateY(90deg)` }}
              initial={false} animate={{ opacity: reduced && !open ? 0 : 1 }} transition={FADE}>
                <span className={css.coverTitle}>{book.title}</span>
                {book.author && <span className={css.coverAuthor}>{book.author}</span>}
                <span className={css.hinge} />
                {!reduced && <motion.span className={css.shade} style={{ opacity: coverShade }} />}
              </motion.span>
            </motion.span>
          </motion.span>
        </motion.span>
      </span>
      <button type="button" className={css.hit} ref={buttonRef} style={{ width: open ? COVER : thickness, height: HEIGHT }}
        aria-label={book.title} aria-pressed={open} onClick={onToggle} onDoubleClick={onOpen}
        onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) onFocus() }}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') onHover(true) }}
        onPointerLeave={() => { onHover(false); resetTilt() }}
        onPointerMove={(event) => {
          if (!turned || event.pointerType !== 'mouse') return
          const rect = event.currentTarget.getBoundingClientRect()
          tiltY.set((clamp((event.clientX - rect.x) / rect.width, 0, 1) - 0.5) * 12)
          tiltX.set((0.5 - clamp((event.clientY - rect.y) / rect.height, 0, 1)) * 12)
        }} />
    </motion.span>
  </motion.li>
}
