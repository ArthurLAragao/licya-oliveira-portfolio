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
   Sem WebGL: fica o pôster em CSS e todo o conteúdo funciona igual.

   Sem quadro preto: o canvas nunca é redimensionado sem ser redesenhado no
   mesmo instante (resolução adaptativa decide antes do desenho; resize
   desenha na hora; altura em 100lvh no celular), normais inválidas são
   saneadas (NaN viraria mancha preta no bloom) e, se a GPU derrubar o
   contexto, volta o pôster até ele ser restaurado. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
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
// o canvas mede a janela "grande" (100lvh): a barra do navegador no celular não força redimensionar
const view = () => ({ w:Math.max(1, canvas.clientWidth || innerWidth), h:Math.max(1, canvas.clientHeight || innerHeight) });
let VW = view();
renderer.setPixelRatio(pr);
renderer.setSize(VW.w, VW.h, false);
renderer.setClearColor('#163f4a', 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const FOG = new THREE.Color('#215866');
const FOG_DENSITY = .019;
scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);
const camera = new THREE.PerspectiveCamera(50, VW.w / VW.h, .1, 900);
const fovFor = () => VW.w / VW.h < .8 ? 64 : VW.w / VW.h < 1.2 ? 56 : 46;
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
moon.shadow.bias = -.0006; moon.shadow.normalBias = .09;
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
  for (let i = 0; i < 70; i++) { const x = R0() * w, y = R0() * h, r = 10 + R0() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(40,70,60,${.08 + R0() * .1})`); gr.addColorStop(1, 'rgba(40,70,60,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 900; i++) { const x = R0() * w, y = R0() * h, a = R0() * 6.3, l = 2 + R0() * 4; g.strokeStyle = `rgba(${150 + R0() * 40 | 0},${120 + R0() * 30 | 0},${90 + R0() * 20 | 0},${.25 + R0() * .3})`; g.lineWidth = .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${210 + R0() * 40 | 0},${225 + R0() * 30 | 0},${200 + R0() * 30 | 0},${.35 + R0() * .3})`; g.beginPath(); g.ellipse(R0() * w, R0() * h, 1 + R0() * 1.6, .6 + R0(), R0() * 3, 0, 7); g.fill(); }
}, 90);
// terra da trilha: terra batida, sulcos de pisada, cascalho, agulhas caídas, raízes e franja de musgo
const TAU = Math.PI * 2;
const dirtTex = canvasTex(256, 1024, (g, w, h) => {
  g.fillStyle = 'rgb(122,98,74)'; g.fillRect(0, 0, w, h);
  const blot = (x, y, r, col) => { g.save(); g.translate(x, y); g.scale(.55, 1.8); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); };
  for (let i = 0; i < 320; i++) { const x = R0() * w, y = R0() * h, r = 18 + R0() * 60; const col = R0() < .5 ? 'rgba(78,58,42,.16)' : 'rgba(168,140,106,.12)'; blot(x, y, r, col); blot(x, y + h * (y < h / 2 ? 1 : -1), r, col); }
  for (const cx of [.37, .63]) { const gr = g.createLinearGradient(w * (cx - .13), 0, w * (cx + .13), 0); gr.addColorStop(0, 'rgba(66,48,34,0)'); gr.addColorStop(.5, 'rgba(66,48,34,.42)'); gr.addColorStop(1, 'rgba(66,48,34,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  for (let i = 0; i < 30000; i++) { const v = R0(); g.fillStyle = v < .5 ? `rgba(58,42,30,${.14 + R0() * .3})` : `rgba(200,176,140,${.1 + R0() * .22})`; g.fillRect(R0() * w, R0() * h, 1 + R0() * 1.3, 1 + R0() * 1.3); }
  const wrapY = (y, r, fn) => { fn(y); if (y < r) fn(y + h); if (y > h - r) fn(y - h); };
  for (let i = 0; i < 900; i++) {
    const x = R0() * w, y0 = R0() * h, sz = 1 + Math.pow(R0(), 2.6) * 3.6, a = R0() * 3, l = 104 + R0() * 50 | 0, al = .55 + R0() * .35;
    wrapY(y0, 10, y => {
      g.fillStyle = 'rgba(40,30,24,.5)'; g.beginPath(); g.ellipse(x + .8, y + .9, sz, sz * .72, a, 0, TAU); g.fill();
      g.fillStyle = `rgba(${l},${l - 10},${l - 26},${al})`; g.beginPath(); g.ellipse(x, y, sz, sz * .72, a, 0, TAU); g.fill();
    });
  }
  for (let i = 0; i < 1900; i++) { const x = R0() * w, y0 = R0() * h, a = R0() * TAU, l = 4 + R0() * 9; g.strokeStyle = `rgba(${108 + R0() * 44 | 0},${62 + R0() * 28 | 0},${36 + R0() * 16 | 0},${.3 + R0() * .35})`; g.lineWidth = .7 + R0() * .5;
    wrapY(y0, 14, y => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }); }
  for (let i = 0; i < 120; i++) { const x = R0() * w, y = 14 + R0() * (h - 28), a = R0() * TAU, l = 5 + R0() * 6; g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = `rgba(${130 + R0() * 50 | 0},${84 + R0() * 30 | 0},${48 + R0() * 20 | 0},.75)`; g.beginPath(); g.ellipse(0, 0, l, l * .42, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(60,40,26,.6)'; g.lineWidth = .6; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.restore(); }
  // raízes: poucas, tortas, saem de uma borda e afinam até sumir no meio da trilha
  for (let i = 0; i < 2; i++) {
    const left = i === 0, y0 = h * (.28 + i * .45), segs = 14;
    let x = left ? -6 : w + 6, y = y0;
    for (let k = 0; k < segs; k++) {
      const t = k / segs, nx = x + (left ? 1 : -1) * (w * .42 / segs), ny = y + Math.sin(k * 1.3 + i) * 7 + (R0() - .5) * 5;
      g.lineCap = 'round';
      g.strokeStyle = `rgba(56,40,29,${.5 * (1 - t)})`; g.lineWidth = 6 * (1 - t * .85); g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
      g.strokeStyle = `rgba(150,122,94,${.18 * (1 - t)})`; g.lineWidth = 1.2 * (1 - t); g.beginPath(); g.moveTo(x, y - 1.6 * (1 - t)); g.lineTo(nx, ny - 1.6 * (1 - t)); g.stroke();
      x = nx; y = ny;
    }
  }
  for (let i = 0; i < 520; i++) { const side = R0() < .5, x = side ? Math.pow(R0(), 2) * w * .22 : w - Math.pow(R0(), 2) * w * .22, y = R0() * h;
    g.fillStyle = `rgba(${48 + R0() * 30 | 0},${84 + R0() * 40 | 0},${62 + R0() * 26 | 0},${.45 + R0() * .4})`; g.beginPath(); g.arc(x, y, 1.5 + R0() * 4, 0, TAU); g.fill(); }
  // franja irregular (repete na vertical sem emenda)
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mg = mc.getContext('2d');
  for (let y = 0; y < h; y += 2) {
    const k = y / h * TAU, e1 = .13 + .06 * Math.sin(k * 3 + 1) + .04 * Math.sin(k * 13 + 2) + .02 * Math.sin(k * 37), e2 = .13 + .06 * Math.sin(k * 4 + 3) + .04 * Math.sin(k * 11) + .02 * Math.sin(k * 41 + 1);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(e1 * .5, 'rgba(0,0,0,.25)'); gr.addColorStop(e1, 'rgba(0,0,0,.7)'); gr.addColorStop(e1 + .12, 'rgba(0,0,0,1)');
    gr.addColorStop(1 - e2 - .12, 'rgba(0,0,0,1)'); gr.addColorStop(1 - e2, 'rgba(0,0,0,.7)'); gr.addColorStop(1 - e2 * .5, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    mg.fillStyle = gr; mg.fillRect(0, y, w, 2);
  }
  g.globalCompositeOperation = 'destination-in'; g.drawImage(mc, 0, 0); g.globalCompositeOperation = 'source-over';
});
// atlas das plantas: a faixa inferior é sólida (tronco/miolo), o resto é a folhagem recortada
const SOLID_V = .03, CARD_V0 = .12;
function plantTex(paint){
  const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, h - 18, w, 18); g.save(); g.beginPath(); g.rect(0, 0, w, h - 26); g.clip(); paint(g, w, h - 26); g.restore(); });
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
// ramo de pinheiro: haste com agulhas inclinadas para a ponta e raminhos laterais
const sprigTex = plantTex((g, w, h) => {
  const cy = h / 2, needle = (x, y, ang, len, lw) => { const l = 120 + R0() * 80 | 0; g.strokeStyle = `rgb(${l * .55 | 0},${l},${l * .78 | 0})`; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke(); };
  g.lineCap = 'round';
  const env = t => Math.min(1, t * 6) * (1 - Math.pow(t, 2.2) * .82);
  // raminhos laterais
  for (let i = 0; i < 9; i++) {
    const x0 = 20 + i * 24 + R0() * 10, side = i % 2 ? 1 : -1, ang = side * (.6 + R0() * .3), L = (90 - i * 7) * env(x0 / w);
    for (let k = 0; k < L; k += 2.2) { const x = x0 + Math.cos(ang) * k, y = cy + Math.sin(ang) * k, e = 1 - k / L;
      for (const sd of [-1, 1]) needle(x, y, ang + sd * (.95 + R0() * .3), (10 + R0() * 6) * (.4 + e * .6), 1.3); }
  }
  // agulhas da haste principal
  for (let x = 2; x < w - 4; x += 1.6) { const t = x / w, e = env(t);
    for (const sd of [-1, 1]) needle(x, cy + (R0() - .5) * 3, sd * (.75 + R0() * .35), (22 + R0() * 16) * e, 1.5); }
  g.strokeStyle = 'rgb(120,104,80)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, cy); g.lineTo(w - 6, cy); g.stroke();
});
// cacho de folhas para as árvores largas e arbustos
const leafTex = plantTex((g, w, h) => {
  const cx = w / 2, cy = h / 2;
  for (let i = 0; i < 150; i++) {
    const r = Math.sqrt(R0()) * w * .44, a = R0() * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .92, L = 9 + R0() * 9;
    const l = 150 + R0() * 100 | 0;
    g.save(); g.translate(x, y); g.rotate(a + (R0() - .5) * 1.2);
    g.fillStyle = `rgb(${l - 50 | 0},${l},${l - 40 | 0})`; g.beginPath(); g.ellipse(L * .5, 0, L, L * .45, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(70,90,70,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-L * .4, 0); g.lineTo(L * 1.4, 0); g.stroke();
    g.restore();
  }
});
// fronde de samambaia: ráquis com folíolos que diminuem até a ponta
const fernTex = plantTex((g, w, h) => {
  const cy = h / 2; g.lineCap = 'round';
  for (let x = 6; x < w - 6; x += 5.5) {
    const t = x / w, e = Math.sin(Math.min(1, t * 1.1) * Math.PI * .92 + .15) * (1 - t * .55);
    for (const sd of [-1, 1]) {
      const L = (h * .44) * e * (.9 + R0() * .15), a = sd * (1.12 - t * .3), l = 150 + R0() * 80 | 0;
      g.save(); g.translate(x, cy); g.rotate(a);
      g.fillStyle = `rgb(${l - 60 | 0},${l},${l - 50 | 0})`;
      for (let k = 0; k < L; k += 4.2) { const q = 1 - k / L; g.beginPath(); g.ellipse(k + 2, 0, 3.2, 2.6 * q + 1, 0, 0, TAU); g.fill(); }
      g.restore();
    }
  }
  g.strokeStyle = 'rgb(110,140,96)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, cy); g.lineTo(w - 4, cy); g.stroke();
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
  // a face precisa olhar para cima (vista de cima, uma face invertida é descartada e a trilha some)
  if (g.attributes.normal.getY(0) < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
const dirtMat = new THREE.MeshStandardMaterial({ map:dirtTex, bumpMap:dirtTex, bumpScale:3.2, color:new THREE.Color(1.3, 1.08, .84), transparent:true, roughness:.92, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-6, polygonOffsetUnits:-24 });
{
  // a fita é interrompida onde a trilha cruza a água (ali há pedras)
  // fica .17 acima do relevo: assim as dobras da malha não aparecem como linhas cruzando a trilha
  let run = [];
  const flush = () => { if (run.length > 3) scene.add(ribbon(run, 1.45, .17, dirtMat, 9)); run = []; };
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
    float fres = pow(clamp(1. - dot(n, V), 0., 1.), 4.);
    vec3 deep = vec3(.006,.045,.06), mid = vec3(.02,.17,.19), glowC = vec3(.33,.98,.9);
    vec3 col = mix(deep, mid, n1);
    vec3 R = reflect(-V, n);
    col += mix(uFog * 1.15, vec3(.03,.1,.16), clamp(R.y * 2., 0., 1.)) * (fres * .95 + .05);
    float m = max(dot(R, uMoon), 0.);
    col += vec3(.9,1.,.97) * (pow(m, 500.) * 9. + pow(m, 50.) * .35);
    vec2 q = p * 2.1 + vec2(-uTime * .35 * uFlow, 0.); vec2 cell = floor(q); float h = hash(cell);
    float spark = (1. - smoothstep(0., .2, length(fract(q) - .5 + (vec2(hash(cell+3.), hash(cell+7.)) - .5) * .5))) * step(.94, h) * (.5 + .5 * sin(uTime * 2.6 + h * 60.));
    col += glowC * spark * 2.6;
    col += glowC * pow(clamp(n2, 0., 1.), 3.2) * .42;
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
// uma "carta" de folhagem: faixa ao longo de x (0→len), largura em z, com curvatura e torção
function card(len, wid, seg, roll, shapeY){
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, x = t * len, y = shapeY ? shapeY(t) : 0;
    for (let j = 0; j < 2; j++) {
      const v = j ? 1 : -1, z = v * wid / 2, cr = Math.cos(roll), sr = Math.sin(roll);
      pos.push(x, y + z * sr, z * cr); uv.push(t, CARD_V0 + (j ? 1 : 0) * (1 - CARD_V0 - .01));
    }
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3)); g.setIndex(idx);
  return g;
}
const solidUV = g => { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, .5, SOLID_V); return g; };
// normal "de copa": aponta para fora do eixo da árvore e um pouco para cima — luz macia e volumosa
function crownNormals(g, cx, cy, cz, up){
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i) - cx, (p.getY(i) - cy) * .6 + up, p.getZ(i) - cz).normalize(); n.setXYZ(i, v.x, v.y, v.z); }
}
function pineGeo(tiers, radial, R){
  const parts = [];
  const dark = new THREE.Color('#0a221e'), mid = new THREE.Color('#1f4d41'), tip = new THREE.Color('#4f8a70'), moonlit = new THREE.Color('#86bba6');
  const trunk = new THREE.CylinderGeometry(.014, .042, .66, 7, 3, true); trunk.translate(0, .33, 0); trunk.computeVertexNormals(); solidUV(trunk);
  paint(trunk, (c, x, y, z) => c.set('#3b2a1f').lerp(new THREE.Color('#6b5443'), clamp(N1(y * 40, Math.atan2(z, x) * 2) * .8 + .3))); parts.push(trunk);
  // miolo escuro: fecha a silhueta e dá profundidade entre os galhos
  const core = new THREE.ConeGeometry(.06, .7, 8, 1, true); core.translate(0, .52, 0); core.computeVertexNormals(); solidUV(core);
  paint(core, (c, x, y) => c.copy(dark).lerp(mid, clamp((y - .2) / .8) * .45)); parts.push(core);
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1), y0 = .15 + f * .78, L = (.25 * (1 - f * .84) + .05) * (.9 + R() * .2);
    const n = Math.max(5, Math.round(radial * (1 - f * .4))), off = R() * TAU;
    for (let j = 0; j < n; j++) {
      const a = off + j / n * TAU + (R() - .5) * .55, len = L * (.78 + R() * .38), droop = .3 + f * .1 + R() * .18;
      for (const roll of [.62, -.62]) {
        const b = card(len, len * .66, 3, roll + (R() - .5) * .35, t => .02 * t - t * t * droop * len);
        b.rotateZ(.16 - f * .08 + (R() - .5) * .1); b.rotateY(a); b.translate(0, y0, 0);
        crownNormals(b, 0, y0 - .06, 0, .22);
        const bright = .85 + R() * .3;
        paint(b, (c, x, y, z) => {
          const r = clamp(Math.hypot(x, z) / (L * 1.05));
          c.copy(dark).lerp(mid, Math.min(1, r * 1.2)).lerp(tip, Math.pow(r, 2.2) * (.4 + f * .3)).lerp(moonlit, f * f * .1).multiplyScalar(bright);
        });
        parts.push(b);
      }
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
// copa de folhas: miolo escuro + dezenas de cachos (cartas) espalhados na superfície de cada volume
function crownCards(parts, blobs, R, density, dark, light, cy){
  const q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1), d = new THREE.Vector3(), tw = new THREE.Quaternion();
  blobs.forEach(([bx, by, bz, br]) => {
    const fill = new THREE.SphereGeometry(br * .78, 9, 7); fill.translate(bx, by, bz); solidUV(fill);
    crownNormals(fill, 0, cy, 0, .3); paint(fill, c => c.copy(dark)); parts.push(fill);
    const count = Math.round(br * density);
    for (let i = 0; i < count; i++) {
      d.set(R() * 2 - 1, R() * 1.6 - .5, R() * 2 - 1).normalize();
      const sz = br * (.75 + R() * .45), r = br * (.72 + R() * .32);
      const c = new THREE.PlaneGeometry(sz, sz); const uv = c.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setY(k, CARD_V0 + uv.getY(k) * (1 - CARD_V0 - .01));
      q.setFromUnitVectors(zAxis, d); tw.setFromAxisAngle(d, R() * TAU); q.premultiply(tw);
      c.applyQuaternion(q); c.translate(bx + d.x * r, by + d.y * r * .85, bz + d.z * r);
      crownNormals(c, 0, cy, 0, .3);
      const shade = clamp(.35 + d.y * .45 + (R() - .5) * .3);
      paint(c, (col, x, y) => col.copy(dark).lerp(light, clamp(shade + (y - by) / br * .25)));
      parts.push(c);
    }
  });
}
function leafyGeo(R){
  const parts = [];
  const trunk = new THREE.CylinderGeometry(.026, .07, .62, 7, 2, true); trunk.translate(0, .31, 0); trunk.computeVertexNormals(); solidUV(trunk);
  paint(trunk, (c, x, y) => c.set('#3d2c22').lerp(new THREE.Color('#5d4838'), clamp(y * 1.4))); parts.push(trunk);
  // dois galhos que sobem até a copa
  [[.5, .2], [-.6, 2.4]].forEach(([lean, a]) => {
    const l = new THREE.CylinderGeometry(.012, .026, .26, 5, 1, true); l.translate(0, .13, 0); l.rotateZ(lean); l.rotateY(a); l.translate(0, .38, 0);
    l.computeVertexNormals(); solidUV(l); paint(l, c => c.set('#46352a')); parts.push(l);
  });
  const blobs = [[0, .64, 0, .25], [.16, .54, .07, .19], [-.15, .55, -.05, .2], [.04, .8, -.04, .18], [-.06, .5, .15, .17], [.09, .52, -.16, .16]];
  crownCards(parts, blobs, R, 120, new THREE.Color('#10342c'), new THREE.Color('#5f9a7c'), .6);
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
function shrubGeo(R){
  const parts = [];
  crownCards(parts, [[0, .22, 0, .3], [.22, .16, .1, .21], [-.2, .17, -.08, .23]], R, 80, new THREE.Color('#0f332b'), new THREE.Color('#5f9c78'), .1);
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
// samambaia: frondes em arco saindo do centro
function fernGeo(R){
  const parts = [], base = new THREE.Color('#1d4a3a'), tip = new THREE.Color('#8cc69e');
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (R() - .5) * .5, len = .5 + R() * .32, rise = .55 + R() * .35;
    const fr = card(len, len * .5, 6, (R() - .5) * .3, t => t * len * rise - t * t * len * (rise + .25));
    fr.rotateY(a); crownNormals(fr, 0, -.4, 0, .9);
    paint(fr, (c, x, y, z) => c.copy(base).lerp(tip, clamp(Math.hypot(x, z) / len) * .8 + .1));
    parts.push(fr);
  }
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
function grassGeo(R){
  const verts = [], cols = [], base = new THREE.Color('#1f4637'), tip = new THREE.Color('#62957a'), c = new THREE.Color();
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
function windy(mat, amount, pivot, twoSided){
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
      w += sin(uTime * 4.1 + position.x * 9. + position.z * 7. + ip.x) * .12;
      transformed.x += w * bh * ${amount.toFixed(3)}; transformed.z += w * .5 * bh * ${amount.toFixed(3)};`);
    // cartas de folhagem: a normal de copa vale para as duas faces (sem lado escuro "de papel")
    if (twoSided) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>',
      THREE.ShaderChunk.normal_fragment_begin.replace(/gl_FrontFacing \? 1\.0 : - ?1\.0/, '1.0'));
  };
  // cada combinação de vento compila o seu programa (senão todas herdariam o primeiro)
  mat.customProgramCacheKey = () => `wind-${amount}-${pivot}-${twoSided ? 2 : 1}`;
  return mat;
}
const cardMat = (map, amount, pivot) => windy(new THREE.MeshStandardMaterial({
  vertexColors:true, map, alphaTest:.42, alphaToCoverage:!LOW, side:THREE.DoubleSide, roughness:.86, metalness:0 }), amount, pivot, true);
const foliage = () => windy(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.88, metalness:0 }), .07, .3);
const grassMat = windy(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:1, side:THREE.DoubleSide }), .55, 0, true);

/* ---------------- povoando a mata ---------------- */
const R1 = rng(2026);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function sane(geo){
  const n = geo.attributes.normal, p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) if (!Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))) p.setXYZ(i, 0, 0, 0);
  if (!n) return geo;
  for (let i = 0; i < n.count; i++) {
    const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z);
    if (!(l > 1e-4) || !Number.isFinite(l)) n.setXYZ(i, 0, 1, 0); else n.setXYZ(i, x / l, y / l, z / l);
  }
  return geo;
}
const chunks = [];
function instanced(geo, mat, list, { cast = false, receive = true, far = 130 } = {}){
  sane(geo);
  const CELL = 48, buckets = new Map(), tint = new THREE.Color();
  list.forEach(t => { const k = Math.floor(t.x / CELL) + ',' + Math.floor(t.z / CELL); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); });
  const depth = cast && mat.map && mat.alphaTest ? new THREE.MeshDepthMaterial({ depthPacking:THREE.RGBADepthPacking, map:mat.map, alphaTest:mat.alphaTest }) : null;
  const out = [];
  buckets.forEach(items => {
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((t, i) => {
      q.setFromAxisAngle(up, t.rot); sc.set(t.s * (t.sx || 1), t.s * (t.sy || 1), t.s * (t.sz || t.sx || 1)); ps.set(t.x, t.y, t.z);
      m4.compose(ps, q, sc); mesh.setMatrixAt(i, m4);
      tint.setScalar(t.tint || 1); mesh.setColorAt(i, tint);
    });
    mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2;   // folga para o vento
    mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.frustumCulled = true;
    if (depth) mesh.customDepthMaterial = depth;
    scene.add(mesh); chunks.push({ mesh, far }); out.push(mesh);
  });
  return out;
}
const nearPines = [], farPines = [], leafy = [], shrubs = [], rocks = [], grass = [], shrooms = [], ferns = [];
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
    const crown = t.s * t.sx * (isLeafy ? .3 : .33);
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
    if (trailDist(x, z) < s * .32 + 1.5 || lakeDist(x, z) < 3 || inVista(x, z)) continue;
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
    grass.push({ x, y:height(x, z) - .02, z, rot:R1() * 6.3, s:.75 + R1() * .8, sy:.55 + R1() * .75, tint:.6 + R1() * .5 });
  }
  for (let i = 0; i < (LOW ? 260 : 700); i++) {
    const s = R1() * trailLen, p = trailAt(s), off = (R1() < .5 ? -1 : 1) * (2.2 + R1() * 9);
    const n = trailAt(Math.min(trailLen, s + 1)).sub(p).normalize(), x = p.x - n.z * off, z = p.z + n.x * off;
    if (trailDist(x, z) < 2.6 || riverDist(x, z) < RIVER_HALF + .4 || lakeDist(x, z) < 1) continue;
    if (meadowDist(x, z) > -2) continue;
    shrubs.push({ x, y:height(x, z) - .05, z, rot:R1() * 6.3, s:.55 + R1() * .9, tint:.75 + R1() * .5 });
  }
  for (let i = 0; i < (LOW ? 500 : 1300); i++) {
    let x, z;
    if (R1() < .18) { const a = R1() * TAU, r = CLEARING.r - 1 + R1() * 6; x = CLEARING.x + Math.cos(a) * r; z = CLEARING.z + Math.sin(a) * r; if (inVista(x, z)) continue; }
    else { const s = R1() * trailLen, p = trailAt(s), off = (R1() < .5 ? -1 : 1) * (1.7 + Math.pow(R1(), 1.4) * 9), n = trailAt(Math.min(trailLen, s + 1)).sub(p).normalize(); x = p.x - n.z * off; z = p.z + n.x * off; }
    if (trailDist(x, z) < 1.7 || riverDist(x, z) < RIVER_HALF + .5 || lakeDist(x, z) < 1.2 || meadowDist(x, z) > -1) continue;
    ferns.push({ x, y:height(x, z) - .03, z, rot:R1() * TAU, s:.75 + R1() * .8, sy:.8 + R1() * .4, tint:.75 + R1() * .45 });
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
const pineMat = cardMat(sprigTex, .07, .3); pineMat.color.setScalar(.8);   // agulhas prateadas pela lua, sem cara de neve
const farPineMat = foliage(), leafyMat = cardMat(leafTex, .07, .3), shrubMat = cardMat(leafTex, .25, .1), fernMat = cardMat(fernTex, .35, 0);
const RG = rng(5);
instanced(pineGeo(LOW ? 11 : 17, LOW ? 7 : 10, RG), pineMat, nearPines, { cast:!LOW });
// longe da trilha: o mesmo pinheiro de ramos, com menos andares (no modo leve, cones simples)
if (LOW) instanced(farPineGeo(RG), farPineMat, farPines, { far:120 });
else instanced(pineGeo(13, 8, RG), pineMat, farPines, { far:140 });
instanced(leafyGeo(RG), leafyMat, leafy, { cast:!LOW });
instanced(shrubGeo(RG), shrubMat, shrubs, { far:70 });
instanced(fernGeo(RG), fernMat, ferns, { far:60 });
instanced(grassGeo(RG), grassMat, grass, { receive:!LOW, far:55 });
instanced(rockGeo(RG, false), new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.85 }), rocks, { cast:!LOW, far:80 });
{
  // cogumelos bioluminescentes: haste clara e chapéu que brilha em ciano
  const stem = new THREE.CylinderGeometry(.18, .26, 1, 6); stem.translate(0, .5, 0);
  const cap = new THREE.SphereGeometry(.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); cap.translate(0, 1, 0);
  instanced(stem, new THREE.MeshStandardMaterial({ color:'#cfe6dc', roughness:.6 }), shrooms, { far:60 });
  instanced(cap, new THREE.MeshStandardMaterial({ color:'#3ee0d0', emissive:'#36e6d6', emissiveIntensity:2.2, roughness:.4 }), shrooms, { far:60 });
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
        float blink = pow(clamp(.5 + .5 * sin(t * 2.2 + aSeed * 50.), 0., 1.), 3.);
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
      // de lado (rente ao chão) a lâmina de névoa vira uma linha dura: some suavemente
      float graze = smoothstep(.015, .12, abs(normalize(cameraPosition - vW).y));
      gl_FragColor = vec4(uColor, a * near * graze);
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
    void main(){ float across = 1. - abs(vUv.x - .5) * 2.; float a = pow(clamp(across, 0., 1.), 2.2) * smoothstep(0., .35, vUv.y) * (1. - smoothstep(.55, 1., vUv.y));
      a *= .55 + .45 * sin(uTime * .35 + vW.x * .3 + vW.z * .2);
      float d = length(cameraPosition - vW); a *= smoothstep(4., 14., d) * (1. - smoothstep(60., 110., d));
      gl_FragColor = vec4(uColor * a * .085, 1.); }`
});
{
  const R = rng(13), spots = [[3, 58], [-6, 44], [5, 34], [-4, 22], [62, -20], [68, -36], [64, -52]];
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
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(VW.w * pr, VW.h * pr, { type:THREE.HalfFloatType, samples:LOW ? 0 : 4 }));
composer.setPixelRatio(pr); composer.setSize(VW.w, VW.h);
composer.addPass(new RenderPass(scene, camera));
// filtro de segurança: um único pixel NaN/infinito (comum em GPUs reais, raro no software)
// entraria no bloom e se espalharia pela tela inteira = flash preto. Aqui ele vira zero.
composer.addPass(new ShaderPass({
  uniforms:{ tDiffuse:{ value:null }, uTexel:{ value:new THREE.Vector2(1 / VW.w, 1 / VW.h) } },
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 uTexel; varying vec2 vUv;
    bool bad(vec3 c){ return any(isnan(c)) || any(isinf(c)); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
      // pixel inválido: usa a média dos vizinhos válidos (nunca um ponto preto)
      if (bad(c)) { vec3 s = vec3(0.); float n = 0.;
        for (int i = 0; i < 8; i++) { float a = float(i) * .785398; vec3 v = texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * uTexel * 2.).rgb;
          if (!bad(v)) { s += v; n += 1.; } }
        c = n > 0. ? s / n : vec3(.02, .06, .07); }
      gl_FragColor = vec4(clamp(c, 0., 64.), 1.); }`
}));
const bloom = new UnrealBloomPass(new THREE.Vector2(VW.w / 2, VW.h / 2), LOW ? .55 : .7, .6, .78);
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
  ndc.set(e.clientX / VW.w * 2 - 1, -(e.clientY / VW.h) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(waterPlane, hit)) return;
  if (hit.distanceTo(camera.position) > 45) return;
  if (riverDist(hit.x, hit.z) < RIVER_HALF + .4 || lakeDist(hit.x, hit.z) < .5) { waterUniforms.uRip.value.set(hit.x, hit.z, now, 0); lastRip = now; }
}
const lanternBodies = () => lanterns.map(l => l.body);
let overLantern = null;
function pickLantern(e){
  ndc.set(e.clientX / VW.w * 2 - 1, -(e.clientY / VW.h) * 2 + 1); ray.setFromCamera(ndc, camera);
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

/* ---------------- bichos da mata ----------------
   Vida de fundo, sem roubar a cena: corça e filhote na campina da borda, coruja num tronco
   seco da trilha, peixes pulando no rio, coelho na segunda trilha, cervo pastando do outro lado
   do lago e um bando de pássaros cruzando a lua. Tudo geometria simples feita aqui.
   Movimento reduzido: cada bicho fica parado numa pose natural. */
const animals = [];
const furMat = (c) => new THREE.MeshStandardMaterial({ color:c, roughness:.92, metalness:0 });
const cyl = (r0, r1, h, mat, seg = 7) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, seg), mat); return m; };
const shade = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = !LOW; c.receiveShadow = false; } }); return o; };
const ease = t => t * t * (3 - 2 * t);

// veado: corpo, pescoço articulado, cabeça, quatro pernas com joelho, rabo; galhada opcional
function makeDeer({ stag = false, size = 1 } = {}){
  const fur = furMat(stag ? '#46372b' : '#4d3c2f'), dark = furMat('#221a15'), pale = furMat('#7d6d5c');
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 12), fur); torso.scale.set(.36, .4, .92); torso.position.set(0, 1.02, 0); body.add(torso);
  const rump = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), pale); rump.position.set(0, 1.05, -.44); rump.scale.set(.8, .9, .35); body.add(rump);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.05, .16, 6), pale); tail.position.set(0, 1.14, -.5); tail.rotation.x = -2.4; body.add(tail);
  const neck = new THREE.Group(); neck.position.set(0, 1.18, .38); body.add(neck);
  const nk = cyl(.11, .075, .58, fur); nk.position.set(0, .26, .05); nk.rotation.x = .38; neck.add(nk);
  const head = new THREE.Group(); head.position.set(0, .56, .16); neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 10), fur); skull.scale.set(.9, .9, 1.1); head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(.075, .26, 9), fur); snout.rotation.x = Math.PI / 2 + .35; snout.position.set(0, -.05, .17); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), dark); nose.position.set(0, -.11, .29); head.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .17, 6), fur); ear.scale.z = .45; ear.position.set(sx * .1, .1, -.02); ear.rotation.z = -sx * .9; head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), dark); eye.position.set(sx * .075, .02, .07); head.add(eye);
    if (stag) {
      const beam = cyl(.018, .01, .42, pale, 5); beam.position.set(sx * .1, .3, -.06); beam.rotation.set(-.35, 0, -sx * .45); head.add(beam);
      for (const [y, a] of [[.12, .9], [.25, .6], [.36, 1.1]]) { const tine = cyl(.012, .006, .17, pale, 4); tine.position.set(sx * (.1 + y * .42), .14 + y * .62, -.05 + y * .1); tine.rotation.set(.5, 0, -sx * a); head.add(tine); }
    }
  }
  const legs = [];
  for (const [x, z, front] of [[-.13, .36, 1], [.13, .36, 1], [-.13, -.36, 0], [.13, -.36, 0]]) {
    const hip = new THREE.Group(); hip.position.set(x, .98, z); body.add(hip);
    const up = cyl(.05, .032, .5, fur); up.position.y = -.25; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -.5; hip.add(knee);
    const low = cyl(.024, .018, .48, fur); low.position.y = -.24; knee.add(low);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(.03, .036, .05, 6), dark); hoof.position.y = -.48; knee.add(hoof);
    legs.push({ hip, knee, front });
  }
  g.scale.setScalar(size);
  return { g: shade(g), neck, head, legs, tail, body };
}
// anda entre pontos, para e pasta, levanta a cabeça quando a câmera chega perto
function deerLife(d, path, { speed = .7, phase = 0, wait = [3, 7] } = {}){
  const R = rng(91 + phase * 7); let i = 0, s = 0, pause = 2 + R() * 3, walking = false, step = phase, graze = 1, look = 0;
  const at = new THREE.Vector3(), seg = () => [path[i % path.length], path[(i + 1) % path.length]];
  const place = () => { const [a, b] = seg(), L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(1, s / L);
    at.set(lerp(a[0], b[0], k), 0, lerp(a[1], b[1], k)); at.y = height(at.x, at.z);
    d.g.position.copy(at); const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); d.g.rotation.y += (yaw - d.g.rotation.y) * .08; return L; };
  d.g.rotation.y = Math.atan2(path[1][0] - path[0][0], path[1][1] - path[0][1]);
  place(); scene.add(d.g);
  return (t, dt, live) => {
    if (live) {
      if (walking) { s += speed * dt; step += dt * speed * 5.2; const L = place(); if (s >= L) { s = 0; i++; walking = false; pause = wait[0] + R() * (wait[1] - wait[0]); } }
      else { pause -= dt; if (pause <= 0) walking = true; }
    }
    const near = camera.position.distanceTo(d.g.position);
    look = lerp(look, near < 26 ? 1 : 0, live ? 1 - Math.exp(-dt * 1.5) : 1);
    graze = lerp(graze, walking ? .25 : 1 - look, live ? 1 - Math.exp(-dt * 1.8) : 1);
    d.neck.rotation.x = graze * 1.25 - .1;                           // cabeça baixa = pastando
    d.head.rotation.x = graze * .35;
    d.head.rotation.y = look * Math.sin(t * .4 + phase) * .5;
    d.tail.rotation.z = live ? Math.sin(t * 9 + phase) * .25 * (Math.sin(t * .7 + phase) > .6 ? 1 : 0) : 0;
    const w = walking && live ? 1 : 0;
    d.legs.forEach(l => { const p = step + (l.front ? 0 : Math.PI) + (l.hip.position.x > 0 ? Math.PI * .5 : 0);
      l.hip.rotation.x = Math.sin(p) * .42 * w; l.knee.rotation.x = (l.front ? -1 : 1) * Math.max(0, Math.cos(p)) * .55 * w; });
    d.body.position.y = w * Math.abs(Math.sin(step)) * .025;
  };
}
// corça e filhote na campina da borda (à direita: a esquerda fica para o texto da abertura)
{
  const path = [[6, 79], [10, 77.5], [13, 75.5], [10.5, 74.5], [7, 76]];
  const doe = makeDeer({ size:1 }), fawn = makeDeer({ size:.62 });
  animals.push(deerLife(doe, path, { speed:.55, phase:0, wait:[4, 8] }));
  animals.push(deerLife(fawn, path.map(([x, z]) => [x - 1.6, z + 1.2]), { speed:.6, phase:1.7, wait:[3, 6] }));
}
// cervo pastando na outra margem do lago (aparece no fim, ao lado da lua)
{
  const stag = makeDeer({ stag:true, size:1.15 });
  animals.push(deerLife(stag, [[70, -113], [78, -112], [86, -113.5], [78, -114.5]], { speed:.45, phase:3, wait:[6, 11] }));
}

// coruja num tronco seco ao lado da trilha: vira a cabeça para quem passa e pisca
{
  const s0 = S.manifesto + 11, p = trailAt(s0), n = trailAt(s0 + 1).sub(p).normalize();
  const x = p.x + n.z * 3.4, z = p.z - n.x * 3.4, y = height(x, z);
  const wood = furMat('#3a2f27'), owl = new THREE.Group();
  const snag = cyl(.17, .12, 2.1, wood, 8); snag.position.set(x, y + 1.05, z); scene.add(shade(snag));
  const top = new THREE.Mesh(new THREE.ConeGeometry(.12, .25, 7), wood); top.position.set(x + .03, y + 2.2, z); top.rotation.z = .3; scene.add(top);
  const feather = furMat('#6d5c4b'), face = furMat('#b8a58b'), eyeM = new THREE.MeshStandardMaterial({ color:'#ffd27a', emissive:'#ffb640', emissiveIntensity:2.4 });
  const bodyO = new THREE.Mesh(new THREE.SphereGeometry(.17, 14, 12), feather); bodyO.scale.set(1, 1.35, .9); bodyO.position.y = .22; owl.add(bodyO);
  const headO = new THREE.Group(); headO.position.y = .5; owl.add(headO);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.14, 14, 12), feather); hd.scale.set(1.1, .95, 1); headO.add(hd);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(.12, 16), face); disc.position.z = .118; disc.scale.set(1.15, .9, 1); headO.add(disc);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(.032, 10, 8), eyeM); e.position.set(sx * .052, .015, .125); headO.add(e); eyes.push(e);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(.035, .12, 5), feather); tuft.position.set(sx * .09, .15, 0); tuft.rotation.z = -sx * .35; headO.add(tuft);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.02, .06, 5), furMat('#3a3026')); beak.rotation.x = Math.PI / 2 + .6; beak.position.set(0, -.035, .14); headO.add(beak);
  owl.position.set(x, y + 2.1, z); scene.add(shade(owl));
  let yaw = 0, blink = 9;
  animals.push((t, dt, live) => {
    const d = camera.position.clone().sub(owl.position), want = Math.atan2(d.x, d.z);
    const near = d.length() < 40 ? 1 : 0;
    yaw = lerp(yaw, near ? want : want + .9, live ? 1 - Math.exp(-dt * 2.2) : 1);
    headO.rotation.y = yaw; bodyO.rotation.y = yaw * .3;
    headO.rotation.z = live ? Math.sin(t * .8) * .08 : 0;
    if (live) { blink -= dt; if (blink < 0) blink = 3 + Math.random() * 5; }
    const b = live && blink < .14 ? .1 : 1; eyes.forEach(e => e.scale.y = b);
  });
}

// peixes que pulam no rio, perto da margem da trilha, com onda na água
{
  const fishM = new THREE.MeshStandardMaterial({ color:'#9fd6d2', emissive:'#3fb7aa', emissiveIntensity:.5, roughness:.35, metalness:.3 });
  const fish = new THREE.Group();
  const fb = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), fishM); fb.scale.set(.45, .6, 1.4); fish.add(fb);
  const ft = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 4), fishM); ft.rotation.x = -Math.PI / 2; ft.position.z = -.22; ft.scale.x = .3; fish.add(ft);
  fish.visible = false; scene.add(fish);
  let next = 3, jt = -1, from = new THREE.Vector3(), dir = 1;
  animals.push((t, dt, live) => {
    if (!live) { fish.visible = false; return; }
    if (jt < 0) {
      next -= dt; if (next > 0 || riverFocus(sNow) < .4) return;
      // nasce na frente da câmera, entre a margem e o meio do rio
      const ax = camera.position.x + 6 + Math.random() * 12; from.set(ax, WATER_Y, riverZ(ax) + (Math.random() - .3) * 2.2); dir = Math.random() < .5 ? 1 : -1; jt = 0;
      if (U.uTime.value - lastRip > 1) waterUniforms.uRip.value.set(from.x, from.z, U.uTime.value, 0);
    }
    jt += dt / .9;
    const k = Math.min(1, jt);
    fish.visible = true;
    fish.position.set(from.x + dir * k * 1.3, WATER_Y + Math.sin(k * Math.PI) * .75 - .05, from.z);
    fish.rotation.set(-Math.cos(k * Math.PI) * 1.1, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 'YXZ');
    if (k >= 1) { jt = -1; next = 2.5 + Math.random() * 4; fish.visible = false;
      if (U.uTime.value - lastRip > 1) waterUniforms.uRip.value.set(fish.position.x, fish.position.z, U.uTime.value, 0); }
  });
}

// coelho ao lado da segunda trilha: pulinhos curtos, para, mexe as orelhas
{
  const fur = furMat('#8a7764'), white = furMat('#d9cdbd'), rab = new THREE.Group();
  const rb = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), fur); rb.scale.set(.85, .8, 1.15); rb.position.y = .12; rab.add(rb);
  const rh = new THREE.Group(); rh.position.set(0, .23, .13); rab.add(rh);
  rh.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), fur), {}));
  const ears = [];
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .13, 3, 6), fur); e.position.set(sx * .035, .12, -.02); e.rotation.z = -sx * .15; rh.add(e); ears.push(e); }
  const tl = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), white); tl.position.set(0, .14, -.15); rab.add(tl);
  rab.scale.setScalar(1.15); scene.add(shade(rab));
  const sA = S.aboutStart + 4, sB = S.aboutEnd - 4, R = rng(55);
  const spot = () => { const s = lerp(sA, sB, R()), p = trailAt(s), n = trailAt(s + 1).sub(p).normalize(), off = (R() < .5 ? -1 : 1) * (2 + R() * 2.5);
    const x = p.x + n.z * off, z = p.z - n.x * off; return new THREE.Vector3(x, height(x, z), z); };
  let cur = spot(), goal = spot(), hop = -1, rest = 1, hopFrom = cur.clone();
  const hopTo = new THREE.Vector3();
  animals.push((t, dt, live) => {
    if (live) {
      if (hop < 0) { rest -= dt; if (rest <= 0) {
        if (cur.distanceTo(goal) < .5) goal = spot();
        hopFrom.copy(cur); hopTo.copy(goal).sub(cur); const L = Math.min(.7, hopTo.length()); hopTo.setLength(L).add(cur); hopTo.y = height(hopTo.x, hopTo.z); hop = 0;
        rab.rotation.y = Math.atan2(hopTo.x - cur.x, hopTo.z - cur.z); } }
      else { hop += dt / .32; const k = Math.min(1, hop); cur.lerpVectors(hopFrom, hopTo, k); cur.y += Math.sin(k * Math.PI) * .22;
        if (k >= 1) { hop = -1; cur.y = hopTo.y; rest = R() < .25 ? 1.5 + R() * 2.5 : .12 + R() * .2; } }
    }
    rab.position.copy(cur);
    ears.forEach((e, i) => e.rotation.x = live ? Math.max(0, Math.sin(t * 3 + i)) * .3 * (hop < 0 ? 1 : .2) : 0);
  });
}

// bando de pássaros cruzando a lua de tempos em tempos
{
  const birdM = new THREE.MeshBasicMaterial({ color:'#0b1a22', fog:false, side:THREE.DoubleSide });
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .25, 0, 0, -.25, 1.2, 0, -.05], 3));
  const flock = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group(), l = new THREE.Mesh(wingG, birdM), r = new THREE.Mesh(wingG, birdM); r.scale.x = -1;
    const bd = new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 4), birdM); bd.scale.set(.6, .5, 1.6); b.add(l, r, bd);
    b.userData = { l, r, off:new THREE.Vector3((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2.2, (R0() - .5) * 1.4, -Math.ceil(i / 2) * 2.4), ph:R0() * 6 };
    b.visible = false; b.renderOrder = -8; scene.add(b); flock.push(b);
  }
  const side = new THREE.Vector3(), upv = new THREE.Vector3(), c = new THREE.Vector3();
  animals.push((t, dt, live) => {
    const cyc = (t % 34) / 34, on = live && cyc < .42;          // passa por ~14 s a cada 34 s
    side.crossVectors(MOON_DIR, up).normalize(); upv.crossVectors(side, MOON_DIR).normalize();
    const k = cyc / .42;
    c.copy(camera.position).addScaledVector(MOON_DIR, 260).addScaledVector(side, lerp(-150, 150, k)).addScaledVector(upv, Math.sin(k * Math.PI) * 18 - 14);
    flock.forEach(b => {
      b.visible = on;
      if (!on) return;
      b.position.copy(c).addScaledVector(side, b.userData.off.z * 2.2).addScaledVector(upv, b.userData.off.y * 2 + Math.abs(b.userData.off.x) * .4);
      b.lookAt(b.position.clone().add(side)); b.scale.setScalar(2.4);
      const f = Math.sin(t * 9 + b.userData.ph) * .7; b.userData.l.rotation.z = f; b.userData.r.rotation.z = -f;
    });
  });
}

/* ---------------- quadro a quadro ---------------- */
let needs = true, last = performance.now(), frameAvg = 16, frames = 0, prSteps = 0, ready = false, litCard = null;
addEventListener('scroll', () => { needs = true; }, { passive:true });
function applySize(){
  renderer.setPixelRatio(pr); renderer.setSize(VW.w, VW.h, false);
  composer.setPixelRatio(pr); composer.setSize(VW.w, VW.h);
  flies.uniforms.uPR.value = pr;
}
function resize(){
  const v = view(); if (v.w === VW.w && v.h === VW.h) { measure(); return; }
  VW = v;
  camera.aspect = VW.w / VW.h; camera.fov = fovFor(); camera.updateProjectionMatrix();
  applySize(); bloom.resolution.set(VW.w / 2, VW.h / 2); composer.passes[1].uniforms.uTexel.value.set(1 / VW.w, 1 / VW.h); measure();
  needs = true; tick(performance.now());          // desenha já: nada de quadro vazio
}
new ResizeObserver(resize).observe(canvas);
// se o navegador derrubar o contexto (memória da GPU), mostra o fundo pintado até ele voltar
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); root.classList.add('world-lost'); });
canvas.addEventListener('webglcontextrestored', () => { root.classList.remove('world-lost'); needs = true; });
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

  // bichos
  for (const a of animals) a(U.uTime.value, dt, live);
  // vegetação além da névoa não é desenhada
  for (const c of chunks) { const b = c.mesh.boundingSphere; c.mesh.visible = camera.position.distanceTo(b.center) - b.radius < c.far; }
  // resolução adaptativa: se o quadro pesar, reduz a densidade de pixels.
  // O ajuste acontece antes do desenho (redimensionar depois deixaria o quadro vazio = pisca preto),
  // só desce, e no máximo 3 vezes — sem oscilar.
  if (live && dt < .049) {
    frameAvg = lerp(frameAvg, dt * 1000, .04); frames++;
    if (frames > 150 && prSteps < 3 && frameAvg > 26 && pr > .75) { frames = 0; prSteps++; pr = Math.max(.75, pr - .2); applySize(); }
    else if (frames > 150) frames = 0;
  }
  composer.render();
  if (debug.onFrame) { const f = debug.onFrame; debug.onFrame = null; f(canvas); }

  if (!ready) { ready = true; requestAnimationFrame(() => root.classList.add('world-ready')); }
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
requestAnimationFrame(frame);
window.LicyaWorld = { scene, camera, renderer, composer, trailLen, S, debug, get s(){ return sNow; } };
}
