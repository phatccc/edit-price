"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { parsePrices, parsePriceToNumber, formatPriceFromNumber } from "../utils/price";
import { downloadMultipleCanvasImages } from "../utils/download";
import ControlGroup from "../components/ControlGroup";
import ItemCard from "../components/ItemCard";

/* ──────────────── Main Page ──────────────── */
export default function Home() {
  const [items, setItems] = useState([]);
  const [bulkPrices, setBulkPrices] = useState("");
  const [columns, setColumns] = useState(5);
  const [horizontalPosition, setHorizontalPosition] = useState(49);
  const [verticalPosition, setVerticalPosition] = useState(51);
  const [labelColor, setLabelColor] = useState("#38bdf8");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fileInputRef = useRef(null);
  const bulkPricesRef = useRef("");
  
  useEffect(() => {
    bulkPricesRef.current = bulkPrices;
  }, [bulkPrices]);

  function syncToBulkPrices(nextItems) {
    setBulkPrices(currentBulk => {
      const currentAllPrices = currentBulk.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p);
      
      const newAllPrices = nextItems.map(it => {
        const pt = it.priceText ? it.priceText.trim() : "";
        return pt;
      });
      
      for (let i = nextItems.length; i < currentAllPrices.length; i++) {
        newAllPrices.push(currentAllPrices[i]);
      }
      
      // Remove trailing empty items so we don't clutter the input with `_ - _ - _`
      while (newAllPrices.length > 0 && (!newAllPrices[newAllPrices.length - 1] || newAllPrices[newAllPrices.length - 1] === "_")) {
        newAllPrices.pop();
      }
      
      if (newAllPrices.length === 0) return "";
      
      const finalPrices = newAllPrices.map(p => p ? p : "_");
      
      const formatted = [];
      for (let i = 0; i < finalPrices.length; i += 3) {
        const chunk = finalPrices.slice(i, i + 3);
        formatted.push(chunk.join(' - '));
      }
      return formatted.join('\n');
    });
    return nextItems;
  }

  const config = { columns, horizontalPosition, verticalPosition, labelColor, textColor, fontSize };

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
        const currentAllPrices = bulkPricesRef.current.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p);
        const nextItems = [...prev];
        
        results.forEach((r) => {
          const newItem = r.item;
          const assignedPrice = currentAllPrices[nextItems.length];
          newItem.priceText = (assignedPrice && assignedPrice !== "_") ? assignedPrice : "";
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

  // handleDownloadStitched removed as per user request

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

  const handleDownloadAll = async () => {
    if (items.length === 0 || isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      const canvasDataArray = [];
      for (const item of items) {
        const canvas = document.getElementById(`canvas-${item.id}`);
        if (canvas) {
          canvasDataArray.push({
            canvas,
            filename: `labeled_${item.file.name.replace(/\.[^/.]+$/, "")}.png`
          });
        }
      }
      
      await downloadMultipleCanvasImages(canvasDataArray, (current, total) => {
        setDownloadProgress(Math.round((current / total) * 100));
      });
    } finally {
      // Delay resetting state slightly so user sees 100%
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 500);
    }
  };

  const applyFormatAndMarkup = (isAuto = false) => {
    if (!bulkPrices.trim()) return;
    const allPrices = bulkPrices.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p);
    
    const formattedPrices = allPrices.map(p => {
      if (p === "_") return "_";
      const num = parsePriceToNumber(p);
      if (num === null) return p; // fallback
      
      let finalMarkup = 0;
      if (isAuto) {
        const priceInMillion = num / 1000;
        if (priceInMillion < 3) finalMarkup = 300;
        else if (priceInMillion < 7) finalMarkup = 500;
        else if (priceInMillion < 10) finalMarkup = 600;
        else if (priceInMillion < 20) finalMarkup = 1000;
        else if (priceInMillion < 50) finalMarkup = 2000;
        else if (priceInMillion < 70) finalMarkup = 3000;
        else if (priceInMillion < 100) finalMarkup = 4000;
        else finalMarkup = 5000;
      }

      return formatPriceFromNumber(num + finalMarkup);
    });

    while (formattedPrices.length > 0 && formattedPrices[formattedPrices.length - 1] === "_") {
      formattedPrices.pop();
    }

    const formattedLines = [];
    for (let i = 0; i < formattedPrices.length; i += 3) {
      const chunk = formattedPrices.slice(i, i + 3);
      formattedLines.push(chunk.join(' - '));
    }
    const newText = formattedLines.join('\n');
    setBulkPrices(newText);
    
    // Sync to items
    const parsedNewPrices = newText.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p);
    setItems(prev => prev.map((it, i) => {
      const assignedPrice = parsedNewPrices[i];
      return {
        ...it,
        priceText: (assignedPrice !== undefined && assignedPrice !== "_") ? assignedPrice : ""
      };
    }));
  };

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
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-sm shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing... {downloadProgress}%
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download All ({items.length})
                  </>
                )}
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
        <aside className="w-full lg:w-80 xl:w-80 flex-shrink-0 flex flex-col gap-5 animate-fade-in">
          
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
                Paste your batch of prices here. They will automatically be distributed: <strong className="text-accent">1 Price</strong> = <strong className="text-accent">1 Image</strong> sequentially.
              </p>
              <textarea
                value={bulkPrices}
                onChange={(e) => {
                  const text = e.target.value;
                  setBulkPrices(text);
                  const allPrices = text.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p);
                  setItems(prev => prev.map((it, i) => {
                    const assignedPrice = allPrices[i];
                    return {
                      ...it,
                      priceText: (assignedPrice !== undefined && assignedPrice !== "_") ? assignedPrice : ""
                    };
                  }));
                }}
                placeholder=""
                className="w-full h-24 md:h-32 bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
              />
              
              {/* Markup and Format Tools */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => applyFormatAndMarkup(false)}
                  className="h-9 rounded-md bg-accent/10 hover:bg-accent/20 text-accent font-semibold transition-colors text-sm flex items-center justify-center gap-1.5 touch-manipulation"
                  title="Chỉ chuẩn hóa lại định dạng giá, không đôn"
                >
                  Chỉ Format
                </button>
                <button
                  onClick={() => applyFormatAndMarkup(true)}
                  className="h-9 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-semibold transition-colors text-sm flex items-center justify-center gap-1.5 touch-manipulation"
                  title="Đôn tự động theo Rule bậc thang"
                >
                  Đôn Auto
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-muted px-1 mt-1">
                <span>{bulkPrices.split(/[\r\n\-–—]/).map(p => p.trim()).filter(p => p).length} prices detected</span>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-5 lg:sticky lg:top-24 z-10">
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

            <ControlGroup label="Label Position (Y)" hint={`${verticalPosition}% from top of cell`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={verticalPosition}
                  onChange={(e) => setVerticalPosition(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{verticalPosition}%</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Label Position (X)" hint={`${horizontalPosition}% from left of cell`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={horizontalPosition}
                  onChange={(e) => setHorizontalPosition(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{horizontalPosition}%</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Font Size" hint={`${fontSize}px (scaled to image width)`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="4"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-sm font-bold text-accent">{fontSize}</span>
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
          </section>
        </aside>

        {/* ─── Cards List ─── */}
        <section className="flex-1 flex flex-col gap-4 min-w-0">
          {items.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-12 text-muted animate-fade-in bg-gradient-to-b from-surface/30 to-background/50">
               <div className="w-20 h-20 mb-6 rounded-full bg-accent/10 flex items-center justify-center shadow-inner">
                 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               </div>
               <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">No Images Yet</h3>
               <p className="text-base opacity-80 text-center max-w-md">Drag and drop your screenshots here, or click to browse. Let's make pricing magical.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-8">
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
