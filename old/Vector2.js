class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  Normalize() {
    let length = this.Length();
    this.x /= length;
    this.y /= length;
  }

  Length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  Length2() {
    return this.x * this.x + this.y * this.y;
  }

  GetNormal() {
    return new Vector2(this.y, -this.x);
  }
  Dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }

  Cpy() {
    return new Vector2(this.x, this.y);
  }

  Print() {
    console.log("x: " + this.x + " - y: " + this.y);
  }

  Add(vec) {
    this.x += vec.x;
    this.y += vec.y;
  }
  Sub(vec) {
    this.x -= vec.x;
    this.y -= vec.y;
  }
}

function Add(vecA, vecB) {
  return new Vector2(vecA.x + vecB.x, vecA.y + vecB.y);
}

function Sub(vecA, vecB) {
  return new Vector2(vecA.x - vecB.x, vecA.y - vecB.y);
}

function Scale(vecA, scale) {
  return new Vector2(vecA.x * scale, vecA.y * scale);
}

function Multiply(vecA, vecB) {
  return new Vector2(vecA.x * vecB.x, vecA.y * vecB.y);
}

function Dot(vecA, vecB) {
  return vecA.x * vecB.x + vecA.y * vecB.y;
}
