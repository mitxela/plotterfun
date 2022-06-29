importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 3, min: 1, max: 6}, // does nothing
])]);

// only works if the image is 729 x 729 (=3^5)
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

function addlevel(order, left, top, line, dir){
  let size = Math.pow(3,order)
  let right = left + size
  let bottom = top + size
  let sum = sumdarknes(top,left,bottom,right)
  //console.log("order", order,"dir",dir,"sum",sum)
  let tops = [top, top+Math.pow(3,order-1), top+2*Math.pow(3,order-1)]
  let lefts = [left, left+Math.pow(3,order-1), left+2*Math.pow(3,order-1)]
  if (sum/size > 1530 && order > 1){ // need to change this line to find better threshold
    // recursive splitting of the square
    if (dir == 0){
      addlevel(order-1, lefts[0], tops[0], line, 0) // segment 1
      addlevel(order-1, lefts[0], tops[1], line, 3) // segment 2
      addlevel(order-1, lefts[0], tops[2], line, 0) // segment 3
      addlevel(order-1, lefts[1], tops[2], line, 1) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 2) // segment 5
      addlevel(order-1, lefts[1], tops[0], line, 1) // segment 6
      addlevel(order-1, lefts[2], tops[0], line, 0) // segment 7
      addlevel(order-1, lefts[2], tops[1], line, 3) // segment 8
      addlevel(order-1, lefts[2], tops[2], line, 0) // segment 9
    }
    if (dir == 1){
      addlevel(order-1, lefts[0], tops[2], line, 1) // segment 1
      addlevel(order-1, lefts[1], tops[2], line, 0) // segment 2
      addlevel(order-1, lefts[2], tops[2], line, 1) // segment 3
      addlevel(order-1, lefts[2], tops[1], line, 2) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 3) // segment 5
      addlevel(order-1, lefts[0], tops[1], line, 2) // segment 6
      addlevel(order-1, lefts[0], tops[0], line, 1) // segment 7
      addlevel(order-1, lefts[1], tops[0], line, 0) // segment 8
      addlevel(order-1, lefts[2], tops[0], line, 1) // segment 9
    }
    if (dir == 2){
      addlevel(order-1, lefts[2], tops[2], line, 2) // segment 1
      addlevel(order-1, lefts[2], tops[1], line, 1) // segment 2
      addlevel(order-1, lefts[2], tops[0], line, 2) // segment 3
      addlevel(order-1, lefts[1], tops[0], line, 3) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 0) // segment 5
      addlevel(order-1, lefts[1], tops[2], line, 3) // segment 6
      addlevel(order-1, lefts[0], tops[2], line, 2) // segment 7
      addlevel(order-1, lefts[0], tops[1], line, 1) // segment 8
      addlevel(order-1, lefts[0], tops[0], line, 2) // segment 9
    }
    if (dir == 3){
      addlevel(order-1, lefts[2], tops[0], line, 3) // segment 1
      addlevel(order-1, lefts[1], tops[0], line, 2) // segment 2
      addlevel(order-1, lefts[0], tops[0], line, 3) // segment 3
      addlevel(order-1, lefts[0], tops[1], line, 0) // segment 4
      addlevel(order-1, lefts[1], tops[1], line, 1) // segment 5
      addlevel(order-1, lefts[2], tops[1], line, 0) // segment 6
      addlevel(order-1, lefts[2], tops[2], line, 3) // segment 7
      addlevel(order-1, lefts[1], tops[2], line, 2) // segment 8
      addlevel(order-1, lefts[0], tops[2], line, 3) // segment 9
    }
    // different order to visit the new squares
  }
  // add last point
  if (dir == 0){
    line.push([right,bottom])
  }
  if (dir == 1){
    line.push([right,top])
  }
  if (dir == 2){
    line.push([left,top])
  }
  if (dir == 3){
    line.push([left,bottom])
  }
}

onmessage = function(e) {
  const [ config, pixData ] = e.data;
  getPixel = pixelProcessor(config, pixData)

  line = [[0,0]] // add first point
  addlevel(6,0,0,line, 0) // call recursive function
  postLines(line);
}
