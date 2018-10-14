class Kernels {
  constructor(interaction_radius_h) {
    this.PI = Math.PI;
    this.H = interaction_radius_h; //h
    this.H_SQU = this.H * this.H; //h²
    this.H_3 = this.H * this.H * this.H; //h³

    // Smoothing Coefficient in SPH Poly6Kernel
    this.POLY6_TERM = 315.0 / (64.0 * this.PI * Math.pow(this.H, 9));
    this.SPIKY_TERM = -45.0 / (this.PI * Math.pow(this.H, 6));
  }

  Poly6Kernel(pi, pj) {
    let r = Sub(pi, pj); // pj = neighbour particle
    let length2 = r.Length2();
    if (length2 > this.H_SQU || length2 <= 0) {
      return 0;
    } else {
      return this.POLY6_TERM * Math.pow(this.H * this.H - length2, 3);
    }
  }

  SpikyGradient(pi, pj) {
    let r = Sub(pi, pj);
    let length2 = r.Length2();
    if (length2 > this.H_SQU || length2 <= 0) {
      return new Vector2(0, 0);
    } else {
      let length = Math.sqrt(length2);
      r.Normalize();
      let term = (this.H - length) * (this.H - length) * this.SPIKY_TERM;
      return Scale(r, term);
    }
  }
}
