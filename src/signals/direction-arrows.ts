import { Accessor, createSignal } from "solid-js";
import { DirectionArrow } from "../models/direction-arrow";

const ABSOLUTE_ARROW_LENGTH = 0.02;

export function createDirectionArrows(params: { canvasWidth: Accessor<number> }) {

  const { canvasWidth } = params; 
  
  const [arrows, setArrows] = createSignal<DirectionArrow.Absolute[]>([
    { label: 'Wind', direction: 0, strength: 1, symbol: 'wind', color: 'darkred' },
    { label: 'Current', direction: 0, strength: 1, symbol: 'arrow', color: 'darkblue' },
  ]);

  const absoluteToRelative = (arrow: DirectionArrow.Absolute): DirectionArrow.Relative => {
    

    let shape: {
      path: Path2D;
      width: number;
      length: number;
    };
    if (arrow.symbol === 'arrow') {
      shape = getArrowShape();
    } else {
      shape = getWindShape(arrow);
    }

    const { path, length, width } = shape;

    return {
      label: arrow.label,
      path,
      symbol: arrow.symbol,
      direction: arrow.direction,
      strength: arrow.strength,
      length,
      width,
      color: arrow.color,
    };
  }

  const updateArrow = (arrowLabel: string, value: { direction: number, strength: number }) => {
    
    setArrows(currentArrows => currentArrows
      .map(currentArrow => {
        if (currentArrow.label === arrowLabel) {
          currentArrow.direction = value.direction;
          currentArrow.strength = value.strength;
        }

        return currentArrow;
      })
    );
  }

  const loadArrows = (arrows: DirectionArrow.Absolute[]) => {
    setArrows(arrows);
  }

  const getArrowShape = () => {

    const length = Math.max(ABSOLUTE_ARROW_LENGTH * canvasWidth(), 30);
    const width = length * 0.7;

    const halfLength = length / 2;
    const halfWidth = width / 2;

    const path = new Path2D();
    path.moveTo(0, -halfLength);
    path.lineTo(halfWidth, halfLength);
    path.lineTo(0, length * 0.3);
    path.lineTo(-halfWidth, halfLength);
    path.lineTo(0, -halfLength);

    return { path, length, width };
  }

  const getWindShape = (arrow: DirectionArrow.Absolute) => {

    const length = Math.max(ABSOLUTE_ARROW_LENGTH * canvasWidth(), 30);
    const width = length * 0.5;
    const halfWidth = width / 2;

    const path = new Path2D();
    path.moveTo(0, 0.5 * length);
    path.lineTo(0, -0.4 * length);

    const fullWithSideLines = Math.floor(arrow.strength / 10);
    for (let i = 0; i < fullWithSideLines; i++) {
      const lineHeight = (-0.4 + (i * 0.1)) * length;
      path.moveTo(0, lineHeight);
      path.lineTo(width, lineHeight - 0.1 * length);
    }

    const lastLineRemainder = arrow.strength % 10;
    if (lastLineRemainder) {
      const lastLineHeight = (-0.4 + (fullWithSideLines * 0.1)) * length;

      path.moveTo(0, lastLineHeight);
      if (lastLineRemainder < 5) {
        path.lineTo(halfWidth, lastLineHeight - 0.05 * length);
      } else {
        path.lineTo(width, lastLineHeight - 0.1 * length);
      }
    }

    return { path, length, width };
  }

  return {
    arrows: () => arrows().map(absoluteToRelative),
    updateArrow,
    loadArrows
  }
}

