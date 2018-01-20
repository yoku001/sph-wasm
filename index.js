// SPH
// http://wonderfl.net/c/2pg0
// を、JavaScript化したもの

const GRAVITY = 0.025
const RANGE = 10.0
const PRESSURE = 1.0
const VISCOSITY = 0.05

class Particle {
  constructor (x, y) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.fx = 0
    this.fy = 0
    this.density = 0
    this.pressure = 0
  }

  move () {
    this.vy += GRAVITY
    this.vx += this.fx
    this.vy += this.fy
    this.x += this.vx
    this.y += this.vy

    if (this.x < 5) { this.vx += (5 - this.x) * 0.5 - this.vx * 0.5 }
    if (this.y < 5) { this.vy += (5 - this.y) * 0.5 - this.vy * 0.5 }
    if (this.x > 460) { this.vx += (460 - this.x) * 0.5 - this.vx * 0.5 }
    if (this.y > 460) { this.vy += (460 - this.y) * 0.5 - this.vy * 0.5 }
  }

  calcForce (nx, ny, weight) {
    const pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * PRESSURE
    const viscosityWeight = this.weight / (p1.density + p2.density) * VISCOSITY
    p1.fx += this.nx * pressureWeight
    p1.fy += this.ny * pressureWeight
    p2.fx -= this.nx * pressureWeight
    p2.fy -= this.ny * pressureWeight
    const rvx = p2.vx - p1.vx
    const rvy = p2.vy - p1.vy
    p1.fx += rvx * viscosityWeight
    p1.fy += rvy * viscosityWeight
    p2.fx -= rvx * viscosityWeight
    p2.fy -= rvy * viscosityWeight
  }
}

class Neighbor {
  constructor (p1, p2) {
    this.p1 = p1
    this.p2 = p2
    this.nx = p1.x - p2.x
    this.ny = p1.y - p2.y
    this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny)
    this.weight = 1.0 - this.distance / RANGE

    let temp = this.weight * this.weight * this.weight
    p1.density += temp
    p2.density += temp
    temp = 1.0 / this.distance
    this.nx *= temp
    this.ny *= temp
  }

  calcForce () {
    let p1 = this.p1
    let p2 = this.p2
    const pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * PRESSURE
    const viscosityWeight = this.weight / (p1.density + p2.density) * VISCOSITY
    p1.fx += this.nx * pressureWeight
    p1.fy += this.ny * pressureWeight
    p2.fx -= this.nx * pressureWeight
    p2.fy -= this.ny * pressureWeight
    const rvx = p2.vx - p1.vx
    const rvy = p2.vy - p1.vy
    p1.fx += rvx * viscosityWeight
    p1.fy += rvy * viscosityWeight
    p2.fx -= rvx * viscosityWeight
    p2.fy -= rvy * viscosityWeight
  }
}

window.onload = (() => {
  let mouseX
  let mouseY
  const RANGE2 = RANGE * RANGE
  const DENSITY = 0.2
  const canvas = document.getElementById('canvas')

  // Stats
  const stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.domElement)

  const ctx = canvas.getContext('2d')
  ctx.font = '20px Arial'
  let particles = []
  let numParticles = 0
  let neighbors = []
  let count = 0
  let press = false

  function frame (e) {
    stats.begin()

    if (press) { pour() }
    move()
    ctx.clearRect(0, 0, 460, 460)
    draw()

    stats.end()
    window.requestAnimationFrame(frame)
  }

  function draw () {
    ctx.fillText(particles.length, 10, 20)

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i]
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
    }
  }

  function pour () {
    if (count % 3 === 0) {
      for (let i = -7; i <= 8; i++) {
        let p = new Particle(mouseX + i * 8, mouseY)
        p.vy = 3
        particles.push(p)
      }
    }
  }

  function move () {
    count++
    initialize()
    findAllNeighbors()
    calcPressure()
    calcForce()
    for (let i = 0; i < particles.length; i++) {
      particles[i].move()
    }
  }

  function initialize () {
    for (let i = 0; i < particles.length; i++) {
      var p = particles[i]
      p.fx = p.fy = p.density = 0
    }
  }

  function findAllNeighbors () {
    neighbors = []
    const len = particles.length
    for (let i = 0; i < len; i++) {
      const pi = particles[i]
      for (let j = 0; j < len; j++) {
        const pj = particles[j]
        if (pi === pj) { continue }
        const distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y)
        if (distance < RANGE2) {
          neighbors.push(new Neighbor(pi, pj))
        }
      }
    }
  }

  function calcPressure () {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      if (p.density < DENSITY) { p.density = DENSITY }
      p.pressure = p.density - DENSITY
    }
  }

  function calcForce () {
    for (let i = 0; i < neighbors.length; i++) {
      neighbors[i].calcForce()
    }
  }

  return () => {
    window.addEventListener('mousedown', e => { mouseX = e.layerX; mouseY = e.layerY; press = true }, false)
    window.addEventListener('mousemove', e => { mouseX = e.layerX; mouseY = e.layerY }, false)
    window.addEventListener('mouseup', e => { press = false }, false)
    frame()
  }
})()
