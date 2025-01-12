import { Accessor, JSX, Show, createEffect, createSignal } from "solid-js";
import { DirectionArrow } from "../../models/direction-arrow";
import styles from './DirectionArrowData.module.css';

export function DirectionArrowData(props: { 
  arrow: Accessor<DirectionArrow.Relative>;
  updateArrow: (direction: number, strength: number) => void;
}) {
  const { arrow, updateArrow } = props;

  const [inputMode, setInputMode] = createSignal<boolean>(false);

  const canvasDim = arrow().length * 1.7;

  let arrowCanvasRef: HTMLCanvasElement;

  createEffect(() => {
    if (!arrowCanvasRef) {
      throw new Error('Cannot find arrow canvas element');
    }

    const ctx = arrowCanvasRef.getContext('2d')!;

    ctx.clearRect(0, 0, canvasDim, canvasDim);

    let rotationAngle = arrow().direction;
    // if (arrow().flipped) {
    //   rotationAngle = arrow().direction < 180
    //     ? arrow().direction + 180
    //     : arrow().direction - 180;
    // }

    const halfCanvasDim = canvasDim / 2;

    const transformMatrix = new DOMMatrix(
      `translate(${halfCanvasDim}px, ${halfCanvasDim}px) rotateZ(${(rotationAngle)}deg)`
    );

    ctx.setTransform(transformMatrix);
    
    ctx.fillStyle = arrow().color;
    ctx.lineWidth = 2;
    ctx.strokeStyle = arrow().color;

    if (arrow().symbol === 'arrow') {
      ctx.fill(arrow().path);
    } else {
      ctx.stroke(arrow().path);
    }

    ctx.resetTransform();

    // draw compass
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    const compassArcRadius = canvasDim * 0.45;
    ctx.arc(halfCanvasDim, halfCanvasDim, canvasDim * 0.45, 0, 2 * Math.PI);
    ctx.stroke();

    const compassTickLength = Math.max(compassArcRadius * 0.1, 4);
    for (let compassTickAngle = 0; compassTickAngle < 360; compassTickAngle += 15) {

      ctx.setTransform(
        new DOMMatrix(
          `translate(${halfCanvasDim}px, ${halfCanvasDim}px) rotateZ(${(compassTickAngle)}deg)`
        )
      );

      const currentCompassTickLength = compassTickAngle % 45 === 0
        ? compassTickLength * 1.5
        : compassTickLength;

      ctx.beginPath();
      ctx.moveTo(0, compassArcRadius);
      ctx.lineTo(0, compassArcRadius - currentCompassTickLength);
      ctx.closePath();
      ctx.stroke();

      ctx.resetTransform();
    }
  });

  const handleDirectionUpdate: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const updatedValue = Math.min(Math.max(Number(event.target.value), 0), 359);
    updateArrow(updatedValue, arrow().strength);
  }

  const handleStrengthUpdate : JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const updatedValue = Math.min(Math.max(Number(event.target.value), 0), 70);
    updateArrow(arrow().direction, updatedValue );
  }
  
  return (
    <div class={styles.container}>
      <h4 class={styles.header}>
        {arrow().label}
      </h4>

      <canvas 
        ref={e => arrowCanvasRef = e} 
        width={canvasDim} 
        height={canvasDim} 
        style={{ 'max-width': `${canvasDim}px`, 'max-height': `${canvasDim}px` }}
      ></canvas>

      <div 
        class={styles['inputs-container']} 
        onMouseEnter={() => setInputMode(true)} onMouseLeave={() => setInputMode(false)}
        style={{ 'max-width': `${canvasDim}px` }}
      >
        <Show 
          when={inputMode()} 
          fallback={<>
            <span class={styles['value-display']}>{`00${arrow().direction}°`.slice(-4)}</span>
            <span class={styles['value-display']}>{arrow().strength}kts</span>
          </>}
        >
          <input type='number' class={styles['value-display']} value={arrow().direction} onInput={handleDirectionUpdate} min={0} max={359} step={1} />
          <input type='number' class={styles['value-display']} value={arrow().strength} onInput={handleStrengthUpdate} min={0} max={70} step={1} />
        </Show>
      </div>
    </div>
  )
}