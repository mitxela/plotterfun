/**
 * Algorithm implementation by j-waal
 * Inspiration from Tim Holman - Generative Art Speedrun
 * rectangleworld - Random Braids
 */

importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
	{label: 'Frequency', value: 150, min: 5, max: 256},
	{label: 'Line Count', value: 8, min: 5, max: 200},
])]);


onmessage = function(e) {
	const [ config, pixData ] = e.data;
	const getPixel = pixelProcessor(config, pixData)

	const lineCount = config['Line Count'];
	const frequency = config.Frequency;
	const incr_y = Math.floor(config.height / lineCount);
	output = [];

	let order = Array.from(Array(lineCount).keys())
	
	for (let x = 0; x < config.width; x += frequency) {
		console.log(x)
		console.log(order)
		output.push([...order])
		for (let l = 0; l<lineCount; l++){
			let z = getPixel(x, l*incr_y)
			//console.log(x,l*incr_y,z)
			if (z > 100 && l!=lineCount-1 ){
				[order[l], order[l+1]] = [order[l+1], order[l]]
				console.log("swap", l, l+1)
				l++ // skip next line
			}
		}
	}

	// create map
	lineMap = []
	for (let x = 0; x < output.length; x++) {
		console.log(x)
		let map = []
		for (let l = 0; l<lineCount; l++){
			let v = output[x][l]
			map[v] = l
		}
		console.log(map)
		lineMap.push([...map])
	}

	//convert to image
	lines = []
	for (let l = 0; l<lineCount; l++){
		let line = []
		for (let x = 0; x < output.length; x++) {
			//
			line.push([x*frequency, lineMap[x][l]*incr_y])
		}
		lines.push(line)
	}
	postLines(lines);
}
