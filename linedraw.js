importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Contours', type:'checkbox', noRestart:true},
  {label: 'Contour detail', value: 2, min: 1, max: 3},
  {label: 'Hatching', type:'checkbox', noRestart:true},
  {label: 'Hatch scale', value: 8, min: 1, max: 24},
  {label: 'thresh', value: 128, min: 1, max: 255},
]]);

let config, pixData=[], pixelCache=[], getPixel, outlines=[];
onmessage = function(e) {
  if (pixData.length == 0) {
    [ config, pixData ] = e.data;
    render()
  } else {
    Object.assign(config, e.data[0])
    draw()
  }
}

function makeAsync(f) {
  return new Promise(resolve => setTimeout(() => resolve(f()), 0) )
}
function draw() {
  //postMessage(['points', outlines])
}


function autocontrast(cutoff){

  function luma(x,y) {
    let i = 4*(x+config.width*y)
    return pixData.data[i]*0.299 + pixData.data[i+1]*0.587 + pixData.data[i]*0.114 // ITU-R 601-2
//    return pixData.data[i]*0.2125 + pixData.data[i+1]*0.7154 + pixData.data[i]*0.0721 // ITU-R 709
  }

  let hist = []
  for (let i=0;i<256;i++) hist[i]=0;

  for (let x=0;x<config.width;x++) {
    for (let y=0;y<config.height;y++) {
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

  for (let x=0;x<config.width;x++) {
    pixelCache[x]=[]
    for (let y=0;y<config.height;y++) {
      pixelCache[x][y] = Math.min(255,Math.max(0,(luma(x,y)-low)*scale ))
    }
  }
  return (x,y)=>{
    if (x>=0 && y>=0 && x<config.width &&y<config.height)
      return pixelCache[Math.floor(x)][Math.floor(y)]
    else return 0
  }
}



function SobelFilter() {

  var kernelX = [
    [-1,0,1],
    [-2,0,2],
    [-1,0,1]
  ];

  var kernelY = [
    [-1,-2,-1],
    [0,0,0],
    [1,2,1]
  ];

  var sobelData = [];
//  var pixelAt = (x,y)=> getPixel(x,y)||0;
//  var pixelAt = (x,y)=> (pixData.data[(x+y*config.width)*4] + pixData.data[(x+y*config.width)*4+1] + pixData.data[(x+y*config.width)*4+2])/3
//  var pixelAt = (x,y)=> pixData.data[(x+y*config.width)*4+2]

  var pixelAt = autocontrast(0.1)

  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      var pixelX = (
          (kernelX[0][0] * pixelAt(x - 1, y - 1)) +
       //   (kernelX[0][1] * pixelAt(x, y - 1)) +
          (kernelX[0][2] * pixelAt(x + 1, y - 1)) +
          (kernelX[1][0] * pixelAt(x - 1, y)) +
       //   (kernelX[1][1] * pixelAt(x, y)) +
          (kernelX[1][2] * pixelAt(x + 1, y)) +
          (kernelX[2][0] * pixelAt(x - 1, y + 1)) +
       //   (kernelX[2][1] * pixelAt(x, y + 1)) +
          (kernelX[2][2] * pixelAt(x + 1, y + 1))
      );

      var pixelY = (
        (kernelY[0][0] * pixelAt(x - 1, y - 1)) +
        (kernelY[0][1] * pixelAt(x, y - 1)) +
        (kernelY[0][2] * pixelAt(x + 1, y - 1)) +
      //  (kernelY[1][0] * pixelAt(x - 1, y)) +
      //  (kernelY[1][1] * pixelAt(x, y)) +
      //  (kernelY[1][2] * pixelAt(x + 1, y)) +
        (kernelY[2][0] * pixelAt(x - 1, y + 1)) +
        (kernelY[2][1] * pixelAt(x, y + 1)) +
        (kernelY[2][2] * pixelAt(x + 1, y + 1))
      );

      var magnitude = (Math.sqrt((pixelX * pixelX) + (pixelY * pixelY)))>>>0;

      sobelData.push(magnitude)
      //sobelData.push(magnitude>config.thresh?255:0)
    }
  }

  return sobelData;
}
function getdots( pixData ){
//  for 


}



async function render() {

//  getPixel = pixelProcessor(config, pixData)

  postMessage(['msg', "Finding edges"]);
  var sobelData;
  await makeAsync(()=>{

        
 //   sobelData = SobelFilter(pixData);

    sobelData=[]
    var pixelAt = autocontrast(0.1)
    for (let y=0;y<config.height;y++)
      for (let x=0;x<config.width;x++)
        sobelData[x+y*config.width]=pixelAt(x,y);

  })

  postMessage(['dbg', sobelData])



  draw()
  postMessage(['msg', "Done"]);
}


