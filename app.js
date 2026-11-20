/* Licya Oliveira — portfólio. JS sem dependências. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const motionOn = () => root.dataset.motion === 'on';
const store = {
  get(k){ try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch {} }
};
const A = k => `assets/${k}.webp`;

/* ---------------- logos recriados em vetor (fiéis às marcas) ---------------- */
const SVG = {
  aurora: `<svg class="logo-aurora" viewBox="0 0 100 100" role="img" aria-label="Aurora Estúdio de Beleza">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#a69c97" stroke-width="2.4"/>
    <text x="29" y="40" font-size="20" letter-spacing="2">AU</text>
    <text x="35" y="60" font-size="20" letter-spacing="2">RO</text>
    <text x="29" y="80" font-size="20" letter-spacing="2">RA</text>
    <text class="sub" x="58" y="73">estúdio</text>
    <text class="sub" x="58" y="81">de beleza</text></svg>`,
  cm: `<svg class="logo-cm" viewBox="0 0 100 100" role="img" aria-label="CM Pisos">
    <text class="cm" x="50" y="54" font-size="27" text-anchor="middle">CM</text>
    <line x1="34" y1="61" x2="66" y2="61" stroke="rgba(255,255,255,.35)" stroke-width=".6"/>
    <text class="pisos" x="51.5" y="71" font-size="7.6" text-anchor="middle">PISOS</text></svg>`
};

