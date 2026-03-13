const fs=require('fs');
const {PNG} = require('pngjs');
fs.createReadStream('public/cards/AS.png').pipe(new PNG()).on('parsed',function(){
  let cnt=0,sumR=0,sumG=0,sumB=0;
  for(let y=0;y<this.height;y++){
    for(let x=0;x<this.width;x++){
      const idx=(this.width*y+x)<<2;
      sumR+=this.data[idx];sumG+=this.data[idx+1];sumB+=this.data[idx+2];cnt++;
    }
  }
  console.log('avg RGB',sumR/cnt, sumG/cnt, sumB/cnt);
});