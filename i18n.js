/* Licya Oliveira — textos do portfólio em 6 idiomas.
   Inglês é o idioma principal (é o que está no HTML). Os demais trocam os textos marcados
   com data-i18n / data-i18n-attr. Os textos dos projetos em pt/en ficam em app.js;
   aqui entram es, de, fr e it de cada projeto. */
window.LICYA_I18N = (() => {
const LANGS = [
  { code:'en', name:'English', html:'en' },
  { code:'pt', name:'Português', html:'pt-BR' },
  { code:'es', name:'Español', html:'es' },
  { code:'de', name:'Deutsch', html:'de' },
  { code:'fr', name:'Français', html:'fr' },
  { code:'it', name:'Italiano', html:'it' }
];

const ui = {
  en:{
    skip:'Skip to content', brandLabel:'Licya Oliveira, home', navLabel:'Main', navWork:'Work', navAbout:'About', navContact:'Contact', langLabel:'Choose language',
    heroEyebrow:'Design & development · Fortaleza, Brazil',
    heroLead:'Visual identities, websites and content for brands that want to be remembered — from the first sketch to the last line of code.',
    heroCta:'See the work', heroCta2:'Start a project', cue:'Scroll into the forest',
    manifestoLabel:'What I do',
    manifesto:'I create visual identities, build websites and look after the content that keeps each brand alive. The same eye follows the business from the first sketch to published code — calmly, with intention and attention to detail.',
    discId:'Visual identity', discIdText:'Wordmarks, palettes and applications that give a brand a recognizable face.',
    discWeb:'Websites & apps', discWebText:'Websites, digital catalogs and applications, designed and hand-coded.',
    discContent:'Social content', discContentText:'Editorial planning, layouts and short-form video for social media.',
    workLabel:'Selected work', workTitle:'Brands I helped', workTitleEm:'build.',
    workLead:'Each brand with its own identity. Open a project to see its context, what was done and the material delivered.',
    filterLabel:'Filter projects', fAll:'All', fId:'Identity', fWeb:'Web', fContent:'Content',
    aboutLabel:'About', aboutTitle:'Design meets', aboutTitleEm:'development.',
    portraitAlt:'Licya Oliveira at night, smiling, with the city lights behind her', portraitCap:'Design & development',
    aboutBig:'I design identities and build websites for businesses. My work often continues into the social posts and everyday materials that bring a brand to life.',
    aboutText:'I’m studying Systems Analysis and Development at Unichristus. Alongside independent projects, I’ve coordinated technical projects, organized content deliveries and supported cloud learning in student communities.',
    factPlaceLabel:'Based in', factStudyLabel:'Studies', factStudy:'Systems Analysis · Unichristus', factSinceLabel:'Own projects', factSince:'Since 2025',
    expTitle:'Experience', exp1When:'Since 2025', exp1:'Independent projects', exp1Text:'Web, visual identity and social media',
    exp2When:'Apr–Oct 2026', exp2Text:'Campus Student Leader', exp3When:'Jan 2024–Aug 2026', exp3Text:'Technology Supervisor',
    exp4When:'Jan–Apr 2026', exp4Text:'Social Media', exp5Text:'Full Stack Technical Program',
    contactLabel:'Contact', contactTitle:'Shall we create something', contactTitleEm:'together?',
    contactLead:'Have a brand, website or content project in mind? Tell me what you’re working on.', contactCta:'Send an email',
    footer:'Design & development · Fortaleza, BR',
    railLabel:'Journey', rail1:'Edge', rail2:'Trail', rail3:'River', rail4:'Path', rail5:'Clearing',
    viewsLabel:'Project views', close:'Close project', ctxLabel:'Context', doneLabel:'What was done', itemsLabel:'Deliverables', paletteLabel:'Brand colors',
    otherProjects:'Other projects', prev:'Previous', next:'Next', viewProject:'View project'
  },
  pt:{
    skip:'Pular para o conteúdo', brandLabel:'Licya Oliveira, início', navLabel:'Principal', navWork:'Trabalhos', navAbout:'Sobre', navContact:'Contato', langLabel:'Escolher idioma',
    heroEyebrow:'Design & desenvolvimento · Fortaleza, Ceará',
    heroLead:'Identidades visuais, sites e conteúdo para marcas que querem ser lembradas — do primeiro traço à última linha de código.',
    heroCta:'Conhecer os trabalhos', heroCta2:'Iniciar um projeto', cue:'Role para entrar na mata',
    manifestoLabel:'O que eu faço',
    manifesto:'Crio identidades visuais, construo sites e cuido do conteúdo que mantém cada marca viva. O mesmo olhar acompanha o negócio do primeiro esboço até o código publicado — com calma, intenção e atenção aos detalhes.',
    discId:'Identidade visual', discIdText:'Logotipos, paletas e aplicações que dão à marca um rosto reconhecível.',
    discWeb:'Sites & aplicativos', discWebText:'Sites, catálogos digitais e aplicativos, desenhados e escritos à mão.',
    discContent:'Conteúdo social', discContentText:'Planejamento editorial, layouts e vídeos curtos para as redes.',
    workLabel:'Trabalhos selecionados', workTitle:'Marcas que ajudei', workTitleEm:'a construir.',
    workLead:'Cada marca com sua própria identidade. Abra um projeto para ver o contexto, o que foi feito e o material entregue.',
    filterLabel:'Filtrar projetos', fAll:'Todos', fId:'Identidade', fWeb:'Web', fContent:'Conteúdo',
    aboutLabel:'Sobre', aboutTitle:'Design encontra', aboutTitleEm:'desenvolvimento.',
    portraitAlt:'Licya Oliveira à noite, sorrindo, com as luzes da cidade ao fundo', portraitCap:'Design & desenvolvimento',
    aboutBig:'Crio identidades e construo sites para negócios. Muitas vezes o trabalho continua nos posts e nos materiais do dia a dia que dão vida à marca.',
    aboutText:'Estudo Análise e Desenvolvimento de Sistemas na Unichristus. Além dos projetos independentes, coordenei projetos técnicos, organizei entregas de conteúdo e apoiei o aprendizado em nuvem em comunidades estudantis.',
    factPlaceLabel:'Base', factStudyLabel:'Formação', factStudy:'ADS · Unichristus', factSinceLabel:'Projetos próprios', factSince:'Desde 2025',
    expTitle:'Trajetória', exp1When:'Desde 2025', exp1:'Projetos independentes', exp1Text:'Web, identidade visual e redes sociais',
    exp2When:'Abr–Out 2026', exp2Text:'Campus Student Leader', exp3When:'Jan 2024–Ago 2026', exp3Text:'Supervisora de Tecnologia',
    exp4When:'Jan–Abr 2026', exp4Text:'Social Media', exp5Text:'Programa técnico Full Stack',
    contactLabel:'Contato', contactTitle:'Vamos criar algo', contactTitleEm:'juntos?',
    contactLead:'Tem um projeto de marca, site ou conteúdo em mente? Me conte no que você está trabalhando.', contactCta:'Enviar um e-mail',
    footer:'Design & desenvolvimento · Fortaleza, BR',
    railLabel:'Paradas da jornada', rail1:'Borda', rail2:'Trilha', rail3:'Rio', rail4:'Trajetória', rail5:'Clareira',
    viewsLabel:'Vistas do projeto', close:'Fechar projeto', ctxLabel:'Contexto', doneLabel:'O que foi feito', itemsLabel:'Entregas', paletteLabel:'Cores da marca',
    otherProjects:'Outros projetos', prev:'Anterior', next:'Próximo', viewProject:'Ver projeto'
  },
  es:{
    skip:'Saltar al contenido', brandLabel:'Licya Oliveira, inicio', navLabel:'Principal', navWork:'Trabajos', navAbout:'Sobre mí', navContact:'Contacto', langLabel:'Elegir idioma',
    heroEyebrow:'Diseño y desarrollo · Fortaleza, Brasil',
    heroLead:'Identidades visuales, sitios web y contenido para marcas que quieren ser recordadas — del primer trazo a la última línea de código.',
    heroCta:'Ver los trabajos', heroCta2:'Iniciar un proyecto', cue:'Desplázate para entrar al bosque',
    manifestoLabel:'Lo que hago',
    manifesto:'Creo identidades visuales, construyo sitios web y cuido el contenido que mantiene viva cada marca. La misma mirada acompaña al negocio desde el primer boceto hasta el código publicado — con calma, intención y atención al detalle.',
    discId:'Identidad visual', discIdText:'Logotipos, paletas y aplicaciones que dan a la marca un rostro reconocible.',
    discWeb:'Sitios web y apps', discWebText:'Sitios web, catálogos digitales y aplicaciones, diseñados y programados a mano.',
    discContent:'Contenido para redes', discContentText:'Planificación editorial, diseños y videos cortos para redes sociales.',
    workLabel:'Trabajos seleccionados', workTitle:'Marcas que ayudé', workTitleEm:'a construir.',
    workLead:'Cada marca con su propia identidad. Abre un proyecto para ver el contexto, lo que se hizo y el material entregado.',
    filterLabel:'Filtrar proyectos', fAll:'Todos', fId:'Identidad', fWeb:'Web', fContent:'Contenido',
    aboutLabel:'Sobre mí', aboutTitle:'El diseño encuentra el', aboutTitleEm:'desarrollo.',
    portraitAlt:'Licya Oliveira de noche, sonriendo, con las luces de la ciudad detrás', portraitCap:'Diseño y desarrollo',
    aboutBig:'Diseño identidades y construyo sitios web para negocios. A menudo el trabajo continúa en las publicaciones y en los materiales del día a día que dan vida a la marca.',
    aboutText:'Estudio Análisis y Desarrollo de Sistemas en Unichristus. Además de los proyectos independientes, coordiné proyectos técnicos, organicé entregas de contenido y apoyé el aprendizaje en la nube en comunidades estudiantiles.',
    factPlaceLabel:'Base', factStudyLabel:'Formación', factStudy:'Análisis de Sistemas · Unichristus', factSinceLabel:'Proyectos propios', factSince:'Desde 2025',
    expTitle:'Trayectoria', exp1When:'Desde 2025', exp1:'Proyectos independientes', exp1Text:'Web, identidad visual y redes sociales',
    exp2When:'Abr–Oct 2026', exp2Text:'Campus Student Leader', exp3When:'Ene 2024–Ago 2026', exp3Text:'Supervisora de Tecnología',
    exp4When:'Ene–Abr 2026', exp4Text:'Social Media', exp5Text:'Programa técnico Full Stack',
    contactLabel:'Contacto', contactTitle:'¿Creamos algo', contactTitleEm:'juntos?',
    contactLead:'¿Tienes en mente un proyecto de marca, sitio web o contenido? Cuéntame en qué estás trabajando.', contactCta:'Enviar un correo',
    footer:'Diseño y desarrollo · Fortaleza, BR',
    railLabel:'Recorrido', rail1:'Borde', rail2:'Sendero', rail3:'Río', rail4:'Trayectoria', rail5:'Claro',
    viewsLabel:'Vistas del proyecto', close:'Cerrar proyecto', ctxLabel:'Contexto', doneLabel:'Qué se hizo', itemsLabel:'Entregables', paletteLabel:'Colores de la marca',
    otherProjects:'Otros proyectos', prev:'Anterior', next:'Siguiente', viewProject:'Ver proyecto'
  },
  de:{
    skip:'Zum Inhalt springen', brandLabel:'Licya Oliveira, Startseite', navLabel:'Hauptmenü', navWork:'Arbeiten', navAbout:'Über mich', navContact:'Kontakt', langLabel:'Sprache wählen',
    heroEyebrow:'Design & Entwicklung · Fortaleza, Brasilien',
    heroLead:'Visuelle Identitäten, Websites und Inhalte für Marken, die in Erinnerung bleiben wollen — vom ersten Strich bis zur letzten Codezeile.',
    heroCta:'Arbeiten ansehen', heroCta2:'Projekt starten', cue:'Scrollen, um den Wald zu betreten',
    manifestoLabel:'Was ich mache',
    manifesto:'Ich gestalte visuelle Identitäten, baue Websites und kümmere mich um die Inhalte, die jede Marke lebendig halten. Derselbe Blick begleitet das Unternehmen von der ersten Skizze bis zum veröffentlichten Code — ruhig, bewusst und mit Liebe zum Detail.',
    discId:'Visuelle Identität', discIdText:'Logos, Farbpaletten und Anwendungen, die einer Marke ein unverwechselbares Gesicht geben.',
    discWeb:'Websites & Apps', discWebText:'Websites, digitale Kataloge und Anwendungen — gestaltet und von Hand programmiert.',
    discContent:'Social-Media-Inhalte', discContentText:'Redaktionsplanung, Layouts und Kurzvideos für soziale Netzwerke.',
    workLabel:'Ausgewählte Arbeiten', workTitle:'Marken, die ich', workTitleEm:'mitgestaltet habe.',
    workLead:'Jede Marke mit ihrer eigenen Identität. Öffnen Sie ein Projekt, um Kontext, Umsetzung und gelieferte Materialien zu sehen.',
    filterLabel:'Projekte filtern', fAll:'Alle', fId:'Identität', fWeb:'Web', fContent:'Inhalte',
    aboutLabel:'Über mich', aboutTitle:'Design trifft', aboutTitleEm:'Entwicklung.',
    portraitAlt:'Licya Oliveira bei Nacht, lächelnd, mit den Lichtern der Stadt im Hintergrund', portraitCap:'Design & Entwicklung',
    aboutBig:'Ich gestalte Identitäten und baue Websites für Unternehmen. Oft geht die Arbeit weiter — in den Posts und Alltagsmaterialien, die eine Marke lebendig machen.',
    aboutText:'Ich studiere Systemanalyse und -entwicklung an der Unichristus. Neben eigenen Projekten habe ich technische Projekte koordiniert, Content-Lieferungen organisiert und das Cloud-Lernen in studentischen Communities unterstützt.',
    factPlaceLabel:'Standort', factStudyLabel:'Studium', factStudy:'Systemanalyse · Unichristus', factSinceLabel:'Eigene Projekte', factSince:'Seit 2025',
    expTitle:'Werdegang', exp1When:'Seit 2025', exp1:'Eigene Projekte', exp1Text:'Web, visuelle Identität und soziale Medien',
    exp2When:'Apr.–Okt. 2026', exp2Text:'Campus Student Leader', exp3When:'Jan. 2024–Aug. 2026', exp3Text:'Technologie-Supervisorin',
    exp4When:'Jan.–Apr. 2026', exp4Text:'Social Media', exp5Text:'Technisches Full-Stack-Programm',
    contactLabel:'Kontakt', contactTitle:'Wollen wir gemeinsam', contactTitleEm:'etwas schaffen?',
    contactLead:'Haben Sie ein Marken-, Website- oder Content-Projekt im Kopf? Erzählen Sie mir, woran Sie arbeiten.', contactCta:'E-Mail senden',
    footer:'Design & Entwicklung · Fortaleza, BR',
    railLabel:'Reise', rail1:'Waldrand', rail2:'Pfad', rail3:'Fluss', rail4:'Werdegang', rail5:'Lichtung',
    viewsLabel:'Projektansichten', close:'Projekt schließen', ctxLabel:'Kontext', doneLabel:'Umsetzung', itemsLabel:'Leistungen', paletteLabel:'Markenfarben',
    otherProjects:'Weitere Projekte', prev:'Zurück', next:'Weiter', viewProject:'Projekt ansehen'
  },
  fr:{
    skip:'Aller au contenu', brandLabel:'Licya Oliveira, accueil', navLabel:'Principal', navWork:'Projets', navAbout:'À propos', navContact:'Contact', langLabel:'Choisir la langue',
    heroEyebrow:'Design & développement · Fortaleza, Brésil',
    heroLead:'Identités visuelles, sites web et contenus pour les marques qui veulent marquer les esprits — du premier trait à la dernière ligne de code.',
    heroCta:'Voir les projets', heroCta2:'Démarrer un projet', cue:'Faites défiler pour entrer dans la forêt',
    manifestoLabel:'Ce que je fais',
    manifesto:'Je crée des identités visuelles, je conçois des sites web et je prends soin des contenus qui font vivre chaque marque. Le même regard accompagne l’entreprise de la première esquisse au code publié — avec calme, intention et souci du détail.',
    discId:'Identité visuelle', discIdText:'Logos, palettes et déclinaisons qui donnent à la marque un visage reconnaissable.',
    discWeb:'Sites web & applications', discWebText:'Sites web, catalogues numériques et applications, conçus et codés à la main.',
    discContent:'Contenus pour les réseaux', discContentText:'Planification éditoriale, mises en page et vidéos courtes pour les réseaux sociaux.',
    workLabel:'Projets choisis', workTitle:'Des marques que j’ai', workTitleEm:'aidé à construire.',
    workLead:'Chaque marque avec sa propre identité. Ouvrez un projet pour découvrir le contexte, le travail réalisé et les livrables.',
    filterLabel:'Filtrer les projets', fAll:'Tous', fId:'Identité', fWeb:'Web', fContent:'Contenus',
    aboutLabel:'À propos', aboutTitle:'Le design rencontre', aboutTitleEm:'le développement.',
    portraitAlt:'Licya Oliveira de nuit, souriante, avec les lumières de la ville derrière elle', portraitCap:'Design & développement',
    aboutBig:'Je crée des identités et je conçois des sites web pour les entreprises. Souvent, le travail se prolonge dans les publications et les supports du quotidien qui font vivre la marque.',
    aboutText:'J’étudie l’analyse et le développement de systèmes à l’Unichristus. En parallèle de mes projets indépendants, j’ai coordonné des projets techniques, organisé des livraisons de contenus et accompagné l’apprentissage du cloud au sein de communautés étudiantes.',
    factPlaceLabel:'Basée à', factStudyLabel:'Formation', factStudy:'Analyse de systèmes · Unichristus', factSinceLabel:'Projets personnels', factSince:'Depuis 2025',
    expTitle:'Parcours', exp1When:'Depuis 2025', exp1:'Projets indépendants', exp1Text:'Web, identité visuelle et réseaux sociaux',
    exp2When:'Avr.–oct. 2026', exp2Text:'Campus Student Leader', exp3When:'Janv. 2024–août 2026', exp3Text:'Superviseure technologie',
    exp4When:'Janv.–avr. 2026', exp4Text:'Social media', exp5Text:'Programme technique Full Stack',
    contactLabel:'Contact', contactTitle:'Et si on créait quelque chose', contactTitleEm:'ensemble ?',
    contactLead:'Vous avez un projet de marque, de site web ou de contenu en tête ? Parlez-moi de ce sur quoi vous travaillez.', contactCta:'Envoyer un e-mail',
    footer:'Design & développement · Fortaleza, BR',
    railLabel:'Itinéraire', rail1:'Lisière', rail2:'Sentier', rail3:'Rivière', rail4:'Parcours', rail5:'Clairière',
    viewsLabel:'Vues du projet', close:'Fermer le projet', ctxLabel:'Contexte', doneLabel:'Ce qui a été fait', itemsLabel:'Livrables', paletteLabel:'Couleurs de la marque',
    otherProjects:'Autres projets', prev:'Précédent', next:'Suivant', viewProject:'Voir le projet'
  },
  it:{
    skip:'Vai al contenuto', brandLabel:'Licya Oliveira, home', navLabel:'Principale', navWork:'Lavori', navAbout:'Chi sono', navContact:'Contatti', langLabel:'Scegli la lingua',
    heroEyebrow:'Design e sviluppo · Fortaleza, Brasile',
    heroLead:'Identità visive, siti web e contenuti per brand che vogliono essere ricordati — dal primo tratto all’ultima riga di codice.',
    heroCta:'Scopri i lavori', heroCta2:'Inizia un progetto', cue:'Scorri per entrare nel bosco',
    manifestoLabel:'Cosa faccio',
    manifesto:'Creo identità visive, sviluppo siti web e curo i contenuti che mantengono vivo ogni brand. Lo stesso sguardo accompagna l’attività dal primo schizzo al codice pubblicato — con calma, intenzione e attenzione ai dettagli.',
    discId:'Identità visiva', discIdText:'Logotipi, palette e applicazioni che danno al brand un volto riconoscibile.',
    discWeb:'Siti web e app', discWebText:'Siti web, cataloghi digitali e applicazioni, progettati e programmati a mano.',
    discContent:'Contenuti social', discContentText:'Pianificazione editoriale, layout e video brevi per i social.',
    workLabel:'Lavori selezionati', workTitle:'Brand che ho aiutato', workTitleEm:'a costruire.',
    workLead:'Ogni brand con la sua identità. Apri un progetto per vedere il contesto, il lavoro svolto e il materiale consegnato.',
    filterLabel:'Filtra i progetti', fAll:'Tutti', fId:'Identità', fWeb:'Web', fContent:'Contenuti',
    aboutLabel:'Chi sono', aboutTitle:'Il design incontra', aboutTitleEm:'lo sviluppo.',
    portraitAlt:'Licya Oliveira di sera, sorridente, con le luci della città alle spalle', portraitCap:'Design e sviluppo',
    aboutBig:'Creo identità e sviluppo siti web per aziende. Spesso il lavoro continua nei post e nei materiali di tutti i giorni che danno vita al brand.',
    aboutText:'Studio Analisi e Sviluppo di Sistemi all’Unichristus. Oltre ai progetti indipendenti, ho coordinato progetti tecnici, organizzato consegne di contenuti e supportato l’apprendimento del cloud nelle comunità studentesche.',
    factPlaceLabel:'Sede', factStudyLabel:'Formazione', factStudy:'Analisi di sistemi · Unichristus', factSinceLabel:'Progetti propri', factSince:'Dal 2025',
    expTitle:'Percorso', exp1When:'Dal 2025', exp1:'Progetti indipendenti', exp1Text:'Web, identità visiva e social media',
    exp2When:'Apr–ott 2026', exp2Text:'Campus Student Leader', exp3When:'Gen 2024–ago 2026', exp3Text:'Supervisora tecnologica',
    exp4When:'Gen–apr 2026', exp4Text:'Social media', exp5Text:'Programma tecnico Full Stack',
    contactLabel:'Contatti', contactTitle:'Creiamo qualcosa', contactTitleEm:'insieme?',
    contactLead:'Hai in mente un progetto di brand, sito web o contenuti? Raccontami a cosa stai lavorando.', contactCta:'Invia un’e-mail',
    footer:'Design e sviluppo · Fortaleza, BR',
    railLabel:'Tappe del percorso', rail1:'Margine', rail2:'Sentiero', rail3:'Fiume', rail4:'Percorso', rail5:'Radura',
    viewsLabel:'Viste del progetto', close:'Chiudi il progetto', ctxLabel:'Contesto', doneLabel:'Cosa è stato fatto', itemsLabel:'Consegne', paletteLabel:'Colori del brand',
    otherProjects:'Altri progetti', prev:'Precedente', next:'Successivo', viewProject:'Vedi progetto'
  }
};

// textos montados pelo script (contagens, botões que mudam de estado)
const plural = (n, one, many) => n === 1 ? `1 ${one}` : `${n} ${many}`;
const str = {
  en:{ copy:'Copy address', copied:'Address copied', motionOff:'Reduce motion', motionOn:'Turn motion on', open:'Open project',
       projects:n => plural(n, 'project', 'projects'), showing:(n, g) => `Showing ${plural(n, 'project', 'projects')}${g ? ' in ' + g : ''}` },
  pt:{ copy:'Copiar endereço', copied:'Endereço copiado', motionOff:'Reduzir animações', motionOn:'Ativar animações', open:'Abrir projeto',
       projects:n => plural(n, 'projeto', 'projetos'), showing:(n, g) => `Mostrando ${plural(n, 'projeto', 'projetos')}${g ? ' em ' + g : ''}` },
  es:{ copy:'Copiar dirección', copied:'Dirección copiada', motionOff:'Reducir animaciones', motionOn:'Activar animaciones', open:'Abrir proyecto',
       projects:n => plural(n, 'proyecto', 'proyectos'), showing:(n, g) => `Mostrando ${plural(n, 'proyecto', 'proyectos')}${g ? ' en ' + g : ''}` },
  de:{ copy:'Adresse kopieren', copied:'Adresse kopiert', motionOff:'Animationen reduzieren', motionOn:'Animationen aktivieren', open:'Projekt öffnen',
       projects:n => plural(n, 'Projekt', 'Projekte'), showing:(n, g) => `${plural(n, 'Projekt', 'Projekte')} angezeigt${g ? ' in ' + g : ''}` },
  fr:{ copy:'Copier l’adresse', copied:'Adresse copiée', motionOff:'Réduire les animations', motionOn:'Activer les animations', open:'Ouvrir le projet',
       projects:n => plural(n, 'projet', 'projets'), showing:(n, g) => `Affichage de ${plural(n, 'projet', 'projets')}${g ? ' dans ' + g : ''}` },
  it:{ copy:'Copia indirizzo', copied:'Indirizzo copiato', motionOff:'Riduci animazioni', motionOn:'Attiva animazioni', open:'Apri progetto',
       projects:n => plural(n, 'progetto', 'progetti'), showing:(n, g) => `${n === 1 ? '1 progetto mostrato' : n + ' progetti mostrati'}${g ? ' in ' + g : ''}` }
};

const groups = {
  identity:{ en:'Identity', pt:'Identidade', es:'Identidad', de:'Identität', fr:'Identité', it:'Identità' },
  web:{ en:'Web', pt:'Web', es:'Web', de:'Web', fr:'Web', it:'Web' },
  content:{ en:'Content', pt:'Conteúdo', es:'Contenido', de:'Inhalte', fr:'Contenus', it:'Contenuti' }
};

const meta = {
  en:{ title:'Licya Oliveira — Design & development', desc:'Visual identities, websites and social content by Licya Oliveira, designer and developer based in Fortaleza, Brazil.' },
  pt:{ title:'Licya Oliveira — Design & desenvolvimento', desc:'Identidades visuais, sites e conteúdo social por Licya Oliveira, designer e desenvolvedora em Fortaleza, Ceará.' },
  es:{ title:'Licya Oliveira — Diseño y desarrollo', desc:'Identidades visuales, sitios web y contenido para redes de Licya Oliveira, diseñadora y desarrolladora en Fortaleza, Brasil.' },
  de:{ title:'Licya Oliveira — Design & Entwicklung', desc:'Visuelle Identitäten, Websites und Social-Media-Inhalte von Licya Oliveira, Designerin und Entwicklerin in Fortaleza, Brasilien.' },
  fr:{ title:'Licya Oliveira — Design & développement', desc:'Identités visuelles, sites web et contenus sociaux par Licya Oliveira, designer et développeuse basée à Fortaleza, au Brésil.' },
  it:{ title:'Licya Oliveira — Design e sviluppo', desc:'Identità visive, siti web e contenuti social di Licya Oliveira, designer e sviluppatrice a Fortaleza, in Brasile.' }
};

// projetos: es / de / fr / it (pt e en estão em app.js). views = [rótulo, legenda] na mesma ordem; links = rótulos.
const works = {
  fruttiva:{
    kind:{ es:'Identidad visual', de:'Visuelle Identität', fr:'Identité visuelle', it:'Identità visiva' },
    intro:{ es:'Una identidad guiada por la fruta, con la calidez de Ceará.', de:'Eine von der Frucht geleitete Identität mit der Wärme von Ceará.', fr:'Une identité guidée par le fruit, avec la chaleur du Ceará.', it:'Un’identità guidata dalla frutta, con il calore del Ceará.' },
    brief:{ es:'Construir un lenguaje visual reconocible en torno al nombre Fruttiva.', de:'Eine wiedererkennbare Bildsprache rund um den Namen Fruttiva aufbauen.', fr:'Construire un langage visuel reconnaissable autour du nom Fruttiva.', it:'Costruire un linguaggio visivo riconoscibile attorno al nome Fruttiva.' },
    detail:{ es:'El logotipo une una serifa fina con un símbolo de fruta ilustrado. El azul marino profundo da una base coherente al rojo, al ocre y a los motivos ilustrados de toda la identidad.', de:'Das Logo verbindet eine feine Serifenschrift mit einem illustrierten Fruchtsymbol. Tiefes Marineblau gibt Rot, Ocker und den illustrierten Motiven in der gesamten Identität einen einheitlichen Grund.', fr:'Le logo associe un sérif fin à un symbole de fruit illustré. Le bleu marine profond offre une base cohérente au rouge, à l’ocre et aux motifs illustrés de toute l’identité.', it:'Il logotipo unisce un graziato sottile a un simbolo di frutta illustrato. Il blu navy profondo dà una base coerente al rosso, all’ocra e ai motivi illustrati di tutta l’identità.' },
    items:{ es:'Logotipo, ilustraciones de frutas, paleta de colores y guía de identidad.', de:'Logo, Fruchtillustrationen, Farbpalette und Identitätsleitfaden.', fr:'Logo, illustrations de fruits, palette de couleurs et guide d’identité.', it:'Logotipo, illustrazioni di frutta, palette colori e guida all’identità.' },
    views:[
      [{ es:'Logotipo', de:'Logo', fr:'Logo', it:'Logotipo' }, { es:'La serifa fina y la fruta ilustrada comparten el mismo fondo azul marino.', de:'Die feine Serifenschrift und die illustrierte Frucht teilen sich denselben marineblauen Grund.', fr:'Le sérif fin et le fruit illustré partagent le même fond bleu marine.', it:'Il graziato sottile e la frutta illustrata condividono lo stesso fondo blu navy.' }],
      [{ es:'Símbolos', de:'Symbole', fr:'Symboles', it:'Simboli' }, { es:'Los motivos de fruta ocupan una cuadrícula cálida. Cada uno tiene una silueta propia y un pequeño conjunto de trazos repetidos.', de:'Die Fruchtmotive stehen auf einem warmen Raster. Jedes hat eine eigene Silhouette und wenige wiederkehrende Zeichen.', fr:'Les motifs de fruits occupent une grille chaleureuse. Chacun a sa propre silhouette et un petit ensemble de marques répétées.', it:'I motivi di frutta occupano una griglia calda. Ognuno ha una propria sagoma e un piccolo insieme di segni ripetuti.' }],
      [{ es:'Paleta', de:'Palette', fr:'Palette', it:'Palette' }, { es:'El azul marino ancla la identidad. El rojo y el ocre llevan la calidez de las ilustraciones.', de:'Marineblau verankert die Identität. Rot und Ocker tragen die Wärme der Illustrationen.', fr:'Le bleu marine ancre l’identité. Le rouge et l’ocre portent la chaleur des illustrations.', it:'Il blu navy ancora l’identità. Rosso e ocra portano il calore delle illustrazioni.' }],
      [{ es:'Tablero completo', de:'Gesamtübersicht', fr:'Planche complète', it:'Tavola completa' }, { es:'El tablero original reúne logotipo, ilustraciones, paleta y aplicaciones.', de:'Die Originaltafel vereint Logo, Illustrationen, Palette und Anwendungen.', fr:'La planche originale réunit logo, illustrations, palette et déclinaisons.', it:'La tavola originale riunisce logotipo, illustrazioni, palette e applicazioni.' }]
    ]},
  'cm-pisos':{
    kind:{ es:'Sitio web y catálogo de productos', de:'Website & Produktkatalog', fr:'Site web & catalogue produits', it:'Sito web e catalogo prodotti' },
    intro:{ es:'Un catálogo digital con buscador para una empresa de pisos y alfombras.', de:'Ein durchsuchbarer digitaler Katalog für ein Bodenbelagsunternehmen.', fr:'Un catalogue numérique consultable pour une entreprise de revêtements de sol.', it:'Un catalogo digitale consultabile per un’azienda di pavimenti e moquette.' },
    brief:{ es:'Llevar al visitante de la navegación por las opciones de piso hasta una solicitud comercial.', de:'Besucher vom Stöbern in Bodenbelägen bis zur Geschäftsanfrage führen.', fr:'Amener le visiteur de la consultation des revêtements jusqu’à une demande commerciale.', it:'Portare il visitatore dalla navigazione tra i pavimenti fino a una richiesta commerciale.' },
    detail:{ es:'Búsqueda, filtros y paginación organizan el catálogo. Una sección de preguntas frecuentes y un canal de contacto comercial apoyan el siguiente paso cuando el visitante encuentra un producto.', de:'Suche, Filter und Seitennavigation ordnen den Katalog. Ein FAQ-Bereich und ein Vertriebskontakt unterstützen den nächsten Schritt, sobald ein Produkt gefunden ist.', fr:'Recherche, filtres et pagination organisent le catalogue. Une foire aux questions et un contact commercial accompagnent l’étape suivante une fois le produit trouvé.', it:'Ricerca, filtri e paginazione organizzano il catalogo. Una sezione di domande frequenti e un contatto commerciale supportano il passo successivo quando il visitatore trova un prodotto.' },
    items:{ es:'Sitio responsivo, catálogo de productos, FAQ y contacto comercial. Hecho con HTML, CSS y JavaScript.', de:'Responsive Website, Produktkatalog, FAQ und Vertriebskontakt. Umgesetzt mit HTML, CSS und JavaScript.', fr:'Site responsive, catalogue produits, FAQ et contact commercial. Réalisé en HTML, CSS et JavaScript.', it:'Sito responsive, catalogo prodotti, FAQ e contatto commerciale. Realizzato con HTML, CSS e JavaScript.' },
    links:[{ es:'Visitar el sitio', de:'Website besuchen', fr:'Visiter le site', it:'Visita il sito' }],
    views:[
      [{ es:'Escritorio', de:'Desktop', fr:'Ordinateur', it:'Desktop' }, { es:'La página de inicio presenta las fotos de pisos, el catálogo y los enlaces de presupuesto desde la primera pantalla.', de:'Die Startseite zeigt Bodenfotos, Katalog und Angebotslinks schon auf dem ersten Bildschirm.', fr:'La page d’accueil présente les photos de sols, le catalogue et les liens de devis dès le premier écran.', it:'La home presenta le foto dei pavimenti, il catalogo e i link per il preventivo già nella prima schermata.' }],
      [{ es:'Móvil', de:'Smartphone', fr:'Mobile', it:'Mobile' }, { es:'En pantallas estrechas, el título se divide en líneas y las dos acciones principales se apilan al alcance del pulgar.', de:'Auf schmalen Bildschirmen bricht die Überschrift um und die beiden Hauptaktionen stapeln sich in Daumenreichweite.', fr:'Sur écran étroit, le titre passe à la ligne et les deux actions principales s’empilent à portée de pouce.', it:'Sugli schermi stretti il titolo va a capo e le due azioni principali si impilano a portata di pollice.' }],
      [{ es:'Portada', de:'Titelbild', fr:'Couverture', it:'Copertina' }, { es:'La fotografía del pasillo presenta los materiales de piso en un ambiente ya instalado.', de:'Das Flurfoto zeigt die Bodenmaterialien in einer verlegten Umgebung.', fr:'La photo du couloir présente les matériaux de sol dans un espace aménagé.', it:'La foto del corridoio presenta i materiali dei pavimenti in un ambiente già posato.' }]
    ]},
  reis:{
    kind:{ es:'Branding y contenido para redes', de:'Branding & Social-Media-Inhalte', fr:'Branding & contenus sociaux', it:'Branding e contenuti social' },
    intro:{ es:'Identidad gráfica para una oficina de marcas y patentes.', de:'Grafische Identität für eine Marken- und Patentkanzlei.', fr:'Identité graphique pour un cabinet de marques et brevets.', it:'Identità grafica per uno studio di marchi e brevetti.' },
    brief:{ es:'Dar a una marca de servicios profesionales una presencia reconocible en impresos y redes.', de:'Einer Dienstleistungsmarke einen wiedererkennbaren Auftritt in Print und sozialen Medien geben.', fr:'Donner à une marque de services professionnels une présence reconnaissable à l’imprimé comme sur les réseaux.', it:'Dare a un brand di servizi professionali una presenza riconoscibile su stampa e social.' },
    detail:{ es:'El monograma nace de la inicial R y remite a la ® del registro. Recorre aplicaciones claras y oscuras, y un dorado contenido conecta papelería, publicaciones y muestras de la identidad.', de:'Das Monogramm entsteht aus dem Anfangsbuchstaben R und spielt auf das ® der Registrierung an. Es trägt durch helle und dunkle Anwendungen; ein zurückhaltendes Gold verbindet Geschäftsausstattung, Posts und Identitätsmuster.', fr:'Le monogramme naît de l’initiale R et évoque le ® de l’enregistrement. Il traverse les déclinaisons claires et sombres, et un or retenu relie papeterie, publications et échantillons d’identité.', it:'Il monogramma nasce dall’iniziale R e richiama la ® della registrazione. Attraversa applicazioni chiare e scure, e un oro misurato collega cancelleria, post e campioni dell’identità.' },
    items:{ es:'Aplicaciones de la identidad, paleta de la marca y piezas para redes sociales.', de:'Identitätsanwendungen, Markenpalette und Social-Media-Grafiken.', fr:'Déclinaisons de l’identité, palette de la marque et visuels pour les réseaux sociaux.', it:'Applicazioni dell’identità, palette del brand e grafiche per i social.' },
    links:[{ es:'Ver el perfil de la marca', de:'Markenprofil ansehen', fr:'Voir le profil de la marque', it:'Vedi il profilo del brand' }],
    views:[
      [{ es:'Monograma', de:'Monogramm', fr:'Monogramme', it:'Monogramma' }, { es:'El símbolo nace de la inicial R y remite a la ® del registro — el área de actuación de la oficina.', de:'Das Zeichen entsteht aus dem R und verweist auf das ® der Registrierung — das Fachgebiet der Kanzlei.', fr:'Le symbole naît de l’initiale R et évoque le ® de l’enregistrement — le domaine du cabinet.', it:'Il simbolo nasce dall’iniziale R e richiama la ® della registrazione — l’ambito dello studio.' }],
      [{ es:'Patrón', de:'Muster', fr:'Motif', it:'Pattern' }, { es:'El monograma repetido convierte la identidad en superficie.', de:'Das wiederholte Monogramm macht die Identität zur Fläche.', fr:'Le monogramme répété transforme l’identité en surface.', it:'Il monogramma ripetuto trasforma l’identità in superficie.' }],
      [{ es:'Aplicación dorada', de:'Goldene Anwendung', fr:'Déclinaison dorée', it:'Applicazione oro' }, { es:'La marca oscura sobre el dorado invierte el contraste de la versión principal.', de:'Das dunkle Logo auf Gold kehrt den Kontrast der Hauptversion um.', fr:'La marque sombre sur fond doré inverse le contraste de la version principale.', it:'Il marchio scuro sull’oro inverte il contrasto della versione principale.' }],
      [{ es:'Tablero completo', de:'Gesamtübersicht', fr:'Planche complète', it:'Tavola completa' }, { es:'El tablero original muestra la identidad en papelería, señalización e impresos.', de:'Die Originaltafel zeigt die Identität auf Geschäftsausstattung, Beschilderung und Drucksachen.', fr:'La planche originale montre l’identité sur la papeterie, la signalétique et les imprimés.', it:'La tavola originale mostra l’identità su cancelleria, segnaletica e stampati.' }]
    ]},
  'reis-app':{
    kind:{ es:'Aplicación colaborativa', de:'Kollaborative App', fr:'Application collaborative', it:'Applicazione collaborativa' },
    intro:{ es:'Una visión compartida del avance de los trámites de una oficina de marcas.', de:'Ein gemeinsamer Überblick über den Fortschritt der Verfahren einer Markenkanzlei.', fr:'Une vue partagée de l’avancement des dossiers d’un cabinet de marques.', it:'Una visione condivisa dell’avanzamento delle pratiche di uno studio di marchi.' },
    brief:{ es:'Conectar clientes, equipo y socios en una sola aplicación multiplataforma.', de:'Kunden, Team und Partner in einer einzigen plattformübergreifenden App verbinden.', fr:'Relier clients, équipe et partenaires dans une seule application multiplateforme.', it:'Collegare clienti, team e partner in un’unica app multipiattaforma.' },
    detail:{ es:'El proyecto incluye registro, autenticación, perfiles y seguimiento visual de los trámites. Licya mantiene el repositorio original del equipo y una entrega consolidada.', de:'Das Projekt umfasst Registrierung, Authentifizierung, Profile und eine visuelle Verfahrensverfolgung. Licya pflegt das ursprüngliche Team-Repository und eine konsolidierte Fassung.', fr:'Le projet comprend inscription, authentification, profils et suivi visuel des dossiers. Licya maintient le dépôt original de l’équipe et une version consolidée.', it:'Il progetto include registrazione, autenticazione, profili e monitoraggio visivo delle pratiche. Licya mantiene il repository originale del team e una versione consolidata.' },
    items:{ es:'Aplicación colaborativa en Flutter y Dart. Repositorio original del equipo y código consolidado.', de:'Kollaborative App in Flutter und Dart. Ursprüngliches Team-Repository und konsolidierter Code.', fr:'Application collaborative en Flutter et Dart. Dépôt original de l’équipe et code consolidé.', it:'App collaborativa in Flutter e Dart. Repository originale del team e codice consolidato.' },
    links:[
      { es:'Repositorio del equipo', de:'Team-Repository', fr:'Dépôt de l’équipe', it:'Repository del team' },
      { es:'Código consolidado', de:'Konsolidierter Code', fr:'Code consolidé', it:'Codice consolidato' }
    ],
    views:[[{ es:'Marca', de:'Marke', fr:'Marque', it:'Marchio' }, { es:'La marca Reis identifica a la organización detrás de la aplicación.', de:'Die Marke Reis steht für die Organisation hinter der App.', fr:'La marque Reis identifie l’organisation derrière l’application.', it:'Il marchio Reis identifica l’organizzazione dietro l’app.' }]]},
  aurora:{
    kind:{ es:'Belleza · Contenido para redes', de:'Beauty · Social-Media-Inhalte', fr:'Beauté · Contenus sociaux', it:'Bellezza · Contenuti social' },
    intro:{ es:'Presencia en redes para un estudio de belleza.', de:'Social-Media-Auftritt für ein Beauty-Studio.', fr:'Présence sur les réseaux pour un studio de beauté.', it:'Presenza social per uno studio di bellezza.' },
    brief:{ es:'Llevar al feed a las personas y los servicios del estudio.', de:'Die Menschen und Leistungen des Studios in den Feed bringen.', fr:'Faire entrer dans le fil les personnes et les services du studio.', it:'Portare nel feed le persone e i servizi dello studio.' },
    detail:{ es:'El tablero reúne equipo, tratamientos y videos cortos. Recursos tipográficos recurrentes dan aire de familia a publicaciones visualmente distintas.', de:'Die Übersicht vereint Team, Behandlungen und Kurzvideos. Wiederkehrende Typografie verleiht optisch unterschiedlichen Posts eine Familienähnlichkeit.', fr:'La planche réunit équipe, soins et vidéos courtes. Des traitements typographiques récurrents donnent un air de famille à des publications visuellement différentes.', it:'La tavola riunisce team, trattamenti e video brevi. Trattamenti tipografici ricorrenti danno un’aria di famiglia a post visivamente diversi.' },
    items:{ es:'Identidad visual y contenido para redes sociales.', de:'Visuelle Identität und Social-Media-Inhalte.', fr:'Identité visuelle et contenus pour les réseaux sociaux.', it:'Identità visiva e contenuti per i social.' },
    links:[{ es:'Ver el perfil del estudio', de:'Studioprofil ansehen', fr:'Voir le profil du studio', it:'Vedi il profilo dello studio' }],
    views:[[{ es:'Feed', de:'Feed', fr:'Fil', it:'Feed' }, { es:'Equipo, tratamientos y videos cortos reunidos en el feed del estudio.', de:'Team, Behandlungen und Kurzvideos im Feed des Studios.', fr:'Équipe, soins et vidéos courtes réunis dans le fil du studio.', it:'Team, trattamenti e video brevi riuniti nel feed dello studio.' }]]},
  meta:{
    kind:{ es:'Cabello · Contenido para redes', de:'Haarpflege · Social-Media-Inhalte', fr:'Cheveux · Contenus sociaux', it:'Capelli · Contenuti social' },
    intro:{ es:'Contenido editorial para una clínica especializada en trasplante capilar.', de:'Redaktionelle Inhalte für eine auf Haartransplantation spezialisierte Klinik.', fr:'Contenus éditoriaux pour une clinique spécialisée en greffe de cheveux.', it:'Contenuti editoriali per una clinica specializzata nel trapianto di capelli.' },
    brief:{ es:'Presentar los servicios de la clínica en un feed coherente.', de:'Die Leistungen der Klinik in einem stimmigen Feed präsentieren.', fr:'Présenter les services de la clinique dans un fil cohérent.', it:'Presentare i servizi della clinica in un feed coerente.' },
    detail:{ es:'Diseños oscuros, fotos en primer plano y tipografía de alto contraste conectan las imágenes de tratamiento con las conversaciones sobre los servicios de la clínica.', de:'Dunkle Layouts, Nahaufnahmen und kontrastreiche Typografie verbinden Behandlungsbilder mit Gesprächen über die Leistungen der Klinik.', fr:'Mises en page sombres, gros plans et typographie très contrastée relient les images de soins aux échanges sur les services de la clinique.', it:'Layout scuri, foto ravvicinate e tipografia ad alto contrasto collegano le immagini dei trattamenti alle conversazioni sui servizi della clinica.' },
    items:{ es:'Diseños y contenido visual para redes sociales.', de:'Layouts und visuelle Inhalte für soziale Medien.', fr:'Mises en page et contenus visuels pour les réseaux sociaux.', it:'Layout e contenuti visivi per i social.' },
    links:[{ es:'Ver el perfil de la clínica', de:'Klinikprofil ansehen', fr:'Voir le profil de la clinique', it:'Vedi il profilo della clinica' }],
    views:[[{ es:'Feed', de:'Feed', fr:'Fil', it:'Feed' }, { es:'Diseños oscuros y tipografía de alto contraste en el feed de la clínica.', de:'Dunkle Layouts und kontrastreiche Typografie im Feed der Klinik.', fr:'Mises en page sombres et typographie contrastée dans le fil de la clinique.', it:'Layout scuri e tipografia ad alto contrasto nel feed della clinica.' }]]},
  grupo:{
    kind:{ es:'Servicios · Contenido para redes', de:'Dienstleistungen · Social-Media-Inhalte', fr:'Services · Contenus sociaux', it:'Servizi · Contenuti social' },
    intro:{ es:'Comunicación en redes para un grupo de seguridad y servicios generales.', de:'Social-Media-Kommunikation für eine Sicherheits- und Facility-Gruppe.', fr:'Communication sur les réseaux pour un groupe de sécurité et de services aux bâtiments.', it:'Comunicazione social per un gruppo di sicurezza e facility management.' },
    brief:{ es:'Mostrar a las personas y los servicios detrás de una operación.', de:'Die Menschen und Leistungen hinter einem operativen Betrieb zeigen.', fr:'Montrer les personnes et les services derrière une activité opérationnelle.', it:'Mostrare le persone e i servizi dietro un’attività operativa.' },
    detail:{ es:'El tablero combina registros en campo, imágenes del equipo y el tratamiento oscuro y dorado de la marca — una voz editorial reconocible para una empresa de servicios.', de:'Die Übersicht kombiniert Aufnahmen vor Ort, Teambilder und die dunkle, goldene Markenwelt — eine wiedererkennbare redaktionelle Stimme für ein Dienstleistungsunternehmen.', fr:'La planche associe images de terrain, photos de l’équipe et le traitement sombre et doré de la marque — une voix éditoriale reconnaissable pour une entreprise de services.', it:'La tavola unisce riprese sul campo, immagini del team e il trattamento scuro e oro del brand — una voce editoriale riconoscibile per un’azienda di servizi.' },
    items:{ es:'Piezas para redes sociales y contenido centrado en servicios.', de:'Social-Media-Grafiken und servicebezogene Inhalte.', fr:'Visuels pour les réseaux sociaux et contenus axés sur les services.', it:'Grafiche social e contenuti incentrati sui servizi.' },
    links:[{ es:'Ver el perfil del grupo', de:'Gruppenprofil ansehen', fr:'Voir le profil du groupe', it:'Vedi il profilo del gruppo' }],
    views:[[{ es:'Feed', de:'Feed', fr:'Fil', it:'Feed' }, { es:'Registros en campo, equipo y la marca dorada en el feed del grupo.', de:'Aufnahmen vor Ort, Team und das goldene Logo im Feed der Gruppe.', fr:'Images de terrain, équipe et marque dorée dans le fil du groupe.', it:'Riprese sul campo, team e marchio oro nel feed del gruppo.' }]]},
  aguas:{
    kind:{ es:'Estrategia en redes y creación de perfil', de:'Social-Media-Strategie & Profilaufbau', fr:'Stratégie sociale & création de profil', it:'Strategia social e creazione del profilo' },
    intro:{ es:'Una presencia en Instagram construida desde cero para inspección técnica de aguas.', de:'Ein von Grund auf aufgebauter Instagram-Auftritt für technische Wasserprüfung.', fr:'Une présence Instagram construite de zéro pour l’inspection technique de l’eau.', it:'Una presenza Instagram costruita da zero per l’ispezione tecnica delle acque.' },
    brief:{ es:'Estructurar un perfil nuevo y planificar su contenido.', de:'Ein neues Profil strukturieren und seine Inhalte planen.', fr:'Structurer un nouveau profil et planifier ses contenus.', it:'Strutturare un nuovo profilo e pianificarne i contenuti.' },
    detail:{ es:'El registro del proyecto documenta la configuración del perfil y el contenido en video corto. La vista previa muestra la cuenta y ejemplos del feed.', de:'Die Projektdokumentation zeigt den Profilaufbau und die Kurzvideo-Inhalte. Die Vorschau zeigt das Konto und Beispiele aus dem Feed.', fr:'Le dossier du projet documente la configuration du profil et les vidéos courtes. L’aperçu montre le compte et des exemples du fil.', it:'La documentazione del progetto mostra la configurazione del profilo e i video brevi. L’anteprima mostra l’account ed esempi dal feed.' },
    items:{ es:'Estructura de perfil, estrategia de contenido y contenido orgánico.', de:'Profilstruktur, Content-Strategie und organische Inhalte.', fr:'Structure du profil, stratégie de contenu et contenus organiques.', it:'Struttura del profilo, strategia dei contenuti e contenuti organici.' },
    links:[{ es:'Ver los reels', de:'Reels ansehen', fr:'Voir les reels', it:'Guarda i reel' }],
    views:[[{ es:'Perfil y feed', de:'Profil & Feed', fr:'Profil & fil', it:'Profilo e feed' }, { es:'El perfil estructurado y ejemplos de videos cortos del feed.', de:'Das strukturierte Profil und Beispiele für Kurzvideos aus dem Feed.', fr:'Le profil structuré et des exemples de vidéos courtes du fil.', it:'Il profilo strutturato ed esempi di video brevi dal feed.' }]]}
};

return { LANGS, ui, str, groups, meta, works };
})();
