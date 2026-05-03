"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ──────────────── Price Parser ──────────────── */
function parsePrices(text) {
  if (!text.trim()) return [];
  const lines = text.split("\n");
  const prices = [];
  for (const line of lines) {
    const parts = line.split("-").map((p) => p.trim()).filter(Boolean);
    prices.push(...parts);
  }
  return prices;
}

/* ──────────────── Canvas Drawer ──────────────── */
function drawLabeledImage(canvas, img, prices, config) {
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

    const centerX = cellX + cellW / 2;
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

/* ──────────────── ControlGroup Component ──────────────── */
function ControlGroup({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-muted/60">{hint}</span>}
    </div>
  );
}

/* ──────────────── Item Card Component ──────────────── */
function ItemCard({ item, index, total, updatePrice, remove, moveUp, moveDown, config }) {
  const canvasRef = useRef(null);
  const prices = parsePrices(item.priceText);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !item.imageObj) return;
    drawLabeledImage(canvas, item.imageObj, prices, config);
  }, [item.imageObj, item.priceText, config]);

  const rows = config.columns > 0 && prices.length > 0 ? Math.ceil(prices.length / config.columns) : 0;

  return (
    <div className="flex flex-col gap-3 p-4 border border-border rounded-xl bg-surface animate-fade-in shadow-sm h-full">
      <div className="flex justify-between items-center bg-surface-hover p-2 rounded-lg border border-border/50">
        <span className="text-sm font-semibold truncate flex-1" title={item.file.name}>
          {index + 1}. {item.file.name}
        </span>
        <button onClick={() => remove(item.id)} className="text-muted hover:text-danger ml-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="w-full bg-background/50 rounded-lg overflow-hidden flex justify-center items-center h-48 p-2 border border-border border-dashed">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-md rounded" />
      </div>

      <textarea
        value={item.priceText}
        onChange={(e) => updatePrice(item.id, e.target.value)}
        placeholder="Paste prices (e.g. 2m6 - 4m...)"
        className="w-full flex-1 min-h-[80px] bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
      />
      
      <div className="flex justify-between items-center text-xs text-muted px-1">
        <span>{prices.length} prices • {rows} rows</span>
        <div className="flex gap-2 bg-background border border-border rounded-md overflow-hidden">
          <button disabled={index === 0} onClick={() => moveUp(item.id)} className="p-1.5 hover:bg-surface-hover disabled:opacity-30 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <div className="w-px bg-border"></div>
          <button disabled={index === total - 1} onClick={() => moveDown(item.id)} className="p-1.5 hover:bg-surface-hover disabled:opacity-30 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main Page ──────────────── */
export default function Home() {
  const [items, setItems] = useState([]);
  const [bulkPrices, setBulkPrices] = useState("");
  const [columns, setColumns] = useState(5);
  const [verticalPosition, setVerticalPosition] = useState(70);
  const [labelColor, setLabelColor] = useState("#2563eb");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(28);
  const [isDragging, setIsDragging] = useState(false);
  const [stitchCols, setStitchCols] = useState(3);

  const fileInputRef = useRef(null);
  const bulkPricesRef = useRef("");
  
  useEffect(() => {
    bulkPricesRef.current = bulkPrices;
  }, [bulkPrices]);

  function syncToBulkPrices(nextItems) {
    setBulkPrices(currentBulk => {
      const lines = currentBulk.split('\n');
      const newLines = nextItems.map(it => it.priceText);
      for (let i = nextItems.length; i < lines.length; i++) {
        newLines.push(lines[i]);
      }
      return newLines.join('\n');
    });
    return nextItems;
  }

  const config = { columns, verticalPosition, labelColor, textColor, fontSize };

  // Handle files
  function handleFiles(files) {
    if (!files) return;
    
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    // Sử dụng map với index để đảm bảo thứ tự được giữ đúng như logic của webaccpubg
    const newPromises = validFiles.map((file, index) => {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).substring(2, 9);
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            resolve({ index, item: { id, file, imageObj: img, priceText: "" } });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    // Sử dụng Promise.all và sort lại theo index gốc để đảm bảo thứ tự đúng 100%
    Promise.all(newPromises).then((results) => {
      results.sort((a, b) => a.index - b.index);
      
      setItems((prev) => {
        const currentLines = bulkPricesRef.current.split('\n');
        const nextItems = [...prev];
        
        results.forEach((r) => {
          const newItem = r.item;
          newItem.priceText = currentLines[nextItems.length] || "";
          nextItems.push(newItem);
        });
        
        return syncToBulkPrices(nextItems);
      });
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e) => {
      // Don't intercept if user is typing in a textarea
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function handleDownloadStitched() {
    if (items.length === 0) return;

    // Calculate dimensions for the grid
    const cellW = Math.max(...items.map((it) => it.imageObj.width));
    const cellH = Math.max(...items.map((it) => it.imageObj.height));

    const totalCols = Math.min(items.length, stitchCols);
    const totalRows = Math.ceil(items.length / stitchCols);

    const canvas = document.createElement("canvas");
    canvas.width = cellW * totalCols;
    canvas.height = cellH * totalRows;
    const ctx = canvas.getContext("2d");

    items.forEach((item, i) => {
      const col = i % stitchCols;
      const row = Math.floor(i / stitchCols);
      
      const tempCanvas = document.createElement("canvas");
      drawLabeledImage(tempCanvas, item.imageObj, parsePrices(item.priceText), config);
      
      // Scale to fit exactly in cellW x cellH without cropping
      const scale = Math.min(cellW / item.imageObj.width, cellH / item.imageObj.height);
      const w = item.imageObj.width * scale;
      const h = item.imageObj.height * scale;
      
      // Center in cell
      const x = col * cellW + (cellW - w) / 2;
      const y = row * cellH + (cellH - h) / 2;
      
      ctx.drawImage(tempCanvas, x, y, w, h);
    });

    const link = document.createElement("a");
    link.download = "stitched-grid-prices.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function handleClear() {
    setItems([]);
    setBulkPrices("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updatePrice(id, text) {
    setItems(prev => syncToBulkPrices(prev.map(it => it.id === id ? { ...it, priceText: text } : it)));
  }

  function remove(id) {
    setItems(prev => syncToBulkPrices(prev.filter(it => it.id !== id)));
  }

  function moveUp(id) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return syncToBulkPrices(copy);
    });
  }

  function moveDown(id) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
      return syncToBulkPrices(copy);
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Set Price <span className="text-muted font-normal text-sm ml-2">Batch Editor</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={handleDownloadStitched}
                className="h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-sm shadow-accent/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Stitch & Download
              </button>
            )}
            <span className="text-xs text-muted hidden sm:block border-l border-border pl-3">
              100% browser-based
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* ─── Sidebar Controls ─── */}
        <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-5 animate-fade-in">
          
          {/* Upload */}
          <section className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">1</span>
              Add Images
            </h2>
            <div
              className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-accent bg-accent/10 scale-[1.02]"
                  : "border-border hover:border-muted hover:bg-surface-hover"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                id="image-upload"
              />
              <div className="flex flex-col items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-muted">
                  Drop, paste, or <span className="text-accent font-medium">browse</span>
                </span>
              </div>
            </div>
            {items.length > 0 && (
              <div className="flex justify-between items-center bg-background p-2 rounded border border-border text-xs">
                <span className="text-success font-medium">{items.length} image(s) loaded</span>
                <button onClick={handleClear} className="text-muted hover:text-danger hover:underline">Clear all</button>
              </div>
            )}
          </section>

          {/* Auto-Match Prices */}
          <section className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">2</span>
              Auto-Match Prices
            </h2>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-muted leading-relaxed">
                Paste your batch of prices here. <strong className="text-accent">Line 1</strong> goes to <strong className="text-accent">Image 1</strong>, Line 2 to Image 2, etc.
              </p>
              <textarea
                value={bulkPrices}
                onChange={(e) => {
                  const text = e.target.value;
                  setBulkPrices(text);
                  const lines = text.split('\n');
                  setItems(prev => prev.map((it, i) => ({
                    ...it,
                    priceText: lines[i] !== undefined ? lines[i] : ""
                  })));
                }}
                placeholder="2m6 - 2m4 - 4m&#10;4m4 - 3m1 - 2m4&#10;..."
                className="w-full h-32 bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
              />
              <div className="flex justify-between items-center text-xs text-muted px-1">
                <span>{bulkPrices.split('\n').filter(Boolean).length} lines detected</span>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-5 sticky top-24">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">3</span>
              Global Settings
            </h2>

            <ControlGroup label="Columns">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{columns}</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Label Position" hint={`${verticalPosition}% from top of cell`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={verticalPosition}
                  onChange={(e) => setVerticalPosition(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{verticalPosition}%</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Font Size" hint={`${fontSize}px (scaled to image width)`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{fontSize}</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Stitch Layout" hint="Columns in final downloaded image">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stitchCols}
                  onChange={(e) => setStitchCols(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{stitchCols} cols</span>
              </div>
            </ControlGroup>

            <div className="flex gap-4">
              <ControlGroup label="Label Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={labelColor}
                    onChange={(e) => setLabelColor(e.target.value)}
                  />
                </div>
              </ControlGroup>
              <ControlGroup label="Text Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
              </ControlGroup>
            </div>
            
            <div className="text-xs text-muted/70 bg-background p-3 rounded border border-border/50 italic leading-relaxed">
              * The final stitched image will lay out your items into a grid based on "Stitch Layout".
            </div>
          </section>
        </aside>

        {/* ─── Cards List ─── */}
        <section className="flex-1 flex flex-col gap-4 min-w-0">
          {items.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-12 text-muted animate-fade-in bg-surface/30">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               <h3 className="text-lg font-medium text-foreground mb-1">No images added</h3>
               <p className="text-sm opacity-80 text-center max-w-sm">Upload or paste multiple screenshots. Each image will have its own price input field to guarantee perfect alignment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {items.map((item, index) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  total={items.length}
                  updatePrice={updatePrice} 
                  remove={remove} 
                  moveUp={moveUp}
                  moveDown={moveDown}
                  config={config} 
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
