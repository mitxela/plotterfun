// Based on the Mickeymoe1992 converter algorithm written by Dan Royer
// for the Makelangelo, inspired by a post from Mickeymoe1992
importScripts('helpers.js');

postMessage(['sliders', defaultControls.concat([
  { label: 'Contour spacing', value: 10, min: 1, max: 100, step: 0.5 },
  { label: 'Seed X', value: 50, min: 0, max: 100, step: 1 },
  { label: 'Seed Y', value: 50, min: 0, max: 100, step: 1 },
  { label: 'Step size', value: 2, min: 1, max: 10, step: 1 },
])]);

let config;
let pixData;
let arrival = null;
let fieldWidth = 0;
let fieldHeight = 0;

// ------------------------------------------------------------
// Small binary min-heap
// ------------------------------------------------------------

class MinHeap {
  constructor() {
    this.a = [];
  }

  get length() {
    return this.a.length;
  }

  push(node) {
    let i = this.a.length;
    this.a.push(node);

    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].t <= node.t) break;
      this.a[i] = this.a[p];
      i = p;
    }

    this.a[i] = node;
  }

  pop() {
    const n = this.a.length;
    if (!n) return null;

    const result = this.a[0];
    const last = this.a.pop();
    if (n === 1) return result;

    let i = 0;
    while (true) {
      const left = i * 2 + 1;
      if (left >= this.a.length) break;

      const right = left + 1;
      let child = left;
      if (right < this.a.length && this.a[right].t < this.a[left].t) {
        child = right;
      }

      if (this.a[child].t >= last.t) break;
      this.a[i] = this.a[child];
      i = child;
    }

    this.a[i] = last;
    return result;
  }
}

// ------------------------------------------------------------
// Fast Marching Eikonal update
// ------------------------------------------------------------

function solveEikonal(x, y, T, F) {
  const w = fieldWidth;
  const h = fieldHeight;

  const xm = Math.max(x - 1, 0);
  const xp = Math.min(x + 1, w - 1);
  const ym = Math.max(y - 1, 0);
  const yp = Math.min(y + 1, h - 1);

  const tx = Math.min(T[xm + y * w], T[xp + y * w]);
  const ty = Math.min(T[x + ym * w], T[x + yp * w]);
  const f = F[x + y * w];

  const a = Math.min(tx, ty);
  const b = Math.max(tx, ty);
  const rhs = 1 / f;
  const diff = b - a;

  if (!Number.isFinite(a)) return Infinity;
  if (diff >= rhs) return a + rhs;

  const sum = a + b;
  const disc = sum * sum - 2 * (a * a + b * b - rhs * rhs);

  return 0.5 * (sum + Math.sqrt(Math.max(disc, 0)));
}

// ------------------------------------------------------------
// Fast Marching Method
// ------------------------------------------------------------

