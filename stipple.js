importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Max Stipples', value: 1000, min: 500, max: 5000},
  {label: 'Size', value: 32, min: 8, max: 64},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)
 
  const maxStipples = config['Max Stipples'] 
  let particles = []
  let timer=0;
  
  while ( particles.length < maxStipples  ) {
    x=Math.random()*config.width;
    y=Math.random()*config.height;
    
    z = getPixel( x , y )
//    if (Math.random()*255 <= z) 
    if (getNearestPoint(x,y) > config.Size*0.2*(264-z)) { 
      particles.push([x,y, 1+z/config.Size/4])
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


