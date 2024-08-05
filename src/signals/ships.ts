import { Accessor, createSignal } from "solid-js";
import { Ship } from "../models/ship.model";

const DEFAULT_SHIP_STROKE_COLOR = '#020595';

export function createShips(params: { canvasWidth: Accessor<number>, canvasHeight: Accessor<number> }) {

  let nextId = '2';
  const { canvasWidth, canvasHeight } = params;  

  const [identityShipLength, setIdentityShipLength] = createSignal<number>(0.16);
  const [identityShipWidth, setIdentityShipWidth] = createSignal<number>(0.036);
  const [shipStrokeColor, setShipStrokeColor] = createSignal<string>(DEFAULT_SHIP_STROKE_COLOR);

  const [ships, setShips] = createSignal<Ship.Absolute[]>([
    {
      id: '1', 
      position: { origin: { x: 0.5, y: 0.5 }, rotation: 180 }, 
      length: identityShipLength(), 
      width: identityShipWidth(),
    }
  ]);

  const [selectedShipId, setSelectedShipId] = createSignal<string | null>(null);

  // <should work with scaled ships only>
  const getShipSideOffset = (ship: Ship) => ship.width * 0.3;
  const getShipLengthOffset = (ship: Ship) => ship.length - getShipSideOffset(ship);
  const getShipWidthOffset = (ship: Ship) => ship.width - getShipSideOffset(ship);
  // </should work with scaled ships only>

  const scaledShips = () => ships().map(getShipWithRelativeSize);

  const scaledIdentityShipLength = () => rounded(identityShipLength() * canvasWidth());
  const scaledIdentityShipWidth = () => rounded(identityShipWidth() * canvasHeight());

  const adjustShipLength = (newLength: number) => {

    const absoluteNewLength = rounded(newLength / canvasWidth());

    if (selectedShipId()) {
      const selectedShip = ships().find(ship => ship.id === selectedShipId())!;
      selectedShip.length = absoluteNewLength;
      setShips(currentShips => currentShips
        .filter(s => s.id !== selectedShipId())
        .concat([selectedShip])
      );
    } else {
      setShips(ships => ships
        .map(ship => {
          if (
            (ship.length === identityShipLength()) && 
            (ship.width === identityShipWidth())
          ) {
            ship.length = absoluteNewLength;
          }

          return ship;
        })
      );

      setIdentityShipLength(absoluteNewLength);
    }
  };

  const adjustShipWidth = (newWidth: number) => {

    const absoluteNewWidth = rounded(newWidth / canvasHeight());

    if (selectedShipId()) {
      const selectedShip = ships().find(ship => ship.id === selectedShipId())!;
      selectedShip.width = absoluteNewWidth;
      setShips(currentShips => currentShips
        .filter(s => s.id !== selectedShipId())
        .concat([selectedShip])
      );
    } else {
      setShips(ships => ships
        .map(ship => {
          if (
            (ship.length === identityShipLength()) && 
            (ship.width === identityShipWidth())
          ) {
            ship.width = absoluteNewWidth;
          }

          return ship;
        })
      );

      setIdentityShipWidth(absoluteNewWidth);
    }
  };

  const selectShipColor = (color: string) => {
    
    if (selectedShipId()) {
      
      const selectedShip = ships().find(ship => ship.id === selectedShipId())!
      selectedShip.strokeColor = color;
      setShips(currentShips => currentShips
        .filter(s => s.id !== selectedShipId())
        .concat([selectedShip])
      );
    } else {
      setShipStrokeColor(color);
    }
  }


  const getNextShipId = () => {
    const id = nextId;

    nextId = (Number(nextId) + 1).toString();
    return id;
  }

  const copyShip = (ship: Ship, keepId: boolean): Ship => {

    const copiedShip = scaledShips().find(scaledShip => scaledShip.id === ship.id)!;

    return {
      id: keepId ? ship.id : getNextShipId(), 
      position: { rotation: copiedShip.position.rotation, origin: DOMPointReadOnly.fromPoint(copiedShip.position.origin) },
      strokeColor: copiedShip.strokeColor,
      length: copiedShip.length,
      width: copiedShip.width
    };
  }


  const addCopyOfShip = (ship: Omit<Ship, 'id'>) => {
    const addedShip = getShipWithAbsoluteSize(ship as Ship);
    addedShip.id = getNextShipId();

    setShips(currentShips => currentShips.concat([addedShip]));

    return { ...ship, id: addedShip.id };
  }

  const editShip = (shipId: string, editedShip: Ship) => {
    setShips(currentShips => currentShips
      .filter(ship => ship.id !== shipId)
      .concat([{ ...getShipWithAbsoluteSize(editedShip), id: shipId }])
    );
  }

  const removeShip = (ship: Ship) => {
    setShips(currentShips => currentShips.filter(currentShip => currentShip.id !== ship.id));

    if (ship.id === selectedShipId()) {
      setSelectedShipId(null);
    }
  }

  const isSelectedShip = (ship: Ship) => ship.id === selectedShipId();

  const selectShip = (ship: Ship | null) => setSelectedShipId(ship?.id || null);

  const getSelectedShip = () => {
    if (selectedShipId()) {
      return scaledShips().find(isSelectedShip)!;
    }

    return null;
  }

  const shipDataAsPersisted = (): Ship.PersistedData => {
    return {
      ships: ships(),
      identityLength: identityShipLength(),
      identityWidth: identityShipWidth()
    };
  }

  const loadShipData = (persistedData: Ship.PersistedData) => {
    setShips(persistedData.ships);
    setIdentityShipLength(persistedData.identityLength);
    setIdentityShipWidth(persistedData.identityWidth);
    setSelectedShipId(null);
  }

  /**
  * Returns a ship copy with length and width independent of current canvas
  * @param relativeSizeShip: ship with length & width adjusted for canvas
  */
  const getShipWithAbsoluteSize = (relativeSizeShip: Ship): Ship.Absolute => {
    return {
      ...relativeSizeShip,
      position: {
        origin: {
          x: rounded(relativeSizeShip.position.origin.x / canvasWidth()),
          y: rounded(relativeSizeShip.position.origin.y / canvasHeight()),
        },
        rotation: relativeSizeShip.position.rotation
      },
      length: rounded(relativeSizeShip.length / canvasWidth()),
      width: rounded(relativeSizeShip.width / canvasHeight())
    };
  }

  /**
   * Returns a ship copy with length and width relative to current canvas
   * @param relativeSizeShip: ship with length & width expressed as percentages 
   * of canvas width/height respectively
   */
  const getShipWithRelativeSize = (absoluteSizeShip: Ship.Absolute): Ship => {
    return {
      ...absoluteSizeShip,
      position: {
        origin: new DOMPointReadOnly(
          rounded(absoluteSizeShip.position.origin.x * canvasWidth()),
          rounded(absoluteSizeShip.position.origin.y * canvasHeight()),
        ),
        rotation: absoluteSizeShip.position.rotation
      },
      length: rounded(absoluteSizeShip.length * canvasWidth()),
      width: rounded(absoluteSizeShip.width * canvasHeight())
    };
  }

  return {
    ships: scaledShips,
    identityShipLength: scaledIdentityShipLength,
    identityShipWidth: scaledIdentityShipWidth,
    adjustShipLength,
    adjustShipWidth,
    shipStrokeColor,
    selectShipColor,
    getShipSideOffset,
    getShipLengthOffset,
    getShipWidthOffset,
    copyShip,
    addCopyOfShip,
    editShip,
    removeShip,
    getSelectedShip,
    isSelectedShip,
    selectShip,
    shipDataAsPersisted,
    loadShipData,
  }
}

const rounded = (num: number) => Number(num.toFixed(4));