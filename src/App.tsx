import { createEffect, createSignal, onMount } from 'solid-js';
import './App.css';
import { ShipPosition } from './models/ship-position.model';
import { Position } from './models/position.model';
import { Matrix3x3 } from './models/matrix3x3.model';
import { Ship } from './models/ship.model';

const CANVAS_LENGTH = 1600;
const CANVAS_WIDTH = 800;

const IDENTITY_SHIP_LENGTH = 88;
const IDENTITY_SHIP_WIDTH = 25;
const IDENTITY_SHIP_SIDE_OFFSET = 8;

const IDENTITY_SHIP_LENGTH_OFFSET = IDENTITY_SHIP_LENGTH - IDENTITY_SHIP_SIDE_OFFSET;
const IDENTITY_SHIP_WIDTH_OFFSET = IDENTITY_SHIP_WIDTH - IDENTITY_SHIP_SIDE_OFFSET;

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();
  const [color, setColor] = createSignal<string>('blue');
  const [scale, setScale] = createSignal<number>(1);
  const [selectedShipId, setSelectedShipId] = createSignal<string | null>(null);
  // const [scale, setScale] = createSignal<Matrix3x3>(Matrix3x3.eye);

  // const [ships, setShips] = createSignal<Ship[]>([
  //   {
  //     origin: { x: 0, y: 0 },
  //     rotation: 0,
  //   },
  //   {
  //     origin: { x: 50, y: 50 },
  //     rotation: (22.5 * Math.PI) / 180,
  //   },
  //   {
  //     origin: { x: 100, y: 100 },
  //     rotation: (45 * Math.PI) / 180,
  //   },
  //   {
  //     origin: { x: 200, y: 200 },
  //     rotation: (90 * Math.PI) / 180,
  //   },
  // ]);

  const [ships, setShips] = createSignal<Ship[]>([
    { id: '1', position: { origin: new DOMPoint(0, 0), rotation: 0 } },
    { id: '2', position: { origin: new DOMPoint(50, 50), rotation: 30 } },
    { id: '3', position: { origin: new DOMPoint(100, 100), rotation: 45 } },
    { id: '4', position: { origin: new DOMPoint(150, 150), rotation: 60 } },
    { id: '5', position: { origin: new DOMPoint(200, 200), rotation: 75 } },
    { id: '6', position: { origin: new DOMPoint(250, 250), rotation: 90 } },

    // new DOMMatrix('translate(0px, 0px) rotateZ(0) scale(1, 1)'),
    // new DOMMatrix('translate(50px, 50px) rotateZ(30deg) scale(1, 1)'),
    // new DOMMatrix('translate(100px, 100px) rotateZ(45deg) scale(1, 1)'),
    // new DOMMatrix('translate(150px, 150px) rotateZ(60deg) scale(1, 1)'),
    // new DOMMatrix('translate(200px, 200px) rotateZ(75deg) scale(1.2, 1.2)'),
    // new DOMMatrix('translate(250px, 250px) rotateZ(90deg) scale(0.8, 0.8)'),
  ])

  const createShip = (): Path2D => { 
    const shipPath = new Path2D();

    shipPath.moveTo(0, 0);
    shipPath.lineTo(IDENTITY_SHIP_WIDTH, 0);
    shipPath.lineTo(IDENTITY_SHIP_WIDTH, IDENTITY_SHIP_LENGTH_OFFSET);
    shipPath.lineTo(IDENTITY_SHIP_WIDTH_OFFSET, IDENTITY_SHIP_LENGTH);
    shipPath.lineTo(IDENTITY_SHIP_SIDE_OFFSET, IDENTITY_SHIP_LENGTH);
    shipPath.lineTo(0, IDENTITY_SHIP_LENGTH_OFFSET);
    shipPath.lineTo(0, 0);

    return shipPath;
  }

  // const drawShip = (shipPosition: ShipPosition) => {
  //   const ctx = context()!;

  //   ctx.resetTransform();
  //   ctx.strokeStyle = color();

  //   const shipTransformationMatrix = scale().dot(shipPosition.rotate).dot(shipPosition.translate);

  //   const domMatrix = new DOMMatrix([])
  // }

  const drawShip = (ship: Ship) => {
    const ctx = context()!;

    ctx.strokeStyle = color();
    // ctx.resetTransform();
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    if (selectedShipId() === ship.id) {
      ctx.beginPath();
      console.log('arc center', ship.position.origin.x + (IDENTITY_SHIP_WIDTH / 2), ship.position.origin.y + (IDENTITY_SHIP_LENGTH / 2))

      ctx.arc((IDENTITY_SHIP_WIDTH / 2), (IDENTITY_SHIP_LENGTH / 2), (IDENTITY_SHIP_LENGTH * scale()) / 2 + 10, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc((IDENTITY_SHIP_WIDTH / 2), (IDENTITY_SHIP_LENGTH / 2), 1, 0, 2*Math.PI)
      
      ctx.stroke();
    }

    // ctx.resetTransform();

    // const shipPosition = ship.position;
    // const path = new Path2D();
    // const shipTransformationMatrix = getShipDomMatrix(shipPosition);
    // path.addPath(createShip(), shipTransformationMatrix)
    
    ctx.stroke(createShip());
    ctx.beginPath();
    // ctx.stroke(path);

    // ctx.setTransform(ship);

    // ctx.strokeStyle = '#000000';
  }

  // const drawShip = (ship: Ship) => {
  //   const ctx = context()!;

  //   ctx.resetTransform();
  //   ctx.strokeStyle = color();
  //   ctx.translate(ship.origin.x, ship.origin.y);

  //   ctx.scale(scale(), scale());
  //   ctx.rotate(ship.rotation);

  //   ctx.moveTo(0, 0);
  //   ctx.lineTo(25, 0);
  //   ctx.lineTo(25, 80);
  //   ctx.lineTo(17, 88);
  //   ctx.lineTo(8, 88);
  //   ctx.lineTo(0, 80);
  //   ctx.lineTo(0, 0);

  //   ctx.stroke();

  //   ctx.strokeStyle = '#000000';
  // }

  createEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error('Cannot find canvas element');
    }

    const context = canvas.getContext('2d')!;
    setContext(context);

    context.clearRect(0, 0, CANVAS_LENGTH, CANVAS_WIDTH)
    ships().forEach(drawShip);
    context.resetTransform();
  });

  const getShipDomMatrix = (shipPosition: ShipPosition): DOMMatrix => {
    return new DOMMatrix(
      `translate(${shipPosition.origin.x}px, ${shipPosition.origin.y}px) rotateZ(${shipPosition.rotation}deg) scale(${scale()}, ${scale()})`
    );
  }

  const isPositionInShip = (position: Position, shipMatrix: DOMMatrix): boolean => {
    const inverseMatrix = shipMatrix.inverse();

    const domPoint = inverseMatrix.transformPoint(new DOMPoint(position.x, position.y));
    
    return isPointInIdentityShip(domPoint);
  }

  const findClickedShipId = (position: Position): string | null => {
    
    const currentShips = ships();
    for (let index = 0; index < ships().length; index++) {
      const ship = currentShips[index];
      
      if (isPositionInShip(position, getShipDomMatrix(ship.position))) {
        return ship.id;
      }
    }

    return null;
  }

  const isPointInIdentityShip = (point: DOMPoint): boolean => {
    const isWithinXBounds = point.x >= 0 && point.x <= IDENTITY_SHIP_WIDTH;
    const isWithinYBounds = point.y >= 0 && point.y <= IDENTITY_SHIP_LENGTH;

    if (isWithinXBounds && isWithinYBounds) {
      if (point.y <= IDENTITY_SHIP_LENGTH_OFFSET) {
        return true;
      }
  
      if (point.y <= IDENTITY_SHIP_LENGTH) {
        return (point.x <= IDENTITY_SHIP_WIDTH_OFFSET && point.x >= (point.y - IDENTITY_SHIP_LENGTH_OFFSET)) 
            || (point.x > IDENTITY_SHIP_WIDTH_OFFSET && point.x + (point.y - IDENTITY_SHIP_LENGTH_OFFSET) <= IDENTITY_SHIP_WIDTH);
      }
    }

    return false;
  }

  const handleMouseDown = (event: MouseEvent) => {
    
    const canvas = document.getElementById('canvas')!;

    const canvasX = event.clientX - canvas.offsetLeft;
    const canvasY = event.clientY - canvas.offsetTop;

    const clickedShipId = findClickedShipId({ x: canvasX, y: canvasY });
    console.log('ship index', clickedShipId)
    
    setSelectedShipId(clickedShipId);
  }

  return (
    <>
      <canvas 
        id='canvas' 
        width={CANVAS_LENGTH} 
        height={CANVAS_WIDTH} 
        style={{ 'border': '1px solid black' }}
        onMouseDown={handleMouseDown}
      ></canvas>
    </>
  )
}

export default App;
