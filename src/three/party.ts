import * as THREE from 'three'
import type { Quality } from './scene'

const MAT = {
  woodLight: new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.9 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 }),
  barrel: new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 }),
  barrelTop: new THREE.MeshStandardMaterial({ color: 0x7a5634, roughness: 0.85 }),
  cabinet: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 }),
  woofer: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 }),
  cone: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }),
  truss: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xc99a6a, roughness: 0.8 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.9 }),
  shirt2: new THREE.MeshStandardMaterial({ color: 0x5a2a3a, roughness: 0.9 }),
  shirt3: new THREE.MeshStandardMaterial({ color: 0x3a5a2a, roughness: 0.9 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 }),
  board: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }),
  pole: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.2 }),
}

const PARTY_COLORS = [0xff3b3b, 0x3b7bff, 0x3bff7b, 0xff3bd0, 0xffd23b, 0x9b3bff]
const FLAG_COLORS = [0xff3b3b, 0x3b7bff, 0xffd23b, 0x3bff7b, 0xff3bd0, 0x9b3bff]

function makeOpenBarSign(group: THREE.Group): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 160
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, 512, 160)
  ctx.fillStyle = '#f2b14e'
  ctx.font = 'bold 96px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('OPEN BAR', 256, 80)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xf2b14e,
    emissiveMap: tex,
    emissiveIntensity: 1.6,
    roughness: 0.5,
  })
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), mat)
  sign.position.set(0, 3.6, 5.0)
  group.add(sign)
  return sign
}

function makeCocktailList(group: THREE.Group): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1a1a14'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#3a2418'
  ctx.lineWidth = 8
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#f2b14e'
  ctx.font = 'bold 28px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('COCKTAIL', 128, 42)
  ctx.font = '20px Georgia, serif'
  ctx.fillStyle = '#e8d8b0'
  const lines = ['Spritz', 'Gin Tonic', 'Mojito', 'Negroni', 'Moscow Mule']
  lines.forEach((l, i) => ctx.fillText(l, 128, 86 + i * 44))
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xe8a33d,
    emissiveMap: tex,
    emissiveIntensity: 0.4,
    roughness: 0.8,
  })
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), mat)
  board.position.set(0.55, 1.18, 5.0 + 0.31)
  board.rotation.y = 0
  group.add(board)
  return board
}

function makeBar(group: THREE.Group, z: number): THREE.Mesh {
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.7), MAT.woodLight)
  top.position.set(0, 1.05, z)
  group.add(top)
  const front = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 0.06), MAT.wood)
  front.position.set(0, 0.55, z + 0.32)
  group.add(front)
  const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1)
  const legs: Array<[number, number, number]> = [
    [-1.1, 0.5, z - 0.3],
    [1.1, 0.5, z - 0.3],
    [-1.1, 0.5, z + 0.3],
    [1.1, 0.5, z + 0.3],
  ]
  for (const [x, y, zz] of legs) {
    const leg = new THREE.Mesh(legGeo, MAT.wood)
    leg.position.set(x, y, zz)
    group.add(leg)
  }
  for (const sx of [-1.85, 1.85]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.95, 14), MAT.barrel)
    barrel.position.set(sx, 0.48, z)
    group.add(barrel)
    const top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 14), MAT.barrelTop)
    top2.position.set(sx, 0.98, z)
    group.add(top2)
  }
  return top
}

function makeBartender(group: THREE.Group, x: number, z: number): {
  animate: (t: number) => void
} {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 6, 12), MAT.pants)
  hips.position.y = 0.78
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 12), MAT.shirt)
  torso.position.y = 1.28
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), MAT.skin)
  head.position.y = 1.72
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.32, 4, 8)
  const armL = new THREE.Mesh(armGeo, MAT.shirt)
  armL.position.set(-0.27, 1.28, 0)
  const armR = new THREE.Mesh(armGeo, MAT.shirt)
  armR.position.set(0.27, 1.28, 0)
  g.add(hips, torso, head, armL, armR)
  group.add(g)
  const animate = (t: number) => {
    armR.rotation.x = Math.sin(t * 3) * 0.5 - 0.2
    armL.rotation.x = Math.sin(t * 3 + Math.PI) * 0.2
    torso.rotation.y = Math.sin(t * 1.5) * 0.08
  }
  return { animate }
}