/* ---------------- conteúdo ---------------- */
const works = [
  { id:'fruttiva', name:'Fruttiva', group:'identity', wide:true, tint:'#3a5a8a',
    seal:{src:'fruit-logo', bg:'#191731', contain:true, pad:'4%'},
    palette:['#0a2a40','#f42d27','#c99a4b','#f1ede5'],
    kind:{pt:'Identidade visual',en:'Visual identity'},
    intro:{pt:'Uma identidade guiada pela fruta, com o calor do Ceará.',en:'A fruit-led identity with the warmth of Ceará.'},
    brief:{pt:'Construir uma linguagem visual reconhecível em torno do nome Fruttiva.',en:'Build a recognizable visual language around the Fruttiva name.'},
    detail:{pt:'O logotipo une uma serifa fina a um símbolo de fruta ilustrado. O azul-marinho profundo dá uma base consistente ao vermelho, ao ocre e aos motivos ilustrados em toda a identidade.',en:'The wordmark pairs a fine serif with an illustrated fruit symbol. Deep navy gives the red, ochre and illustrated motifs a consistent ground across the identity.'},
    items:{pt:'Logotipo, ilustrações de frutas, paleta de cores e guia de identidade.',en:'Wordmark, fruit illustrations, color palette and identity guide.'},
    views:[
      ['fruit-logo',{pt:'Logotipo',en:'Wordmark'},{pt:'A serifa fina e a fruta ilustrada dividem o mesmo fundo azul-marinho.',en:'The fine serif and illustrated fruit share a deep navy ground.'}],
      ['fruit-icons',{pt:'Símbolos',en:'Symbols'},{pt:'Os motivos de fruta ocupam uma grade quente. Cada um tem uma silhueta própria e um pequeno conjunto de marcas repetidas.',en:'The fruit motifs sit on a warm grid. Each uses a different silhouette and a small set of repeated marks.'}],
      ['fruit-palette',{pt:'Paleta',en:'Palette'},{pt:'O azul-marinho ancora a identidade. Vermelho e ocre carregam o calor das ilustrações.',en:'Navy anchors the identity. Red and ochre carry the warmth of the fruit illustrations.'}],
      ['fruttiva',{pt:'Quadro completo',en:'Full board'},{pt:'O quadro original reúne logotipo, ilustrações, paleta e aplicações.',en:'The original identity board brings together the wordmark, illustrations, palette and applications.'}]
    ]},
  { id:'cm-pisos', name:'CM Pisos', group:'web', wide:true, tint:'#8a7a66',
    seal:{svg:'cm', bg:'#1e1c1a'},
    palette:['#1e1c1a','#50483f','#e9e4dc','#ffffff'],
    kind:{pt:'Site e catálogo de produtos',en:'Website & product catalog'},
    intro:{pt:'Um catálogo digital pesquisável para uma empresa de pisos e carpetes.',en:'A searchable digital catalog for a flooring business.'},
    brief:{pt:'Levar o visitante da navegação pelas opções de piso até um pedido comercial.',en:'Help visitors move from browsing flooring options to a commercial inquiry.'},
    detail:{pt:'Busca, filtros e paginação organizam o catálogo. Uma seção de perguntas frequentes e um canal de contato comercial apoiam o próximo passo depois que o visitante encontra um produto.',en:'Search, filters and pagination organize the catalog. A frequently asked questions section and a sales contact route support the next step after a visitor finds a product.'},
    items:{pt:'Site responsivo, catálogo de produtos, FAQ e contato comercial. Feito com HTML, CSS e JavaScript.',en:'Responsive website, product catalog, FAQ and commercial contact. Built with HTML, CSS and JavaScript.'},
    links:[['https://licyafreoli.github.io/cmpisos/',{pt:'Visitar o site',en:'Visit the website'}]],
    views:[
      ['cm-site',{pt:'Desktop',en:'Desktop'},{pt:'A página inicial traz as fotos de pisos, o catálogo e os links de orçamento já na primeira tela.',en:'The published homepage brings the flooring photography, catalogue and quotation links into the first screen.'}],
      ['cm-phone',{pt:'Celular',en:'Mobile'},{pt:'Em telas estreitas, o título quebra em linhas e as duas ações principais ficam empilhadas ao alcance do polegar.',en:'On a narrow screen, the headline wraps and the two primary actions stack within reach.'}],
      ['cm',{pt:'Capa',en:'Cover'},{pt:'A fotografia do corredor apresenta os materiais de piso em um ambiente instalado.',en:'The corridor photograph introduces the flooring materials through an installed setting.'}]
    ]},
  { id:'reis', name:'Reis Marcas e Patentes', group:'identity', tint:'#d2b171',
    seal:{src:'logos/reis', bg:'#333333', contain:true, pad:'6%'},
    palette:['#333333','#cccccc','#d2b171'],
    kind:{pt:'Branding e conteúdo social',en:'Branding & social content'},
    intro:{pt:'Identidade gráfica para um escritório de marcas e patentes.',en:'A graphic identity for a trademark and patent office.'},
    brief:{pt:'Dar a uma marca de serviços profissionais uma presença reconhecível no impresso e nas redes.',en:'Give a professional services brand a recognizable presence across print and social media.'},
    detail:{pt:'O monograma nasce da inicial R e remete ao ® do registro. Ele atravessa aplicações claras e escuras, e um dourado contido conecta papelaria, posts e amostras da identidade.',en:'The monogram grows from the initial R and nods to the ® of registration. It carries through dark and light applications, and a restrained gold connects the stationery, posts and identity samples.'},
    items:{pt:'Aplicações da identidade, paleta da marca e artes para redes sociais.',en:'Identity applications, brand palette and social media artwork.'},
    links:[['https://instagram.com/reismarcasepatentes',{pt:'Ver o perfil da marca',en:'View the brand profile'}]],
    views:[
      ['reis-mark',{pt:'Monograma',en:'Monogram'},{pt:'O símbolo nasce da inicial R e remete ao ® do registro — a área de atuação do escritório.',en:'The registered-mark motif connects the initial R to the office’s area of practice.'}],
      ['reis-pattern',{pt:'Padrão',en:'Pattern'},{pt:'O monograma repetido transforma a identidade em superfície.',en:'A repeated monogram turns the identity into a surface pattern.'}],
      ['reis-gold',{pt:'Aplicação dourada',en:'Gold application'},{pt:'A marca escura sobre o dourado inverte o contraste da versão principal.',en:'A dark wordmark on gold reverses the contrast of the primary mark.'}],
      ['reis',{pt:'Quadro completo',en:'Full board'},{pt:'O quadro original mostra a identidade em papelaria, sinalização e impressos.',en:'The original portfolio board shows the identity in stationery, signage and print applications.'}]
    ]},
  { id:'reis-app', name:'Reis Project', group:'web', tint:'#6f9ce4',
    seal:{src:'reis-logo', bg:'#efeade', contain:true, pad:'9%'},
    palette:['#efeade','#333333','#d2b171'],
    kind:{pt:'Aplicativo colaborativo',en:'Collaborative application'},
    intro:{pt:'Uma visão compartilhada do andamento dos processos de um escritório de marcas.',en:'A shared view of case progress for a trademark office.'},
    brief:{pt:'Conectar clientes, equipe e parceiros em um único aplicativo multiplataforma.',en:'Connect clients, staff and partners through one cross-platform application.'},
    detail:{pt:'O projeto inclui cadastro, autenticação, perfis e acompanhamento visual dos processos. Licya mantém o repositório original da equipe e uma entrega consolidada.',en:'The project includes registration, authentication, profiles and visual case tracking. Licya lists the original team project and a consolidated delivery.'},
    items:{pt:'Aplicativo colaborativo em Flutter e Dart. Repositório original da equipe e código consolidado.',en:'Collaborative Flutter and Dart application. Original team repository and consolidated source.'},
    links:[['https://github.com/vinicius05-lab/ReisProject',{pt:'Repositório da equipe',en:'Team repository'}],['https://github.com/licyafreoli/ReisProject-master',{pt:'Código consolidado',en:'Consolidated source'}]],
    views:[['reis-logo',{pt:'Marca',en:'Brand'},{pt:'A marca Reis identifica a organização por trás do aplicativo.',en:'The Reis brand identifies the organization behind the application.'}]]},
  { id:'aurora', name:'Aurora Estúdio de Beleza', group:'content', tint:'#c7beba',
    seal:{svg:'aurora', bg:'#cfc7c3'},
    palette:['#cfc7c3','#8b7f79','#4c4440','#ffffff'],
    kind:{pt:'Beleza · Conteúdo social',en:'Beauty · Social content'},
    intro:{pt:'Presença nas redes para um estúdio de beleza.',en:'A social presence for a beauty studio.'},
    brief:{pt:'Levar as pessoas e os serviços do estúdio para o feed.',en:'Bring the people and services of the studio into its social feed.'},
    detail:{pt:'O quadro reúne equipe, tratamentos e vídeos curtos. Tratamentos tipográficos recorrentes dão ar de família a posts visualmente diferentes.',en:'The portfolio board places staff, treatments and short-form video together. Recurring type treatments give visually different posts a family resemblance.'},
    items:{pt:'Identidade visual e conteúdo para redes sociais.',en:'Visual identity and social media content.'},
    links:[['https://instagram.com/auroraestudiodebeleza',{pt:'Ver o perfil do estúdio',en:'View the studio profile'}]],
    views:[['aurora',{pt:'Feed',en:'Feed'},{pt:'Equipe, tratamentos e vídeos curtos reunidos no feed do estúdio.',en:'Staff, treatments and short-form video gathered in the studio feed.'}]]},
  { id:'meta', name:'Meta Hair Clinic', group:'content', tint:'#6f9ce4',
    seal:{src:'logos/meta', bg:'#000000'},
    palette:['#000000','#ffffff','#2b2f36'],
    kind:{pt:'Cabelo · Conteúdo social',en:'Hair care · Social content'},
    intro:{pt:'Conteúdo editorial para uma clínica especializada em transplante capilar.',en:'Editorial content for a specialist hair transplant clinic.'},
    brief:{pt:'Apresentar os serviços da clínica em um feed consistente.',en:'Present the clinic’s hair services in a consistent social feed.'},
    detail:{pt:'Layouts escuros, fotos em close e tipografia de alto contraste ligam as imagens de tratamento às conversas sobre os serviços da clínica.',en:'Dark layouts, close-up photography and high-contrast typography connect treatment imagery to conversations about the clinic’s services.'},
    items:{pt:'Layouts e conteúdo visual para redes sociais.',en:'Social media layouts and visual content.'},
    links:[['https://instagram.com/metahairclinic',{pt:'Ver o perfil da clínica',en:'View the clinic profile'}]],
    views:[['meta',{pt:'Feed',en:'Feed'},{pt:'Layouts escuros e tipografia de alto contraste no feed da clínica.',en:'Dark layouts and high-contrast typography across the clinic feed.'}]]},
  { id:'grupo', name:'Grupo Prioridade', group:'content', tint:'#c49a52',
    seal:{src:'logos/grupo', bg:'#000000'},
    palette:['#0a0a0a','#c49a52','#ffffff'],
    kind:{pt:'Serviços · Conteúdo social',en:'Services · Social content'},
    intro:{pt:'Comunicação nas redes para um grupo de segurança e facilities.',en:'Social communication for a security and facilities group.'},
    brief:{pt:'Mostrar as pessoas e os serviços por trás de uma operação.',en:'Show the people and services behind an operational business.'},
    detail:{pt:'O quadro combina registros em campo, imagens da equipe e o tratamento escuro e dourado da marca — uma voz editorial reconhecível para uma empresa de serviços.',en:'The board combines on-site footage, team imagery and the brand’s dark and gold treatment, giving a service business a recognizable editorial voice.'},
    items:{pt:'Artes para redes sociais e conteúdo focado em serviços.',en:'Social media artwork and service-focused content.'},
    links:[['https://instagram.com/grupoprioridade',{pt:'Ver o perfil do grupo',en:'View the group profile'}]],
    views:[['grupo',{pt:'Feed',en:'Feed'},{pt:'Registros em campo, equipe e a marca dourada no feed do grupo.',en:'On-site footage, team and the gold mark across the group feed.'}]]},
  { id:'aguas', name:'Águas Clara', group:'content', tint:'#3970dd',
    seal:{src:'logos/aguas', bg:'#3970dd'},
    palette:['#3970dd','#ffffff','#0b1220'],
    kind:{pt:'Estratégia social e criação de perfil',en:'Social strategy & profile setup'},
    intro:{pt:'Uma presença no Instagram construída do zero para verificação técnica de águas.',en:'An Instagram presence built from the ground up for technical water inspection.'},
    brief:{pt:'Estruturar um novo perfil e planejar seu conteúdo.',en:'Structure a new social profile and plan its content.'},
    detail:{pt:'O registro do projeto documenta a configuração do perfil e o conteúdo em vídeo curto. A prévia mostra a conta e exemplos do feed.',en:'The project record documents the profile setup and short-form content. The preview shows the account and examples from its feed.'},
    items:{pt:'Estrutura de perfil, estratégia de conteúdo e conteúdo orgânico.',en:'Profile structure, content strategy and organic social content.'},
    links:[['https://www.instagram.com/aguasclarapiscina/reels/',{pt:'Ver os reels',en:'View the reels'}]],
    views:[['aguas',{pt:'Perfil e feed',en:'Profile & feed'},{pt:'O perfil estruturado e exemplos de vídeos curtos do feed.',en:'The structured profile and short-form examples from the feed.'}]]}
];
const groupName = { identity:{pt:'Identidade',en:'Identity'}, web:{pt:'Web',en:'Web'}, content:{pt:'Conteúdo',en:'Content'} };

