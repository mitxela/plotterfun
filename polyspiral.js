importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Polygon', value: 4, min: 3, max: 8},
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Spacing', value: 1, min: 0.5, max: 5, step: 0.1},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)
  let r = 5;
  let a = 0;

  const cx = config.width/2;
  const cy = config.height/2;
  let points = [];
  points.push([cx,cy])
  
  let x = cx, y = cy;
  let radius = 1;
  let theta = 0;
  let travelled = 0;
  let segmentLength = 1;
  const pi = Math.PI;
  
  let incrTheta = 2*pi/config.Polygon;
  let incrLength = Math.round(10/config.Polygon);

  while ( x>0 && y>0 && x<config.width && y<config.height ) {
  
    z = getPixel( x , y ) 
    r = config.Amplitude * z *0.02*config.Spacing;
    a += z / config.Frequency;
  
    let displacement = Math.sin(a)*r;
    points.push([
     x - displacement*Math.sin(theta) ,
     y + displacement*Math.cos(theta)
    ])
    
    if (++travelled >= segmentLength){
      travelled = 0
      theta += incrTheta 
      segmentLength+= incrLength;
    }
    x += config.Spacing*Math.cos(theta)
    y += config.Spacing*Math.sin(theta)
  }

  postLines(points);
}

