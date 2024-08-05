import { Ship } from "../../models/ship.model";
import './ManeuverLoadSaveButtons.css';
import { UploadedImage } from "../../models/image.model";

export function ManeuverLoadSaveButtons(props: { 
  getShipData: () => Ship.PersistedData, 
  loadShipData: (shipData: Ship.PersistedData) => void, 
  bgImage: UploadedImage | null, 
  setBgImage: (image: File | null) => void
}) {

  let loadFileInputRef: HTMLInputElement;
  let downloadButtonRef: HTMLAnchorElement;

  const saveManeuver = async () => {
    let bgImage = null;
    if (props.bgImage) {
      const arrayBuffer = await props.bgImage.file.arrayBuffer();
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
      
      bgImage = {
        content: bgImageBase64,
        type: props.bgImage.type,
        extension: props.bgImage.extension
      }
    }

    const savedData: ManeuverSave = {
      bgImage,
      shipData: props.getShipData(),
    };  

    const storedStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedData))

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
          debugger
          const loadedData: ManeuverSave = parsedData;

          if (loadedData.bgImage) {
            const bgImageFile = new File(
              [Uint8Array.from(atob(loadedData.bgImage.content), (m) => m.codePointAt(0)!)],
              `background.${loadedData.bgImage.extension}`,
              { type: loadedData.bgImage.type }
           );

           props.setBgImage(bgImageFile)
          } else {
            props.setBgImage(null);
          }

          props.loadShipData(loadedData.shipData);

          inputElement.value = '';
        }
      })
  }

  const isManeuverSave = (data: object): data is ManeuverSave => {
    return 'bgImage' in data 
        && (data.bgImage === null || 
            (typeof data.bgImage === 'object' && 
              'content' in data.bgImage && 
              typeof data.bgImage.content === 'string' && 
              'type' in data.bgImage && typeof data.bgImage.type === 'string' &&
              'extension' in data.bgImage && typeof data.bgImage.extension === 'string'
            )
        )
        && 'shipData' in data && typeof data.shipData === 'object' && data.shipData !== null
        && 'ships' in data.shipData && Array.isArray(data.shipData.ships)
        && (
              !data.shipData.ships.length || 
              ('position' in data.shipData.ships[0] && 'length' in data.shipData.ships[0] && 'width' in data.shipData.ships[0])
        );
  }

  return (
    <>
    <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '1rem' }}>
      <button class='image-button' type='button' onClick={saveManeuver} title='Save state'>
        <img src='save.svg' class='image' />
      </button>

      <button class='image-button' type='button' onClick={() => loadFileInputRef.click()} title='Load saved state'>
        <img src='load.svg' class='image' />
      </button>
    </div>
    <input ref={(e) => loadFileInputRef = e} type='file' accept='.json' onInput={loadManeuver} style={{ display: 'none' }} />
    <a ref={(e) => downloadButtonRef = e} style={{ display: 'none' }}></a>
    </>
  )
}

interface ManeuverSave {
  bgImage: { content: string, type: string, extension: string } | null;
  shipData: Ship.PersistedData;
}