importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Line Count', value: 50, min: 10, max: 200},
  {label: 'Sublines', value: 3, min: 1, max: 10},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 5, step: 0.1},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const lineCount = config['Line Count'];
  const sublines = config['Sublines'];
  const amplitude = config.Amplitude / sublines / lineCount;
  const incr_x = config.Sampling;
  const incr_y = Math.floor(config.height / lineCount);
  let squiggleData = [];

  for (let y = 0; y < config.height; y += incr_y) {
    for (let j = 0; j < sublines; j++) {
      let line = [];
      for (let x = 0; x <= config.width; x += incr_x) {
        let z = getPixel(x, y)
        let r = amplitude * j * z;
        line.push([x, y + r]);
      }
      for (let x = config.width; x >=0 ; x -= incr_x) {
        let z = getPixel(x, y)
        let r = amplitude * j * z;
        line.push([x, y - r]);
      }
      squiggleData.push(line)
    }
  }
  postLines(squiggleData);
}

