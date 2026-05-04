const text = "_ - 1m5 - _";
const regex = /_|(?:\b\d+(?:[.,]\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k)(?:[ \t]?\d+)?(?:[ \t]?(?:m|tr(?:iệu)?|củ|k))?)?\b|\b\d+(?:[.,]\d+)?\b)/gi;
console.log(text.match(regex));
