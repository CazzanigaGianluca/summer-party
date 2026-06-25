import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SceneCtx } from './scene'

gsap.registerPlugin(ScrollTrigger)

export function initScroll(ctx: SceneCtx): void {
  if (ctx.reducedMotion) return

  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
    },
    onUpdate: () => ctx.setScrollProgress(state.p),
  })

  ScrollTrigger.refresh()
}
