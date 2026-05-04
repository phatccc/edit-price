const text = `Nhà có tí acc nhờ ae treo giúp em nhé
33m5       5m5        6m3
12m          12m6      28m
35m         380m      28m
15m2       3m5         3m
31m          76m         21m
23m5 thêm nhiều cái format vào kiểu có đưa chữ vào thì bỏ chữ đi các thứ`;

const extractPricesFromText = (text) => {
  const regex = /_|(?:\b\d+(?:[.,]\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k)(?:[ \t]?\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k))?)?\b|\b\d+(?:[.,]\d+)?\b)/gi;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.trim()) : [];
};

console.log(extractPricesFromText(text));
