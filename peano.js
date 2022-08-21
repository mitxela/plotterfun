/**
 * Algorithm by j-waal
 */
importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 5, min: 1, max: 6},
  {label: 'Hblocks', value: 1, min: 1, max: 15},
  {label: 'Vblocks', value: 1, min: 1, max: 15},
])]);

// Peano curve

function sumdarknes(top,left,bottom,right,getPixel) {
  let sum = 0
  for (let x = left; x < right; x++){
    for (let y = top; y < bottom; y++){
      sum += getPixel(x,y)
    }
  }
  return sum
}

// recursive function
function addlevel(order, left, top, line, dir, scale, getPixel){
  const size = Math.pow(3,order)
  const right = left + size
  const bottom = top + size
  let sum = sumdarknes(top*scale[1],left*scale[0],bottom*scale[1],right*scale[0],getPixel)
  const pscale = scale[0]*scale[1]
  sum = sum/pscale // account for the scale when the pixels are summed
  let tops = [top, top+Math.pow(3,order-1), top+2*Math.pow(3,order-1)]
  let lefts = [left, left+Math.pow(3,order-1), left+2*Math.pow(3,order-1)]
  if (sum/size > 1530 && order > 1){ // threshold to split this block
    // recursive splitting of the square
    if (dir == 0){ // upper left to lower right
      addlevel(order-1, lefts[0], tops[0], line, 0, scale, getPixel) // segment 1
      addlevel(order-1, lefts[0], tops[1], line, 3, scale, getPixel) // segment 2
      addlevel(order-1, lefts[0], tops[2], line, 0, scale, getPixel) // segment 3
      addlevel(order-1, lefts[1], tops[2], line, 1, scale, getPixel) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 2, scale, getPixel) // segment 5
      addlevel(order-1, lefts[1], tops[0], line, 1, scale, getPixel) // segment 6
      addlevel(order-1, lefts[2], tops[0], line, 0, scale, getPixel) // segment 7
      addlevel(order-1, lefts[2], tops[1], line, 3, scale, getPixel) // segment 8
      addlevel(order-1, lefts[2], tops[2], line, 0, scale, getPixel) // segment 9
    }
    if (dir == 1){ // lower left to upper right
      addlevel(order-1, lefts[0], tops[2], line, 1, scale, getPixel) // segment 1
      addlevel(order-1, lefts[1], tops[2], line, 0, scale, getPixel) // segment 2
      addlevel(order-1, lefts[2], tops[2], line, 1, scale, getPixel) // segment 3
      addlevel(order-1, lefts[2], tops[1], line, 2, scale, getPixel) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 3, scale, getPixel) // segment 5
      addlevel(order-1, lefts[0], tops[1], line, 2, scale, getPixel) // segment 6
      addlevel(order-1, lefts[0], tops[0], line, 1, scale, getPixel) // segment 7
      addlevel(order-1, lefts[1], tops[0], line, 0, scale, getPixel) // segment 8
      addlevel(order-1, lefts[2], tops[0], line, 1, scale, getPixel) // segment 9
    }
    if (dir == 2){ // lower right to upper left
      addlevel(order-1, lefts[2], tops[2], line, 2, scale, getPixel) // segment 1
      addlevel(order-1, lefts[2], tops[1], line, 1, scale, getPixel) // segment 2
      addlevel(order-1, lefts[2], tops[0], line, 2, scale, getPixel) // segment 3
      addlevel(order-1, lefts[1], tops[0], line, 3, scale, getPixel) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 0, scale, getPixel) // segment 5
      addlevel(order-1, lefts[1], tops[2], line, 3, scale, getPixel) // segment 6
      addlevel(order-1, lefts[0], tops[2], line, 2, scale, getPixel) // segment 7
      addlevel(order-1, lefts[0], tops[1], line, 1, scale, getPixel) // segment 8
      addlevel(order-1, lefts[0], tops[0], line, 2, scale, getPixel) // segment 9
    }
    if (dir == 3){ // upper right to lower left
      addlevel(order-1, lefts[2], tops[0], line, 3, scale, getPixel) // segment 1
      addlevel(order-1, lefts[1], tops[0], line, 2, scale, getPixel) // segment 2
      addlevel(order-1, lefts[0], tops[0], line, 3, scale, getPixel) // segment 3
      addlevel(order-1, lefts[0], tops[1], line, 0, scale, getPixel) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 1, scale, getPixel) // segment 5
      addlevel(order-1, lefts[2], tops[1], line, 0, scale, getPixel) // segment 6
      addlevel(order-1, lefts[2], tops[2], line, 3, scale, getPixel) // segment 7
      addlevel(order-1, lefts[1], tops[2], line, 2, scale, getPixel) // segment 8
      addlevel(order-1, lefts[0], tops[2], line, 3, scale, getPixel) // segment 9
    }
    // list of different order to visit the new squares
  } else {
    // add last point
    if (dir == 0){ // upper left to lower right
      line.push([right*scale[0],bottom*scale[1]])
    }
    if (dir == 1){ // lower left to upper right
      line.push([right*scale[0],top*scale[1]])
    }
    if (dir == 2){ // lower right to upper left
      line.push([left*scale[0],top*scale[1]])
    }
    if (dir == 3){ // upper right to lower left
      line.push([left*scale[0],bottom*scale[1]])
    }
    // only need to add the last point if the block is not subdivided
    // all other points are recursively added
  }
}

onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const maxorder = config.Order;
  const hblocks = config.Hblocks;
  const vblocks = config.Vblocks;

  const maxsize = Math.pow(3,maxorder)
  const hscale = config.width/(maxsize*hblocks)
  const vscale = config.height/(maxsize*vblocks)
  const scale = [hscale,vscale] // scale represents mismatch between pixels and line units

  const heven = ((hblocks+1)%2)
  const veven = ((vblocks+1)%2)
  let line = [[veven*hscale*maxsize,heven*config.height]] // add first point
  // some code to handle dividing the image in blocks while keeping a continuous line
  if (heven){
    for (let vblock = vblocks-1; vblock >= 0; vblock--){
      addlevel(maxorder,0,vblock*maxsize,line, ((vblock)%2)+1, scale, getPixel)
    }
  }
  for (let vblock = 0; vblock < vblocks; vblock++){
    if (!(vblock%2)){
      for (let hblock = heven; hblock < hblocks; hblock++) {
        addlevel(maxorder,hblock*maxsize,vblock*maxsize,line, ((hblock+heven)%2), scale, getPixel)
      }
    } else {
      for (let hblock = hblocks-1; hblock >= heven; hblock--) {
        addlevel(maxorder,hblock*maxsize,vblock*maxsize,line, ((hblock+heven+1)%2)+2, scale, getPixel)
      }
    }
  }
  postLines(line);
}
