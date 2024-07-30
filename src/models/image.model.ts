export interface UploadedImage {
  file: File;
  url: string;
  extension: string;
  type: string;
  width: number;
  height: number;
}

export namespace UploadedImage {
  export function getScaledImageSize(image: HTMLImageElement) {

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  
    const viewportToImageWidthRatio = vw / image.width;
    const viewportToImageHeightRatio = vh / image.height;
  
    const imageScaleRatio = Math.min(viewportToImageWidthRatio, viewportToImageHeightRatio) * 0.99;
  
    const imageWidth = Math.min(vw, image.width * imageScaleRatio);
    const imageHeight = Math.min(vh, image.height * imageScaleRatio);
    
    return { width: imageWidth, height: imageHeight };
  }
}