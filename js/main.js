document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1) Fondo: shader en bgCanvas
  // =========================
  const bg = document.getElementById("bgCanvas");
  if (!bg) { console.warn("bgCanvas no encontrado"); return; }

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const bgRenderer = new THREE.WebGLRenderer({ canvas: bg, antialias: true });
  bgRenderer.setPixelRatio(DPR);
  bgRenderer.setSize(window.innerWidth, window.innerHeight);

  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_color1: { value: new THREE.Color(0x47d6ff) },
    u_color2: { value: new THREE.Color(0x7a5cff) }
  };

  const vert = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
  `;
  const frag = `
    precision highp float;
    varying vec2 vUv;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec3 u_color1;
    uniform vec3 u_color2;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i);
      float b=hash(i+vec2(1.,0.));
      float c=hash(i+vec2(0.,1.));
      float d=hash(i+vec2(1.,1.));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }

    void main(){
      vec2 uv=vUv;
      float dist=distance(uv,u_mouse);
      uv.x+=0.03*sin(u_time+uv.y*10.0);
      uv.y+=0.03*cos(u_time+uv.x*10.0);
      float n=noise(uv*5.0+u_time*0.1);
      float wave=sin(uv.x*10.0+u_time)+cos(uv.y*10.0+u_time);
      vec3 col=mix(u_color1,u_color2,wave*0.5+0.5+n*0.2);
      col+=(1.0-dist)*0.15;
      gl_FragColor=vec4(col,1.0);
    }
  `;

  const bgMat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgMesh.renderOrder = -1;
  bgScene.add(bgMesh);

  // =========================
  // 2) Capa de efectos: fxCanvas independiente
  // =========================
  const fxCanvas = document.createElement("canvas");
  fxCanvas.id = "fxCanvas";
  Object.assign(fxCanvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "9000",
    opacity: "0",
    visibility: "hidden",
    transition: "opacity .3s ease"
  });
  document.body.appendChild(fxCanvas);

  const fxRenderer = new THREE.WebGLRenderer({ canvas: fxCanvas, antialias: true, alpha: true });
  fxRenderer.setPixelRatio(DPR);
  fxRenderer.setSize(window.innerWidth, window.innerHeight);

  const fxScene = new THREE.Scene();
  const fxCam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
  fxCam.position.z = 2.2;

  // Partículas rojas visibles
  const COUNT = 350;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const sizeArray = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const ix = i * 3;
    pos[ix + 0] = (Math.random() - 0.5) * 2.0;
    pos[ix + 1] = (Math.random() - 0.5) * 2.0;
    pos[ix + 2] = Math.random() * 1.2;
    sizeArray[i] = 10 + Math.random() * 20;
  }
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("size", new THREE.BufferAttribute(sizeArray, 1));

  const pointsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      u_time: { value: 0.0 },
      u_opacity: { value: 0.9 }
    },
    vertexShader: `
      attribute float size;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float u_opacity;
      void main() {
        float r = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.2, r) * u_opacity;
        gl_FragColor = vec4(1.0, 0.0, 0.0, alpha); // rojo brillante
      }
    `
  });

  const points = new THREE.Points(geom, pointsMat);
  fxScene.add(points);

  // =========================
  // 3) Overlay de transición
  // =========================
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "linear-gradient(90deg, var(--accent, #47d6ff), var(--accent-2, #7a5cff))",
    zIndex: "9999",
    pointerEvents: "none",
    transform: "scaleY(0)",
    transformOrigin: "top"
  });
  document.body.appendChild(overlay);

  // =========================
  // 4) Loops de animación
  // =========================
  function loopBg(t) {
    uniforms.u_time.value = t * 0.001;
    bgRenderer.render(bgScene, bgCam);
    requestAnimationFrame(loopBg);
  }
  requestAnimationFrame(loopBg);

  function loopFx(t) {
    points.rotation.y += 0.0008;
    points.rotation.x += 0.0004;
    fxRenderer.render(fxScene, fxCam);
    requestAnimationFrame(loopFx);
  }
  requestAnimationFrame(loopFx);

  // =========================
  // 5) Transición y helpers
  // =========================
  function showFX(show) {
    fxCanvas.style.visibility = show ? "visible" : "hidden";
    fxCanvas.style.opacity = show ? "1" : "0";
  }

  function playTransition(callback) {
    console.log("playTransition ejecutado");
    showFX(true);
    gsap.timeline()
      .to(overlay, { scaleY: 1, duration: 0.45, ease: "power4.in" })
      .add(() => { if (callback) callback(); })
      .to(overlay, {
        scaleY: 0, duration: 0.45, ease: "power4.out", onComplete: () => showFX(false)
      });
  }

  // Disparo automático forzado
  setTimeout(() => {
    playTransition();
  }, 1500);

  // =========================
  // 6) Animaciones de contenido
  // =========================
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".fade-in").forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 20, rotateX: -10 },
        { opacity: 1, y: 0,
