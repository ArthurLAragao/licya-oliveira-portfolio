/* Licya Oliveira — versão III, "Floresta". O mundo em 3D.

   A página é uma caminhada. Um canvas fixo mostra uma mata noturna gerada
   por código (nenhum modelo ou imagem externa) e a câmera percorre uma
   trilha conforme a rolagem:

     01 borda da mata → 02 trilha de terra → 03 margem do rio (cada projeto
     é uma lanterna flutuando na água) → travessia por pedras → 04 segunda
     trilha (cada etapa da trajetória é uma pedra-lanterna) → 05 clareira
     aberta com o lago sob a lua (contato).

   Gatilho → mudança → propósito
   · rolagem → a câmera anda pela trilha (suavizada, com passo) → entrar na mata
   · cursor → a cabeça vira um pouco; sobre a água, ondas no ponto do cursor
   · card de projeto em foco/hover → a lanterna dele cresce e brilha mais
   · filtro de projetos → lanternas fora do filtro se apagam e afundam
   · clique numa lanterna → abre o projeto
   · câmera passa por uma pedra → a pedra e a etapa da trajetória acendem

   Movimento reduzido: sem caminhada nem vento — a câmera salta para a parada
   da seção e o quadro só é redesenhado quando a rolagem muda de parada.
   Sem WebGL: fica o pôster em CSS e todo o conteúdo funciona igual. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motionOn = () => root.dataset.motion === 'on';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const coarse = matchMedia('(pointer:coarse)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------------- paradas da jornada (funciona com ou sem 3D) ---------------- */
const stops = ['inicio', 'pratica', 'trabalhos', 'sobre', 'contato'].map(id => document.getElementById(id));
const railLinks = $$('.rail a');
function updateRail(){
  const probe = scrollY + innerHeight * .5;
  let cur = 0;
  stops.forEach((s, i) => { if (s && s.offsetTop - innerHeight * .2 <= probe) cur = i; });
  railLinks.forEach((a, i) => i === cur ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current'));
}
addEventListener('scroll', updateRail, { passive:true });
updateRail();

function webgl(){
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}
const canvas = $('#world');
if (canvas && webgl()) {
  try { buildWorld(); }
  catch (err) { console.warn('[floresta] 3D indisponível:', err); fallback(); }
} else fallback();

function fallback(){
  root.classList.add('world-off');
  // sem a câmera, a trajetória acende conforme cada etapa aparece
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('lit')), { rootMargin:'0px 0px -25% 0px' });
  $$('.trail li').forEach(li => io.observe(li));
}

/* ======================================================================= */
function buildWorld(){
const LOW = coarse || innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;

/* ---------------- ruído e aleatoriedade estável ---------------- */
function rng(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeNoise(seed){
  const R = rng(seed), perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const p = new Uint8Array(512); for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = (h, x, y) => { const k = h & 7, u = k < 4 ? x : y, v = k < 4 ? y : x; return ((k & 1) ? -u : u) + ((k & 2) ? -2 * v : 2 * v); };
  const f = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), X = xi & 255, Y = yi & 255; x -= xi; y -= yi;
    const u = f(x), v = f(y), a = p[X] + Y, b = p[X + 1] + Y;
    return lerp(lerp(g(p[a], x, y), g(p[b], x - 1, y), u), lerp(g(p[a + 1], x, y - 1), g(p[b + 1], x - 1, y - 1), u), v) * .5;
  };
}
const N1 = makeNoise(7), N2 = makeNoise(19);
const fbm = (n, x, y, o = 4) => { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); f *= 2.03; a *= .5; } return s; };

/* ---------------- o mapa ---------------- */
const riverZ = x => 2.2 * Math.sin(x * .07) + 1.4 * Math.sin(x * .023 + 1);
const riverSlope = x => 2.2 * .07 * Math.cos(x * .07) + 1.4 * .023 * Math.cos(x * .023 + 1);
const RIVER_HALF = 3.4, WATER_Y = -.55;
const CLEARING = { x:78, z:-73, r:23 }, LAKE = { x:86, z:-97, rx:17, rz:11 };
const V = (x, z) => new THREE.Vector3(x, 0, z);
const trailCtrl = [
  V(.4, 104), V(0, 95), V(0, 86), V(1.2, 76), V(-.6, 66), V(-2.6, 56), V(-3.6, 46), V(-2, 36), V(.6, 27), V(1.6, 19),
  V(5, riverZ(5) + 7), V(12, riverZ(12) + 6.6), V(20, riverZ(20) + 6.3), V(28, riverZ(28) + 6.8), V(36, riverZ(36) + 6.4),
  V(44, riverZ(44) + 6.8), V(52, riverZ(52) + 6.3), V(58, riverZ(58) + 5.6), V(61.4, riverZ(61.4) + 3.7),
  V(62.2, riverZ(62.2) + 1.3), V(62.8, riverZ(62.8) - 1.3), V(63.3, riverZ(63.3) - 3.9),
  V(64, -12), V(66.5, -21), V(64.8, -30), V(67.5, -39), V(71.5, -48), V(74.3, -56.5), V(75.8, -63)
];
const trailCurve = new THREE.CatmullRomCurve3(trailCtrl, false, 'centripetal');
const TRAIL_N = 900;
const trailPts = trailCurve.getSpacedPoints(TRAIL_N);
const trailLen = trailCurve.getLength();
const sAt = i => i / TRAIL_N * trailLen;
function nearestS(x, z){ let bi = 0, bd = Infinity; trailPts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } }); return sAt(bi); }
function trailAt(s){ const t = clamp(s / trailLen) * TRAIL_N, i = Math.min(TRAIL_N - 1, Math.floor(t)), f = t - i; return trailPts[i].clone().lerp(trailPts[i + 1], f); }

// grade de segmentos para medir distância até a trilha rapidamente
const CELL = 8, segMap = new Map();
for (let i = 0; i < TRAIL_N; i++) {
  const a = trailPts[i], b = trailPts[i + 1];
  for (let cx = Math.floor((Math.min(a.x, b.x) - 30) / CELL); cx <= Math.floor((Math.max(a.x, b.x) + 30) / CELL); cx++)
    for (let cz = Math.floor((Math.min(a.z, b.z) - 30) / CELL); cz <= Math.floor((Math.max(a.z, b.z) + 30) / CELL); cz++) {
      const k = cx * 10007 + cz; let l = segMap.get(k); if (!l) segMap.set(k, l = []); l.push(i);
    }
}
function trailDist(x, z){
  const l = segMap.get(Math.floor(x / CELL) * 10007 + Math.floor(z / CELL)); if (!l) return 40;
  let best = 1e9;
  for (const i of l) {
    const a = trailPts[i], b = trailPts[i + 1], dx = b.x - a.x, dz = b.z - a.z;
    const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1));
    const d = (x - a.x - dx * t) ** 2 + (z - a.z - dz * t) ** 2; if (d < best) best = d;
  }
  return Math.min(40, Math.sqrt(best));
}
const riverDist = (x, z) => Math.abs(z - riverZ(x)) / Math.sqrt(1 + riverSlope(x) ** 2);
const lakeDist = (x, z) => (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) - 1) * Math.min(LAKE.rx, LAKE.rz);
const clearDist = (x, z) => Math.hypot(x - CLEARING.x, z - CLEARING.z) - CLEARING.r;
// borda da mata: um campo aberto antes da primeira fileira de pinheiros
const EDGE = x => 71 + 5 * N1(x * .05, 3.1) + Math.max(0, Math.abs(x) - 26) * .6;
const meadowDist = (x, z) => z - EDGE(x);   // > 0: no campo
// vista final: um corredor sem árvores da clareira até o lago e a lua
const VIEW = { x:75.8, z:-63, dx:.12, dz:-1 };
function inVista(x, z){
  const vx = x - VIEW.x, vz = z - VIEW.z, d = Math.hypot(vx, vz); if (d < 4 || d > 95) return false;
  const l = Math.hypot(VIEW.dx, VIEW.dz), cos = (vx * VIEW.dx + vz * VIEW.dz) / (d * l);
  return cos > Math.cos((34 - d * .12) * Math.PI / 180);
}

