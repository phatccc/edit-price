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

export async function downloadMultipleCanvasImages(canvasDataArray) {
  if (!canvasDataArray || canvasDataArray.length === 0) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS && navigator.canShare) {
    try {
      const files = await Promise.all(
        canvasDataArray.map(async ({ canvas, filename }) => {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
          return new File([blob], filename, { type: "image/png" });
        })
      );
      
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
  for (const { canvas, filename } of canvasDataArray) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