function makeSpeaker(group: THREE.Group, x: number, z: number): {
  pulse: (t: number) => void
} {
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.cabinet)
  cab.position.set(x, 0.55, z)
  group.add(cab)

  const wooferGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.04, 20)
  const woofer1 = new THREE.Mesh(wooferGeo, MAT.woofer)
  woofer1.rotation.x = Math.PI / 2
  woofer1.position.set(x, 0.85, z + 0.26)
  const woofer2 = new THREE.Mesh(wooferGeo, MAT.woofer)
  woofer2.rotation.x = Math.PI / 2
  woofer2.position.set(x, 0.4, z + 0.26)
  group.add(woofer1, woofer2)

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.05, 20), MAT.cone)
  cone.rotation.x = -Math.PI / 2
  cone.position.set(x, 0.85, z + 0.28)
  const cone2 = cone.clone()
  cone2.position.set(x, 0.4, z + 0.28)
  group.add(cone, cone2)

  const pulse = (t: number) => {
    const s = 1 + Math.sin(t * 5.5) * 0.06
    woofer1.scale.set(s, 1, s)
    woofer2.scale.set(s, 1, s)
  }
  return { pulse }
}

function makeRGBFestoons(group: THREE.Group, quality: Quality): {
  cycle: (t: number) => void
} {
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5, 6), MAT.truss)
  poleL.position.set(-3.4, 2.5, 7.0)
  const poleR = poleL.clone()
  poleR.position.set(3.4, 2.5, 7.0)
  group.add(poleL, poleR)

  const count = quality === 'high' ? 18 : 12
  const bulbGeo = new THREE.SphereGeometry(0.08, 10, 8)
  const bulbs: THREE.Mesh[] = []
  const a = new THREE.Vector3(-3.4, 4.4, 7.0)
  const b = new THREE.Vector3(3.4, 4.4, 7.0)
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = THREE.MathUtils.lerp(a.x, b.x, t)
    const z = THREE.MathUtils.lerp(a.z, b.z, t)
    const sag = Math.sin(t * Math.PI) * 0.5
    const y = THREE.MathUtils.lerp(a.y, b.y, t) - sag
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: PARTY_COLORS[i % PARTY_COLORS.length],
      emissiveIntensity: 1.6,
      roughness: 0.4,
    })
    const bulb = new THREE.Mesh(bulbGeo, mat)
    bulb.position.set(x, y, z)
    group.add(bulb)
    bulbs.push(bulb)
  }

  const cycle = (t: number) => {
    for (let i = 0; i < bulbs.length; i++) {
      const idx = (i + Math.floor(t * 2)) % PARTY_COLORS.length
      const c = PARTY_COLORS[idx]
      const m = bulbs[i].material as THREE.MeshStandardMaterial
      m.emissive.setHex(c)
      m.emissiveIntensity = 1.4 + Math.sin(t * 3 + i * 0.6) * 0.4
    }
  }
  return { cycle }
}

function makeBunting(group: THREE.Group): {
  sway: (t: number) => void
} {
  const a = new THREE.Vector3(-3.4, 4.7, 6.6)
  const b = new THREE.Vector3(3.4, 4.7, 6.6)
  const count = 22
  const flags: THREE.Mesh[] = []
  const flagGeo = new THREE.PlaneGeometry(0.26, 0.34)
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = THREE.MathUtils.lerp(a.x, b.x, t)
    const z = THREE.MathUtils.lerp(a.z, b.z, t)
    const sag = Math.sin(t * Math.PI) * 0.35
    const y = THREE.MathUtils.lerp(a.y, b.y, t) - sag
    const mat = new THREE.MeshStandardMaterial({
      color: FLAG_COLORS[i % FLAG_COLORS.length],
      side: THREE.DoubleSide,
      roughness: 0.9,
    })
    const flag = new THREE.Mesh(flagGeo, mat)
    flag.position.set(x, y - 0.17, z)
    group.add(flag)
    flags.push(flag)
  }
  const sway = (t: number) => {
    for (let i = 0; i < flags.length; i++) {
      flags[i].rotation.y = Math.sin(t * 1.2 + i * 0.5) * 0.25
      flags[i].rotation.x = Math.sin(t * 1.5 + i * 0.4) * 0.1
    }
  }
  return { sway }
}

