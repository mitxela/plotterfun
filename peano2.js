importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 3, min: 1, max: 6},
  {label: 'Hblocks', value: 1, min: 1, max: 15},
  {label: 'Vblocks', value: 1, min: 1, max: 15},
])]);

// Peano curve

function sumdarknes(top,left,bottom,right) {
  let sum = 0
  for (let x = left; x < right; x++){
    for (let y = top; y < bottom; y++){
      sum += getPixel(x,y)
    }
  }
  return sum
}

function addlevel(order, left, top, line, dir, scale){
  let size = Math.pow(3,order)
  let right = left + size
  let bottom = top + size
  let sum = sumdarknes(top*scale[1],left*scale[0],bottom*scale[1],right*scale[0])
  let pscale = scale[0]*scale[1]
  sum = sum/pscale
  //console.log("order", order,"dir",dir,"sum",sum)
  let tops = [top, top+Math.pow(3,order-1), top+2*Math.pow(3,order-1)]
  let lefts = [left, left+Math.pow(3,order-1), left+2*Math.pow(3,order-1)]
  if (sum/size > 1530 && order > 1){ // need to change this line to find better threshold
    // recursive splitting of the square
    if (dir == 0){
      addlevel(order-1, lefts[0], tops[0], line, 0, scale) // segment 1
      addlevel(order-1, lefts[0], tops[1], line, 3, scale) // segment 2
      addlevel(order-1, lefts[0], tops[2], line, 0, scale) // segment 3
      addlevel(order-1, lefts[1], tops[2], line, 1, scale) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 2, scale) // segment 5
      addlevel(order-1, lefts[1], tops[0], line, 1, scale) // segment 6
      addlevel(order-1, lefts[2], tops[0], line, 0, scale) // segment 7
      addlevel(order-1, lefts[2], tops[1], line, 3, scale) // segment 8
      addlevel(order-1, lefts[2], tops[2], line, 0, scale) // segment 9
    }
    if (dir == 1){
      addlevel(order-1, lefts[0], tops[2], line, 1, scale) // segment 1
      addlevel(order-1, lefts[1], tops[2], line, 0, scale) // segment 2
      addlevel(order-1, lefts[2], tops[2], line, 1, scale) // segment 3
      addlevel(order-1, lefts[2], tops[1], line, 2, scale) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 3, scale) // segment 5
      addlevel(order-1, lefts[0], tops[1], line, 2, scale) // segment 6
      addlevel(order-1, lefts[0], tops[0], line, 1, scale) // segment 7
      addlevel(order-1, lefts[1], tops[0], line, 0, scale) // segment 8
      addlevel(order-1, lefts[2], tops[0], line, 1, scale) // segment 9
    }
    if (dir == 2){
      addlevel(order-1, lefts[2], tops[2], line, 2, scale) // segment 1
      addlevel(order-1, lefts[2], tops[1], line, 1, scale) // segment 2
      addlevel(order-1, lefts[2], tops[0], line, 2, scale) // segment 3
      addlevel(order-1, lefts[1], tops[0], line, 3, scale) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 0, scale) // segment 5
      addlevel(order-1, lefts[1], tops[2], line, 3, scale) // segment 6
      addlevel(order-1, lefts[0], tops[2], line, 2, scale) // segment 7
      addlevel(order-1, lefts[0], tops[1], line, 1, scale) // segment 8
      addlevel(order-1, lefts[0], tops[0], line, 2, scale) // segment 9
    }
    if (dir == 3){
      addlevel(order-1, lefts[2], tops[0], line, 3, scale) // segment 1
      addlevel(order-1, lefts[1], tops[0], line, 2, scale) // segment 2
      addlevel(order-1, lefts[0], tops[0], line, 3, scale) // segment 3
      addlevel(order-1, lefts[0], tops[1], line, 0, scale) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 1, scale) // segment 5
      addlevel(order-1, lefts[2], tops[1], line, 0, scale) // segment 6
      addlevel(order-1, lefts[2], tops[2], line, 3, scale) // segment 7
      addlevel(order-1, lefts[1], tops[2], line, 2, scale) // segment 8
      addlevel(order-1, lefts[0], tops[2], line, 3, scale) // segment 9
    }
    // different order to visit the new squares
  } else {
    // add last point
    if (dir == 0){
      line.push([right*scale[0],bottom*scale[1]])
    }
    if (dir == 1){
      line.push([right*scale[0],top*scale[1]])
    }
    if (dir == 2){
      line.push([left*scale[0],top*scale[1]])
    }
    if (dir == 3){
      line.push([left*scale[0],bottom*scale[1]])
    }
  }
}

onmessage = function(e) {
  const [ config, pixData ] = e.data;
  getPixel = pixelProcessor(config, pixData)

  const maxorder = config.Order;
  const hblocks = config.Hblocks;
  const vblocks = config.Vblocks;


  maxsize = Math.pow(3,maxorder)
  let hscale = config.width/(maxsize*hblocks)
  let vscale = config.height/(maxsize*vblocks)
  let scale = [hscale,vscale] // scale represents mismatch between pixels and line units


  let heven = ((hblocks+1)%2)
  veven = ((vblocks+1)%2)
  line = [[veven*hscale*maxsize,heven*config.height]] // add first point
  if (heven){
    for (let vblock = vblocks-1; vblock >= 0; vblock--){
      addlevel(maxorder,0,vblock*maxsize,line, ((vblock)%2)+1,scale)
    }
  }
  
  for (let vblock = 0; vblock < vblocks; vblock++){
    if (!(vblock%2)){
      for (let hblock = heven; hblock < hblocks; hblock++) {
        addlevel(maxorder,hblock*maxsize,vblock*maxsize,line, ((hblock+heven)%2),scale)
      }
    } else {
      for (let hblock = hblocks-1; hblock >= heven; hblock--) {
        addlevel(maxorder,hblock*maxsize,vblock*maxsize,line, ((hblock+heven+1)%2)+2,scale)
      }
    }
  }
  postLines(line);
}
