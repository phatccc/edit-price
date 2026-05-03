export function drawLabeledImage(canvas, img, prices, config) {
  const {
    columns,
    verticalPosition,
    labelColor,
    textColor,
    fontSize,
  } = config;

  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw base image
  ctx.drawImage(img, 0, 0);

  if (prices.length === 0) return;

  const rows = Math.ceil(prices.length / columns);
  const cellW = img.width / columns;
  const cellH = img.height / rows;

  const scale = Math.min(cellW, cellH) / 200;
  const scaledFontSize = fontSize * scale;

  ctx.font = `bold ${scaledFontSize}px "Inter", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < prices.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const cellX = col * cellW;
    const cellY = row * cellH;

    const centerX = cellX + cellW * (config.horizontalPosition / 100);
    const posY = cellY + cellH * (verticalPosition / 100);

    const text = prices[i];
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const padH = scaledFontSize * 0.6;
    const padW = scaledFontSize * 0.8;
    const rectW = textW + padW * 2;
    const rectH = scaledFontSize + padH * 2;
    const radius = rectH * 0.35;

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Rounded rectangle
    ctx.fillStyle = labelColor;
    ctx.beginPath();
    const x = centerX - rectW / 2;
    const y = posY - rectH / 2;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + rectW - radius, y);
    ctx.quadraticCurveTo(x + rectW, y, x + rectW, y + radius);
    ctx.lineTo(x + rectW, y + rectH - radius);
    ctx.quadraticCurveTo(x + rectW, y + rectH, x + rectW - radius, y + rectH);
    ctx.lineTo(x + radius, y + rectH);
    ctx.quadraticCurveTo(x, y + rectH, x, y + rectH - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Text
    ctx.fillStyle = textColor;
    ctx.fillText(text, centerX, posY);
  }
}
