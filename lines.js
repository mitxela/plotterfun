/**
 * Algorithm by j-waal
 */

importScripts('helpers.js')

postMessage(['sliders', [
    { label: 'Spacing', value: 5, min: 1, max: 20, step: 1 },
    { label: 'Threshold', value: 128, min: 0, max: 255, step: 1 },
    { label: 'Minlenght', value: 1, min: 0, max: 32, step: 1 },
	{ label: 'Alternate', type:'checkbox', checked:false},
	{ label: 'Direction', type:'select', value:'Horizontal', options:['Horizontal','Vertical','Both']},
]]);



onmessage = function (e) {
    const [config, pixData] = e.data;

    // User variables
    const spacing = config.Spacing
	const threshold = config.Threshold
	const minlenght = config.Minlenght // get rid of short line segments
	const direction = config.Direction
	const alternate = config.Alternate

    // Image processor (gets a value for all pixels)
    const getPixel = pixelProcessor(config, pixData)

    // Create an empty array of points
    let points = [];
	if (direction == 'Horizontal' || direction == 'Both'){
		let toggle = true;
		for (let y = 0; y < config.height; y += spacing) { // scan horizontal
			let thisline = []
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
						if (toggle){
							thisline.push([[storex ,y], [x ,y]]);
						}else{
							thisline.push([[x ,y], [storex ,y]]);
						}
					}
					mode = 0
				}
			}
			if (mode == 1){
				if (config.width-storex > minlenght){
					if (toggle){
						thisline.push([[storex ,y], [config.width ,y]]);
					}else{
						thisline.push([[config.width ,y], [storex ,y]]);
					}
				}
			}
			if (toggle){
				points = points.concat(thisline)
			}else{
				points = points.concat(thisline.reverse())
			}
			if (alternate && thisline.length){ // dont change direction on emty lines
				toggle=!toggle;
			}
		}
	}
	if (direction == 'Vertical' || direction == 'Both'){
		let toggle = true;
		for (let x = 0; x < config.width; x += spacing) { // scan vertical
			let thisline = []
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
						if (toggle){
							thisline.push([[x ,storey], [x ,y]]);
						}else{
							thisline.push([[x ,y], [x ,storey]]);
						}
					}
					mode = 0
				}
			}
			if (mode == 1){
				if (config.height-storey > minlenght){
					if (toggle){
						thisline.push([[x ,storey], [x, config.height]]);
					}else{
						thisline.push([[x, config.height], [x ,storey]]);
					}
				}
			}
			if (toggle){
				points = points.concat(thisline)
			}else{
				points = points.concat(thisline.reverse())
			}
			if (alternate && thisline.length){ // dont change direction on emty lines
				toggle=!toggle;
			}
		}
	}
    postLines(points);
}
