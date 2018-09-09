class Core {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.mSimulation = new Simulation(width, height);
    this.mDeltaTime = 0;
  }

  Update(deltaTime) {
    this.mSimulation.SimulationLoop(deltaTime);
    this.mDeltaTime = deltaTime;
  }

  Draw(context) {
    this.mSimulation.Draw(context);
  }

  KeyboardInput(keyCode) {
    console.log(keyCode);

    switch (keyCode) {
      case 37:
        this.mSimulation.GRAVITY = new Vector2(-1000, 0);
        break;
      case 38:
        this.mSimulation.GRAVITY = new Vector2(0, -1000);
        break;
      case 39:
        this.mSimulation.GRAVITY = new Vector2(1000, 0);
        break;
      case 40:
        this.mSimulation.GRAVITY = new Vector2(0, 1000);
        break;
    }
  }
}