function makeDancer(group: THREE.Group, x: number, z: number, shirtMat: THREE.Material): {
  dance: (t: number, i: number) => void
} {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 6, 12), MAT.pants)
  hips.position.y = 0.74
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 6, 12), shirtMat)
  torso.position.y = 1.22
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), MAT.skin)
  head.position.y = 1.62
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.3, 4, 8)
  const armL = new THREE.Mesh(armGeo, shirtMat)
  armL.position.set(-0.25, 1.32, 0)
  const armR = new THREE.Mesh(armGeo, shirtMat)
  armR.position.set(0.25, 1.32, 0)
  g.add(hips, torso, head, armL, armR)
  group.add(g)
  const dance = (t: number, i: number) => {
    const phase = t * 4 + i * 1.3
    g.position.y = Math.abs(Math.sin(phase)) * 0.12
    torso.rotation.y = Math.sin(phase * 0.5) * 0.3
    armL.rotation.z = 0.5 + Math.sin(phase) * 0.4
    armR.rotation.z = -0.5 - Math.sin(phase) * 0.4
    head.rotation.y = Math.sin(phase * 0.5) * 0.25
  }
  return { dance }
}

const DRINK = new THREE.MeshStandardMaterial({
  color: 0xe8842a,
  emissive: 0xe8842a,
  emissiveIntensity: 0.5,
  roughness: 0.3,
  transparent: true,
  opacity: 0.85,
})
const GLASS = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.1,
  transparent: true,
  opacity: 0.35,
})

function makeDrinker(group: THREE.Group, x: number, z: number, shirtMat: THREE.Material): {
  drink: (t: number, i: number) => void
} {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 6, 12), MAT.pants)
  hips.position.y = 0.74
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 6, 12), shirtMat)
  torso.position.y = 1.22
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), MAT.skin)
  head.position.y = 1.62
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.3, 4, 8)
  const armL = new THREE.Mesh(armGeo, shirtMat)
  armL.position.set(-0.25, 1.32, 0)
  // Drinking arm (raised)
  const armR = new THREE.Mesh(armGeo, shirtMat)
  armR.position.set(0.25, 1.32, 0)
  // Glass + drink
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.16, 10), GLASS)
  glass.position.set(0, 0.1, 0)
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 10), DRINK)
  liquid.position.set(0, 0.12, 0)
  const hand = new THREE.Group()
  hand.position.set(0.3, 1.5, 0.1)
  hand.add(glass, liquid)
  g.add(hips, torso, head, armL, armR, hand)
  group.add(g)
  const drink = (t: number, i: number) => {
    const phase = t * 1.5 + i * 0.9
    // Raise/lower the drinking arm
    armR.rotation.x = -1.2 + Math.sin(phase) * 0.35
    armR.rotation.z = -0.3
    hand.position.set(0.3, 1.5 + Math.sin(phase) * 0.15, 0.1 + Math.sin(phase) * 0.1)
    // Slight body sway while chatting
    torso.rotation.y = Math.sin(phase * 0.6) * 0.12
    head.rotation.y = Math.sin(phase * 0.4) * 0.15
  }
  return { drink }
}

function makeDiscoLight(group: THREE.Group): {
  update: (t: number) => void
} {
  const POLE_TOP_Y = 5.0
  const POLE_X = 3.4
  const FLOOR_Z = 7.0
  const SAG = 0.5
  const WIRE_Y = POLE_TOP_Y - SAG
  const FIX_Y = WIRE_Y - 0.5

  // Horizontal wire between the two pole tops, with a sag
  const wireSpan = POLE_X * 2
  const wireLen = wireSpan * 1.12
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, wireLen, 6),
    MAT.truss,
  )
  wire.position.set(0, POLE_TOP_Y - SAG / 2, FLOOR_Z)
  wire.rotation.z = Math.PI / 2
  group.add(wire)

  // Small hook ring at the wire's lowest point
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), MAT.truss)
  hook.position.set(0, WIRE_Y - 0.06, FLOOR_Z)
  hook.rotation.x = Math.PI / 2
  group.add(hook)

  // Short drop wire from hook to fixture
  const drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, WIRE_Y - FIX_Y, 6),
    MAT.truss,
  )
  drop.position.set(0, (WIRE_Y + FIX_Y) / 2, FLOOR_Z)
  group.add(drop)

  // Fixture body (cylinder pointing down)
  const fixture = new THREE.Group()
  fixture.position.set(0, FIX_Y, FLOOR_Z)
  group.add(fixture)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.34, 12),
    MAT.cabinet,
  )
  body.position.y = 0.17
  fixture.add(body)
  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xff3b3b,
      emissiveIntensity: 2.5,
      roughness: 0.3,
    }),
  )
  lens.rotation.x = Math.PI
  lens.position.y = 0
  fixture.add(lens)

  // Two colored spotlights projecting onto the ground (rotating)
  const target1 = new THREE.Object3D()
  target1.position.set(0, 0, FLOOR_Z)
  group.add(target1)
  const spot1 = new THREE.SpotLight(0xff3b3b, 8, 14, 0.5, 0.45, 1.2)
  spot1.position.set(0, FIX_Y, FLOOR_Z)
  spot1.target = target1
  group.add(spot1)

  const target2 = new THREE.Object3D()
  target2.position.set(0, 0, FLOOR_Z)
  group.add(target2)
  const spot2 = new THREE.SpotLight(0x3b7bff, 8, 14, 0.5, 0.45, 1.2)
  spot2.position.set(0, FIX_Y, FLOOR_Z)
  spot2.target = target2
  group.add(spot2)

  const color1 = new THREE.Color()
  const color2 = new THREE.Color()

  const update = (t: number) => {
    fixture.rotation.y = t * 0.8
    // Two beams rotating in opposite directions across the floor
    const a1 = t * 0.7
    const a2 = -t * 0.6 + Math.PI
    target1.position.set(Math.cos(a1) * 3.2, 0, FLOOR_Z + Math.sin(a1) * 2.2)
    target2.position.set(Math.cos(a2) * 3.2, 0, FLOOR_Z + Math.sin(a2) * 2.2)

    const h1 = (t * 0.08) % 1
    const h2 = (t * 0.08 + 0.5) % 1
    color1.setHSL(h1, 0.9, 0.55)
    color2.setHSL(h2, 0.9, 0.55)
    spot1.color.copy(color1)
    spot2.color.copy(color2)
    ;(lens.material as THREE.MeshStandardMaterial).emissive.copy(color1)
    const pulse = 1 + Math.sin(t * 2.2) * 0.25
    spot1.intensity = 8 * pulse
    spot2.intensity = 8 * (2 - pulse)
    ;(lens.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + Math.sin(t * 2.2) * 0.5
  }
  return { update }
}

