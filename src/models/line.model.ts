export class Line {

  private _pointA: DOMPointReadOnly;
  private _pointB: DOMPointReadOnly;

  constructor(pointA: DOMPoint, pointB: DOMPoint) {
    this._pointA = new DOMPointReadOnly(pointA.x, pointA.y);
    this._pointB = new DOMPointReadOnly(pointB.x, pointB.y);
  }

  get pointA() {
    return this._pointA
  }

  get pointB() {
    return this._pointB
  }

  get isVertical() {
    return this._pointA.x === this._pointB.x;
  }

  get isHorizontal() {
    return this._pointA.y === this._pointB.y;
  }

  get equation(): Line.Equation {
    
    // m = (y2 - y1) / (x2 - x1)
    const xDiff = this._pointB!.x - this._pointA.x;

    const slope = xDiff !== 0 ? (this._pointB!.y - this._pointA.y) / xDiff : Number.NaN;

    // b = y - m * x
    const intercept = isNaN(slope) ? Number.NaN : this._pointA.y - this._pointA.x * slope;

    return { slope, intercept };
  }
}

export namespace Line {
  export interface Equation {
    slope: number;
    intercept: number;
  }
}