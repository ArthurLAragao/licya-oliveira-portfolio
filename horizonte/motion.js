/* Licya Oliveira — sistema de movimento.
   Tudo aqui é aprimoramento: o site funciona e fica completo sem este arquivo,
   com movimento reduzido ou se algo falhar.

   Mapa (gatilho → mudança → propósito):
   · rolagem → o nome sobe, o reflexo se estica, o sol se põe → profundidade na abertura
   · cursor sobre a água → a ondulação aumenta e se acalma → a água "responde ao toque"
   · rolagem → a seção de marcas cresce até ocupar a tela → passagem do dia para a noite
   · cursor nos cards → inclinação + reflexo de luz + rótulo "Ver projeto" → convite claro
   · botões principais → atração magnética sutil → retorno imediato e tátil
   · títulos → sobem de trás de uma máscara → ritmo editorial consistente
   · rolagem → o sol do contato desce → o entardecer fecha a página */
(() => {
'use strict';
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const on = () => root.dataset.motion === 'on';
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const P = () => window.LicyaPortfolio || {};

/* ---------- títulos com máscara ---------- */
function maskHeadings(){
  $$('main h2:not(.sr-only)').forEach(h => {
    [...h.children].forEach(child => {
      if (child.parentElement.classList.contains('mask')) return;
      const m = document.createElement('span');
      m.className = 'mask';
      child.replaceWith(m); m.append(child);
    });
    headObs.observe(h);
  });
}
const headObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-revealed'); headObs.unobserve(e.target); }
}), { rootMargin:'0px 0px -12% 0px' });

/* ---------- selos em leque nas áreas de prática ---------- */
function craftSeals(){
  const { works, seal } = P(); if (!works) return;
  $$('.craft').forEach(c => {
    let box = $('.craft-seals', c);
    if (!box) { box = document.createElement('span'); box.className = 'craft-seals'; box.setAttribute('aria-hidden', 'true'); $('.craft-count', c).before(box); }
    box.innerHTML = works.filter(w => w.group === c.dataset.filter).map(seal).join('');
    $$('img', box).forEach(i => { i.alt = ''; });
  });
}

/* ---------- e-mail letra por letra ---------- */
function splitMail(){
  const m = $('.mail'); if (!m || m.dataset.split) return;
  const text = m.textContent;
  m.setAttribute('aria-label', text);
  m.innerHTML = [...text].map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
  m.dataset.split = '1';
}

