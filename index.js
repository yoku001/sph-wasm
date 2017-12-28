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
    this.gx = 0
    this.gy = 0
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
}

class Neighbor {
  constructor () {
    this.p1 = null
    this.p2 = null
    this.distance = 0
    this.nx = 0
    this.ny = 0
    this.weight = 0
  }

  setParticle (p1, p2) {
    this.p1 = p1
    this.p2 = p2
    this.nx = p1.x - p2.x
    this.ny = p1.y - p2.y
    this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny)
    this.weight = 1.0 - this.distance / RANGE

    var temp = this.weight * this.weight * this.weight
    p1.density += temp
    p2.density += temp
    temp = 1.0 / this.distance
    this.nx *= temp
    this.ny *= temp
  }

  calcForce () {
    var p1 = this.p1
    var p2 = this.p2
    var pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * PRESSURE
    var viscosityWeight = this.weight / (p1.density + p2.density) * VISCOSITY
    p1.fx += this.nx * pressureWeight
    p1.fy += this.ny * pressureWeight
    p2.fx -= this.nx * pressureWeight
    p2.fy -= this.ny * pressureWeight
    var rvx = p2.vx - p1.vx
    var rvy = p2.vy - p1.vy
    p1.fx += rvx * viscosityWeight
    p1.fy += rvy * viscosityWeight
    p2.fx -= rvx * viscosityWeight
    p2.fy -= rvy * viscosityWeight
  }
}

class Grid {
  constructor () {
    this.particles = []
    this.numParticles = 0
  }

  clear () {
    this.numParticles = 0
  }

  add (p) {
    this.particles[this.numParticles++] = p
  }
}

window.onload = (function () {
  var mouseX
  var mouseY
  var RANGE2 = RANGE * RANGE
  var DENSITY = 0.2
  var NUM_GRIDS = 46
  var INV_GRID_SIZE = 1.0 / (465.0 / NUM_GRIDS)
  var canvas = document.getElementById('canvas')
  var ctx = canvas.getContext('2d')
  var particles = []
  var numParticles = 0
  var neighbors = []
  var numNeighbors = 0
  var count = 0
  var press = false
  var grids = []

  function frame (e) {
    if (press) { pour() }
    move()
    ctx.clearRect(0, 0, 460, 460)
    draw()
    // window.setTimeout(frame, 1000 / 60)
    window.requestAnimationFrame(frame)
  }

  function draw () {
    for (var i = 0; i < numParticles; i++) {
      var p = particles[i]
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
    }
  }

  function pour () {
    if (count % 3 === 0) {
      for (var i = -4; i <= 4; i++) {
        var p = new Particle(mouseX + i * 8, mouseY)
        p.vy = 3
        particles[numParticles++] = p
      }
    }
  }

  function move () {
    count++
    // var i;
    // var p;
    updateGrids()
    findNeighbors()
    calcPressure()
    calcForce()
    for (var i = 0; i < numParticles; i++) {
      var p = particles[i]
      p.move()
    }
  }

  function updateGrids () {
    var i
    var j
    for (i = 0; i < NUM_GRIDS; i++) {
      for (j = 0; j < NUM_GRIDS; j++) { grids[i][j].clear() }
    }
    for (i = 0; i < numParticles; i++) {
      var p = particles[i]
      p.fx = p.fy = p.density = 0
      p.gx = Math.floor(p.x * INV_GRID_SIZE)
      p.gy = Math.floor(p.y * INV_GRID_SIZE)
      if (p.gx < 0) { p.gx = 0 }
      if (p.gy < 0) { p.gy = 0 }
      if (p.gx > NUM_GRIDS - 1) { p.gx = NUM_GRIDS - 1 }
      if (p.gy > NUM_GRIDS - 1) { p.gy = NUM_GRIDS - 1 }
      grids[p.gx][p.gy].add(p)
    }
  }

  function findNeighbors () {
    numNeighbors = 0
    for (var i = 0; i < numParticles; i++) {
      var p = particles[i]
      var xMin = p.gx !== 0
      var xMax = p.gx !== NUM_GRIDS - 1
      var yMin = p.gy !== 0
      var yMax = p.gy !== NUM_GRIDS - 1
      findNeighborsInGrid(p, grids[p.gx][p.gy])
      if (xMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy])
      if (xMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy])
      if (yMin) findNeighborsInGrid(p, grids[p.gx][p.gy - 1])
      if (yMax) findNeighborsInGrid(p, grids[p.gx][p.gy + 1])
      if (xMin && yMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy - 1])
      if (xMin && yMax) findNeighborsInGrid(p, grids[p.gx - 1][p.gy + 1])
      if (xMax && yMin) findNeighborsInGrid(p, grids[p.gx + 1][p.gy - 1])
      if (xMax && yMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy + 1])
    }
  }

  function findNeighborsInGrid (pi, g) {
    for (var j = 0; j < g.numParticles; j++) {
      var pj = g.particles[j]
      if (pi === pj) { continue }
      var distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y)
      if (distance < RANGE2) {
        if (neighbors.length === numNeighbors) { neighbors[numNeighbors] = new Neighbor() }
        neighbors[numNeighbors++].setParticle(pi, pj)
      }
    }
  }

  function calcPressure () {
    for (var i = 0; i < numParticles; i++) {
      var p = particles[i]
      if (p.density < DENSITY) { p.density = DENSITY }
      p.pressure = p.density - DENSITY
    }
  }

  function calcForce () {
    for (var i = 0; i < numNeighbors; i++) {
      var n = neighbors[i]
      n.calcForce()
    }
  }
  return function () {
    for (var i = 0; i < NUM_GRIDS; i++) {
      grids[i] = new Array(NUM_GRIDS)
      for (var j = 0; j < NUM_GRIDS; j++) { grids[i][j] = new Grid() }
    }
    window.addEventListener('mousedown', function (e) { mouseX = e.layerX; mouseY = e.layerY; press = true }, false)
    window.addEventListener('mousemove', function (e) { mouseX = e.layerX; mouseY = e.layerY }, false)
    window.addEventListener('mouseup', function (e) { press = false }, false)
    frame()
  }
}())