const EN = {
  skip:'Skip to content', navLabel:'Main', navWork:'Work', navAbout:'About', navContact:'Contact', langLabel:'Mudar para português',
  heroEyebrow:'Design & development · Fortaleza, Brazil',
  heroLead:'Visual identities, websites and content for brands that want to be remembered — from the first sketch to the last line of code.',
  heroCta:'See the work', heroCta2:'Start a project',
  manifestoLabel:'What I do',
  manifesto:'I create visual identities, build websites and look after the content that keeps each brand alive. The same eye follows the business from the first sketch to published code — calmly, with intention and attention to detail.',
  discId:'Visual identity', discIdText:'Wordmarks, palettes and applications that give a brand a recognizable face.',
  discWeb:'Websites & apps', discWebText:'Websites, digital catalogs and applications, designed and hand-written.',
  discContent:'Social content', discContentText:'Editorial planning, layouts and short-form video for social media.',
  workLabel:'Selected work', workTitle:'Brands I helped', workTitleEm:'build.',
  workLead:'Each brand with its own identity. Open a project to see its context, what was done and the material delivered.',
  filterLabel:'Filter projects', fAll:'All', fId:'Identity', fWeb:'Web', fContent:'Content',
  aboutLabel:'About', aboutTitle:'Design meets', aboutTitleEm:'development.',
  aboutBig:'I design identities and build websites for businesses. My work often continues into the social posts and everyday materials that bring a brand to life.',
  aboutText:'I’m studying Systems Analysis and Development at Unichristus. Alongside freelance work, I’ve coordinated technical projects, organized content deliveries and supported cloud learning in student communities.',
  expTitle:'Experience', exp1When:'Since 2025', exp1:'Independent projects', exp1Text:'Web, visual identity and social media',
  exp2When:'Apr–Oct 2026', exp2Text:'Campus Student Leader', exp3When:'Jan 2024–Aug 2026', exp3Text:'Technology Supervisor',
  exp4When:'Jan–Apr 2026', exp4Text:'Social Media', exp5Text:'Full Stack Technical Program',
  contactLabel:'Contact', contactTitle:'Shall we create something', contactTitleEm:'together?',
  contactLead:'Have a brand, website or content project in mind? Tell me what you’re working on.', contactCta:'Send an email',
  footer:'Design & development · Fortaleza, BR',
  viewsLabel:'Project views', close:'Close project', ctxLabel:'Context', doneLabel:'What was done', itemsLabel:'Deliverables', paletteLabel:'Brand colors',
  otherProjects:'Other projects', prev:'Previous', next:'Next'
};
const STR = {
  pt:{ copy:'Copiar endereço', copied:'Endereço copiado', motionOff:'Reduzir animações', motionOn:'Ativar animações', open:'Abrir projeto',
       projects:n => n === 1 ? '1 projeto' : `${n} projetos`, showing:(n,g) => `Mostrando ${n} projetos${g ? ' em ' + g : ''}` },
  en:{ copy:'Copy address', copied:'Address copied', motionOff:'Reduce motion', motionOn:'Turn motion on', open:'Open project',
       projects:n => n === 1 ? '1 project' : `${n} projects`, showing:(n,g) => `Showing ${n} projects${g ? ' in ' + g : ''}` }
};
let lang = store.get('lang') === 'en' ? 'en' : 'pt';
const t = k => STR[lang][k];
const L = o => (o && typeof o === 'object') ? o[lang] : o;

