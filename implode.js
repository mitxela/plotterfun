importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Rays', value: 1000, min: 100, max: 5000},
  {label: 'Threshold', value: 128, min: 1, max: 254},
  {label: 'Step size', value: 5, min: 1, max: 20, step: 0.1},
  {label: 'Dither', value: 0, min: 0, max: 1, step: 0.01},
  {label: 'Optimize route', type:'checkbox', checked:true},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const w=config.width, h=config.height, d=(w+h)*0.4;
  let output=[]

  let angle=0
  for (let i=0; i<config.Rays;i++) {
    let line=[]

    angle+= 2*3.1415926535* (i/config.Rays +0.25)

    let xstep=Math.cos(angle)*config['Step size'],
        ystep=Math.sin(angle)*config['Step size']

    let x=w/2 + (i/config.Rays)*d*Math.cos(angle),
        y=h/2 + (i/config.Rays)*d*Math.sin(angle)

    do {
      if (getPixel(x,y)*(1+config.Dither*(Math.random()-0.5)) >config.Threshold) line.push([x,y])
      else {
        if (line.length>1) output.push(line);
        line=[]
      }
      x+=xstep
      y+=ystep
    } while (x>0 && y>0 && x<w && y<h)

    if (line.length) output.push(line)
  }

  if (output.length) {
    if (config['Optimize route']) {
      postMessage(['msg', "Optimizing..."]);
      output = sortlines(output)
    }
    postLines(output)
  }
  postMessage(['msg', "Done"]);
}

