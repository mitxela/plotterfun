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
    const spacing = config.Spacing // spacing between lines
	const threshold = config.Threshold
	const minlenght = config.Minlenght // dont output short line segments
	const direction = config.Direction
	const alternate = config.Alternate

    // Image processor (gets a value for all pixels)
    const getPixel = pixelProcessor(config, pixData)

    // Create an empty array of points
    let points = [];
	if (direction == 'Horizontal' || direction == 'Both'){
		let toggle = true; // toggle to alternate line direction
		for (let y = 0; y < config.height; y += spacing) { // scan horizontal
			let thisline = []
			let mode = false
			let storex
			for (let x = 0; x <= config.width - 1; x += 1) {
				pixelval = getPixel(x, y);
				if (pixelval > threshold && mode == false){
					// start line here
					storex = x
					mode = true
				}
				if (pixelval < threshold && mode == true){
					// store only the start and end of the lines
					if (x-storex > minlenght){
						if (toggle){
							thisline.push([[storex ,y], [x ,y]]);
						}else{
							thisline.push([[x ,y], [storex ,y]]);
						}
					}
					mode = false
				}
			}
			if (mode == true){
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
			if (alternate && thisline.length){ // dont change direction on empty lines
				toggle=!toggle;
			}
		}
	}
	if (direction == 'Vertical' || direction == 'Both'){
		let toggle = true; // toggle to alternate line direction
		for (let x = 0; x < config.width; x += spacing) { // scan vertical
			let thisline = []
			let mode = false
			let storey
			for (let y = 0; y <= config.height - 1; y += 1) {
				pixelval = getPixel(x, y);
				if (pixelval > threshold && mode == false){
					// start line here
					storey = y
					mode = true
				}
				if (pixelval < threshold && mode == true){
					// store only the start and end of the lines
					if (y-storey > minlenght){
						if (toggle){
							thisline.push([[x ,storey], [x ,y]]);
						}else{
							thisline.push([[x ,y], [x ,storey]]);
						}
					}
					mode = false
				}
			}
			if (mode == true){
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
			if (alternate && thisline.length){ // dont change direction on empty lines
				toggle=!toggle;
			}
		}
	}
    postLines(points);
}
