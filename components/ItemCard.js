"use client";

import { useRef, useEffect } from "react";
import { parsePrices } from "../utils/price";
import { drawLabeledImage } from "../utils/canvas";

export default function ItemCard({ item, index, total, updatePrice, remove, moveUp, moveDown, config }) {
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

      <div className="w-full bg-black/40 rounded-lg overflow-hidden flex justify-center items-center p-2 border border-border">
        <canvas id={`canvas-${item.id}`} ref={canvasRef} className="w-full h-auto max-h-[280px] object-contain drop-shadow-md rounded" />
      </div>

      <textarea
        value={item.priceText}
        onChange={(e) => updatePrice(item.id, e.target.value)}
        placeholder="Paste prices (e.g. 2m6 - 4m...)"
        className="w-full flex-1 min-h-[80px] bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
      />
      
      <div className="flex justify-between items-center text-xs text-muted px-1 mt-1">
        <span>{prices.length > 0 ? "1 price mapped" : "No price mapped"}</span>
        <div className="flex gap-1.5 sm:gap-2">
          <button 
            onClick={() => {
              if (!canvasRef.current) return;
              const link = document.createElement("a");
              link.download = `labeled_${item.file.name.replace(/\.[^/.]+$/, "")}.png`;
              link.href = canvasRef.current.toDataURL("image/png");
              link.click();
            }}
            className="h-10 px-3 sm:h-8 sm:px-3 flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent-hover text-white font-medium transition-colors shadow-sm shadow-accent/20 touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span className="hidden sm:inline">Download</span>
          </button>
          <div className="flex bg-background border border-border rounded-md overflow-hidden">
            <button disabled={index === 0} onClick={() => moveUp(item.id)} className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-surface-hover disabled:opacity-30 transition-colors touch-manipulation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <div className="w-px bg-border"></div>
            <button disabled={index === total - 1} onClick={() => moveDown(item.id)} className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-surface-hover disabled:opacity-30 transition-colors touch-manipulation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
