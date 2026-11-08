// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

describe('Vitest jsdom compatibility', () => {
  it('preserves browser Blob and File bytes through object URLs and Blob request bodies', async () => {
    const blob = new Blob(['Panoptic Super'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    try {
      expect(await (await fetch(url)).text()).toBe('Panoptic Super')
      const file = new File(['upload bytes'], 'fixture.txt', { type: 'text/plain' })
      const fileUrl = URL.createObjectURL(file)
      try {
        expect(await (await fetch(fileUrl)).text()).toBe('upload bytes')
      } finally {
        URL.revokeObjectURL(fileUrl)
      }
      const direct = new Request('https://fixture.invalid/', { method: 'POST', body: blob })
      expect(await direct.text()).toBe('Panoptic Super')
    } finally {
      URL.revokeObjectURL(url)
    }
  })

  it('provides initial ResizeObserver delivery and supports disconnecting targets', () => {
    const target = document.createElement('div')
    target.getBoundingClientRect = () => { throw new Error('the jsdom resize fallback must not measure viewport geometry') }
    const deliveries: ResizeObserverEntry[][] = []
    const observer = new ResizeObserver(entries => deliveries.push(entries))
    observer.observe(target, { box: 'border-box' })
    observer.observe(target)
    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]?.[0]).toMatchObject({ target, borderBoxSize: [{ inlineSize: 0, blockSize: 0 }] })
    observer.unobserve(target)
    observer.observe(target)
    expect(deliveries).toHaveLength(2)
    observer.disconnect()
    observer.observe(target)
    expect(deliveries).toHaveLength(3)
    observer.disconnect()
  })

  it('provides isolated browser storage instead of Node process storage', () => {
    if (process.allowedNodeEnvironmentFlags.has('--webstorage')) {
      expect(process.execArgv.filter(argument => argument === '--no-webstorage')).toHaveLength(1)
    }
    localStorage.setItem('dsh-vitest-storage-probe', 'available')

    expect(localStorage.getItem('dsh-vitest-storage-probe')).toBe('available')
    localStorage.removeItem('dsh-vitest-storage-probe')
  })
})
