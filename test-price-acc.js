// test price script
function parsePriceToNumber(input) {
  if (!input || input === "_") return null;
  let s = input.toLowerCase().trim();
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

console.log(parsePriceToNumber("acc 1: 5m"));
console.log(parsePriceToNumber("giá: 2m5"));
