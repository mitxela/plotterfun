defaultControls = [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
]


// Apply brightness / contrast and flatten to monochrome
// taken from squigglecam

function pixelProcessor(config, imagePixels){

  const width = parseInt(config.width);
  const contrast = parseInt(config.Contrast);
  const brightness = parseInt(config.Brightness);
  const minBrightness = parseInt(config['Min brightness']);
  const maxBrightness = parseInt(config['Max brightness']);
  const black = config.Inverted;
  let contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  return function(x, y) {
  
    let b;
    let pixIndex  = Math.floor(x) + Math.floor(y) * width;
  
    if (contrast !== 0) {
      b = (0.2125 * ((contrastFactor * (imagePixels.data[4 * pixIndex]       - 128) + 128) + brightness)) 
        + (0.7154 * ((contrastFactor * (imagePixels.data[4 * (pixIndex + 1)] - 128) + 128) + brightness))
        + (0.0721 * ((contrastFactor * (imagePixels.data[4 * (pixIndex + 2)] - 128) + 128) + brightness));
    } else {
      b = (0.2125 * (imagePixels.data[4*pixIndex] + brightness)) 
        + (0.7154 * (imagePixels.data[4*(pixIndex + 1)] + brightness))
	+ (0.0721 * (imagePixels.data[4*(pixIndex + 2)] + brightness));
    }
    if (black) {
      b = Math.min(255-minBrightness,255-b);
    } else {
      b = Math.max(minBrightness,b);
    }
  
    return Math.max(maxBrightness-b,0);
  }
}



// autocontrast, my implementation
function autocontrast(pixData, cutoff){

  function luma(x,y) {
    let i = 4*(x+width*y)
    return pixData.data[i]*0.299 + pixData.data[i+1]*0.587 + pixData.data[i]*0.114 // ITU-R 601-2
//    return pixData.data[i]*0.2125 + pixData.data[i+1]*0.7154 + pixData.data[i]*0.0721 // ITU-R 709
  }

  let hist = []
  for (let i=0;i<256;i++) hist[i]=0;

  for (let x=0;x<width;x++) {
    for (let y=0;y<height;y++) {
      let b = Math.round(luma(x,y))
      hist[b]++ 
    }
  }
  let total=0, low=0, high=255
  for (let i=0;i<256;i++){
    total += hist[i];
  }
  cutoff*=total;

  for (let i=0;i<255;i++) {
    low+=hist[i]
    if (low>cutoff) {low=i; break}
  }
  for (let i=255;i>1;i--) {
    high+=hist[i]
    if (high>=cutoff) {high=i; break}
  }

  let scale = (255/(high-low)) || 1

  const pixelCache=[]
  for (let x=0;x<width;x++) {
    pixelCache[x]=[]
    for (let y=0;y<height;y++) {
      pixelCache[x][y] = Math.min(255,Math.max(0,(luma(x,y)-low)*scale ))
    }
  }
  return (x,y)=>{
    return (x>=0 && y>=0 && x<width &&y<height)
      ? pixelCache[x][y]
      : 0
  }
}




// perlin noise
// ported from lingdong's linedraw.py

(function(){
  var PERLIN_YWRAPB = 4
  var PERLIN_YWRAP = 1<<PERLIN_YWRAPB
  var PERLIN_ZWRAPB = 8
  var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB
  var PERLIN_SIZE = 4095
  
  var perlin_octaves = 4
  var perlin_amp_falloff = 0.5
  
  function scaled_cosine(i) {
      return 0.5*(1.0-Math.cos(i*Math.PI))
  }
  
  var perlin = null
  
  perlinNoise = function(x,y=0,z=0) {
    if (perlin == null) {
      perlin = []
      for (let i =0;i<PERLIN_SIZE+1;i++) {
        perlin.push(Math.random())
      }
    }
    if (x<0) x=-x
    if (y<0) y=-y
    if (z<0) z=-z
    
    let [ xi,yi,zi ] = [ ~~x, ~~y, ~~z ]
    let xf = x-xi
    let yf = y-yi
    let zf = z-zi
    let rxf, ryf
    
    let r = 0
    let ampl = 0.5
    
    let n1, n2, n3
  
    for (let o=0; o<perlin_octaves; o++) {
      let of=xi+(yi<<PERLIN_YWRAPB)+(zi<<PERLIN_ZWRAPB)
  
      rxf = scaled_cosine(xf)
      ryf = scaled_cosine(yf)
  
      n1  = perlin[of&PERLIN_SIZE]
      n1 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n1)
      n2  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE]
      n2 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n2)
      n1 += ryf*(n2-n1)
  
      of += PERLIN_ZWRAP
      n2  = perlin[of&PERLIN_SIZE]
      n2 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n2)
      n3  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE]
      n3 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n3)
      n2 += ryf*(n3-n2)
  
      n1 += scaled_cosine(zf)*(n2-n1)
  
      r += n1*ampl
      ampl *= perlin_amp_falloff
      xi<<=1
      xf*=2
      yi<<=1
      yf*=2
      zi<<=1
      zf*=2
      
      if (xf>=1.0) xi+=1, xf-=1
      if (yf>=1.0) yi+=1, yf-=1
      if (zf>=1.0) zi+=1, zf-=1
    }
    return r
  }
})();

