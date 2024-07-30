import './BgImageInput.css';
import { UploadedImage } from "../../models/image.model";

export function BgImageInput(props: { uploadedImage: UploadedImage | null, setBgImage: (image: File | null) => void }) {

  let inputRef: HTMLInputElement;
  
  const updateImageUrl = (event: Event) => {
    
    if (props.uploadedImage) {
      URL.revokeObjectURL(props.uploadedImage.url)
    }
    
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const imageFile = target.files[0];
      props.setBgImage(imageFile)
    }
  }

  return (
    <>
    <button class="bg-image-button" onClick={() => inputRef!.click()} title="Browse background images">
      <img class="bg-image" src="bg-image.svg" />
    </button>
    <input ref={(e) => inputRef = e} type='file' accept='image/*' class='file-input' onChange={updateImageUrl} />
    </>
  )
}

