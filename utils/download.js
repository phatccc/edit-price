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

function showLongPressModal(canvasDataArray) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(15, 23, 42, 0.98)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.overflowY = "auto";
  overlay.style.padding = "20px";
  overlay.style.backdropFilter = "blur(8px)";
  overlay.style.webkitBackdropFilter = "blur(8px)";
  
  const header = document.createElement("div");
  header.style.textAlign = "center";
  header.style.marginBottom = "24px";
  header.style.color = "white";
  header.style.paddingTop = "max(env(safe-area-inset-top, 20px), 20px)";
  
  const title = document.createElement("h2");
  title.innerText = "Lưu ảnh thủ công";
  title.style.fontSize = "22px";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.style.fontFamily = "system-ui, -apple-system, sans-serif";
  
  const desc = document.createElement("p");
  desc.innerText = "Thiết bị của bạn đang chặn tải nhiều file. Vui lòng nhấn giữ (Long press) vào từng ảnh dưới đây và chọn 'Lưu hình ảnh' (Save Image) vào thư viện.";
  desc.style.fontSize = "14px";
  desc.style.color = "#94a3b8";
  desc.style.lineHeight = "1.5";
  desc.style.fontFamily = "system-ui, -apple-system, sans-serif";
  
  header.appendChild(title);
  header.appendChild(desc);
  overlay.appendChild(header);

  const imagesContainer = document.createElement("div");
  imagesContainer.style.display = "flex";
  imagesContainer.style.flexDirection = "column";
  imagesContainer.style.gap = "24px";
  imagesContainer.style.alignItems = "center";
  imagesContainer.style.paddingBottom = "100px";

  canvasDataArray.forEach(({ canvas }) => {
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/jpeg", 0.9);
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "12px";
    img.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
    imagesContainer.appendChild(img);
  });
  
  overlay.appendChild(imagesContainer);
  
  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Đóng & Quay lại";
  closeBtn.style.position = "fixed";
  closeBtn.style.bottom = "max(env(safe-area-inset-bottom, 30px), 30px)";
  closeBtn.style.left = "50%";
  closeBtn.style.transform = "translateX(-50%)";
  closeBtn.style.backgroundColor = "#38bdf8";
  closeBtn.style.color = "#0f172a";
  closeBtn.style.border = "none";
  closeBtn.style.padding = "14px 32px";
  closeBtn.style.borderRadius = "999px";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.style.boxShadow = "0 10px 15px -3px rgba(56, 189, 248, 0.4)";
  closeBtn.style.fontFamily = "system-ui, -apple-system, sans-serif";
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

export async function downloadCanvasImage(canvas, filename) {
  if (!canvas) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");

  if (isIOS && navigator.canShare) {
    try {
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
      for (let i = 0; i < canvasDataArray.length; i++) {
        const { canvas, filename } = canvasDataArray[i];
        const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");
        const file = canvasToFileSync(canvas, jpgFilename, "image/jpeg", 0.9);
        filesArray.push(file);
      }
      
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        if (onProgress) onProgress(100, 100);
        await navigator.share({
          files: filesArray,
          title: "Tải ảnh về máy",
        });
        shareSuccess = true;
        return; 
      } else {
        console.warn("navigator.canShare returned false for multiple files.");
      }
    } catch (err) {
      console.warn("Web share failed for multiple files, falling back to manual modal.", err);
    }

    if (!shareSuccess) {
      // Ultimate foolproof fallback for iOS: Manual Save Modal
      if (onProgress) onProgress(100, 100);
      showLongPressModal(canvasDataArray);
      return;
    }
  }

  // Fallback to standard sequential download for Non-iOS
  for (let i = 0; i < canvasDataArray.length; i++) {
    const { canvas, filename } = canvasDataArray[i];
    const jpgFilename = filename.replace(/\.[^/.]+$/, ".jpg");
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = jpgFilename;
    link.href = url;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (onProgress) onProgress(i + 1, canvasDataArray.length);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