/* ---------------- selo da marca ---------------- */
function seal(w){
  const s = w.seal;
  const style = `--seal-bg:${s.bg};${s.pad ? `--pad:${s.pad};` : ''}`;
  const inner = s.svg ? SVG[s.svg] : `<img src="${A(s.src)}" alt="${w.name}" loading="lazy" decoding="async">`;
  return `<span class="seal${s.contain ? ' contain' : ''}" style="${style}">${inner}</span>`;
}

/* ---------------- i18n ---------------- */
const original = new Map(), originalAttr = new Map();
$$('[data-i18n]').forEach(el => original.set(el, el.innerHTML));
$$('[data-i18n-attr]').forEach(el => { const [a] = el.dataset.i18nAttr.split(':'); originalAttr.set(el, el.getAttribute(a)); });
function applyLang(){
  root.lang = lang === 'en' ? 'en' : 'pt-BR';
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (lang === 'en' && EN[k]) el.textContent = EN[k]; else el.innerHTML = original.get(el);
  });
  $$('[data-i18n-attr]').forEach(el => {
    const [a, k] = el.dataset.i18nAttr.split(':');
    el.setAttribute(a, lang === 'en' && EN[k] ? EN[k] : originalAttr.get(el));
  });
  document.title = lang === 'en' ? 'Licya Oliveira — Design & development' : 'Licya Oliveira — Design & desenvolvimento';
  $('.copy-state').textContent = t('copy');
  splitManifesto();
  updateMotionLabel();
  renderBrands();
  $$('.craft').forEach(c => { $('.craft-count', c).textContent = t('projects')(works.filter(w => w.group === c.dataset.filter).length); });
  if (sheet.open && current) fillCase(current, viewIndex);
  document.dispatchEvent(new CustomEvent('portfolio:lang'));
}
$('.lang').addEventListener('click', () => { lang = lang === 'en' ? 'pt' : 'en'; store.set('lang', lang); applyLang(); });