function height(x, z){
  const dT = trailDist(x, z), dR = riverDist(x, z), dL = lakeDist(x, z), dC = clearDist(x, z);
  const open = Math.min(dT, dR - 1, Math.max(dC, 0) + 2, Math.max(dL, 0) + 4, Math.max(-meadowDist(x, z), 0) + 3);
  let h = fbm(N1, x * .013, z * .013) * 7 + fbm(N2, x * .06, z * .06, 3) * 1.1;
  h *= .18 + .82 * smooth(3, 30, open);
  h += smooth(30, 95, open) * (4 + fbm(N2, x * .008, z * .008) * 9);
  h -= 1.7 * (1 - smooth(RIVER_HALF - 1.2, RIVER_HALF + 2.6, dR));
  h -= 1.9 * (1 - smooth(-3, 3, dL));
  return h;
}

/* ---------------- renderizador, cena, câmera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, powerPreference:'high-performance', stencil:false });
const MAX_PR = LOW ? 1 : Math.min(devicePixelRatio || 1, 1.5);
let pr = MAX_PR;
renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const FOG = new THREE.Color('#215866');
const FOG_DENSITY = .019;
scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 900);
const fovFor = () => innerWidth / innerHeight < .8 ? 64 : innerWidth / innerHeight < 1.2 ? 56 : 46;
camera.fov = fovFor(); camera.updateProjectionMatrix();

const U = { uTime:{ value:0 } };          // tempo compartilhado (vento, água, vaga-lumes)
const MOON_DIR = new THREE.Vector3(.3, .46, -.9).normalize();

/* ---------------- luz: lua, céu e lanternas ---------------- */
const hemi = new THREE.HemisphereLight('#6aa2b2', '#0a171b', .8);
scene.add(hemi);
const moon = new THREE.DirectionalLight('#cdeeff', 2.6);
moon.castShadow = !LOW;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left:-46, right:46, top:46, bottom:-46, near:1, far:240 });
moon.shadow.bias = -.0004; moon.shadow.normalBias = .05;
scene.add(moon, moon.target);
const warm = [new THREE.PointLight('#ffe7a8', 0, 14, 1.6), new THREE.PointLight('#ffe7a8', 0, 14, 1.6)];
warm.forEach(l => scene.add(l));

