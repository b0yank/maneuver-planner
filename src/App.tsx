import { createEffect, createSignal, onCleanup } from 'solid-js';
import './App.css';
import { ShipPosition } from './models/ship-position.model';
import { Ship } from './models/ship.model';
import { getAngleBetweenPoints, getDistanceBetweenPoints, getRotatedPoint } from './utils/points';
import { getClosestPointToLine, isPointInTriangle } from './utils/lines';
import { Line } from './models/line.model';
import { NumberInput } from './components/NumberInput/NumberInput';
import { BgImageInput } from './components/BgImageInput/BgImageInput';

const CANVAS_LENGTH = 1600;
const CANVAS_WIDTH = 800;

const IDENTITY_SHIP_LENGTH = 120;
const IDENTITY_SHIP_WIDTH = 25;
const IDENTITY_SHIP_SIDE_OFFSET = 8;

const IDENTITY_SHIP_LENGTH_OFFSET = IDENTITY_SHIP_LENGTH - IDENTITY_SHIP_SIDE_OFFSET;
const IDENTITY_SHIP_WIDTH_OFFSET = IDENTITY_SHIP_WIDTH - IDENTITY_SHIP_SIDE_OFFSET;

const ROTATE_TOOL_WIDTH = 10;

const PAN_ORTHO_TRIANGLE_HALF_WIDTH = 7;

const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_STROKE_STYLE = '#000000';
const DEFAULT_FILL_STYLE = '#121212';

