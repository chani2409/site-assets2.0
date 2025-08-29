// === WebGL Background ===
const canvas = document.getElementById('bgCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const DPR = Math.min(window.devicePixelRatio || 1, 1.2);
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  u_time: { value: 0 },
  u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
  u_color1: { value: new THREE.Color(0x47d6ff) },
  u_color2: { value: new THREE.Color(0x7a5cff) }
};

const vert = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  void main(){
    vec2 uv = vUv;
    float dist = distance(uv, u_mouse);
    float wave = sin(uv.x * 10.0 + u_time) + cos(uv.y * 10.0 + u_time);
    vec3 col = mix(u_color1, u_color2, wave * 0.5 + 0.5);
    col += (1.0 - dist) * 0.2;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

function animate(t) {
  uniforms.u_time.value = t * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(DPR);
});

window.addEventListener('pointermove', e => {
  uniforms.u_mouse.value.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
});

// === GSAP Animations ===
gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray('.fade-in').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 1, delay: i * 0.1,
    scrollTrigger: { trigger: el, start: "top 85%" }
  });
});

gsap.utils.toArray('h1').forEach(title => {
  gsap.to(title, {
    y: -30,
    scrollTrigger: { trigger: title, start: "top bottom", scrub: true }
  });
});

// === Form submission (demo) ===
document.getElementById('contactForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  alert('Mensaje enviado (demo)');
  this.reset();
});
