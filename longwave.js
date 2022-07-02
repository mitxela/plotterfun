importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Frequency', value: 50, min: 1, max: 100},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Step size', value: 5, min: 1, max: 20, step: 0.1},
  {label: 'Depth', value: 1, min: 1, max: 8},
  {label: 'Direction', type:'select', value:'Vertical', options:['Vertical', 'Horizontal', 'Both']}
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)


  const lineSpacing = 2*config['Step size'];
  const waveFreq = config.Frequency/config.width;
  const waveAmplitude = config.Amplitude*20;

  const lines = [];

  const t = [];
  for (let i=0;i<config.Depth;i++) t.push( (i+1)*256/(config.Depth+1) )
  const thresholds = t.concat(t.slice(0,t.length-1).reverse())

  let ln = 0;

  if (config.Direction != 'Horizontal') {
    for (let sx = -waveAmplitude; sx <= config.width + waveAmplitude; sx += lineSpacing) {
      let line = [];
      let threshold = thresholds[ln++ % thresholds.length];

      for (let y =0; y < config.height; y ++) {
        let nx = sx + Math.sin( y*waveFreq )*waveAmplitude;
        
        if (nx>0 && nx<config.width && getPixel(nx, y)>threshold) {
          line.push([nx, y])
        } else {
          if (line.length) {
            lines.push(line);
            line=[]
          }
        }
      }
      if (line.length) lines.push(line);
    }
  }

  if (config.Direction != 'Vertical') {
    for (let sy = -waveAmplitude; sy <= config.height + waveAmplitude; sy += lineSpacing) {
      let line = [];
      let threshold = thresholds[ln++ % thresholds.length];

      for (let x =0; x < config.width; x ++) {
        let ny = sy + Math.sin( x*waveFreq )*waveAmplitude;
        
        if (ny>0 && ny<config.height && getPixel(x, ny)>threshold) {
          line.push([x, ny])
        } else {
          if (line.length) {
            lines.push(line);
            line=[]
          }
        }
      }
      if (line.length) lines.push(line);
    }
  }

  postLines(lines);
  
}