const TOOLS_COLOR = '#234567';

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();
  const [bgImage, setBgImage] = createSignal<{ url: string, width: number, height: number } | null>(null);
  const [strokeColor, setStrokeColor] = createSignal<string>('black');
  const [fillColor, setFillColor] = createSignal<string>('#327c84');
  const [lineWidth, setLineWidth] = createSignal<number>(1);
  const [scale, setScale] = createSignal<number>(1);
  const [mouseHoldStart, setMouseHoldStart] = createSignal<DOMPointReadOnly | null>(null);
  const [selectedShipId, setSelectedShipId] = createSignal<string | null>(null);
  const [activeCommand, setActiveCommand] = createSignal<'pan' | 'rotate' | 'copy' | null>(null);
  const [movementLine, setMovementLine] = createSignal<Line | null>(null);
  const [pos, setPos] = createSignal<DOMPoint | null>(null);

  const [shiftPressed, setShiftPressed] = createSignal<boolean>(false);
  const [ctrlPressed, setCtrlPressed] = createSignal<boolean>(false);

  let nextId = '8';
  let canvasObserver: MutationObserver;

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
    new Ship('1', { origin: new DOMPointReadOnly(0, 0), rotation: 0 }),
    new Ship('2', { origin: new DOMPointReadOnly(50, 50), rotation: 30 }),
    new Ship('3', { origin: new DOMPointReadOnly(100, 100), rotation: 45 }),
    new Ship('4', { origin: new DOMPointReadOnly(150, 150), rotation: 60 }),
    new Ship('5', { origin: new DOMPointReadOnly(200, 200), rotation: 75 }),
    new Ship('6', { origin: new DOMPointReadOnly(250, 250), rotation: 90 }),
    new Ship('7', { origin: new DOMPointReadOnly(300, 300), rotation: 180 }),

    // new DOMMatrix('translate(0px, 0px) rotateZ(0) scale(1, 1)'),
    // new DOMMatrix('translate(50px, 50px) rotateZ(30deg) scale(1, 1)'),
    // new DOMMatrix('translate(100px, 100px) rotateZ(45deg) scale(1, 1)'),
    // new DOMMatrix('translate(150px, 150px) rotateZ(60deg) scale(1, 1)'),
    // new DOMMatrix('translate(200px, 200px) rotateZ(75deg) scale(1.2, 1.2)'),
    // new DOMMatrix('translate(250px, 250px) rotateZ(90deg) scale(0.8, 0.8)'),
  ])

  const createShip = (): Path2D => { 

    const ctx = context()!;
    ctx.beginPath();

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

    ctx.closePath();

    return shipPath;
  }

  const getNextShipId = () => {
    const id = nextId;

    nextId = (Number(nextId) + 1).toString();
    return id;
  }

  // const drawShip = (shipPosition: ShipPosition) => {
  //   const ctx = context()!;

  //   ctx.resetTransform();
  //   ctx.strokeStyle = strokeColor();

  //   const shipTransformationMatrix = scale().dot(shipPosition.rotate).dot(shipPosition.translate);

  //   const domMatrix = new DOMMatrix([])
  // }

  const drawShip = (ship: Ship) => {
    
    const ctx = context()!;
    ctx.strokeStyle = strokeColor();
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    const shipPath = createShip();

    ctx.fillStyle = fillColor();
    ctx.fill(shipPath);
    ctx.stroke(shipPath);

    if (selectedShipId() === ship.id) {
      drawShipTools(ship);
    }
  }

  // const drawShip = (ship: Ship) => {
  //   const ctx = context()!;

  //   ctx.resetTransform();
  //   ctx.strokeStyle = strokeColor();
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

    drawAllShips();
    
    canvasObserver = new MutationObserver(drawAllShips);
    canvasObserver.observe(canvas, { attributeFilter: ['width', 'height'] });

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  });
  
  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    canvasObserver.disconnect();
  });

  const drawAllShips = () => {

    const ctx = context()!;

    ctx.clearRect(0, 0, CANVAS_LENGTH, CANVAS_WIDTH);
    ctx.lineWidth = DEFAULT_LINE_WIDTH;
    ctx.strokeStyle = DEFAULT_STROKE_STYLE;
    ctx.fillStyle = DEFAULT_FILL_STYLE;

    ships().forEach(drawShip);
    ctx.resetTransform();
  }

  const drawShipTools = (ship: Ship): void => {

    const ctx = context()!;

    ctx.strokeStyle = strokeColor();
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    drawPanTool();
    drawRotateTool();
  }

  const drawPanTool = () => {

    const ctx = context()!;

    ctx.beginPath();
    ctx.arc(0, 0, panToolRadius(), 0, 2 * Math.PI);
    ctx.fillStyle = TOOLS_COLOR;
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(panToolOuterOrthoRadius(), 0);
    ctx.beginPath();
    ctx.lineTo(panToolInnerOrthoRadius(), -PAN_ORTHO_TRIANGLE_HALF_WIDTH);
    ctx.lineTo(panToolInnerOrthoRadius(), PAN_ORTHO_TRIANGLE_HALF_WIDTH);
    ctx.lineTo(panToolOuterOrthoRadius(), 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(-panToolOuterOrthoRadius(), 0);
    ctx.beginPath();
    ctx.lineTo(-panToolInnerOrthoRadius(), PAN_ORTHO_TRIANGLE_HALF_WIDTH);
    ctx.lineTo(-panToolInnerOrthoRadius(), -PAN_ORTHO_TRIANGLE_HALF_WIDTH);
    ctx.lineTo(-panToolOuterOrthoRadius(), 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(0, panToolOuterOrthoRadius());
    ctx.beginPath();
    ctx.lineTo(-PAN_ORTHO_TRIANGLE_HALF_WIDTH, panToolInnerOrthoRadius());
    ctx.lineTo(PAN_ORTHO_TRIANGLE_HALF_WIDTH, panToolInnerOrthoRadius());
    ctx.lineTo(0, panToolOuterOrthoRadius());
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(0, -panToolOuterOrthoRadius());
    ctx.beginPath();
    ctx.lineTo(PAN_ORTHO_TRIANGLE_HALF_WIDTH, -panToolInnerOrthoRadius());
    ctx.lineTo(-PAN_ORTHO_TRIANGLE_HALF_WIDTH, -panToolInnerOrthoRadius());
    ctx.lineTo(0, -panToolOuterOrthoRadius());
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.strokeStyle = strokeColor();
    ctx.fillStyle = fillColor();
  }

  const drawRotateTool = () => {

    const ctx = context()!;

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius() + (rotateToolOuterRadius() - rotateToolInnerRadius()) / 2, 0, 2 * Math.PI);
    ctx.lineWidth = rotateToolOuterRadius() - rotateToolInnerRadius();
    ctx.strokeStyle = TOOLS_COLOR;
    ctx.closePath();
    ctx.stroke();
    
    ctx.lineWidth = lineWidth();

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius(), 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, rotateToolOuterRadius(), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = strokeColor();
  }

  const getShipDomMatrix = (shipPosition: ShipPosition): DOMMatrix => {
    return new DOMMatrix(
      `translate(${shipPosition.origin.x}px, ${shipPosition.origin.y}px) rotateZ(${shipPosition.rotation}deg) scale(${scale()}, ${scale()})`
    );
  }

  const getShipCenterLine = (ship: Ship) => {
    const bowPointInitial = new DOMPointReadOnly(ship.position.origin.x, ship.position.origin.y + scaledShipLength() / 2);

    const bowPoint = getRotatedPoint(bowPointInitial, ship.position.origin, ship.position.rotation);
    return new Line(ship.position.origin, bowPoint);
  }

  const getShipMidshipLine = (ship: Ship) => {
    const portsidePointInitial = new DOMPointReadOnly(ship.position.origin.x + scaledShipWidth(), ship.position.origin.y);

    const portsidePoint = getRotatedPoint(portsidePointInitial, ship.position.origin, ship.position.rotation);
    return new Line(ship.position.origin, portsidePoint);
  }

  const getSelectedShip = (): Ship | null => {
    return ships().find(s => s.id === selectedShipId()) || null;
  }

  const panToolRadius = () => {
    return IDENTITY_SHIP_LENGTH * 0.2;
  }

  const panToolInnerOrthoRadius = () => {
    return panToolRadius() + 4;
  }

  const panToolOuterOrthoRadius = () => {
    return panToolRadius() + 12;
  }

  const rotateToolInnerRadius = () => {
    return IDENTITY_SHIP_LENGTH * 0.65;
  } 

  const rotateToolOuterRadius = () => {
    return rotateToolInnerRadius() + (ROTATE_TOOL_WIDTH);
  }

  const scaledShipLength = (): number => {
    return IDENTITY_SHIP_LENGTH * scale();
  }

  const scaledShipWidth = (): number => {
    return IDENTITY_SHIP_WIDTH * scale();
  }

  const isPositionInShip = (position: DOMPointReadOnly, ship: Ship): boolean => {

    const transformedPoint = transformPointByInverseShipMatrix(position, ship);
    
    return isPointInIdentityShip(transformedPoint);
  }

  const transformPointByInverseShipMatrix = (point: DOMPointReadOnly, ship: Ship) => {

    const shipMatrix = getShipDomMatrix(ship.position);
    const inverseShipMatrix = shipMatrix.inverse();

    return inverseShipMatrix.transformPoint(point);
  }

  const findClickedShip = (position: DOMPointReadOnly): Ship | null => {
    
    for (let index = 0; index < ships().length; index++) {
      const ship = ships()[index];
      
      if (isPositionInShip(position, ship)) {
        return ship;
      }
    }

    return null;
  }

  const copyShip = (ship: Ship, keepId: boolean): Ship => {
    return new Ship(
      keepId ? ship.id : getNextShipId(), 
      { rotation: ship.position.rotation, origin: DOMPointReadOnly.fromPoint(ship.position.origin) }
    );
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
    return getDistanceBetweenPoints(shipCenter, click) <= rotateToolOuterRadius() * scale();
  }

  const updateMovementLine = (click: DOMPointReadOnly): boolean => {

    const selectedShip = getSelectedShip()!;

    if (
      isClickInRightPanTriangle(selectedShip, click) ||
      isClickInLeftPanTriangle(selectedShip, click)
    ) {
      setMovementLine(getShipMidshipLine(selectedShip));
       
      return true;
    }
    
    if (
      isClickInTopPanTriangle(selectedShip, click) || 
      isClickInBottomPanTriangle(selectedShip, click)
    ) {
      setMovementLine(getShipCenterLine(selectedShip));
      
      return true;
    }
    
    if (movementLine() !== null) {
      setMovementLine(null);
    }

    return false;
  }

  const handlePan = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {

      const panningWithMovementLines = updateMovementLine(click);

      if (panningWithMovementLines || getDistanceBetweenPoints(selectedShip.position.origin, click) <= panToolRadius()) {
        setMouseHoldStart(click);

        if (shiftPressed()) {
          
          const shipCopy = copyShip(getSelectedShip()!, false);

          setShips(ships => [...ships, shipCopy]);
          setSelectedShipId(shipCopy.id);

        }
      
        setActiveCommand('pan');
        return true;
      }
    }

    return false;
  }

  const isClickInRightPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(-panToolInnerOrthoRadius(), PAN_ORTHO_TRIANGLE_HALF_WIDTH),
      new DOMPointReadOnly(-panToolInnerOrthoRadius(), -PAN_ORTHO_TRIANGLE_HALF_WIDTH),
      new DOMPointReadOnly(-panToolOuterOrthoRadius(), 0),
    );
  }
  
  const isClickInLeftPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(panToolInnerOrthoRadius(), -PAN_ORTHO_TRIANGLE_HALF_WIDTH),
      new DOMPointReadOnly(panToolInnerOrthoRadius(), PAN_ORTHO_TRIANGLE_HALF_WIDTH),
      new DOMPointReadOnly(panToolOuterOrthoRadius(), 0),
    );
  }

  const isClickInTopPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(-PAN_ORTHO_TRIANGLE_HALF_WIDTH, panToolInnerOrthoRadius()),
      new DOMPointReadOnly(PAN_ORTHO_TRIANGLE_HALF_WIDTH, panToolInnerOrthoRadius()),
      new DOMPointReadOnly(0, panToolOuterOrthoRadius()),
    );
  }
  
  const isClickInBottomPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(PAN_ORTHO_TRIANGLE_HALF_WIDTH, -panToolInnerOrthoRadius()),
      new DOMPointReadOnly(-PAN_ORTHO_TRIANGLE_HALF_WIDTH, -panToolInnerOrthoRadius()),
      new DOMPointReadOnly(0, -panToolOuterOrthoRadius()),
    );
  }

  const isClickOnRotate = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {
      const distanceToCenter = getDistanceBetweenPoints(selectedShip.position.origin, click);
      
      return distanceToCenter >= (rotateToolInnerRadius() * scale())
          && distanceToCenter <= (rotateToolOuterRadius() * scale());
    }

    return false;
  }

  const handleShipSelection = (click: DOMPointReadOnly) => {

    const clickedShip = findClickedShip(click);
    setSelectedShipId(clickedShip?.id || null);
  }

  const getMouseEventPosition = (event: MouseEvent | TouchEvent) => {
    const canvas = document.getElementById('canvas')!;

    const canvasOffsetTop = canvas.getBoundingClientRect().top + document.documentElement.scrollTop;
    const canvasOffsetLeft = canvas.getBoundingClientRect().left + document.documentElement.scrollLeft;
    
    const mousePageX = event instanceof MouseEvent ? event.pageX : event.touches.item(0)!.pageX;
    const mousePageY = event instanceof MouseEvent ? event.pageY : event.touches.item(0)!.pageY;
    
    const canvasX = mousePageX - canvasOffsetLeft;
    const canvasY = mousePageY - canvasOffsetTop;

    return new DOMPointReadOnly(canvasX, canvasY);
  }

  const handleToolsCommand = (clickPosition: DOMPointReadOnly): boolean => {

    const commandHandled = handlePan(clickPosition);

    if (commandHandled) {
      return true;
    }

    if (isClickOnRotate(clickPosition)) {

      setMouseHoldStart(clickPosition);
      setActiveCommand('rotate');

      // const selectedShip = getSelectedShip()!;
      // getAngleBetweenPoints(selectedShip.position.origin, clickPosition);
      return true
    }

    return false;
  }
  
  const handleMouseDown = (event: MouseEvent | TouchEvent) => {
    
    const clickPosition = getMouseEventPosition(event);
    
    let inputHandled = false;
    if (!!selectedShipId() && isClickInTools(getSelectedShip()!, clickPosition)) { 
      inputHandled = handleToolsCommand(clickPosition);
    }

    if (!inputHandled) {
      handleShipSelection(clickPosition);
    }
  }

  const handleMouseUp = (event: MouseEvent | TouchEvent) => {

    if (!activeCommand()) {
      return;
    }

    if (activeCommand() === 'pan') {
      handlePanMove(event, true);
    } else if (activeCommand() === 'rotate') {
      handleRotate(event, true);
    }
  }

  const handleMouseMove = (event: MouseEvent | TouchEvent) => {
    setPos(getMouseEventPosition(event))
    if (activeCommand() === 'pan') {
      handlePanMove(event, false);
    } else if (activeCommand() === 'rotate') {
      handleRotate(event, false);
    }
  }

  const handleRotate = (event: MouseEvent | TouchEvent, shouldEndRotation: boolean) => {

    const mouseHoldStartPosition = mouseHoldStart();
    if (!mouseHoldStartPosition) {
      return;
    }
    
    const selectedShipCenterPoint = getSelectedShip()!.position.origin;
    const rotateEndPosition = getMouseEventPosition(event);
    
    const rotateStartAngle = getAngleBetweenPoints(selectedShipCenterPoint, mouseHoldStartPosition);
    const rotateEndAngle = getAngleBetweenPoints(selectedShipCenterPoint, rotateEndPosition);

    const modifiedShip = copyShip(getSelectedShip()!, true);
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

  const handlePanMove = (event: MouseEvent | TouchEvent, shouldEndPanning: boolean) => {

    const mouseHoldStartPosition = mouseHoldStart();
    if (!mouseHoldStartPosition) {
      return;
    }

    const panEndPosition = getMouseEventPosition(event);
  
    const dx = panEndPosition.x - mouseHoldStartPosition.x;
    const dy = panEndPosition.y - mouseHoldStartPosition.y;

    const modifiedShip = copyShip(getSelectedShip()!, true);
    
    let newShipOrigin = new DOMPointReadOnly(
      modifiedShip.position.origin.x + dx, 
      modifiedShip.position.origin.y + dy 
    );

    const currentMovementLine = movementLine();
    if (currentMovementLine) {
      newShipOrigin = getClosestPointToLine(currentMovementLine, newShipOrigin);
    }

    modifiedShip.position.origin = newShipOrigin;

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

  const handleKeyDown = (event: KeyboardEvent) => {

    if (event.shiftKey !== shiftPressed()) {
      setShiftPressed(event.shiftKey);
    }

    if (event.ctrlKey !== ctrlPressed()) {
      setCtrlPressed(event.ctrlKey);
    }
  }
  
  const handleKeyUp = (event: KeyboardEvent) => {
    
    if (event.shiftKey !== shiftPressed()) {
      setShiftPressed(event.shiftKey);
    }

    const selectedShip = getSelectedShip();

    if (event.key === 'Delete' && selectedShip) {
      setShips(
        ships().filter(ship => ship.id !== selectedShip.id)
      );

      setSelectedShipId(null);
    }
  }

  const log = (event: any) => console.log(event); 

  return (
    <>
    <canvas
      id='canvas' 
      width={bgImage() ? bgImage()!.width : CANVAS_LENGTH} 
      height={bgImage() ? bgImage()!.height : CANVAS_WIDTH} 
      class='canvas'
      style={{ 'background-image': bgImage() ? `url(${bgImage()!.url})` : 'none' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    ></canvas>
    <div class="menu-container"> 
      <NumberInput value={scale()} setValue={setScale} min={0.25} max={3.0} step={0.25} />
      <input type='color' value={fillColor()} onChange={(e) => setFillColor(e.target.value)} />
      <BgImageInput value={bgImage()} setValue={setBgImage} />
      <div>{pos()?.x}, {pos()?.y}</div>
    </div>
    </>
  )
}

export default App;
