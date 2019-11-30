postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Max Stipples', value: 1000, min: 500, max: 5000},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = contrast(config, pixData)
 
  const maxStipples = config['Max Stipples'] 
  let particles = []
  let timer=0;
  
  while ( particles.length < maxStipples  ) {
    x=Math.random()*config.width;
    y=Math.random()*config.height;
    
    z = getPixel( x , y )
    if (Math.random()*255 <= z) 
    if (getNearestPoint(x,y) > 48) { 
      particles.push([x,y, 1+z/128])
    }

    if (++timer>500) postMessage(['circles', particles]), timer=0;

  }
  function getNearestPoint(x,y){
    let min=1000, i, dist;
    for (i in particles) {
      dist = (particles[i][0]-x)*(particles[i][0]-x) + (particles[i][1]-y)*(particles[i][1]-y)
      if (dist<min) min=dist
    }
    return min
  }

  postMessage(['circles', particles]);
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

