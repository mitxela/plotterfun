importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Frequency', value: 50, min: 1, max: 100},
  {label: 'Line Count', value: 20, min: 10, max: 100},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 5, step: 0.1},
  {label: 'Widdershins', type:'checkbox'},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const pi = Math.PI;
  const lineCount = config['Line Count'];
  const freq = config.Frequency * lineCount/2000
             * (config.Widdershins?-1:1);
  const amplitude = config.Amplitude / lineCount;
  const incr_x = config.Sampling;
  const incr_y = Math.floor(config.height / lineCount);
  let squiggleData = [];

  for (let y = 0; y < config.height; y += incr_y) {
    let line = [], phase = 0;
    for (let x = 0; x <= config.width; x += incr_x) {
      let a = amplitude * getPixel(x, y)
      phase += freq
      if (phase > pi) phase-=2*pi;
      
      line.push([x + a*Math.cos(phase), y + a*Math.sin(phase) ]);
    }
    squiggleData.push(line)
  }
  postMessage(['points', squiggleData]);
}