/* ---------------- movimento ---------------- */
const motionBtn = $('.motion-toggle');
function updateMotionLabel(){
  motionBtn.setAttribute('aria-pressed', String(!motionOn()));
  motionBtn.textContent = motionOn() ? t('motionOff') : t('motionOn');
}
motionBtn.addEventListener('click', () => {
  root.dataset.motion = motionOn() ? 'off' : 'on';
  store.set('motion', root.dataset.motion);
  root.classList.toggle('js-motion', motionOn());
  $$('.reveal').forEach(el => el.classList.add('is-in'));
  updateMotionLabel(); manifestoProgress();
  motionOn() ? ripple.start() : ripple.stop();
});
document.addEventListener('visibilitychange', () => root.classList.toggle('is-hidden-tab', document.hidden));

/* ---------------- cabeçalho ---------------- */
const topbar = $('.topbar');
const darkSections = $$('.work, .contact');
let lastY = scrollY;
function onScroll(){
  const y = scrollY;
  topbar.classList.toggle('is-scrolled', y > 30);
  const probe = 40;
  topbar.classList.toggle('on-dark', darkSections.some(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; }));
  if (y > lastY + 6 && y > 500 && !sheet.open) topbar.classList.add('is-hidden');
  else if (y < lastY - 6) topbar.classList.remove('is-hidden');
  lastY = y;
  manifestoProgress();
}
addEventListener('scroll', onScroll, { passive:true });
const navLinks = $$('.topbar nav a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  navLinks.forEach(a => a.hash === '#' + e.target.id ? a.setAttribute('aria-current','true') : a.removeAttribute('aria-current'));
}), { rootMargin:'-45% 0px -50% 0px' });
['inicio','pratica','trabalhos','sobre','contato'].forEach(id => spy.observe(document.getElementById(id)));

