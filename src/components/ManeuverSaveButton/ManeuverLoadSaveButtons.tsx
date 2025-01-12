import { Ship } from "../../models/ship.model";
import { UploadedImage } from "../../models/image.model";
import { DirectionArrow } from "../../models/direction-arrow";
import { Accessor } from "solid-js";
import styles from './ManeuverLoadSaveButtons.module.css';

export function ManeuverLoadSaveButtons(props: { 
  getShipData: () => Ship.PersistedData, 
  loadShipData: (shipData: Ship.PersistedData) => void, 
  bgImage: Accessor<UploadedImage | null>, 
  setBgImage: (image: File | null) => void,
  shipStrokeColor: Accessor<string>,
  setShipStrokeColor: (value: string) => void,
  directionArrows: Accessor<DirectionArrow.Relative[]>,
  loadDirectionArrows: (arrows: DirectionArrow.Absolute[]) => void
}) {

  let loadFileInputRef: HTMLInputElement;
  let downloadButtonRef: HTMLAnchorElement;

  const saveManeuver = async () => {

    let savedBgImageData = null;

    const bgImage = props.bgImage();
    if (bgImage) {
      const arrayBuffer = await bgImage.file.arrayBuffer();
      const bgImageBase64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce(
            (data, byte) => {
              data.push(String.fromCharCode(byte));
              return data;
            },
            [] as string[]
          )
          .join('')
      );
      
      savedBgImageData = {
        content: bgImageBase64,
        type: bgImage.type,
        extension: bgImage.extension
      };
    }

    const savedData: ManeuverSave = {
      general: {
        bgImage: savedBgImageData,
        shipStrokeColor: props.shipStrokeColor()
      },
      shipData: props.getShipData(),
      directionArrows: props.directionArrows().map(arrow => ({ 
        label: arrow.label,
        direction: arrow.direction, 
        strength: arrow.strength,
        color: arrow.color,
        symbol: arrow.symbol
      }))
    };  

    const storedStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedData));

    downloadButtonRef.setAttribute('href', storedStr);
    downloadButtonRef.setAttribute('download', 'state.json');
    downloadButtonRef.click();
  }

  const loadManeuver = (event: InputEvent) => {

    const inputElement = event.target as HTMLInputElement;
    const saveFile = inputElement.files ? inputElement.files[0] : null;
    
    saveFile?.text()
      .then(jsonContent => {
        const parsedData = JSON.parse(jsonContent);
        if (isManeuverSave(parsedData)) {
          const loadedData: ManeuverSave = parsedData;

          if (loadedData.general.bgImage) {
            const bgImageFile = new File(
              [Uint8Array.from(atob(loadedData.general.bgImage.content), (m) => m.codePointAt(0)!)],
              `background.${loadedData.general.bgImage.extension}`,
              { type: loadedData.general.bgImage.type }
           );

           props.setBgImage(bgImageFile)
          } else {
            props.setBgImage(null);
          }

          props.setShipStrokeColor(loadedData.general.shipStrokeColor);

          props.loadShipData(loadedData.shipData);

          props.loadDirectionArrows(loadedData.directionArrows);

          inputElement.value = '';
        }
      })
  }

  const isManeuverSave = (data: object): data is ManeuverSave => {
    return 'general' in data
        && typeof data.general === 'object' && data.general !== null
        && 'bgImage' in data.general 
        && (data.general.bgImage === null || 
            (typeof data.general.bgImage === 'object' && 
              'content' in data.general.bgImage && 
              typeof data.general.bgImage.content === 'string' && 
              'type' in data.general.bgImage && typeof data.general.bgImage.type === 'string' &&
              'extension' in data.general.bgImage && typeof data.general.bgImage.extension === 'string'
            )
        )
        && 'shipStrokeColor' in data.general && typeof data.general.shipStrokeColor === 'string'
        && 'shipData' in data && typeof data.shipData === 'object' && data.shipData !== null
        && 'ships' in data.shipData && Array.isArray(data.shipData.ships)
        && (
              !data.shipData.ships.length || 
              ('position' in data.shipData.ships[0] && 'length' in data.shipData.ships[0] && 'width' in data.shipData.ships[0])
        )
        && 'directionArrows' in data
        && Array.isArray(data.directionArrows) && data.directionArrows.length > 0
        && typeof data.directionArrows[0] === 'object';
  }

  return (
    <>
    <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '1rem' }}>
      <button class={styles['image-button']} type='button' onClick={saveManeuver} title='Save state'>
        <img src='save.svg' class={styles.image} />
      </button>

      <button class={styles['image-button']} type='button' onClick={() => loadFileInputRef.click()} title='Load saved state'>
        <img src='load.svg' class={styles.image} />
      </button>
    </div>
    <input ref={(e) => loadFileInputRef = e} type='file' accept='.json' onInput={loadManeuver} style={{ display: 'none' }} />
    <a ref={(e) => downloadButtonRef = e} style={{ display: 'none' }}></a>
    </>
  )
}

interface ManeuverSave {
  general: {
    bgImage: { content: string, type: string, extension: string } | null;
    shipStrokeColor: string;
  }
  shipData: Ship.PersistedData;
  directionArrows: DirectionArrow.Absolute[];
}