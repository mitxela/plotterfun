importScripts('helpers.js', 'external/stackblur.min.js')

postMessage(['sliders', defaultControls.concat([
  { label: 'Divisions', value: 25, min: 10, max: 100 },
  { label: 'Factor', value: 100, min: 10, max: 400 },
  { label: 'Cutoff', value: 0, min: 0, max: 254},
  { label: 'Interlaced', type: 'checkbox' },
  { label: 'Diamond', type: 'checkbox' },
])]);


onmessage = function (e) {
  const [config, pixData] = e.data;

  const major = (config.width + config.height) / config.Divisions / 2;
  const interlaced = config.Interlaced;
  const factor = config.Factor;
  const diamond = config.Diamond;

  StackBlur.imageDataRGB(pixData, 0, 0, config.width, config.height, Math.round(major / 2))
  const getPixel = pixelProcessor(config, pixData)

  let hm = major / 2
  let tog = false
  let circles = []
  let lines = []

  for (let y = hm; y < config.height; y += major) {
    tog = !tog;
    let xOff = (interlaced && tog) ? major / 2 : 0;
    for (let x = hm + xOff; x < config.width; x += major) {
      //circles in the pixel center
      let z = getPixel(x, y);
      if (z < config.Cutoff) continue;
      let radious = z * hm / 255 * factor / 100;
      if (!diamond) {
        circles.push({ x: x - hm / 2, y: y - hm / 2, r: radious });
      }
      else {
        let p1 = [x - radious, y];
        let p2 = [x, y - radious];
        let p3 = [x + radious, y];
        let p4 = [x, y + radious];
        lines.push([p1, p2]);
        lines.push([p2, p3]);
        lines.push([p3, p4]);
        lines.push([p4, p1]);
      }

    }
  }

  if (circles.length>0)
    postCircles(circles);
  if (lines.length>0)
    postLines(lines);
}

