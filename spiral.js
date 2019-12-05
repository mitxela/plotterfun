importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Spacing', value: 1, min: 0.5, max: 5, step: 0.1},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;

  const spacing = parseFloat(config.Spacing);
  const amplitude = parseFloat(config.Amplitude);
  const frequency = parseInt(config.Frequency);

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
  pi= 3.1415926535897;
  
  while ( x>0 && y>0 && x<config.width && y<config.height ) {
  
    z = getPixel( x , y ) 
    r = amplitude * z *0.02*spacing;
    a += z / frequency;
  
    let tempradius = radius + Math.sin(a)*r;
    points.push([
     cx + tempradius*Math.sin(theta) ,
     cy + tempradius*Math.cos(theta)
    ])
   
    let incr = Math.asin(1/radius);
    radius +=incr*spacing;
    theta +=incr;

    x = Math.floor( cx + radius*Math.sin(theta))
    y = Math.floor( cy + radius*Math.cos(theta))
  }


  postMessage(['points', points]);
}


