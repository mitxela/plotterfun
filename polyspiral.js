postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Polygon', value: 4, min: 3, max: 8},
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Spacing', value: 1, min: 0.5, max: 5, step: 0.1},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;

  const getPixel = contrast(config, pixData)
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
    //

    x += config.Spacing*Math.cos(theta)
    y += config.Spacing*Math.sin(theta)
  }


  postMessage(['points', points]);
}


// Brightness/contrast/yuv stuff taken from squiggle cam
function contrast(config, imagePixels){

  const width = parseInt(config.width);
  const contrast = parseInt(config.Contrast);
  const brightness = parseInt(config.Brightness);
  const minBrightness = parseInt(config['Min brightness']);
  const maxBrightness = parseInt(config['Max brightness']);
  const black = config.Inverted;
  let b;
  let z;
  let currentVerticalPixelIndex = 0;
  let currentHorizontalPixelIndex = 0;
  let contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast)); // This was established through experiments

  return function(x, y) {
  
    let currentHorizontalPixelIndex  = Math.floor(x) + Math.floor(y) * width;
  
    // When there is contrast adjustment, the calculations of brightness values are a bit different
    if (contrast !== 0) {
      // Determine how bright a pixel is, from 0 to 255 by summing three channels (R,G,B) multiplied by some coefficients
      b = (0.2125 * ((contrastFactor * (imagePixels.data[4 * currentHorizontalPixelIndex] - 128) + 128 )
        + brightness)) + (0.7154 * ((contrastFactor * (imagePixels.data[4 * (currentHorizontalPixelIndex + 1)] - 128) + 128)
        + brightness)) + (0.0721 * ((contrastFactor*(imagePixels.data[4*(currentHorizontalPixelIndex+2)]-128)+128) + brightness));
    } else {
      b = (0.2125 * (imagePixels.data[4*currentHorizontalPixelIndex] + brightness)) 
        + (0.7154 * (imagePixels.data[4*(currentHorizontalPixelIndex + 1)] + brightness))
	+ (0.0721 * (imagePixels.data[4*(currentHorizontalPixelIndex + 2)] + brightness));
    }
    if (black) {
      b = Math.min(255-minBrightness,255-b);    // Set minimum line curvature to value set by the user
      z = Math.max(maxBrightness-b,0);  // Set maximum line curvature to value set by the user
    } else {
      b = Math.max(minBrightness,b);    // Set minimum line curvature to value set by the user
      z = Math.max(maxBrightness-b,0);  // Set maximum line curvature to value set by the user
    }
  
    return z
  }
}

