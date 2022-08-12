importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Wave Speed', value: 20, min: 1, max: 100},
  {label: 'Wave Amplitude', value: 10, min: 0, max: 50, step: 0.1},
  {label: 'Step size', value: 5, min: 1, max: 20, step: 0.1},
  {label: 'Simplify', value: 10, min: 1, max: 50, step: 0.1},
  {label: 'Depth', value: 1, min: 1, max: 8},
  {label: 'Direction', type:'select', value:'Vertical', options:['Vertical', 'Horizontal', 'Both']},
  {label: 'Optimize route', type:'checkbox', checked:false}
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)


  const lineSpacing = 2*config['Step size'];
  const waveFreq = Math.pow(config['Wave Speed'],0.8)/config.width;
  const waveAmplitude = config['Wave Amplitude']/50/waveFreq;
  const simplify = config.Simplify;

  let lines = [];

  const t = [];
  for (let i=0;i<config.Depth;i++) t.push( 128+i*128/config.Depth )
  const thresholds = t.concat(t.slice(0,t.length-1).reverse())

  let ln = 0;

  if (config.Direction != 'Horizontal') {
    for (let sx = -waveAmplitude; sx <= config.width + waveAmplitude; sx += lineSpacing) {
      let line = [];
      let threshold = thresholds[ln++ % thresholds.length];
      let hysteresis = 0;

      for (let y =0; y < config.height; y ++) {
        let nx = sx + Math.sin( y*waveFreq )*waveAmplitude;
        hysteresis += getPixel(nx, y)>threshold ? 1:-1;
        if (hysteresis<= -simplify) hysteresis= -simplify;
        if (hysteresis> simplify) hysteresis= simplify;

        if (nx>0 && nx<config.width && hysteresis>0) {
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
      let hysteresis = 0;

      for (let x =0; x < config.width; x ++) {
        let ny = sy + Math.sin( x*waveFreq )*waveAmplitude;
        hysteresis += getPixel(x, ny)>threshold ? 1:-1;
        if (hysteresis<= -simplify) hysteresis= -simplify;
        if (hysteresis> simplify) hysteresis= simplify;

        if (ny>0 && ny<config.height && hysteresis>0) {
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

  if (config['Optimize route']) {
    postMessage(['msg', "Optimizing..."]);
    lines = sortlines(lines)
    postMessage(['msg', ""]);
  }
  
  postLines(lines);
  
}

