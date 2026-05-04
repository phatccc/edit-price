function canvasToFileSync(canvas, filename) {
  const dataUrl = canvas.toDataURL("image/png");
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

  if (isIOS && navigator.canShare) {
    try {
      // Synchronous conversion to preserve user gesture context in Safari
      const file = canvasToFileSync(canvas, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return;
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
      const filesArray = [];
      // Synchronous conversion to preserve user gesture context in Safari
      for (let i = 0; i < canvasDataArray.length; i++) {
        const { canvas, filename } = canvasDataArray[i];
        const file = canvasToFileSync(canvas, filename);
        filesArray.push(file);
        
        if (onProgress) onProgress(Math.floor(((i + 1) / canvasDataArray.length) * 100), 100);
      }
      
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          files: filesArray,
          title: "Tải ảnh về máy",
        });
        return; // Success!
      } else {
        console.warn("navigator.canShare returned false for multiple files.");
      }
    } catch (err) {
      console.warn("Web share failed, falling back to sequential download.", err);
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
