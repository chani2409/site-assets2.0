document.addEventListener("DOMContentLoaded", () => {
  // === WebGL Background Mejorado ===
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) {
    console.warn('bgCanvas no encontrado en el DOM.');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2); // far > 1 para ver objetos delante

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

  const frag = `
    precision highp float;
    varying vec2 vUv;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec3 u_color1;
    uniform vec3 u_color2;

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

      uv.x += 0.03 * sin(u_time + uv.y * 10.0);
      uv.y += 0.03 * cos(u_time + uv.x * 10.0);

      float n = noise(uv * 5.0 + u_time * 0.1);
      float wave = sin(uv.x * 10.0 + u_time) + cos(uv.y * 10.0 + u_time);

      vec3 col = mix(u_color1, u_color2, wave * 0.5 + 0.5 + n * 0.2);
      col += (1.0 - dist) * 0.15;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  bgMesh.renderOrder = -1;
  scene.add(bgMesh);

  // === Figuras 3D: Octaedros wireframe ===
  const particleGroup = new THREE.Group();
  particleGroup.renderOrder = 1; // delante del fondo
  scene.add(particleGroup);

  const particleCount = 100;
  const particleGeometry = new THREE.OctahedronGeometry(0.025, 0);
  const baseMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.9
  });

  for (let i = 0; i < particleCount; i++) {
    const m = baseMaterial.clone();
    m.color.setHSL(Math.random(), 0.6, 0.65);
    const particle = new THREE.Mesh(particleGeometry, m);
    particle.position.set(
      (Math.random() - 0.5) * 1.8,
      (Math.random() - 0.5) * 1.8,
      0.5 + Math.random() * 0.5 // siempre delante del plano
    );
    particle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    particle.userData.phase = Math.random() * Math.PI * 2;
    particle.userData.speed = 0.5 + Math.random();
    particleGroup.add(particle);
  }
  particleGroup.visible = false;

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animateParticles(time) {
    const t = time * 0.001;
    particleGroup.rotation.y += 0.001;
    particleGroup.rotation.x += 0.0005;
    gsap.to(particleGroup.rotation, {
      x: mouseY * 0.25,
      y: mouseX * 0.25,
      duration: 0.5,
      ease: "power2.out",
      overwrite: 'auto'
    });
    particleGroup.children.forEach(p => {
      const ph = p.userData.phase;
      const sp = p.userData.speed;
      p.rotation.x += 0.005 * sp;
      p.rotation.y += 0.007 * sp;
      p.position.x += Math.sin(t * sp + ph) * 0.0008;
      p.position.y += Math.cos(t * sp + ph) * 0.0008;
    });
  }

  function animate(t) {
    uniforms.u_time.value = t * 0.001;
    animateParticles(t);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

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

  // === GSAP Animations ===
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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

  gsap.utils.toArray('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, { scale: 1.08, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.inOut" });
    });
  });

  // === Cortina de transición ===
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-2))';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  overlay.style.transform = 'scaleY(0)';
  overlay.style.transformOrigin = 'top';
  document.body.appendChild(overlay);

  function playTransition(callback) {
    gsap.timeline()
      .to(overlay, {
        scaleY: 1,
        duration: 0.5,
        ease: "power4.in",
        onStart: () => { particleGroup.visible = true; }
      })
      .add(() => { if (callback) callback(); })
      .to(overlay, {
        scaleY: 0,
        duration: 
