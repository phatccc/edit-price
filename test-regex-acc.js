const text = "acc 1: 5m, acc 2: 10m";
const regex = /\b\d+(?:[.,]\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k)(?:[ \t]?\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k))?)?\b|\b\d+(?:[.,]\d+)?\b/gi;
console.log(text.match(regex));
