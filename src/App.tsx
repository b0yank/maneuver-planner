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

const IDENTITY_SHIP_LENGTH = 311;
const IDENTITY_SHIP_WIDTH = 38;
const IDENTITY_SHIP_SIDE_OFFSET = 11;

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

  const [identityShipLength, setIdentityShipLength] = createSignal<number>(311);
  const [identityShipWidth, setIdentityShipWidth] = createSignal<number>(38);

  const [bgImage, setBgImage] = createSignal<{ url: string, width: number, height: number } | null>(null);
  const [strokeColor, setStrokeColor] = createSignal<string>('black');
  const [shipStrokeColor, setShipStrokeColor] = createSignal<string>('#020595');
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

  const identityShipSideOffset = () => identityShipWidth() * 0.3;
  const identityShipLengthOffset = () => identityShipLength() - identityShipSideOffset();
  const identityShipWidthOffset = () => identityShipWidth() - identityShipSideOffset();
  
  const panOrthoTriangleHalfWidth = () => Math.min(Math.max(identityShipWidth() * 0.3, 8), 20);
  const panToolRadius = () => identityShipLength() * 0.35;
  const panToolInnerOrthoRadius = () => panToolRadius() + panOrthoTriangleHalfWidth() * 0.1; // TODO: fix as scaling ship length leaves a wider gap b/n pan & rotate
  const panToolOuterOrthoRadius = () => panToolInnerOrthoRadius() + panOrthoTriangleHalfWidth() * 2.2;

  const rotateToolInnerRadius = () => panToolOuterOrthoRadius();
  const rotateToolOuterRadius = () => rotateToolInnerRadius() + rotateToolWidth();

  const scaledShipLength = () => identityShipLength() * scale();
  const scaledShipWidth = () => identityShipWidth() * scale();

  const rotateToolWidth = () => identityShipLength() * 0.15;

  const createShip = (): Path2D => { 

    const ctx = context()!;
    ctx.beginPath();

    const shipPath = new Path2D();

    const halfWidth = identityShipWidth() / 2;
    const halfLength = identityShipLength() / 2;

    shipPath.moveTo((-halfWidth) + 0, (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + identityShipWidth(), (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + identityShipWidth(), (-halfLength) + identityShipLengthOffset());
    shipPath.lineTo((-halfWidth) + identityShipWidthOffset(), (-halfLength) + identityShipLength());
    shipPath.lineTo((-halfWidth) + identityShipSideOffset(), (-halfLength) + identityShipLength());
    shipPath.lineTo((-halfWidth) + 0, (-halfLength) + identityShipLengthOffset());
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

    ctx.fillStyle = shipStrokeColor();
    ctx.lineWidth = 3;
    ctx.strokeStyle = shipStrokeColor();
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

    const selectedShip = getSelectedShip();
    if (selectedShip) {
      drawShipCourse();
    }
  }

  const drawShipTools = (ship: Ship): void => {

    const ctx = context()!;

    ctx.lineWidth = lineWidth();
    
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    ctx.fillStyle = shipStrokeColor() + '1A'; // adding 1A for transparency of HEX color
    drawPanTool();
    
    ctx.strokeStyle = shipStrokeColor() + '1A'; // adding 1A for transparency of HEX color
    drawRotateTool();

    ctx.strokeStyle = strokeColor();
    ctx.fillStyle = shipStrokeColor();
  }

  const drawPanTool = () => {

    const ctx = context()!;
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.arc(0, 0, panToolRadius(), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(panToolOuterOrthoRadius(), 0);
    ctx.beginPath();
    ctx.lineTo(panToolInnerOrthoRadius(), -panOrthoTriangleHalfWidth());
    ctx.lineTo(panToolInnerOrthoRadius(), panOrthoTriangleHalfWidth());
    ctx.lineTo(panToolOuterOrthoRadius(), 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(-panToolOuterOrthoRadius(), 0);
    ctx.beginPath();
    ctx.lineTo(-panToolInnerOrthoRadius(), panOrthoTriangleHalfWidth());
    ctx.lineTo(-panToolInnerOrthoRadius(), -panOrthoTriangleHalfWidth());
    ctx.lineTo(-panToolOuterOrthoRadius(), 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(0, panToolOuterOrthoRadius());
    ctx.beginPath();
    ctx.lineTo(-panOrthoTriangleHalfWidth(), panToolInnerOrthoRadius());
    ctx.lineTo(panOrthoTriangleHalfWidth(), panToolInnerOrthoRadius());
    ctx.lineTo(0, panToolOuterOrthoRadius());
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.moveTo(0, -panToolOuterOrthoRadius());
    ctx.beginPath();
    ctx.lineTo(panOrthoTriangleHalfWidth(), -panToolInnerOrthoRadius());
    ctx.lineTo(-panOrthoTriangleHalfWidth(), -panToolInnerOrthoRadius());
    ctx.lineTo(0, -panToolOuterOrthoRadius());
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  const drawRotateTool = () => {

    const ctx = context()!;

    ctx.strokeStyle = shipStrokeColor() + '1A'; // adding 1A for transparency of HEX color

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius() + (rotateToolOuterRadius() - rotateToolInnerRadius()) / 2, 0, 2 * Math.PI);
    ctx.lineWidth = rotateToolOuterRadius() - rotateToolInnerRadius();
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
  }

  const drawShipCourse = () => {

    const ctx = context()!;
    ctx.font = "48px serif";

    const initialFillStyle = ctx.fillStyle;
    ctx.fillStyle = 'black';

    const selectedShip = getSelectedShip()!;

    ctx.fillText(
      `00${canvasDegreesToShipCourseDegrees(selectedShip.position.rotation).toFixed(1)}°`.slice(-6), 
      selectedShip.position.origin.x + 35, 
      selectedShip.position.origin.y - rotateToolOuterRadius() 
    );

    ctx.fillStyle = initialFillStyle;
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

  const canvasDegreesToShipCourseDegrees = (canvasDegrees: number) => (canvasDegrees + 180) % 360

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
    const adjustedPoint = new DOMPointReadOnly(point.x + identityShipWidth() / 2, point.y + identityShipLength() / 2);

    const isWithinXBounds = adjustedPoint.x >= 0 && adjustedPoint.x <= identityShipWidth();
    const isWithinYBounds = adjustedPoint.y >= 0 && adjustedPoint.y <= identityShipLength();

    if (isWithinXBounds && isWithinYBounds) {
      if (adjustedPoint.y <= identityShipLengthOffset()) {
        return true;
      }
  
      if (adjustedPoint.y <= identityShipLength()) {
        return (adjustedPoint.x <= identityShipWidthOffset() && adjustedPoint.x >= (adjustedPoint.y - identityShipLengthOffset())) 
            || (adjustedPoint.x > identityShipWidthOffset() && adjustedPoint.x + (adjustedPoint.y - identityShipLengthOffset()) <= identityShipWidth());
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
      new DOMPointReadOnly(-panToolInnerOrthoRadius(), panOrthoTriangleHalfWidth()),
      new DOMPointReadOnly(-panToolInnerOrthoRadius(), -panOrthoTriangleHalfWidth()),
      new DOMPointReadOnly(-panToolOuterOrthoRadius(), 0),
    );
  }
  
  const isClickInLeftPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(panToolInnerOrthoRadius(), -panOrthoTriangleHalfWidth()),
      new DOMPointReadOnly(panToolInnerOrthoRadius(), panOrthoTriangleHalfWidth()),
      new DOMPointReadOnly(panToolOuterOrthoRadius(), 0),
    );
  }

  const isClickInTopPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(-panOrthoTriangleHalfWidth(), panToolInnerOrthoRadius()),
      new DOMPointReadOnly(panOrthoTriangleHalfWidth(), panToolInnerOrthoRadius()),
      new DOMPointReadOnly(0, panToolOuterOrthoRadius()),
    );
  }
  
  const isClickInBottomPanTriangle = (ship: Ship, click: DOMPointReadOnly) => {
    
    return isPointInTriangle(
      transformPointByInverseShipMatrix(click, ship),
      new DOMPointReadOnly(panOrthoTriangleHalfWidth(), -panToolInnerOrthoRadius()),
      new DOMPointReadOnly(-panOrthoTriangleHalfWidth(), -panToolInnerOrthoRadius()),
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
      {/* <NumberInput value={scale()} setValue={setScale} min={0.2} max={3.0} step={0.05} /> */}
      <h4>Ship length</h4>
      <NumberInput value={identityShipLength()} setValue={setIdentityShipLength} min={5} step={1} />
      <h4>Ship width</h4>
      <NumberInput value={identityShipWidth()} setValue={setIdentityShipWidth} min={1} step={1} />
      <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '1rem' }}>
        <input type='color' value={shipStrokeColor()} onChange={(e) => setShipStrokeColor(e.target.value)} title="Select ship color" />
        <BgImageInput value={bgImage()} setValue={setBgImage} />
      </div>
      {/* <div>{pos()?.x}, {pos()?.y}</div> */}
    </div>
    </>
  )
}

export default App;
