postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Line Count', value: 50, min: 10, max: 200},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 2.9, step: 0.1},
]]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;

  const imagePixels = pixData;
  const width = parseInt(config.width);
  const height = parseInt(config.height);
  const contrast = parseInt(config.Contrast);
  const brightness = parseInt(config.Brightness);
  const lineCount = parseInt(config['Line Count']);
  const minBrightness = parseInt(config['Min brightness']);
  const maxBrightness = parseInt(config['Max brightness']);
  const spacing = parseFloat(config.Sampling);
  const amplitude = parseFloat(config.Amplitude);
  const frequency = parseInt(config.Frequency);
  const black = config.Inverted;


// Create some defaults for squiggle-point array
  let squiggleData = [];
squiggleData[0]=[];
  let r = 5;
  let a = 0;
  let b;
  let z;
  let toggle = false;
  let currentLine = []; // create empty array for storing x,y coordinate pairs
  let currentVerticalPixelIndex = 0;
  let currentHorizontalPixelIndex = 0;
  let contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast)); // This was established through experiments
  let horizontalLineSpacing = Math.floor(height / lineCount); // Number of pixels to advance in vertical direction


// Iterate line by line (top line to bottom line) in increments of horizontalLineSpacing
  for (let y = 0; y < height; y+= horizontalLineSpacing) {
    toggle=!toggle;
    a = 0;
    currentLine = [];
    currentLine.push([toggle?0:width, y]); // Start the line
    currentVerticalPixelIndex = y*width;  // Because Image Pixel array is of length width * height,
                                          // starting pixel for each line will be this
    // Loop through pixels from left to right within the current line, advancing by increments of config.SPACING

    for (let x = toggle? spacing: width-spacing; x < width && x >= spacing; x += toggle?spacing:-spacing ) {
      currentHorizontalPixelIndex = Math.floor(x + currentVerticalPixelIndex); // Get array position of current pixel
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
      // The magic of the script, determines how high / low the squiggle goes
      r = amplitude * z / lineCount;
      a += z / frequency;
      currentLine.push([x,y + Math.sin(a)*r]);
    }
    squiggleData[0]=squiggleData[0].concat(currentLine);
  }



  postMessage(['points', squiggleData]);
}

