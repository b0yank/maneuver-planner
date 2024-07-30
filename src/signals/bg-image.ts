import { Accessor, createSignal, onCleanup, onMount } from "solid-js";
import { UploadedImage } from "../models/image.model";

export function createBgImage(initialValue: UploadedImage | null = null): [Accessor<UploadedImage | null>, (image: File | null) => void] {
  const [bgImage, setBgImage] = createSignal<UploadedImage | null>(initialValue);
  const [scaledImageSize, setScaledImageSize] = createSignal<{ width: number, height: number } | null>(null);

  const updateScaledImageSize = (imageSize: { width: number, height: number } | null) => {
    if (imageSize) {
      const scaledSize = getScaledImageSize(imageSize);

      setScaledImageSize(scaledSize);
    }
  };

  onMount(() => window.addEventListener('resize', () => updateScaledImageSize(bgImage())));
  onCleanup(() => window.removeEventListener('resize', () => updateScaledImageSize(bgImage())));

  const updateBgImage = (imageFile: File | null) => {

    const previousBgImage = bgImage();
    if (previousBgImage) {
      URL.revokeObjectURL(previousBgImage.url)
    }
    
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      
      const imgElement = new Image();
      imgElement.src = url;

      const fileExtension = imageFile.name.slice(
        imageFile.name.lastIndexOf('.') + 1
      );
      
      imgElement.onload = () => {
        setBgImage({ 
          file: imageFile,
          url, 
          extension: fileExtension, 
          type: imageFile.type, 
          width: imgElement.width, 
          height: imgElement.height 
        });
        updateScaledImageSize({ width: imgElement.width, height: imgElement.height });
      }
    }
  }

  const scaledBgImage: Accessor<UploadedImage | null> = () => {
    const currentBgImage = bgImage();
    const scaledSize = scaledImageSize();
    if (currentBgImage && scaledSize) {

      const { width, height } = scaledSize;

      return {
        file: currentBgImage.file,
        url: currentBgImage.url,
        type: currentBgImage.type,
        extension: currentBgImage.extension,
        width,
        height
      }
    }

    return null;
  }

  return [scaledBgImage, updateBgImage];
}

function getScaledImageSize(image: { width: number, height: number }) {

  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const viewportToImageWidthRatio = vw / image.width;
  const viewportToImageHeightRatio = vh / image.height;

  const imageScaleRatio = Math.min(viewportToImageWidthRatio, viewportToImageHeightRatio) * 0.99;

  const imageWidth = Math.min(vw, image.width * imageScaleRatio);
  const imageHeight = Math.min(vh, image.height * imageScaleRatio);
  
  return { width: imageWidth, height: imageHeight };
}