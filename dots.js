/**
 * Algorithm by Tim Koop https://github.com/tkoop 
 */

importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
    { label: 'Resolution', value: 2, min: 1, max: 20, step: 1 },
    { label: 'Line Direction', value: 0, min: 0, max: 180, step: 1 },
    { label: 'Random Direction', type: 'checkbox' },
    { label: 'Seed', value: 50, min: 0, max: 100, step: 1 },
])]);


// Thanks to https://gist.github.com/tionkje/6ab66360dcfe9a9e2b5560742d259389
function createRandFunction(seedString) {
    for (var i = 0, h = 1779033703 ^ seedString.length; i < seedString.length; i++) {
        h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967295;
    }
}

onmessage = function (e) {
    const [config, pixData] = e.data;

    // Slider variables
    const spacing = config.Resolution

    // Image processor (gets a value for the current pixel)
    const getPixel = pixelProcessor(config, pixData)

    // Create an empty array of points
    let points = [];

    // We will use a random number generater that can take a seed, so that all dots are the same
    // when changing line directions
    let dotRand = createRandFunction("" + config.Seed);
    let directionRand = createRandFunction("" + config.Seed);

    // Calculate Line direction offsets first, to save a little time later
    let xOffset, yOffset
    if (config["Line Direction"] < 90) {
        xOffset = config["Line Direction"] / 90.0 * spacing
        yOffset = spacing
    } else {
        xOffset = spacing
        yOffset = spacing - (config["Line Direction"] - 90) / 90.0 * spacing
    }

    // We need to jump the pixels by the spacing value
    for (let y = 0; y < config.height - spacing; y += spacing) {
        for (let x = 0; x <= config.width - spacing; x += spacing) {
            // Get the current pixels 'value'
            pixelval = getPixel(x, y);

            // We will place a dot here, randomly, with a darker value more likely to be placed
            p = pixelval / 255.0    // convert pixel darkness to a probablilty (p)
            p = p * p * p * 0.5 // p value is still too high, so we turn it down to something that looks about right
            p = p * spacing // the bigger resolution we have, then higher probability we want

            if (p > dotRand()) {
                if (config['Random Direction']) {
                    dir = directionRand()
                    if (directionRand() > 0.5) {
                        points.push([[x + dir * spacing, y], [x + spacing - dir * spacing, y + spacing]]);
                    } else {
                        points.push([[x, y + dir * spacing], [x + spacing, y + spacing - dir * spacing]]);
                    }
                } else {
                    points.push([[x + xOffset, y + yOffset], [x + spacing - xOffset, y + spacing - yOffset]]);
                }
            }

        }
    }
    postLines(points);
}
