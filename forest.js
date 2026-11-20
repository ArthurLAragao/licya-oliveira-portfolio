/* Licya Oliveira — versão III, "Floresta". Ambiente e movimento.
   Tudo aqui é aprimoramento: conteúdo, links, filtros e painel funcionam
   sem este arquivo (app.js). Com movimento reduzido a mata é desenhada,
   mas fica parada — sem borboletas, vaga-lumes nem animais andando.

   Ilustração: estilo cartunesco com sombreamento em células. A lua fica à
   direita, então toda árvore tem um lado iluminado, o topo de cada galho
   recebe um filete de luz e a base de cada camada se perde na névoa.

   Mapa (gatilho → mudança → propósito):
   · carregamento → a névoa se abre, a mata sobe em camadas, o nome se forma → entrada na floresta
   · rolagem (suavizada) e cursor → camadas se deslocam em velocidades diferentes → profundidade
   · velocidade do cursor → as árvores da frente se curvam ao "vento"
   · cursor em movimento nas seções escuras → borboletas nascem no caminho e seguem o cursor
   · cursor parado → as borboletas se separam e flutuam livres pela área; voltam quando ele se move
   · clique/toque na mata → revoada de borboletas
   · tempo → cervo atravessa, pasta, ergue a cabeça; foge se o cursor chega rápido; bandos de pássaros
   · entrada nos trabalhos → três linhas de árvores sobem em profundidade, o título se forma
     palavra por palavra, os cards brotam do chão da mata com um brilho
   · cursor perto da coruja → ela acompanha com os olhos; perto da raposa → ela se esconde
   · cards → vaga-lumes se juntam em volta do projeto em foco
   · seções claras → folhas caem, empurradas pelo cursor; samambaias balançam
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
let uid = 0;

/* ============================================================
   1. A MATA — ilustração gerada por código
   ============================================================ */
