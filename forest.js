/* Licya Oliveira — versão III, "Floresta". Camada de interface e vida.
   A cena 3D (a caminhada pela mata) mora em world.js; aqui ficam as peças
   que vivem por cima dela, em HTML/canvas 2D:
   · borboletas que nascem no caminho do cursor, seguem e se espalham quando ele para
   · folhas e pólen, títulos que se formam, cards, botões magnéticos
   Tudo é aprimoramento: conteúdo, links, filtros e painel funcionam sem este arquivo. */
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
let uid = 0;
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
/* título dos trabalhos palavra por palavra */
function splitWorkTitle(){
  const h = $('#work-title'); if (!h) return;
  let i = 0;
  $$('[data-i18n]', h).forEach(s => {
    const words = s.textContent.trim().split(/\s+/);
    s.innerHTML = words.map(w => `<span class="wd" style="--i:${i++}">${w}</span>`).join(' ');
  });
  headObs.observe(h);
}

/* ============================================================
   2. PEÇAS HERDADAS (títulos, selos, cards, botões)
   ============================================================ */
const headObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-revealed'); headObs.unobserve(e.target); }
}), { rootMargin:'0px 0px -14% 0px' });
function maskHeadings(){
  $$('main h2:not(.sr-only):not(#work-title)').forEach(h => {
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
  $$('.craft-icon path, .facts path, .facts circle').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch {} });
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
/* cards: brotam do chão da mata em sequência */
const cardObs = new IntersectionObserver(es => {
  es.filter(e => e.isIntersecting).map(e => e.target).forEach((c, i) => {
    c.style.setProperty('--d', `${i * 140}ms`);
    c.classList.add('shown'); c.classList.remove('pre'); cardObs.unobserve(c);
    setTimeout(() => { c.classList.remove('shown'); c.style.removeProperty('--d'); }, 2600 + i * 140);
  });
}, { rootMargin:'0px 0px -10% 0px' });
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
      pillOn = true; $('span', pill).textContent = P().t ? P().t('viewProject') : 'View project';
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

function sprite(stops){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
const glow = sprite([[0,'rgba(250,255,215,1)'],[.12,'rgba(233,247,184,.9)'],[.35,'rgba(150,230,210,.28)'],[1,'rgba(95,180,255,0)']]);
const blueGlow = sprite([[0,'rgba(120,200,255,.55)'],[.4,'rgba(95,180,255,.18)'],[1,'rgba(95,180,255,0)']]);
/* ============================================================
   5. CAMADA VIVA — borboletas, folhas e pólen sobre a página
   ============================================================ */
const life = $('.life'), lg = life.getContext('2d');
let LW = 0, LH = 0, BF = 1;
// borboletas proporcionais à tela: discretas no celular, um pouco maiores no computador
function sizeLife(){
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  LW = innerWidth; LH = innerHeight;
  BF = LW < 760 ? .5 : LW < 1100 ? .58 : .66; life.width = Math.round(LW * dpr); life.height = Math.round(LH * dpr);
  lg.setTransform(dpr, 0, 0, dpr, 0, 0);
}
const UPPER = new Path2D('M0 -2C5 -15 20 -20 22 -9C23 -2 12 1 0 1Z');
const LOWER = new Path2D('M0 1C10 1 17 9 12 15C8 19 2 12 0 5Z');
const VEIN = new Path2D('M1 -1C6 -7 12 -11 18 -11M1 0C7 -3 14 -4 20 -4M1 2C5 5 9 9 10 13');
const SPOTS = [[18.6,-12.4,.95],[20.6,-8.6,.85],[15.2,-15.6,.8],[11.6,14.2,.75],[14.2,11,.7]];
const LEAF = new Path2D('M0 -10Q8 -2 0 10Q-8 -2 0 -10Z');
function wingFill(stops, r = 21){
  const g = lg.createRadialGradient(2, -2, 1, 4, -1, r);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g;
}
let PALETTES = [], SHEEN = null;
function makePalettes(){
  PALETTES = [
    { fill:wingFill(['#dff6ff','#7fd0ff','#2f86f0','#1b4fb8']), edge:'#0a1630' },
    { fill:wingFill(['#eafffa','#8fe6d5','#2fa8a0','#16707a']), edge:'#06212a' },
    { fill:wingFill(['#f6fbff','#bfe1ff','#6fa8f0','#3a62b8']), edge:'#0d1d3d' }
  ];
  SHEEN = lg.createRadialGradient(6, -6, 0, 6, -6, 14);
  SHEEN.addColorStop(0, 'rgba(255,255,255,.8)'); SHEEN.addColorStop(1, 'rgba(255,255,255,0)');
}
const bfs = [], leaves = [], pollen = [];
const MAX_FOLLOW = fine ? 14 : 6;
let members = 0, travel = 0, lastPX = 0, lastPY = 0;
function addButterfly(x, y, mode, extra = {}){
  const b = Object.assign({ x, y, vx:rand(-1, 1), vy:rand(-1.6, -.4), rot:0, size:rand(.7, 1.05), ph:rand(0, TAU),
    alpha:0, mode, pal:PALETTES[(Math.random() * PALETTES.length) | 0], orbit:rand(20, 52), os:rand(.9, 1.7) * (Math.random() < .5 ? -1 : 1),
    born:performance.now(), wx:rand(0, LW), wy:rand(0, LH), retarget:0, idx:0, member:false }, extra);
  if (mode === 'follow') { b.member = true; b.idx = members++; }
  bfs.push(b); return b;
}
function release(){
  bfs.forEach(b => {
    if (!b.member && b.mode !== 'burst') return;
    b.member = false;
    if (bfs.filter(o => o.mode === 'wander').length < 3 && Math.random() < .35) { b.mode = 'wander'; b.wx = rand(0, LW); b.wy = rand(0, LH * .6); }
    else { b.mode = 'flee'; b.dir = Math.random() < .5 ? -1 : 1; }
  });
  members = 0;
}
function burst(x, y, n){
  for (let i = 0; i < n; i++){
    const a = i / n * TAU + rand(-.3, .3), s = rand(3, 5.5);
    addButterfly(x, y, 'burst', { vx:Math.cos(a) * s, vy:Math.sin(a) * s - 1, alpha:.2, anchorX:x, anchorY:y });
  }
}
function drawButterfly(b){
  const speed = Math.hypot(b.vx, b.vy);
  b.ph += .26 + Math.min(speed, 6) * .05;
  const open = Math.abs(Math.cos(b.ph)), flap = open * .82 + .18;
  const target = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  let dr = target - b.rot; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); b.rot += dr * .08;
  lg.save(); lg.translate(b.x, b.y);
  // brilho difuso por baixo
  const sz = b.size * BF;
  lg.globalAlpha = b.alpha * .5; const gs = 70 * sz; lg.drawImage(blueGlow, -gs / 2, -gs / 2, gs, gs);
  lg.rotate(b.rot); lg.scale(sz, sz); lg.globalAlpha = b.alpha;
  for (const side of [1, -1]) {
    lg.save(); lg.scale(side * flap, 1);
    lg.fillStyle = b.pal.edge; lg.fill(LOWER); lg.fill(UPPER);
    lg.save(); lg.scale(.8, .8); lg.fillStyle = b.pal.fill; lg.fill(LOWER); lg.fill(UPPER);
    lg.globalAlpha = b.alpha * (.25 + open * .5); lg.fillStyle = SHEEN; lg.fill(UPPER);
    lg.globalAlpha = b.alpha; lg.strokeStyle = 'rgba(255,255,255,.28)'; lg.lineWidth = .5; lg.stroke(VEIN); lg.restore();
    lg.fillStyle = 'rgba(255,255,255,.85)';
    SPOTS.forEach(([sx, sy, r]) => { lg.beginPath(); lg.arc(sx, sy, r, 0, TAU); lg.fill(); });
    lg.restore();
  }
  lg.fillStyle = '#0b1826'; lg.beginPath(); lg.ellipse(0, 3, 1.5, 8, 0, 0, TAU); lg.fill();
  lg.fillStyle = 'rgba(160,210,255,.5)'; lg.beginPath(); lg.ellipse(-.4, 0, .5, 4, 0, 0, TAU); lg.fill();
  lg.strokeStyle = 'rgba(8,22,36,.85)'; lg.lineWidth = .7; lg.beginPath();
  lg.moveTo(-.5, -4); lg.quadraticCurveTo(-2, -9, -4.2, -11.5); lg.moveTo(.5, -4); lg.quadraticCurveTo(2, -9, 4.2, -11.5); lg.stroke();
  lg.fillStyle = '#0b1826'; lg.beginPath(); lg.arc(-4.2, -11.5, .9, 0, TAU); lg.arc(4.2, -11.5, .9, 0, TAU); lg.fill();
  lg.restore();
}
function stepButterflies(t){
  const now = performance.now(), idle = now - ptr.moved > 650;
  const n = Math.max(1, members);
  // separação: ninguém fica amontoado
  for (let i = 0; i < bfs.length; i++) for (let j = i + 1; j < bfs.length; j++){
    const a = bfs[i], b = bfs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const min = idle ? 70 : 34;
    if (d > 0 && d < min){ const f = (min - d) / min * .35; a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f; }
  }
  for (let i = bfs.length - 1; i >= 0; i--){
    const b = bfs[i];
    let tx, ty, k = .009, max = 6;
    if (b.member) {
      if (idle) {
        // cursor parado: cada uma escolhe um ponto livre na área e flutua até lá
        if (now > b.retarget || b.mode !== 'drift') {
          const a = b.idx * 2.399 + rand(-.6, .6), r = rand(90, 300);
          b.wx = clamp(ptr.x + Math.cos(a) * r, 30, LW - 30); b.wy = clamp(ptr.y + Math.sin(a) * r * .7, 40, LH - 40);
          b.retarget = now + rand(2600, 5200); b.mode = 'drift';
        }
        tx = b.wx; ty = b.wy; k = .0022; max = 1.5;
      } else {
        b.mode = 'follow';
        const h = ptr.hist, j = Math.max(0, h.length - 1 - (5 + b.idx * 6)), p = h[j] || ptr;
        tx = p.x + Math.sin(t * .003 + b.idx) * 16; ty = p.y + Math.cos(t * .0025 + b.idx) * 14;
      }
      b.alpha = Math.min(.96, b.alpha + .04);
    } else if (b.mode === 'burst') {
      k = 0; b.alpha = Math.min(.96, b.alpha + .05);
      if (now - b.born > 900) {
        if (fine && ptr.swarm && members < MAX_FOLLOW) { b.member = true; b.idx = members++; }
        else if (!fine && now - b.born < 2600) { const a = t * .0016 * b.os + b.ph; tx = b.anchorX + Math.cos(a) * b.orbit; ty = b.anchorY + Math.sin(a) * b.orbit * .7; k = .012; }
        else { b.mode = 'flee'; b.dir = Math.random() < .5 ? -1 : 1; }
      }
    } else if (b.mode === 'wander') {
      if (Math.hypot(b.wx - b.x, b.wy - b.y) < 40 || Math.random() < .002) { b.wx = rand(LW * .05, LW * .95); b.wy = rand(LH * .08, LH * .85); }
      tx = b.wx; ty = b.wy; k = .002; max = 1.5; b.alpha = Math.min(.85, b.alpha + .01);
    } else {
      b.vy -= .05; b.vx += b.dir * .04; b.alpha -= .009; k = 0;
    }
    if (k && tx !== undefined) { b.vx += (tx - b.x) * k; b.vy += (ty - b.y) * k; }
    b.vy += Math.sin(t * .007 + b.ph) * .05;
    b.vx *= .94; b.vy *= .94;
    const sp = Math.hypot(b.vx, b.vy); if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
    b.x += b.vx; b.y += b.vy;
    if (b.alpha <= 0 || b.y < -80 || b.x < -120 || b.x > LW + 120) { if (b.member) members = Math.max(0, members - 1); bfs.splice(i, 1); continue; }
    drawButterfly(b);
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
    if (fine && d < 120 && d > 0) { l.vx += ptr.vx * .02 + dx / d * .25; l.vr += (Math.random() - .5) * .02; }
    l.vx *= .96; l.ph += .018; l.rot += l.vr + Math.cos(l.ph) * .01;
    l.x += l.vx + Math.cos(l.ph) * l.sway * .02; l.y += l.vy;
    if (l.y > LH + 30) { leaves.splice(i, 1); continue; }
    lg.save(); lg.translate(l.x, l.y); lg.rotate(l.rot); lg.scale(l.s * (.6 + .4 * Math.abs(Math.cos(l.ph))), l.s);
    lg.globalAlpha = l.a; lg.fillStyle = l.c; lg.fill(LEAF);
    lg.fillStyle = 'rgba(255,255,255,.18)'; lg.beginPath(); lg.moveTo(0, -10); lg.quadraticCurveTo(8, -2, 0, 10); lg.closePath(); lg.fill();
    lg.strokeStyle = 'rgba(12,36,51,.35)'; lg.lineWidth = .7; lg.beginPath(); lg.moveTo(0, -8); lg.lineTo(0, 9); lg.stroke();
    lg.restore();
  }
}
function stepPollen(){
  lg.globalCompositeOperation = 'lighter';
  for (let i = pollen.length - 1; i >= 0; i--){
    const p = pollen[i];
    p.x += p.vx; p.y += p.vy; p.vy -= .008; p.a -= .012;
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

document.addEventListener('pointerdown', e => {
  if (!on() || e.target.closest('a,button,input,dialog,.lang-menu')) return;
  if (!e.target.closest('[data-swarm]')) return;
  burst(e.clientX, e.clientY, fine ? 6 : 4);
});

const lantern = document.createElement('div'); lantern.className = 'lantern'; lantern.setAttribute('aria-hidden', 'true'); document.body.append(lantern);
let lx = -50, ly = -50, px = -200, py = -200, ps = .6;

/* ============================================================
   LAÇO ÚNICO
   ============================================================ */
let last = performance.now();
function loop(t){
  requestAnimationFrame(loop);
  const dt = Math.min(64, t - last); last = t;
  if (document.hidden || !on()) return;
  if (ptr.inside) { ptr.hist.push({ x:ptr.x, y:ptr.y }); if (ptr.hist.length > 140) ptr.hist.shift(); }
  if (fine && ptr.swarm && ptr.inside) {
    travel += Math.hypot(ptr.x - lastPX, ptr.y - lastPY);
    if (travel > 64 && members < MAX_FOLLOW) { travel = 0; addButterfly(ptr.x + rand(-10, 10), ptr.y + rand(-10, 10), 'follow'); }
    if (performance.now() - ptr.moved < 60 && Math.random() < .6) pollen.push({ x:ptr.x + rand(-6, 6), y:ptr.y + rand(-6, 6), vx:rand(-.3, .3), vy:rand(-.2, .4), a:rand(.4, .8), s:rand(5, 11) });
    if (pollen.length > 90) pollen.splice(0, pollen.length - 90);
  } else if (members) release();
  lastPX = ptr.x; lastPY = ptr.y;
  lg.clearRect(0, 0, LW, LH);
  stepLeaves(t, dt); stepPollen(); stepButterflies(t);
  if (fine) {
    lx = lerp(lx, ptr.x, .22); ly = lerp(ly, ptr.y, .22);
    lantern.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    lantern.classList.toggle('is-on', ptr.inside && !pillOn);
    const k = pillOn ? .2 : .35; px = lerp(px, ptr.x, k); py = lerp(py, ptr.y, k); ps = lerp(ps, pillOn ? 1 : .6, .15);
    pill.style.transform = `translate3d(${px + 18}px, ${py + 18}px, 0) scale(${ps.toFixed(3)})`;
  }
}

/* ============================================================
   INÍCIO, REDIMENSIONAMENTO E PREFERÊNCIA DE MOVIMENTO
   ============================================================ */
function startAlive(){
  bfs.length = 0; members = 0;
  for (let i = 0; i < (fine ? 3 : 2); i++) addButterfly(rand(0, LW), rand(LH * .2, LH * .8), 'wander', { size:rand(.6, .85) });
}
function stopAlive(){
  bfs.length = leaves.length = pollen.length = 0; members = 0;
  lg.clearRect(0, 0, LW, LH);
  pill.classList.remove('is-on'); pillOn = false; lantern.classList.remove('is-on');
  $$('.brand-card.pre').forEach(c => c.classList.remove('pre'));
  $$('main h2').forEach(h => h.classList.add('is-revealed'));
  $$('.brand-card a').forEach(a => ['--rx','--ry'].forEach(p => a.style.removeProperty(p)));
  $$('[data-magnet]').forEach(b => { b.style.transform = ''; });
}
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { sizeLife(); makePalettes(); }, 150); });
new MutationObserver(() => { on() ? startAlive() : stopAlive(); })
  .observe(root, { attributes:true, attributeFilter:['data-motion'] });
document.addEventListener('portfolio:brands', () => { prepareBrands(); bindCards(); });
document.addEventListener('portfolio:lang', () => { craftSeals(); maskHeadings(); splitWorkTitle(); });

splitName(); splitWorkTitle(); maskHeadings(); craftSeals(); craftIcons(); splitMail(); bindCards(); bindMagnets(); prepareBrands();
sizeLife(); makePalettes();
if (on()) startAlive(); else $$('main h2').forEach(h => h.classList.add('is-revealed'));
requestAnimationFrame(loop);
})();