/* ---------------- reflexo na água ---------------- */
const ripple = (() => {
  const noise = $('#ripple-noise');
  let raf = 0, last = 0, visible = true;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (now - last < 50) return;          // ~20 fps: calmo e leve
    last = now;
    const s = now / 1000;
    noise.setAttribute('baseFrequency', `${(0.006 + Math.sin(s * .35) * .0015).toFixed(4)} ${(0.085 + Math.sin(s * .6) * .012).toFixed(4)}`);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? api.start() : api.stop(); }).observe($('.water'));
  const api = {
    start(){ if (!raf && motionOn() && visible && !document.hidden) raf = requestAnimationFrame(loop); },
    stop(){ cancelAnimationFrame(raf); raf = 0; }
  };
  document.addEventListener('visibilitychange', () => document.hidden ? api.stop() : api.start());
  return api;
})();

/* ---------------- manifesto: as palavras acendem com a rolagem ---------------- */
const manifesto = $('.manifesto-text');
let words = [];
function splitManifesto(){
  const text = manifesto.textContent.trim();
  manifesto.setAttribute('aria-label', text);
  manifesto.innerHTML = text.split(/\s+/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  words = $$('.w', manifesto);
  manifestoProgress();
}
function manifestoProgress(){
  if (!words.length) return;
  const r = manifesto.getBoundingClientRect();
  const p = motionOn() ? Math.max(0, Math.min(1, (innerHeight * .82 - r.top) / (r.height + innerHeight * .3))) : 1;
  const lit = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < lit));
}

/* ---------------- marcas ---------------- */
const brandsEl = $('#brands');
let filter = 'all';
const nearObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-near'); nearObs.unobserve(e.target); }
}), { rootMargin:'-35% 0px -35% 0px' });
function renderBrands(){
  nearObs.disconnect();
  brandsEl.innerHTML = works.map(w => `
    <li class="brand-card${w.wide ? ' wide' : ''}" data-group="${w.group}" data-id="${w.id}" style="--tint:${w.tint}">
      <a href="#projeto/${w.id}" aria-label="${t('open')}: ${w.name} — ${L(w.kind)}">
        <span class="card-tag">${L(groupName[w.group])}</span>
        <span class="card-open" aria-hidden="true">↗</span>
        <span class="stage">${seal(w)}</span>
        <span class="card-foot">
          <h3>${w.name}</h3>
          <span class="kind">${L(w.kind)}</span>
          <span class="swatches" aria-hidden="true">${w.palette.slice(0,4).map(c => `<i style="--c:${c}"></i>`).join('')}</span>
        </span>
      </a>
    </li>`).join('');
  if (!matchMedia('(hover:hover)').matches) $$('.brand-card', brandsEl).forEach(c => nearObs.observe(c));
  applyFilter(filter, false);
  document.dispatchEvent(new CustomEvent('portfolio:brands'));
}
/* Filtro com FLIP: quem sai se recolhe, quem fica desliza até o novo lugar,
   quem entra emerge. Um novo clique cancela a sequência anterior. */
