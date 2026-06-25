import './style.css'
import { createScene } from './three/scene'
import { createEnvironment } from './three/environment'
import { createCascinotto } from './three/cascinotto'
import { createParty } from './three/party'
import { createFireworks } from './three/fireworks'
import { initScroll } from './three/scroll'
import { initCountdown } from './ui/countdown'
import { initReveal } from './ui/reveal'

function initNav(): void {
  const toggle = document.getElementById('nav-toggle')
  const links = document.querySelector<HTMLElement>('.nav-links')
  if (!toggle || !links) return
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open')
    toggle.setAttribute('aria-expanded', String(open))
  })
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open')
      toggle.setAttribute('aria-expanded', 'false')
    }),
  )
}

function init(): void {
  initCountdown()
  initReveal()
  initNav()

  const reducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches
  if (reducedData) return

  const ctx = createScene()
  if (!ctx) return

  createEnvironment(ctx.scene, ctx.quality)
  createCascinotto(ctx.scene, ctx.quality)
  const party = createParty(ctx.scene, ctx.quality)
  ctx.addTick(party.update)
  const fireworks = createFireworks(ctx.scene, ctx.quality, ctx)
  ctx.addTick(fireworks.update)

  initScroll(ctx)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
