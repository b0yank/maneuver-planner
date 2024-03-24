import { Setter } from "solid-js";
import './BgImageInput.css';

export function BgImageInput(props: { value: UploadedImage | null, setValue: Setter<UploadedImage | null> }) {

  let inputRef: HTMLInputElement | undefined;
  
  const updateImageUrl = (event: Event) => {
    
    if (props.value) {
      URL.revokeObjectURL(props.value.url)
    }
    
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const url = URL.createObjectURL(target.files[0]);
      
      const image: HTMLImageElement = new Image();
      image.src = url;
      
      image.onload = () => {
        const imageSize = getScaledImageSize(image);
        props.setValue({ url, width: imageSize.width, height: imageSize.height });
      }
    }
  }

  return (
    <>
    <button class="bg-image-button" onClick={() => inputRef!.click()} title="Browse background images">
      <img class="bg-image" src="bg-image.svg" />
    </button>
    <input ref={inputRef} type='file' accept='image/*' class='file-input' onChange={updateImageUrl} />
    </>
  )
}

function getScaledImageSize(image: HTMLImageElement) {

  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const viewportToImageWidthRatio = vw / image.width;
  const viewportToImageHeightRatio = vh / image.height;

  const imageScaleRatio = Math.min(viewportToImageWidthRatio, viewportToImageHeightRatio) * 0.99;

  const imageWidth = Math.min(vw, image.width * imageScaleRatio);
  const imageHeight = Math.min(vh, image.height * imageScaleRatio);
  
  return { width: imageWidth, height: imageHeight };
}

interface UploadedImage {
  url: string;
  width: number;
  height: number;
}