/* Licya Oliveira — versão III, "Floresta". Ambiente e movimento.
   Tudo aqui é aprimoramento: conteúdo, links, filtros e painel funcionam
   sem este arquivo (app.js). Com movimento reduzido a mata é desenhada,
   mas fica parada — sem borboletas, vaga-lumes nem animais andando.

   Mapa (gatilho → mudança → propósito):
   · carregamento → a névoa se abre, a mata sobe em camadas, o nome se forma → entrada na floresta
   · rolagem/cursor → camadas se deslocam em velocidades diferentes → profundidade
   · velocidade do cursor → as árvores da frente se curvam ao "vento" → a mata reage ao visitante
   · cursor nas seções escuras → borboletas nascem no caminho e seguem o cursor; paradas, circulam
     em volta dele; ao sair, voam embora → assinatura interativa
   · clique/toque na mata → revoada de borboletas → recompensa lúdica
   · tempo → cervo atravessa, pasta, ergue a cabeça; foge se o cursor chega rápido; bandos de pássaros
   · cursor perto da coruja → ela acompanha com os olhos; perto da raposa → ela se esconde
   · cards → vaga-lumes se juntam em volta do projeto em foco
   · seções claras → folhas caem, empurradas pelo cursor
   · trilha da trajetória → a linha cresce com a leitura e cada etapa brota */
