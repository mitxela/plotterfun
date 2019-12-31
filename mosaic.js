importScripts('helpers.js', 'external/stackblur.min.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Scale', value: 10, min: 2, max: 100},
  {label: 'Hatches', value: 6, min: 2, max: 10},
  {label: 'Outlines', type:'checkbox'},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;

  const major = (config.width+config.height)/config.Scale/2;
  const minor = major/config.Hatches;

  StackBlur.imageDataRGB(pixData, 0,0,config.width,config.height, Math.round(major/2)) 
  const getPixel = pixelProcessor(config, pixData)

  let hm=major/2
  let tog=false
  let rightedge = Math.floor(config.width/major)*major+hm

  let lines = []
  for (let y = hm; y < config.height; y += major) {
    tog = !tog;
    for (let x = tog? hm:rightedge; tog? (x <= config.width):(x>=0) ; x += tog? major:-major) {
      let k, toggle=false, z = getPixel(x, y)

      // outline
      if (z<42) continue;
      if (config.Outlines) lines.push([ [x-hm,y-hm],[x+hm,y-hm],[x+hm,y+hm],[x-hm,y+hm],[x-hm,y-hm] ])


      //horizontal hatches
      if (z<84) continue;
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x-hm,y-hm +k],[x+hm,y-hm +k] ])
        else lines.push([ [x+hm,y-hm +k],[x-hm,y-hm +k] ])
      }
      
      //vertical hatches
      if (z<126) continue;
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x-hm +k,y-hm],[x-hm +k,y+hm] ])
        else lines.push([ [x-hm +k,y+hm],[x-hm +k,y-hm] ])
      }

      //45deg hatches
      if (z<168) continue;
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x-hm, y-hm+k],[x-hm+k, y-hm] ])
        else lines.push([ [x-hm+k, y-hm],[x-hm, y-hm+k] ])
      }
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x-hm+k, y+hm],[x+hm, y-hm+k] ])
        else lines.push([ [x+hm, y-hm+k],[x-hm+k, y+hm] ])
      }

      //-45deg hatches
      if (z<210) continue;
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x+hm, y-hm+k],[x+hm-k, y-hm] ])
        else lines.push([ [x+hm-k, y-hm],[x+hm, y-hm+k] ])
      }
      for (k=0;k<major;k+=minor) {
        if (toggle=!toggle) 
             lines.push([ [x-hm, y-hm+k],[x+hm-k, y+hm] ])
        else lines.push([ [x+hm-k, y+hm],[x-hm, y-hm+k] ])
      }
    }
  }

  postMessage(['points', lines]);
}

