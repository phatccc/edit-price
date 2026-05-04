export function parsePrices(text) {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const prices = [];
  lines.forEach((line) => {
    line.split('-').forEach((p) => {
      const pt = p.trim();
      if (pt && pt !== "_") prices.push(pt);
    });
  });
  return prices;
}

export function parsePriceToNumber(input) {
  if (!input || input === "_") return null;
  let s = input.toLowerCase().trim();
  
  // replace comma with dot to support Vietnamese decimal (e.g., 2,5m -> 2.5m)
  s = s.replace(/,/g, '.');

  if (s.includes('m') || s.includes('tr') || s.includes('củ')) {
    const parts = s.replace('tr', 'm').replace('củ', 'm').split('m');
    const mStr = parts[0].replace(/[^0-9.]/g, '');
    const m = parseFloat(mStr) || 0;
    
    let k = 0;
    if (parts[1]) {
      const p1 = parts[1].replace(/[^0-9]/g, '');
      if (p1.length === 1) k = parseInt(p1) * 100;
      else if (p1.length === 2) k = parseInt(p1) * 10;
      else if (p1.length >= 3) k = parseInt(p1.substring(0,3));
    }
    return m * 1000 + k;
  }
  
  if (s.includes('k')) {
    const kStr = s.replace('k', '').replace(/[^0-9.]/g, '');
    return parseFloat(kStr) || 0;
  }
  
  const numStr = s.replace(/[^0-9.]/g, '');
  const num = parseFloat(numStr);
  
  if (!isNaN(num)) {
    if (num < 100 && s.includes('.')) return num * 1000;
    return num;
  }
  return null;
}

export function formatPriceFromNumber(num) {
  if (num === null || isNaN(num)) return "_";
  if (num === 0) return "0";
  
  if (num >= 1000) {
    const m = Math.floor(num / 1000);
    const k = Math.round(num % 1000);
    if (k === 0) return `${m}m`;
    if (k % 100 === 0) return `${m}m${k / 100}`;
    if (k % 10 === 0) {
      const frac = k / 10;
      return `${m}m${frac < 10 ? '0' + frac : frac}`;
    }
    return `${m}m${k}`;
  }
  return `${num}k`;
}
