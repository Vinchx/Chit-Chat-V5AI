/**
 * Helper function to create cropped image from canvas
 * @param {string} imageSrc - Source image URL
 * @param {Object} pixelCrop - Crop area in pixels
 * @param {number} rotation - Rotation in degrees (default 0)
 * @returns {Promise<Blob>} - Cropped image as Blob
 */
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set canvas size
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Translate canvas context to center
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Draw rotated image
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Set canvas to final size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste generated rotate image with correct offset
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // Convert canvas to blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.95);
    });
}

/**
 * Create an image element from source
 */
function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}

/**
 * Get rotation angle from EXIF data
 */
export function getRotationFromFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const view = new DataView(e.target.result);
            if (view.getUint16(0, false) !== 0xffd8) {
                return resolve(-2);
            }
            const length = view.byteLength;
            let offset = 2;
            while (offset < length) {
                const marker = view.getUint16(offset, false);
                offset += 2;
                if (marker === 0xffe1) {
                    offset += 2;
                    if (view.getUint32(offset, false) !== 0x45786966) {
                        return resolve(-1);
                    }
                    offset += 6;
                    const little = view.getUint16(offset, false) === 0x4949;
                    offset += view.getUint32(offset + 4, little);
                    const tags = view.getUint16(offset, little);
                    offset += 2;
                    for (let i = 0; i < tags; i++) {
                        if (view.getUint16(offset + i * 12, little) === 0x0112) {
                            return resolve(view.getUint16(offset + i * 12 + 8, little));
                        }
                    }
                } else if ((marker & 0xff00) !== 0xff00) {
                    break;
                } else {
                    offset += view.getUint16(offset, false);
                }
            }
            return resolve(-1);
        };
        reader.readAsArrayBuffer(file);
    });
}
