#![recursion_limit="200"]

#[macro_use]
extern crate stdweb;

#[macro_use]
extern crate serde_derive;
extern crate serde;

const GRAVITY: f64 = 0.025;
const RANGE: f64 = 10.0;
const PRESSURE: f64 = 1.0;
const VISCOSITY: f64 = 0.05;

const N: usize = 100;
const NUM_GRIDS: usize = 46;
const INV_GRID_SIZE: f64  = 1.0 / (465.0 / NUM_GRIDS as f64);

fn main() {
    stdweb::initialize();

    // 粒子初期化
    let mut particles: Vec<Particle> = Vec::new();
    for i in 0..N {
        particles.push(Default::default());
        particles[i].id = i;
        particles[i].x = 100.0 + (i % 10) as f64 * 8.0;
        particles[i].y = 100.0 + (i / 10) as f64 * 8.0;
    }

    // グリッド初期化
    let mut grids: Vec<Vec<Grid>> = Vec::new();
    for i in 0..NUM_GRIDS {
        grids.push(Vec::new());
        for _ in 0..NUM_GRIDS { 
            grids[i].push(Grid { particles: Vec::new() });
        }
    }

    js! {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "20px Arial";

        function draw (pt) {
            ctx.clearRect(0, 0, 460, 460);
            for (let i = 0; i < pt.length; i++) {
                let p = pt[i];
                ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            }
        }

        console.log(@{clear_grid(&mut grids)});
        console.log(@{update_grids(&mut grids, &mut particles)})

        // function frame(e) {
        //     console.log( @{p} );
        //     window.requestAnimationFrame(frame);
        // }

        // frame();
    }

    stdweb::event_loop();
}

fn update() -> i32 {
    100
}

fn clear_grid (grids: &mut Vec<Vec<Grid>>) {
    for gi in grids {
        for gj in gi {
            gj.particles.clear();
        }
    }
}

fn update_grids (grids: &mut Vec<Vec<Grid>>, pt: &mut Vec<Particle>) {
    for gi in &mut (*grids) {
        for gj in gi {
            gj.particles.clear();
        }
    }

    for p in pt {
        p.fx = 0.0;
        p.fy = 0.0;
        p.density = 0.0;

        p.gx = (p.x * INV_GRID_SIZE).floor() as i32;
        p.gy = (p.y * INV_GRID_SIZE).floor() as i32;

        if p.gx < 0 { p.gx = 0 }
        if p.gy < 0 { p.gy = 0 }
        if p.gx > (NUM_GRIDS as i32 - 1) { p.gx = NUM_GRIDS as i32 - 1 }
        if p.gx > (NUM_GRIDS as i32 - 1) { p.gy = NUM_GRIDS as i32 - 1 }

        grids[p.gx as usize][p.gy as usize].particles.push(p.id);
    }
}

// fn find_neighbors_in_grid (grid: &Grid) {
//     for p in grid.particles {
        
//     }
//     // for (let j = 0; j < g.numParticles; j++) {
//     //   const pj = g.particles[j]
//     //   if (pi === pj) { continue }
//     //   const distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y)
//     //   if (distance < RANGE2) {
//     //     if (neighbors.length === numNeighbors) { neighbors[numNeighbors] = new Neighbor() }
//     //     neighbors[numNeighbors++].setParticle(pi, pj)
//     //   }
//     // }
// }

#[derive(Debug, Default, Serialize, Deserialize)]
struct Particle {
    id: usize,
    x: f64,
    y: f64,
    gx: i32,
    gy: i32,
    vx: f64,
    vy: f64,
    fx: f64,
    fy: f64,
    density: f64,
    pressure: f64,
}

js_serializable!(Particle);

impl Particle {
    fn update(&mut self) {
        self.vy += GRAVITY;
        self.vx += self.fx;
        self.vy += self.fy;
        self.x += self.vx;
        self.y += self.vy;

        if self.x < 5.0 { self.vx += (5.0 - self.x) * 0.5 - self.vx * 0.5 }
        if self.y < 5.0 { self.vy += (5.0 - self.y) * 0.5 - self.vy * 0.5 }
        if self.x > 460.0 { self.vx += (460.0 - self.x) * 0.5 - self.vx * 0.5 }
        if self.y > 460.0 { self.vy += (460.0 - self.y) * 0.5 - self.vy * 0.5 }
    }
}

#[derive(Debug)]
struct Neighbor {
    i1: usize,
    i2: usize,
    distance: f64,
    nx: f64,
    ny: f64,
    weight: f64,
}

impl Neighbor {
    fn set(&mut self, i1: usize, i2: usize, pt: &mut Vec<Particle>) {
        self.i1 = i1;
        self.i2 = i2;

        self.nx = pt[i1].x - pt[i2].x;
        self.ny = pt[i1].y - pt[i2].y;
        self.distance = (self.nx * self.nx + self.ny * self.ny).sqrt();
        self.weight = 1.0 - self.distance / RANGE;

        let mut temp = self.weight * self.weight * self.weight;
        pt[i1].density += temp;
        pt[i2].density += temp;
        temp = 1.0 / self.distance;
        self.nx *= temp;
        self.ny *= temp;
    }

    fn calc_force(&mut self, pt: &mut Vec<Particle>) {
        let pressure_weight = self.weight * (pt[self.i1].pressure + pt[self.i2].pressure) / (pt[self.i1].density + pt[self.i2].density) * PRESSURE;
        let viscosity_weight = self.weight / (pt[self.i1].density + pt[self.i2].density) * VISCOSITY;
        pt[self.i1].fx += self.nx * pressure_weight;
        pt[self.i1].fy += self.ny * pressure_weight;
        pt[self.i2].fx -= self.nx * pressure_weight;
        pt[self.i2].fy -= self.ny * pressure_weight;
        let rvx = pt[self.i2].vx - pt[self.i1].vx;
        let rvy = pt[self.i2].vy - pt[self.i1].vy;
        pt[self.i1].fx += rvx * viscosity_weight;
        pt[self.i1].fy += rvy * viscosity_weight;
        pt[self.i2].fx -= rvx * viscosity_weight;
        pt[self.i2].fy -= rvy * viscosity_weight;
    }
}

#[derive(Debug)]
struct Grid {
    particles: Vec<usize>,
}
