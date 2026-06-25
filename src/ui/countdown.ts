const TARGET = new Date('2026-06-27T19:00:00+02:00').getTime()

const UNITS: Array<{ key: string; mod: number }> = [
  { key: 'days', mod: 1000 * 60 * 60 * 24 },
  { key: 'hours', mod: 1000 * 60 * 60 },
  { key: 'minutes', mod: 1000 * 60 },
  { key: 'seconds', mod: 1000 },
]

function update(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-cd]')
  if (!els.length) return

  let diff = TARGET - Date.now()
  if (diff < 0) diff = 0

  const values: Record<string, string> = {}
  let remaining = diff
  for (const u of UNITS) {
    const v = Math.floor(remaining / u.mod)
    remaining -= v * u.mod
    values[u.key] = String(v).padStart(2, '0')
  }

  els.forEach((el) => {
    const key = el.dataset.cd
    if (key && values[key] !== undefined) el.textContent = values[key]
  })
}

export function initCountdown(): void {
  update()
  window.setInterval(update, 1000)
}
