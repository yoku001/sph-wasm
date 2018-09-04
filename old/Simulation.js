// original paper: http://mmacklin.com/pbf_sig_preprint.pdf

class Simulation {
  constructor(width, height) {
    // parameters, see equation (14)
    this.AMOUNT_PARTICLES = 800;
    this.INTERACTION_RADIUS = 25;
    this.DRAWING_RADIUS = 2;
    this.SOLVER_ITERATIONS = 3;
    this.GRAVITY = new Vector2(0, 1000);
    this.MASS = 1.0;
    this.REST_DENSITY = 0.00019;

    this.K = 1;
    this.DELTA_Q = 0.2 * this.INTERACTION_RADIUS;
    this.N = 4;
    this.EPSILON_LAMBDA = 1;
    this.C = 0.01; //Viscosity

    this.mWidth = width;
    this.mHeight = height;
    this.mParticles = [];

    this.mGrid = new Grid(
      this.mParticles,
      this.mWidth,
      this.mHeight,
      this.INTERACTION_RADIUS * 2
    );
    this.mKernel = new Kernels(this.INTERACTION_RADIUS);
    this.InstantiateParticles();
    this.WdeltaQ =
      this.mKernel.POLY6_TERM *
      Math.pow(
        this.INTERACTION_RADIUS * this.INTERACTION_RADIUS -
          this.DELTA_Q * this.DELTA_Q,
        3
      );
  }

  InstantiateParticles() {
    // offset of every particle to an other particle
    let offsetBetweenParticles = 15;
    // offset of the particle square
    let offsetAllParticles = new Vector2(50, 100);
    let xparticles = Math.sqrt(this.AMOUNT_PARTICLES);
    let yparticles = xparticles;

    // Creating a square of particles
    for (let x = 0; x < xparticles; x++) {
      for (let y = 0; y < yparticles; y++) {
        let position = new Vector2(
          x * offsetBetweenParticles + offsetAllParticles.x,
          y * offsetBetweenParticles + offsetAllParticles.y
        );
        this.mParticles.push(new Particle(position));
      }
    }
    console.log("particles instantiated");
  }

