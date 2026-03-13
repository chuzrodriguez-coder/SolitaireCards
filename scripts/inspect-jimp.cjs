const Jimp = require('jimp').Jimp;
(async () => {
  const img = new Jimp({width: 100, height: 100, color: 0xFFFFFFFF});
  console.log('keys', Object.keys(img));
  console.log('methods on prototype', Object.getOwnPropertyNames(Object.getPrototypeOf(img)));
  console.log('has writeAsync', typeof img.writeAsync, 'has write', typeof img.write);
})();