/* ---------- entrada das marcas ---------- */
const cardObs = new IntersectionObserver(es => {
  const entering = es.filter(e => e.isIntersecting).map(e => e.target);
  entering.forEach((c, i) => {
    c.style.setProperty('--d', `${i * 110}ms`);
    c.classList.add('shown'); c.classList.remove('pre');
    cardObs.unobserve(c);
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

/* ---------- inclinação, luz e rótulo nos cards ---------- */
const pill = document.createElement('div');
pill.className = 'cursor-pill'; pill.setAttribute('aria-hidden', 'true');
pill.innerHTML = '<i></i><span></span>';
document.body.append(pill);
const pillLabel = () => (P().lang?.() === 'en' ? 'View project' : 'Ver projeto');
let mx = -200, my = -200, px = -200, py = -200, ps = .6, pillOn = false;
function bindCards(){
  if (!fine) return;
  $$('.brand-card a').forEach(a => {
    if (a.dataset.motion) return; a.dataset.motion = '1';
    a.addEventListener('pointerenter', () => { if (!on()) return; pillOn = true; $('span', pill).textContent = pillLabel(); pill.classList.add('is-on'); a.classList.add('is-tilting'); });
    a.addEventListener('pointermove', e => {
      if (!on()) return;
      const r = a.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      a.style.setProperty('--ry', `${(x - .5) * 7}deg`);
      a.style.setProperty('--rx', `${(.5 - y) * 6}deg`);
      a.style.setProperty('--lx', `${x * 100}%`);
      a.style.setProperty('--ly', `${y * 100}%`);
    });
    a.addEventListener('pointerleave', () => {
      pillOn = false; pill.classList.remove('is-on'); a.classList.remove('is-tilting');
      ['--rx','--ry'].forEach(p => a.style.removeProperty(p));
    });
  });
}
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive:true });

/* ---------- botões magnéticos ---------- */
function bindMagnets(){
  if (!fine) return;
  $$('.btn-solid, .btn-light, .btn-outline, .sheet-close').forEach(b => {
    if (b.dataset.magnet) return; b.dataset.magnet = '1';
    b.addEventListener('pointermove', e => {
      if (!on()) return;
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate(${x * .18}px, ${y * .28}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- água que responde ao cursor ---------- */
const displace = $('#ripple feDisplacementMap');
let rippleBoost = 0;
const hero = $('.hero');
if (fine && hero) {
  let lx = 0, ly = 0;
  hero.addEventListener('pointermove', e => {
    if (!on()) return;
    const v = Math.hypot(e.clientX - lx, e.clientY - ly);
    lx = e.clientX; ly = e.clientY;
    const w = $('.water').getBoundingClientRect();
    if (e.clientY > w.top - 120 && e.clientY < w.bottom + 80) rippleBoost = Math.min(1, rippleBoost + v / 260);
  });
}

/* ---------- laço único de quadro: rolagem e cursor ---------- */
const els = {
  heroTop: $('.hero-top'), water: $('.water'), sky: $('.sky'), horizon: $('.horizon'),
  manifesto: $('.manifesto-text'), work: $('.work'), dusk: $('.dusk-sun'), contact: $('.contact'),
  progress: null
};
const bar = document.createElement('span'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
$('.topbar').append(bar); els.progress = bar;
let skyX = 0, ticking = false;

function frame(){
  ticking = false;
  const vh = innerHeight, y = scrollY;
  const max = document.documentElement.scrollHeight - vh;
  bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  if (!on()) { resetScene(); return; }

  // abertura: profundidade
  const hp = clamp(y / (hero.offsetHeight * .9));
  els.heroTop.style.transform = `translate3d(0, ${-hp * 70}px, 0)`;
  els.heroTop.style.opacity = (1 - hp * .85).toFixed(3);
  els.water.style.transform = `scaleY(${1 + hp * .55})`;
  els.water.style.opacity = (1 - hp * 1.1).toFixed(3);
  els.horizon.style.transform = `scaleX(${1 + hp * .25})`;
  const targetX = fine && mx > 0 ? (mx / innerWidth - .5) * 40 : 0;
  skyX = lerp(skyX, targetX, .06);
  els.sky.style.transform = `translate3d(${skyX.toFixed(2)}px, ${hp * 90}px, 0)`;

  // manifesto: linha que acompanha a leitura
  const mr = els.manifesto.getBoundingClientRect();
  els.manifesto.style.setProperty('--mp', clamp((vh * .85 - mr.top) / (mr.height + vh * .3)).toFixed(3));

  // marcas: a noite cresce até ocupar a tela
  const wr = els.work.getBoundingClientRect();
  const wp = clamp(1 - wr.top / vh);
  els.work.style.transform = `scale(${(.93 + wp * .07).toFixed(4)})`;

  // contato: o sol desce
  const cr = els.contact.getBoundingClientRect();
  const cp = clamp(1 - cr.top / vh);
  els.dusk.style.transform = `translate(-50%, ${(cp * 22 - 10).toFixed(2)}%)`;
}
function resetScene(){
  ['heroTop','water','sky','horizon','work','dusk'].forEach(k => { els[k].style.transform = ''; els[k].style.opacity = ''; });
  els.manifesto.style.removeProperty('--mp');
}
const requestFrame = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', requestFrame, { passive:true });
addEventListener('resize', requestFrame);

/* laço contínuo leve: rótulo do cursor, deriva do céu e calma da água */
function loop(){
  requestAnimationFrame(loop);
  if (document.hidden) return;
  if (fine) {
    const k = pillOn ? .2 : .35;
    px = lerp(px, mx, k); py = lerp(py, my, k);
    ps = lerp(ps, pillOn ? 1 : .6, .15);
    pill.style.transform = `translate3d(${px + 18}px, ${py + 18}px, 0) scale(${ps.toFixed(3)})`;
  }
  if (displace) {
    rippleBoost *= .955;
    displace.setAttribute('scale', (9 + rippleBoost * 16).toFixed(2));
  }
  if (on() && fine && scrollY < innerHeight) requestFrame();
}

/* ---------- início e reações ---------- */
function setup(){
  maskHeadings(); craftSeals(); splitMail(); bindCards(); bindMagnets();
}
document.addEventListener('portfolio:brands', () => { prepareBrands(); bindCards(); });
document.addEventListener('portfolio:lang', () => { craftSeals(); maskHeadings(); });
new MutationObserver(() => {
  if (!on()) {
    $$('.brand-card.pre').forEach(c => c.classList.remove('pre'));
    $$('main h2').forEach(h => h.classList.add('is-revealed'));
    $$('.path').forEach(p => p.classList.add('is-in'));
    resetScene(); pill.classList.remove('is-on'); pillOn = false;
    $$('.brand-card a').forEach(a => ['--rx','--ry'].forEach(p => a.style.removeProperty(p)));
    $$('[data-magnet]').forEach(b => { b.style.transform = ''; });
  }
  requestFrame();
}).observe(root, { attributes:true, attributeFilter:['data-motion'] });

setup();
prepareBrands();
bindCards();
if (!on()) $$('main h2').forEach(h => h.classList.add('is-revealed'));
frame();
requestAnimationFrame(loop);
})();
