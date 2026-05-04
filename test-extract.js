const text = `Nhà có tí acc nhờ ae treo giúp em nhé
33m5       5m5        6m3
12m          12m6      28m
35m         380m      28m
15m2       3m5         3m
31m          76m         21m
23m5 thêm nhiều cái format vào kiểu có đưa chữ vào thì bỏ chữ đi các thứ`;

function extractPrices(input) {
  // We want to extract things like: 33m5, 12m, 28m, 15m2, 380m, 500k, 2 tr 5, 2 củ 5
  // Also standalone numbers like 500, 31, etc.
  // But we want to ignore words.
  
  // A regex to find potential price strings:
  // 1. Number + m/tr/củ/k + optional number (e.g. 33m5, 2 củ 5)
  const regex = /\b\d+(?:[.,]\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k)(?:[ \t]?\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k))?)?\b|\b\d+(?:[.,]\d+)?\b/gi;
  
  const matches = input.match(regex);
  return matches ? matches.map(m => m.trim()) : [];
}

console.log(extractPrices(text));