async function computeArrivalTimes(getPixel) {
  const step = Math.max(1, Number(config['Step size']));

  fieldWidth = Math.ceil(config.width / step);
  fieldHeight = Math.ceil(config.height / step);

  const size = fieldWidth * fieldHeight;
  const F = new Float64Array(size);
  const T = new Float64Array(size);
  T.fill(Infinity);
  const frozen = new Uint8Array(size);

  // ----------------------------------------------------------
  // Build speed field
  // ----------------------------------------------------------
  for (let x = 0; x < fieldWidth; x++) {
    for (let y = 0; y < fieldHeight; y++) {
      const px = Math.min(config.width - 1, x * step);
      const py = Math.min(config.height - 1, y * step);
      const gray = 255 - getPixel(px, py);

      F[x + y * fieldWidth] = 0.05 + 0.95 * (gray / 255);
    }
  }

  // ----------------------------------------------------------
  // Seed
  // ----------------------------------------------------------

  const sx = Math.max(0, Math.min(fieldWidth - 1,
    Math.floor(fieldWidth * Number(config['Seed X']) / 100)));
  const sy = Math.max(0, Math.min(fieldHeight - 1,
    Math.floor(fieldHeight * Number(config['Seed Y']) / 100)));

  T[sx + sy * fieldWidth] = 0;

  const pq = new MinHeap();
  pq.push({ x: sx, y: sy, t: 0 });

  let processed = 0;

  while (pq.length) {
    const node = pq.pop();
    const index = node.x + node.y * fieldWidth;

    if (frozen[index]) continue;
    frozen[index] = 1;
    processed++;

    const neighbours = [
      [node.x - 1, node.y],
      [node.x + 1, node.y],
      [node.x, node.y - 1],
      [node.x, node.y + 1],
    ];

    for (const [nx, ny] of neighbours) {
      if (nx < 0 || nx >= fieldWidth || ny < 0 || ny >= fieldHeight) continue;

      const ni = nx + ny * fieldWidth;
      if (frozen[ni]) continue;

      const newT = solveEikonal(nx, ny, T, F);
      if (newT < T[ni]) {
        T[ni] = newT;
        pq.push({ x: nx, y: ny, t: newT });
      }
    }

    // Keep the browser responsive.
    if (processed % 5000 === 0) {
      postMessage(['msg', `Fast marching ${Math.round(100 * processed / size)}%`]);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  return { T, step };
}

// ------------------------------------------------------------
// Linear interpolation
// ------------------------------------------------------------

function lerp(a, b, v) {
  return a + (b - a) * v;
}

function lerpEdge(x0, y0, x1, y1, T, level, step) {
  const in0 = T[x0 + y0 * fieldWidth];
  const in1 = T[x1 + y1 * fieldWidth];

  let v = (level - in0) / (in1 - in0);
  v = Math.max(0, Math.min(1, v));

  return [lerp(x0, x1, v) * step, lerp(y0, y1, v) * step];
}

// ------------------------------------------------------------
// Marching Squares
// ------------------------------------------------------------

function marchingSquares(T, level, step) {
  const lines = [];

  for (let x = 0; x < fieldWidth - 1; x++) {
    for (let y = 0; y < fieldHeight - 1; y++) {
      const v00 = T[x + y * fieldWidth];
      const v10 = T[x + 1 + y * fieldWidth];
      const v01 = T[x + (y + 1) * fieldWidth];
      const v11 = T[x + 1 + (y + 1) * fieldWidth];

      let code = 0;
      if (v00 > level) code |= 1;
      if (v10 > level) code |= 2;
      if (v11 > level) code |= 4;
      if (v01 > level) code |= 8;

      // Mirror symmetry optimization
      if (code > 7) code = 15 - code;

      let a;
      let b;

      switch (code) {
        case 0:
          break;

        case 1:
          a = lerpEdge(x, y, x, y + 1, T, level, step);
          b = lerpEdge(x, y, x + 1, y, T, level, step);
          lines.push([a, b]);
          break;

        case 2:
          a = lerpEdge(x + 1, y, x, y, T, level, step);
          b = lerpEdge(x + 1, y, x + 1, y + 1, T, level, step);
          lines.push([a, b]);
          break;

        case 3:
          a = lerpEdge(x, y, x, y + 1, T, level, step);
          b = lerpEdge(x + 1, y, x + 1, y + 1, T, level, step);
          lines.push([a, b]);
          break;

        case 4:
          a = lerpEdge(x + 1, y + 1, x, y + 1, T, level, step);
          b = lerpEdge(x + 1, y + 1, x + 1, y, T, level, step);
          lines.push([a, b]);
          break;

        // Saddle case.
        case 5: {
          const saddleValue = v00 * v11 - v01 * v10;

          if (saddleValue > 0) {
            a = lerpEdge(x, y, x, y + 1, T, level, step);
            b = lerpEdge(x + 1, y, x + 1, y + 1, T, level, step);
          } else {
            a = lerpEdge(x, y, x + 1, y, T, level, step);
            b = lerpEdge(x, y + 1, x + 1, y + 1, T, level, step);
          }

          lines.push([a, b]);
          break;
        }

        case 6:
          a = lerpEdge(x, y, x + 1, y, T, level, step);
          b = lerpEdge(x, y + 1, x + 1, y + 1, T, level, step);
          lines.push([a, b]);
          break;

        case 7:
          a = lerpEdge(x, y + 1, x, y, T, level, step);
          b = lerpEdge(x, y + 1, x + 1, y + 1, T, level, step);
          lines.push([a, b]);
          break;
      }
    }
  }

  return lines;
}

// ------------------------------------------------------------
// Route segments using Plotterfun's existing helper.
// ------------------------------------------------------------

function reorder(lines) {
  if (lines.length < 2) return lines;
  return sortlines(lines.slice());
}

// ------------------------------------------------------------
// Generate all contour levels
// ------------------------------------------------------------

function generateContours(T, step) {
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < T.length; i++) {
    if (!Number.isFinite(T[i])) continue;
    if (T[i] < min) min = T[i];
    if (T[i] > max) max = T[i];
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];

  const spacing = Math.max(1, Number(config['Contour spacing']));
  const result = [];

  for (let level = min; level <= max; level += spacing) {
    const segments = marchingSquares(T, level, step);

    if (segments.length) {
      result.push(...reorder(segments));
      postLines(result);
    }
  }

  return result;
}

// ------------------------------------------------------------
// Worker
// ------------------------------------------------------------

onmessage = async function(e) {
  const incomingConfig = e.data[0];
  const incomingPixels = e.data[1];

  if (!arrival) {
    // First render.
    config = incomingConfig;
    pixData = incomingPixels;

    postMessage(['msg', 'Building arrival field...']);

    const getPixel = pixelProcessor(config, pixData);
    arrival = await computeArrivalTimes(getPixel);

    postMessage(['msg', 'Extracting contours...']);
  } else {
    // Slider changes arrive without necessarily resending image data.
    Object.assign(config, incomingConfig);
  }

  const lines = generateContours(arrival.T, arrival.step);
  // animatePointList(lines, 500);
  postLines(lines);

  postMessage(['msg', `Done — ${lines.length} contour segments`]);
};
