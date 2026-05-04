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

  if (isIOS && navigator.canShare) {
    try {
      // Process sequentially to avoid memory spikes on iOS
      const files = [];
      for (let i = 0; i < canvasDataArray.length; i++) {
        const { canvas, filename } = canvasDataArray[i];
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
        files.push(new File([blob], filename, { type: "image/png" }));
        if (onProgress) onProgress(i + 1, canvasDataArray.length);
      }
      
      if (navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: "Downloaded Images",
        });
        return;
      }
    } catch (err) {
      console.warn("Web Share API failed, falling back to standard download.", err);
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
