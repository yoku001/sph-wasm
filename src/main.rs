#![recursion_limit="200"]

#[macro_use]
extern crate stdweb;

#[macro_use]
extern crate serde_derive;
extern crate serde;

const GRAVITY: f64 = 0.025;
const RANGE: f64 = 10.0;
const RANGE2: f64 = RANGE * RANGE;
const PRESSURE: f64 = 1.0;
const VISCOSITY: f64 = 0.05;
const DENSITY: f64 = 0.2;
const N: usize = 100;

fn main() {
    stdweb::initialize();

    let mut engine = SphEngine::new();
    for _ in 0..100 {
        engine.update();
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


        function frame() {

            window.requestAnimationFrame(frame);
        }

        frame();
    }

    stdweb::event_loop();
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct Particle {
    x: f64,
    y: f64,
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
struct Neighbor<'a> {
    p1: &'a mut Particle,
    p2: &'a mut Particle,
    nx: f64,
    ny: f64,
    distance: f64,
    weight: f64,
}

impl<'a> Neighbor<'a> {
    fn new(p1: &'a mut Particle, p2: &'a mut Particle) -> Neighbor<'a> {
        let mut n = Neighbor {
            nx: p1.x - p2.x,
            ny: p1.y - p2.y,
            p1: p1,
            p2: p2,
            distance: 0.0,
            weight: 0.0,
        };

        n.distance = (n.nx * n.nx + n.ny * n.ny).sqrt();
        n.weight = 1.0 - n.distance / RANGE;

        let mut temp = n.weight * n.weight * n.weight;
        n.p1.density += temp;
        n.p2.density += temp;
        temp = 1.0 / n.distance;
        n.nx *= temp;
        n.ny *= temp;

        n
    }

    fn calc_force(&mut self) {
        let pressure_weight = self.weight * (self.p1.pressure + self.p2.pressure) / (self.p1.density + self.p2.density) * PRESSURE;
        let viscosity_weight = self.weight / (self.p1.density + self.p2.density) * VISCOSITY;
        self.p1.fx += self.nx * pressure_weight;
        self.p1.fy += self.ny * pressure_weight;
        self.p2.fx -= self.nx * pressure_weight;
        self.p2.fy -= self.ny * pressure_weight;
        let rvx = self.p2.vx - self.p1.vx;
        let rvy = self.p2.vy - self.p1.vy;
        self.p1.fx += rvx * viscosity_weight;
        self.p1.fy += rvy * viscosity_weight;
        self.p2.fx -= rvx * viscosity_weight;
        self.p2.fy -= rvy * viscosity_weight;
    }
}

struct SphEngine<'a> {
    particles: Vec<Particle>,
    neighbors: Vec<Neighbor<'a>>
}

impl<'a> SphEngine<'a> {
    // コンストラクタ
    fn new () -> SphEngine<'a> {
        // 粒子初期化
        let mut particles: Vec<Particle> = Vec::new();
        for i in 0..N {
            particles.push(Default::default());
            particles[i].x = 100.0 + (i % 10) as f64 * 8.0;
            particles[i].y = 100.0 + (i / 10) as f64 * 8.0;
        }

        SphEngine {
            particles: particles,
            neighbors: Vec::new()
        }
    }

    // フレーム初期化
    fn initialize (&mut self) {
        for p in &mut self.particles {
            p.fx = 0.0;
            p.fy = 0.0;
            p.density = 0.0;
        }

        self.neighbors.clear();
    }

    // 近傍粒子探索
    fn find_neighbors (&mut self) {
        let pt = self.particles.as_mut_ptr();
        let len = self.particles.len();
        unsafe {
            for i in 0..len {
                for j in 0..len {
                    if i == j { continue }
                    let pi = &mut *pt.offset(i as isize);
                    let pj = &mut *pt.offset(j as isize);
                    let distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
                    if distance < RANGE2 {
                        self.neighbors.push(Neighbor::new(pi, pj));
                    }
                }
            }
        }
    }

    // 圧力計算
    fn calc_force (&mut self) {
        for p in &mut self.particles {
            if p.density < DENSITY { p.density = DENSITY; }
            p.pressure = p.density - DENSITY;
        }

        for neighbor in &mut self.neighbors {
            neighbor.calc_force();
        }
    }

    fn update (&mut self) {
        self.initialize();
        self.find_neighbors();
        self.calc_force();
        for p in &mut self.particles {
            p.update();
        }
    }
}
