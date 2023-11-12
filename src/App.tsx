import { createSignal, onMount } from 'solid-js';
import './App.css';
import { Ship } from './models/ship-position.model';
import { Position } from './models/position.model';

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();
  const [color, setColor] = createSignal<string>('blue');

  const [ships, setShips] = createSignal<Ship[]>([
    {
      // origin: { x: 100, y: 100 },
      // rotation: -0.45,
      origin: { x: 0, y: 0 },
      rotation: 0,
      scale: 0.9,
    }
  ]);

  const drawShip = (ship: Ship) => {
    const ctx = context()!;

    ctx.strokeStyle = color();
    ctx.translate(ship.origin.x, ship.origin.y);

    ctx.scale(ship.scale, ship.scale);
    ctx.rotate(ship.rotation);

    ctx.moveTo(0, 0);
    ctx.lineTo(25, 0);
    ctx.lineTo(25, 80);
    ctx.lineTo(17, 88);
    ctx.lineTo(8, 88);
    ctx.lineTo(0, 80);
    ctx.lineTo(0, 0);

    ctx.stroke();

    ctx.strokeStyle = '#000000';
  }

  onMount(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error('Cannot find canvas element');
    }

    const context = canvas.getContext('2d')!;
    setContext(context);

    ships().forEach(drawShip);
  });

  const isPositionInShip = (position: Position, ship: Ship): boolean => {
    return true;
  }

  const findClickedShipIndex = (position: Position): number | null => {
    
    const currentShips = ships();
    for (let index = 0; index < ships.length; index++) {
      const ship = currentShips[index];

      if (isPositionInShip(position, ship)) {
        return index;
      }
    }

    return null;
  }

  const handleMouseDown = (event: MouseEvent) => {
    
    const canvas = document.getElementById('canvas')!;

    const canvasX = event.clientX - canvas.offsetLeft;
    const canvasY = event.clientY - canvas.offsetTop;

    const clickedShipIndex = findClickedShipIndex({ x: canvasX, y: canvasY });

    if (clickedShipIndex !== null) {
      setShips(ships().map((ship, idx) => {
        if (idx !== clickedShipIndex) {
          return ship;
        }

        return ship
      }))
    }
  }

  return (
    <>
      <canvas 
        id='canvas' 
        width={1600} 
        height={800} 
        style={{ 'border': '1px solid black' }}
        onMouseDown={handleMouseDown}
      ></canvas>
    </>
  )
}

export default App;
