/**
 * Algorithm implementation by j-waal
 * Inspiration from Tim Holman - Generative Art Speedrun
 * rectangleworld - Random Braids
 */

importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
	{label: 'Frequency', value: 150, min: 5, max: 256},
	{label: 'Line Count', value: 8, min: 5, max: 200},
	{label: 'Cosine', type: 'checkbox' },
])]);


onmessage = function(e) {
	const [ config, pixData ] = e.data;
	const getPixel = pixelProcessor(config, pixData)

	const lineCount = config['Line Count'];
	const frequency = config.Frequency;
	const incr_y = Math.floor(config.height / lineCount);
	const cosine = config.Cosine;
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
		line.push([0, l*incr_y])
		for (let x = 1; x < output.length; x++) {
			if (cosine && lineMap[x-1][l] != lineMap[x][l]){
				// nice cosine function to connect the two lines
				let h1 = lineMap[x-1][l]*incr_y
				let h2 = lineMap[x][l]*incr_y
				let d = h1-h2
				let a = (h1+h2)/2
				for (p=1; p<frequency; p++){
					let xp = (x-1)*frequency+p
					let yp = a+(d/2)*Math.cos(p*Math.PI/frequency)
					line.push([xp, yp])
				}
			}
			line.push([x*frequency, lineMap[x][l]*incr_y])
		}
		lines.push(line)
	}
	postLines(lines);
}
