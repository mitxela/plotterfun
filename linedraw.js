importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Contours', type:'checkbox', noRestart:true},
  {label: 'Contour detail', value: 2, min: 1, max: 3},
  {label: 'Hatching', type:'checkbox', noRestart:true},
  {label: 'Hatch scale', value: 8, min: 1, max: 24},
]]);

let config, pixData=[], getPixel, outlines=[];
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

  const pixelCache=[]
  for (let x=0;x<config.width;x++) {
    pixelCache[x]=[]
    for (let y=0;y<config.height;y++) {
      pixelCache[x][y] = Math.min(255,Math.max(0,(luma(x,y)-low)*scale ))
    }
  }
  return (x,y)=>{
    return (x>=0 && y>=0 && x<config.width &&y<config.height)
      ? pixelCache[Math.floor(x)][Math.floor(y)]
      : 0
  }
}



function SobelFilter() {

  const sobelData = Array(config.width*config.height)
  const getPixel = autocontrast(0.1)
  let i = 0;

  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      let px =
          -1 * getPixel(x - 1, y - 1) +
           1 * getPixel(x + 1, y - 1) +
          -2 * getPixel(x - 1, y    ) +
           2 * getPixel(x + 1, y    ) +
          -1 * getPixel(x - 1, y + 1) +
           1 * getPixel(x + 1, y + 1)

      let py = 
        -1 * getPixel(x - 1, y - 1) +
        -2 * getPixel(x    , y - 1) +
        -1 * getPixel(x + 1, y - 1) +
         1 * getPixel(x - 1, y + 1) +
         2 * getPixel(x    , y + 1) +
         1 * getPixel(x + 1, y + 1)
      
      let magnitude = (Math.sqrt((px * px) + (py * py)));
      sobelData[i++] = magnitude>128?255:0

      //if (magnitude > 128) {
        
      //} 
    }
  }

  return sobelData;
}
function getdots( pixData ){

  const dots = []
  for (let y=0; y<config.height-1; y++) {
    row = []
    for (let x=1; x<config.width; x++) {
      if (pixData[x+config.width*y] == 255) {
        if (row.length) {
          if (x - row[row.length-1][0] == row[row.length-1][1]+1)
//            row[row.length-1] = [ row[row.length-1][0], row[row.length-1][1]+1 ]
            row[row.length-1][1]++
          else row.push([x,0])
        } else row.push([x,0])
      }

    }
    dots.push(row)
  }


  return dots
}

function connectdots(dots){

  let contours=[]
  for (let y in dots) {
     
    y=Number(y)
    //if (y> 20) break;
    for (let i in dots[y]) {
      let x = dots[y][i][0]
      if (y==0) contours.push([[x,y]])
      else{
        let closest = -1, cdist = 10000
        for ( let j in dots[y-1] ) {
          let x0 = dots[y-1][j][0]
          let d = Math.abs(x-x0)
          if (d < cdist) { closest=x0; cdist=d }
        }
        if (cdist > 3)
          contours.push([[x,y]])
        else {
          let found=0
          for (let k in contours) {
            let last = contours[k][contours[k].length-1]
            if (last[0] == closest && last[1] == y-1) {
              contours[k].push([x,y])
              found=1
              break
            }
          }
          if (found==0) contours.push([[x,y]])
        }

      }

    }
    for (let c in contours){
      if (contours[c][contours[c].length-1][1] < y-1 && contours[c].length<4) {
        contours.splice(c,1)
        console.log('removed')
      }
    }
  }

  return contours
}






async function render() {

//  getPixel = pixelProcessor(config, pixData)

  postMessage(['msg', "Finding edges"]);
  var sobelData;
//  await makeAsync(()=>{

        
    sobelData = SobelFilter(pixData);
//`    var dots = 
/*
    sobelData=[]
    var pixelAt = autocontrast(0.1)
    for (let y=0;y<config.height;y++)
      for (let x=0;x<config.width;x++)
        sobelData[x+y*config.width]=pixelAt(x,y);
*/

//  })
  // plotdots
  dots = getdots(sobelData)

  contours = connectdots(dots)
  console.log(contours)


  for (let i in sobelData) sobelData[i]/=8


//  for (let y=0;y<config.width;y++){
//    if (dots[y])
  for (let y in dots) {
    for (let row=0; row<dots[y].length; row++){
      let x = dots[y][row][0]
      let ind= (y*config.width+x)
      sobelData[ ind ] = 255
    }
  }

  postMessage(['points', contours])

  postMessage(['dbgimg', sobelData])
//  postMessage(['dbg', dots])




  draw()
  postMessage(['msg', "Done"]);
}


