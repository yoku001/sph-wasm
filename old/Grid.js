class Grid {
  constructor(particles, width, height, cellSize) {
    this.mWidth = width;
    this.mHeight = height;
    this.mCellSize = cellSize;
    this.mParticles = particles;
    this.mCells = [[]];

    this.mRows = parseInt(this.mHeight / this.mCellSize);
    this.mCols = parseInt(this.mWidth / this.mCellSize);

    this.mRows += this.mRows * this.mCellSize < this.mHeight ? 1 : 0;
    this.mCols += this.mCols * this.mCellSize < this.mWidth ? 1 : 0;

    for (let i = 0; i < this.mRows * this.mCols; i++) {
      this.mCells[i] = [];
    }
  }

  DebugDraw(context) {
    for (let x = 0; x < this.mCols; x++) {
      for (let y = 0; y < this.mRows; y++) {
        context.beginPath();
        context.fillStyle = "#e1e5f4";
        context.rect(
          this.mCellSize * x + 2,
          this.mCellSize * y + 2,
          this.mCellSize - 4,
          this.mCellSize - 4
        );
        context.fill();
        context.closePath();
      }
    }
  }

  Update() {
    this.ClearGrid();

    for (let i = 0; i < this.mParticles.length; i++) {
      let p = this.mParticles[i];
      let x = parseInt(p.mNewPosition.x / this.mCellSize);
      let y = parseInt(p.mNewPosition.y / this.mCellSize);

      if (x < 0 || y < 0 || x >= this.mCols || y >= this.mRows) continue;

      if (this.mCells[x + y * this.mCols] === undefined) {
        console.log(
          "undefined: " +
            p.mNewPosition.x +
            " - " +
            p.mNewPosition.y +
            " Particle " +
            i
        );
      }

      this.mCells[x + y * this.mCols].push(i);
    }
  }

  ClearGrid() {
    for (let i = 0; i < this.mCells.length; i++) {
      this.mCells[i] = [];
    }
  }

  GetCell(ix, iy) {
    if (ix < 0 || iy < 0 || ix >= this.mCols || iy >= this.mRows) {
      return null;
    }
    return this.mCells[ix + iy * this.mCols];
  }

  GetNeighbours(position) {
    var idListOfParticles = [];

    let cellX = parseInt(position.x / this.mCellSize);
    let cellY = parseInt(position.y / this.mCellSize);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        let content = this.GetCell(cellX + x, cellY + y);

        if (content != null) {
          for (let i = 0; i < content.length; i++) {
            idListOfParticles.push(content[i]);
          }
        }
      }
    }
    return idListOfParticles;
  }
}
