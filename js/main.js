// === WebGL Background Mejorado ===
const canvas = document.getElementById('bgCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
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

const vert = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Shader con ruido y distorsión suave
const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_color1;
  uniform vec3 u_color2;

  // Función de ruido simple
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main(){
    vec2 uv = vUv;
    float dist = distance(uv, u_mouse);

    // Distorsión animada
    uv.x += 0.03 * sin(u_time + uv.y * 10.0);
    uv.y += 0.03 * cos(u_time + uv.x * 10.0);

    // Ruido animado
    float n = noise(uv * 5.0 + u_time * 0.1);

    // Onda base
    float wave = sin(uv.x * 10.0 + u_time) + cos(uv.y * 10.0 + u_time);

    // Mezcla de colores
    vec3 col = mix(u_color1, u_color2, wave * 0.5 + 0.5 + n * 0.2);
    col += (1.0 - dist) * 0.15;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: vert,
  fragmentShader: frag
});
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
  uniforms.u_mouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
});

// === GSAP Animations Mejoradas ===
gsap.registerPlugin(ScrollTrigger);

// Fade-in con leve rotación
gsap.utils.toArray('.fade-in').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 20, rotateX: -10 },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 1,
      delay: i * 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" }
    }
  );
});

// Parallax más suave en títulos
gsap.utils.toArray('h1').forEach(title => {
  gsap.to(title, {
    y: -30,
    ease: "none",
    scrollTrigger: {
      trigger: title,
      start: "top bottom",
      scrub: true
    }
  });
});

// Microinteracción en botones
gsap.utils.toArray('.btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    gsap.to(btn, { scale: 1.08, duration: 0.3, ease: "power2.out" });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.inOut" });
  });
});

// === Form submission (demo) ===
document.getElementById('contactForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  alert('Mensaje enviado (demo)');
  this.reset();
});
// === Fase 3: Transiciones y Storytelling ===

// Crear overlay de transición
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.inset = '0';
overlay.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-2))';
overlay.style.zIndex = '9999';
overlay.style.pointerEvents = 'none';
overlay.style.transform = 'scaleY(0)';
overlay.style.transformOrigin = 'top';
document.body.appendChild(overlay);

// Función para reproducir transición
function playTransition(callback) {
  gsap.timeline()
    .to(overlay, { scaleY: 1, duration: 0.5, ease: "power4.in" })
    .add(() => { if (callback) callback(); })
    .to(overlay, { scaleY: 0, duration: 0.5, ease: "power4.out", transformOrigin: 'bottom' });
}

// Animar entrada de secciones al hacer scroll
gsap.utils.toArray('section').forEach((sec, i) => {
  gsap.from(sec.querySelectorAll('.content > *'), {
    opacity: 0,
    y: 50,
    stagger: 0.15,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: sec,
      start: "top 80%",
      onEnter: () => {
        // Pequeña transición al entrar
        playTransition();
      }
    }
  });
});

// Animación suave al hacer clic en enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      playTransition(() => {
        gsap.to(window, { duration: 1, scrollTo: target, ease: "power2.inOut" });
      });
    }
  });
});
