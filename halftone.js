importScripts('helpers.js', 'external/stackblur.min.js')

postMessage(['sliders', defaultControls.concat([
  { label: 'Scale', value: 25, min: 10, max: 100 },
  { label: 'Interlaced', type: 'checkbox' },
])]);


onmessage = function (e) {
  const [config, pixData] = e.data;

  const major = (config.width + config.height) / config.Scale / 2;
  const alternated = config.Interlaced;

  StackBlur.imageDataRGB(pixData, 0, 0, config.width, config.height, Math.round(major / 2))
  const getPixel = pixelProcessor(config, pixData)

  let hm = major / 2
  let tog = false
  let circles = []
  
  for (let y = hm; y < config.height; y += major) {
    tog = !tog;
    let xOff = (alternated && tog) ? major / 2 : 0;
    for (let x = hm + xOff; x < config.width; x += major) {
      //circles in the pixel center
      let z = getPixel(x, y);
      let radious = z * hm / 255;
      circles.push({ x: x - hm / 2, y: y - hm / 2, r: radious });
    }
  }

  postCircles(circles);
}

