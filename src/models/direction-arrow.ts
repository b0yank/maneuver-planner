export namespace DirectionArrow {

  export interface Absolute {
    label: string;
    direction: number;
    strength: number;
    symbol: 'arrow' | 'wind';
    color: string;
  }

  export interface Relative {
    label: string;
    symbol: 'arrow' | 'wind';
    direction: number;
    strength: number;
    path: Path2D;
    color: string;
    length: number;
    width: number;
  }
}