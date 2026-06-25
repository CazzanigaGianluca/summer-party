import * as THREE from 'three'
import type { Quality } from './scene'

const MAT = {
  wall: new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.92, metalness: 0 }),
  wallDark: new THREE.MeshStandardMaterial({ color: 0xa89678, roughness: 0.92 }),
  roof: new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.82, metalness: 0 }),
  roofDark: new THREE.MeshStandardMaterial({ color: 0x8f4f18, roughness: 0.82 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6b6258, roughness: 1, metalness: 0 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.9 }),
  window: new THREE.MeshStandardMaterial({
    color: 0x1a1208,
    emissive: 0xf2b14e,
    emissiveIntensity: 1.6,
    roughness: 0.5,
  }),
  lantern: new THREE.MeshStandardMaterial({
    color: 0x140d05,
    emissive: 0xe8a33d,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  }),
  bulb: new THREE.MeshStandardMaterial({
    color: 0x140d05,
    emissive: 0xf2b14e,
    emissiveIntensity: 1.9,
    roughness: 0.3,
  }),
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = false
  m.receiveShadow = false
  return m
}

function addFestoons(group: THREE.Group, quality: Quality): void {
  const poleL = new THREE.Group()
  const poleR = new THREE.Group()
  const poleMat = MAT.woodLight
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 6), poleMat)
  left.position.set(-4.2, 1.5, 4.6)
  const right = left.clone()
  right.position.set(4.2, 1.5, 4.6)
  poleL.add(left)
  poleR.add(right)
  group.add(poleL, poleR)

  const a = new THREE.Vector3(-4.2, 3, 4.6)
  const b = new THREE.Vector3(4.2, 3, 4.6)
  const count = quality === 'high' ? 16 : 10
  const bulbGeo = new THREE.SphereGeometry(0.07, 8, 6)
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = THREE.MathUtils.lerp(a.x, b.x, t)
    const z = THREE.MathUtils.lerp(a.z, b.z, t)
    const sag = Math.sin(t * Math.PI) * 0.55
    const y = THREE.MathUtils.lerp(a.y, b.y, t) - sag
    const bulb = new THREE.Mesh(bulbGeo, MAT.bulb)
    bulb.position.set(x, y, z)
    group.add(bulb)
  }
}

function addLantern(group: THREE.Group, x: number, z: number): THREE.PointLight {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 6), MAT.woodLight)
  post.position.set(x, 0.9, z)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), MAT.lantern)
  head.position.set(x, 1.95, z)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 8), MAT.roofDark)
  cap.position.set(x, 2.18, z)
  group.add(post, head, cap)

  const light = new THREE.PointLight(0xe8a33d, 1.6, 9, 1.6)
  light.position.set(x, 1.95, z)
  group.add(light)
  return light
}

export function createCascinotto(scene: THREE.Scene, quality: Quality): THREE.Group {
  const group = new THREE.Group()
  scene.add(group)

  const W = 6
  const H = 3
  const D = 4.6
  const baseY = 0.4

  // Foundation
  group.add(box(W + 0.5, 0.4, D + 0.5, MAT.stone, 0, 0.2, 0))

  // Main body
  group.add(box(W, H, D, MAT.wall, 0, baseY + H / 2, 0))

  // Lean-to side stall
  const stallW = 2.4
  group.add(box(stallW, 2.1, D - 0.4, MAT.wallDark, W / 2 + stallW / 2 - 0.1, baseY + 1.05, 0))
  const stallRoof = box(stallW + 0.3, 0.14, D, MAT.roofDark, W / 2 + stallW / 2 - 0.1, baseY + 2.25, 0)
  stallRoof.rotation.z = -0.12
  group.add(stallRoof)

  // Gable roof (hip pyramid)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 2.3, 4), MAT.roof)
  roof.scale.set(4.95, 1, 3.95)
  roof.rotation.y = Math.PI / 4
  roof.position.set(0, baseY + H + 1.15, 0)
  group.add(roof)

  // Chimney
  group.add(box(0.6, 1.4, 0.6, MAT.stone, 1.7, baseY + H + 0.5, -0.9))

  // Door
  group.add(box(1.0, 1.9, 0.12, MAT.wood, 0, baseY + 0.95, D / 2 + 0.02))

  // Front windows
  const winZ = D / 2 + 0.02
  group.add(box(0.8, 0.8, 0.12, MAT.window, -1.7, baseY + 1.7, winZ))
  group.add(box(0.8, 0.8, 0.12, MAT.window, 1.7, baseY + 1.7, winZ))

  // Side windows (stall)
  group.add(box(0.7, 0.7, 0.12, MAT.window, W / 2 + stallW - 0.05, baseY + 1.4, 0, ))
  const sideWin = box(0.12, 0.7, 0.7, MAT.window, W / 2 + stallW + 0.05, baseY + 1.4, 0)
  sideWin.rotation.y = Math.PI / 2
  group.add(sideWin)

  // Festoons + lanterns
  addFestoons(group, quality)
  addLantern(group, -2.6, 4.6)
  addLantern(group, 2.6, 4.6)

  // Interior + porch warm lights
  const interior = new THREE.PointLight(0xe8a33d, quality === 'high' ? 2.6 : 1.8, 11, 1.8)
  interior.position.set(0, baseY + 1.8, 0)
  group.add(interior)

  const porchLight = new THREE.PointLight(0xf2b14e, quality === 'high' ? 1.8 : 1.2, 8, 1.8)
  porchLight.position.set(0, baseY + 2.2, D / 2 + 0.3)
  group.add(porchLight)

  return group
}
