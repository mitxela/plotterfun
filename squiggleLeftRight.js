importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Frequency', value: 150, min: 5, max: 512},
  {label: 'Line Count', value: 50, min: 10, max: 200},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 2.9, step: 0.1},,
  {label: 'Modulation', type:'select', options:['both', 'AM', 'FM']},
  {label: 'Join Ends', type:'select', options:['No', 'Straight','Straight Smooth', 'Round', 'Pointy']}

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
  const joined = !(config['Join Ends']=='No');
  const smooth = config['Join Ends']=='Straight Smooth'|| config['Join Ends']=='Round'|| config['Join Ends']=='Pointy';
  const round = config['Join Ends']=='Round';
  const pointy = config['Join Ends']=='Pointy';

  let squiggleData = [];
  if (joined) squiggleData[0]=[]
  let toggle = false;
  let horizontalLineSpacing = Math.floor(height / lineCount);
  let ra=horizontalLineSpacing/2;
  
  for (let y = 0; y < height; y+= horizontalLineSpacing) {
    let a = 0;
    toggle=!toggle;
    currentLine = [];
    currentLine.push([ra+(toggle?0:width), y]);

    for (let x = toggle? spacing: width-spacing; (toggle && x <= width) || (!toggle && x > 0); x += toggle?spacing:-spacing ) {
      let z = getPixel(x, y)
      let r = amplitude * (config.Modulation=="AM" || config.Modulation=="both"?z:100) / lineCount;
      if(smooth)
        r*=Math.min(x/50/spacing,1)*Math.min((width-x)/50/spacing,1)
      a += (config.Modulation=="FM" || config.Modulation=="both"?z:100) / frequency;
      currentLine.push([ra+x, y + Math.sin(a)*r]);
    }
    if(pointy){
      if(toggle)
        currentLine.push([width+ra*2,y+ra]);
      else
        currentLine.push([0,y+ra]);
    }
    if(round){
      if(toggle){
         for (let x = width;x <= width+ra; x += spacing ) 
            currentLine.push([x+ra,y+ra-Math.sqrt(ra*ra-(x-width)*(x-width))]);
         for (let x = width+ra;x >= width; x -= spacing ) 
             currentLine.push([x+ra,y+ra+Math.sqrt(ra*ra-(x-width)*(x-width))]);
       }
       else{
          for (let x = ra;x >= 0; x -= spacing ) 
             currentLine.push([x,y+ra-Math.sqrt(ra*ra-(ra-x)*(ra-x))]);
          for (let x = 0;x <= ra; x += spacing ) 
             currentLine.push([x,y+ra+Math.sqrt(ra*ra-(ra-x)*(ra-x))]);
       }
    }
    if (joined)
      squiggleData[0]=squiggleData[0].concat(currentLine);
    else
      squiggleData.push(currentLine)
  }

  postLines(squiggleData);
}

