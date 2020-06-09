importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Line Count', value: 50, min: 10, max: 200},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 2.9, step: 0.1},,
  {label: 'Modulation', type:'select', options:['both', 'AM', 'FM']},
  {label: 'Join Ends', type:'checkbox'}

])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const width = parseInt(config.width);
  const height = parseInt(config.height);
  const lineCount = parseInt(config['Line Count']);
  const spacing = parseFloat(config.Sampling);
  const amplitude = parseFloat(config.Amplitude);
  const frequency = parseInt(config.Frequency);
  const joined = config['Join Ends']

  let squiggleData = [];
  if (joined) squiggleData[0]=[]
  let toggle = false;
  let horizontalLineSpacing = Math.floor(height / lineCount);

  for (let y = 0; y < height; y+= horizontalLineSpacing) {
    let a = 0;
    toggle=!toggle;
    currentLine = [];
    currentLine.push([toggle?0:width, y]);

    for (let x = toggle? spacing: width-spacing; (toggle && x <= width) || (!toggle && x >= 0); x += toggle?spacing:-spacing ) {
      let z = getPixel(x, y)
      let r = amplitude * (config.Modulation=="AM" || config.Modulation=="both"?z:100) / lineCount;
      a += (config.Modulation=="FM" || config.Modulation=="both"?z:100) / frequency;
      currentLine.push([x, y + Math.sin(a)*r]);
    }

    if (joined)
      squiggleData[0]=squiggleData[0].concat(currentLine);
    else
      squiggleData.push(currentLine)
  }

  postLines(squiggleData);
}

