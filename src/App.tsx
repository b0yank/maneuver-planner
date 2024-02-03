import { createEffect, createSignal } from 'solid-js';
import './App.css';
import { ShipPosition } from './models/ship-position.model';
import { Ship } from './models/ship.model';
import { getAngleBetweenPoints, getDistanceBetweenPoints } from './utils/points';

const CANVAS_LENGTH = 1600;
const CANVAS_WIDTH = 800;

const IDENTITY_SHIP_LENGTH = 88;
const IDENTITY_SHIP_WIDTH = 25;
const IDENTITY_SHIP_SIDE_OFFSET = 8;

const IDENTITY_SHIP_LENGTH_OFFSET = IDENTITY_SHIP_LENGTH - IDENTITY_SHIP_SIDE_OFFSET;
const IDENTITY_SHIP_WIDTH_OFFSET = IDENTITY_SHIP_WIDTH - IDENTITY_SHIP_SIDE_OFFSET;

const ROTATE_TOOL_WIDTH = 10;

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();
  const [color, setColor] = createSignal<string>('blue');
  const [scale, setScale] = createSignal<number>(1);
  const [mouseHoldStart, setMouseHoldStart] = createSignal<DOMPointReadOnly | null>(null);
  const [selectedShipId, setSelectedShipId] = createSignal<string | null>(null);
  const [activeCommand, setActiveCommand] = createSignal<'pan' | 'rotate' | null>(null);
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
    { id: '1', position: { origin: new DOMPointReadOnly(0, 0), rotation: 0 } },
    { id: '2', position: { origin: new DOMPointReadOnly(50, 50), rotation: 30 } },
    { id: '3', position: { origin: new DOMPointReadOnly(100, 100), rotation: 45 } },
    { id: '4', position: { origin: new DOMPointReadOnly(150, 150), rotation: 60 } },
    { id: '5', position: { origin: new DOMPointReadOnly(200, 200), rotation: 75 } },
    { id: '6', position: { origin: new DOMPointReadOnly(250, 250), rotation: 90 } },
    { id: '7', position: { origin: new DOMPointReadOnly(300, 300), rotation: 180 } },

    // new DOMMatrix('translate(0px, 0px) rotateZ(0) scale(1, 1)'),
    // new DOMMatrix('translate(50px, 50px) rotateZ(30deg) scale(1, 1)'),
    // new DOMMatrix('translate(100px, 100px) rotateZ(45deg) scale(1, 1)'),
    // new DOMMatrix('translate(150px, 150px) rotateZ(60deg) scale(1, 1)'),
    // new DOMMatrix('translate(200px, 200px) rotateZ(75deg) scale(1.2, 1.2)'),
    // new DOMMatrix('translate(250px, 250px) rotateZ(90deg) scale(0.8, 0.8)'),
  ])

  const createShip = (): Path2D => { 
    const shipPath = new Path2D();

    const halfWidth = IDENTITY_SHIP_WIDTH / 2;
    const halfLength = IDENTITY_SHIP_LENGTH / 2;

    shipPath.moveTo((-halfWidth) + 0, (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + IDENTITY_SHIP_WIDTH, (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + IDENTITY_SHIP_WIDTH, (-halfLength) + IDENTITY_SHIP_LENGTH_OFFSET);
    shipPath.lineTo((-halfWidth) + IDENTITY_SHIP_WIDTH_OFFSET, (-halfLength) + IDENTITY_SHIP_LENGTH);
    shipPath.lineTo((-halfWidth) + IDENTITY_SHIP_SIDE_OFFSET, (-halfLength) + IDENTITY_SHIP_LENGTH);
    shipPath.lineTo((-halfWidth) + 0, (-halfLength) + IDENTITY_SHIP_LENGTH_OFFSET);
    shipPath.lineTo((-halfWidth) + 0, (-halfLength) + 0);

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
    
    if (selectedShipId() === ship.id) {
      drawShipTools(ship);
    }
    
    // ctx.resetTransform();
    
    // const shipPosition = ship.position;
    // const path = new Path2D();
    // const shipTransformationMatrix = getShipDomMatrix(shipPosition);
    // path.addPath(createShip(), shipTransformationMatrix)
    
    const ctx = context()!;
    ctx.strokeStyle = color();
    ctx.setTransform(getShipDomMatrix(ship.position));
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

  const drawShipTools = (ship: Ship): void => {

    const ctx = context()!;

    ctx.strokeStyle = color();
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    ctx.beginPath();
    ctx.arc(0, 0, panToolRadius(), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius(), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolOuterRadius(), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 2*Math.PI)
    
    ctx.stroke();
  }

  const getShipDomMatrix = (shipPosition: ShipPosition): DOMMatrix => {
    return new DOMMatrix(
      `translate(${shipPosition.origin.x}px, ${shipPosition.origin.y}px) rotateZ(${shipPosition.rotation}deg) scale(${scale()}, ${scale()})`
    );
  }

  const getSelectedShip = (): Ship | null => {
    return ships().find(s => s.id === selectedShipId()) || null;
  }

  const panToolRadius = () => {
    return scaledShipLength() * 0.2;
  }

  const rotateToolInnerRadius = () => {
    return scaledShipLength() * 0.6;
  } 

  const rotateToolOuterRadius = () => {
    return rotateToolInnerRadius() + (ROTATE_TOOL_WIDTH * scale());
  }

  const scaledShipLength = (): number => {
    return IDENTITY_SHIP_LENGTH * scale();
  }

  const scaledShipWidth = (): number => {
    return IDENTITY_SHIP_WIDTH * scale();
  }

  const isPositionInShip = (position: DOMPointReadOnly, shipMatrix: DOMMatrix): boolean => {
    const inverseMatrix = shipMatrix.inverse();

    const DOMPointReadOnly = inverseMatrix.transformPoint(position);
    
    return isPointInIdentityShip(DOMPointReadOnly);
  }

  const findClickedShip = (position: DOMPointReadOnly): Ship | null => {
    
    for (let index = 0; index < ships().length; index++) {
      const ship = ships()[index];
      
      if (isPositionInShip(position, getShipDomMatrix(ship.position))) {
        return ship;
      }
    }

    return null;
  }

  const isPointInIdentityShip = (point: DOMPointReadOnly): boolean => {
    // point is adjusted to compensate for the fact that the ship origin is in the center of the ship, instead of an endpoint
    const adjustedPoint = new DOMPointReadOnly(point.x + IDENTITY_SHIP_WIDTH / 2, point.y + IDENTITY_SHIP_LENGTH / 2);

    const isWithinXBounds = adjustedPoint.x >= 0 && adjustedPoint.x <= IDENTITY_SHIP_WIDTH;
    const isWithinYBounds = adjustedPoint.y >= 0 && adjustedPoint.y <= IDENTITY_SHIP_LENGTH;

    if (isWithinXBounds && isWithinYBounds) {
      if (adjustedPoint.y <= IDENTITY_SHIP_LENGTH_OFFSET) {
        return true;
      }
  
      if (adjustedPoint.y <= IDENTITY_SHIP_LENGTH) {
        return (adjustedPoint.x <= IDENTITY_SHIP_WIDTH_OFFSET && adjustedPoint.x >= (adjustedPoint.y - IDENTITY_SHIP_LENGTH_OFFSET)) 
            || (adjustedPoint.x > IDENTITY_SHIP_WIDTH_OFFSET && adjustedPoint.x + (adjustedPoint.y - IDENTITY_SHIP_LENGTH_OFFSET) <= IDENTITY_SHIP_WIDTH);
      }
    }

    return false;
  }

  const isClickInTools = (ship: Ship, click: DOMPointReadOnly) => {

    const shipCenter = ship.position.origin;
    return getDistanceBetweenPoints(shipCenter, click) <= rotateToolOuterRadius();
  }

  const isClickOnPan = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {
      return getDistanceBetweenPoints(selectedShip.position.origin, click) <= panToolRadius();
    }

    return false;
  }

  const isClickOnRotate = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {
      const distanceToCenter = getDistanceBetweenPoints(selectedShip.position.origin, click);
      
      return distanceToCenter >= rotateToolInnerRadius()
          && distanceToCenter <= rotateToolOuterRadius();
    }

    return false;
  }

  const handleShipSelection = (click: DOMPointReadOnly) => {

    const clickedShip = findClickedShip(click);
    setSelectedShipId(clickedShip?.id || null);
  }

  const getMouseEventPosition = (event: MouseEvent) => {
    const canvas = document.getElementById('canvas')!;
    
    const canvasX = event.clientX - canvas.offsetLeft;
    const canvasY = event.clientY - canvas.offsetTop;
    
    return new DOMPointReadOnly(canvasX, canvasY);
  }

  const handleToolsCommand = (clickPosition: DOMPointReadOnly) => {
    if (isClickOnPan(clickPosition)) {

      setMouseHoldStart(clickPosition);
      setActiveCommand('pan');
    } else if (isClickOnRotate(clickPosition)) {

      setMouseHoldStart(clickPosition);
      setActiveCommand('rotate');

      const selectedShip = getSelectedShip()!;
      getAngleBetweenPoints(selectedShip.position.origin, clickPosition)
    }
  }
  
  const handleMouseDown = (event: MouseEvent) => {
    
    const clickPosition = getMouseEventPosition(event);

    if (!!selectedShipId() && isClickInTools(getSelectedShip()!, clickPosition)) {
      handleToolsCommand(clickPosition);
    } else {
      handleShipSelection(clickPosition);
    }
  }

  const handleMouseUp = (event: MouseEvent) => {

    if (!activeCommand()) {
      return;
    }

    if (activeCommand() === 'pan') {
      handlePanMove(event, true);
    } else if (activeCommand() === 'rotate') {
      handleRotate(event, true);
    }
  }

  const handleMouseMove = (event: MouseEvent) => {

    if (!activeCommand()) {
      return;
    }

    if (activeCommand() === 'pan') {
      handlePanMove(event, false);
    } else if (activeCommand() === 'rotate') {
     handleRotate(event, false);
    }
  }

  const handleRotate = (event: MouseEvent, shouldEndRotation: boolean) => {

    const mouseHoldStartPosition = mouseHoldStart();
    if (!mouseHoldStartPosition) {
      return;
    }
    
    const selectedShipCenterPoint = getSelectedShip()!.position.origin;
    const rotateEndPosition = getMouseEventPosition(event);
    
    const rotateStartAngle = getAngleBetweenPoints(selectedShipCenterPoint, mouseHoldStartPosition);
    const rotateEndAngle = getAngleBetweenPoints(selectedShipCenterPoint, rotateEndPosition);

    const modifiedShip = { ...getSelectedShip()! }
    modifiedShip.position.rotation = modifiedShip.position.rotation + rotateEndAngle - rotateStartAngle;
    setShips((currentShips) => currentShips
      .filter(s => s.id !== modifiedShip.id)
      .concat([modifiedShip])
    );

    if (shouldEndRotation) {
      setMouseHoldStart(null);
      setActiveCommand(null);
    } else {
      setMouseHoldStart(rotateEndPosition);
    }
  }

  const handlePanMove = (event: MouseEvent, shouldEndPanning: boolean) => {

    const mouseHoldStartPosition = mouseHoldStart();
    if (!mouseHoldStartPosition) {
      return;
    }

    const panEndPosition = getMouseEventPosition(event);
  
    const dx = panEndPosition.x - mouseHoldStartPosition.x;
    const dy = panEndPosition.y - mouseHoldStartPosition.y;

    const modifiedShip = { ...getSelectedShip()! }
    modifiedShip.position.origin = new DOMPointReadOnly(
      modifiedShip.position.origin.x + dx, 
      modifiedShip.position.origin.y + dy 
    );

    setShips((currentShips) => currentShips
      .filter(s => s.id !== modifiedShip.id)
      .concat([modifiedShip])
    );
    
    if (shouldEndPanning) {
      setMouseHoldStart(null);
    } else {
      setMouseHoldStart(panEndPosition);
    }
  }

  return (
    <>
      <canvas 
        id='canvas' 
        width={CANVAS_LENGTH} 
        height={CANVAS_WIDTH} 
        style={{ 'border': '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      ></canvas>
    </>
  )
}

export default App;