export function createParty(scene: THREE.Scene, quality: Quality): {
  update: (dt: number, elapsed: number) => void
} {
  const group = new THREE.Group()
  scene.add(group)

  const barZ = 5.0
  const barTop = makeBar(group, barZ)
  void barTop

  const bartender = makeBartender(group, 0, barZ - 0.4)
  const sign = makeOpenBarSign(group)
  void sign
  const list = makeCocktailList(group)
  void list

  // Sign poles
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 6), MAT.pole)
  poleL.position.set(-1.4, 1.7, barZ)
  const poleR = poleL.clone()
  poleR.position.set(1.4, 1.7, barZ)
  group.add(poleL, poleR)

  const speakerL = makeSpeaker(group, -2.6, 7.6)
  const speakerR = makeSpeaker(group, 2.6, 7.6)

  const festoons = makeRGBFestoons(group, quality)
  const bunting = makeBunting(group)
  const disco = makeDiscoLight(group)

  // 5 dancers on the dance floor (in front of the bar, +Z)
  const dancerPositions: Array<[number, number, THREE.Material]> = [
    [-1.5, 7.0, MAT.shirt],
    [1.5, 7.0, MAT.shirt2],
    [0, 8.0, MAT.shirt3],
    [-2.2, 8.4, MAT.shirt2],
    [2.2, 8.4, MAT.shirt],
  ]
  const dancers = dancerPositions.map(([x, z, m]) => makeDancer(group, x, z, m))

  // 3 drinkers near the bar / edge of the dance floor (customer side, +Z)
  const drinkerPositions: Array<[number, number, THREE.Material]> = [
    [-3.2, 6.2, MAT.shirt3],
    [3.2, 6.2, MAT.shirt],
    [-3.6, 7.8, MAT.shirt2],
  ]
  const drinkers = drinkerPositions.map(([x, z, m]) => makeDrinker(group, x, z, m))

  // Warm fill light over the bar + dance area
  const fill = new THREE.PointLight(0xe8a33d, 1.4, 10, 1.6)
  fill.position.set(0, 1.6, 5.8)
  group.add(fill)
  const danceFill = new THREE.PointLight(0xe8a33d, 0.8, 9, 1.6)
  danceFill.position.set(0, 2.2, 7.4)
  group.add(danceFill)

  const update = (_dt: number, elapsed: number) => {
    festoons.cycle(elapsed)
    bunting.sway(elapsed)
    disco.update(elapsed)
    speakerL.pulse(elapsed)
    speakerR.pulse(elapsed)
    bartender.animate(elapsed)
    for (let i = 0; i < dancers.length; i++) dancers[i].dance(elapsed, i)
    for (let i = 0; i < drinkers.length; i++) drinkers[i].drink(elapsed, i)
  }
  return { update }
}