const EASE_OUT = 'cubic-bezier(.22,.8,.24,1)', EASE_IO = 'cubic-bezier(.65,0,.45,1)';
let filterRun = 0;
async function applyFilter(f, animate = true){
  filter = f;
  const run = ++filterRun;
  $$('.filters button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
  const cards = $$('.brand-card', brandsEl);
  const shows = c => f === 'all' || c.dataset.group === f;
  const status = () => { $('#filter-status').textContent = t('showing')(cards.filter(shows).length, f === 'all' ? '' : L(groupName[f])); };
  if (!animate || !motionOn() || !Element.prototype.animate) { cards.forEach(c => c.classList.toggle('is-out', !shows(c))); status(); return; }

  const leaving = cards.filter(c => !c.classList.contains('is-out') && !shows(c));
  const outs = leaving.map(c => c.animate([{ opacity:1, transform:'none' }, { opacity:0, transform:'scale(.94)' }], { duration:320, easing:EASE_IO, fill:'forwards' }));
  await Promise.all(outs.map(a => a.finished.catch(() => {})));
  if (run !== filterRun) { outs.forEach(a => a.cancel()); return; }

  const first = new Map(cards.filter(c => !c.classList.contains('is-out')).map(c => [c, c.getBoundingClientRect()]));
  cards.forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.classList.toggle('is-out', !shows(c)); c.classList.remove('pre'); });
  let k = 0;
  cards.filter(shows).forEach(c => {
    const last = c.getBoundingClientRect(), was = first.get(c);
    if (was) {
      const dx = was.left - last.left, dy = was.top - last.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) c.animate([{ transform:`translate(${dx}px,${dy}px)` }, { transform:'none' }], { duration:900, easing:EASE_OUT });
    } else {
      c.animate([{ opacity:0, transform:'translateY(34px) scale(.97)' }, { opacity:1, transform:'none' }], { duration:900, delay:120 + k++ * 70, easing:EASE_OUT, fill:'backwards' });
    }
  });
  status();
}
$('.filters').addEventListener('click', e => { const b = e.target.closest('button'); if (b) applyFilter(b.dataset.filter); });
$$('.craft').forEach(c => c.addEventListener('click', () => {
  applyFilter(c.dataset.filter);
  $('#trabalhos').scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto' });
  setTimeout(() => $(`.filters [data-filter="${c.dataset.filter}"]`).focus({ preventScroll:true }), motionOn() ? 800 : 0);
}));

