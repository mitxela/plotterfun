/**
 * Algorithm by j-waal
 */

importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
    { label: 'Spacing', value: 5, min: 1, max: 20, step: 1 },
    { label: 'Threshold', value: 128, min: 0, max: 255, step: 1 },
    { label: 'Minlenght', value: 1, min: 0, max: 32, step: 1 },
	{ label: 'Direction', type:'select', value:'Horizontal', options:['Horizontal','Vertical','Both']}
])]);



onmessage = function (e) {
    const [config, pixData] = e.data;

    // User variables
    const spacing = config.Spacing
	const threshold = config.Threshold
	const minlenght = config.Minlenght // get rid of short line segments
	const direction = config.Direction

    // Image processor (gets a value for all pixels)
    const getPixel = pixelProcessor(config, pixData)

    // Create an empty array of points
    let points = [];
	linecount = 0
	if (direction == 'Horizontal' || direction == 'Both'){
		for (let y = 0; y < config.height; y += spacing) { // scan horizontal
			let mode = 0
			let storex
			for (let x = 0; x <= config.width - 1; x += 1) {
				pixelval = getPixel(x, y);
				if (pixelval > threshold && mode == 0){
					storex = x
					mode = 1
				}
				if (pixelval < threshold && mode == 1){
					if (x-storex > minlenght){
						points.push([[storex ,y], [x ,y]]);
						linecount += 1
					}
					mode = 0
				}
			}
			if (mode == 1){
				if (config.width-storex > minlenght){
					points.push([[storex ,y], [config.width ,y]]);
					linecount += 1
				}
			}
		}
	}
	if (direction == 'Vertical' || direction == 'Both'){
		for (let x = 0; x < config.width; x += spacing) { // scan vertical
			let mode = 0
			let storey
			for (let y = 0; y <= config.height - 1; y += 1) {
				pixelval = getPixel(x, y);
				if (pixelval > threshold && mode == 0){
					storey = y
					mode = 1
				}
				if (pixelval < threshold && mode == 1){
					if (y-storey > minlenght){
						points.push([[x ,storey], [x ,y]]);
						linecount += 1
					}
					mode = 0
				}
			}
			if (mode == 1){
				if (config.height-storey > minlenght){
					points.push([[x ,storey], [x, config.height]]);
					linecount += 1
				}
			}
		}
	}
    postLines(points);
}