(() => {
'use strict';
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const on = () => root.dataset.motion === 'on';
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const P = () => window.LicyaPortfolio || {};
const TAU = Math.PI * 2;
function seeded(s){ return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f1 = n => n.toFixed(1);

/* ============================================================
   1. A MATA — silhuetas desenhadas por código (leves e nítidas)
   ============================================================ */
function pine(x, gy, h, w, R, tiers){
  const top = gy - h, n = tiers || 5 + (R() * 4 | 0), step = h * .92 / n;
  const right = [], left = [];
  for (let i = 1; i <= n; i++){
    const f = i / n, y = top + h * .92 * f, hw = w / 2 * Math.pow(f, .85);
    right.push([x + hw * (.85 + R() * .3), y + h * .03]);
    left.push([x - hw * (.85 + R() * .3), y + h * .03]);
    if (i < n){ right.push([x + hw * .4, y + step * .2]); left.push([x - hw * .4, y + step * .2]); }
  }
  const tw = Math.max(1.4, w * .05);
  let d = `M${f1(x)} ${f1(top)}`;
  right.forEach(p => d += `L${f1(p[0])} ${f1(p[1])}`);
  d += `L${f1(x + tw)} ${f1(gy + 4)}L${f1(x - tw)} ${f1(gy + 4)}`;
  left.reverse().forEach(p => d += `L${f1(p[0])} ${f1(p[1])}`);
  return d + 'Z';
}
function ridgePath({ W = 1600, H, count, min, max, seed, clearing = 0, flat = false }){
  const R = seeded(seed), off = R() * 6;
  const ground = x => flat ? H - 2 : H - H * .07 + Math.sin(x / W * TAU * 1.3 + off) * H * .025 + (clearing ? Math.exp(-Math.pow((x / W - .5) / .14, 2)) * H * .05 : 0);
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 40) d += `L${x} ${f1(ground(x))}`;
  d += `L${W} ${H}Z`;
  for (let i = 0; i < count; i++){
    const x = (i + R() * .9) * W / count, c = Math.abs(x / W - .5);
    if (clearing === 2 && c < .17) continue;
    let h = H * (min + R() * (max - min));
    if (clearing === 1 && c < .2) h *= .55 + c * 2;
    d += pine(x, ground(x) + 2, h, h * (.3 + R() * .14), R);
  }
  return d;
}
function grassPath(W, H, seed){
  const R = seeded(seed);
  let d = `M0 ${H}L0 ${H * .55}`;
  for (let x = 0; x <= W; x += 6 + R() * 6){
    const edge = 1 + Math.pow(Math.abs(x / W - .5) * 2, 2) * 1.2;
    const h = (H * .25 + R() * H * .45) * edge, lean = (R() - .5) * 14;
    d += `L${f1(x - 3)} ${f1(H * .55)}L${f1(x + lean)} ${f1(H * .55 - h)}L${f1(x + 3)} ${f1(H * .55)}`;
  }
  return d + `L${W} ${H}Z`;
}
const svg = (vb, inner, par = 'xMidYMax slice') => `<svg viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false">${inner}</svg>`;

const LAYERS = {
  1:{ H:550, count:64, min:.35, max:.78, seed:11 },
  2:{ H:440, count:44, min:.4, max:.85, seed:23 },
  3:{ H:350, count:30, min:.45, max:.92, seed:37, clearing:1 },
  4:{ H:216, count:18, min:.55, max:1, seed:41, clearing:2 }
};
function buildForest(){
  $$('[data-ridge]').forEach(el => {
    const n = +el.dataset.ridge, c = `var(--l${n})`;
    if (n === 5) { el.innerHTML = svg('0 0 1600 112', `<path style="fill:${c}" d="${grassPath(1600, 112, 53)}"/>`); return; }
    const o = LAYERS[n];
    el.innerHTML = svg(`0 0 1600 ${o.H}`, `<path style="fill:${c}" d="${ridgePath(o)}"/>`);
  });
  $$('[data-tree]').forEach((el, i) => {
    const R = seeded(i ? 77 : 71);
    const tree = pine(200, 1196, 1150, 380, R, 17) + `M196 1200V260h8v940Z`;
    el.innerHTML = svg('0 0 400 1200', `<g class="sway"><path style="fill:#061522" d="${tree}"/></g>`, 'xMidYMax meet');
  });
  $$('[data-divider]').forEach((el, i) => {
    const c = el.dataset.divider;
    el.innerHTML = svg('0 0 1600 170',
      `<path fill="${c}" opacity=".45" d="${ridgePath({ H:170, count:46, min:.35, max:1, seed:90 + i, flat:true })}"/>` +
      `<path fill="${c}" d="${ridgePath({ H:170, count:70, min:.2, max:.78, seed:101 + i, flat:true })}"/>`);
  });
  const shore = $('[data-shore]');
  if (shore) {
    const d = ridgePath({ H:300, count:60, min:.3, max:.82, seed:131, flat:true });
    shore.innerHTML = svg('0 0 1600 300', `<path fill="#0b2c3b" d="${d}"/>`);
    const water = $('.water');
    if (water && !$('.shore-reflect', water)) {
      const r = document.createElement('div');
      r.className = 'shore-reflect';
      r.innerHTML = svg('0 0 1600 300', `<path fill="#0b2c3b" d="${d}"/>`);
      water.prepend(r);
    }
  }
  const rings = $('.rings');
  if (rings) {
    const R = seeded(7); let paths = '';
    for (let i = 1; i <= 17; i++){
      const r = 22 * i + R() * 8, k = 3 + (R() * 4 | 0), ph = R() * TAU; let d = '';
      for (let a = 0; a <= 360; a += 5){
        const t = a / 180 * Math.PI, rr = r + Math.sin(t * k + ph) * r * .018 + Math.sin(t * 2 + ph) * 3;
        d += `${a ? 'L' : 'M'}${f1(400 + Math.cos(t) * rr)} ${f1(400 + Math.sin(t) * rr)}`;
      }
      paths += `<path d="${d}Z"/>`;
    }
    rings.innerHTML = `<svg viewBox="0 0 800 800" aria-hidden="true">${paths}</svg>`;
  }
}

/* nome letra a letra (um único nome acessível) */
function splitName(){
  const h = $('#hero-title'); if (!h || h.dataset.split) return;
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  let i = 0;
  $$('.name-first, .name-last', h).forEach(part => {
    part.setAttribute('aria-hidden', 'true');
    part.innerHTML = [...part.textContent].map(ch => `<span class="lt" style="--i:${i++}">${ch}</span>`).join('');
  });
  h.dataset.split = '1';
}

/* ============================================================
   2. PEÇAS HERDADAS DA VERSÃO II (títulos, selos, cards, botões)
   ============================================================ */
const headObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-revealed'); headObs.unobserve(e.target); }
}), { rootMargin:'0px 0px -12% 0px' });
function maskHeadings(){
  $$('main h2:not(.sr-only)').forEach(h => {
    [...h.children].forEach(child => {
      if (child.parentElement.classList.contains('mask')) return;
      const m = document.createElement('span'); m.className = 'mask';
      child.replaceWith(m); m.append(child);
    });
    headObs.observe(h);
  });
}
function craftSeals(){
  const { works, seal } = P(); if (!works) return;
  $$('.craft').forEach(c => {
    let box = $('.craft-seals', c);
    if (!box) { box = document.createElement('span'); box.className = 'craft-seals'; box.setAttribute('aria-hidden', 'true'); $('.craft-count', c).before(box); }
    box.innerHTML = works.filter(w => w.group === c.dataset.filter).map(seal).join('');
    $$('img', box).forEach(i => { i.alt = ''; });
  });
}
function craftIcons(){
  $$('.craft-icon path').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch {} });
  $$('.craft').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--cx', `${e.clientX - r.left}px`); c.style.setProperty('--cy', `${e.clientY - r.top}px`);
  }));
}
function splitMail(){
  const m = $('.mail'); if (!m || m.dataset.split) return;
  const text = m.textContent; m.setAttribute('aria-label', text);
  m.innerHTML = [...text].map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
  m.dataset.split = '1';
}
const cardObs = new IntersectionObserver(es => {
  es.filter(e => e.isIntersecting).map(e => e.target).forEach((c, i) => {
    c.style.setProperty('--d', `${i * 110}ms`);
    c.classList.add('shown'); c.classList.remove('pre'); cardObs.unobserve(c);
    setTimeout(() => { c.classList.remove('shown'); c.style.removeProperty('--d'); }, 2400 + i * 110);
  });
}, { rootMargin:'0px 0px -8% 0px' });
let firstBrands = true;
function prepareBrands(){
  cardObs.disconnect();
  if (!on() || !firstBrands) { firstBrands = false; return; }
  firstBrands = false;
  $$('.brand-card').forEach(c => { c.classList.add('pre'); cardObs.observe(c); });
}
const pill = document.createElement('div');
pill.className = 'cursor-pill'; pill.setAttribute('aria-hidden', 'true'); pill.innerHTML = '<i></i><span></span>';
document.body.append(pill);
let pillOn = false, hoverCard = null;
function bindCards(){
  $$('.brand-card a').forEach(a => {
    if (a.dataset.motion) return; a.dataset.motion = '1';
    a.addEventListener('pointerenter', () => {
      hoverCard = a;
      if (!on() || !fine) return;
      pillOn = true; $('span', pill).textContent = P().lang?.() === 'en' ? 'View project' : 'Ver projeto';
      pill.classList.add('is-on'); a.classList.add('is-tilting');
    });
    a.addEventListener('pointermove', e => {
      if (!on() || !fine) return;
      const r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      a.style.setProperty('--ry', `${(x - .5) * 7}deg`); a.style.setProperty('--rx', `${(.5 - y) * 6}deg`);
      a.style.setProperty('--lx', `${x * 100}%`); a.style.setProperty('--ly', `${y * 100}%`);
    });
    a.addEventListener('pointerleave', () => {
      hoverCard = null; pillOn = false; pill.classList.remove('is-on'); a.classList.remove('is-tilting');
      ['--rx','--ry'].forEach(p => a.style.removeProperty(p));
    });
    a.addEventListener('focus', () => { hoverCard = a; });
    a.addEventListener('blur', () => { if (hoverCard === a) hoverCard = null; });
  });
}
function bindMagnets(){
  if (!fine) return;
  $$('.btn-solid, .btn-ghost, .btn-light, .btn-outline, .sheet-close').forEach(b => {
    if (b.dataset.magnet) return; b.dataset.magnet = '1';
    b.addEventListener('pointermove', e => {
      if (!on()) return;
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ============================================================
   3. PONTEIRO COMPARTILHADO
   ============================================================ */
const ptr = { x:-999, y:-999, vx:0, vy:0, moved:0, inside:false, swarm:null, hist:[] };
addEventListener('pointermove', e => {
  ptr.vx = e.clientX - ptr.x; ptr.vy = e.clientY - ptr.y;
  if (ptr.x < -900) { ptr.vx = ptr.vy = 0; }
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = performance.now(); ptr.inside = true;
  if (e.pointerType === 'mouse') ptr.swarm = e.target.closest?.('[data-swarm]') || null;
}, { passive:true });
document.addEventListener('pointerleave', () => { ptr.inside = false; ptr.swarm = null; });
addEventListener('blur', () => { ptr.inside = false; ptr.swarm = null; });
let scrollProbe = 0;
addEventListener('scroll', () => {
  const now = performance.now();
  if (!fine || !ptr.inside || now - scrollProbe < 120) return;
  scrollProbe = now;
  const el = document.elementFromPoint(ptr.x, ptr.y);
  ptr.swarm = el?.closest?.('[data-swarm]') || null;
}, { passive:true });

/* ============================================================
   4. VAGA-LUMES — um canvas por cena, pausado fora da tela
   ============================================================ */
const glow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(250,255,215,1)'); gr.addColorStop(.12, 'rgba(233,247,184,.9)');
  gr.addColorStop(.35, 'rgba(150,230,210,.28)'); gr.addColorStop(1, 'rgba(95,180,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
})();
class Fireflies {
  constructor(canvas){
    this.c = canvas; this.g = canvas.getContext('2d'); this.visible = false;
    this.rise = canvas.hasAttribute('data-rise');
    this.base = +canvas.dataset.count || 30; this.ps = []; this.resize();
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(canvas);
  }
  resize(){
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.w = this.c.clientWidth; this.h = this.c.clientHeight;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(this.base * clamp(this.w / 1400, .5, 1.1));
    while (this.ps.length < n) this.ps.push(this.spawn(true));
    this.ps.length = n;
  }
  spawn(any){
    return { x:rand(0, this.w), y:any ? rand(this.h * .15, this.h) : this.h + 10, vx:rand(-.3, .3), vy:rand(-.3, .3),
      ph:rand(0, TAU), sp:rand(.6, 1.8), s:rand(10, 22), k:Math.random() };
  }
  step(t){
    const g = this.g, r = this.c.getBoundingClientRect();
    g.clearRect(0, 0, this.w, this.h);
    const lx = ptr.x - r.left, ly = ptr.y - r.top, lantern = fine && ptr.inside && lx > 0 && ly > 0 && lx < this.w && ly < this.h;
    let card = null;
    if (hoverCard && this.c.parentElement.contains(hoverCard)) {
      const cr = hoverCard.getBoundingClientRect();
      card = { x:cr.left - r.left, y:cr.top - r.top, w:cr.width, h:cr.height };
    }
    g.globalCompositeOperation = 'lighter';
    this.ps.forEach((p, i) => {
      p.vx += (Math.random() - .5) * .06; p.vy += (Math.random() - .5) * .06 - (this.rise ? .004 : 0);
      if (card && i % 2 === 0) {
        const a = p.k * TAU + t * .0004, tx = card.x + card.w / 2 + Math.cos(a) * (card.w / 2 + 14), ty = card.y + card.h / 2 + Math.sin(a) * (card.h / 2 + 14);
        p.vx += (tx - p.x) * .0016; p.vy += (ty - p.y) * .0016;
      } else if (lantern) {
        const dx = lx - p.x, dy = ly - p.y, d = Math.hypot(dx, dy);
        if (d < 220 && d > 30) { p.vx += dx / d * .03; p.vy += dy / d * .03; }
      }
      p.vx *= .97; p.vy *= .97;
      const sp = Math.hypot(p.vx, p.vy); if (sp > 1.6) { p.vx *= 1.6 / sp; p.vy *= 1.6 / sp; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = this.w + 20; if (p.x > this.w + 20) p.x = -20;
      if (p.y < -20) Object.assign(p, this.spawn(false)); if (p.y > this.h + 20) p.y = -10;
      const f = .5 + .5 * Math.sin(t * .001 * p.sp * 2 + p.ph), a = .15 + .85 * f * f * f;
      g.globalAlpha = a; g.drawImage(glow, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    });
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  clear(){ this.g.clearRect(0, 0, this.w, this.h); }
}

/* ============================================================
   5. CAMADA VIVA — borboletas, folhas e pólen sobre a página
   ============================================================ */
const life = $('.life'), lg = life.getContext('2d');
let LW = 0, LH = 0;
function sizeLife(){
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  LW = innerWidth; LH = innerHeight; life.width = Math.round(LW * dpr); life.height = Math.round(LH * dpr);
  lg.setTransform(dpr, 0, 0, dpr, 0, 0);
}
const UPPER = new Path2D('M0 -2C6 -16 22 -18 21 -6C20 0 9 1 0 1Z');
const LOWER = new Path2D('M0 1C11 2 16 12 9 15C4 17 1 10 0 5Z');
const VEIN = new Path2D('M1 -1C7 -8 14 -11 19 -8M1 2C6 5 9 9 9 13');
const LEAF = new Path2D('M0 -10Q8 -2 0 10Q-8 -2 0 -10Z');
function wingFill(stops){
  const g = lg.createRadialGradient(4, -3, 1, 6, -1, 23);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}
let PALETTES = [];
function makePalettes(){
  PALETTES = [
    wingFill(['#eefaff','#8dd2ff','#3f86f0','#173a8a','#071631']),
    wingFill(['#f2fffb','#9fe6d6','#3aa7a2','#155660','#06202a']),
    wingFill(['#ffffff','#d4ecff','#8ab8f0','#3a5fa0','#0d1d3d'])
  ];
}
const bfs = [], leaves = [], pollen = [];
const MAX_FOLLOW = fine ? 14 : 6;
let followers = 0, travel = 0, lastPX = 0, lastPY = 0;
function addButterfly(x, y, mode, extra = {}){
  const b = Object.assign({ x, y, vx:rand(-1, 1), vy:rand(-1.6, -.4), rot:0, size:rand(.55, .95), ph:rand(0, TAU),
    alpha:0, fade:1, mode, pal:PALETTES[(Math.random() * PALETTES.length) | 0], orbit:rand(26, 70), os:rand(.9, 1.7) * (Math.random() < .5 ? -1 : 1),
    born:performance.now(), wx:rand(0, LW), wy:rand(0, LH), idx:0 }, extra);
  if (mode === 'follow') b.idx = followers++;
  bfs.push(b); return b;
}
function release(){
  bfs.forEach(b => {
    if (b.mode !== 'follow' && b.mode !== 'burst') return;
    if (bfs.filter(o => o.mode === 'wander').length < 3 && Math.random() < .35) { b.mode = 'wander'; b.wx = rand(0, LW); b.wy = rand(0, LH * .6); }
    else { b.mode = 'flee'; b.dir = Math.random() < .5 ? -1 : 1; }
  });
  followers = 0;
}
function burst(x, y, n){
  for (let i = 0; i < n; i++){
    const a = i / n * TAU + rand(-.3, .3), s = rand(3, 6);
    addButterfly(x, y, 'burst', { vx:Math.cos(a) * s, vy:Math.sin(a) * s - 1, alpha:.2, size:rand(.7, 1.1), anchorX:x, anchorY:y });
  }
}
function drawButterfly(b, t){
  const speed = Math.hypot(b.vx, b.vy);
  b.ph += .32 + Math.min(speed, 6) * .06;
  const flap = Math.abs(Math.cos(b.ph)) * .82 + .18;
  const target = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  let dr = target - b.rot; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); b.rot += dr * .12;
  lg.save(); lg.translate(b.x, b.y); lg.rotate(b.rot); lg.scale(b.size, b.size); lg.globalAlpha = b.alpha;
  for (const side of [1, -1]) {
    lg.save(); lg.scale(side * flap, 1);
    lg.fillStyle = b.pal; lg.fill(UPPER); lg.fill(LOWER);
    lg.strokeStyle = 'rgba(4,14,26,.55)'; lg.lineWidth = .8; lg.stroke(UPPER); lg.stroke(LOWER);
    lg.strokeStyle = 'rgba(255,255,255,.22)'; lg.lineWidth = .5; lg.stroke(VEIN);
    lg.restore();
  }
  lg.fillStyle = '#081624'; lg.beginPath(); lg.ellipse(0, 3, 1.3, 7.5, 0, 0, TAU); lg.fill();
  lg.strokeStyle = 'rgba(8,22,36,.8)'; lg.lineWidth = .7; lg.beginPath();
  lg.moveTo(-.5, -4); lg.quadraticCurveTo(-2, -9, -4, -11); lg.moveTo(.5, -4); lg.quadraticCurveTo(2, -9, 4, -11); lg.stroke();
  lg.restore();
}
function stepButterflies(t){
  const now = performance.now(), idle = now - ptr.moved > 420;
  const n = Math.max(1, followers);
  for (let i = bfs.length - 1; i >= 0; i--){
    const b = bfs[i];
    let tx, ty, k = .012, max = 6.5;
    if (b.mode === 'follow') {
      if (idle) {
        const a = t * .0016 * b.os + b.idx * TAU / n;
        tx = ptr.x + Math.cos(a) * b.orbit; ty = ptr.y + Math.sin(a) * b.orbit * .7; k = .02;
      } else {
        const h = ptr.hist, j = Math.max(0, h.length - 1 - (5 + b.idx * 6)), p = h[j] || ptr;
        tx = p.x + Math.sin(t * .004 + b.idx) * 14; ty = p.y + Math.cos(t * .003 + b.idx) * 12;
      }
      b.alpha = Math.min(.95, b.alpha + .05);
    } else if (b.mode === 'burst') {
      k = 0; b.alpha = Math.min(.95, b.alpha + .06);
      if (now - b.born > 900) {
        if (fine && ptr.swarm && followers < MAX_FOLLOW) { b.mode = 'follow'; b.idx = followers++; }
        else if (!fine && now - b.born < 2600) { const a = t * .002 * b.os + b.ph; tx = b.anchorX + Math.cos(a) * b.orbit; ty = b.anchorY + Math.sin(a) * b.orbit * .7; k = .015; }
        else { b.mode = 'flee'; b.dir = Math.random() < .5 ? -1 : 1; }
      }
    } else if (b.mode === 'wander') {
      if (Math.hypot(b.wx - b.x, b.wy - b.y) < 40 || Math.random() < .002) { b.wx = rand(LW * .05, LW * .95); b.wy = rand(LH * .08, LH * .85); }
      tx = b.wx; ty = b.wy; k = .0025; max = 1.8; b.alpha = Math.min(.8, b.alpha + .01);
    } else {
      b.vy -= .06; b.vx += b.dir * .05; b.alpha -= .01; k = 0;
    }
    if (k) { b.vx += (tx - b.x) * k; b.vy += (ty - b.y) * k; }
    b.vy += Math.sin(t * .009 + b.ph) * .12;
    b.vx *= .93; b.vy *= .93;
    const sp = Math.hypot(b.vx, b.vy); if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
    b.x += b.vx; b.y += b.vy;
    if (b.alpha <= 0 || b.y < -80 || b.x < -120 || b.x > LW + 120) { bfs.splice(i, 1); continue; }
    drawButterfly(b, t);
  }
}
let leafClock = 0;
const leafColors = ['#4f8f8a','#7fb3ad','#2f7f8f','#a8cfc8','#356b74'];
function stepLeaves(t, dt){
  if (leafZone && leaves.length < (fine ? 14 : 7) && (leafClock += dt) > 900) {
    leafClock = 0;
    leaves.push({ x:rand(0, LW), y:-20, vy:rand(.5, 1.1), vx:0, sway:rand(20, 60), ph:rand(0, TAU), rot:rand(0, TAU), vr:rand(-.02, .02), s:rand(.6, 1.15), c:leafColors[(Math.random() * leafColors.length) | 0], a:rand(.55, .85) });
  }
  for (let i = leaves.length - 1; i >= 0; i--){
    const l = leaves[i];
    const dx = l.x - ptr.x, dy = l.y - ptr.y, d = Math.hypot(dx, dy);
    if (fine && d < 120) { l.vx += ptr.vx * .02 + dx / d * .25; l.vr += (Math.random() - .5) * .02; }
    l.vx *= .96; l.ph += .018; l.rot += l.vr + Math.cos(l.ph) * .01;
    l.x += l.vx + Math.cos(l.ph) * l.sway * .02; l.y += l.vy;
    if (l.y > LH + 30) { leaves.splice(i, 1); continue; }
    lg.save(); lg.translate(l.x, l.y); lg.rotate(l.rot); lg.scale(l.s * (.6 + .4 * Math.abs(Math.cos(l.ph))), l.s);
    lg.globalAlpha = l.a; lg.fillStyle = l.c; lg.fill(LEAF);
    lg.strokeStyle = 'rgba(12,36,51,.3)'; lg.lineWidth = .7; lg.beginPath(); lg.moveTo(0, -8); lg.lineTo(0, 9); lg.stroke();
    lg.restore();
  }
}
function stepPollen(){
  lg.globalCompositeOperation = 'lighter';
  for (let i = pollen.length - 1; i >= 0; i--){
    const p = pollen[i];
    p.x += p.vx; p.y += p.vy; p.vy -= .01; p.a -= .014;
    if (p.a <= 0) { pollen.splice(i, 1); continue; }
    lg.globalAlpha = p.a; lg.drawImage(glow, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over';
}
let leafZone = false;
const leafSections = new Set();
const leafObs = new IntersectionObserver(es => {
  es.forEach(e => e.isIntersecting ? leafSections.add(e.target) : leafSections.delete(e.target));
  leafZone = leafSections.size > 0;
}, { rootMargin:'-20% 0px -20% 0px' });
$$('[data-leaves]').forEach(s => leafObs.observe(s));

/* cliques e toques na mata: revoada */
document.addEventListener('pointerdown', e => {
  if (!on() || e.target.closest('a,button,input,dialog,.versions')) return;
  const sec = e.target.closest('[data-swarm]'); if (!sec) return;
  burst(e.clientX, e.clientY, fine ? 6 : 4);
});

/* ============================================================
   6. ANIMAIS
   ============================================================ */
const hero = $('.hero'), flock = $('.flock');
let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

/* pássaros em bando cruzando o céu */
let flockTimer = 0;
function spawnFlock(){
  clearTimeout(flockTimer);
  flockTimer = setTimeout(spawnFlock, rand(9000, 17000));
  if (!on() || !heroVisible || document.hidden || !flock) return;
  const W = flock.clientWidth, H = flock.clientHeight, n = 4 + (Math.random() * 5 | 0);
  const ltr = Math.random() < .6, baseY = rand(.1, .7) * H, dur = rand(15000, 23000), scale = rand(.55, 1);
  for (let i = 0; i < n; i++){
    const b = document.createElement('div'); b.className = 'bird';
    b.style.setProperty('--fl', `${rand(.32, .48).toFixed(2)}s`);
    b.innerHTML = '<svg viewBox="0 0 22 12"><g class="wings"><path d="M0 6Q5.5 0 11 6Q16.5 0 22 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></g></svg>';
    flock.append(b);
    const ox = -i * rand(18, 30), oy = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * rand(8, 14);
    const s = scale * rand(.8, 1.1), x0 = ltr ? -80 + ox : W + 80 - ox, x1 = ltr ? W + 120 : -120;
    const a = b.animate([
      { transform:`translate(${x0}px, ${baseY + oy}px) scale(${s})` },
      { transform:`translate(${lerp(x0, x1, .5)}px, ${baseY + oy - rand(20, 50)}px) scale(${s})`, offset:.5 },
      { transform:`translate(${x1}px, ${baseY + oy - rand(0, 60)}px) scale(${s})` }
    ], { duration:dur + i * 200, delay:i * 90, easing:'linear', fill:'both' });
    a.onfinish = () => b.remove();
  }
}

/* cervo: atravessa, para para pastar, ergue a cabeça e segue — foge se o cursor chega rápido */
const deer = $('.deer'), track = $('.deer-track');
const deerState = { anim:null, timer:0, phase:'idle', x:0, dir:1 };
function deerPlace(x, dir){ deer.style.transform = `translateX(${x}px) scaleX(${dir})`; deerState.x = x; deerState.dir = dir; }
function deerWalk(to, speed, done){
  const from = deerState.x, dir = deerState.dir, d = Math.abs(to - from);
  deer.classList.remove('grazing', 'alert'); deer.classList.add('walking');
  deer.style.setProperty('--stride', speed > 120 ? '.42s' : '.9s');
  $$('.leg', deer).forEach(l => { l.style.animationDuration = speed > 120 ? '.42s' : '.9s'; });
  deerState.anim?.cancel();
  deerState.anim = deer.animate([{ transform:`translateX(${from}px) scaleX(${dir})` }, { transform:`translateX(${to}px) scaleX(${dir})` }],
    { duration:d / speed * 1000, easing:'linear', fill:'forwards' });
  deerState.anim.onfinish = () => { deerPlace(to, dir); deerState.anim?.cancel(); deerState.anim = null; deer.classList.remove('walking'); done && done(); };
}
function deerCycle(){
  clearTimeout(deerState.timer);
  if (!on() || !deer) return;
  const W = track.clientWidth, dw = deer.getBoundingClientRect().width || 100;
  const dir = Math.random() < .5 ? 1 : -1;
  deerPlace(dir > 0 ? -dw - 20 : W + 20, dir);
  const stop = W * rand(.3, .66);
  deerState.phase = 'walk';
  deerWalk(stop, rand(55, 75), () => {
    deerState.phase = 'graze'; deer.classList.add('grazing');
    deerState.timer = setTimeout(() => {
      deer.classList.remove('grazing'); deer.classList.add('alert'); deerState.phase = 'alert';
      deerState.timer = setTimeout(() => {
        deerState.phase = 'leave';
        deerWalk(dir > 0 ? W + 40 : -dw - 40, rand(55, 75), () => { deerState.phase = 'idle'; deerState.timer = setTimeout(deerCycle, rand(5000, 11000)); });
      }, rand(1400, 2600));
    }, rand(3500, 6500));
  });
}
function deerStartle(){
  if (!on() || (deerState.phase !== 'graze' && deerState.phase !== 'alert')) return;
  const r = deer.getBoundingClientRect();
  if (Math.hypot(ptr.x - (r.left + r.width / 2), ptr.y - (r.top + r.height / 2)) > 170 || Math.hypot(ptr.vx, ptr.vy) < 18) return;
  clearTimeout(deerState.timer); deerState.phase = 'flee';
  const W = track.clientWidth, dir = ptr.x < r.left + r.width / 2 ? 1 : -1;
  deerPlace(deerState.x, dir);
  deerWalk(dir > 0 ? W + 60 : -r.width - 60, 340, () => { deerState.phase = 'idle'; deerState.timer = setTimeout(deerCycle, rand(6000, 10000)); });
}
function deerStop(){
  clearTimeout(deerState.timer); deerState.anim?.cancel(); deerState.anim = null;
  deer.classList.remove('walking', 'grazing', 'alert'); deer.style.transform = ''; deerState.phase = 'idle';
}

/* coruja: os olhos acompanham o cursor */
const owl = $('.owl'), pupils = owl ? $$('.pupil', owl) : [], owlBody = owl && $('.bird-body', owl);
function stepOwl(){
  if (!owl) return;
  const r = owl.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const cx = r.left + r.width * .5, cy = r.top + r.height * .36;
  const dx = ptr.x - cx, dy = ptr.y - cy, d = Math.hypot(dx, dy) || 1;
  const m = Math.min(2.6, d / 80);
  pupils.forEach(p => p.style.transform = `translate(${(dx / d * m).toFixed(2)}px, ${(dy / d * m).toFixed(2)}px)`);
  owlBody.style.transform = `rotate(${clamp(dx / 60, -10, 10).toFixed(2)}deg)`;
}

/* raposa: se esconde quando o cursor se aproxima */
const fox = $('.fox'); let foxTimer = 0;
function checkFox(){
  if (!fox || !on()) return;
  const r = fox.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  if (Math.hypot(ptr.x - (r.left + r.width / 2), ptr.y - (r.top + r.height / 2)) < 190) {
    fox.classList.add('is-hiding'); clearTimeout(foxTimer);
    foxTimer = setTimeout(() => fox.classList.remove('is-hiding'), 2600);
  }
}

/* ============================================================
   7. ROLAGEM, PROFUNDIDADE E VENTO
   ============================================================ */
const layers = $$('.hero .layer').map(el => ({ el, d:+el.dataset.depth }));
const heroTop = $('.hero-top'), moon = $('.moon'), frames = $$('.frame-tree'), sways = () => $$('.frame-tree .sway');
const pathOl = $('.path ol'), pathLis = pathOl ? $$('li', pathOl) : [];
const lantern = document.createElement('div'); lantern.className = 'lantern'; lantern.setAttribute('aria-hidden', 'true'); document.body.append(lantern);
let mxs = 0, wind = 0, lx = -50, ly = -50, px = -200, py = -200, ps = .6;

function sceneFrame(){
  const y = scrollY, vh = innerHeight;
  if (pathOl) {
    const r = pathOl.getBoundingClientRect();
    pathOl.style.setProperty('--tp', on() ? clamp((vh * .78 - r.top) / r.height).toFixed(3) : 1);
    pathLis.forEach(li => li.classList.toggle('lit', !on() || li.getBoundingClientRect().top < vh * .78));
  }
  if (!on() || !heroVisible) return;
  const hh = hero.offsetHeight, hp = clamp(y / hh);
  mxs = lerp(mxs, fine && ptr.inside ? ptr.x / innerWidth - .5 : 0, .05);
  layers.forEach(({ el, d }) => { el.style.transform = `translate3d(${(-mxs * d * 70).toFixed(2)}px, ${(y * (.5 - d * .72)).toFixed(1)}px, 0)`; });
  heroTop.style.transform = `translate3d(${(-mxs * 14).toFixed(2)}px, ${(y * .32).toFixed(1)}px, 0)`;
  heroTop.style.opacity = (1 - hp * 1.5).toFixed(3);
  moon.style.transform = `translate3d(${(-mxs * 10).toFixed(2)}px, ${(y * .55).toFixed(1)}px, 0)`;
  wind = lerp(wind, clamp(ptr.vx * .05, -3.5, 3.5), .04); ptr.vx *= .9;
  frames.forEach((f, i) => { f.style.translate = `${(-mxs * (i ? 60 : 50)).toFixed(1)}px ${(y * .02).toFixed(1)}px`; });
  sways().forEach(s => s.style.setProperty('--wind', `${wind.toFixed(2)}deg`));
}
function resetScene(){
  layers.forEach(({ el }) => { el.style.transform = ''; });
  heroTop.style.transform = ''; heroTop.style.opacity = ''; moon.style.transform = '';
  frames.forEach(f => { f.style.translate = ''; }); sways().forEach(s => s.style.removeProperty('--wind'));
}

/* ============================================================
   8. LAÇO ÚNICO
   ============================================================ */
let fireflies = [], last = performance.now();
function loop(t){
  requestAnimationFrame(loop);
  const dt = Math.min(64, t - last); last = t;
  if (document.hidden) return;
  sceneFrame();
  if (!on()) return;
  // histórico do caminho do cursor (a trilha que as borboletas seguem)
  if (ptr.inside) { ptr.hist.push({ x:ptr.x, y:ptr.y }); if (ptr.hist.length > 140) ptr.hist.shift(); }
  // borboletas nascem ao longo do caminho dentro das seções da mata
  if (fine && ptr.swarm && ptr.inside) {
    travel += Math.hypot(ptr.x - lastPX, ptr.y - lastPY);
    if (travel > 64 && followers < MAX_FOLLOW) { travel = 0; addButterfly(ptr.x + rand(-10, 10), ptr.y + rand(-10, 10), 'follow', { size:rand(.75, 1.15) }); }
    if (performance.now() - ptr.moved < 60 && Math.random() < .7) pollen.push({ x:ptr.x + rand(-6, 6), y:ptr.y + rand(-6, 6), vx:rand(-.3, .3), vy:rand(-.2, .4), a:rand(.4, .8), s:rand(5, 11) });
    if (pollen.length > 90) pollen.splice(0, pollen.length - 90);
  } else if (followers) release();
  lastPX = ptr.x; lastPY = ptr.y;

  fireflies.forEach(f => f.visible && f.step(t));
  lg.clearRect(0, 0, LW, LH);
  stepLeaves(t, dt); stepPollen(); stepButterflies(t);
  if (fine) {
    lx = lerp(lx, ptr.x, .22); ly = lerp(ly, ptr.y, .22);
    lantern.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    lantern.classList.toggle('is-on', ptr.inside && !pillOn);
    const k = pillOn ? .2 : .35; px = lerp(px, ptr.x, k); py = lerp(py, ptr.y, k); ps = lerp(ps, pillOn ? 1 : .6, .15);
    pill.style.transform = `translate3d(${px + 18}px, ${py + 18}px, 0) scale(${ps.toFixed(3)})`;
    stepOwl();
  }
}
addEventListener('pointermove', () => { if (on()) { deerStartle(); checkFox(); } }, { passive:true });

/* ============================================================
   9. INÍCIO, REDIMENSIONAMENTO E PREFERÊNCIA DE MOVIMENTO
   ============================================================ */
function startAlive(){
  bfs.length = 0; followers = 0;
  for (let i = 0; i < (fine ? 3 : 2); i++) addButterfly(rand(0, LW), rand(LH * .2, LH * .8), 'wander', { size:rand(.6, .9) });
  setTimeout(deerCycle, 2600);
  flockTimer = setTimeout(spawnFlock, 3200);
}
function stopAlive(){
  bfs.length = leaves.length = pollen.length = 0; followers = 0;
  lg.clearRect(0, 0, LW, LH); fireflies.forEach(f => f.clear());
  deerStop(); clearTimeout(flockTimer); flock && flock.replaceChildren();
  resetScene(); pill.classList.remove('is-on'); pillOn = false; lantern.classList.remove('is-on');
  fox?.classList.remove('is-hiding');
  $$('.brand-card.pre').forEach(c => c.classList.remove('pre'));
  $$('main h2').forEach(h => h.classList.add('is-revealed'));
  $$('.brand-card a').forEach(a => ['--rx','--ry'].forEach(p => a.style.removeProperty(p)));
  $$('[data-magnet]').forEach(b => { b.style.transform = ''; });
}
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { sizeLife(); makePalettes(); fireflies.forEach(f => f.resize()); }, 150); });
new MutationObserver(() => { on() ? startAlive() : stopAlive(); })
  .observe(root, { attributes:true, attributeFilter:['data-motion'] });
document.addEventListener('portfolio:brands', () => { prepareBrands(); bindCards(); });
document.addEventListener('portfolio:lang', () => { craftSeals(); maskHeadings(); });

buildForest(); splitName(); maskHeadings(); craftSeals(); craftIcons(); splitMail(); bindCards(); bindMagnets(); prepareBrands();
sizeLife(); makePalettes();
fireflies = $$('canvas.fireflies').map(c => new Fireflies(c));
if (on()) startAlive(); else $$('main h2').forEach(h => h.classList.add('is-revealed'));
requestAnimationFrame(loop);
})();
