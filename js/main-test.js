// main.js de prueba mínima: cortina + partículas (usando canvas propio)
const fxCanvas = document.createElement('canvas');
fxCanvas.id = 'fxCanvas';
Object.assign(fxCanvas.style, {
  position: 'fixed', inset: '0', width: '100vw', height: '100vh',
  pointerEvents: 'none', zIndex: '9000'
});
document.body.appendChild(fxCanvas);

// Three.js
const renderer = new THREE.WebGLRenderer({ canvas: fxCanvas, antialias: true, alpha: true });
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(DPR);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 2;
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// Partículas
const group = new THREE.Group(); scene.add(group);
const count = 300;
const geom = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const ix = 3 * i;
  positions[ix + 0] = (Math.random() - 0.5) * 2;
  positions[ix + 1] = (Math.random() - 0.5) * 2;
  positions[ix + 2] = (Math.random() - 0.5) * 1;
  colors[ix + 0] = 0.7 + Math.random() * 0.3;
  colors[ix + 1] = 0.6 + Math.random() * 0.3;
  colors[ix + 2] = 1.0;
}
geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const mat = new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, opacity: 0.9 });
const points = new THREE.Points(geom, mat);
group.add(points);

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// Loop
function tick(t) {
  group.rotation.y += 0.001;
  group.rotation.x += 0.0005;
  if (typeof gsap !== 'undefined') {
    gsap.to(group.rotation, { x: mouseY * 0.3, y: mouseX * 0.3, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Cortina
const overlay = document.createElement('div');
Object.assign(overlay.style, {
  position: 'fixed', inset: '0',
  background: 'linear-gradient(90deg, var(--accent, #47d6ff), var(--accent-2, #7a5cff))',
  zIndex: '9999', pointerEvents: 'none',
  transform: 'scaleY(0)', transformOrigin: 'top'
});
document.body.appendChild(overlay);

function playTransition() {
  if (typeof gsap === 'undefined') { console.error('GSAP no está cargado'); return; }
  gsap.timeline()
    .to(overlay, { scaleY: 1, duration: 0.5, ease: 'power4.in' })
    .to(overlay, { scaleY: 0, duration: 0.5, ease: 'power4.out' });
}

// Disparo de prueba automático al cargar
if (typeof gsap !== 'undefined') {
  setTimeout(() => playTransition(), 600);
}
