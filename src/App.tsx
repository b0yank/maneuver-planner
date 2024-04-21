import { createEffect, createSignal, onCleanup } from 'solid-js';
import './App.css';
import { ShipPosition } from './models/ship-position.model';
import { Ship } from './models/ship.model';
import { getAngleBetweenPoints, getDistanceBetweenPoints } from './utils/points';
import { NumberInput } from './components/NumberInput/NumberInput';
import { BgImageInput } from './components/BgImageInput/BgImageInput';

const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_STROKE_STYLE = '#000000';
const DEFAULT_FILL_STYLE = '#121212';
const DEFAULT_SHIP_STROKE_COLOR = '#020595';

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();

  const [identityShipLength, setIdentityShipLength] = createSignal<number>(311);
  const [identityShipWidth, setIdentityShipWidth] = createSignal<number>(38);

  const [bgImage, setBgImage] = createSignal<{ url: string, width: number, height: number } | null>(null);
  const [strokeColor, _setStrokeColor] = createSignal<string>('black');
  const [shipStrokeColor, setShipStrokeColor] = createSignal<string>(DEFAULT_SHIP_STROKE_COLOR);
  const [lineWidth, _setLineWidth] = createSignal<number>(1);
  const [mouseHoldStart, setMouseHoldStart] = createSignal<DOMPointReadOnly | null>(null);
  const [selectedShipId, setSelectedShipId] = createSignal<string | null>(null);
  const [activeCommand, setActiveCommand] = createSignal<'pan' | 'rotate' | 'copy' | null>(null);

  const [shiftPressed, setShiftPressed] = createSignal<boolean>(false);
  const [ctrlPressed, setCtrlPressed] = createSignal<boolean>(false);

  const [menuPositionFromTopRight, setMenuPositionFromTopRight] = createSignal<DOMPointReadOnly>(new DOMPointReadOnly(0, 0));
  const [menuDragStart, setMenuDragStart] = createSignal<DOMPointReadOnly | null>(null);

  let nextId = '2';
  let canvasObserver: MutationObserver;

  const canvasWidth = () => {
    return bgImage() ? bgImage()!.width : (document.documentElement.clientWidth * 0.95);
  }

  const canvasHeight = () => {
    return bgImage() ? bgImage()!.height : (document.documentElement.clientHeight * 0.95);
  }
  console.log(shipStrokeColor());
  
  const [ships, setShips] = createSignal<Ship[]>([
    new Ship('1', { origin: new DOMPointReadOnly(canvasWidth() / 2, canvasHeight() / 2), rotation: 180 }, shipStrokeColor()),
  ])

  const identityShipSideOffset = () => identityShipWidth() * 0.3;
  const identityShipLengthOffset = () => identityShipLength() - identityShipSideOffset();
  const identityShipWidthOffset = () => identityShipWidth() - identityShipSideOffset();
  
  const panToolRadius = () => identityShipLength() * 0.30;

  const rotateToolInnerRadius = () => panToolRadius() * 1.05;
  const rotateToolOuterRadius = () => rotateToolInnerRadius() + rotateToolWidth();

  const rotateToolWidth = () => identityShipLength() * 0.25;

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

  const drawShip = (ship: Ship) => {
    
    const ctx = context()!;
    ctx.strokeStyle = strokeColor();
    ctx.setTransform(getShipDomMatrix(ship.position));
    
    const shipPath = createShip();

    ctx.fillStyle = ship.strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeStyle = ship.strokeColor;
    ctx.stroke(shipPath);

    if (selectedShipId() === ship.id) {
      drawShipTools(ship);
    }
  }

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

    const menu = document.getElementById('menu') as HTMLDivElement | null;
    if (!menu) {
      throw new Error('Cannot find menu element');
    }

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

    ctx.clearRect(0, 0, canvasWidth(), canvasHeight());
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
    
    ctx.fillStyle = ship.strokeColor + '33'; // adding 1A for transparency of HEX color
    drawPanTool();
    
    ctx.strokeStyle = ship.strokeColor + '1A'; // adding 1A for transparency of HEX color
    drawRotateTool();

    ctx.strokeStyle = strokeColor();
    ctx.fillStyle = ship.strokeColor;
  }

  const drawPanTool = () => {

    const ctx = context()!;
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.arc(0, 0, panToolRadius(), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  const drawRotateTool = () => {

    const ctx = context()!;

    const selectedShip = getSelectedShip();
    ctx.strokeStyle = selectedShip!.strokeColor + '1A'; // adding 1A for transparency of HEX color

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
    ctx.font = "36px serif";

    const initialFillStyle = ctx.fillStyle;
    ctx.fillStyle = 'black';

    const selectedShip = getSelectedShip()!;

    const textOrigin = getShipDomMatrix(selectedShip.position)
      .transformPoint(new DOMPointReadOnly(0, rotateToolOuterRadius()));

    const rotationInDegreesFromNorth = Math.round(canvasDegreesToShipCourseDegrees(selectedShip.position.rotation)) % 360;

    const isInLeftHalfPlane = rotationInDegreesFromNorth > 180;
    const isInTopHalfPlane = rotationInDegreesFromNorth < 90 || rotationInDegreesFromNorth > 270;

    ctx.textAlign = isInLeftHalfPlane ? 'right' : 'left';
    ctx.textBaseline = isInTopHalfPlane ? 'bottom' : 'top';
    ctx.fillText(
      `00${rotationInDegreesFromNorth}°`.slice(-4), 
      textOrigin.x, 
      textOrigin.y
    );

    ctx.fillStyle = initialFillStyle;
  }

  const getShipDomMatrix = (shipPosition: ShipPosition): DOMMatrix => {
    return new DOMMatrix(
      `translate(${shipPosition.origin.x}px, ${shipPosition.origin.y}px) rotateZ(${shipPosition.rotation}deg)`
    );
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
    console.log(ship.strokeColor);
    
    return new Ship(
      keepId ? ship.id : getNextShipId(), 
      { rotation: ship.position.rotation, origin: DOMPointReadOnly.fromPoint(ship.position.origin) },
      ship.strokeColor
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
    return getDistanceBetweenPoints(shipCenter, click) <= rotateToolOuterRadius();
  }

  const handlePan = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {

      if (getDistanceBetweenPoints(selectedShip.position.origin, click) <= panToolRadius()) {
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
    
    const selectedShip = getSelectedShip();
    if (!selectedShip) {
      return;
    }

    const selectedShipCenterPoint = selectedShip.position.origin;
    const rotateEndPosition = getMouseEventPosition(event);
    
    const rotateStartAngle = getAngleBetweenPoints(selectedShipCenterPoint, mouseHoldStartPosition);
    const rotateEndAngle = getAngleBetweenPoints(selectedShipCenterPoint, rotateEndPosition);

    const modifiedShip = copyShip(selectedShip, true);
    modifiedShip.position.rotation = (360 + (modifiedShip.position.rotation + rotateEndAngle - rotateStartAngle)) % 360;
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
    
    const newShipOrigin = new DOMPointReadOnly(
      modifiedShip.position.origin.x + dx, 
      modifiedShip.position.origin.y + dy 
    );

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

  const startMenuDrag = (event: MouseEvent) => {
    const dragStartPoint = getMouseEventPosition(event);
    setMenuDragStart(dragStartPoint);
  }

  const dragMenu = (event: MouseEvent) => {
    
    const oldDragPoint = menuDragStart();
    if (oldDragPoint) {
      const mousePosition = getMouseEventPosition(event);

      const menuPosition = menuPositionFromTopRight();
      const menu = document.getElementById('menu');
      const newMenuPosition = new DOMPointReadOnly(
        Math.min(Math.max(menuPosition.x + oldDragPoint.x - mousePosition.x, 0), canvasWidth() - (menu?.clientWidth || 0)),
        Math.min(Math.max(menuPosition.y + mousePosition.y - oldDragPoint.y, 0), canvasHeight() - (menu?.clientHeight || 0)),
      );
      
      setMenuPositionFromTopRight(newMenuPosition);
      setMenuDragStart(mousePosition);
    }
  }

  const endMenuDrag = () => {
    setMenuDragStart(null);
  }

  const selectShipColor = (event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement; }) => {
    
    const selectedShip = getSelectedShip();
    if (selectedShip) {
      
      selectedShip.strokeColor = event.target.value;
      setShips(ships =>
        ships.map(ship => {
          if (ship.id === selectedShip.id) {
            const selectedShipCopy = copyShip(selectedShip, true);
            selectedShipCopy.strokeColor = event.target.value;
            return selectedShipCopy;
          }

          return ship;
        })
      )
    } else {
      setShips(ships => 
        ships.map(ship => {
          const shipCopy = copyShip(ship, true);
          shipCopy.strokeColor = event.target.value;
          return shipCopy;
        })
      );

      setShipStrokeColor(event.target.value);
    }
  }

  // const log = (event: any) => console.log(event); 

  return (
    <>
    <canvas
      id='canvas' 
      width={canvasWidth()} 
      height={canvasHeight()} 
      class='canvas'
      style={{ 'background-image': bgImage() ? `url(${bgImage()!.url})` : 'none' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    ></canvas>
    <div 
      id="menu"
      style={{
        top: `${menuPositionFromTopRight().y.toString()}px`,
        right: `${menuPositionFromTopRight().x.toString()}px`,
      }}
      onMouseDown={startMenuDrag}
      onMouseMove={dragMenu}
      onMouseUp={endMenuDrag}
    > 
      {/* <NumberInput value={scale()} setValue={setScale} min={0.2} max={3.0} step={0.05} /> */}
      <h4>Ship length</h4>
      <NumberInput value={identityShipLength()} setValue={setIdentityShipLength} min={5} step={1} />
      <h4>Ship width</h4>
      <NumberInput value={identityShipWidth()} setValue={setIdentityShipWidth} min={1} step={1} />
      <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '1rem' }}>
        <input type='color' value={getSelectedShip()?.strokeColor || shipStrokeColor()} onInput={selectShipColor} title="Select ship color" />
        <BgImageInput value={bgImage()} setValue={setBgImage} />
      </div>
      {/* <div>{pos()?.x}, {pos()?.y}</div> */}
    </div>
    </>
  )
}

export default App;
