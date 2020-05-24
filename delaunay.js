importScripts('helpers.js', 'external/rhill-voronoi-core.min.js', 'external/stackblur.min.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Max Stipples', value: 2000, min: 500, max: 10000},
  {label: 'Max Iterations', value: 30, min:2, max:200},
  {label: 'Spread', value: 10, min:0, max:100},
])]);


(function(){

var particles, config, pixData, pixelCache =[];
var diagram=null;

onmessage = function(e) {
  if (!particles) {
    [ config, pixData ] = e.data;
    render()
  } else {
    Object.assign(config, e.data[0])
    redraw()
  }
}

function makeAsync(f) {
  return new Promise(resolve => setTimeout(() => resolve(f()), 0) )
}

function getPixel(x,y){
  return pixelCache[Math.floor(x)][Math.floor(y)]
}
function triangulate(){
  let delaunay = [];
  for (let e in diagram.edges) {
    if (diagram.edges[e].lSite && diagram.edges[e].rSite) {
      let l = diagram.edges[e].lSite.voronoiId, r = diagram.edges[e].rSite.voronoiId;
      delaunay.push([ [particles[l].x, particles[l].y] , [particles[r].x, particles[r].y] ]);
    }
  }
  return delaunay
}
function redraw(tsp){
  postLines(triangulate())
}

async function render() {

  await makeAsync(()=> StackBlur.imageDataRGB(pixData, 0,0,config.width,config.height, 1) )

  const getPixelSlow = pixelProcessor(config, pixData)

  const decr = (config['Spread']/5000)

  for (let x=0;x<config.width;x++) {
    pixelCache[x]=[]
    for (let y=0;y<config.height;y++)
      pixelCache[x][y] = getPixelSlow(x,y) * (1-decr) + decr*255;
  }

  const maxParticles = config['Max Stipples'] 
  const border = 6;
  particles = Array(maxParticles), i=0;
  
  while ( i < maxParticles  ) {
    x=Math.random()*(config.width-border*2)+border;
    y=Math.random()*(config.height-border*2)+border;
    
    z = getPixel( x , y )
    if (Math.random()*255 <= z) 
      particles[i++]={x,y}
  }

  for (let p in particles) particles[p].r=1;

  var voronoi = new Voronoi();
  var bbox = {xl:border, xr:config.width-border, yt:border, yb:config.height-border}

  for (let k=0;k<config['Max Iterations'];k++){
    postMessage(['msg', "Iteration "+k]);

    voronoi.recycle(diagram)
    await makeAsync(()=> diagram = voronoi.compute(particles, bbox))

    await makeAsync(()=>{
 
      for (let c = 0; c< maxParticles; c++) {
    
        let edgePixels = []
        let halfedges = diagram.cells[c].halfedges;
        if (halfedges.length==0) continue
      
        let v = halfedges[0].getStartpoint()
        let sx = v.x
        let sy = v.y;
        let dx,ex,ey;
      
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
      
      
        // create lookup addressed by Y coord
        let byY ={}
        for (i of edgePixels){
          if (byY[i[1]]) byY[i[1]].push(i[0])
          else byY[i[1]] = [i[0]]
        }
        
        // scanlines
        let xSum=0, ySum=0, dSum = 0;
        for (let ny in byY) {
          let y = Number(ny)
          for (let x = Math.min(...byY[ny]); x<= Math.max(...byY[ny]); x++){
            let z = 0.001 + getPixel(x,y)
            xSum += z*x
            ySum += z*y
            dSum += z
          }
        }
        if (dSum>0) {
          xSum /= dSum
          ySum /= dSum
        }
  
        particles[c].x = Math.max(border,Math.min(xSum, config.width-border))
        particles[c].y = Math.max(border,Math.min(ySum, config.height-border))
      }
    });
    redraw(0)
  }


  postMessage(['msg', "Route optimization"]);

  let lines = triangulate()

  await makeAsync(()=>{
    lines = sortlines(lines)
  })
  postLines(lines)
  postMessage(['msg', "Done"]);
}

})();
