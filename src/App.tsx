import { Index, createEffect, createSignal, onCleanup } from 'solid-js';
import './App.css';
import { Ship } from './models/ship.model';
import { getAngleBetweenPoints, getDistanceBetweenPoints } from './utils/points';
import { NumberInput } from './components/NumberInput/NumberInput';
import { BgImageInput } from './components/BgImageInput/BgImageInput';
import { ManeuverLoadSaveButtons } from './components/ManeuverSaveButton/ManeuverLoadSaveButtons';
import { createBgImage } from './signals/bg-image';
import { createShips } from './signals/ships';
import { createDirectionArrows } from './signals/direction-arrows';
import { DirectionArrowData } from './components/DirectionArrowData/DirectionArrowData';
import { DraggableMenu } from './components/DraggableMenu/DraggableMenu';

const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_STROKE_STYLE = '#000000';
const DEFAULT_FILL_STYLE = '#121212';

function App() {
  const [context, setContext] = createSignal<CanvasRenderingContext2D>();

  const [bgImage, setBgImage] = createBgImage();
  const [strokeColor, _setStrokeColor] = createSignal<string>('black');
  const [lineWidth, _setLineWidth] = createSignal<number>(1);
  const [mouseHoldStart, setMouseHoldStart] = createSignal<DOMPointReadOnly | null>(null);
  const [activeCommand, setActiveCommand] = createSignal<'pan' | 'rotate' | 'copy' | null>(null);

  const [shiftPressed, setShiftPressed] = createSignal<boolean>(false);
  const [ctrlPressed, setCtrlPressed] = createSignal<boolean>(false);

  let canvasObserver: MutationObserver;

  const canvasWidth = () => {
    return bgImage() ? bgImage()!.width : (document.documentElement.clientWidth * 0.95);
  }

  const canvasHeight = () => {
    return bgImage() ? bgImage()!.height : (document.documentElement.clientHeight * 0.95);
  }
  
  const {
    ships,
    identityShipLength,
    identityShipWidth,
    adjustShipLength,
    adjustShipWidth,
    shipStrokeColor,
    selectShipColor,
    copyShip,
    addCopyOfShip,
    editShip,
    removeShip,
    isSelectedShip,
    selectShip,
    getSelectedShip,
    shipDataAsPersisted,
    loadShipData,
  } = createShips({ canvasWidth, canvasHeight });

  const { arrows, updateArrow, loadArrows } = createDirectionArrows({ canvasWidth });

  const getShipSideOffset = (ship: Ship) => ship.width * 0.3;
  const getShipLengthOffset = (ship: Ship) => ship.length - getShipSideOffset(ship);
  const getShipWidthOffset = (ship: Ship) => ship.width - getShipSideOffset(ship);
  
  const panToolRadius = (ship: Ship) => ship.length * 0.30;

  const rotateToolInnerRadius = (ship: Ship) => panToolRadius(ship) * 1.05;
  const rotateToolOuterRadius = (ship: Ship) => rotateToolInnerRadius(ship) + rotateToolWidth(ship);

  const rotateToolWidth = (ship: Ship) => ship.length * 0.25;

  const createShipCanvasPath = (ship: Ship): Path2D => { 

    const ctx = context()!;
    ctx.beginPath();

    const shipPath = new Path2D();

    const shipLength = ship.length;
    const shipWidth = ship.width;

    const halfWidth = shipWidth / 2;
    const halfLength = shipLength / 2;
    
    shipPath.moveTo((-halfWidth) + 0, (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + shipWidth, (-halfLength) + 0);
    shipPath.lineTo((-halfWidth) + shipWidth, (-halfLength) + getShipLengthOffset(ship));
    shipPath.lineTo((-halfWidth) + getShipWidthOffset(ship), (-halfLength) + shipLength);
    shipPath.lineTo((-halfWidth) + getShipSideOffset(ship), (-halfLength) + shipLength);
    shipPath.lineTo((-halfWidth) + 0, (-halfLength) + getShipLengthOffset(ship));
    shipPath.lineTo((-halfWidth) + 0, (-halfLength) + 0);

    ctx.closePath();

    return shipPath;
  }

  const drawShip = (ship: Ship) => {
    
    const ctx = context()!;
    ctx.strokeStyle = strokeColor();
    ctx.setTransform(getShipDomMatrix(ship));
    
    const shipPath = createShipCanvasPath(ship);

    ctx.fillStyle = ship?.strokeColor || shipStrokeColor();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ship?.strokeColor || shipStrokeColor();
    ctx.stroke(shipPath);

    if (isSelectedShip(ship)) {
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

    context.clearRect(0, 0, canvasWidth(), canvasHeight());
    context.lineWidth = DEFAULT_LINE_WIDTH;
    context.strokeStyle = DEFAULT_STROKE_STYLE;
    context.fillStyle = DEFAULT_FILL_STYLE;

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
    
    ctx.setTransform(getShipDomMatrix(ship));

    const drawnShipStrokeColor = ship.strokeColor || shipStrokeColor();
    
    ctx.fillStyle = drawnShipStrokeColor + '33'; // adding 1A for transparency of HEX color
    drawPanTool(ship);
    
    ctx.strokeStyle = drawnShipStrokeColor + '1A'; // adding 1A for transparency of HEX color
    drawRotateTool();

    ctx.strokeStyle = strokeColor();
    ctx.fillStyle = drawnShipStrokeColor;
  }

  const drawPanTool = (ship: Ship) => {

    const ctx = context()!;
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.arc(0, 0, panToolRadius(ship), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  const drawRotateTool = () => {

    const ctx = context()!;

    const selectedShip = getSelectedShip()!;
    ctx.strokeStyle = (selectedShip.strokeColor || shipStrokeColor) + '1A'; // adding 1A for transparency of HEX color

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius(selectedShip) + (rotateToolOuterRadius(selectedShip) - rotateToolInnerRadius(selectedShip)) / 2, 0, 2 * Math.PI);
    ctx.lineWidth = rotateToolOuterRadius(selectedShip) - rotateToolInnerRadius(selectedShip);
    ctx.closePath();
    ctx.stroke();
    
    ctx.lineWidth = lineWidth();

    ctx.beginPath();
    ctx.arc(0, 0, rotateToolInnerRadius(selectedShip), 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, rotateToolOuterRadius(selectedShip), 0, 2 * Math.PI);
    ctx.stroke();
  }

  const drawShipCourse = () => {

    const ctx = context()!;
    ctx.font = "36px serif";

    const initialFillStyle = ctx.fillStyle;
    ctx.fillStyle = 'black';

    const selectedShip = getSelectedShip()!;

    const textOrigin = getShipDomMatrix(selectedShip)
      .transformPoint(new DOMPointReadOnly(0, rotateToolOuterRadius(selectedShip)));

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

  const getShipDomMatrix = (ship: Ship): DOMMatrix => {
    return new DOMMatrix(
      `translate(${ship.position.origin.x}px, ${ship.position.origin.y}px) rotateZ(${ship.position.rotation}deg)`
    );
  }

  const canvasDegreesToShipCourseDegrees = (canvasDegrees: number) => (canvasDegrees + 180) % 360

  const isPositionInShip = (position: DOMPointReadOnly, ship: Ship): boolean => {

    const transformedPoint = transformPointByInverseShipMatrix(position, ship);
    
    return isPointInShip(transformedPoint, ship);
  }

  const transformPointByInverseShipMatrix = (point: DOMPointReadOnly, ship: Ship) => {

    const shipMatrix = getShipDomMatrix(ship);
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

  const isPointInShip = (point: DOMPointReadOnly, ship: Ship): boolean => {

    const shipLength = ship.length;
    const shipWidth = ship.width;

    // point is adjusted to compensate for the fact that the ship origin is in the center of the ship, instead of an endpoint
    const adjustedPoint = new DOMPointReadOnly(point.x + shipWidth / 2, point.y + shipLength / 2);

    const isWithinXBounds = adjustedPoint.x >= 0 && adjustedPoint.x <= shipWidth;
    const isWithinYBounds = adjustedPoint.y >= 0 && adjustedPoint.y <= shipLength;

    if (isWithinXBounds && isWithinYBounds) {
      if (adjustedPoint.y <= getShipLengthOffset(ship)) {
        return true;
      }
  
      if (adjustedPoint.y <= shipLength) {
        return (adjustedPoint.x <= getShipWidthOffset(ship) && adjustedPoint.x >= (adjustedPoint.y - getShipLengthOffset(ship))) 
            || (adjustedPoint.x > getShipWidthOffset(ship) && adjustedPoint.x + (adjustedPoint.y - getShipLengthOffset(ship)) <= shipWidth);
      }
    }

    return false;
  }

  const isClickInTools = (ship: Ship, click: DOMPointReadOnly) => {

    const shipCenter = ship.position.origin;
    return getDistanceBetweenPoints(shipCenter, click) <= rotateToolOuterRadius(ship);
  }

  const handlePanStart = (click: DOMPointReadOnly): boolean => {
    const selectedShip = getSelectedShip()!;

    if (selectedShip) {

      if (getDistanceBetweenPoints(selectedShip.position.origin, click) <= panToolRadius(selectedShip)) {
        setMouseHoldStart(click);

        if (shiftPressed()) {
          
          const shipCopy = addCopyOfShip(selectedShip);
          selectShip(shipCopy);
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
      
      return distanceToCenter >= rotateToolInnerRadius(selectedShip)
          && distanceToCenter <= rotateToolOuterRadius(selectedShip);
    }

    return false;
  }

  const handleShipSelection = (click: DOMPointReadOnly) => {

    const clickedShip = findClickedShip(click);
    selectShip(clickedShip || null);
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

  const handleToolsCommandStart = (clickPosition: DOMPointReadOnly): boolean => {

    const commandHandled = handlePanStart(clickPosition);

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
    if (!!getSelectedShip() && isClickInTools(getSelectedShip()!, clickPosition)) { 
      inputHandled = handleToolsCommandStart(clickPosition);
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
    editShip(modifiedShip.id, modifiedShip);

    if (shouldEndRotation) {
      setMouseHoldStart(null);
      setActiveCommand(null);
    } else {
      setMouseHoldStart(rotateEndPosition);
    }
  }

  const handlePanMove = (event: MouseEvent | TouchEvent, shouldEndPanning: boolean) => {

    const mouseHoldStartPosition = mouseHoldStart();
    const selectedShip = getSelectedShip();
    if (!mouseHoldStartPosition || !selectedShip) {
      return;
    }

    const panEndPosition = getMouseEventPosition(event);
  
    const dx = panEndPosition.x - mouseHoldStartPosition.x;
    const dy = panEndPosition.y - mouseHoldStartPosition.y;

    const modifiedShip = copyShip(selectedShip, true);
    
    const newShipOrigin = new DOMPointReadOnly(
      modifiedShip.position.origin.x + dx, 
      modifiedShip.position.origin.y + dy 
    );
    
    modifiedShip.position.origin = newShipOrigin;
    editShip(modifiedShip.id, modifiedShip);
    
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
      removeShip(selectedShip);
    }
  }

  const getInputShipLengthValue = () => {

    const selectedShip = getSelectedShip();
    return selectedShip?.length || identityShipLength();
  }

  const getInputShipWidthValue = () => {

    const selectedShip = getSelectedShip();
    return selectedShip?.width || identityShipWidth();
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
      onMouseUp={handleMouseUp}  // TODO error where event is null
      onTouchEnd={handleMouseUp} // TODO error where event is null
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    ></canvas>

    <DraggableMenu 
      id='arrow-menu'
      initialPosition={{
        vertical: { from: 'top', value: 0 },
        horizontal: { from: 'left', value: 0 }
      }}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      canvasPositionFromMouseEvent={getMouseEventPosition}
    >
      <Index each={arrows()}>
        {(arrow) => (
          <DirectionArrowData arrow={arrow} updateArrow={(direction, strength) => updateArrow(arrow().label, { direction, strength })} />
        )}
      </Index>
    </DraggableMenu>

    {/* <div 
      id="menu"
      style={{
        top: `${menuPositionFromTopRight().y.toString()}px`,
        right: `${menuPositionFromTopRight().x.toString()}px`,
      }}
      onMouseLeave={endMenuDrag}
      onMouseDown={startMenuDrag}
      onMouseMove={dragMenu}
      onMouseUp={endMenuDrag}
    >  */}
    <DraggableMenu 
      id='menu'
      initialPosition={{
        vertical: { from: 'top', value: 0 },
        horizontal: { from: 'right', value: 0 }
      }} 
      canvasWidth={canvasWidth} 
      canvasHeight={canvasHeight}
      canvasPositionFromMouseEvent={getMouseEventPosition}
    >
      {/* <NumberInput value={scale()} setValue={setScale} min={0.2} max={3.0} step={0.05} /> */}
      <h4>Ship length</h4>
      <NumberInput value={getInputShipLengthValue()} setValue={adjustShipLength} min={5} step={1} />
      <h4>Ship width</h4>
      <NumberInput value={getInputShipWidthValue()} setValue={adjustShipWidth} min={1} step={1} />
      <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '1rem' }}>
        <input type='color' value={getSelectedShip()?.strokeColor || shipStrokeColor()} onInput={(e) => selectShipColor(e.target.value)} title="Select ship color" />
        <BgImageInput uploadedImage={bgImage()} setBgImage={setBgImage} />
      </div>
      
      <ManeuverLoadSaveButtons 
        getShipData={shipDataAsPersisted} 
        loadShipData={loadShipData} 
        bgImage={bgImage} 
        setBgImage={setBgImage} 
        directionArrows={arrows}
        loadDirectionArrows={loadArrows}
        shipStrokeColor={shipStrokeColor}
        setShipStrokeColor={selectShipColor}
      />
    </DraggableMenu>
      
      {/* <div>{pos()?.x}, {pos()?.y}</div> */}
      
    {/* </div> */}
    </>
  )
}

export default App;
