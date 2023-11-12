import { Position } from './position.model';

export interface Ship {
  origin: Position;
  rotation: number;
  scale: number;
}