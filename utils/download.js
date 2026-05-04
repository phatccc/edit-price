import JSZip from "jszip";

function canvasToFileSync(canvas, filename, type = "image/jpeg", quality = 0.9) {
  const dataUrl = canvas.toDataURL(type, quality);
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function downloadCanvasImage(canvas, filename) {
  if (!canvas) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");

  if (isIOS && navigator.canShare) {
    try {
      // Synchronous conversion to preserve user gesture context in Safari
      const file = canvasToFileSync(canvas, jpgFilename, "image/jpeg", 0.9);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: jpgFilename,
        });
        return;
      }
    } catch (err) {
      console.warn("Web Share API failed, falling back to standard download.", err);
    }
  }

  // Standard download fallback
  const link = document.createElement("a");
  link.download = jpgFilename;
  link.href = canvas.toDataURL("image/jpeg", 0.9);
  link.click();
}

export async function downloadMultipleCanvasImages(canvasDataArray, onProgress) {
  if (!canvasDataArray || canvasDataArray.length === 0) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    let shareSuccess = false;
    try {
      const filesArray = [];
      // Synchronous conversion to JPEGs to reduce file size and preserve gesture
      for (let i = 0; i < canvasDataArray.length; i++) {
        const { canvas, filename } = canvasDataArray[i];
        const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");
        const file = canvasToFileSync(canvas, jpgFilename, "image/jpeg", 0.9);
        filesArray.push(file);
      }
      
      // Attempt native Share Sheet (works best if file array is small enough)
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        if (onProgress) onProgress(100, 100);
        await navigator.share({
          files: filesArray,
          title: "Tải ảnh về máy",
        });
        shareSuccess = true;
        return; // Success!
      } else {
        console.warn("navigator.canShare returned false for multiple files.");
      }
    } catch (err) {
      console.warn("Web share failed for multiple files, falling back to ZIP.", err);
    }

    if (!shareSuccess) {
      // Fallback to JSZip for iOS because sequential `a.click()` triggers Safari's download interrupt popup
      try {
        const zip = new JSZip();
        for (let i = 0; i < canvasDataArray.length; i++) {
          const { canvas, filename } = canvasDataArray[i];
          const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");
          const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
          zip.file(jpgFilename, blob);
          if (onProgress) onProgress(Math.floor(((i + 1) / canvasDataArray.length) * 50), 100);
        }
        
        const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" }, (meta) => {
          if (onProgress) onProgress(50 + Math.floor(meta.percent / 2), 100);
        });
        
        const zipUrl = URL.createObjectURL(zipBlob);
        // Using assign on top location works reliably for Blob URLs on Safari without popup blocks
        window.location.assign(zipUrl);
        setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
        return;
      } catch (err) {
        console.error("ZIP fallback failed", err);
      }
    }
  }

  // Fallback to standard sequential download for Non-iOS
  for (let i = 0; i < canvasDataArray.length; i++) {
    const { canvas, filename } = canvasDataArray[i];
    const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");
    
    // Use toBlob instead of toDataURL to prevent blocking main thread
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = jpgFilename;
    link.href = url;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    if (onProgress) onProgress(i + 1, canvasDataArray.length);
    
    // Slight delay to allow browser to process the download
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