  // main loop
  SimulationLoop(deltaTime) {
    deltaTime = 0.005;

    //line 1-4
    for (let i = 0; i < this.mParticles.length; i++) {
      // apply forces
      this.mParticles[i].mForces = new Vector2(0, 0);
      this.mParticles[i].mForces = Add(
        this.mParticles[i].mForces,
        this.GRAVITY
      );
      this.mParticles[i].mVelocity = Add(
        this.mParticles[i].mVelocity,
        Scale(this.mParticles[i].mForces, deltaTime)
      );
      // predict positions
      let newPosition = Add(
        this.mParticles[i].mNewPosition,
        Scale(this.mParticles[i].mVelocity, deltaTime)
      );
      this.mParticles[i].mNewPosition = newPosition;

      this.BoundaryCondition(this.mParticles[i]);
    }

    this.FindParticleNeighbours();

    //line 8-19
    for (let iter = 0; iter < this.SOLVER_ITERATIONS; iter++) {
      // calculating densities
      for (let i = 0; i < this.mParticles.length; i++) {
        let position = this.mParticles[i].mNewPosition;
        let neighbours = this.mGrid.GetNeighbours(position);
        let density = 0.0;

        for (let j = 0; j < neighbours.length; j++) {
          let neighbourPosition = this.mParticles[neighbours[j]].mNewPosition;
          density +=
            this.MASS * this.mKernel.Poly6Kernel(position, neighbourPosition);
        }

        // calculating lambda
        // "pressure" is calculated with an equation of state
        let equation_of_state_term = density / this.REST_DENSITY - 1.0;

        let gradientVectorSum = new Vector2(0, 0);
        let gradientMagnitudeSum = 0;

        for (let j = 0; j < neighbours.length; j++) {
          let neighbourPosition = this.mParticles[neighbours[j]].mNewPosition;
          let gradient = Scale(
            this.mKernel.SpikyGradient(position, neighbourPosition),
            1.0 / this.REST_DENSITY
          );
          gradientVectorSum = Add(gradientVectorSum, gradient);
          gradientMagnitudeSum += gradient.Length2();
        }
        gradientMagnitudeSum += gradientVectorSum.Length2();
        this.mParticles[i].mLambda =
          (equation_of_state_term /
            (gradientMagnitudeSum + this.EPSILON_LAMBDA)) *
          -1;
      }

      // calculating deltaPosition
      for (let i = 0; i < this.mParticles.length; i++) {
        let position = this.mParticles[i].mNewPosition;
        let neighbours = this.mGrid.GetNeighbours(position);
        let deltaP = new Vector2(0, 0);

        for (let j = 0; j < neighbours.length; j++) {
          let neighbourPosition = this.mParticles[neighbours[j]].mNewPosition;
          // calculating equation (13)
          let corr =
            this.mKernel.Poly6Kernel(position, neighbourPosition) /
            this.WdeltaQ;
          corr = Math.pow(corr, this.N);
          let s_correction = this.K * corr * -1.0;

          let lambda_correction_term =
            this.mParticles[i].mLambda +
            this.mParticles[neighbours[j]].mLambda +
            s_correction;
          let gradient = this.mKernel.SpikyGradient(
            position,
            neighbourPosition
          );
          let corrected_gradient = Scale(gradient, lambda_correction_term);
          deltaP.Add(corrected_gradient);
        }
        this.mParticles[i].mDeltaPosition = Scale(
          deltaP,
          1.0 / this.REST_DENSITY
        );
      }

      for (let i = 0; i < this.mParticles.length; i++) {
        // update positions	using the deltaPosition
        this.mParticles[i].mNewPosition = Add(
          this.mParticles[i].mNewPosition,
          this.mParticles[i].mDeltaPosition
        );

        // perform collision detection and response
        // in this implementation only for boundary condition
        this.BoundaryCondition(this.mParticles[i]);
      }
    }

    //line 20-24
    for (let i = 0; i < this.mParticles.length; i++) {
      // update velocities
      let position = this.mParticles[i].mPosition;
      let newPosition = this.mParticles[i].mNewPosition;

      let direction = Sub(newPosition, position);
      let newVelocity = Scale(direction, 1.0 / deltaTime);
      this.mParticles[i].mVelocity = newVelocity;

      // apply vorticity confinement and xsph viscosity
      this.XSPHViscosity(this.mParticles[i]);
      // update positions
      // .Cpy() avoids sharing the same reference of mPosition and mNewPosition of the Particle class
      this.mParticles[i].mPosition = newPosition.Cpy();
    }
  }

  XSPHViscosity(pi) {
    let viscosity = new Vector2(0, 0);
    let neighbours = this.mGrid.GetNeighbours(pi.mNewPosition);
    for (let j = 0; j < neighbours.length; j++) {
      let relativeVel = Sub(
        pi.mVelocity,
        this.mParticles[neighbours[j]].mVelocity
      );
      let poly6Value = this.mKernel.Poly6Kernel(
        pi.mNewPosition,
        this.mParticles[neighbours[j]].mNewPosition
      );

      let addedGradientVel = Scale(relativeVel, poly6Value);
      viscosity = Add(viscosity, addedGradientVel);
    }
    pi.mVelocity = Add(pi.mVelocity, Scale(viscosity, this.C));
  }

  FindParticleNeighbours() {
    this.mGrid.Update();
  }

  BoundaryCondition(particle) {
    if (particle.mNewPosition.x < 0) {
      particle.mNewPosition.x = 0.001; // avoids particle stacking
    }
    if (particle.mNewPosition.x > this.mWidth) {
      particle.mNewPosition.x = this.mWidth - 0.001; // avoids particle stacking
    }

    if (particle.mNewPosition.y < 0) {
      particle.mNewPosition.y = 0.001; // avoids particle stacking
    }
    if (particle.mNewPosition.y > this.mHeight) {
      particle.mNewPosition.y = this.mHeight - 0.001; // avoids particle stacking
    }
  }

  Draw(context) {
    //this.mGrid.DebugDraw(context);
    for (let i = 0; i < this.mParticles.length; i++) {
      let pos = this.mParticles[i].mPosition;
      context.beginPath();
      context.arc(pos.x, pos.y, this.DRAWING_RADIUS, 0, 2 * Math.PI);
      context.fillStyle = "#000000";
      context.fill();
      context.closePath();
    }
  }
}
