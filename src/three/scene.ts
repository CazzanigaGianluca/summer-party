import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export type Quality = 'high' | 'low'

export interface CameraRig {
  azimuth: number
  polar: number
  radius: number
  targetY: number
  scrollProgress: number
  dragging: boolean
  update: (dt: number) => void
}

export interface SceneCtx {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  rig: CameraRig
  quality: Quality
  reducedMotion: boolean
  addTick: (fn: (dt: number, elapsed: number) => void) => void
  setScrollProgress: (p: number) => void
}

const NO_DRAG_SELECTOR =
  'a, button, input, textarea, select, .card, .note, .nav, .nav-links, .countdown, .scroll-cue, .tl-item, .footer, .section-head'

function makeSkyTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#0a1a4a')
  g.addColorStop(0.5, '#1f3f7a')
  g.addColorStop(1, '#3a66a8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 16, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function detectQuality(): Quality {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  const lowMem = typeof dm === 'number' && dm <= 4
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
  if (isMobile || lowMem || lowCores) return 'low'
  return 'high'
}

export function createScene(): SceneCtx | null {
  const canvas = document.getElementById('scene') as HTMLCanvasElement | null
  if (!canvas) return null

  const quality = detectQuality()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality === 'high',
    alpha: false,
    powerPreference: 'high-performance',
  })
  const dprCap = quality === 'high' ? 2 : 1.5
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.background = makeSkyTexture()
  scene.fog = new THREE.FogExp2(0x1f3f7a, quality === 'high' ? 0.007 : 0.011)

  const camera = new THREE.PerspectiveCamera(
    quality === 'low' ? 66 : 56,
    window.innerWidth / window.innerHeight,
    0.1,
    400,
  )

  const ticks: Array<(dt: number, elapsed: number) => void> = []
  const addTick = (fn: (dt: number, elapsed: number) => void) => ticks.push(fn)

  // ---- Lights ----
  const hemi = new THREE.HemisphereLight(0x2a3a5a, 0x0a0a06, 0.45)
  scene.add(hemi)

  const moon = new THREE.DirectionalLight(0x9bb0d8, 0.45)
  moon.position.set(-9, 16, -7)
  scene.add(moon)

  const ambient = new THREE.AmbientLight(0x1a2030, 0.25)
  scene.add(ambient)

  // ---- Camera rig ----
  const rig: CameraRig = {
    azimuth: 0.3,
    polar: 0.95,
    radius: 16,
    targetY: 2,
    scrollProgress: 0,
    dragging: false,
    update: () => {},
  }

  let curRadius = rig.radius
  let curPolar = rig.polar
  let curTargetY = rig.targetY

  const setScrollProgress = (p: number) => {
    rig.scrollProgress = p
  }

  rig.update = (dt: number) => {
    const p = rig.scrollProgress
    const tAzimuth = THREE.MathUtils.lerp(0.3, -0.05, p)
    const tRadius = THREE.MathUtils.lerp(16, 26, p)
    const tPolar = THREE.MathUtils.lerp(0.95, 1.15, p)
    const tTargetY = THREE.MathUtils.lerp(2, 14, p)

    const k = 1 - Math.exp(-6 * dt)
    curRadius += (tRadius - curRadius) * k
    curPolar += (tPolar - curPolar) * k
    curTargetY += (tTargetY - curTargetY) * k

    if (!reducedMotion && !rig.dragging && p < 0.08) {
      rig.azimuth += 0.05 * dt
    } else {
      rig.azimuth += (tAzimuth - rig.azimuth) * k
    }

    const phi = THREE.MathUtils.clamp(curPolar, 0.25, 1.45)
    const r = Math.max(0.1, curRadius)
    const sp = Math.sin(phi)
    camera.position.set(
      r * sp * Math.sin(rig.azimuth),
      r * Math.cos(phi),
      r * sp * Math.cos(rig.azimuth),
    )
    camera.lookAt(0, curTargetY, 0)
  }

  // ---- Pointer drag (desktop only) ----
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
  let lastX = 0
  let lastY = 0

  const onPointerDown = (e: PointerEvent) => {
    if (isTouch || e.pointerType === 'touch') return
    const target = e.target as Element | null
    if (target && target.closest(NO_DRAG_SELECTOR)) return
    rig.dragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.style.cursor = 'grabbing'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!rig.dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    rig.azimuth -= dx * 0.005
    rig.polar = THREE.MathUtils.clamp(rig.polar - dy * 0.005, 0.3, 1.4)
    curPolar = rig.polar
  }
  const onPointerUp = () => {
    rig.dragging = false
    canvas.style.cursor = ''
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }
  canvas.style.cursor = isTouch ? '' : 'grab'
  canvas.addEventListener('pointerdown', onPointerDown)

  // ---- Postprocessing ----
  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const bloomStrength = quality === 'high' ? 0.7 : 0.45
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomStrength,
    0.5,
    0.75,
  )
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  // ---- Resize ----
  const onResize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
    renderer.setSize(w, h)
    composer.setSize(w, h)
    bloomPass.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  // ---- Loop ----
  const clock = new THREE.Clock()
  let rafId = 0
  let running = false

  const frame = () => {
    rafId = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const elapsed = clock.elapsedTime
    rig.update(dt)
    for (let i = 0; i < ticks.length; i++) ticks[i](dt, elapsed)
    composer.render()
  }

  const start = () => {
    if (running) return
    running = true
    clock.getDelta()
    rafId = requestAnimationFrame(frame)
  }
  const stop = () => {
    running = false
    cancelAnimationFrame(rafId)
  }

  const onVisibility = () => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  start()

  const ctx: SceneCtx = {
    scene,
    camera,
    renderer,
    rig,
    quality,
    reducedMotion,
    addTick,
    setScrollProgress,
  }
  return ctx
}
