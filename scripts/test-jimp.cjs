const Jimp = require('jimp').Jimp;
const path = require('path');
(async()=>{
  async function makeSimple(name) {
    const img = new Jimp({width:50,height:50,color:0xffffffff});
    const buf = await new Promise((res, rej) => {
      img.getBuffer('image/png', (e, b) => e ? rej(e) : res(b));
    });
    fs.writeFileSync(path.join('public/cards', name+'.png'), buf);
  }
  console.log('start test');
  await makeSimple('first');
  console.log('first done');
  await makeSimple('second');
  console.log('second done');
})();