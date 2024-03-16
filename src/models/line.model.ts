export class Line {

  private _pointA: DOMPointReadOnly;
  private _pointB: DOMPointReadOnly;

  constructor(pointA: DOMPoint, pointB: DOMPoint) {
    this._pointA = new DOMPointReadOnly(pointA.x, pointA.y);
    this._pointB = new DOMPointReadOnly(pointB.x, pointB.y);
  }

  get isVertical() {
    return this._pointA.x === this._pointB.x;
  }

  get isHorizontal() {
    return this._pointA.y === this._pointB.y;
  }

  get slope() {
    // m = (y2 - y1) / (x2 - x1)
    const xDiff = this._pointB!.x - this._pointA.x;

    return xDiff !== 0 ? (this._pointB!.y - this._pointA.y) / xDiff : Number.NaN;
  }

  get yIntercept() {
    
    const slope = this.slope;

    if (isNaN(slope)) {
      return Number.NaN;
    }

    // b = y - m * x
    return this._pointA.y - this._pointA.x * slope;
  }

  get xIntercept() {

    const slope = this.slope;

    if (isNaN(slope)) { 
      return this._pointA.x;
    }

    if (slope === 0) {
      return Number.NaN;
    }

    // x = -b / m
    return -this.yIntercept / slope;
  }
}