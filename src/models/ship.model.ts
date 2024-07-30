export class Ship {

  constructor(private _id: string, private _position: Ship.Position, private _strokeColor: string, private _length: number, private _width: number) {
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

  get length(): number {
    return this._length;
  }

  get width(): number {
    return this._width
  }

  set length(value: number) {
    this._length = value;
  }

  set width(value: number) {
    this._width = value;
  }
}

export namespace Ship {
  export interface Position {
    origin: DOMPoint;
    rotation: number;
  }

  export interface Dto {
    id: string;
    position: Position;
    length: number;
    width: number;
    strokeColor: string;
  }
}