/* ---------------- texturas pintadas por código ---------------- */
function canvasTex(w, h, paint, repeat){
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
const R0 = rng(42);
// musgo: manchas finas que dão textura ao chão de perto
const mossTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c9d6cf'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 150 + R0() * 100 | 0; g.fillStyle = `rgba(${v - 40},${v},${v - 20},${.25 + R0() * .35})`; const s = 1 + R0() * 3; g.fillRect(R0() * w, R0() * h, s, s); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(40,70,60,${.15 + R0() * .2})`; g.beginPath(); g.arc(R0() * w, R0() * h, 4 + R0() * 12, 0, 7); g.fill(); }
}, 90);
// terra da trilha: base marrom, cascalho, raízes e bordas que somem no musgo
const dirtTex = canvasTex(256, 1024, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, 'rgba(120,96,70,0)'); grd.addColorStop(.14, 'rgba(120,96,70,.85)'); grd.addColorStop(.3, 'rgba(150,122,92,1)');
  grd.addColorStop(.7, 'rgba(150,122,92,1)'); grd.addColorStop(.86, 'rgba(120,96,70,.85)'); grd.addColorStop(1, 'rgba(120,96,70,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 4200; i++) { const v = R0(); g.fillStyle = v < .5 ? `rgba(70,52,38,${.2 + R0() * .35})` : `rgba(205,180,145,${.18 + R0() * .3})`; const s = 1 + R0() * 3.5; g.beginPath(); g.ellipse(R0() * w, R0() * h, s, s * .7, R0() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(60,42,30,${.35 + R0() * .3})`; g.lineWidth = 2 + R0() * 4; g.beginPath(); const y = R0() * h; g.moveTo(-10, y); g.bezierCurveTo(w * .3, y + (R0() - .5) * 60, w * .7, y + (R0() - .5) * 60, w + 10, y + (R0() - .5) * 40); g.stroke(); }
  for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(60,90,70,${.3 + R0() * .3})`; g.beginPath(); g.arc(R0() < .5 ? R0() * w * .2 : w - R0() * w * .2, R0() * h, 6 + R0() * 14, 0, 7); g.fill(); }
});
dirtTex.wrapT = THREE.RepeatWrapping;
const glowTex = canvasTex(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.55)'); r.addColorStop(.5, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
const moonTex = canvasTex(256, 256, (g, w) => {
  const r = g.createRadialGradient(w * .42, w * .4, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, '#ffffff'); r.addColorStop(.7, '#e3f4ef'); r.addColorStop(.96, '#bfe0dc'); r.addColorStop(1, 'rgba(190,224,220,0)');
  g.fillStyle = r; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, 7); g.fill();
  [[.36, .34, .1], [.6, .58, .07], [.48, .7, .05], [.66, .36, .045], [.3, .6, .04]].forEach(([x, y, s]) => {
    g.fillStyle = 'rgba(160,196,192,.45)'; g.beginPath(); g.arc(w * x, w * y, w * s, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(w * x - w * s * .25, w * y - w * s * .25, w * s * .55, 0, 7); g.fill();
  });
});

/* ---------------- céu, lua e estrelas ---------------- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ uTime:U.uTime, uMoon:{ value:MOON_DIR }, uHorizon:{ value:FOG }, uMid:{ value:new THREE.Color('#0f3446') }, uZenith:{ value:new THREE.Color('#030a13') } },
  vertexShader:`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
  fragmentShader:`
    uniform float uTime; uniform vec3 uMoon, uHorizon, uMid, uZenith; varying vec3 vDir;
    float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
    void main(){
      vec3 d = normalize(vDir); float y = d.y;
      vec3 c = mix(uHorizon, uMid, smoothstep(-.02, .22, y));
      c = mix(c, uZenith, smoothstep(.18, .75, y));
      float m = max(dot(d, uMoon), 0.);
      c += vec3(.45,.75,.74) * pow(m, 6.) * .32 + vec3(.8,.95,.94) * pow(m, 60.) * .5;
      vec3 sp = d * 260.; vec3 cell = floor(sp); float h = h3(cell);
      float star = step(.9965, h) * smoothstep(.06, .3, y) * (1. - smoothstep(0., .16, length(fract(sp) - .5)));
      c += star * (1.1 + .6 * sin(uTime * 1.7 + h * 80.));
      c = mix(c, uHorizon, 1. - smoothstep(-.12, .02, y));
      gl_FragColor = vec4(c, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
}));
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);
const moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map:moonTex, transparent:true, fog:false, depthWrite:false, toneMapped:false, color:new THREE.Color(1.9, 2, 1.95) }));
moonDisc.renderOrder = -9;
scene.add(moonDisc);

/* ---------------- terreno ---------------- */
const TER = 380, SEG = LOW ? 170 : 250, TCX = 40, TCZ = -15;
const terGeo = new THREE.PlaneGeometry(TER, TER, SEG, SEG); terGeo.rotateX(-Math.PI / 2);
{
  const pos = terGeo.attributes.position, col = new Float32Array(pos.count * 3);
  const moss = new THREE.Color('#2c5a4e'), mossLit = new THREE.Color('#4f8a6e'), deep = new THREE.Color('#163a38');
  const bank = new THREE.Color('#3a4a3c'), meadow = new THREE.Color('#5c9474'), dirt = new THREE.Color('#5e4a38'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + TCX, z = pos.getZ(i) + TCZ; pos.setX(i, x); pos.setZ(i, z);
    const h = height(x, z); pos.setY(i, h);
    const dT = trailDist(x, z), dR = riverDist(x, z), dL = lakeDist(x, z), dC = clearDist(x, z);
    c.copy(deep).lerp(moss, .5 + fbm(N2, x * .09, z * .09, 2) * 1.4).lerp(mossLit, clamp(fbm(N1, x * .04, z * .04, 2) + .2) * .6);
    c.lerp(meadow, Math.max(1 - smooth(-4, 6, dC), smooth(-3, 6, meadowDist(x, z))) * .55);
    c.lerp(dirt, (1 - smooth(1.2, 3.6, dT)) * .55);
    c.lerp(bank, (1 - smooth(RIVER_HALF, RIVER_HALF + 2.2, Math.min(dR, dL + RIVER_HALF))) * .8);
    c.multiplyScalar(.9 + fbm(N2, x * .3, z * .3, 2) * .35);
    col.set([c.r, c.g, c.b], i * 3);
  }
  terGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  terGeo.computeVertexNormals();
}
const terrain = new THREE.Mesh(terGeo, new THREE.MeshStandardMaterial({ vertexColors:true, map:mossTex, roughness:.96, metalness:0 }));
terrain.receiveShadow = true;
scene.add(terrain);

/* ---------------- a trilha de terra (fita que acompanha o relevo) ---------------- */
function ribbon(points, half, lift, mat, vScale){
  const verts = [], uvs = [], idx = [];
  let s = 0;
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
    if (i) s += p.distanceTo(points[i - 1]);
    for (const side of [-1, 1]) {
      const w = half * (1 + .12 * N1(p.x * .2, p.z * .2)), x = p.x + nx * w * side, z = p.z + nz * w * side;
      verts.push(x, height(x, z) + lift, z); uvs.push(side < 0 ? 0 : 1, s / vScale);
    }
    if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
const dirtMat = new THREE.MeshStandardMaterial({ map:dirtTex, transparent:true, roughness:.92, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 });
{
  // a fita é interrompida onde a trilha cruza a água (ali há pedras)
  let run = [];
  const flush = () => { if (run.length > 3) scene.add(ribbon(run, 1.25, .05, dirtMat, 9)); run = []; };
  trailPts.forEach(p => { if (riverDist(p.x, p.z) < RIVER_HALF + .6) flush(); else run.push(p); });
  flush();
}

/* ---------------- água: rio e lago ---------------- */
const lanternN = 8;
const waterUniforms = {
  uTime:U.uTime, uMoon:{ value:MOON_DIR }, uFog:{ value:FOG }, uFogD:{ value:FOG_DENSITY },
  uLP:{ value:Array.from({ length:lanternN }, () => new THREE.Vector3(0, -99, 0)) },
  uLC:{ value:Array.from({ length:lanternN }, () => new THREE.Vector3()) },
  uRip:{ value:new THREE.Vector4(0, 0, -99, 0) }, uFlow:{ value:1 }
};
const waterVS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const waterFS = `
  uniform float uTime, uFogD, uFlow; uniform vec3 uMoon, uFog; uniform vec3 uLP[${lanternN}], uLC[${lanternN}]; uniform vec4 uRip;
  varying vec3 vW;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * noise(p); p *= 2.03; a *= .5; } return s; }
  void main(){
    vec2 p = vW.xz, fl = vec2(uTime * .45 * uFlow, uTime * .05);
    float n1 = fbm(p * .42 - fl), n2 = fbm(p * 1.4 + vec2(-uTime * .55 * uFlow, uTime * .18));
    float e = .2, hx = fbm((p + vec2(e,0.)) * .42 - fl) - n1, hz = fbm((p + vec2(0.,e)) * .42 - fl) - n1;
    vec3 n = normalize(vec3(-hx * 4., 1., -hz * 4.));
    float rt = uTime - uRip.z, rd = distance(p, uRip.xy);
    float rip = sin(rd * 5.5 - rt * 7.) * exp(-rd * .4) * exp(-rt * 1.1) * step(0., rt) * step(rd, rt * 2.4 + .5);
    n = normalize(n + vec3((p.x - uRip.x), 0., (p.y - uRip.y)) / max(rd, .01) * rip * .35);
    vec3 V = normalize(cameraPosition - vW);
    float fres = pow(1. - max(dot(n, V), 0.), 4.);
    vec3 deep = vec3(.006,.045,.06), mid = vec3(.02,.17,.19), glowC = vec3(.33,.98,.9);
    vec3 col = mix(deep, mid, n1);
    vec3 R = reflect(-V, n);
    col += mix(uFog * 1.15, vec3(.03,.1,.16), clamp(R.y * 2., 0., 1.)) * (fres * .95 + .05);
    float m = max(dot(R, uMoon), 0.);
    col += vec3(.9,1.,.97) * (pow(m, 500.) * 9. + pow(m, 50.) * .35);
    vec2 q = p * 2.1 + vec2(-uTime * .35 * uFlow, 0.); vec2 cell = floor(q); float h = hash(cell);
    float spark = (1. - smoothstep(0., .2, length(fract(q) - .5 + (vec2(hash(cell+3.), hash(cell+7.)) - .5) * .5))) * step(.94, h) * (.5 + .5 * sin(uTime * 2.6 + h * 60.));
    col += glowC * spark * 2.6;
    col += glowC * pow(n2, 3.2) * .42;
    for (int i = 0; i < ${lanternN}; i++){
      vec2 d = p - uLP[i].xz; float r = exp(-(d.x * d.x * 1.6 + d.y * d.y * .28));
      col += uLC[i] * r * (.55 + .5 * n2);
    }
    col += glowC * max(rip, 0.) * .5;
    float dist = length(cameraPosition - vW); float fog = 1. - exp(-uFogD * uFogD * dist * dist);
    gl_FragColor = vec4(mix(col, uFog, fog), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const riverMat = new THREE.ShaderMaterial({ uniforms:waterUniforms, vertexShader:waterVS, fragmentShader:waterFS });
const lakeMat = new THREE.ShaderMaterial({ uniforms:{ ...waterUniforms, uFlow:{ value:.12 } }, vertexShader:waterVS, fragmentShader:waterFS });
{
  const pts = []; for (let x = -100; x <= 180; x += .8) pts.push(new THREE.Vector3(x, 0, riverZ(x)));
  const verts = [], idx = [];
  pts.forEach((p, i) => {
    const sl = riverSlope(p.x), l = Math.hypot(1, sl), nx = -sl / l, nz = 1 / l, w = RIVER_HALF + 1.6;
    verts.push(p.x - nx * w, WATER_Y, p.z - nz * w, p.x + nx * w, WATER_Y, p.z + nz * w);
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx);
  scene.add(new THREE.Mesh(g, riverMat));
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 72), lakeMat);
  lake.rotation.x = -Math.PI / 2; lake.scale.set(LAKE.rx + 3, LAKE.rz + 3, 1); lake.position.set(LAKE.x, WATER_Y, LAKE.z);
  scene.add(lake);
}

/* ---------------- geometria das plantas ---------------- */
function paint(geo, fn){
  const p = geo.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(col, p.getX(i), p.getY(i), p.getZ(i), i); col.toArray(c, i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
function softNormals(geo, center, k){
  // mistura a normal real com uma normal "esférica" — volume macio, sem cara de papel recortado
  const p = geo.attributes.position, n = geo.attributes.normal, v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    s.set(p.getX(i) - center.x, (p.getY(i) - center.y) * .7, p.getZ(i) - center.z).normalize();
    v.set(n.getX(i), n.getY(i), n.getZ(i)).lerp(s, k).normalize(); n.setXYZ(i, v.x, v.y, v.z);
  }
}
const strip = g => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
// esfera com vértices soldados: o relevo deforma sem rachar e a luz desliza macia
const blob = (r, detail) => { const g = new THREE.IcosahedronGeometry(r, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); return mergeVertices(g); };
function pineGeo(tiers, radial, R){
  const parts = [];
  const trunk = strip(new THREE.CylinderGeometry(.018, .038, .4, 6, 1, true)); trunk.translate(0, .2, 0);
  trunk.computeVertexNormals();
  paint(trunk, c => c.set('#3a2a1f'));
  parts.push(trunk);
  const dark = new THREE.Color('#0b2422'), mid = new THREE.Color('#1b4640'), tip = new THREE.Color('#4f8a76'), c0 = new THREE.Color();
  // núcleo: um cone fino que fecha o miolo da árvore e forma a ponta
  const core = strip(new THREE.ConeGeometry(.07, .82, 7, 1, true)); core.translate(0, .59, 0); core.computeVertexNormals();
  paint(core, (c, x, y) => c.copy(dark).lerp(mid, clamp((y - .2) / .8) * .7)); parts.push(core);
  // galhos: cada andar tem uma coroa de ramos que saem do tronco e pendem na ponta
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1), y0 = .2 + f * .72, L = (.27 * (1 - f * .82) + .03) * (.9 + R() * .2);
    const n = Math.max(5, Math.round(radial * (1 - f * .45))), off = R() * 6.3;
    for (let j = 0; j < n; j++) {
      const a = off + j / n * Math.PI * 2 + (R() - .5) * .5, len = L * (.8 + R() * .35), droop = .32 + f * .15 + R() * .2;
      const b = strip(new THREE.ConeGeometry(len * .36, len, 5, 2, false));
      b.rotateZ(-Math.PI / 2); b.translate(len / 2, 0, 0);
      const p = b.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), t = x / len;
        // ramo achatado, mais largo no meio, a ponta cai como um galho com peso
        p.setXYZ(i, x, p.getY(i) * .42 - t * t * len * .38, p.getZ(i) * (1.15 - t * .4));
      }
      b.rotateZ(-droop * .35); b.rotateY(a); b.translate(0, y0 + len * .1, 0);
      b.computeVertexNormals();
      softNormals(b, new THREE.Vector3(0, y0 - .05, 0), .6);
      paint(b, (c, x, y, z) => {
        const r = clamp(Math.hypot(x, z) / (L * 1.1));
        c.copy(dark).lerp(mid, r * .9).lerp(tip, Math.pow(r, 2.4) * (.5 + f * .3));
      });
      parts.push(b);
    }
  }
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
// versão leve para longe da trilha: andares em cone, poucos polígonos
function farPineGeo(R){
  const parts = [], dark = new THREE.Color('#0d2a27'), tip = new THREE.Color('#3b7465');
  const trunk = strip(new THREE.CylinderGeometry(.018, .038, .4, 5, 1, true)); trunk.translate(0, .2, 0); trunk.computeVertexNormals();
  paint(trunk, c => c.set('#2e2219')); parts.push(trunk);
  for (let k = 0; k < 5; k++) {
    const f = k / 4, r = .25 * (1 - f * .8) + .03, h = .3 - f * .07, base = .22 + f * .62;
    const cone = strip(new THREE.ConeGeometry(r, h, 8, 1, true)), p = cone.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), rim = Math.hypot(x, z) / r, a = Math.atan2(z, x), sp = 1 + .2 * Math.max(0, Math.cos(a * 4 + k));
      p.setXYZ(i, x * sp, p.getY(i) + base + h / 2 - rim * rim * h * .3, z * sp); }
    cone.computeVertexNormals(); softNormals(cone, new THREE.Vector3(0, base, 0), .6);
    paint(cone, (c, x, y, z) => c.copy(dark).lerp(tip, Math.pow(clamp(Math.hypot(x, z) / r), 2) * .7));
    parts.push(cone);
  }
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
function leafyGeo(R){
  const parts = [];
  const trunk = strip(new THREE.CylinderGeometry(.03, .06, .5, 6, 1, true)); trunk.translate(0, .25, 0); trunk.computeVertexNormals();
  paint(trunk, c => c.set('#3d2c22')); parts.push(trunk);
  const blobs = [[0, .62, 0, .26], [.15, .52, .06, .19], [-.14, .54, -.05, .2], [.04, .78, -.04, .19], [-.06, .48, .14, .17], [.08, .5, -.15, .16]];
  blobs.forEach(([bx, by, bz, br]) => {
    let g = blob(br, 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + .2 * N1(x * 9 + bx * 20, z * 9 + y * 7) + .06 * N2(x * 30, z * 30 + y * 20);
      p.setXYZ(i, x * d + bx, y * d * .85 + by, z * d + bz);
    }
    g.computeVertexNormals(); g = g.toNonIndexed(); softNormals(g, new THREE.Vector3(bx, by, bz), .45);
    paint(g, (c, x, y) => c.set('#1c4a3f').lerp(new THREE.Color('#6aa684'), clamp((y - by + br) / (br * 2)) * .75));
    parts.push(g);
  });
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
function shrubGeo(){
  const parts = [];
  [[0, .2, 0, .32], [.22, .14, .1, .22], [-.2, .15, -.08, .24]].forEach(([bx, by, bz, br]) => {
    let g = blob(br, 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + .22 * N2(x * 11 + bx * 9, z * 11 + y * 5) + .07 * N1(x * 34, z * 34 + y * 20); p.setXYZ(i, x * d + bx, Math.max(0, y * d * .75 + by), z * d + bz); }
    g.computeVertexNormals(); g = g.toNonIndexed(); softNormals(g, new THREE.Vector3(bx, by, bz), .4);
    paint(g, (c, x, y) => c.set('#143c34').lerp(new THREE.Color('#4f8a6a'), clamp(y / .5) * .8)); parts.push(g);
  });
  return mergeGeometries(parts);
}
function grassGeo(R){
  const verts = [], cols = [], base = new THREE.Color('#1f4a3c'), tip = new THREE.Color('#8fc4a0'), c = new THREE.Color();
  for (let b = 0; b < 9; b++) {
    const a = R() * Math.PI * 2, ox = Math.cos(a) * .16 * R(), oz = Math.sin(a) * .16 * R(), h = .22 + R() * .26, w = .016 + R() * .01;
    const lean = (R() - .5) * .25, dir = R() * Math.PI, dx = Math.cos(dir), dz = Math.sin(dir);
    const seg = 3, ring = [];
    for (let s = 0; s <= seg; s++) { const t = s / seg, ww = w * (1 - t * .9), bend = lean * t * t;
      ring.push([ox - dx * ww + bend, h * t, oz - dz * ww + bend * .5, t], [ox + dx * ww + bend, h * t, oz + dz * ww + bend * .5, t]); }
    for (let s = 0; s < seg; s++) {
      const [a0, a1, b0, b1] = [ring[s * 2], ring[s * 2 + 1], ring[s * 2 + 2], ring[s * 2 + 3]];
      for (const v of [a0, a1, b0, a1, b1, b0]) { verts.push(v[0], v[1], v[2]); c.copy(base).lerp(tip, v[3]); cols.push(c.r, c.g, c.b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * .3, 1, n.getZ(i) * .3);   // grama iluminada por cima
  return g;
}
function rockGeo(R, flat){
  const g = strip(new THREE.IcosahedronGeometry(1, 2)), p = g.attributes.position, s = R() * 10;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + .28 * N1(x * 1.6 + s, z * 1.6 + y) + .1 * N2(x * 4, y * 4 + s);
    p.setXYZ(i, x * d, Math.max(-.2, y * d * (flat ? .32 : .6)), z * d); }
  g.computeVertexNormals(); softNormals(g, new THREE.Vector3(0, 0, 0), .35);
  // pedra úmida: base escura, topo com musgo
  paint(g, (c, x, y) => c.set('#26302f').lerp(new THREE.Color('#5d6f6a'), clamp(y * 1.4 + .25) * .5).lerp(new THREE.Color('#2f5a43'), smooth(.05, .3, y) * .7));
  return g;
}

/* ---------------- vento (injetado nos materiais padrão) ---------------- */
function windy(mat, amount, pivot){
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 ip = vec3(0.);
      #endif
      float bh = max(position.y - ${pivot.toFixed(2)}, 0.); bh *= bh;
      float w = sin(uTime * .9 + ip.x * .21 + ip.z * .17) * .6 + sin(uTime * 2.3 + ip.x * .6 + ip.z * .4) * .3;
      transformed.x += w * bh * ${amount.toFixed(3)}; transformed.z += w * .5 * bh * ${amount.toFixed(3)};`);
  };
  return mat;
}
const foliage = () => windy(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.88, metalness:0 }), .07, .3);
const grassMat = windy(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:1, side:THREE.DoubleSide }), .55, 0);

/* ---------------- povoando a mata ---------------- */
const R1 = rng(2026);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function instanced(geo, mat, list, { cast = false, receive = true } = {}){
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const tint = new THREE.Color();
  list.forEach((t, i) => {
    q.setFromAxisAngle(up, t.rot); sc.set(t.s * (t.sx || 1), t.s * (t.sy || 1), t.s * (t.sz || t.sx || 1)); ps.set(t.x, t.y, t.z);
    m4.compose(ps, q, sc); mesh.setMatrixAt(i, m4);
    tint.setScalar(t.tint || 1); mesh.setColorAt(i, tint);
  });
  mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.frustumCulled = false;
  scene.add(mesh); return mesh;
}
const nearPines = [], farPines = [], leafy = [], shrubs = [], rocks = [], grass = [], shrooms = [];
{
  const step = LOW ? 4.4 : 3.3, reach = LOW ? 55 : 78;
  for (let x = -95; x < 175; x += step) for (let z = -185; z < 130; z += step) {
    const px = x + (R1() - .5) * step * .9, pz = z + (R1() - .5) * step * .9;
    const dT = trailDist(px, pz), dR = riverDist(px, pz), dL = lakeDist(px, pz), dC = clearDist(px, pz);
    const route = Math.min(dT, dR, Math.max(dC, 0), Math.max(dL, 0));
    if (route > reach) continue;
    if (dR < RIVER_HALF + 2.2 || dL < 4 || dC < 0 || inVista(px, pz) || meadowDist(px, pz) > 0) continue;
    const clump = fbm(N2, px * .05, pz * .05, 2);
    if (clump < -.12 && R1() < .6) continue;
    const y = height(px, pz) - .15, broad = dR < 16 ? .45 : dC < 12 ? .3 : .1;
    const t = { x:px, y, z:pz, rot:R1() * 6.3, tint:.75 + R1() * .5 };
    const isLeafy = R1() < broad;
    if (isLeafy) { t.s = 5 + R1() * 4; t.sx = .9 + R1() * .4; }
    else { t.s = 8 + R1() * 8 + smooth(10, 50, route) * 5; t.sx = .85 + R1() * .35; }
    // a copa nunca invade a trilha: o afastamento cresce com o tamanho da árvore
    const crown = t.s * t.sx * (isLeafy ? .3 : .27);
    if (dT < crown + 1.3 + Math.abs(N1(px * .3, pz * .3)) * 2.5) continue;
    if (dR < RIVER_HALF + crown * .6) continue;
    if (isLeafy) leafy.push(t);
    else (dT < 32 || dC < 14 || dR < 24 ? nearPines : farPines).push(t);
  }
  // a clareira: um anel organizado de pinheiros altos ao redor do gramado
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2, r = CLEARING.r + 3 + (i % 2) * 2.4 + R1() * 1.2;
    const x = CLEARING.x + Math.cos(a) * r, z = CLEARING.z + Math.sin(a) * r;
    const s = 12 + R1() * 5;
    if (trailDist(x, z) < s * .26 + 1.5 || lakeDist(x, z) < 3 || inVista(x, z)) continue;
    nearPines.push({ x, y:height(x, z) - .15, z, rot:R1() * 6.3, s, sx:.9, tint:.85 + R1() * .3 });
  }
  // arbustos, pedras, grama e cogumelos que brilham perto da trilha
  const nG = LOW ? 5000 : 15000;
  for (let i = 0, tries = 0; grass.length < nG && tries < nG * 6; tries++) {
    const s = R1() * trailLen, p = trailAt(s), off = (R1() < .5 ? -1 : 1) * (1.4 + Math.pow(R1(), 1.6) * 22);
    const n = trailAt(Math.min(trailLen, s + 1)).sub(p).normalize();
    let x = p.x - n.z * off + (R1() - .5) * 3, z = p.z + n.x * off + (R1() - .5) * 3;
    const pick = R1();
    if (pick < .2) { const a = R1() * 6.3, r = Math.sqrt(R1()) * (CLEARING.r + 2); x = CLEARING.x + Math.cos(a) * r; z = CLEARING.z + Math.sin(a) * r; }
    else if (pick < .36) { x = (R1() - .5) * 64; z = 70 + R1() * 40; }
    if (trailDist(x, z) < 1.25 || riverDist(x, z) < RIVER_HALF + .6 || lakeDist(x, z) < .8) continue;
    grass.push({ x, y:height(x, z) - .02, z, rot:R1() * 6.3, s:.8 + R1() * .9, sy:.7 + R1() * .8, tint:.7 + R1() * .5 });
  }
  for (let i = 0; i < (LOW ? 260 : 700); i++) {
    const s = R1() * trailLen, p = trailAt(s), off = (R1() < .5 ? -1 : 1) * (2.2 + R1() * 9);
    const n = trailAt(Math.min(trailLen, s + 1)).sub(p).normalize(), x = p.x - n.z * off, z = p.z + n.x * off;
    if (trailDist(x, z) < 2.6 || riverDist(x, z) < RIVER_HALF + .4 || lakeDist(x, z) < 1) continue;
    if (meadowDist(x, z) > -2) continue;
    shrubs.push({ x, y:height(x, z) - .05, z, rot:R1() * 6.3, s:.55 + R1() * .9, tint:.75 + R1() * .5 });
  }
  for (let i = 0; i < (LOW ? 120 : 260); i++) {
    let x, z;
    if (R1() < .55) { x = -20 + R1() * 200; z = riverZ(x) + (R1() < .5 ? -1 : 1) * (RIVER_HALF + .4 + R1() * 1.6); }
    else { const p = trailAt(R1() * trailLen); x = p.x + (R1() - .5) * 9; z = p.z + (R1() - .5) * 9; if (trailDist(x, z) < 1.4) continue; }
    rocks.push({ x, y:height(x, z) - .12, z, rot:R1() * 6.3, s:.18 + Math.pow(R1(), 2.2) * .8, tint:.8 + R1() * .4 });
  }
  for (let i = 0; i < (LOW ? 70 : 170); i++) {
    const p = trailAt(R1() * trailLen), a = R1() * 6.3, r = 1.8 + R1() * 5, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    if (trailDist(x, z) < 1.5 || riverDist(x, z) < RIVER_HALF + .3) continue;
    for (let k = 0; k < 2 + (R1() * 3 | 0); k++) shrooms.push({ x:x + (R1() - .5) * .5, y:height(x, z), z:z + (R1() - .5) * .5, rot:R1() * 6.3, s:.06 + R1() * .08, tint:1 });
  }
}
const pineMat = foliage(), leafyMat = foliage(), shrubMat = windy(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.9 }), .25, .1);
const RG = rng(5);
instanced(LOW ? farPineGeo(RG) : pineGeo(11, 9, RG), pineMat, nearPines, { cast:!LOW });
instanced(farPineGeo(RG), pineMat, farPines);
instanced(leafyGeo(RG), leafyMat, leafy, { cast:!LOW });
instanced(shrubGeo(), shrubMat, shrubs);
instanced(grassGeo(RG), grassMat, grass, { receive:!LOW });
instanced(rockGeo(RG, false), new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.85 }), rocks, { cast:!LOW });
{
  // cogumelos bioluminescentes: haste clara e chapéu que brilha em ciano
  const stem = new THREE.CylinderGeometry(.18, .26, 1, 6); stem.translate(0, .5, 0);
  const cap = new THREE.SphereGeometry(.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); cap.translate(0, 1, 0);
  instanced(stem, new THREE.MeshStandardMaterial({ color:'#cfe6dc', roughness:.6 }), shrooms);
  instanced(cap, new THREE.MeshStandardMaterial({ color:'#3ee0d0', emissive:'#36e6d6', emissiveIntensity:2.2, roughness:.4 }), shrooms);
}

/* ---------------- travessia: pedras no rio ---------------- */
{
  const flat = rockGeo(rng(9), true), mat = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.8 }), list = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5, x = lerp(61.6, 63.4, t) + (i % 2 ? .35 : -.35), z = lerp(riverZ(61.6) + 3.4, riverZ(63.4) - 3.4, t);
    list.push({ x, y:WATER_Y + .02, z, rot:i * 1.3, s:.75 + (i % 3) * .08, sx:1.1, tint:.95 });
  }
  instanced(flat, mat, list, { cast:!LOW });
}

/* ---------------- lanternas dos projetos ---------------- */
const works = (window.LicyaPortfolio && window.LicyaPortfolio.works) || [];
const sprite = (color, size, opacity) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity }));
  s.scale.setScalar(size); return s;
};
const lanternGeo = (() => {
  const prof = []; for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(.05 + Math.sin(t * Math.PI) * .2, t * .46)); }
  return new THREE.LatheGeometry(prof, 16);
})();
const padGeo = (() => { const g = new THREE.CircleGeometry(.62, 22, .3, Math.PI * 2 - .6); g.rotateX(-Math.PI / 2); return g; })();
const lanterns = [];
for (let i = 0; i < lanternN; i++) {
  const w = works[i] || { id:'', tint:'#9fd0d4' };
  const x = 8 + i * 6.9, z = riverZ(x) + (i % 2 ? .9 : -.7);
  const tint = new THREE.Color(w.tint), light = tint.clone().lerp(new THREE.Color('#fff2c8'), .22);
  const g = new THREE.Group(); g.position.set(x, WATER_Y, z);
  const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color:'#1f4f3c', roughness:.7 }));
  pad.rotation.y = i * 1.7; pad.position.y = .02; g.add(pad);
  const body = new THREE.Mesh(lanternGeo, new THREE.MeshStandardMaterial({ color:light, emissive:light, emissiveIntensity:2.4, roughness:.55, side:THREE.DoubleSide }));
  body.position.y = .06; g.add(body);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .05, 10), new THREE.MeshStandardMaterial({ color:'#2a2018', roughness:.6 }));
  rim.position.y = .54; g.add(rim);
  const halo = sprite(light, 3.2, .55); halo.position.y = .3; g.add(halo);
  scene.add(g);
  lanterns.push({ g, body, halo, tint:light, id:w.id, x, z, s:nearestS(x, riverZ(x) + 6.5), on:1, focus:0, hover:0, out:0, ph:i * 1.37 });
}
const cardOf = id => document.querySelector(`.brand-card[data-id="${id}"]`);
let hoverId = null;
document.addEventListener('pointerover', e => { const c = e.target.closest?.('.brand-card'); hoverId = c ? c.dataset.id : null; });
document.addEventListener('focusin', e => { const c = e.target.closest?.('.brand-card'); if (c) hoverId = c.dataset.id; });

/* ---------------- pedras-lanterna da trajetória ---------------- */
const trailItems = $$('.trail li');
const stones = [];
{
  const sA = nearestS(64, -12), sB = nearestS(72.5, -50);
  const rg = rockGeo(rng(31), false), rmat = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.8 });
  for (let i = 0; i < 5; i++) {
    const s = lerp(sA, sB, i / 4), p = trailAt(s), n = trailAt(s + 1).sub(p).normalize(), side = i % 2 ? 1 : -1;
    const x = p.x - n.z * 1.9 * side, z = p.z + n.x * 1.9 * side, y = height(x, z);
    const rock = new THREE.Mesh(rg, rmat); rock.scale.set(.42, .5, .42); rock.position.set(x, y, z); rock.castShadow = !LOW; scene.add(rock);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.11, 14, 10), new THREE.MeshStandardMaterial({ color:'#fff6c8', emissive:'#f2ffc0', emissiveIntensity:0, roughness:.3 }));
    orb.position.set(x, y + .42, z); scene.add(orb);
    const halo = sprite(new THREE.Color('#eaffb8'), 2.4, 0); halo.position.copy(orb.position); scene.add(halo);
    stones.push({ s, orb, halo, lit:0 });
  }
}

/* ---------------- vaga-lumes ---------------- */
const flies = (() => {
  const n = LOW ? 650 : 1700, pos = new Float32Array(n * 3), seed = new Float32Array(n), R = rng(77);
  for (let i = 0; i < n; i++) {
    let x, z;
    if (R() < .25) { const a = R() * 6.3, r = Math.sqrt(R()) * (CLEARING.r + 8); x = CLEARING.x + Math.cos(a) * r; z = CLEARING.z + Math.sin(a) * r; }
    else { const p = trailAt(R() * trailLen); x = p.x + (R() - .5) * 30; z = p.z + (R() - .5) * 30; }
    pos.set([x, Math.max(height(x, z), WATER_Y) + .3 + Math.pow(R(), 1.5) * 4.2, z], i * 3); seed[i] = R();
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uTime:U.uTime, uPR:{ value:pr }, uFog:{ value:FOG } },
    vertexShader:`attribute float aSeed; uniform float uTime, uPR; varying float vA;
      void main(){ vec3 p = position; float t = uTime * .55 + aSeed * 40.;
        p += vec3(sin(t * .7 + aSeed * 6.) * .9, sin(t * 1.1 + aSeed * 3.) * .4, cos(t * .6 + aSeed * 9.) * .9);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float blink = pow(.5 + .5 * sin(t * 2.2 + aSeed * 50.), 3.);
        gl_PointSize = (26. + 26. * blink) * uPR / -mv.z;
        vA = (.25 + .75 * blink) * (1. - smoothstep(22., 55., -mv.z)); }`,
    fragmentShader:`varying float vA; void main(){ float d = length(gl_PointCoord - .5);
        float a = 1. - smoothstep(0., .5, d), core = 1. - smoothstep(0., .12, d);
        vec3 c = mix(vec3(.8, 1., .55), vec3(1.), core) * (a * .5 + core * 1.6) * vA * 1.8;
        gl_FragColor = vec4(c, 1.); }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); return m;
})();

/* ---------------- névoa baixa e feixes de luar ---------------- */
const mistMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false,
  uniforms:{ uTime:U.uTime, uColor:{ value:new THREE.Color('#8fc2c4') } },
  vertexShader:`varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader:`uniform float uTime; uniform vec3 uColor; varying vec3 vW; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f); return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
    void main(){ vec2 p = vW.xz * .06 + vec2(uTime * .012, uTime * .006);
      float n = noise(p) * .6 + noise(p * 2.3 + 4.) * .3 + noise(p * 5.1) * .1;
      float edge = 1. - smoothstep(.2, .5, length(vUv - .5));
      float a = smoothstep(.45, .9, n) * edge * .22;
      float near = smoothstep(6., 22., length(cameraPosition - vW));
      gl_FragColor = vec4(uColor, a * near);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
{
  const spots = [[0, 50], [-2, 30], [10, 3], [26, 2], [44, 0], [62, 0], [66, -26], [72, -48], [80, -80], [92, -100], [-8, 70], [30, 40]];
  spots.forEach(([x, z], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(56, 56), mistMat); m.rotation.x = -Math.PI / 2;
    m.position.set(x, Math.max(height(x, z), WATER_Y) + .7 + (i % 3) * .35, z); m.renderOrder = 2; scene.add(m);
  });
}
const shaftMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
  uniforms:{ uTime:U.uTime, uColor:{ value:new THREE.Color('#cfeee8') } },
  vertexShader:`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader:`uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying vec3 vW;
    void main(){ float across = 1. - abs(vUv.x - .5) * 2.; float a = pow(across, 2.2) * smoothstep(0., .35, vUv.y) * (1. - smoothstep(.55, 1., vUv.y));
      a *= .55 + .45 * sin(uTime * .35 + vW.x * .3 + vW.z * .2);
      float d = length(cameraPosition - vW); a *= smoothstep(4., 14., d) * (1. - smoothstep(60., 110., d));
      gl_FragColor = vec4(uColor * a * .085, 1.); }`
});
{
  const R = rng(13), spots = [[3, 58], [-6, 44], [5, 34], [-4, 22], [62, -20], [68, -36], [76, -66], [84, -70], [70, -78], [90, -84]];
  const axis = MOON_DIR.clone();
  spots.forEach(([x, z]) => {
    const w = 2.5 + R() * 3.5, L = 46;
    for (let k = 0; k < 2; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, L), shaftMat);
      m.position.set(x, height(x, z), z).addScaledVector(axis, L / 2 - 1);
      m.quaternion.setFromUnitVectors(up, axis); m.rotateY(k * Math.PI / 2 + R());
      m.renderOrder = 3; scene.add(m);
    }
  });
}

/* ---------------- pós-processamento ---------------- */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), LOW ? .55 : .7, .6, .78);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- rolagem → posição na trilha ---------------- */
const S = {
  start:nearestS(0, 99), manifesto:nearestS(-3.4, 46), riverStart:nearestS(6, riverZ(6) + 7), riverEnd:nearestS(56, riverZ(56) + 6),
  aboutStart:nearestS(64, -12), aboutEnd:nearestS(72.5, -50), end:trailLen
};
let anchors = [];
function measure(){
  const vh = innerHeight, top = el => el.getBoundingClientRect().top + scrollY;
  const [hero, man, work, about, contact] = stops;
  const maxY = Math.max(1, document.documentElement.scrollHeight - vh);
  const raw = [
    [0, S.start],
    [top(man) - vh * .55, S.manifesto - 5],
    [top(man) + man.offsetHeight - vh * .45, S.manifesto + 3],
    [top(work) - vh * .25, S.riverStart],
    [top(work) + work.offsetHeight - vh * .75, S.riverEnd],
    [top(about) - vh * .3, S.aboutStart],
    [top(about) + about.offsetHeight - vh * .7, S.aboutEnd],
    [top(contact) - vh * .15, S.end - 1],
    [maxY, S.end]
  ];
  anchors = []; let lastY = -1, lastS = -1;
  raw.forEach(([y, s]) => { y = clamp(y, lastY + 1, maxY); s = Math.max(s, lastS); anchors.push([y, s]); lastY = y; lastS = s; });
}
function scrollToS(y){
  for (let i = 1; i < anchors.length; i++) {
    const [y0, s0] = anchors[i - 1], [y1, s1] = anchors[i];
    if (y <= y1) { const t = clamp((y - y0) / (y1 - y0 || 1)); return lerp(s0, s1, t * t * (3 - 2 * t) * .35 + t * .65); }
  }
  return anchors.at(-1)[1];
}
// parada da seção (movimento reduzido)
function stopS(y){
  const vh = innerHeight * .5, pick = [S.start, S.manifesto, S.riverStart + (S.riverEnd - S.riverStart) * .3, (S.aboutStart + S.aboutEnd) / 2, S.end];
  let cur = 0; stops.forEach((s, i) => { if (s.getBoundingClientRect().top + scrollY - vh <= y) cur = i; });
  return pick[cur];
}
measure();
new ResizeObserver(() => { measure(); needs = true; }).observe($('main'));

/* ---------------- câmera ---------------- */
const riverFocus = s => smooth(S.riverStart - 10, S.riverStart + 2, s) * (1 - smooth(S.riverEnd, S.riverEnd + 7, s));
const endFocus = s => smooth(S.end - 16, S.end - 2, s);
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
let sNow = scrollToS(scrollY), walk = 0, intro = motionOn() ? 0 : 1, yaw = 0, pitch = 0, pX = 0, pY = 0;
function placeCamera(s, dt){
  const p = trailAt(s), ahead = trailAt(Math.min(trailLen, s + 13));
  const ground = height(p.x, p.z);
  const eye = 1.75 + endFocus(s) * .9 + riverFocus(s) * .5;
  camPos.set(p.x, Math.max(ground, WATER_Y + .2) + eye, p.z);
  look.set(ahead.x, height(ahead.x, ahead.z) + 1.5, ahead.z);
  const rf = riverFocus(s);
  if (rf > 0) { const fx = p.x + 15; tmp.set(fx, WATER_Y + .9, riverZ(fx) + 1.2); look.lerp(tmp, rf * .75); }
  const ef = endFocus(s);
  if (ef > 0) { tmp.set(68, 12, -118); look.lerp(tmp, ef); }
  look.y += (1 - smooth(S.start + 4, S.start + 24, s)) * 3.2;   // na borda, o olhar sobe até a lua
  if (motionOn()) {
    // passo: um balanço sutil proporcional à velocidade da caminhada
    walk += Math.abs(s - sNowPrev) * 1.9;
    const amp = clamp(Math.abs(s - sNowPrev) * 6, 0, 1);
    camPos.y += Math.sin(walk) * .045 * amp; camPos.x += Math.cos(walk * .5) * .03 * amp;
    // entrada: a câmera chega de trás e de cima enquanto a névoa abre
    const e = 1 - Math.pow(1 - intro, 3);
    camPos.z += (1 - e) * 9; camPos.y += (1 - e) * 2.4;
    // respiração parada
    camPos.y += Math.sin(U.uTime.value * .6) * .03;
  }
  camera.position.copy(camPos);
  camLook.lerp(look, dt ? 1 - Math.exp(-dt * 6) : 1);
  camera.lookAt(camLook);
  camera.rotateY(yaw); camera.rotateX(pitch);
}
let sNowPrev = sNow;
camLook.copy(trailAt(13)); placeCamera(sNow, 0);

addEventListener('pointermove', e => { pX = e.clientX / innerWidth * 2 - 1; pY = e.clientY / innerHeight * 2 - 1; ripplePoint(e); hoverLantern(e); }, { passive:true });

/* ---------------- água sob o cursor e clique nas lanternas ---------------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y), hit = new THREE.Vector3();
let lastRip = 0;
function ripplePoint(e){
  if (!motionOn() || !fine) return;
  const now = U.uTime.value; if (now - lastRip < .45) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(waterPlane, hit)) return;
  if (hit.distanceTo(camera.position) > 45) return;
  if (riverDist(hit.x, hit.z) < RIVER_HALF + .4 || lakeDist(hit.x, hit.z) < .5) { waterUniforms.uRip.value.set(hit.x, hit.z, now, 0); lastRip = now; }
}
const lanternBodies = () => lanterns.map(l => l.body);
let overLantern = null;
function pickLantern(e){
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(lanternBodies(), false)[0];
  return h ? lanterns.find(l => l.body === h.object) : null;
}
function hoverLantern(e){
  if (!fine) return;
  const interactive = e.target.closest?.('a,button,input,dialog,.brand-card,.glass,.manifesto,.about-text,.trail');
  const l = interactive ? null : pickLantern(e);
  if (l !== overLantern) { overLantern = l; document.body.style.cursor = l ? 'pointer' : ''; }
}
document.addEventListener('click', e => {
  if (e.target.closest('a,button,input,dialog,.brand-card')) return;
  const l = pickLantern(e); if (!l) return;
  cardOf(l.id)?.querySelector('a')?.click();
});

/* ---------------- quadro a quadro ---------------- */
let needs = true, last = performance.now(), frameAvg = 16, frames = 0, ready = false, litCard = null;
addEventListener('scroll', () => { needs = true; }, { passive:true });
function resize(){
  camera.aspect = innerWidth / innerHeight; camera.fov = fovFor(); camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth / 2, innerHeight / 2); measure(); needs = true;
}
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });
new MutationObserver(() => { needs = true; if (motionOn()) intro = 1; }).observe(root, { attributes:true, attributeFilter:['data-motion'] });

function frame(now){
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  tick(now);
}
function tick(now){
  const dt = Math.min(.05, Math.max(0, now - last) / 1000); last = now;
  const live = motionOn();
  if (!live && !needs) return;
  needs = false;
  if (live) { U.uTime.value += dt; intro = Math.min(1, intro + dt / 3.4); }

  const target = debug.s ?? (live ? scrollToS(scrollY) : stopS(scrollY));
  sNowPrev = sNow;
  sNow = live && debug.s == null ? lerp(sNow, target, 1 - Math.exp(-dt * 2.6)) : target;
  if (debug.s != null) intro = 1;
  if (live && fine) { yaw = lerp(yaw, -pX * .06, 1 - Math.exp(-dt * 2.5)); pitch = lerp(pitch, -pY * .035, 1 - Math.exp(-dt * 2.5)); }
  else { yaw = pitch = 0; }
  placeCamera(sNow, live && debug.s == null ? dt : 0);
  scene.fog.density = FOG_DENSITY * (1 + (1 - intro) * 2.2);

  // lua sempre de frente para a câmera, longe no céu
  moonDisc.position.copy(camera.position).addScaledVector(MOON_DIR, 600); moonDisc.lookAt(camera.position);
  // sombra da lua acompanha a caminhada
  tmp.set(Math.round(camera.position.x / 4) * 4, 0, Math.round(camera.position.z / 4) * 4);
  moon.target.position.copy(tmp); moon.position.copy(tmp).addScaledVector(MOON_DIR, 120);

  // lanternas: flutuam, respondem ao filtro, ao foco e à passagem da câmera
  const t = U.uTime.value;
  let nearest = null, nd = 1e9;
  lanterns.forEach((l, i) => {
    const card = l.id ? cardOf(l.id) : null;
    const out = card && card.classList.contains('is-out') ? 1 : 0;
    l.out = lerp(l.out, out, live ? 1 - Math.exp(-dt * 3) : 1);
    const pass = 1 - smooth(4, 16, Math.abs(sNow - l.s));
    l.focus = lerp(l.focus, Math.max(pass, hoverId === l.id ? 1 : 0, overLantern === l ? 1 : 0), live ? 1 - Math.exp(-dt * 4) : 1);
    const bob = Math.sin(t * 1.3 + l.ph) * .05;
    l.g.position.y = WATER_Y + bob - l.out * .35; l.g.rotation.z = Math.sin(t * .9 + l.ph) * .06;
    l.g.scale.setScalar(1 + l.focus * .35);
    const glow = (1 - l.out * .85) * (1 + l.focus * .9);
    // de perto a lanterna não estoura: o halo some quando a câmera chega muito próxima
    const closeFade = smooth(3, 9, l.g.position.distanceTo(camera.position));
    l.body.material.emissiveIntensity = (.8 + .25 * closeFade) * glow + Math.sin(t * 7 + l.ph) * .05;
    l.halo.material.opacity = .4 * glow * closeFade; l.halo.scale.setScalar(2.6 + l.focus * 1.6);
    waterUniforms.uLP.value[i].set(l.x, l.g.position.y, l.z);
    waterUniforms.uLC.value[i].set(l.tint.r, l.tint.g, l.tint.b).multiplyScalar(.75 * glow);
    const d = Math.abs(sNow - l.s); if (d < nd && !out) { nd = d; nearest = l; }
  });
  // luz quente das duas lanternas mais próximas
  const near2 = [...lanterns].sort((a, b) => a.g.position.distanceToSquared(camera.position) - b.g.position.distanceToSquared(camera.position)).slice(0, 2);
  near2.forEach((l, k) => { warm[k].position.copy(l.g.position).add(tmp.set(0, .6, 0)); warm[k].color.copy(l.tint); warm[k].intensity = 3.2 * (1 - l.out) * (1 + l.focus * .6); });
  // card do projeto que está passando acende
  const lit = nearest && nd < 6 && riverFocus(sNow) > .5 ? nearest.id : null;
  if (lit !== litCard) { if (litCard) cardOf(litCard)?.classList.remove('is-lit'); if (lit) cardOf(lit)?.classList.add('is-lit'); litCard = lit; }

  // pedras da trajetória acendem quando a câmera passa
  stones.forEach((st, i) => {
    const on = sNow > st.s - 6 || !live ? 1 : 0;
    st.lit = lerp(st.lit, on, live ? 1 - Math.exp(-dt * 2.5) : 1);
    st.orb.material.emissiveIntensity = st.lit * (3 + Math.sin(t * 3 + i) * .4);
    st.halo.material.opacity = st.lit * .7;
    trailItems[i]?.classList.toggle('lit', on === 1);
  });

  composer.render();
  if (debug.onFrame) { const f = debug.onFrame; debug.onFrame = null; f(canvas); }

  if (!ready) { ready = true; requestAnimationFrame(() => root.classList.add('world-ready')); }
  // resolução adaptativa: se o quadro pesar, reduz a densidade de pixels
  if (live) {
    frameAvg = lerp(frameAvg, dt * 1000, .05); frames++;
    if (frames > 90) {
      frames = 0;
      if (frameAvg > 24 && pr > .7) { pr = Math.max(.7, pr - .15); renderer.setPixelRatio(pr); composer.setPixelRatio(pr); flies.uniforms.uPR.value = pr; }
      else if (frameAvg < 13 && pr < MAX_PR) { pr = Math.min(MAX_PR, pr + .1); renderer.setPixelRatio(pr); composer.setPixelRatio(pr); flies.uniforms.uPR.value = pr; }
    }
  }
}
// inspeção durante o desenvolvimento: LicyaWorld.debug.s = metros na trilha (null volta à rolagem)
const debug = { s:null, onFrame:null,
  // devolve uma cópia exata do próximo quadro (para revisar as paradas)
  snap(s){
    this.s = s; let url = '';
    this.onFrame = null;
    for (let i = 0; i < 3; i++) { needs = true; tick(last + 16); }
    this.onFrame = c => { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(c, 0, 0); url = o.toDataURL('image/jpeg', .82); };
    needs = true; tick(last + 16);
    return url;
  } };
// ?shot=nome-da-parada|metros — enquadra a câmera numa parada fixa (revisão de quadros)
{
  const q = new URLSearchParams(location.search), at = q.get('at');
  // ?at=seção — simula a rolagem até a seção (a captura sem interface não acompanha scroll)
  if (at) { const el = document.getElementById(at); if (el) { const y = el.getBoundingClientRect().top + scrollY + (+q.get('dy') || 0); $('main').style.transform = `translateY(${-y}px)`; debug.s = scrollToS(y); } }
  const shot = q.get('shot');
  if (shot) {
    const named = { borda:S.start, trilha:S.manifesto, rio:S.riverStart + 6, rio2:(S.riverStart + S.riverEnd) / 2, trajetoria:S.aboutStart + 14, clareira:S.end };
    debug.s = named[shot] ?? +shot;
    if (new URLSearchParams(location.search).has('clean')) root.classList.add('shot-clean');
  }
}
requestAnimationFrame(frame);
window.LicyaWorld = { scene, camera, renderer, trailLen, S, debug, get s(){ return sNow; } };
}