/* ---------------- projeto (painel lateral) ---------------- */
const sheet = $('#case');
let current = null, viewIndex = 0, opener = null;
function showView(w, i, animate){
  viewIndex = i;
  const v = w.views[i], img = $('#case-img');
  img.src = A(v[0]);
  img.alt = `${w.name} — ${L(v[1])}`;
  $('#case-caption').textContent = L(v[2]);
  $$('.sheet-views button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  if (animate && motionOn()) { img.classList.remove('is-swapping'); void img.offsetWidth; img.classList.add('is-swapping'); }
}
function fillCase(w, vi = 0){
  current = w;
  sheet.style.setProperty('--tint', w.tint);
  $('.sheet-seal').innerHTML = seal(w);
  $('.sheet-kind').textContent = L(w.kind);
  $('#case-title').textContent = w.name;
  $('.sheet-intro').textContent = L(w.intro);
  $('.case-brief').textContent = L(w.brief);
  $('.case-detail').textContent = L(w.detail);
  $('.case-items').textContent = L(w.items);
  $('.case-palette').innerHTML = w.palette.map(c => `<span><i style="--c:${c}"></i>${c.toUpperCase()}</span>`).join('');
  $('.sheet-links').innerHTML = (w.links || []).map(([href, label], k) => `<a class="${k ? 'alt' : ''}" href="${href}" target="_blank" rel="noopener noreferrer">${L(label)} <span aria-hidden="true">↗</span></a>`).join('');
  $('.sheet-views').innerHTML = w.views.length > 1 ? w.views.map((v, k) => `<button type="button" data-v="${k}" aria-pressed="false">${L(v[1])}</button>`).join('') : '';
  const idx = works.indexOf(w);
  const prev = works[(idx - 1 + works.length) % works.length], next = works[(idx + 1) % works.length];
  $('.case-prev').dataset.id = prev.id; $('.case-prev-name').textContent = prev.name;
  $('.case-next').dataset.id = next.id; $('.case-next-name').textContent = next.name;
  showView(w, Math.min(vi, w.views.length - 1), false);
}
$('.sheet-views').addEventListener('click', e => { const b = e.target.closest('button'); if (b && current) showView(current, +b.dataset.v, true); });
['.case-prev','.case-next'].forEach(s => $(s).addEventListener('click', e => { location.hash = 'projeto/' + e.currentTarget.dataset.id; }));
$('.sheet-close').addEventListener('click', () => closeCase());
sheet.addEventListener('cancel', e => { e.preventDefault(); closeCase(); });
sheet.addEventListener('click', e => { if (e.target === sheet) closeCase(); });
function openCase(id){
  const w = works.find(x => x.id === id); if (!w) return;
  const wasOpen = sheet.open;
  fillCase(w);
  if (!wasOpen) {
    opener = document.activeElement;
    const from = $(`.brand-card[data-id="${id}"] .seal`);
    sheet.showModal(); document.body.style.overflow = 'hidden';
    flySeal(from);
  }
  $('.sheet-inner').scrollTop = 0;
  $('.sheet-close').focus({ preventScroll:true });
}
/* Transição compartilhada: o selo sai do card e pousa no cabeçalho do painel,
   em arco, enquanto o painel desliza. Usa um popover para ficar acima do modal. */
const flight = document.createElement('div');
flight.className = 'flight'; flight.setAttribute('popover', 'manual'); flight.setAttribute('aria-hidden', 'true');
document.body.append(flight);
function flySeal(fromSeal){
  const host = $('.sheet-seal'), target = $('.seal', host);
  if (!motionOn() || !fromSeal || !target || !flight.showPopover || !Element.prototype.animate) return;
  const a = fromSeal.getBoundingClientRect();
  if (a.bottom < 0 || a.top > innerHeight) return;
  host.classList.add('is-waiting');
  requestAnimationFrame(() => {
    // posição final = posição atual do alvo menos o deslocamento da entrada do painel
    const sr = sheet.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const shift = sr.left - (innerWidth - sr.width);
    const b = { left: tr.left - shift, top: tr.top, width: tr.width };
    const clone = fromSeal.cloneNode(true);
    clone.style.width = a.width + 'px';
    flight.replaceChildren(clone);
    try { flight.showPopover(); } catch { host.classList.remove('is-waiting'); return; }
    const s = b.width / a.width, dx = b.left - a.left, dy = b.top - a.top;
    const anim = clone.animate([
      { transform:`translate(${a.left}px,${a.top}px) scale(1)`, boxShadow:'0 0 0 6px rgba(255,255,255,.55),0 24px 40px -22px rgba(13,31,66,.55)' },
      { transform:`translate(${a.left + dx * .45}px,${a.top + dy * .45 - 60}px) scale(${1 + (s - 1) * .4})`, offset:.5 },
      { transform:`translate(${b.left}px,${b.top}px) scale(${s})`, boxShadow:'0 0 0 6px rgba(255,255,255,.55),0 18px 30px -18px rgba(13,31,66,.5)' }
    ], { duration:900, easing:EASE_IO, fill:'forwards' });
    const land = () => { host.classList.remove('is-waiting'); try { flight.hidePopover(); } catch {} flight.replaceChildren(); };
    anim.finished.then(land, land);
  });
}
function closeCase(){
  if (!sheet.open) return;
  const id = current && current.id;
  const done = () => {
    sheet.classList.remove('is-closing'); sheet.close(); document.body.style.overflow = '';
    if (location.hash.startsWith('#projeto/')) history.replaceState(null, '', '#trabalhos');
    const back = id && $(`.brand-card[data-id="${id}"] a`);
    (back || opener)?.focus({ preventScroll:true });
    current = null;
  };
  if (motionOn()) { sheet.classList.add('is-closing'); setTimeout(done, 430); } else done();
}
function route(){
  const m = location.hash.match(/^#projeto\/([\w-]+)/);
  if (m) openCase(m[1]); else if (sheet.open) closeCase();
}
addEventListener('hashchange', route);

/* ---------------- copiar e-mail ---------------- */
$('.copy').addEventListener('click', async e => {
  const b = e.currentTarget, s = $('.copy-state', b);
  try { await navigator.clipboard.writeText(b.dataset.copy); s.textContent = t('copied'); b.classList.add('is-done'); }
  catch { location.href = 'mailto:' + b.dataset.copy; return; }
  setTimeout(() => { b.classList.remove('is-done'); s.textContent = t('copy'); }, 2400);
});

/* ---------------- entradas ---------------- */
const revealObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); revealObs.unobserve(e.target); }
}), { rootMargin:'0px 0px -10% 0px' });
$$('.reveal').forEach(el => revealObs.observe(el));

/* ---------------- início ---------------- */
window.LicyaPortfolio = { works, seal, lang: () => lang };
$('#year').textContent = new Date().getFullYear();
applyLang();
onScroll();
ripple.start();
route();
})();
