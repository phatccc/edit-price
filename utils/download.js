import JSZip from "jszip";

export async function downloadCanvasImage(canvas, filename) {
  if (!canvas) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS && navigator.canShare) {
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
          });
          return;
        }
      }
    } catch (err) {
      console.warn("Web Share API failed, falling back to standard download.", err);
    }
  }

  // Standard download fallback
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function downloadMultipleCanvasImages(canvasDataArray, onProgress) {
  if (!canvasDataArray || canvasDataArray.length === 0) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    try {
      const zip = new JSZip();
      
      // Add all images to the zip
      for (let i = 0; i < canvasDataArray.length; i++) {
        const { canvas, filename } = canvasDataArray[i];
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
        zip.file(filename, blob);
        
        // Progress for creating blobs: 0-50%
        if (onProgress) onProgress(Math.floor(((i + 1) / canvasDataArray.length) * 50), 100);
      }
      
      // Generate zip
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "STORE" // Faster generation
      }, (meta) => {
        // Progress for zipping: 50-100%
        if (onProgress) onProgress(50 + Math.floor(meta.percent / 2), 100);
      });
      
      const zipFilename = "prices_labeled.zip";
      const zipFile = new File([zipBlob], zipFilename, { type: "application/zip" });
      
      // Try Web Share API first
      if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
        await navigator.share({
          files: [zipFile],
          title: "Downloaded Images Zip",
        });
        return;
      } else {
        // Fallback to normal download for zip
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.download = zipFilename;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
    } catch (err) {
      console.warn("ZIP generation failed, falling back to sequential download.", err);
    }
  }

  // Fallback to standard sequential download
  for (let i = 0; i < canvasDataArray.length; i++) {
    const { canvas, filename } = canvasDataArray[i];
    
    // Use toBlob instead of toDataURL to prevent blocking main thread
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    if (onProgress) onProgress(i + 1, canvasDataArray.length);
    
    // Slight delay to allow browser to process the download
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
