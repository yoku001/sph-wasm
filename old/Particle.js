class Particle {
  constructor(position) {
    this.mPosition = position;
    this.mNewPosition = position.Cpy();
    this.mVelocity = new Vector2(0, 0);
    this.mLambda = 0;
    this.mDeltaPosition = new Vector2(0, 0);
    this.mForces = new Vector2(0, 0);
    this.mVelocity = new Vector2(0, 0);
  }
}
