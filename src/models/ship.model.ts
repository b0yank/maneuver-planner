export interface Ship {
  id: string;
  position: Ship.Position;
  strokeColor?: string;
  length: number;
  width: number;
}

export namespace Ship {
  export interface Position {
    origin: DOMPoint;
    rotation: number;
  }

  export type Absolute = {
    id: string;
    position: {
      origin: { x: number, y: number };
      rotation: number;
    };
    length: number;
    width: number;
    strokeColor?: string;
  }

  export type PersistedData = {
    ships: Absolute[];
    identityLength: number,
    identityWidth: number,
  }
}
