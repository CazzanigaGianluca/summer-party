import * as THREE from 'three'
import type { Quality, SceneCtx } from './scene'

const FW_COLORS = [0xf2b14e, 0xff3b3b, 0x3b7bff, 0x3bff7b, 0xff3bd0, 0xffd23b, 0xffffff, 0x9b3bff]

interface Rocket {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  targetY: number
  exploded: boolean
}

interface Burst {
  points: THREE.Points
  vel: Float32Array
  life: number
  maxLife: number
  count: number
}

export function createFireworks(
  scene: THREE.Scene,
  quality: Quality,
  ctx: SceneCtx,
): { update: (dt: number, elapsed: number) => void } {
  if (ctx.reducedMotion) {
    return { update: () => {} }
  }

  const maxParticles = quality === 'high' ? 100 : 60
  const rockets: Rocket[] = []
  const bursts: Burst[] = []
  let launchTimer = 0
  let nextLaunch = 1.2

  const rocketGeo = new THREE.SphereGeometry(0.12, 8, 6)

  function launch(): void {
    const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]
    const mat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: color,
      emissiveIntensity: 3,
      roughness: 0.3,
    })
    const mesh = new THREE.Mesh(rocketGeo, mat)
    // Launch from in front of the cascinotto (+Z)
    const startX = (Math.random() - 0.5) * 8
    const startZ = 3 + Math.random() * 5
    mesh.position.set(startX, 0.4, startZ)
    scene.add(mesh)
    const targetY = 18 + Math.random() * 8
    // Time to reach apex ~0.9s; v = targetY / t + 0.5*g*t (we'll just use constant vel for simplicity)
    const speed = targetY / 0.9
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.2,
      speed,
      (Math.random() - 0.5) * 1.2,
    )
    rockets.push({ mesh, vel, targetY, exploded: false })
  }

  function explode(x: number, y: number, z: number): void {
    const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]
    const count = maxParticles
    const positions = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      // Random direction on sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const sp = 4 + Math.random() * 5
      vel[i * 3] = sp * Math.sin(phi) * Math.cos(theta)
      vel[i * 3 + 1] = sp * Math.sin(phi) * Math.sin(theta)
      vel[i * 3 + 2] = sp * Math.cos(phi)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const points = new THREE.Points(geo, mat)
    points.frustumCulled = false
    scene.add(points)
    bursts.push({
      points,
      vel,
      life: 0,
      maxLife: 1.8,
      count,
    })
  }

  const update = (dt: number, _elapsed: number) => {
    const p = ctx.rig.scrollProgress
    if (p > 0.6) {
      launchTimer += dt
      if (launchTimer >= nextLaunch && rockets.length + bursts.length < 4) {
        launch()
        launchTimer = 0
        nextLaunch = 0.9 + Math.random() * 0.7
      }
    }

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]
      r.mesh.position.addScaledVector(r.vel, dt)
      r.vel.y -= 12 * dt // gravity slows ascent
      if (r.mesh.position.y >= r.targetY || r.vel.y <= 0) {
        explode(r.mesh.position.x, r.mesh.position.y, r.mesh.position.z)
        scene.remove(r.mesh)
        ;(r.mesh.material as THREE.Material).dispose()
        rockets.splice(i, 1)
      }
    }

    // Update bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]
      b.life += dt
      const pos = b.points.geometry.attributes.position as THREE.BufferAttribute
      for (let j = 0; j < b.count; j++) {
        b.vel[j * 3 + 1] -= 9.8 * dt // gravity
        pos.setXYZ(
          j,
          pos.getX(j) + b.vel[j * 3] * dt,
          pos.getY(j) + b.vel[j * 3 + 1] * dt,
          pos.getZ(j) + b.vel[j * 3 + 2] * dt,
        )
      }
      pos.needsUpdate = true
      const t = b.life / b.maxLife
      ;(b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - t)
      if (b.life >= b.maxLife) {
        scene.remove(b.points)
        b.points.geometry.dispose()
        ;(b.points.material as THREE.Material).dispose()
        bursts.splice(i, 1)
      }
    }
  }

  return { update }
}
