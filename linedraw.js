importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Contours', type:'checkbox', noRestart:true},
  {label: 'Contour detail', value: 2, min: 1, max: 3},
  {label: 'Hatching', type:'checkbox', noRestart:true},
  {label: 'Hatch scale', value: 8, min: 1, max: 24},
  {label: 'simp', value: 8, min: 1, max: 24},
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
      ? pixelCache[x][y]
      : 0
  }
}



function SobelFilter(getPixel) {

  const pixData = Array(config.width)
  let i = 0;

  for (let x = 0; x < config.width; x++) {
    pixData[x] = Array(config.height)
    for (let y = 0; y < config.height; y++) {
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
      
      pixData[x][y] =(px*px)+(py*py) >128*128 ? 255 : 0;

    }
  }

  return pixData;
}
function getdotsV( pixData ){

  const dots = []
  for (let y=0; y<config.height-1; y++) {
    row = []
    for (let x=1; x<config.width; x++) {
      if (pixData[x][y] == 255) {
        row.push(x)
        while (x<config.width && pixData[x][y] ==255) x++
      }
    }
    dots.push(row)
  }
  return dots
}
function getdotsH( pixData ){

  const dots = []
  for (let x=0; x<config.width-1; x++) {
    row = []
    for (let y=1; y<config.height; y++) {
      if (pixData[x][y] == 255) {
        row.push(y)
        while (y<config.height && pixData[x][y] ==255) y++
      }
    }
    dots.push(row)
  }
  return dots
}

function connectdotsV(dots){

  let contours=[]
  for (let y in dots) {
     
    y=Number(y)
    //if (y> 20) break;
    for (let i in dots[y]) {
      let x = dots[y][i]
      if (y==0) contours.push([[x,y]])
      else{
        let closest = -1, cdist = 10000
        for ( let j in dots[y-1] ) {
          let x0 = dots[y-1][j]
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
      }
    }
  }

  return contours
}

function connectdotsH(dots){

  let contours=[]
  for (let x in dots) {
    x=Number(x)
    for (let i in dots[x]) {
      let y = dots[x][i]
      if (x==0) contours.push([[x,y]])
      else{
        let closest = -1, cdist = 10000
        for ( let j in dots[x-1] ) {
          let y0 = dots[x-1][j]
          let d = Math.abs(y-y0)
          if (d < cdist) { closest=y0; cdist=d }
        }
        if (cdist > 3)
          contours.push([[x,y]])
        else {
          let found=0
          for (let k in contours) {
            let last = contours[k][contours[k].length-1]
            if (last[1] == closest && last[0] == x-1) {
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
      if (contours[c][contours[c].length-1][x] < x-1 && contours[c].length<4) {
        contours.splice(c,1)
      }
    }
  }

  return contours
}

function hatch( getPixel ) {

  let sc = 8


  let lg1 = [], lg2 = []

  for (let x=0;x<config.width;x+=sc) {
    for (let y=0;y<config.height;y+=sc) {
      let p = getPixel(x,y)
      if (p>144) continue
      if (p>64) {
        lg1.push( [[x,y+sc/4], [x+sc, y+sc/4] ])
      } else if (p>16) {
        lg1.push( [[x,y+sc/4], [x+sc, y+sc/4] ])
        lg2.push( [[x+sc,y], [x, y+sc] ])
      } else {
        lg1.push( [[x,y+sc/4], [x+sc, y+sc/4] ])
        lg1.push( [[x,y+sc/2+sc/4], [x+sc, y+sc/2+sc/4] ])
        lg2.push( [[x+sc,y], [x, y+sc] ])
      }
    }
  }

  function mergeEnds(lines){
    for (let i in lines) {
      for (let j in lines) {
        if (lines[i].length && lines[j].length)
          if (lines[i][lines[i].length-1][0] == lines[j][0][0] && lines[i][lines[i].length-1][1] == lines[j][0][1]) {
            lines[i] = lines[i].concat(lines[j].slice(1))
            lines[j]=[]
          }
      }
    }
    var newlines = []
    for (let i in lines) if (lines[i].length) newlines.push(lines[i])
    return newlines
  }
  return mergeEnds(lg1).concat(mergeEnds(lg2))
/*

    for i in range(0,len(lines)):
        for j in range(0,len(lines[i])):
            lines[i][j] = int(lines[i][j][0]+sc*perlin.noise(i*0.5,j*0.1,1)),int(lines[i][j][1]+sc*perlin.noise(i*0.5,j*0.1,2))-j
    return lines

*/


}



//async 
function render() {


  postMessage(['msg', "Finding edges"]);
//  await makeAsync(()=>{

  const getPixel = autocontrast(0.1)

let hatches = hatch(getPixel)
//postMessage(['points',hatches])




  let edges = SobelFilter( getPixel );
  let contoursH = connectdotsH(getdotsH(edges))
  let contoursV = connectdotsV(getdotsV(edges))


  let contours = contoursH.concat(contoursV)
//  let contours = contoursV


  function distance(a,b){
    return ( (a[0]-b[0])*(a[0]-b[0]) +(a[1]-b[1])*(a[1]-b[1]) )
  }

  // link ends of strokes less than 8 px apart
  for (let i in contours) {
    for (let j in contours) {
      if (contours[i].length && contours[j].length)
        if (distance( contours[j][0], contours[i][contours[i].length-1] ) < 64 ) {
          contours[i] = contours[i].concat(contours[j])
          contours[j] = []
        }
    }
  }

  // skip points to simplify
  let nc=[]
  for (let i in contours) {
    let s = []
    for (let j=0; j<contours[i].length; j+=config.simp) s.push(contours[i][j]) //todo: average instead of skipping
    if (s.length) nc.push(s)
  }
  contours = nc








 /* 
  let dbg = Array(config.width*config.height)
  //for (let i=0;i<config.width*config.height;i++) dbg[i]=0;
  for (let x=0;x<config.width;x++)
    for (let y=0;y<config.height;y++)
      dbg[x+y*config.width] = pixData[x][y]/8
//*/
/*
  for (let y in dotsV) {
    for (let row=0; row<dotsV[y].length; row++){
      let x = dotsV[y][row]
      //pixData[x][y] = 255
      dbg[y*config.width+x] = 255
    }
  }
//*/
/*
  for (let x in dotsH) {
    x=Number(x)
    for (let row=0; row<dotsH[x].length; row++){
      let y = dotsH[x][row]
      //pixData[x][y] = 255
      dbg[y*config.width+x] = 255
    }
  }
//*/
//console.log(dotsH)

  postMessage(['points', nc.concat(hatches)])





 //postMessage(['dbgimg', dbg])
//  postMessage(['dbg', dots])




  draw()
  postMessage(['msg', "Done"]);
}


