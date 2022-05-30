/**
 * Algorithm by Tim Koop https://github.com/tkoop 
 */

importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
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

// These three functions thanks to https://stackoverflow.com/a/1501725/650004
function sqr(x) { 
    return x * x 
}
function dist2(v, w) { 
    return sqr(v[0] - w[0]) + sqr(v[1] - w[1]) 
}
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1]) ]);
}

/* This function returns the index into loop of the closest line segment to the point.  The line segment is 
defined as the line segment from one point (i) to the next (i+1). It returns the index to the first point.
*/
function findIndexOfClosestLineToPoint(loop, point) {
    var closestIndex = 0
    var closestDistance = distToSegmentSquared(point, loop[0], loop[1])

    for(var i=1; i<loop.length-1; i++) {
        var p1 = loop[i]
        var p2 = loop[i+1]
        var distance = distToSegmentSquared(point, p1, p2)
        if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = i
        }
    }

    return closestIndex
}

onmessage = async function (e) {

    setTimeout(function() {
        const [config, pixData] = e.data;
    
        // Image processor (gets a value for the current pixel)
        const getPixel = pixelProcessor(config, pixData)
    
        // Our points.  Not the final list given back.
        let points = [];
    
        // We will use a random number generater that can take a seed, so that all dots are the same
        // when changing line directions
        let dotRand = createRandFunction("" + config.Seed);
    
        for (let y = 0; y < config.height - 1; y += 1) {
            for (let x = 0; x <= config.width - 1; x += 1) {
                // Get the current pixels 'value'
                pixelval = getPixel(x, y);
    
                // We will place a dot here, randomly, with a darker value more likely to be placed
                p = pixelval / 255.0    // convert pixel darkness to a probablilty (p)
                p = p * p * p * 0.1 // p value is still too high, so we turn it down to something that looks about right
    
                if (p > dotRand()) {
                    points.push([x, y]);
                }
    
            }
        }
    
        let totalPoints = points.length
        let everyPercent = Math.ceil(totalPoints / 100)
        let everyRedraw = Math.ceil(totalPoints / 10)
    
        // This loop is an ordered array of points
        let loop = [];
    
        let randomPointIndex = parseInt(Math.random() * points.length);
        loop.push(points[randomPointIndex]);
        points.splice(randomPointIndex, 1);
    
        randomPointIndex = parseInt(Math.random() * points.length);
        loop.push(points[randomPointIndex]);
        points.splice(randomPointIndex, 1);
    
        randomPointIndex = parseInt(Math.random() * points.length);
        loop.push(points[randomPointIndex]);
        points.splice(randomPointIndex, 1);
    
        loop.push(loop[0]);
    
        // loop is now a triangle, with four points.  The first and last are the same point.
    
        while(points.length > 0) {
            randomPointIndex = parseInt(Math.random() * points.length)
            let point = points[randomPointIndex]
    //        points.splice(randomPointIndex, 1)
            // The following two lines act like the above splice, but maybe faster
            points[randomPointIndex] = points[points.length-1]
            points.length = points.length - 1
    
            let indexOfClosestLineToPoint = findIndexOfClosestLineToPoint(loop, point)
            loop.splice(indexOfClosestLineToPoint + 1, 0, point)
    
            if (points.length % everyPercent == 0) {
                postMessage(['msg', ((totalPoints - points.length) * 100 / totalPoints).toFixed(0) + "%"]);
            }

            if (points.length % everyRedraw == 0) {
                postLines(loop);
            }
        }
        postMessage(['msg', '']);
        postLines(loop);

    }, 1)
}
