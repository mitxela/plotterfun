importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Angle', value: 0, min: 0, max: 360},
  {label: 'Amplitude', value: 5, min: 0.1, max: 20, step: 0.1},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const pi=Math.PI
  const cos = Math.cos(config.Angle/180*pi) 
  const sin = Math.sin(config.Angle/180*pi) 
  const a = config.Amplitude
  const w = config.width
  const h = config.height
  const L = Math.sqrt(w*w+h*h)

  let left = [], right=[];

  let lastline, line = [];
  
  function inside(x,y){ return (x>=0 && y>=0 && x<w && y<h) }
  function pix(x,y) { return (inside(x,y)) ? (255-getPixel(Math.floor(x),Math.floor(y)))*a/255 : 0 }

  // initial straight line

  let x=(w - L*cos)/2, y=(h - L*sin)/2
  for (let i=0;i<L;i++) {
    x+=cos
    y+=sin
//    if (inside(x,y)) 
    line.push([x,y])
  }
  left.push(line)

  for (let j=0;j<L/2/a;j++){
    lastline=line, line=[]
    for (let i=0;i<L;i++) {
      x=lastline[i][0] + sin*a
      y=lastline[i][1] - cos*a
      let z = pix(x,y)
      x+= sin*z
      y-= cos*z
      line.push([x,y])
    }
    
    left.push(line)
  }

  line=left[0];

  for (let j=0;j<L/2/a;j++){
    lastline=line, line=[]
    for (let i=0;i<L;i++) {
      x=lastline[i][0] - sin*a
      y=lastline[i][1] + cos*a
      let z = pix(x,y)
      x-= sin*z
      y+= cos*z
      line.push([x,y])
    }
    
    right.push(line)
  }

  right.reverse()
  let temp=  right.concat(left), output=[]

  for (let i=0;i<temp.length;i++) {
    let line=temp[i], newline=[]
    for (let j=0;j<line.length;j++){
      if (inside(line[j][0], line[j][1])) newline.push(line[j])
    }
    if (newline.length>1) output.push(newline);
  }
  


  postMessage(['points', output]);
}

