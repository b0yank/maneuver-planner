// import { Line } from "./line.model";

export class Ship {

  constructor(private _id: string, private _position: Ship.Position, private _strokeColor: string) {
  }

  get id() {
    return this._id;
  }

  get position() {
    return this._position;
  }

  get strokeColor(): string {
    return this._strokeColor;
  }

  set strokeColor(color: string) {
    this._strokeColor = color;
  }

  // getCenterLine(): Line {
  //   const point = new DOMPointReadOnly(this.position.origin.x, this.position.origin.y);

    
  // }

  // getMidFrameLine(): Line {
    
  // }
}

export namespace Ship {
  export interface Position {
    origin: DOMPoint;
    rotation: number;
  }
}