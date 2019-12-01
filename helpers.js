
// Apply brightness / contrast and flatten to monochrome
// taken from squigglecam

function pixelProcessor(config, imagePixels){

  const width = parseInt(config.width);
  const contrast = parseInt(config.Contrast);
  const brightness = parseInt(config.Brightness);
  const minBrightness = parseInt(config['Min brightness']);
  const maxBrightness = parseInt(config['Max brightness']);
  const black = config.Inverted;
  let contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  return function(x, y) {
  
    let b;
    let pixIndex  = Math.floor(x) + Math.floor(y) * width;
  
    if (contrast !== 0) {
      b = (0.2125 * ((contrastFactor * (imagePixels.data[4 * pixIndex]       - 128) + 128) + brightness)) 
        + (0.7154 * ((contrastFactor * (imagePixels.data[4 * (pixIndex + 1)] - 128) + 128) + brightness))
        + (0.0721 * ((contrastFactor * (imagePixels.data[4 * (pixIndex + 2)] - 128) + 128) + brightness));
    } else {
      b = (0.2125 * (imagePixels.data[4*pixIndex] + brightness)) 
        + (0.7154 * (imagePixels.data[4*(pixIndex + 1)] + brightness))
	+ (0.0721 * (imagePixels.data[4*(pixIndex + 2)] + brightness));
    }
    if (black) {
      b = Math.min(255-minBrightness,255-b);
    } else {
      b = Math.max(minBrightness,b);
    }
  
    return Math.max(maxBrightness-b,0);
  }
}

