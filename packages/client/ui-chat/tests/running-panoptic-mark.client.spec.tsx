// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RunningPanopticMark } from '../src/client/chat/RunningPanopticMark.tsx'

afterEach(cleanup)

it('keeps the animated brand mark decorative beside the announced status', () => {
  const view = render(<RunningPanopticMark />)
  expect(view.container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  const svg = view.container.querySelector('svg')!
  expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
  expect(svg.querySelector('ellipse')?.getAttribute('stroke')).toBe('currentColor')
  expect(svg.querySelector('path')?.getAttribute('fill')).toBe('currentColor')
  expect(view.container.querySelector('[style], img, animate')).toBeNull()
  expect(view.queryByRole('status')).toBeNull()
})
