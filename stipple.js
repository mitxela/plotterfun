importScripts('helpers.js', 'rhill-voronoi-core.min.js')

postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Max Stipples', value: 1000, min: 500, max: 5000},
  {label: 'Size', value: 32, min: 8, max: 64},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)
 
  const maxParticles = config['Max Stipples'] 
  let particles = Array(maxParticles), i=0;
  
  while ( i < maxParticles  ) {
    x=Math.random()*config.width; //borders...
    y=Math.random()*config.height;
    
    z = getPixel( x , y )
    if (Math.random()*255 <= z) 
      particles[i++]={x,y}
  }

  postMessage(['msg', "Calculating voronoi"]);

  var voronoi = new Voronoi();
  var bbox = {xl:0, xr:config.width, yt:0, yb:config.height}
  var diagram = voronoi.compute(particles, bbox)

  postMessage(['dbg', diagram]);

  postMessage(['msg', "Calculating weighted centroids"]);

  let edgePixels = []

  let temp = []
  for (let h of diagram.cells[0].halfedges) {
//    temp.push([[Math.round(h.edge.va.x),Math.round(h.edge.va.y)],[Math.round(h.edge.vb.x),Math.round(h.edge.vb.y)]])
  }
  


  var halfedges = diagram.cells[0].halfedges;

  var v = halfedges[0].getStartpoint()
  let sx = v.x
  let sy = v.y;
  let dx,ex,ey;

//  edgePixels.push([Math.round(sx),Math.round(sy)])

  // Walk around the perimeter of the cell marking the boundary pixels
  // No need for full bressenham since we'll be scanning across anyway
  for (i of halfedges){
    v = i.getEndpoint()
    ex = v.x
    ey = v.y
    dx = (ex-sx) / (ey-sy)
    if (sy == sx) {
      edgePixels.push([Math.round(sx),Math.round(sy)])
    } else if (sy<ey) {
      while (sy < ey) {
        edgePixels.push([Math.round(sx),Math.round(sy)])
        sy++
        sx += dx
      }
    } else {   
      while (sy > ey) {
        edgePixels.push([Math.round(sx),Math.round(sy)])
        sy--
        sx -= dx
      }
    }
    sy=ey
    sx=ex
  }

temp.push(edgePixels)

// create lookup addressed by Y coord
var byY ={}
for (i of edgePixels){
  if (byY[i[1]]) byY[i[1]].push(i[0])
  else byY[i[1]] = [i[0]]
}
console.log('byY:   '+JSON.stringify(byY))

var newlist = []
// scanlines
for (let y in byY) {
  for (i = Math.min(...byY[y]); i<= Math.max(...byY[y]); i++){
    newlist.push([ i, Number(y) ])
  }

}


console.log(newlist)
//  console.log(diagram.cells[0].halfedges.length)
  postMessage(['points',newlist])

//  diagram.cells[0].halfedges[0].edge.va

  // go through each edge, incrementing y and pushing rounded x
  // 


//  postMessage(['circles', particles]);
}


