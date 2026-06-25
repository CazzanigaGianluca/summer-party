import * as THREE from 'three'
import type { Quality } from './scene'

const MAT = {
  ground: new THREE.MeshStandardMaterial({ color: 0x2a3320, roughness: 1, metalness: 0 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x8a8a82, roughness: 1, metalness: 0 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 }),
  foliage: new THREE.MeshStandardMaterial({ color: 0x324226, roughness: 1, flatShading: true }),
  foliage2: new THREE.MeshStandardMaterial({ color: 0x3e5230, roughness: 1, flatShading: true }),
  bush: new THREE.MeshStandardMaterial({ color: 0x2c3a20, roughness: 1, flatShading: true }),
  moon: new THREE.MeshStandardMaterial({
    color: 0x9bb0d8,
    emissive: 0x8fa8d0,
    emissiveIntensity: 1.8,
    roughness: 1,
  }),
}

function pseudoNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.6 +
    Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.5 + 0.7) * 0.35
  )
}

function createGround(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(140, 140, 80, 80)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const dist = Math.sqrt(x * x + z * z)
    const flatten = THREE.MathUtils.clamp((dist - 6) / 12, 0, 1)
    const h = pseudoNoise(x, z) * 1.1 * flatten
    pos.setY(i, h)
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, MAT.ground)
  mesh.position.y = -0.05
  return mesh
}

function createTree(x: number, z: number, scale: number): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.7, 6), MAT.trunk)
  trunk.position.y = 0.85
  g.add(trunk)
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2, 7), MAT.foliage)
  c1.position.y = 2.2
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.7, 7), MAT.foliage2)
  c2.position.y = 3.1
  const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.3, 7), MAT.foliage)
  c3.position.y = 3.9
  g.add(c1, c2, c3)
  g.position.set(x, 0, z)
  g.scale.setScalar(scale)
  g.rotation.y = Math.random() * Math.PI
  return g
}

function createBush(x: number, z: number, s: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), MAT.bush)
  m.position.set(x, 0.25 * s, z)
  m.scale.set(s, s * 0.7, s)
  m.rotation.y = Math.random() * Math.PI
  return m
}

function createStars(count: number): THREE.Points {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 150
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.7) // upper hemisphere
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi) + 5
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xccddff,
    size: 1.0,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  })
  return new THREE.Points(geo, mat)
}

const FOLIAGE_POT = new THREE.MeshStandardMaterial({ color: 0x3e5230, roughness: 1, flatShading: true })
const STEM = new THREE.MeshStandardMaterial({ color: 0x2a3a1c, roughness: 1 })

function createGroundPlant(x: number, z: number, s: number): THREE.Group {
  const g = new THREE.Group()
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), STEM)
  stem.position.y = 0.45
  g.add(stem)
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), FOLIAGE_POT)
  c1.position.y = 1.1
  c1.scale.set(1, 1.2, 1)
  g.add(c1)
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), FOLIAGE_POT)
  c2.position.y = 1.65
  g.add(c2)
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  g.rotation.y = Math.random() * Math.PI
  return g
}

function createBrightStars(count: number): THREE.Points {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 150
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.6)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi) + 8
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.8,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  })
  return new THREE.Points(geo, mat)
}

export function createEnvironment(scene: THREE.Scene, quality: Quality): void {
  scene.add(createGround())

  // Concrete patio in front of the cascinotto (covers bar + dance floor)
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), MAT.concrete)
  slab.rotation.x = -Math.PI / 2
  slab.position.set(0, 0.03, 6)
  scene.add(slab)

  // Trees around the clearing
  const treeCount = quality === 'high' ? 18 : 11
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.4
    const radius = 13 + Math.random() * 10
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const scale = 0.8 + Math.random() * 0.7
    scene.add(createTree(x, z, scale))
  }

  // Bushes scattered
  const bushCount = quality === 'high' ? 26 : 14
  for (let i = 0; i < bushCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 7 + Math.random() * 16
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (Math.abs(x) < 2.6 && z > 3 && z < 16) continue // keep path clear
    scene.add(createBush(x, z, 0.7 + Math.random() * 0.8))
  }

  // Two ground plants on the back (-Z)
  scene.add(createGroundPlant(-4, -5, 1.1))
  scene.add(createGroundPlant(4, -5, 1.3))

  // Moon
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 18), MAT.moon)
  moon.position.set(-62, 48, -78)
  scene.add(moon)

  // Stars
  scene.add(createStars(quality === 'high' ? 2600 : 1200))
  scene.add(createBrightStars(quality === 'high' ? 80 : 40))
}
