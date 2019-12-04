importScripts('helpers.js', 'external/rhill-voronoi-core.min.js')

postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Max Stipples', value: 1000, min: 500, max: 10000},
  {label: 'Max Iterations', value: 30, min:2, max:200},
  {label: 'Min dot size', value: 2, min: 0.5, max: 8, noRestart:true},
  {label: 'Dot size range', value: 4, min: 0, max: 20, noRestart:true},
  {label: 'TSP Art', type:'checkbox', noRestart:true},
]]);



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixelSlow = pixelProcessor(config, pixData)

  const pixelCache =[]
  for (let x=0;x<config.width;x++) {
    pixelCache[x]=[]
    for (let y=0;y<config.height;y++)
      pixelCache[x][y] = getPixelSlow(x,y)
  }
  function getPixel(x,y){
    return pixelCache[Math.floor(x)][Math.floor(y)]
  }

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

  for (let k=0;k<config['Max Iterations'];k++){

    postMessage(['msg', "Iteration "+k]);
  
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
      circles[p]=[particles[p].x,particles[p].y,  getPixel(particles[p].x,particles[p].y) ]
    }
    postMessage(['circles', circles])

//    postMessage(['msg', "Total deviation"+ totalDeviation/maxParticles]);

  }



  postMessage(['msg', "Route optimization"]);

  function distance(p1,p2){ 
      let dx = p1.x-p2.x
      let dy = p1.y-p2.y
      return dx*dx+dy*dy
  }
  function swapParticles(p1,p2){ 
    let temp = particles[p1]
    particles[p1]=particles[p2]
    particles[p2]=temp
  }


  for (i=1; i< maxParticles; i++){
    let closest = 0, mindist = 1e99
    for (let j=i; j<maxParticles; j++) {
      let d = distance(particles[j], particles[i-1])
      if (d < mindist) {
        closest = j
	mindist=d
      }
    }
    swapParticles(i,closest)
  }


  for (let p in particles) circles[p]=[particles[p].x,particles[p].y]
  postMessage(['points', circles])


  // 2-opt optimization 
  let numSwaps=1
  while (numSwaps>0) {
    numSwaps=0
    
    for (i=0;i<1e7;i++) {
      let iA = Math.floor(Math.random()*(maxParticles-1))
      let iB = Math.floor(Math.random()*(maxParticles-1))
      if (Math.abs(iA-iB)<2) continue
      if (iB<iA) {
        let temp = iB
        iB=iA
        iA = temp
      }
  
      let dA = distance( particles[iA], particles[iA+1] ) 
             + distance( particles[iB], particles[iB+1] )
      let dB = distance( particles[iA], particles[iB]) 
             + distance( particles[iA+1], particles[iB+1])
  
      if (dB<dA) {
        // reverse tour between a1 and b0
        let high = iB, low = iA+1
        while (high>low) {
          swapParticles(low, high)
  	high--
  	low++
        }
        numSwaps++
      }
    }
    postMessage(['msg', `Optimizing route... [${numSwaps} swaps ]`]);
  
    for (let p in particles) circles[p]=[particles[p].x,particles[p].y]
    postMessage(['points', circles])

  }


    for (let p in particles){
      circles[p]=[particles[p].x,particles[p].y,  getPixel(particles[p].x,particles[p].y) ]
    }
    postMessage(['circles', circles])

  postMessage(['msg', "Done"]);
}


