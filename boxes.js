importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Size', value: 5, min: 5, max: 50, step: 1},
  {label: 'Spacing', value: 10, min: 5, max: 50, step: 1},
  {label: 'Random', type:'checkbox'},
])]);

onmessage = function(e) {
    const [ config, pixData ] = e.data;  

    // Slider variables
    const spacing = parseFloat(config.Spacing)
    const size = parseFloat(config.Size)
    const enRan = config.Random

    // Image processor (gets a value for the current pixel)
    const getPixel = pixelProcessor(config, pixData)

    // Create an empty array of points
    let points = [];

    // We need to jump the pixels by the space value
    // Loop over all the pixels adding a box for each point
    for (let y = 0; y < config.height; y+=spacing) {
        for (let x = 0; x <= config.width; x+=spacing) {
            // Get the current pixels 'value'
            pixelval = getPixel( x , y );
            // Determine what size the pixel should be based on the current pixelval
            if (enRan){
              pixelsize = (pixelval / size) * Math.random();
            } else {
              pixelsize = pixelval / size;
            }       
            //console.debug("Current pixelval = " + pixelval + " pixelsize = " + pixelsize);
            let cube = [ [x,y], [x+pixelsize,y], [x+pixelsize, y+pixelsize], [x, y+pixelsize], [x,y] ]
            points.push(cube);
        }
    } 
    postLines(points);
  }