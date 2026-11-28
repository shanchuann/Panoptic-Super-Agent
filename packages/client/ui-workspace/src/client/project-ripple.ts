/** Texture-based cursor refraction for the graph's vector artwork. */

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentSource = `
precision mediump float;
varying vec2 uv;
uniform sampler2D artwork;
uniform vec2 mouse;
uniform float time;
uniform float strength;
void main() {
  vec2 delta = uv - mouse;
  float d = length(delta);
  float influence = exp(-8.0 * d) * strength;
  vec2 sampleUv = uv + normalize(delta + vec2(0.0001)) * sin(55.0 * d - 5.0 * time) * 0.014 * influence;
  vec2 split = vec2(0.003 * influence, 0.0);
  vec4 color = texture2D(artwork, sampleUv);
  vec4 red = texture2D(artwork, sampleUv + split);
  vec4 blue = texture2D(artwork, sampleUv - split);
  // The graph artwork is transparent. Keep coverage from the displaced sample.
  color.r = mix(color.r, red.r, red.a);
  color.b = mix(color.b, blue.b, blue.a);
  gl_FragColor = color;
}`

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (shader === null) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
  if (gl === null) return undefined
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (program !== null && vertex !== null && fragment !== null) {
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
  }
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (program === null || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return undefined
  }
  const buffer = gl.createBuffer()
  const texture = gl.createTexture()
  const dispose = (): void => {
    gl.deleteTexture(texture)
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }
  if (buffer === null || texture === null) {
    dispose()
    return undefined
  }
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  const mouse = gl.getUniformLocation(program, 'mouse')
  const time = gl.getUniformLocation(program, 'time')
  const strength = gl.getUniformLocation(program, 'strength')
  return {
    upload(image: HTMLImageElement): boolean {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      return gl.getError() === gl.NO_ERROR
    },
    draw(x: number, y: number, elapsed: number, power: number): void {
      gl.uniform2f(mouse, x, y)
      gl.uniform1f(time, elapsed)
      gl.uniform1f(strength, power)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose,
  }
}

// The isolated SVG image has no access to CSS modules or theme variables.
const presentation = ['color', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity',
  'font-family', 'font-size', 'font-weight', 'paint-order', 'stroke-linejoin', 'vector-effect'] as const

function graphImage(svg: SVGSVGElement, width: number, height: number): Blob {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const source = svg.querySelectorAll('*')
  clone.querySelectorAll('*').forEach((node, index) => {
    const original = source.item(index)
    const style = getComputedStyle(original)
    for (const property of presentation) {
      const value = original.getAttribute(property)
      node.setAttribute(property, value?.startsWith('url(#') ? value : style.getPropertyValue(property))
    }
  })
  return new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
}

/**
 * Refract the SVG while a fine pointer is over the graph.
 * @param stage - graph viewport and pointer target.
 * @param svg - accessible SVG that remains the interaction target.
 * @param canvas - transparent canvas used only during the effect.
 * @returns cleanup for the listeners, outstanding image, and GPU resources.
 */
export function attachProjectRipple(stage: HTMLElement, svg: SVGSVGElement, canvas: HTMLCanvasElement): () => void {
  const permitted = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  let renderer: ReturnType<typeof createRenderer>
  let unavailable = false
  let frame = 0
  let prior = 0
  let elapsed = 0
  let strength = 0
  let hovered = false
  let dirty = true
  let ready = false
  let pending: string | undefined
  let x = 0.5
  let y = 0.5

  const stop = (): void => {
    cancelAnimationFrame(frame)
    frame = 0
    prior = 0
    elapsed = 0
    strength = 0
    hovered = false
    delete canvas.dataset.rippleActive
  }
  const invalidate = (): void => {
    dirty = true
    ready = false
    delete canvas.dataset.rippleActive
  }
  const capture = (): void => {
    const width = svg.clientWidth
    const height = svg.clientHeight
    if (!width || !height || pending !== undefined || renderer === undefined) return
    const dpr = Math.min(devicePixelRatio, 1.5, Math.sqrt(1_100_000 / (width * height)))
    const target = renderer
    const image = new Image()
    const url = URL.createObjectURL(graphImage(svg, Math.round(width * dpr), Math.round(height * dpr)))
    dirty = false
    pending = url
    const settle = (loaded: boolean): void => {
      URL.revokeObjectURL(url)
      if (pending !== url) return
      pending = undefined
      if (dirty || target !== renderer) return
      try {
        if (loaded && target.upload(image)) { ready = true; return }
      } catch (_error: unknown) {
        // A browser that refuses an SVG texture keeps the interactive SVG visible.
      }
      unavailable = true
      stop()
    }
    image.onload = () => { settle(true) }
    image.onerror = () => { settle(false) }
    image.src = url
  }
  const render = (now: number): void => {
    frame = 0
    if (prior !== 0 && now - prior < 15) { frame = requestAnimationFrame(render); return }
    const delta = prior === 0 ? 1 / 60 : Math.min((now - prior) / 1000, 0.05)
    prior = now
    elapsed = (elapsed + delta) % (2 * Math.PI * 16 / 5)
    strength += ((hovered ? 1 : 0) - strength) * (1 - Math.pow(0.86, delta * 60))
    if (!hovered && strength < 0.003) { stop(); return }
    renderer ??= createRenderer(canvas)
    if (renderer === undefined) { unavailable = true; stop(); return }
    if (dirty) capture()
    if (ready && renderer !== undefined) {
      renderer.draw(x, y, elapsed, strength)
      if (canvas.dataset.rippleActive === undefined) canvas.dataset.rippleActive = 'true'
    }
    frame = requestAnimationFrame(render)
  }
  const move = (event: PointerEvent): void => {
    if (!permitted.matches || document.hidden || unavailable) return
    if (event.pointerType === 'touch' || event.buttons !== 0) { stop(); return }
    const bounds = svg.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    x = (event.clientX - bounds.left) / bounds.width
    y = 1 - (event.clientY - bounds.top) / bounds.height
    hovered = true
    if (frame === 0) frame = requestAnimationFrame(render)
  }
  const leave = (): void => { hovered = false }
  const lost = (event: Event): void => {
    event.preventDefault()
    stop()
    invalidate()
    renderer = undefined
    unavailable = true
  }
  const restored = (): void => { unavailable = false }

  const geometry = new ResizeObserver(() => {
    invalidate()
    if (!stage.clientWidth || !stage.clientHeight) stop()
  })
  geometry.observe(stage)
  const changes = new MutationObserver(invalidate)
  changes.observe(svg, { attributes: true, childList: true, characterData: true, subtree: true })
  changes.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
  stage.addEventListener('pointermove', move, { passive: true })
  stage.addEventListener('pointerleave', leave)
  stage.addEventListener('pointerdown', stop)
  svg.addEventListener('transitionend', invalidate)
  document.addEventListener('visibilitychange', stop)
  permitted.addEventListener('change', stop)
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)
  return () => {
    stop()
    geometry.disconnect()
    changes.disconnect()
    stage.removeEventListener('pointermove', move)
    stage.removeEventListener('pointerleave', leave)
    stage.removeEventListener('pointerdown', stop)
    svg.removeEventListener('transitionend', invalidate)
    document.removeEventListener('visibilitychange', stop)
    permitted.removeEventListener('change', stop)
    canvas.removeEventListener('webglcontextlost', lost)
    canvas.removeEventListener('webglcontextrestored', restored)
    if (pending !== undefined) URL.revokeObjectURL(pending)
    pending = undefined
    renderer?.dispose()
  }
}