/* pinheiro com três passadas: silhueta, metade iluminada e filetes de luz nos galhos */
function pine(x, gy, h, w, R, tiers){
  const top = gy - h, n = tiers || 5 + (R() * 4 | 0), step = h * .92 / n;
  const right = [], left = [], tips = [];
  for (let i = 1; i <= n; i++){
    const f = i / n, y = top + h * .92 * f, hw = w / 2 * Math.pow(f, .85);
    const rt = [x + hw * (.85 + R() * .3), y + h * .03];
    right.push(rt); left.push([x - hw * (.85 + R() * .3), y + h * .03]);
    tips.push(rt);
    if (i < n){ right.push([x + hw * .4, y + step * .2]); left.push([x - hw * .4, y + step * .2]); }
  }
  const tw = Math.max(1.4, w * .05);
  let sil = `M${f1(x)} ${f1(top)}`;
  right.forEach(p => sil += `L${f1(p[0])} ${f1(p[1])}`);
  sil += `L${f1(x + tw)} ${f1(gy + 4)}L${f1(x - tw)} ${f1(gy + 4)}`;
  [...left].reverse().forEach(p => sil += `L${f1(p[0])} ${f1(p[1])}`);
  sil += 'Z';
  // metade iluminada: do eixo até a borda direita, com o eixo levemente ondulado
  let lit = `M${f1(x)} ${f1(top)}`;
  right.forEach(p => lit += `L${f1(p[0])} ${f1(p[1])}`);
  lit += `L${f1(x + tw)} ${f1(gy + 4)}L${f1(x + w * .03)} ${f1(gy)}`;
  for (let i = n - 1; i >= 1; i--) lit += `L${f1(x + w * (.02 + (i % 2) * .05) * (i / n))} ${f1(top + h * .92 * i / n)}`;
  lit += 'Z';
  // filetes: a face de cima de cada camada de galhos
  let hi = '', prev = [x, top];
  tips.forEach(t => { hi += `M${f1(lerp(prev[0], t[0], .25))} ${f1(lerp(prev[1], t[1], .25) + 1)}L${f1(t[0])} ${f1(t[1])}`; prev = [x + (t[0] - x) * .4, t[1] + step * .2]; });
  return { sil, lit, hi };
}
function ridge({ W = 1600, H, count, min, max, seed, clearing = 0, flat = false, moonX = .64 }){
  const R = seeded(seed), off = R() * 6;
  const ground = x => flat ? H - 2 : H - H * .07 + Math.sin(x / W * TAU * 1.3 + off) * H * .025 + (clearing ? Math.exp(-Math.pow((x / W - .5) / .14, 2)) * H * .05 : 0);
  let sil = `M0 ${H}`;
  for (let x = 0; x <= W; x += 40) sil += `L${x} ${f1(ground(x))}`;
  sil += `L${W} ${H}Z`;
  let lit = '', hi = '';
  for (let i = 0; i < count; i++){
    const x = (i + R() * .9) * W / count, c = Math.abs(x / W - .5);
    if (clearing === 2 && c < .17) continue;
    let h = H * (min + R() * (max - min));
    if (clearing === 1 && c < .2) h *= .55 + c * 2;
    const p = pine(x, ground(x) + 2, h, h * (.3 + R() * .14), R);
    sil += p.sil; lit += p.lit; hi += p.hi;
  }
  return { sil, lit, hi, moonX };
}
/* SVG de uma linha de árvores com luz da lua e névoa na base */
function ridgeSVG(r, W, H, c, par = 'xMidYMax slice'){
  const id = 'r' + (++uid), mx = W * r.moonX;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="${id}l" gradientUnits="userSpaceOnUse" cx="${mx}" cy="${-H * .5}" r="${W * .8}"><stop offset="0" stop-color="${c.lit}"/><stop offset=".55" stop-color="${c.lit}" stop-opacity=".6"/><stop offset="1" stop-color="${c.lit}" stop-opacity=".18"/></radialGradient>
    ${c.fog ? `<linearGradient id="${id}f" gradientUnits="userSpaceOnUse" x1="0" y1="${H * .45}" x2="0" y2="${H}"><stop offset="0" stop-color="${c.fog}" stop-opacity="0"/><stop offset="1" stop-color="${c.fog}" stop-opacity="${c.fogA || .5}"/></linearGradient>` : ''}
  </defs>
  <path fill="${c.base}" d="${r.sil}"/><path fill="url(#${id}l)" d="${r.lit}"/>
  <path fill="none" stroke="${c.hi || c.lit}" stroke-width="${c.sw || 1.6}" stroke-linecap="round" opacity=".7" d="${r.hi}"/>
  ${c.fog ? `<rect width="${W}" height="${H}" fill="url(#${id}f)"/>` : ''}</svg>`;
}
/* pinheiro grande da moldura: galhos caídos com dentes de agulhas */
function bigPine(R){
  const cx = 200, n = 30; let sil = `M${cx - 11} 1200L${cx - 5} 90L${cx + 5} 90L${cx + 11} 1200Z`, lit = `M${cx + 1} 1200L${cx + 3} 110L${cx + 5} 90L${cx + 11} 1200Z`, hiR = '', hiL = '';
  sil += `M${cx} 26L${cx + 14} 100L${cx - 14} 100Z`; lit += `M${cx} 26L${cx + 14} 100L${cx + 2} 92Z`;
  for (let i = 0; i < n; i++){
    const f = (i + 1) / n, y = 70 + f * 1060 + (R() - .5) * 14;
    for (const s of [-1, 1]){
      const hw = (20 + f * 175) * (.7 + R() * .5), droop = (10 + f * 40) * (.6 + R() * .8), th = 18 + f * 18;
      const tx = cx + s * hw, ty = y + droop;
      const k = 5 + (R() * 4 | 0);
      let d = `M${cx} ${f1(y - 6)}Q${f1(cx + s * hw * .5)} ${f1(y - 4 + R() * 6)} ${f1(tx)} ${f1(ty)}`;
      let l = d;
      for (let j = 1; j <= k; j++){
        const t = j / k, px = tx - s * hw * t, py = lerp(ty, y + th, t);
        d += `L${f1(px + s * hw / k * .5)} ${f1(py + 6 + R() * 10)}L${f1(px)} ${f1(py)}`;
        l += `L${f1(px)} ${f1(py - th * .5 * (1 - t) - 3)}`;
      }
      sil += d + 'Z';
      if (s === 1) lit += l + 'Z';
      if (R() < .7) { const hp = `M${f1(cx + s * 8)} ${f1(y - 5)}Q${f1(cx + s * hw * .5)} ${f1(y - 4)} ${f1(tx - s * hw * .15)} ${f1(ty - droop * .15)}`; s === 1 ? hiR += hp : hiL += hp; }
    }
  }
  return `<svg viewBox="0 0 400 1200" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="bp${++uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14394a"/><stop offset="1" stop-color="#0a2230"/></linearGradient></defs>
    <g class="sway"><path fill="#061522" d="${sil}"/><path fill="url(#bp${uid})" d="${lit}"/>
    <path fill="none" stroke="#4f8a93" stroke-width="1.6" stroke-linecap="round" opacity=".4" d="${hiR}"/>
    <path fill="none" stroke="#24505c" stroke-width="1.2" stroke-linecap="round" opacity=".4" d="${hiL}"/></g></svg>`;
}
/* faixa de chão do cervo: morros suaves com tufos de capim */
function meadowSVG(){
  const W = 1600, H = 60, R = seeded(61);
  const g = x => H * .62 + Math.sin(x / W * TAU * 3.2) * H * .12 + Math.sin(x / W * TAU * 7.5 + 1) * H * .05;
  let d = `M0 ${H}L0 ${f1(g(0))}`, tips = '';
  for (let x = 0; x <= W; x += 5 + R() * 5){
    const h = H * (.12 + R() * .3), lean = (R() - .5) * 8, gy = g(x);
    d += `L${f1(x - 2.5)} ${f1(gy)}L${f1(x + lean)} ${f1(gy - h)}L${f1(x + 2.5)} ${f1(gy)}`;
    if (R() < .4) tips += `M${f1(x + lean * .5)} ${f1(gy - h * .5)}L${f1(x + lean)} ${f1(gy - h)}`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs><linearGradient id="mdw" x1="0" y1="0" x2="0" y2="1"><stop offset=".4" stop-color="#2a5b66"/><stop offset="1" stop-color="#1d4754"/></linearGradient></defs><path fill="url(#mdw)" d="${d}L${W} ${H}Z"/><path fill="none" stroke="#6aa6a8" stroke-width="1.1" stroke-linecap="round" opacity=".55" d="${tips}"/></svg>`;
}
function grassSVG(W, H, seed, base, lit){
  const R = seeded(seed), g = H * .55;
  let d = `M0 ${H}L0 ${g}`, tips = '';
  for (let x = 0; x <= W; x += 6 + R() * 6){
    const edge = 1 + Math.pow(Math.abs(x / W - .5) * 2, 2) * 1.2;
    const h = (H * .25 + R() * H * .45) * edge, lean = (R() - .5) * 14;
    d += `L${f1(x - 3)} ${f1(g)}L${f1(x + lean)} ${f1(g - h)}L${f1(x + 3)} ${f1(g)}`;
    if (R() < .45) tips += `M${f1(x + lean * .6)} ${f1(g - h * .6)}L${f1(x + lean)} ${f1(g - h)}`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><path fill="${base}" d="${d}L${W} ${H}Z"/><path fill="none" stroke="${lit}" stroke-width="1.4" stroke-linecap="round" opacity=".6" d="${tips}"/></svg>`;
}
/* banco de névoa em três camadas de nuvens arredondadas */
function fogBank(seed){
  const W = 1600, H = 220, R = seeded(seed);
  const layer = (base, a, b, fill, op) => {
    let x = 0, d = `M-40 ${H}L-40 ${base}L0 ${base}`;
    while (x < W + 40){ const dx = 70 + R() * 160, ry = a + R() * (b - a); d += `A${f1(dx / 2)} ${f1(ry)} 0 0 1 ${f1(x + dx)} ${base}`; x += dx; }
    return `<path class="fl" fill="${fill}" opacity="${op}" d="${d}L${x} ${H}Z"/>`;
  };
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    ${layer(H * .5, 20, 46, '#e3f0ee', .38)}${layer(H * .64, 14, 32, '#e8f3f1', .7)}${layer(H * .8, 10, 22, '#eef6f5', 1)}<rect y="${H - 2}" width="${W}" height="4" fill="#eef6f5"/></svg>`;
}
/* samambaias: folíolos alternados ao longo de um caule curvo */
function fern(x0, y0, len, ang, curl, R){
  let body = '', vein = '';
  const pts = [];
  for (let i = 0; i <= 24; i++){ const t = i / 24, a = ang + curl * t * t; pts.push([x0 + Math.sin(a) * len * t, y0 - Math.cos(a) * len * t, a]); }
  vein = 'M' + pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join('L');
  for (let i = 2; i < 23; i++){
    const [px, py, a] = pts[i], t = i / 24, L = len * .2 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 2;
    for (const s of [-1, 1]){
      const la = a + s * (1.15 - t * .3), tx = px + Math.sin(la) * L, ty = py - Math.cos(la) * L;
      const bx = pts[i + 1][0], by = pts[i + 1][1];
      body += `M${f1(px)} ${f1(py)}Q${f1(lerp(px, tx, .5) + Math.sin(a) * 3)} ${f1(lerp(py, ty, .5) - 3)} ${f1(tx)} ${f1(ty)}Q${f1(lerp(bx, tx, .6))} ${f1(lerp(by, ty, .6) + 2)} ${f1(bx)} ${f1(by)}Z`;
    }
  }
  return { body, vein };
}
function fernSVG(seed, flip){
  const R = seeded(seed); let out = '';
  for (let i = 0; i < 6; i++){
    const x = 60 + i * 34 + R() * 20, len = 120 + R() * 110, ang = (R() - .55) * 1.1, curl = (R() - .3) * .9;
    const f = fern(0, 0, len, ang, curl, R);
    const dark = i % 2 === 0;
    out += `<g transform="translate(${f1(x)} 262)"><g class="frond" style="--d:${(-R() * 6).toFixed(2)}s;--s:${(5 + R() * 4).toFixed(2)}s"><path fill="${dark ? '#2e6a64' : '#3f8178'}" d="${f.body}"/><path fill="none" stroke="#1d4d4a" stroke-width="1.4" d="${f.vein}"/></g></g>`;
  }
  return `<svg viewBox="0 0 320 264" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false" ${flip ? 'style="transform:scaleX(-1)"' : ''}>${out}</svg>`;
}

const LAYERS = {
  1:{ o:{ H:550, count:64, min:.35, max:.78, seed:11 }, c:{ base:'#3b6e78', lit:'#7fb3b4', hi:'#bfe0dc', fog:'#a7cdca', fogA:.55 } },
  2:{ o:{ H:440, count:44, min:.4, max:.85, seed:23 }, c:{ base:'#24525f', lit:'#4f878e', hi:'#9fcfcb', fog:'#77a9a8', fogA:.45 } },
  3:{ o:{ H:350, count:30, min:.45, max:.92, seed:37, clearing:1 }, c:{ base:'#163a49', lit:'#2f6773', hi:'#82bcbb', fog:'#3f7479', fogA:.35 } },
  4:{ o:{ H:216, count:18, min:.55, max:1, seed:41, clearing:2 }, c:{ base:'#0c2635', lit:'#1d4b59', hi:'#5f9da3', sw:2 } }
};
function buildForest(){
  $$('[data-ridge]').forEach(el => {
    const n = +el.dataset.ridge;
    if (n === 5) { el.innerHTML = grassSVG(1600, 112, 53, '#061522', '#2f6672'); return; }
    const L = LAYERS[n];
    el.innerHTML = ridgeSVG(ridge(L.o), 1600, L.o.H, L.c);
  });
  $$('[data-tree]').forEach((el, i) => { el.innerHTML = bigPine(seeded(i ? 77 : 71)); });
  $$('[data-divider]').forEach(el => {
    const s = +el.dataset.seed || 0, base = el.dataset.divider, lit = el.dataset.lit || base;
    const back = ridge({ H:170, count:46, min:.35, max:1, seed:90 + s, flat:true });
    const front = ridge({ H:170, count:70, min:.2, max:.78, seed:101 + s, flat:true });
    el.innerHTML = `<div class="ridge-back">${ridgeSVG(back, 1600, 170, { base, lit, hi:lit, sw:1.2 })}</div>` + ridgeSVG(front, 1600, 170, { base, lit, hi:lit, sw:1.4 });
  });
  const meadow = $('[data-meadow]');
  if (meadow) meadow.innerHTML = meadowSVG();
  $$('[data-fog]').forEach(el => { el.innerHTML = fogBank(+el.dataset.fog * 13); });
  $$('[data-fern]').forEach(el => { el.innerHTML = fernSVG(+el.dataset.fern * 31, el.classList.contains('right')); });
  const shore = $('[data-shore]');
  if (shore) {
    const r = ridge({ H:300, count:60, min:.3, max:.82, seed:131, flat:true, moonX:.77 });
    shore.innerHTML = ridgeSVG(r, 1600, 300, { base:'#0b2c3b', lit:'#2a5b68', hi:'#6fa6aa', sw:1.4 });
    const water = $('.water');
    if (water && !$('.shore-reflect', water)) {
      const d = document.createElement('div'); d.className = 'shore-reflect';
      d.innerHTML = `<svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path fill="#0b2c3b" d="${r.sil}"/></svg>`;
      water.prepend(d);
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
function sprite(stops){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
const glow = sprite([[0,'rgba(250,255,215,1)'],[.12,'rgba(233,247,184,.9)'],[.35,'rgba(150,230,210,.28)'],[1,'rgba(95,180,255,0)']]);
const blueGlow = sprite([[0,'rgba(120,200,255,.55)'],[.4,'rgba(95,180,255,.18)'],[1,'rgba(95,180,255,0)']]);
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
      p.vx += (Math.random() - .5) * .05; p.vy += (Math.random() - .5) * .05 - (this.rise ? .004 : 0);
      if (card && i % 2 === 0) {
        const a = p.k * TAU + t * .0004, tx = card.x + card.w / 2 + Math.cos(a) * (card.w / 2 + 14), ty = card.y + card.h / 2 + Math.sin(a) * (card.h / 2 + 14);
        p.vx += (tx - p.x) * .0014; p.vy += (ty - p.y) * .0014;
      } else if (lantern) {
        const dx = lx - p.x, dy = ly - p.y, d = Math.hypot(dx, dy);
        if (d < 220 && d > 30) { p.vx += dx / d * .025; p.vy += dy / d * .025; }
      }
      p.vx *= .97; p.vy *= .97;
      const sp = Math.hypot(p.vx, p.vy); if (sp > 1.4) { p.vx *= 1.4 / sp; p.vy *= 1.4 / sp; }
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
    alpha:0, mode, pal:PALETTES[(Math.random() * PALETTES.length) | 0], orbit:rand(26, 70), os:rand(.9, 1.7) * (Math.random() < .5 ? -1 : 1),
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
  lg.globalAlpha = b.alpha * .5; const gs = 70 * b.size; lg.drawImage(blueGlow, -gs / 2, -gs / 2, gs, gs);
  lg.rotate(b.rot); lg.scale(b.size, b.size); lg.globalAlpha = b.alpha;
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
  if (!on() || e.target.closest('a,button,input,dialog,.versions')) return;
  if (!e.target.closest('[data-swarm]')) return;
  burst(e.clientX, e.clientY, fine ? 6 : 4);
});

/* ============================================================
   6. ANIMAIS
   ============================================================ */
const hero = $('.hero'), flock = $('.flock');
let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

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

/* cervo: anda com passada articulada sobre a própria faixa de capim */
const deer = $('.deer'), track = $('.deer-track');
const deerState = { anim:null, timer:0, phase:'idle', x:0, dir:1 };
function deerPlace(x, dir){ deer.style.transform = `translateX(${x}px) scaleX(${dir})`; deerState.x = x; deerState.dir = dir; }
function deerWalk(to, speed, done){
  const from = deerState.x, dir = deerState.dir, d = Math.abs(to - from);
  deer.classList.remove('grazing', 'alert'); deer.classList.add('walking');
  deer.style.setProperty('--gait', speed > 120 ? '.46s' : `${(68 / speed).toFixed(2)}s`);
  deerState.anim?.cancel();
  deerState.anim = deer.animate([{ transform:`translateX(${from}px) scaleX(${dir})` }, { transform:`translateX(${to}px) scaleX(${dir})` }],
    { duration:d / speed * 1000, easing:'linear', fill:'forwards' });
  deerState.anim.onfinish = () => { deerPlace(to, dir); deerState.anim?.cancel(); deerState.anim = null; deer.classList.remove('walking'); done && done(); };
}
function deerCycle(){
  clearTimeout(deerState.timer);
  if (!on() || !deer) return;
  const W = track.clientWidth, dw = deer.getBoundingClientRect().width || 120;
  const dir = Math.random() < .5 ? 1 : -1;
  deerPlace(dir > 0 ? -dw - 20 : W + 20, dir);
  const stop = W * rand(.28, .62);
  deerState.phase = 'walk';
  deerWalk(stop, rand(58, 72), () => {
    deerState.phase = 'graze'; deer.classList.add('grazing');
    deerState.timer = setTimeout(() => {
      deer.classList.remove('grazing'); deer.classList.add('alert'); deerState.phase = 'alert';
      deerState.timer = setTimeout(() => {
        deerState.phase = 'leave';
        deerWalk(dir > 0 ? W + 40 : -dw - 40, rand(58, 72), () => { deerState.phase = 'idle'; deerState.timer = setTimeout(deerCycle, rand(5000, 11000)); });
      }, rand(1600, 2800));
    }, rand(4000, 7000));
  });
}
function deerStartle(){
  if (!on() || (deerState.phase !== 'graze' && deerState.phase !== 'alert')) return;
  const r = deer.getBoundingClientRect();
  if (Math.hypot(ptr.x - (r.left + r.width / 2), ptr.y - (r.top + r.height / 2)) > 170 || Math.hypot(ptr.vx, ptr.vy) < 18) return;
  clearTimeout(deerState.timer); deerState.phase = 'flee';
  const W = track.clientWidth, dir = ptr.x < r.left + r.width / 2 ? 1 : -1;
  deerPlace(deerState.x, dir);
  deerWalk(dir > 0 ? W + 60 : -r.width - 60, 300, () => { deerState.phase = 'idle'; deerState.timer = setTimeout(deerCycle, rand(6000, 10000)); });
}
function deerStop(){
  clearTimeout(deerState.timer); deerState.anim?.cancel(); deerState.anim = null;
  deer.classList.remove('walking', 'grazing', 'alert'); deer.style.transform = ''; deerState.phase = 'idle';
}

const owl = $('.owl'), pupils = owl ? $$('.pupil', owl) : [], owlBody = owl && $('.bird-body', owl);
function stepOwl(){
  if (!owl) return;
  const r = owl.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const cx = r.left + r.width * .5, cy = r.top + r.height * .36;
  const dx = ptr.x - cx, dy = ptr.y - cy, d = Math.hypot(dx, dy) || 1;
  const m = Math.min(2.6, d / 80);
  pupils.forEach(p => p.style.transform = `translate(${(dx / d * m).toFixed(2)}px, ${(dy / d * m).toFixed(2)}px)`);
  owlBody.style.transform = `rotate(${clamp(dx / 60, -9, 9).toFixed(2)}deg)`;
}
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
   7. ROLAGEM SUAVIZADA, PROFUNDIDADE E VENTO
   ============================================================ */
const layers = $$('.hero .layer').map(el => ({ el, d:+el.dataset.depth }));
const heroTop = $('.hero-top'), moon = $('.moon'), rays = $('.rays'), frames = $$('.frame-tree');
const work = $('.work'), ridges = $$('.work .ridge'), workGlow = $('.work-glow');
const fogs = $$('.fogbank');
const pathOl = $('.path ol'), pathLis = pathOl ? $$('li', pathOl) : [];
const lantern = document.createElement('div'); lantern.className = 'lantern'; lantern.setAttribute('aria-hidden', 'true'); document.body.append(lantern);
let mxs = 0, wind = 0, lx = -50, ly = -50, px = -200, py = -200, ps = .6, sy = scrollY;

function sceneFrame(){
  const vh = innerHeight;
  sy = on() ? lerp(sy, scrollY, .14) : scrollY;
  if (Math.abs(sy - scrollY) < .3) sy = scrollY;
  const y = sy;
  if (pathOl) {
    const r = pathOl.getBoundingClientRect();
    pathOl.style.setProperty('--tp', on() ? clamp((vh * .78 - r.top) / r.height).toFixed(3) : 1);
    pathLis.forEach(li => li.classList.toggle('lit', !on() || li.getBoundingClientRect().top < vh * .78));
  }
  if (!on()) return;
  // trabalhos: três linhas de árvores sobem em profundidade enquanto a noite chega
  const wr = work.getBoundingClientRect(), wp = clamp(1 - (wr.top + (scrollY - sy)) / vh);
  if (wr.top < vh * 1.4 && wr.bottom > 0) {
    const e = 1 - Math.pow(1 - wp, 3);
    ridges.forEach((r, i) => { r.style.transform = `translate3d(0, ${((1 - e) * [130, 70, 0][i]).toFixed(1)}px, 0)`; });
    workGlow.style.opacity = (.3 + e * .7).toFixed(3);
    $$('.brand-card', work).forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      c.style.setProperty('--py', `${((r.top + r.height / 2 - vh / 2) * -.05).toFixed(1)}px`);
    });
  }
  fogs.forEach(f => {
    const r = f.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    f.style.setProperty('--fy', `${((r.top - vh * .6) * .06).toFixed(1)}px`);
  });
  if (!heroVisible) return;
  const hh = hero.offsetHeight, hp = clamp(y / hh);
  mxs = lerp(mxs, fine && ptr.inside ? ptr.x / innerWidth - .5 : 0, .045);
  layers.forEach(({ el, d }) => { el.style.transform = `translate3d(${(-mxs * d * 70).toFixed(2)}px, ${(y * (.5 - d * .72)).toFixed(1)}px, 0)`; });
  heroTop.style.transform = `translate3d(${(-mxs * 14).toFixed(2)}px, ${(y * .32).toFixed(1)}px, 0)`;
  heroTop.style.opacity = (1 - hp * 1.5).toFixed(3);
  const mt = `translate3d(${(-mxs * 10).toFixed(2)}px, ${(y * .55).toFixed(1)}px, 0)`;
  moon.style.transform = mt; rays.style.transform = mt;
  wind = lerp(wind, clamp(ptr.vx * .05, -3.5, 3.5), .04); ptr.vx *= .9;
  frames.forEach((f, i) => { f.style.translate = `${(-mxs * (i ? 60 : 50)).toFixed(1)}px ${(y * .02).toFixed(1)}px`; });
  $$('.frame-tree .sway').forEach(s => s.style.setProperty('--wind', `${wind.toFixed(2)}deg`));
}
function resetScene(){
  layers.forEach(({ el }) => { el.style.transform = ''; });
  heroTop.style.transform = ''; heroTop.style.opacity = ''; moon.style.transform = ''; rays.style.transform = '';
  ridges.forEach(r => { r.style.transform = ''; }); workGlow.style.opacity = '';
  frames.forEach(f => { f.style.translate = ''; }); $$('.frame-tree .sway').forEach(s => s.style.removeProperty('--wind'));
  $$('.brand-card').forEach(c => c.style.removeProperty('--py'));
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
  if (ptr.inside) { ptr.hist.push({ x:ptr.x, y:ptr.y }); if (ptr.hist.length > 140) ptr.hist.shift(); }
  if (fine && ptr.swarm && ptr.inside) {
    travel += Math.hypot(ptr.x - lastPX, ptr.y - lastPY);
    if (travel > 64 && members < MAX_FOLLOW) { travel = 0; addButterfly(ptr.x + rand(-10, 10), ptr.y + rand(-10, 10), 'follow'); }
    if (performance.now() - ptr.moved < 60 && Math.random() < .6) pollen.push({ x:ptr.x + rand(-6, 6), y:ptr.y + rand(-6, 6), vx:rand(-.3, .3), vy:rand(-.2, .4), a:rand(.4, .8), s:rand(5, 11) });
    if (pollen.length > 90) pollen.splice(0, pollen.length - 90);
  } else if (members) release();
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
  bfs.length = 0; members = 0;
  for (let i = 0; i < (fine ? 3 : 2); i++) addButterfly(rand(0, LW), rand(LH * .2, LH * .8), 'wander', { size:rand(.6, .85) });
  setTimeout(deerCycle, 2600);
  flockTimer = setTimeout(spawnFlock, 3200);
}
function stopAlive(){
  bfs.length = leaves.length = pollen.length = 0; members = 0;
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
document.addEventListener('portfolio:lang', () => { craftSeals(); maskHeadings(); splitWorkTitle(); });

buildForest(); splitName(); splitWorkTitle(); maskHeadings(); craftSeals(); craftIcons(); splitMail(); bindCards(); bindMagnets(); prepareBrands();
sizeLife(); makePalettes();
fireflies = $$('canvas.fireflies').map(c => new Fireflies(c));
if (on()) startAlive(); else $$('main h2').forEach(h => h.classList.add('is-revealed'));
requestAnimationFrame(loop);
})();
