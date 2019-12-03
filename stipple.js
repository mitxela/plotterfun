importScripts('helpers.js', 'rhill-voronoi-core.min.js')

postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Max Stipples', value: 1000, min: 500, max: 10000},
  {label: 'Size', value: 32, min: 8, max: 64},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)
 
  const maxParticles = config['Max Stipples'] 
  const border = 6;
  let particles = Array(maxParticles), i=0;
  let circles = Array(maxParticles)
  
  while ( i < maxParticles  ) {
    x=Math.random()*(config.width-border*2)+border;
    y=Math.random()*(config.height-border*2)+border;
    
    z = getPixel( x , y )
    if (Math.random()*255 <= z) 
      particles[i++]={x,y}
  }

  var voronoi = new Voronoi();
  var diagram=null
  var bbox = {xl:border, xr:config.width-border, yt:border, yb:config.height-border}

  for (let k=0;k<200;k++){

    postMessage(['msg', "Calculating voronoi"]);
  
    //let totalDeviation = 0;

    voronoi.recycle(diagram)
    diagram = voronoi.compute(particles, bbox)
  
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

//      totalDeviation += Math.sqrt((particles[c].x-xSum)*(particles[c].x-xSum) + (particles[c].y-ySum)*(particles[c].y-ySum))

      particles[c].x = Math.max(border,Math.min(xSum, config.width-border))
      particles[c].y = Math.max(border,Math.min(ySum, config.height-border))
    }
    
  
    for (let p in particles){
      circles[p]=[particles[p].x,particles[p].y,  getPixel(particles[p].x,particles[p].y)/64 ]
    }
    postMessage(['circles', circles])

//    postMessage(['msg', "Total deviation"+ totalDeviation/maxParticles]);

  }



}


