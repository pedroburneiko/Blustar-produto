// add-module.js — HUB do "Add module" (slots + modal + definições de templates)
// (Fase 3). Lift VERBATIM do IIFE inteiro (~2962L) — NÃO decomposto, é o motor
// de templates do app. Bridge via window.__praia* documentada.
// Expõe 13 globais (BuildTemplate/Registries/WrapMasterInMirror/ApplyMirrorScale/
// EnsureMirrorObserver/IsTextTpl/PropagateTemplate/RemeasureTextTemplates/
// SanitizeOverrideForInstance/CloseRightModes/Copy/Toast/TplOverrides).
// Consome ~19 globais via window.__praia* (handlers). Antes do state.js.
/* Add module — slots + modal */
(() => {
  const overlay = document.getElementById('am-overlay');
  if (!overlay) return;
  const grid = document.getElementById('am-grid');
  const previewEl = document.getElementById('am-preview');
  const titleEl = document.getElementById('am-preview-title');
  const subEl = document.getElementById('am-preview-sub');
  const descEl = document.getElementById('am-preview-desc');
  const closeBtn = document.getElementById('am-close');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));

  const previews = {
    'Text & Image': '<svg viewBox="0 0 220 130" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M10 30h90M10 50h90M10 70h90M10 90h60"/><rect x="120" y="20" width="90" height="80"/><path d="M132 80l16-16 12 12 8-6 18 16"/><circle cx="142" cy="44" r="6"/></svg>',
    Heading: '<svg viewBox="0 0 220 130" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M30 90V40M30 60h50M80 90V40" stroke-width="3"/></svg>',
    Text: '<svg viewBox="0 0 220 130" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M30 40h160M30 60h160M30 80h160M30 100h100"/></svg>',
    Colors:
      '<svg viewBox="0 0 220 130" fill="none"><rect x="20" y="30" width="40" height="70" fill="currentColor" opacity="0.3"/><rect x="70" y="30" width="40" height="70" fill="currentColor" opacity="0.5"/><rect x="120" y="30" width="40" height="70" fill="currentColor" opacity="0.7"/><rect x="170" y="30" width="30" height="70" fill="currentColor" opacity="0.9"/></svg>',
    'Empty grid': '<svg viewBox="0 0 220 130" fill="none" stroke="currentColor"><rect x="20" y="25" width="80" height="80"/><rect x="115" y="25" width="80" height="80"/></svg>',
    'Text cards': '<svg viewBox="0 0 220 130" fill="none" stroke="currentColor" stroke-linecap="round"><rect x="20" y="20" width="80" height="90"/><rect x="115" y="20" width="80" height="90"/><path d="M32 40h56M32 56h56M32 72h36M127 40h56M127 56h56M127 72h36"/></svg>',
  };
  const descs = {
    Heading: { sub: '1 column', desc: 'Standalone heading. Use for new sections or page anchors.' },
    Text: { sub: '1 column', desc: 'Long-form body text block. Inherits the active text style.' },
    'Text & Image': { sub: '2 - 4 column', desc: 'This is a mixed grid module, for text and image combination, which can be splitted up to 4 columns.' },
    Colors: { sub: 'Token grid', desc: 'Swatches grid using global color tokens. Updates automatically.' },
    'Empty grid': { sub: '2 column', desc: 'Empty placeholder grid. Drop in anything later.' },
    'Text cards': { sub: '2 - 3 column', desc: 'Card grid with title and short description per item.' },
  };
  // Thumb realista de templates de foto: grade real (proporção verdadeira de
  // cada célula) centralizada na caixa 16:9 do preview, com letterbox. cols =
  // colunas, count = nº de fotos, ar = aspect-ratio de cada foto. As células
  // herdam o background Moto.png de .tpl-block.
  const __photoThumb = (cols, count, ar) =>
    '<div class="am-tpl-thumb" style="display:flex;align-items:center;justify-content:center;padding:0;background:#000">' +
    '<div style="width:100%;display:grid;grid-template-columns:repeat(' +
    cols +
    ',1fr);gap:4px">' +
    Array(count)
      .fill('<div class="tpl-block" style="aspect-ratio:' + ar + '"></div>')
      .join('') +
    '</div>' +
    '</div>';

  const templates = [
    // Foto — grade 4×2 (nosso grid). Cada foto é trocável individualmente pela
    // barra da direita (inspector de imagem). Variante 1:1 e variante 4:5.
    // Thumb realista: a grade real (mesmas proporções de célula do template
    // aplicado) é centralizada na caixa 16:9 do preview, com letterbox — assim
    // 1:1 fica quadrada, 4:5 retrato, 9:16 alta, igual ao template inserido.
    { id: 'photo-grid-4x2', name: 'Grade de fotos 4×2 (1:1)', size: 'lg', thumb: __photoThumb(4, 8, '1') },
    { id: 'photo-grid-4x2-45', name: 'Grade de fotos 4×2 (4:5)', size: 'lg', thumb: __photoThumb(4, 8, '4/5') },
    { id: 'photo-full-169', name: 'Foto full screen (16:9)', size: 'lg', thumb: __photoThumb(1, 1, '16/9') },
    { id: 'photo-grid-3x2-169', name: 'Grade de fotos 3×2 (16:9)', size: 'lg', thumb: __photoThumb(3, 6, '16/9') },
    { id: 'photo-grid-4x1-916', name: 'Grade de fotos 4× (9:16)', size: 'lg', thumb: __photoThumb(4, 4, '9/16') },
    { id: 'photo-grid-2x1-45', name: 'Grade de fotos 2× (4:5)', size: 'lg', thumb: __photoThumb(2, 2, '4/5') },
    { id: 'photo-2-wide', name: '2 fotos panorâmicas (21:9)', size: 'lg', thumb: __photoThumb(1, 2, '21/9') },
    {
      id: 'photo-bento-916',
      name: 'Bento (9:16 + 2×16:9)',
      size: 'lg',
      thumb:
        '<div class="am-tpl-thumb" style="display:flex;align-items:center;justify-content:center;padding:0;background:#000">' +
        '<div style="width:100%;display:grid;grid-template-columns:5fr 7fr;gap:4px;align-items:stretch">' +
        '<div class="tpl-block" style="grid-column:1;grid-row:1/3"></div>' +
        '<div class="tpl-block" style="grid-column:2;grid-row:1;aspect-ratio:16/9"></div>' +
        '<div class="tpl-block" style="grid-column:2;grid-row:2;aspect-ratio:16/9"></div>' +
        '</div>' +
        '</div>',
    },
    // Cleared 2026-05-28 — will rebuild new templates from scratch.
    // Backup: index_v27_templates_backup_20260528_193013.html
    /* { id: 'hero-img', name: 'Hero image', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-rows:1fr"><div class="tpl-block"></div></div>' },
    { id: 'grid-2x2', name: '2×2 photo grid', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:1px">' + Array(4).fill('<div class="tpl-block"></div>').join('') + '</div>' },
    { id: 'gallery-4x3', name: 'Image gallery 4×3', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:6px;padding:0">' + Array(12).fill('<div class="tpl-block"></div>').join('') + '</div>' },
    { id: 'grid-4-square', name: '4 imagens 1:1', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-columns:repeat(4,1fr);gap:6px;padding:0;align-items:center">' + Array(4).fill('<div class="tpl-block" style="aspect-ratio:1"></div>').join('') + '</div>' },
    { id: 'collage-3', name: 'Image collage', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;position:relative"><div class="tpl-block" style="position:absolute;top:4%;right:8%;width:46%;height:48%"></div><div class="tpl-block" style="position:absolute;left:6%;top:30%;width:54%;height:56%"></div><div class="tpl-block" style="position:absolute;right:14%;bottom:6%;width:36%;height:38%"></div></div>' },
    { id: 'stripe-3', name: 'Three image strip', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-columns:repeat(3,1fr);gap:6px;padding:0"><div class="tpl-block"></div><div class="tpl-block"></div><div class="tpl-block"></div></div>' },
    { id: 'img-hero-pair', name: 'Hero + square image', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;padding:14px;grid-template-columns:1fr 1fr;gap:14px;align-items:center"><div style="display:flex;flex-direction:column;gap:6px"><div style="font:600 13px/1.05 var(--font);color:var(--bs-white);letter-spacing:-0.02em">Enterprise-grade security for your brand intelligence</div><div style="font:6.5px/1.4 var(--font);color:rgba(255,255,255,0.6);margin-top:3px">Your brand is your most valuable asset. We protect it like it is.</div></div><div class="tpl-block" style="aspect-ratio:1;border-radius:8px"></div></div>' },
    { id: 'img-compliance', name: 'Compliance badges', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;padding:14px;grid-template-columns:1fr 1fr;gap:14px;align-items:center"><div style="display:flex;flex-direction:column;gap:5px"><div style="font:700 6px/1 var(--font);color:var(--bs-cyan);letter-spacing:0.14em;text-transform:uppercase">Certified & compliant</div><div style="font:600 11px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em;margin-top:4px">We maintain compliance with the most rigorous standards</div><div style="margin-top:7px;background:var(--bs-white);color:var(--bs-navy);font:700 7px/1 var(--font);padding:5px 9px;border-radius:6px;width:fit-content">Visit trust portal</div></div><div style="display:flex;gap:6px;align-items:center;justify-content:center">' + ['var(--bs-white)','var(--bs-white)','var(--bs-blue)'].map(c=>`<div style="width:34px;height:34px;background:${c};border-radius:8px"></div>`).join('') + '</div></div>' },
    { id: 'img-features-list', name: 'Image + feature list', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;padding:14px;grid-template-columns:1fr 1fr;gap:14px;align-items:center"><div class="tpl-block" style="aspect-ratio:1;border-radius:8px"></div><div style="display:flex;flex-direction:column;gap:7px">' + [['SSO integration','Support for all common Single Sign-On protocols.'],['Data retention','Set and manage retention periods.'],['Audit logging','Complete visibility into who accesses your data.']].map(([t,d])=>`<div><div style="font:600 7px/1 var(--font);color:var(--bs-white);margin-bottom:2px">${t}</div><div style="font:5.5px/1.4 var(--font);color:rgba(255,255,255,0.6)">${d}</div></div>`).join('') + '</div></div>' },
    { id: 'img-caption-below', name: 'Image + caption below', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;padding:14px;grid-template-rows:1fr auto;gap:7px"><div class="tpl-block" style="border-radius:6px"></div><div><div style="font:600 7px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Find exactly what you want</div><div style="font:5.5px/1.4 var(--font);color:rgba(255,255,255,0.6);margin-top:2px">Get specific with your search. Year, color, campaign, product, lighting, photographer.</div></div></div>' },
    { id: 'img-three-features', name: 'Three features with image', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;padding:14px;grid-template-columns:repeat(3,1fr);gap:9px;align-content:start">' + [['Keep everyone aligned','One living foundation for marketing, sales, product.'],['Reduce swirl','Instant answers about your brand standards.'],['Update once, sync everywhere','Your Brand OS grows with you and adapts.']].map(([t,d])=>`<div style="display:flex;flex-direction:column;gap:4px"><div class="tpl-block" style="aspect-ratio:4/5;border-radius:5px"></div><div style="font:600 6.5px/1.1 var(--font);color:var(--bs-white);margin-top:3px">${t}</div><div style="font:5px/1.4 var(--font);color:rgba(255,255,255,0.6)">${d}</div></div>`).join('') + '</div>' }, */
  ];
  const tplSpanByName = { sm: 'tpl-h-sm', md: 'tpl-h-md', lg: 'tpl-h-lg', xl: 'tpl-h-xl' };

  const textTemplates = [
    // 2026-05-28: novo template #1 — eyebrow lateral + statement de tipografia.
    // Thumb e inserção compartilham o mesmo markup via override registrado abaixo.
    { id: 'txt-craft-cover', name: 'Cover', size: 'lg' },
    { id: 'txt-photo-statement', name: '01', size: 'lg' },
    { id: 'txt-shaping-worlds', name: '02', size: 'lg' },
    { id: 'txt-in-use', name: '03', size: 'lg' },
    { id: 'txt-type-voice', name: '04', size: 'lg' },
    { id: 'txt-page-header', name: '05', size: 'lg' },
    { id: 'txt-further-reading', name: '06', size: 'lg' },
    { id: 'txt-made-by', name: '07', size: 'lg' },
    { id: 'txt-button', name: '08', size: 'lg' },
    // Cleared 2026-05-28 — see backup index_v27_templates_backup_20260528_193013.html
    /* { id: 'txt-cover', name: 'Cover', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:14px 16px;grid-template-rows:auto 1fr auto;align-content:stretch;gap:0"><div style="font:500 5.5px/1.4 var(--font);color:var(--bs-white);letter-spacing:0.04em">02.CRAFT</div><div style="display:flex;align-items:flex-end;justify-content:flex-start"><div style="font:600 19px/1 var(--font);color:var(--bs-white);letter-spacing:-0.02em">Craft in an age<br/>of infinite output</div></div><div style="display:flex;justify-content:flex-end"><div style="font:500 5.5px/1.4 var(--font);color:rgba(255,255,255,0.55);letter-spacing:0.04em">Reading time: 30 min</div></div></div>' },
    { id: 'txt-heading', name: 'Heading', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;justify-content:center;background:var(--bs-navy);padding:14px 22px"><div style="font:600 16px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">New heading</div></div>' },
    { id: 'txt-text', name: 'Text', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;justify-content:center;background:var(--bs-navy);padding:14px 22px"><div style="font:10px/1.5 var(--font);color:rgba(255,255,255,0.72)">Bloco de texto. Edite o conteúdo livremente.</div></div>' },
    { id: 'txt-text-cards', name: 'Text cards', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;grid-template-columns:1fr 1fr;gap:18px;background:var(--bs-navy);padding:16px 18px;align-content:center">' + Array(2).fill(0).map(()=>`<div><div style="font:600 11px/1.15 var(--font);color:var(--bs-white)">Card title</div><div style="font:8px/1.45 var(--font);color:rgba(255,255,255,0.68);margin-top:6px">Short description for this card with one or two supporting lines.</div></div>`).join('') + '</div>' },
    { id: 'txt-display', name: 'Display heading', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;justify-content:center;background:var(--bs-navy);padding:16px 22px"><div style="font:600 20px/1.05 var(--font);color:var(--bs-white);letter-spacing:-0.02em">Você roda.<br/>A Yamaha cuida.</div></div>' },
    { id: 'txt-rule-twocol', name: 'Term + definition', size: 'sm',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:16px 18px"><div style="border-top:1px solid rgba(255,255,255,0.18);display:grid;grid-template-columns:1fr 2fr;gap:18px;padding-top:10px"><div style="font:600 11px/1.2 var(--font);color:var(--bs-white)">Vision</div><div style="font:9px/1.45 var(--font);color:rgba(255,255,255,0.68)">A long-term aspiration for how we move forward and the future we hope to create.</div></div></div>' },
    { id: 'txt-hero-cta', name: 'Hero + CTA', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);justify-items:center;align-items:center;padding:22px 18px;text-align:center"><div style="display:flex;flex-direction:column;gap:8px;align-items:center;max-width:90%"><div style="font:700 6px/1 var(--font);color:var(--bs-cyan);letter-spacing:0.16em;text-transform:uppercase">Brand OS</div><div style="font:600 17px/1.04 var(--font);color:var(--bs-white);letter-spacing:-0.02em">The operating system<br/>for modern brand work</div><div style="font:8px/1.4 var(--font);color:rgba(255,255,255,0.7);margin-top:2px;max-width:80%">Turn guidelines, strategy, and signals into structured intelligence.</div><div style="margin-top:6px;background:var(--bs-cyan);color:var(--bs-navy);font:700 8px/1 var(--font);padding:7px 13px;border-radius:var(--r-full)">Book a demo</div></div></div>' },
    { id: 'txt-manifesto', name: 'Manifesto line', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);justify-items:center;align-items:center;padding:18px 22px;text-align:center"><div style="font:500 13px/1.3 var(--font);color:rgba(255,255,255,0.78);letter-spacing:-0.01em;max-width:88%">Brand is your most valuable asset. <span style="color:var(--bs-cyan);font-weight:600">BluStar</span> makes it machine-readable so every team, tool, and agent gets it right.</div></div>' },
    { id: 'txt-section-intro', name: 'Section intro + CTA', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:20px 22px;justify-content:center;align-items:flex-start"><div style="font:700 6px/1 var(--font);color:var(--bs-cyan);letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px">Platform</div><div style="font:600 14px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Brand OS</div><div style="font:500 11px/1.25 var(--font);color:rgba(255,255,255,0.7);margin-top:5px;max-width:60%">The structured intelligence layer for your brand</div><div style="margin-top:12px;background:var(--bs-cyan);color:var(--bs-navy);font:700 8px/1 var(--font);padding:7px 13px;border-radius:var(--r-full);width:fit-content">Learn more</div></div>' },
    { id: 'txt-testimonial', name: 'Big testimonial', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:18px 22px;justify-items:center;align-items:center;text-align:center"><div style="display:flex;flex-direction:column;gap:10px;align-items:center;max-width:92%"><div style="font:500 12px/1.25 var(--font);color:var(--bs-white);letter-spacing:-0.01em">"As I build us into a global brand, BluStar will help the entire company become a global brand by ensuring consistency across countries, languages and channels."</div><div style="display:flex;gap:6px;align-items:center;margin-top:2px"><div style="width:14px;height:14px;background:var(--bs-cyan);border-radius:50%;color:var(--bs-navy);display:grid;place-items:center;font:700 6px/1 var(--font)">DC</div><div style="text-align:left"><div style="font:600 7px/1 var(--font);color:var(--bs-white)">David Corns</div><div style="font:6px/1.2 var(--font);color:rgba(255,255,255,0.55);margin-top:2px">Chief Marketing Officer, Turo</div></div></div></div></div>' },
    { id: 'txt-cta-panel', name: 'Demo CTA', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);justify-items:center;align-items:center;padding:16px;text-align:center"><div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div style="width:22px;height:22px;background:var(--bs-cyan);border-radius:6px;display:grid;place-items:center;color:var(--bs-navy);font:700 11px/1 var(--font)">★</div><div style="font:600 13px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em;margin-top:4px">Get a personalized demo<br/>for your brand</div><div style="font:7px/1.3 var(--font);color:rgba(255,255,255,0.7)">See how BluStar helps you get time back.</div><div style="margin-top:5px;background:var(--bs-cyan);color:var(--bs-navy);font:700 8px/1 var(--font);padding:7px 13px;border-radius:var(--r-full)">Book a demo</div></div></div>' },
    { id: 'txt-feature-grid', name: 'Feature grid 3×2', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:12px 14px;grid-template-rows:auto 1fr;gap:8px"><div style="font:600 11px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">What you get</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px 12px;align-content:start">' + [['60% faster','Launches with on-brand briefs.'],['One foundation','Same truth for every team.'],['Ship with confidence','Catches issues before launch.'],['2-day onboarding','Quick setup, immediate value.'],['Grow without breaking','Scale from 5 to 50 people.'],['Security included','SSO and role permissions.']].map(([t,d])=>`<div><div style="font:600 7px/1.1 var(--font);color:var(--bs-white);margin-bottom:2px">${t}</div><div style="font:5.5px/1.4 var(--font);color:rgba(255,255,255,0.6)">${d}</div></div>`).join('') + '</div></div>' },
    { id: 'txt-faq', name: 'FAQ', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:16px 18px;grid-template-columns:1fr 1.4fr;gap:18px;align-items:start"><div><div style="font:700 6px/1 var(--font);color:var(--bs-cyan);letter-spacing:0.16em;text-transform:uppercase;margin-bottom:6px">FAQ</div><div style="font:600 13px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Have questions?<br/>Ask us.</div></div><div style="display:flex;flex-direction:column">' + ['What is Brand Assistant?','What is Canvas?','What is Brand Check?','Will AI replace our creative team?'].map(q=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-top:1px solid rgba(255,255,255,0.12);font:500 7px/1.2 var(--font);color:var(--bs-white)"><span>${q}</span><span style="color:var(--bs-cyan);font:700 10px/1 var(--font)">+</span></div>`).join('') + '</div></div>' },
    { id: 'txt-compliance', name: 'Compliance row', size: 'md',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:16px 18px;align-content:center"><div style="border-top:1px solid rgba(255,255,255,0.18);padding-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">' + [['SOC 2 Type II certified','Secure and compliant management of your brand data.'],['CCPA','We follow the California Consumer Privacy Act.'],['GDPR','GDPR-compliant data handling under the strictest standard.']].map(([t,d])=>`<div><div style="font:600 7px/1 ui-monospace,monospace;color:var(--bs-white);letter-spacing:0.04em;margin-bottom:7px">${t}</div><div style="font:6.5px/1.45 var(--font);color:rgba(255,255,255,0.6)">${d}</div></div>`).join('') + '</div></div>' },
    { id: 'txt-guide-list', name: 'Numbered guides', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:14px 18px;grid-template-columns:1fr 1.6fr;gap:18px;align-items:start"><div style="font:600 13px/1.1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">What guides us</div><div style="display:flex;flex-direction:column;gap:9px">' + [['1','Agency','We build tools to amplify human intent, not replace it.'],['2','MAYA','Most Advanced Yet Acceptable. Edges of tech, grounded in utility.'],['3','Context','Models that learn your brand, strategy and history.'],['4','Truth','Citation, accuracy, source material over generative guesswork.']].map(([n,t,d])=>`<div style="display:grid;grid-template-columns:16px 1fr;gap:8px;align-items:start"><div style="font:600 11px/1 var(--font);color:var(--bs-cyan)">${n}</div><div><div style="font:600 7px/1 var(--font);color:var(--bs-white);margin-bottom:2px">${t}</div><div style="font:5.5px/1.4 var(--font);color:rgba(255,255,255,0.6)">${d}</div></div></div>`).join('') + '</div></div>' },
    { id: 'txt-work-with-us', name: 'Work with us', size: 'lg',
      thumb: '<div class="am-tpl-thumb" style="aspect-ratio:16/10;background:var(--bs-navy);padding:18px 22px;justify-content:center;align-items:flex-start"><div style="font:700 6px/1 var(--font);color:var(--bs-cyan);letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px">Work with us</div><div style="font:600 12px/1.2 var(--font);color:var(--bs-white);letter-spacing:-0.01em;max-width:78%">We believe in a collision of disciplines. Strategists who code. Engineers who love typography. If you respect the craft, we should talk.</div><div style="margin-top:10px;background:var(--bs-cyan);color:var(--bs-navy);font:700 8px/1 var(--font);padding:7px 13px;border-radius:var(--r-full);width:fit-content">View open roles</div></div>' }, */
  ];

  const textTplDescs = {
    'Display heading': { sub: 'Display', desc: 'Título display em duas linhas, alinhado à esquerda. Use em aberturas de capítulo.' },
    'Eyebrow + heading': { sub: 'Header', desc: 'Eyebrow curto seguido de heading e um subtítulo. Estrutura padrão de seção.' },
    'Pull quote': { sub: 'Centered', desc: 'Pull-quote centrado para destacar uma frase-manifesto da marca.' },
    'Two columns': { sub: '2 column', desc: 'Dois blocos de texto paralelos com sub-título. Ideal para princípios ou comparações.' },
    'Heading + paragraph': { sub: '1 column', desc: 'Heading curto seguido de parágrafo. O bloco editorial básico.' },
    'Three principles': { sub: '3 column', desc: 'Três princípios lado a lado, cada um com título + parágrafo curto.' },
    "Do / Don't": { sub: '2 column', desc: "Do em cyan + Don't em escala neutra. Use em guidelines de comportamento." },
    'Numbered steps': { sub: 'List', desc: 'Lista de passos numerados em círculo escuro. Use em how-to ou fluxos.' },
    'Page header': { sub: 'Full bleed', desc: 'Capa escura com labels superiores e título monumental ao pé — abre capítulo.' },
    Statement: { sub: 'Editorial', desc: 'Bloco de declaração em texto médio sobre fundo claro, com borda lateral de destaque.' },
    'Term + definition': { sub: '2 column', desc: 'Termo curto à esquerda, definição à direita. Separadas por filete superior.' },
    'Beliefs grid 2×2': { sub: '2 × 2', desc: 'Quatro blocos título + parágrafo em grade 2×2. Use para crenças, valores, princípios.' },
    'Next chapter': { sub: 'Footer', desc: 'Rodapé de capítulo com label "Next" e o nome do próximo capítulo em escala display.' },
    'Hero + CTA': { sub: 'Centered', desc: 'Eyebrow cyan, título display, subtítulo e CTA pill cyan. Capa de landing/intro.' },
    'Manifesto line': { sub: 'Centered', desc: 'Frase-manifesto centrada em texto médio com destaque inline em cyan.' },
    'Section intro + CTA': { sub: '1 column', desc: 'Eyebrow, título, subtítulo e CTA pill. Estrutura editorial de seção.' },
    'Big testimonial': { sub: 'Centered', desc: 'Depoimento em display + avatar cyan, nome e cargo. Use para social proof.' },
    'Demo CTA': { sub: 'Centered', desc: 'Ícone cyan, headline, subtítulo e CTA pill. Bloco de conversão.' },
    'Feature grid 3×2': { sub: '3 column', desc: 'Título + grid de três features (título curto + descrição). Use em "what you get".' },
    FAQ: { sub: '2 column', desc: 'Título à esquerda, lista de perguntas à direita com filete e marcador cyan.' },
    'Compliance row': { sub: '3 column', desc: 'Rodapé escuro com 3 selos de compliance (SOC2/CCPA/GDPR) em mono cyan.' },
    'Numbered guides': { sub: '2 column', desc: 'Título à esquerda, lista numerada cyan à direita com título + descrição.' },
    'Work with us': { sub: 'Editorial', desc: 'Eyebrow, parágrafo display longo e CTA pill. Bloco de carreira/convite.' },
  };

  // 2026-05-28: text/images cleared (rebuilding from scratch); base/colors/video restored from archive.
  const __modules_archive = {
    colors: [
      {
        name: 'Colors',
        size: 'md',
        thumb: (() => {
          const swatches = [
            { bg: 'var(--bs-navy)', ink: 'var(--bs-white)', name: 'BluStar Navy', hex: '#061833' },
            { bg: 'var(--bs-cyan)', ink: 'var(--bs-navy)', name: 'BluStar Cyan', hex: '#0FC4D5' },
            { bg: 'var(--bs-blue)', ink: 'var(--bs-white)', name: 'Royal Blue', hex: '#3259FF' },
            { bg: 'var(--bs-white)', ink: 'var(--bs-navy)', name: 'White', hex: '#FFFFFF' },
          ];
          return `<div class="am-tpl-thumb" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px;align-content:start">
            <div style="display:flex;align-items:baseline;justify-content:space-between">
              <div style="font:600 9px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Brand colors</div>
              <div style="font:500 6px/1 var(--font);color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase">Primary · 4</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex:1">
              ${swatches
                .map(
                  s => `<div style="border-radius:5px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column">
                <div style="flex:1;min-height:48px;background:${s.bg};padding:6px 8px;display:flex;align-items:flex-end"><span style="font:700 5.5px/1 ui-monospace,monospace;color:${s.ink};letter-spacing:0.04em;opacity:0.75">${s.hex}</span></div>
                <div style="padding:6px 8px;background:rgba(255,255,255,0.04);font:600 6.5px/1.1 var(--font);color:var(--bs-white)">${s.name}</div>
              </div>`
                )
                .join('')}
            </div>
          </div>`;
        })(),
      },
      {
        name: 'Color card',
        size: 'md',
        thumb: `<div class="am-tpl-thumb" style="padding:14px"><div style="height:100%;border-radius:6px;background:var(--bs-cyan);padding:16px 18px;color:var(--bs-navy);display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden">
          <div style="display:flex;flex-direction:column;gap:3px">
            <div style="font:700 5.5px/1 var(--font);letter-spacing:0.14em;text-transform:uppercase;opacity:0.6">Primary · 02</div>
            <div style="font:600 15px/1 var(--font);letter-spacing:-0.02em;white-space:pre-line">BluStar\nCyan</div>
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;column-gap:10px;row-gap:2px;font:5.5px/1.4 ui-monospace,monospace;opacity:0.85">
            <span style="opacity:0.6">HEX</span><span>#0FC4D5</span>
            <span style="opacity:0.6">RGB</span><span>15 · 196 · 213</span>
            <span style="opacity:0.6">CMYK</span><span>75 · 0 · 20 · 0</span>
            <span style="opacity:0.6">PMS</span><span>312 C</span>
          </div>
        </div></div>`,
      },
      {
        name: 'Color cards',
        size: 'lg',
        thumb: (() => {
          const cards = [
            { bg: 'var(--bs-navy)', n: 'BluStar\nNavy', num: '01', hex: '#061833', rgb: '6 · 24 · 51', cmyk: '100 · 53 · 0 · 80', pms: '4280 C' },
            { bg: 'var(--bs-cyan)', n: 'BluStar\nCyan', num: '02', hex: '#0FC4D5', rgb: '15 · 196 · 213', cmyk: '75 · 0 · 20 · 0', pms: '312 C', dark: true },
            { bg: 'var(--bs-blue)', n: 'Royal\nBlue', num: '03', hex: '#3259FF', rgb: '50 · 89 · 255', cmyk: '80 · 65 · 0 · 0', pms: '2728 C' },
          ];
          const row = (l, v, dark) => `<div style="display:grid;grid-template-columns:auto 1fr;column-gap:6px"><span style="opacity:${dark ? 0.55 : 0.6}">${l}</span><span style="opacity:${dark ? 0.9 : 0.85}">${v}</span></div>`;
          return `<div class="am-tpl-thumb" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;align-content:start">
            <div style="display:flex;align-items:baseline;justify-content:space-between">
              <div style="font:600 9px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Primary palette</div>
              <div style="font:500 6px/1 var(--font);color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase">3 colors</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex:1">${cards
              .map(c => {
                const ink = c.dark ? 'var(--bs-navy)' : 'var(--bs-white)';
                return `<div style="aspect-ratio:3/4;border-radius:5px;background:${c.bg};border:1px solid rgba(255,255,255,0.12);padding:10px 11px;color:${ink};display:flex;flex-direction:column;justify-content:space-between">
                <div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="font:600 8px/1.05 var(--font);letter-spacing:-0.01em;white-space:pre-line">${c.n}</div><div style="font:700 5.5px/1 ui-monospace,monospace;opacity:0.55">${c.num}</div></div>
                <div style="font:4.8px/1.55 ui-monospace,monospace;display:flex;flex-direction:column;gap:1px">${row('HEX', c.hex, c.dark)}${row('RGB', c.rgb, c.dark)}${row('CMYK', c.cmyk, c.dark)}${row('PMS', c.pms, c.dark)}</div>
              </div>`;
              })
              .join('')}</div>
          </div>`;
        })(),
      },
      {
        name: 'Color palette',
        size: 'md',
        thumb: (() => {
          const cols = [
            { hex: '#0FC4D5', ink: 'var(--bs-navy)', name: 'Cyan', code: 'C-500' },
            { hex: '#235789', ink: 'var(--bs-white)', name: 'Steel', code: 'B-600' },
            { hex: '#0A1F3B', ink: 'var(--bs-white)', name: 'Navy', code: 'B-900' },
            { hex: '#F5B888', ink: 'var(--bs-navy)', name: 'Sand', code: 'O-200' },
            { hex: '#ED5A1F', ink: 'var(--bs-white)', name: 'Ember', code: 'O-500' },
            { hex: '#A23A1A', ink: 'var(--bs-white)', name: 'Rust', code: 'O-700' },
            { hex: '#7CE56F', ink: 'var(--bs-navy)', name: 'Lime', code: 'G-400' },
          ];
          return `<div class="am-tpl-thumb" style="padding:14px 16px;display:flex;flex-direction:column;gap:9px;align-content:start">
            <div style="display:flex;align-items:baseline;justify-content:space-between">
              <div style="font:600 9px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Color palette</div>
              <div style="font:500 6px/1 var(--font);color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase">${cols.length} tokens</div>
            </div>
            <div style="aspect-ratio:16/9;border-radius:6px;overflow:hidden;display:grid;grid-template-columns:repeat(${cols.length},1fr);flex:1">${cols.map(c => `<div style="background:${c.hex};padding:8px 7px;color:${c.ink};display:flex;flex-direction:column;justify-content:space-between"><div style="display:flex;flex-direction:column;gap:1px"><span style="font:600 6.5px/1 var(--font);letter-spacing:-0.01em">${c.name}</span><span style="font:500 4.5px/1 ui-monospace,monospace;opacity:0.55;letter-spacing:0.04em">${c.code}</span></div><span style="font:500 4.5px/1 ui-monospace,monospace;opacity:0.65">${c.hex.toUpperCase()}</span></div>`).join('')}</div>
          </div>`;
        })(),
      },
      {
        name: 'Color pairing',
        size: 'lg',
        thumb: (() => {
          const swatches = [
            { hex: '#061833', name: 'Azul Asfalto' },
            { hex: '#04001E', name: 'Azul Noturno' },
            { hex: '#0A1F3B', name: 'Azul Profundo' },
            { hex: '#3259FF', name: 'Azul Céu' },
            { hex: '#0FC4D5', name: 'Azul Turquesa', selected: true },
            { hex: '#A6D9DE', name: 'Azul Horizonte' },
            { hex: '#BFFAFF', name: 'Azul Aberto' },
            { hex: '#DFFCFF', name: 'Azul Nuvem' },
          ];
          const tab = (l, active) => `<span style="font:${active ? '600' : '500'} 5.5px/1 var(--font);color:${active ? 'var(--bs-white)' : 'rgba(255,255,255,0.5)'};padding:4px 6px;border-bottom:1.5px solid ${active ? 'var(--bs-cyan)' : 'transparent'}">${l}</span>`;
          const row = s =>
            `<div style="display:flex;align-items:center;gap:5px;padding:2.5px 0"><span style="width:7px;height:7px;border-radius:50%;background:${s.hex};box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.25);${s.selected ? 'outline:1px solid var(--bs-cyan);outline-offset:1px;' : ''}"></span><span style="font:${s.selected ? '600' : '500'} 5px/1 var(--font);color:${s.selected ? 'var(--bs-white)' : 'rgba(255,255,255,0.65)'}">${s.name}</span></div>`;
          return `<div class="am-tpl-thumb" style="padding:12px 14px;align-content:start;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;gap:2px;border-bottom:1px solid rgba(255,255,255,0.14)">${tab('Brand', true)}${tab('Marketing')}${tab('APP')}${tab('Ilustração')}</div>
            <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px;flex:1">
              <div style="display:flex;flex-direction:column">
                <div style="display:flex;flex-direction:column">${swatches.map(row).join('')}</div>
              </div>
              <div style="background:var(--bs-cyan);border-radius:4px;padding:10px 11px;color:var(--bs-navy);display:flex;flex-direction:column;justify-content:space-between">
                <div style="display:flex;flex-direction:column;gap:2px">
                  <span style="font:700 4.5px/1 var(--font);letter-spacing:0.14em;text-transform:uppercase;opacity:0.55">Pairing preview</span>
                  <span style="font:700 9.5px/1.05 var(--font);letter-spacing:-0.02em">Cyan on Navy.<br/>Bold &amp; clear.</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:6px"><span style="font:700 5.5px/1 var(--font);background:var(--bs-navy);color:var(--bs-cyan);padding:4px 8px;border-radius:99px">Saiba mais</span><span style="font:700 5px/1 var(--font);letter-spacing:0.12em">BLUSTAR</span></div>
              </div>
            </div>
          </div>`;
        })(),
      },
      {
        name: 'Paleta de cores',
        size: 'lg',
        thumb: (() => {
          const palette = ['#000000', '#04001E', '#0A1F3B', '#3259FF', '#0FC4D5', '#A6D9DE', '#BFFAFF', '#DFFCFF', '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#0A1018', '#1B8FA8', '#235789', '#0A1F3B', '#F5B888', '#ED5A1F', '#7CE56F'];
          const selected = new Set([4, 5, 6, 17, 20, 22]);
          const cols = 17;
          const tab = (l, active) => `<span style="font:${active ? '600' : '500'} 5.5px/1 var(--font);color:${active ? 'var(--bs-white)' : 'rgba(255,255,255,0.5)'};padding:4px 6px;border-bottom:1.5px solid ${active ? 'var(--bs-cyan)' : 'transparent'}">${l}</span>`;
          return `<div class="am-tpl-thumb" style="padding:14px 16px;align-content:start;display:flex;flex-direction:column;gap:9px">
            <div style="display:flex;align-items:baseline;justify-content:space-between">
              <div style="font:600 9px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Color reference</div>
              <div style="font:500 6px/1 var(--font);color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase">${selected.size} active · ${palette.length} total</div>
            </div>
            <div style="display:flex;gap:2px;border-bottom:1px solid rgba(255,255,255,0.14)">${tab('Illustration', true)}${tab('Marketing')}${tab('Product')}${tab('Brand')}</div>
            <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px;flex:1;align-content:start">${palette.map((c, i) => `<div style="aspect-ratio:1;background:${c};border-radius:2px;box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.16);opacity:${selected.has(i) ? 1 : 0.18}"></div>`).join('')}</div>
          </div>`;
        })(),
      },
      {
        name: 'Color specs',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="background:#fff;padding:8px;display:flex;gap:5px;align-items:stretch;border-radius:6px">
          <div style="flex:1;background:#0FC4D5;border-radius:5px;padding:8px;display:flex;flex-direction:column;gap:5px"><div style="font:500 7px/1.15 var(--font);color:#061833">Azul Turquesa</div><div style="font:500 5px/1.5 var(--font);color:#061833;opacity:.8">HEX #0FC4D5<br>R15 G196 B213</div></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:5px">${[
            ['#061833', '#fff'],
            ['#3259FF', '#fff'],
            ['#FFFFFF', '#061833', 1],
          ]
            .map(([b, k, l]) => `<div style="flex:1;background:${b};border-radius:5px;padding:7px;${l ? 'box-shadow:inset 0 0 0 0.6px #D9D9D9' : ''}"><div style="font:500 5.5px/1.15 var(--font);color:${k}">Royal Blue</div></div>`)
            .join('')}</div>
          <div style="flex:1;display:flex;flex-direction:column;gap:5px">${[
            ['#000', '#fff'],
            ['#04001E', '#fff'],
            ['#3259FF', '#fff'],
            ['#A6D9DE', '#061833'],
            ['#BFFAFF', '#061833'],
            ['#DFFCFF', '#061833'],
          ]
            .map(([b, k]) => `<div style="flex:1;background:${b};border-radius:4px;padding:5px;min-height:0"><div style="font:500 4.5px/1.1 var(--font);color:${k}">Cyan 200</div></div>`)
            .join('')}</div>
        </div>`,
      },
      {
        name: 'Color contrast',
        size: 'lg',
        thumb: (() => {
          const bgs = ['#FFFFFF', '#DFFCFF', '#BFFAFF', '#A6D9DE', '#0FC4D5', '#4D8BFE', '#3259FF', '#061833', '#04001E', '#000000'];
          const fgs = ['#0FC4D5', '#3259FF', '#000000', '#FFFFFF'];
          return `<div class="am-tpl-thumb" style="background:#fff;padding:7px;display:grid;grid-template-rows:repeat(4,1fr);gap:3px;border-radius:6px">${fgs.map(fg => `<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px">${bgs.map(bg => `<div style="background:${bg};border-radius:2px;display:flex;align-items:center;justify-content:center;${bg === '#FFFFFF' ? 'box-shadow:inset 0 0 0 0.6px #D9D9D9' : ''}"><span style="font:800 5px/1 var(--font);color:${fg}">Aa</span></div>`).join('')}</div>`).join('')}</div>`;
        })(),
      },
      {
        name: 'Color accents',
        size: 'lg',
        thumb: (() => {
          const L = ['#0A1726', '#A6A6A6', '#7CE56F', '#F5DB87', '#F5B888', '#F58C82'];
          const R = ['#1C2430', '#ED5A1F', '#1E3A1B', '#6E6E12', '#7A3A12', '#4A1410'];
          const ink = h => {
            const n = parseInt(h.replace('#', ''), 16);
            const L = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
            return L > 0.6 ? '#061833' : '#FFFFFF';
          };
          const bar = c => `<div style="flex:1;background:${c};border-radius:4px;min-height:0;padding:5px 6px"><div style="font:500 4.5px/1.1 var(--font);color:${ink(c)}">Orange</div></div>`;
          return `<div class="am-tpl-thumb" style="background:#fff;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;border-radius:6px"><div style="display:flex;flex-direction:column;gap:5px">${L.map(bar).join('')}</div><div style="display:flex;flex-direction:column;gap:5px">${R.map(bar).join('')}</div></div>`;
        })(),
      },
    ],
    basic: [
      // Resources & Prev / Next removidos 2026-05-28 a pedido do usuário.
      {
        name: 'Spacing',
        size: 'md',
        thumb: (() => {
          const steps = [
            { token: '4', name: 'xs' },
            { token: '8', name: 'sm' },
            { token: '12', name: 'md' },
            { token: '16', name: 'lg' },
            { token: '24', name: 'xl' },
            { token: '32', name: '2xl' },
            { token: '48', name: '3xl' },
          ];
          const max = 48;
          return `<div class="am-tpl-thumb" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px;align-content:start">
            <div style="display:flex;align-items:baseline;justify-content:space-between">
              <div style="font:600 9px/1 var(--font);color:var(--bs-white);letter-spacing:-0.01em">Spacing scale</div>
              <div style="font:500 6px/1 var(--font);color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase">px · token</div>
            </div>
            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;flex:1">
              ${steps
                .map(
                  s => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:flex-end;height:100%">
                <div style="width:100%;background:linear-gradient(180deg,var(--bs-cyan) 0%,rgba(15,196,213,0.45) 100%);border-radius:2px;height:${Math.round((s.token / max) * 70)}%;min-height:6%"></div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <span style="font:700 6.5px/1 var(--font);color:var(--bs-white)">${s.token}</span>
                  <span style="font:500 5px/1 ui-monospace,monospace;color:rgba(255,255,255,0.5);letter-spacing:0.04em">${s.name}</span>
                </div>
              </div>`
                )
                .join('')}
            </div>
          </div>`;
        })(),
      },
      { name: 'Divider', size: 'sm', thumb: '<div class="am-tpl-thumb" style="padding:20px;display:flex;align-items:center"><div style="width:100%;height:1px;background:rgba(255,255,255,0.18)"></div></div>' },
      {
        name: 'On this page',
        size: 'lg',
        thumb: (() => {
          const links = ['Our color palettes', 'Color with our logo', 'Color pairing tool', 'Color with typography', 'Our color strategy', 'Color with illustration', 'Color with images', 'Neutral backgrounds'];
          const row = t =>
            `<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;padding:4px 2px;border-top:1px solid rgba(255,255,255,0.14)"><span style="font:500 5.5px/1.1 system-ui;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t}</span><span style="font:6px/1 system-ui;color:#0FC4D5">→</span></div>`;
          return `<div class="am-tpl-thumb" style="padding:14px 16px;grid-template-columns:1fr 1.3fr;gap:12px;align-items:start;align-content:center"><div style="font:600 14px/1 system-ui;color:#fff;letter-spacing:-0.02em">On this<br/>page</div><div style="display:grid;grid-template-columns:1fr 1fr;column-gap:6px">${links.map(row).join('')}</div></div>`;
        })(),
      },
    ],
    video: [
      {
        name: 'Video full screen 16:9',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:0;background:#000;overflow:hidden;position:relative;display:block">
          <div style="position:absolute;inset:0;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/q_auto/f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat"></div>
          <div style="position:absolute;inset:0;display:grid;place-items:center">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.92);color:var(--bs-navy);display:grid;place-items:center;backdrop-filter:blur(4px)">
              <span class="bs-icon" data-fill="1" style="--bs-icon-size:18px">play_arrow</span>
            </div>
          </div>
        </div>`,
      },
      {
        name: 'Video 4× 9:16',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:repeat(4,1fr);gap:5px">${Array(4).fill(`<div style="background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/q_auto/f_auto/v1780335253/9_16_ukmboo.jpg') center/cover no-repeat;border-radius:3px"></div>`).join('')}</div>`,
      },
      {
        name: 'Video 16:9 + 9:16',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:start">
          <div><div style="aspect-ratio:16/9;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:72%;margin-top:4px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
          <div><div style="aspect-ratio:9/16;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_240,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:72%;margin-top:4px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
        </div>`,
      },
      {
        name: 'Video editorial 4:3 + 9:16',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:repeat(12,1fr);gap:3px;align-items:start">
          <div style="grid-column:1 / 6;margin-top:14%"><div style="aspect-ratio:4/3;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:60%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
          <div style="grid-column:9 / 13"><div style="aspect-ratio:9/16;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_240,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:80%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
        </div>`,
      },
      {
        name: 'Video editorial 9:16 + 16:9',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:repeat(12,1fr);gap:3px;align-items:start">
          <div style="grid-column:1 / 6"><div style="aspect-ratio:9/16;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_240,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:80%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
          <div style="grid-column:7 / 13;margin-top:18%"><div style="aspect-ratio:16/9;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:60%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
        </div>`,
      },
      {
        name: 'Video duo 16:9 (diagonal)',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:repeat(12,1fr);gap:3px;align-items:start">
          <div style="grid-column:1 / 6"><div style="aspect-ratio:16/9;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:65%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
          <div style="grid-column:8 / 13;margin-top:22%"><div style="aspect-ratio:16/9;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:65%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
        </div>`,
      },
      {
        name: 'Video 9:16 + 16:9 (alto)',
        size: 'lg',
        thumb: `<div class="am-tpl-thumb" style="aspect-ratio:16/9;padding:8px;background:#000;overflow:hidden;display:grid;grid-template-columns:repeat(12,1fr);gap:3px;align-items:start">
          <div style="grid-column:1 / 6"><div style="aspect-ratio:9/16;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_240,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:80%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
          <div style="grid-column:7 / 13;margin-top:6%"><div style="aspect-ratio:16/9;background:url('https://res.cloudinary.com/dq0tnoaye/video/upload/w_300,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg') center/cover no-repeat;border-radius:3px"></div><div style="height:3px;width:60%;margin-top:3px;background:rgba(255,255,255,0.32);border-radius:2px"></div></div>
        </div>`,
      },
    ],
  };
  const modules = {
    images: 'TEMPLATES',
    colors: __modules_archive.colors,
    basic: __modules_archive.basic,
    video: __modules_archive.video,
  };

  window.__praiaRegistries = { textTemplates, templates, modules };

  let currentInsertBefore = null;
  let selectedName = 'Hero image';
  let selectedTplId = 'hero-img';
  let selectedModuleName = null;

  function renderGrid(cat) {
    if (!grid) return;
    grid.innerHTML = '';
    const useTemplatesLayout = cat === 'templates' || cat === 'text' || cat === 'images' || cat === 'video' || cat === 'colors' || (cat === 'basic' && (modules.basic || []).some(m => m.thumb));
    grid.classList.toggle('templates', useTemplatesLayout);
    grid.dataset.cat = cat;
    // Honor any per-template overrides saved by DS Templates edits: if the
    // user touched a template inside DS, the Add Module card must reflect that
    // same look (single source of truth). overrides keyed by template name.
    if (!window.__praiaTplOverrides) {
      try {
        window.__praiaTplOverrides = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
      } catch {
        window.__praiaTplOverrides = {};
      }
    }
    const overrideFor = name => name && window.__praiaTplOverrides && window.__praiaTplOverrides[name];
    // Unified Templates view (matches the DS Templates section). Mixes text +
    // image + video templates in a single grid, same source of truth.
    if (cat === 'templates') {
      selectedModuleName = null;
      const makeCard = (t, kind) => {
        const c = document.createElement('div');
        c.className = 'am-tpl-card ' + (tplSpanByName[t.size] || 'tpl-h-md') + (t.id === selectedTplId ? ' active' : '');
        c.dataset.name = t.name;
        if (t.id) c.dataset.tplId = t.id;
        c.innerHTML = `<div class="am-tpl-thumb-frame">${overrideFor(t.name) || t.thumb}</div><div class="am-tpl-label"><span>${t.name}</span></div>`;
        c.addEventListener('click', () => {
          if (kind === 'module') {
            selectedModuleName = t.name;
            selectedTplId = null;
          } else {
            selectedTplId = t.id;
            selectedModuleName = null;
          }
          selectedName = t.name;
          document.querySelectorAll('.am-tpl-card').forEach(x => x.classList.toggle('active', x === c));
          if (kind === 'image') updatePreview(t);
        });
        c.addEventListener('dblclick', () => {
          if (kind === 'module') insertModule(t.name);
          else insertTemplate(t.id);
        });
        grid.appendChild(c);
      };
      textTemplates.forEach(t => makeCard(t, 'text'));
      templates.forEach(t => makeCard(t, 'image'));
      (modules.video || []).filter(m => m.thumb).forEach(m => makeCard(m, 'module'));
      return;
    }
    if (cat === 'text') {
      selectedModuleName = null;
      textTemplates.forEach(t => {
        const c = document.createElement('div');
        c.className = 'am-tpl-card ' + (tplSpanByName[t.size] || 'tpl-h-md') + (t.id === selectedTplId ? ' active' : '');
        c.dataset.name = t.name;
        c.dataset.tplId = t.id;
        c.innerHTML = `<div class="am-tpl-thumb-frame">${overrideFor(t.name) || t.thumb}</div><div class="am-tpl-label"><span>${t.name}</span></div>`;
        c.addEventListener('click', () => {
          selectedTplId = t.id;
          selectedName = t.name;
          document.querySelectorAll('.am-tpl-card').forEach(x => x.classList.toggle('active', x === c));
        });
        c.addEventListener('dblclick', () => insertTemplate(t.id));
        grid.appendChild(c);
      });
      const current = textTemplates.find(t => t.id === selectedTplId) || textTemplates[0];
      if (current) {
        selectedName = current.name;
        selectedTplId = current.id;
      }
      return;
    }
    if (cat === 'images') {
      selectedModuleName = null;
      templates.forEach(t => {
        const c = document.createElement('div');
        // Uniform card height in Imagens — visual is dictated by the thumb's
        // aspect-ratio inside, not by varying the card frame.
        c.className = 'am-tpl-card tpl-h-md' + (t.id === selectedTplId ? ' active' : '');
        c.dataset.name = t.name;
        c.dataset.tplId = t.id;
        c.innerHTML = `<div class="am-tpl-thumb-frame">${overrideFor(t.name) || t.thumb}</div><div class="am-tpl-label"><span>${t.name}</span></div>`;
        c.addEventListener('click', () => {
          selectedTplId = t.id;
          selectedName = t.name;
          updatePreview(t);
          document.querySelectorAll('.am-tpl-card').forEach(x => x.classList.toggle('active', x === c));
        });
        c.addEventListener('dblclick', () => insertTemplate(t.id));
        grid.appendChild(c);
      });
      const current = templates.find(t => t.id === selectedTplId) || templates[0];
      if (current) {
        selectedName = current.name;
        selectedTplId = current.id;
        updatePreview(current);
      }
      return;
    }
    (modules[cat] || []).forEach(m => {
      const c = document.createElement('div');
      // Render as a thumb card (same visual as Texto/Imagens) when the module
      // provides a `thumb`; fall back to the icon row for legacy entries.
      if (m.thumb) {
        // Cores uses a uniform card height for consistency; other thumb-bearing
        // categories (basic / video) keep the per-template size hint.
        const sizeClass = cat === 'colors' ? 'tpl-h-md' : tplSpanByName[m.size] || 'tpl-h-md';
        c.className = 'am-tpl-card ' + sizeClass + (m.name === selectedModuleName ? ' active' : '');
        c.dataset.name = m.name;
        c.innerHTML = `<div class="am-tpl-thumb-frame">${overrideFor(m.name) || m.thumb}</div><div class="am-tpl-label"><span>${m.name}</span></div>`;
        c.addEventListener('click', () => {
          selectedModuleName = m.name;
          selectedName = m.name;
          selectedTplId = null;
          document.querySelectorAll('.am-tpl-card').forEach(x => x.classList.toggle('active', x === c));
        });
        c.addEventListener('dblclick', () => insertModule(m.name));
      } else {
        c.className = 'am-card' + (m.name === selectedModuleName ? ' active' : '');
        c.dataset.name = m.name;
        c.innerHTML = `<span class="am-card-icon">${m.icon}</span><span>${m.name}</span>`;
        c.addEventListener('click', () => {
          selectedModuleName = m.name;
          selectedName = m.name;
          updatePreview();
          document.querySelectorAll('.am-card').forEach(x => x.classList.toggle('active', x === c));
        });
        c.addEventListener('dblclick', () => insertModule(m.name));
      }
      grid.appendChild(c);
    });
  }

  const tplDescs = {
    'Hero image': { sub: 'Full-width media', desc: 'A single hero photograph spanning the full content width. Use for chapter openers.' },
    'Image gallery 4×3': { sub: '4 × 3 grid', desc: 'A 12-image grid for moodboards, photo series or component showcases.' },
    'Image collage': { sub: 'Overlap composition', desc: 'Three images arranged in an overlapping, asymmetric composition for editorial moments.' },
    'Image + text': { sub: '2 column', desc: 'Image on the left, paragraph on the right. Standard editorial layout.' },
    'Text + image': { sub: '2 column', desc: 'Paragraph on the left, image on the right. Mirror of the standard editorial.' },
    'Two columns text': { sub: '2 column', desc: "Two parallel text columns for principles, do/don't or pros/cons." },
    'Quote callout': { sub: 'Pull quote', desc: 'A centered pull-quote callout. Use sparingly to highlight a brand statement.' },
    'Two images': { sub: '2 column', desc: 'Two images side-by-side. Good for before/after or product pairs.' },
  };
  function updatePreview() {
    /* preview pane removed in white layout */
  }

  // Expose so other features (DS canvas, etc.) can render live templates
  window.__praiaBuildTemplate = buildTemplate;
  // Universal master wrapper. Takes a master .am-tpl-thumb outerHTML and
  // produces the Figma-style mirror structure used by every context (cell
  // thumb, modal mirror, guide instance). The CSS scale is later applied by
  // applyMirrorScale() based on the mirror's PARENT width — that single rule
  // guarantees every preview is pixel-identical to the master, just zoomed.
  // `transparentBg`: strip navy backgrounds (used for guide-page instances so
  // they blend with the page; cells keep their navy preview).
  // Names of the text templates that behave as auto-layout instances: the
  // inserted block grows/shrinks vertically with its (editable) text. Preview
  // thumbs are NOT affected — only on-page instances.
  const TEXT_TPL_NAMES = new Set(textTemplates.map(t => t.name));
  // Full-bleed templates break out of the page's content padding (edge-to-edge),
  // unlike the 12-col grid templates. They carry their own background.
  const FULLBLEED_TPL_NAMES = new Set(['Cover']);
  window.__praiaIsTextTpl = name => TEXT_TPL_NAMES.has(name);
  function wrapMasterInMirror(html, { transparentBg = false, autoHeight = false } = {}) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const thumb = tmp.querySelector('.am-tpl-thumb');
    if (!thumb) return { html, editW: 1280, editH: 800, hasThumb: false };
    const editW = parseFloat(thumb.dataset.dsEditW) || parseFloat(thumb.style.width) || 1280;
    const editH = parseFloat(thumb.dataset.dsEditH) || parseFloat(thumb.style.height) || 800;
    // Strip edit-time scaling residue — applyMirrorScale owns the transform now.
    thumb.removeAttribute('data-ds-scaled-thumb');
    thumb.style.width = '';
    thumb.style.height = '';
    thumb.style.transform = '';
    thumb.style.transformOrigin = '';
    if (transparentBg) {
      thumb.style.background = 'transparent';
      tmp.querySelectorAll('[style*="background"]').forEach(el => {
        const s = el.getAttribute('style') || '';
        if (/background[^;]*var\(--bs-navy/.test(s)) {
          el.style.background = 'transparent';
        }
      });
      // Image placeholder blocks carry `background-color: var(--surface-2)` as
      // a "drop image here" affordance for the editor. On a guide page the
      // block is read-only — strip the gray fallback so empty areas blend with
      // the page (the bg-image still renders normally if one is set).
      tmp.querySelectorAll('.tpl-block').forEach(el => {
        el.style.backgroundColor = 'transparent';
      });
    }
    // Auto-height instances let the content define the height (no fixed pixel
    // box, no clipping) so the block grows/shrinks as text is edited. The frame
    // height is then computed live in applyMirrorScale (= contentH × scale).
    if (autoHeight) {
      thumb.style.height = 'auto';
      thumb.style.overflow = 'visible';
    }
    const mh = autoHeight ? 'auto' : `${editH}px`;
    const mirror = `<div class="praia-mirror" data-edit-w="${editW}" data-edit-h="${editH}" style="width:${editW}px;height:${mh}">${thumb.outerHTML}</div>`;
    return { html: mirror, editW, editH, hasThumb: true };
  }
  // Guide-page instance: wrap the mirror in a .praia-frame container that
  // carries the aspect-ratio (so the column reserves the right vertical space)
  // and clips overflow. Text templates use auto-layout: the frame height tracks
  // the editable content instead of a fixed aspect-ratio.
  function sanitizeOverrideForInstance(html, name) {
    const auto = TEXT_TPL_NAMES.has(name);
    const r = wrapMasterInMirror(html, { transparentBg: true, autoHeight: auto });
    if (!r.hasThumb) return html;
    // The cover (05) gets its tall presence ONLY as an on-page instance via a
    // min-height — the preview thumb stays compact (hugs content) so it reads
    // well at small size.
    if (FULLBLEED_TPL_NAMES.has(name)) {
      r.html = r.html.replace('data-cover="05"', 'data-cover="05" data-cover-instance="1"');
    }
    const fullbleed = FULLBLEED_TPL_NAMES.has(name) ? ' data-praia-fullbleed="1"' : '';
    if (auto) {
      return `<div class="praia-frame" data-praia-autoheight="1"${fullbleed} style="aspect-ratio:auto">${r.html}</div>`;
    }
    return `<div class="praia-frame"${fullbleed} style="aspect-ratio:${r.editW}/${r.editH}">${r.html}</div>`;
  }
  // Other IIFE scopes (populateTemplatesGrid, ensureTplCells) reach the wrapper
  // via window so cells and instances share exactly one rendering pipeline.
  window.__praiaWrapMasterInMirror = wrapMasterInMirror;
  window.__praiaSanitizeOverrideForInstance = sanitizeOverrideForInstance;
  // Compute and apply transform: scale on every .praia-mirror so its native
  // pixel canvas fits the frame width. Idempotent. Throttled via RAF.
  let __applyMirrorRaf = 0;
  function applyMirrorScale() {
    if (__applyMirrorRaf) return;
    __applyMirrorRaf = requestAnimationFrame(() => {
      __applyMirrorRaf = 0;
      document.querySelectorAll('.praia-mirror').forEach(m => {
        const frame = m.parentElement;
        if (!frame) return;
        // Skip mirrors that aren't rendered (offsetParent === null means
        // display:none ancestor OR the element is detached). Hidden cells in
        // an inactive guide-page and modal previews behind a closed overlay
        // don't need transforms recomputed on every drag frame.
        if (!frame.offsetParent && frame !== document.body) return;
        // Full-bleed instances break out of the page content padding so the
        // background reaches the canvas edges. Read the live .world-inner padding
        // so it stays correct across guide/preview/home layouts. Set BEFORE
        // measuring width so the scale uses the bled-out width.
        if (frame.dataset.praiaFullbleed === '1') {
          const wi = frame.closest('.world-inner');
          const cont = frame.parentElement;
          if (wi && cont) {
            // Span from the available area's true left edge to its right edge —
            // NO breathing room. But never go UNDER chrome panels: if the Pages
            // sidebar (left) or the inspector (right) is visible, stop flush at
            // its inner edge so it sits beside the banner, not over it.
            const wir = wi.getBoundingClientRect();
            const cr = cont.getBoundingClientRect();
            // A chrome panel counts as "shown" when it's actually painted on
            // screen (not display:none, not translated off, has width). The
            // inspector is position:fixed, so offsetParent can't be trusted.
            const shown = el => {
              if (!el) return false;
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
              const r = el.getBoundingClientRect();
              return r.width > 1 && r.left < window.innerWidth - 1 && r.right > 0;
            };
            const side = document.querySelector('[data-world="guide"] .guide-side');
            const insp = document.querySelector('.guide-right');
            const leftBound = shown(side) ? side.getBoundingClientRect().right : wir.left;
            const rightBound = shown(insp) ? insp.getBoundingClientRect().left : wir.right;
            const ml = Math.round(leftBound - cr.left) + 'px';
            const mr = Math.round(cr.right - rightBound) + 'px';
            if (frame.style.marginLeft !== ml) frame.style.marginLeft = ml;
            if (frame.style.marginRight !== mr) frame.style.marginRight = mr;
            if (frame.style.width !== 'auto') frame.style.width = 'auto';
            // Bleed to the TOP when this is the first block on the page, so the
            // cover sits flush against the top edge (no black gap above) in both
            // edit and preview. Pull up by the page's top padding + the leading
            // add-template slot height (which is 0 in preview/DS where slots are
            // hidden), so it always lands on the world-inner's top edge.
            const wrapEl = frame.closest('[data-tpl-instance]') || frame.parentElement;
            const leadSlot = wrapEl && wrapEl.previousElementSibling;
            const isFirst = leadSlot && leadSlot.classList.contains('add-module-slot') && !leadSlot.previousElementSibling;
            let mt = '0px';
            if (isFirst) {
              const padTop = parseFloat(getComputedStyle(wi).paddingTop) || 0;
              const slotH = leadSlot.getBoundingClientRect().height || 0;
              mt = '-' + Math.round(padTop + slotH) + 'px';
            }
            if (frame.style.marginTop !== mt) frame.style.marginTop = mt;
          }
        }
        const fw = frame.getBoundingClientRect().width;
        const ew = parseFloat(m.dataset.editW) || 1280;
        if (!fw || !ew) return;
        const next = `scale(${fw / ew})`;
        // Avoid touching the inline style when the value didn't change — keeps
        // the ResizeObserver from re-firing in a tight loop.
        if (m.style.transform !== next) m.style.transform = next;
        // Auto-layout text instances: the frame height tracks the live content
        // height (mirror is height:auto, so offsetHeight = natural height at the
        // 1280 canvas) scaled to the column width. This makes the block grow as
        // text is typed and shrink as it's deleted.
        if (frame.dataset.praiaAutoheight === '1') {
          const contentH = m.offsetHeight || parseFloat(m.dataset.editH) || 0;
          const fh = contentH * (fw / ew) + 'px';
          if (frame.style.height !== fh) frame.style.height = fh;
          return;
        }
        // Text-template PREVIEW cells use a uniform 16:9 box (taller than the
        // scaled text). Vertically center the content so the thumb doesn't look
        // cramped at the top. Preview-only — guide-page instances keep top:0 and
        // stay flush to their real height.
        const cell = frame.closest?.('.ds-tpl-cell');
        if (cell && cell.dataset.tplCat === 'text') {
          // Full-bleed covers (05): COVER-FIT the thumb — fill the whole 16:9
          // cell (scale to the larger of width/height ratios) and crop the
          // overflow, so the cyan + content fill the cell instead of sitting in
          // a letterbox. Content is bottom/left, so the readable part stays.
          if (cell.dataset.tplName === 'Cover') {
            const eh = parseFloat(m.dataset.editH) || 1;
            const fh = frame.getBoundingClientRect().height;
            const s = Math.max(fw / ew, fh / eh);
            const cov = `scale(${s})`;
            if (m.style.transform !== cov) m.style.transform = cov;
            if (m.style.top !== '0px') m.style.top = '0px';
            if (m.style.left !== '0px') m.style.left = '0px';
          } else {
            const eh = parseFloat(m.dataset.editH) || 0;
            const fh = frame.getBoundingClientRect().height;
            const top = Math.max(0, (fh - eh * (fw / ew)) / 2);
            const tp = top + 'px';
            if (m.style.top !== tp) m.style.top = tp;
          }
        } else if (m.style.top && m.style.top !== '0px') {
          m.style.top = '';
        }
      });
    });
  }
  window.__praiaApplyMirrorScale = applyMirrorScale;
  // Single ResizeObserver wired to every .praia-frame. We rebuild the observer
  // set on every propagation/insert/restore so newly added frames are tracked.
  let __mirrorRO = null;
  function ensureMirrorObserver() {
    if (!('ResizeObserver' in window)) return;
    if (!__mirrorRO) __mirrorRO = new ResizeObserver(() => applyMirrorScale());
    document.querySelectorAll('.praia-frame').forEach(f => {
      if (f.dataset.praiaRoBound) return;
      f.dataset.praiaRoBound = '1';
      __mirrorRO.observe(f);
    });
  }
  window.__praiaEnsureMirrorObserver = ensureMirrorObserver;
  window.addEventListener('resize', applyMirrorScale);
  // Recompute full-bleed margins when the inspector (right panel) toggles, since
  // it's position:fixed and doesn't reflow the observed frames. The inspector
  // becoming visible/hidden changes the right boundary of a full-bleed banner.
  (() => {
    const insp = document.querySelector('.guide-right');
    if (insp) new MutationObserver(() => applyMirrorScale()).observe(insp, { attributes: true, attributeFilter: ['class', 'style'] });
    // Preview mode toggles chrome (sidebar/inspector) and page padding — recompute.
    new MutationObserver(() => applyMirrorScale()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  })();
  // Auto-layout: while text inside an auto-height instance is edited, re-measure
  // so the block grows/shrinks live as content is typed or deleted. Also flag the
  // instance as user-edited so its per-instance text survives reload and isn't
  // clobbered by master→instance propagation (it stays the source of truth).
  document.addEventListener('input', e => {
    const inst = e.target.closest?.('[data-tpl-instance]');
    if (inst) {
      inst.dataset.tplEdited = '1';
      window.__praiaAutosave?.();
    }
    if (e.target.closest?.('.praia-frame[data-praia-autoheight="1"]')) applyMirrorScale();
  });
  // Replace every inserted instance of `name` with the latest master thumb.
  // Called live during edit (MutationObserver) and on commitEditAndExit.
  window.__praiaPropagateTemplate = function (name, thumbOuterHtml) {
    if (!name || !thumbOuterHtml) return;
    const innerHtml = sanitizeOverrideForInstance(thumbOuterHtml, name);
    // If the user is interacting with an instance (typed in contenteditable,
    // focused a video, etc.), overwriting innerHTML would destroy their state.
    // Skip just that one instance — the rest still propagate live, and a final
    // commitEditAndExit will catch it up.
    const activeInstance = document.activeElement?.closest?.('[data-tpl-instance]');
    document.querySelectorAll(`[data-tpl-instance="${CSS.escape(name)}"]`).forEach(node => {
      if (node.closest('section[data-ds-section]')) return;
      if (node === activeInstance) return;
      // Preserve instances the user has edited on the page — their content is
      // the source of truth and must not be reset to the master default.
      if (node.dataset.tplEdited === '1') return;
      node.innerHTML = innerHtml;
    });
    ensureMirrorObserver();
    applyMirrorScale();
  };
  function insertTemplate(id) {
    // Prefer the user-edited override (stored as outerHTML of the .am-tpl-thumb
    // edited inside the DS canvas) over the hardcoded buildTemplate() output —
    // so adding a template into the guide reflects whatever the user customized
    // in the Templates editor.
    const name = (templates.find(t => t.id === id) || textTemplates.find(t => t.id === id) || {}).name;
    if (!window.__praiaTplOverrides) {
      try {
        window.__praiaTplOverrides = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
      } catch {
        window.__praiaTplOverrides = {};
      }
    }
    const overrideHtml = name && window.__praiaTplOverrides[name];

    let newEl;
    if (overrideHtml) {
      newEl = document.createElement('div');
      // Wrap the master thumb in a praia-frame so the instance pixel-mirrors
      // the master at any container width (handled by applyMirrorScale).
      newEl.innerHTML = sanitizeOverrideForInstance(overrideHtml, name);
    } else {
      newEl = buildTemplate(id);
    }
    if (!newEl) return;
    // Aplica o padrão global de texto (último estilo/cor escolhidos) ao novo template.
    window.__praiaApplyTextDefault?.(newEl);
    // Tag as instance so master edits can find + update it in real time.
    if (name) newEl.dataset.tplInstance = name;
    if (id) newEl.dataset.tplId = id;
    if (currentInsertBefore && currentInsertBefore.parentNode) {
      currentInsertBefore.parentNode.insertBefore(newEl, currentInsertBefore);
      currentInsertBefore.parentNode.insertBefore(makeSlot(), currentInsertBefore);
      ensureSlotBefore(newEl);
    }
    ensureMirrorObserver();
    applyMirrorScale();
    close();
  }
  function ensureSlotBefore(el) {
    const prev = el.previousElementSibling;
    if (!prev || !prev.classList.contains('add-module-slot')) {
      el.parentNode.insertBefore(makeSlot(), el);
    }
    if (el.parentNode && el.parentNode.matches('.guide-page')) {
      injectSlotsIn(el.parentNode);
    }
  }
  function tplImg(extra = '') {
    // Stamp kind at build time so every template image plugs into the same
    // selection/resize/inspector pipeline used by stand-alone image blocks
    // (no race with the deferred tagItem() pass on nested children).
    return `<div class="tpl-img" data-ds-item-kind="image" style="aspect-ratio:4/3;border-radius:var(--r-md);background:url('assets/Moto.png') center/cover no-repeat;${extra}"></div>`;
  }
  function buildTemplate(id) {
    const w = document.createElement('div');
    if (id === 'photo-grid-4x2' || id === 'photo-grid-4x2-45') {
      // Foto — grade do nosso grid: 4 colunas × 2 linhas. Cada célula é um
      // .tpl-img (data-ds-item-kind="image"), então pode ser selecionada e
      // trocada individualmente pela barra da direita (Arquivo). Duas variantes:
      // fotos 1:1 (photo-grid-4x2) e fotos 4:5 (photo-grid-4x2-45).
      const ar = id === 'photo-grid-4x2-45' ? '4/5' : '1';
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--ds-gap, 16px)">${Array(8)
        .fill(0)
        .map(() => tplImg('aspect-ratio:' + ar))
        .join('')}</div>`;
    } else if (id === 'photo-2-wide') {
      // Foto — 2 imagens bem horizontais (21:9), full-width (fora a fora),
      // empilhadas com o gutter padrão do sistema (var(--ds-gap)) entre elas.
      // Cada célula é um .tpl-img trocável pela barra da direita.
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr;gap:var(--ds-gap, 16px)">${tplImg('width:100%;aspect-ratio:21/9')}${tplImg('width:100%;aspect-ratio:21/9')}</div>`;
    } else if (id === 'photo-bento-916') {
      // Foto — Bento: 1 foto 9:16 (alta) à esquerda + 2 fotos 16:9 empilhadas à
      // direita. Colunas 5/7 do grid de 12 (nosso grid). A coluna direita define
      // a altura; a foto da esquerda estica pra acompanhar (stretch). Cada célula
      // é um .tpl-img trocável pela barra da direita.
      w.innerHTML = `<div style="display:grid;grid-template-columns:5fr 7fr;gap:var(--ds-gap, 16px);align-items:stretch">${tplImg('height:100%;aspect-ratio:auto')}<div style="display:flex;flex-direction:column;gap:var(--ds-gap, 16px)">${tplImg('aspect-ratio:16/9')}${tplImg('aspect-ratio:16/9')}</div></div>`;
    } else if (id === 'photo-grid-2x1-45') {
      // Foto — 2 fotos 4:5 em 2 colunas (nosso grid; 2 col = 6 colunas DS cada).
      // Cada célula é um .tpl-img trocável pela barra da direita.
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--ds-gap, 16px)">${Array(2)
        .fill(0)
        .map(() => tplImg('aspect-ratio:4/5'))
        .join('')}</div>`;
    } else if (id === 'photo-grid-3x2-169') {
      // Foto — grade 3 colunas × 2 linhas, 6 fotos 16:9 (nosso grid; 3 col = 4
      // colunas DS cada). Cada célula é um .tpl-img trocável pela barra da direita.
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--ds-gap, 16px)">${Array(6)
        .fill(0)
        .map(() => tplImg('aspect-ratio:16/9'))
        .join('')}</div>`;
    } else if (id === 'photo-full-169') {
      // Foto — full screen: 1 imagem 16:9 ocupando toda a largura do conteúdo.
      // É um .tpl-img trocável pela barra da direita (Arquivo).
      w.innerHTML = `<div>${tplImg('aspect-ratio:16/9;width:100%')}</div>`;
    } else if (id === 'photo-grid-4x1-916') {
      // Foto — 4 imagens 9:16 em uma linha (4 colunas, nosso grid). Cada célula
      // é um .tpl-img trocável individualmente pela barra da direita (Arquivo).
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--ds-gap, 16px)">${Array(4)
        .fill(0)
        .map(() => tplImg('aspect-ratio:9/16'))
        .join('')}</div>`;
    } else if (id === 'hero-img') {
      w.innerHTML = `<div>${tplImg('aspect-ratio:16/9')}</div>`;
    } else if (id === 'split-circle') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;position:relative;aspect-ratio:16/9">${tplImg('height:100%;aspect-ratio:auto;border-radius:0')}<div style="background:transparent"></div><div style="position:absolute;left:50%;top:50%;transform:translate(-30%,-50%);width:30%;aspect-ratio:1">${tplImg('height:100%;aspect-ratio:1;border-radius:50%;')}</div></div>`;
    } else if (id === 'grid-2x2') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px">${Array(4).fill(tplImg('aspect-ratio:1')).join('')}</div>`;
    } else if (id === 'meditation') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:1.3fr 1fr;gap:12px">${tplImg('aspect-ratio:auto;height:100%;grid-column:1 / 2;grid-row:1 / 2')}<div style="grid-column:2 / 3;grid-row:1 / 2"></div><div style="grid-column:1 / 2;grid-row:2 / 3"></div>${tplImg('aspect-ratio:auto;height:100%;grid-column:2 / 3;grid-row:2 / 3')}</div>`;
    } else if (id === 'grid-4-square') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${Array(4).fill(tplImg('aspect-ratio:1')).join('')}</div>`;
    } else if (id === 'gallery-4x3') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:12px">${Array(12).fill(tplImg('aspect-ratio:4/3')).join('')}</div>`;
    } else if (id === 'img-text-right') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:32px;align-items:center">${tplImg('aspect-ratio:4/3')}<div><div class="tk-l" style="color:var(--text)">Você roda. A Yamaha cuida.</div><div class="tk-m" style="margin-top:12px;color:var(--text-2)">Direta, confiante, reassegura. Frases declarativas curtas — segunda pessoa, sentence case sempre. Sem emoji, sem grito.</div></div></div>`;
    } else if (id === 'collage-3') {
      w.innerHTML = `<div style="position:relative;height:420px"><div style="position:absolute;right:4%;top:4%;width:48%;height:48%">${tplImg('height:100%;aspect-ratio:auto')}</div><div style="position:absolute;left:4%;top:26%;width:54%;height:56%">${tplImg('height:100%;aspect-ratio:auto')}</div><div style="position:absolute;right:12%;bottom:4%;width:36%;height:38%">${tplImg('height:100%;aspect-ratio:auto')}</div></div>`;
    } else if (id === 'stripe-3') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${tplImg('aspect-ratio:3/2')}${tplImg('aspect-ratio:3/2')}${tplImg('aspect-ratio:3/2')}</div>`;
    } else if (id === 'img-hero-pair') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center"><div><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">Enterprise-grade security for your brand intelligence</h2><p class="tk-m" style="margin:24px 0 0;color:var(--text-2);max-width:440px">Your brand is your most valuable asset. We protect it like it is.</p></div>${tplImg('aspect-ratio:1;height:100%')}</div>`;
    } else if (id === 'img-compliance') {
      const badge = (label, bg, color) =>
        `<div style="position:relative"><div style="aspect-ratio:1;width:120px;background:${bg};color:${color};border-radius:24px;display:grid;place-items:center;font-family:var(--type-mb-family);font-weight:var(--type-mb-weight);font-size:var(--type-mb-size);letter-spacing:-0.01em">${label}</div><div class="tk-xs" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;background:var(--bs-white);border-radius:50%;display:grid;place-items:center;color:var(--bs-cyan)">✓</div></div>`;
      w.innerHTML = `<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:center"><div><div class="world-eyebrow" style="margin:0 0 18px;color:var(--text-3)">Certified & compliant</div><h2 class="tk-xl" style="margin:0;color:var(--bs-white);max-width:560px">We maintain compliance with the most rigorous international security standards</h2><a class="tk-sb" href="#" style="display:inline-flex;background:var(--bs-white);color:var(--bs-navy);padding:12px 22px;border-radius:var(--r-full);text-decoration:none;margin-top:32px">Visit trust portal</a></div><div style="display:flex;gap:14px;align-items:center;justify-content:flex-end">${badge('SOC2 I & II', 'var(--bs-white)', 'var(--bs-navy)')}${badge('CCPA', 'var(--bs-white)', 'var(--bs-navy)')}${badge('GDPR', 'var(--bs-blue)', 'var(--bs-white)')}</div></div>`;
    } else if (id === 'img-features-list') {
      const items = [
        ['SSO integration', 'Support for all common Single Sign-On protocols. You control user authentication and access.'],
        ['Data retention policies', 'Set and manage retention periods to align with your internal policies and regulatory requirements.'],
        ['Audit logging', 'Complete visibility into who accesses your data and when. Real-time governance and compliance tracking.'],
        ['BYOK option', 'Bring Your Own Key. Manage your own encryption keys to keep sensitive brand data protected at your discretion.'],
      ];
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start">${tplImg('aspect-ratio:1;height:100%')}<div style="display:flex;flex-direction:column;gap:32px">${items.map(([t, d]) => `<div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="margin:8px 0 0;color:var(--text-2);max-width:440px">${d}</p></div>`).join('')}</div></div>`;
    } else if (id === 'img-caption-below') {
      w.innerHTML = `<div>${tplImg('aspect-ratio:16/9')}<div style="margin-top:18px;max-width:560px"><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Find exactly what you want</h4><p class="tk-m" style="margin:8px 0 0;color:var(--text-2)">Get specific with your search. You can ask for a year, color, campaign, product, lighting style, photographer, and more.</p></div></div>`;
    } else if (id === 'img-three-features') {
      const items = [
        ['Keep everyone aligned', 'One living foundation for marketing, sales, product, and partners. No version chaos, no briefing calls. Just the same truth, every time.'],
        ['Reduce swirl and confusion', 'Instant answers about your brand based on your standards, strategy, voice, and positioning. No more endless questions about "on brand."'],
        ['Update once, sync everywhere', 'Your Brand OS grows with you. If you make a change, every team, tool, and output adapts automatically to stay current.'],
      ];
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${items.map(([t, d]) => `<div>${tplImg('aspect-ratio:4/5')}<h4 class="tk-mb" style="margin:18px 0 0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="margin:10px 0 0;color:var(--text-2)">${d}</p></div>`).join('')}</div>`;
    } else if (id === 'portrait-text') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:stretch">${tplImg('aspect-ratio:4/5;height:100%')}<div style="display:flex;flex-direction:column;justify-content:center"><div class="tk-l" style="color:var(--text)">Integrity, creativity, and empathy shape the way we work.</div><div class="tk-m" style="margin-top:12px;color:var(--text-2)">Não são apenas palavras — são a base de tudo que construímos. Acreditamos em fazer um ótimo trabalho e em criar relações reais.</div></div></div>`;
    } else if (id === 'caption-img') {
      w.innerHTML = `<div><div class="world-eyebrow" style="margin-bottom:14px">Capítulo</div><h2 class="tk-xl" style="margin:0 0 18px;color:var(--text);max-width:560px">Um título curto e direto sobre a próxima sessão.</h2>${tplImg('aspect-ratio:16/7')}</div>`;
    } else if (id === 'overlap-pair') {
      w.innerHTML = `<div style="position:relative;height:360px"><div style="position:absolute;left:0;top:14%;width:54%;height:72%;z-index: var(--z-base)">${tplImg('height:100%;aspect-ratio:auto')}</div><div style="position:absolute;right:0;top:0;width:50%;height:64%;z-index: var(--z-base)">${tplImg('height:100%;aspect-ratio:auto')}</div></div>`;
    } else if (id === 'empty-grid') {
      w.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div class="card" style="aspect-ratio:4/3"></div><div class="card" style="aspect-ratio:4/3"></div></div>';
    } else if (id === 'text-image-mix') {
      w.innerHTML =
        '<div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center"><div><div class="tile-title">Title here</div><div class="tile-desc" style="margin-top:8px">Short description for this module.</div></div><div style="background:var(--surface-2);border-radius:var(--r-md);aspect-ratio:4/3"></div></div>';
    } else if (id === 'txt-text-cards') {
      const cell = `<div><div class="tk-l" style="color:var(--bs-white)">Card title</div><p class="tk-m" style="margin:12px 0 0;color:var(--text-2)">Short description for this card with one or two supporting lines.</p></div>`;
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">${cell}${cell}</div>`;
    } else if (id === 'big-quote') {
      w.innerHTML = `<div class="card" style="text-align:center;padding:64px 32px"><h2 class="tk-xl" style="margin:0 auto;max-width:640px;color:var(--text)">"Você roda. A Yamaha cuida."</h2><p class="tk-m" style="margin-top:18px;color:var(--text-2)">Duas orações. Seis palavras. Uma promessa completa.</p></div>`;
    } else if (id === 'txt-heading') {
      const linkIcon = '<span class="bs-icon" style="--bs-icon-size:16px">link</span>';
      w.innerHTML = `<div class="heading-mod"><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">New heading</h2><button type="button" class="heading-anchor-btn" aria-label="Copiar link da seção" title="Copiar link">${linkIcon}</button></div>`;
    } else if (id === 'txt-text') {
      w.innerHTML = `<p class="tk-m" style="margin:0;color:var(--text-2);max-width:680px">Bloco de texto. Edite o conteúdo livremente.</p>`;
    } else if (id === 'txt-display') {
      w.innerHTML = `<h1 class="tk-super" style="margin:0;color:var(--bs-white)">Você roda.<br/>A Yamaha cuida.</h1>`;
    } else if (id === 'txt-eyebrow-heading') {
      w.innerHTML = `<div><div class="world-eyebrow" style="margin-bottom:14px">Capítulo</div><h2 class="tk-xl" style="margin:0 0 12px;color:var(--bs-white)">Um título direto para a próxima sessão</h2><p class="tk-m" style="color:var(--text-2);max-width:560px;margin:0">Subtítulo curto que apoia a ideia principal sem repetir.</p></div>`;
    } else if (id === 'txt-pull-quote') {
      w.innerHTML = `<div style="text-align:center;padding:0"><p class="tk-l" style="margin:0 auto;max-width:680px;color:var(--bs-white)">"A marca existe para reforçar confiança e cuidado contínuo."</p><div class="world-eyebrow" style="margin:18px 0 0">— BluStar Manifesto</div></div>`;
    } else if (id === 'txt-two-col') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px"><div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Princípio</h4><p class="tk-m" style="color:var(--text-2);margin:12px 0 0">Texto explicativo curto. Frases declarativas, segunda pessoa, sem emoji.</p></div><div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Aplicação</h4><p class="tk-m" style="color:var(--text-2);margin:12px 0 0">Como esse princípio se traduz em decisão prática no dia a dia da marca.</p></div></div>`;
    } else if (id === 'txt-headline-para') {
      w.innerHTML = `<div style="max-width:760px"><h2 class="tk-xl" style="margin:0 0 16px;color:var(--bs-white)">Um título que estabelece a ideia da seção</h2><p class="tk-m" style="color:var(--text-2);margin:0">Parágrafo de apoio com o contexto necessário. Mantenha entre 2 e 4 linhas — quem lê deve sair sabendo do que se trata sem precisar continuar.</p></div>`;
    } else if (id === 'txt-list-3') {
      const item = (n, t, d) => `<div><div class="world-eyebrow" style="margin-bottom:10px">${n}</div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="color:var(--text-2);margin:12px 0 0">${d}</p></div>`;
      w.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:48px">${item('01', 'Direto', 'Frases curtas, voz declarativa, sentence case sempre.')}${item('02', 'Reassegurador', 'Reforça confiança e continuidade — nunca grita, nunca apela.')}${item('03', 'Prático', 'Cada palavra carrega uma promessa concreta de produto ou serviço.')}</div>`;
    } else if (id === 'txt-do-dont') {
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px"><div><h4 class="tk-mb" style="margin:0;color:var(--bs-cyan)">Do</h4><p class="tk-m" style="color:var(--text-2);margin:12px 0 0">Frases curtas. Sentence case. Voz direta. Cyan apenas sobre navy. Tracking -2% em headings.</p></div><div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Don't</h4><p class="tk-m" style="color:var(--text-2);margin:12px 0 0">Sem emojis. Sem itálico. Sem grito. Sem cyan sobre branco em texto corrido.</p></div></div>`;
    } else if (id === 'txt-cover') {
      w.innerHTML = `<div class="cover-block" data-color="var(--bs-navy-deep)" style="background:var(--bs-navy-deep);color:var(--bs-white);padding:48px 56px 40px;min-height:520px;display:grid;grid-template-rows:auto 1fr;gap:24px"><span class="tk-s">02.CRAFT</span><h1 class="tk-super" style="margin:0;align-self:end">Craft in an age<br/>of infinite output</h1></div>`;
    } else if (id === 'txt-page-header') {
      w.innerHTML = `<div class="am-tpl-thumb" data-ds-edit-w="1280" data-ds-edit-h="174" style="width:1280px;height:174px;padding:0;display:block;aspect-ratio:auto;background:var(--bs-navy);overflow:hidden"><section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:16px;align-items:start;overflow-wrap:anywhere">
            <h1 class="tk-super" style="grid-column:1 / 9;grid-row:1;margin:0;color:var(--bs-white);letter-spacing:-0.02em">New page</h1>
            <button type="button" class="am-add" style="grid-column:9 / -1;grid-row:1;justify-self:end;align-self:center;display:inline-flex;align-items:center;gap:8px"><span class="bs-icon" style="--bs-icon-size:14px">download</span>Download</button>
            <h4 class="tk-mb" style="grid-column:1 / -1;grid-row:2;margin:0;color:var(--text-3)">Descrição da página. Clique para editar.</h4>
            <div aria-hidden="true" style="grid-column:1 / -1;grid-row:3;height:1px;background:var(--border-strong);margin-top:16px"></div>
          </section></div>`;
    } else if (id === 'txt-medium-statement') {
      w.innerHTML = `<div style="padding:0;border-left:3px solid var(--bs-cyan);padding-left:32px"><p class="tk-l" style="margin:0;color:var(--bs-white);max-width:760px">This is our guiding compass. These ideas set the foundation for our brand and its central tenets will shape future decisions.</p></div>`;
    } else if (id === 'txt-rule-twocol') {
      w.innerHTML = `<div style="padding:0"><div style="border-top:1px solid rgba(255,255,255,0.18);padding-top:24px;display:grid;grid-template-columns:1fr 3fr;gap:48px;align-items:start"><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Vision</h4><p class="tk-m" style="margin:0;color:var(--text-2);max-width:560px">A long-term aspiration for how we move forward and the future we hope to create. Our vision helps clearly identify our ambition and reason for being.</p></div></div>`;
    } else if (id === 'txt-belief-grid') {
      const cell = `<div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Belief</h4><p class="tk-m" style="margin:14px 0 0;color:var(--text-2)">Phasellus at ornare mauris, eu viverra tellus. Curabitur sit amet lorem lorem. Praesent vel turpis ex.</p></div>`;
      w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px 64px">${cell}${cell}${cell}${cell}</div>`;
    } else if (id === 'txt-next-chapter') {
      w.innerHTML = `<div style="padding:0 48px"><div style="border-top:1px solid rgba(255,255,255,0.18);padding-top:12px;margin-bottom:64px"><span class="tk-s" style="color:var(--bs-cyan)">Next chapter</span></div><h1 class="tk-super" style="margin:0;line-height:1;color:var(--text)">Logo</h1></div>`;
    } else if (id === 'txt-steps') {
      const step = (n, t, d) =>
        `<div style="display:grid;grid-template-columns:36px 1fr;gap:18px;align-items:start"><span style="width:32px;height:32px;border-radius:50%;background:var(--bs-cyan);color:var(--bs-navy);display:flex;align-items:center;justify-content:center;font-family:var(--type-mb-family);font-weight:var(--type-mb-weight);font-size:var(--type-mb-size)">${n}</span><div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="color:var(--text-2);margin:6px 0 0">${d}</p></div></div>`;
      w.innerHTML = `<div style="display:flex;flex-direction:column;gap:24px;max-width:680px">${step(1, 'Defina o tom', 'Antes de qualquer copy, decida o que a frase precisa fazer sentir.')}${step(2, 'Reduza pela metade', 'Se sobreviver com metade das palavras, é porque está melhor.')}${step(3, 'Leia em voz alta', 'Se tropeçou, reescreva. Voz é ritmo, não só vocabulário.')}</div>`;
    } else if (id === 'txt-hero-cta') {
      w.innerHTML = `<div style="padding:0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px"><div class="world-eyebrow" style="margin:0">Brand OS</div><h1 class="tk-super" style="margin:0;color:var(--bs-white);max-width:960px">The operating system<br/>for modern brand work</h1><p class="tk-m" style="margin:0;color:var(--text-2);max-width:560px">Turn guidelines, strategy, and signals into structured intelligence that powers every team, tool, and agent.</p><a class="tk-sb" href="#" style="display:inline-flex;background:var(--bs-cyan);color:var(--bs-navy);padding:12px 22px;border-radius:var(--r-full);text-decoration:none;margin-top:8px">Book a demo</a></div>`;
    } else if (id === 'txt-manifesto') {
      w.innerHTML = `<div style="padding:0;text-align:center"><p class="tk-l" style="margin:0 auto;max-width:820px;color:var(--text-2)">Brand is your most valuable asset. <span style="color:var(--bs-cyan)">BluStar</span> makes it machine-readable so every team, tool, and agent gets it right.</p></div>`;
    } else if (id === 'txt-section-intro') {
      w.innerHTML = `<div style="padding:0;display:flex;flex-direction:column;gap:14px;align-items:flex-start"><div class="world-eyebrow" style="margin:0">Platform</div><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">Brand OS</h2><p class="tk-mb" style="margin:0;color:var(--text-2);max-width:560px">The structured intelligence layer for your brand</p><a class="tk-sb" href="#" style="display:inline-flex;background:var(--bs-cyan);color:var(--bs-navy);padding:12px 22px;border-radius:var(--r-full);text-decoration:none;margin-top:14px">Learn more</a></div>`;
    } else if (id === 'txt-testimonial') {
      w.innerHTML = `<div style="padding:0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:32px"><p class="tk-xl" style="margin:0;max-width:1100px;color:var(--bs-white)">"As I build us into a global brand, BluStar will help the entire company become a global brand by ensuring consistency across countries, languages and channels."</p><div style="display:flex;gap:14px;align-items:center"><div style="width:48px;height:48px;background:var(--bs-cyan);border-radius:50%;display:grid;place-items:center;color:var(--bs-navy);font:700 13px/1 var(--font);letter-spacing:0.04em">DC</div><div style="text-align:left"><div class="tk-sb" style="color:var(--bs-white)">David Corns</div><div class="tk-s" style="color:var(--text-3);margin-top:2px;text-transform:none;letter-spacing:0">Chief Marketing Officer, Turo</div></div></div></div>`;
    } else if (id === 'txt-cta-panel') {
      w.innerHTML = `<div style="padding:0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px"><div style="width:64px;height:64px;background:var(--bs-cyan);border-radius:14px;display:grid;place-items:center;color:var(--bs-navy);font:500 32px/1 var(--font-display)">★</div><h2 class="tk-xl" style="margin:8px 0 0;color:var(--bs-white);max-width:680px">Get a personalized demo<br/>for your brand</h2><p class="tk-m" style="margin:0;color:var(--text-2);max-width:480px">See how BluStar helps you get time back for high-impact work.</p><a class="tk-sb" href="#" style="display:inline-flex;background:var(--bs-cyan);color:var(--bs-navy);padding:12px 22px;border-radius:var(--r-full);text-decoration:none;margin-top:8px">Book a demo</a></div>`;
    } else if (id === 'txt-feature-grid') {
      const features = [
        ['60% faster', 'Launches with on-brand briefs, copy, and creative. No endless alignment or approval bottlenecks.'],
        ['One foundation', 'Every team member works from the same truth. Marketing, product, creative, and sales stay aligned.'],
        ['Ship with confidence', 'Brand Check catches issues before launch. Quality control without slowing down your velocity.'],
        ['2-day onboarding', 'Quick setup and immediate value. Activate your team without implementations that take months.'],
        ['Grow without breaking', 'Add team members, scale output, and maintain consistency. Built to grow from 5 to 50 people.'],
        ['Security included', 'Enterprise-grade security with end-to-end encryption, SSO, and role-based permissions.'],
      ];
      w.innerHTML =
        `<div style="padding:0;display:flex;flex-direction:column;gap:48px"><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">What you get</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:48px 56px">` +
        features.map(([t, d]) => `<div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="margin:14px 0 0;color:var(--text-2)">${d}</p></div>`).join('') +
        `</div></div>`;
    } else if (id === 'txt-faq') {
      const qs = ['What is Brand Assistant?', 'What is Canvas?', 'What is Brand Check?', 'Will AI replace our creative team?'];
      w.innerHTML =
        `<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:64px;align-items:start"><div><div class="world-eyebrow" style="margin-bottom:18px">FAQ</div><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">Have questions?<br/>Ask us.</h2></div><div>` +
        qs.map(q => `<div style="display:flex;justify-content:space-between;align-items:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.14)"><span class="tk-m" style="color:var(--bs-white)">${q}</span><span style="color:var(--bs-cyan);font:300 24px/1 var(--font)">+</span></div>`).join('') +
        `<div style="border-top:1px solid rgba(255,255,255,0.14)"></div></div></div>`;
    } else if (id === 'txt-compliance') {
      const items = [
        ['SOC 2 Type II certified', 'We meet SOC 2 Type II requirements to ensure secure and compliant management of your brand data across all systems.'],
        ['CCPA', 'We strictly follow the California Consumer Privacy Act (CCPA) and give users full rights over their personal information.'],
        ['GDPR', "GDPR-compliant data handling. We operate under the world's strictest standard for data privacy."],
      ];
      w.innerHTML =
        `<div style="padding:0"><div style="border-top:1px solid rgba(255,255,255,0.16);padding-top:48px;display:grid;grid-template-columns:repeat(3,1fr);gap:56px">` +
        items.map(([t, d]) => `<div><div class="tk-sb" style="color:var(--bs-white);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:18px">${t}</div><p class="tk-m" style="margin:0;color:var(--text-2)">${d}</p></div>`).join('') +
        `</div></div>`;
    } else if (id === 'txt-guide-list') {
      const items = [
        ['1', 'Agency', 'We build tools to amplify human intent, not replace it. The machine suggests, and the creative person decides.'],
        ['2', 'MAYA', 'Most Advanced Yet Acceptable. We push the edges of technology and stay grounded in utility, not science fiction.'],
        ['3', 'Context', 'Generic models average the world. Ours learn your brand, strategy, and history to ensure ongoing relevance.'],
        ['4', 'Truth', "A brand can't afford to hallucinate. We prioritize citation, accuracy, and source material over generative guesswork."],
      ];
      w.innerHTML =
        `<div style="padding:0;display:grid;grid-template-columns:1fr 1.6fr;gap:64px;align-items:start"><h2 class="tk-xl" style="margin:0;color:var(--bs-white)">What guides us</h2><div style="display:flex;flex-direction:column;gap:48px">` +
        items
          .map(
            ([n, t, d]) =>
              `<div style="display:grid;grid-template-columns:56px 1fr;gap:24px;align-items:start"><div style="font-family:var(--type-super-family);font-weight:var(--type-super-weight);font-size:var(--type-xl-size);line-height:1;color:var(--bs-cyan)">${n}</div><div><h4 class="tk-mb" style="margin:0;color:var(--bs-white)">${t}</h4><p class="tk-m" style="margin:12px 0 0;color:var(--text-2);max-width:520px">${d}</p></div></div>`
          )
          .join('') +
        `</div></div>`;
    } else if (id === 'txt-work-with-us') {
      w.innerHTML = `<div style="padding:0;display:flex;flex-direction:column;align-items:flex-start;gap:20px"><div class="world-eyebrow" style="margin:0">Work with us</div><p class="tk-xl" style="margin:0;color:var(--bs-white);max-width:880px">We believe in a collision of disciplines. Strategists who code. Engineers who love typography. Our tools compound creativity. If you respect the craft, we should talk.</p><a class="tk-sb" href="#" style="display:inline-flex;background:var(--bs-cyan);color:var(--bs-navy);padding:12px 22px;border-radius:var(--r-full);text-decoration:none;margin-top:8px">View open roles</a></div>`;
    } else {
      return null;
    }
    return w.firstChild;
  }

  function insertModule(name) {
    const newEl = buildModule(name);
    if (currentInsertBefore && currentInsertBefore.parentNode) {
      currentInsertBefore.parentNode.insertBefore(newEl, currentInsertBefore);
      const slot = makeSlot();
      currentInsertBefore.parentNode.insertBefore(slot, currentInsertBefore);
      ensureSlotBefore(newEl);
    }
    close();
    // Modules that render on a fixed native canvas (e.g. Color specs) need the
    // scale-to-fit pass so the 1920×1080 mirror shrinks to the column width.
    if (newEl.querySelector?.('.praia-mirror')) {
      window.__praiaEnsureMirrorObserver?.();
      requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
    }
  }

  // Color-module helpers exposed for the right-side color inspector.
  // Delegation is required because autosave persists DOM via innerHTML,
  // which drops directly-attached listeners on restore.
  const __copyToClipboard = text => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      ta.remove();
    };
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(fallback);
      } else {
        fallback();
      }
    } catch {
      fallback();
    }
  };
  window.__praiaCopy = __copyToClipboard;
  window.__praiaToast = t => __showCopyToast(t);
  // Single source of truth for right-panel "mode" classes. Any open*Editor
  // calls this first so we never end up with two inspectors stacked.
  const __PRAIA_RIGHT_MODES = ['text-mode', 'layout-mode', 'editing', 'editing-color', 'component-mode', 'color-mode', 'video-mode', 'photo-mode', 'spacing-mode', 'themepal-mode', 'history-mode', 'icon-mode', 'client-mode', 'button-mode'];
  window.__praiaCloseRightModes = () => {
    document.querySelector('.guide-right')?.classList.remove(...__PRAIA_RIGHT_MODES);
  };
  const __showCopyToast = text => {
    let t = document.getElementById('__cl_copy_toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '__cl_copy_toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:var(--bs-white);color:var(--bs-navy);padding:10px 18px;border-radius:999px;font:var(--type-sb-weight) var(--type-sb-size)/1 var(--font);letter-spacing:0;z-index:var(--z-toast);pointer-events:none;opacity:0;transition:opacity .18s var(--ease);box-shadow:0 8px 24px rgba(0,0,0,0.35)';
      document.body.appendChild(t);
    }
    t.textContent = text;
    requestAnimationFrame(() => {
      t.style.opacity = '1';
    });
    clearTimeout(t.__hideT);
    t.__hideT = setTimeout(() => {
      t.style.opacity = '0';
    }, 1200);
  };

  // Color math helpers
  const __clHexToRgb = h => {
    const x = h.replace('#', '');
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
  };
  const __clRgbToCmyk = (r, g, b) => {
    const R = r / 255,
      G = g / 255,
      B = b / 255;
    const k = 1 - Math.max(R, G, B);
    if (k === 1) return [0, 0, 0, 100];
    const c = (1 - R - k) / (1 - k),
      m = (1 - G - k) / (1 - k),
      y = (1 - B - k) / (1 - k);
    return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
  };
  const __clLuma = h => {
    const [r, g, b] = __clHexToRgb(h);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  const __clInk = h => (__clLuma(h) > 0.55 ? '#061833' : '#ffffff');
  const __clMetaHtml = hex => {
    const [r, g, b] = __clHexToRgb(hex);
    const [c, m, y, k] = __clRgbToCmyk(r, g, b);
    return `<div class="meta-hex">HEX ${hex.toUpperCase()}</div><div class="meta-rgb">R${r} G${g} B${b}</div><div class="meta-cmyk">C${c} M${m} Y${y} K${k}</div><div class="meta-pms">PMS 4280 C</div>`;
  };

  // Module info: max items per template
  const __clInfo = el => {
    if (!el) return null;
    if (el.classList.contains('cover-block')) return { kind: 'cover', module: el, items: [el], max: 1, hasStroke: false };
    if (el.classList.contains('cl-hero')) return { kind: 'hero', module: el, items: [el], max: 1, hasStroke: false };
    if (el.classList.contains('cl-card')) return { kind: 'card', module: el.parentElement, items: [...el.parentElement.querySelectorAll('.cl-card')], max: 3, hasStroke: true };
    if (el.classList.contains('cl-strip')) return { kind: 'strip', module: el.parentElement, items: [...el.parentElement.querySelectorAll('.cl-strip')], max: 7, hasStroke: false };
    return null;
  };

  const __clRefresh = el => {
    const hex = el.dataset.color || '#0FC4D5';
    el.style.background = hex;
    el.style.color = __clInk(hex);
    const m = el.querySelector('.cl-meta');
    if (m && m.dataset.userEdited !== 'true') m.innerHTML = __clMetaHtml(hex);
  };

  // Brand color tokens for the Cover picker (Cover follows the DS, not arbitrary HEX)
  const __clTokens = [
    { name: 'BluStar Navy', varName: '--bs-navy' },
    { name: 'Navy Deep', varName: '--bs-navy-deep' },
    { name: 'BluStar Cyan', varName: '--bs-cyan' },
    { name: 'Royal Blue', varName: '--bs-blue' },
    { name: 'Cyan 200', varName: '--bs-cyan-200' },
    { name: 'Cyan 100', varName: '--bs-cyan-100' },
    { name: 'Cyan 50', varName: '--bs-cyan-50' },
    { name: 'White', varName: '--bs-white' },
  ];
  const __resolveVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const __normHex = s => {
    const h = (s || '').trim().toLowerCase();
    if (h.startsWith('#')) return h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h;
    return h;
  };

  // Right panel binding
  let __clSelected = null;
  const __clOpenPanel = el => {
    const info = __clInfo(el);
    if (!info) return;
    __clSelected = el;
    const right = document.querySelector('.guide-right');
    if (!right) return;
    // Clear text selection from any prior text-mode pick
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    // Close every other right-panel inspector first.
    window.__praiaCloseRightModes?.();
    right.classList.add('color-mode');
    // Title
    const title = document.getElementById('grc-color-title');
    if (title) title.textContent = { cover: 'Cover', hero: 'Color card', card: 'Color cards', strip: 'Color palette' }[info.kind];
    // Fill: Cover uses DS tokens (no arbitrary HEX); others use native picker + Copy HEX
    const hex = el.dataset.color || '#0FC4D5';
    const isCover = info.kind === 'cover';
    const pickerRow = document.getElementById('grc-fill-row-picker');
    const tokensRow = document.getElementById('grc-fill-tokens');
    const copyBtn = document.getElementById('grc-copy-hex');
    if (pickerRow) pickerRow.hidden = isCover;
    if (tokensRow) tokensRow.hidden = !isCover;
    if (copyBtn) copyBtn.hidden = isCover;
    if (isCover) {
      tokensRow.innerHTML = '';
      const current = __normHex(hex);
      __clTokens.forEach(t => {
        const val = __normHex(__resolveVar(t.varName));
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'grc-token' + (val === current ? ' active' : '');
        b.dataset.var = t.varName;
        b.innerHTML = `<span class="grc-token-dot" style="background:var(${t.varName})"></span><span>${t.name}</span>`;
        b.addEventListener('click', () => {
          if (!__clSelected) return;
          const newHex = __normHex(__resolveVar(t.varName)).toUpperCase();
          __clSelected.dataset.color = newHex;
          __clRefresh(__clSelected);
          tokensRow.querySelectorAll('.grc-token').forEach(x => x.classList.toggle('active', x === b));
          window.__praiaAutosave?.();
        });
        tokensRow.appendChild(b);
      });
    }
    const fill = document.getElementById('grc-fill-input');
    const dot = document.getElementById('grc-fill-dot');
    const hexText = document.getElementById('grc-hex-text');
    if (fill) fill.value = hex;
    if (dot) {
      dot.style.background = hex;
      dot.style.borderStyle = 'solid';
    }
    if (hexText) hexText.textContent = hex.toUpperCase();
    // Stroke
    const strokeSec = document.getElementById('grc-stroke-section');
    if (strokeSec) strokeSec.hidden = !info.hasStroke;
    if (info.hasStroke) {
      const cur = parseInt(el.style.getPropertyValue('--cl-stroke'), 10) || 1;
      el.style.setProperty('--cl-stroke', cur + 'px');
      const v = document.getElementById('grc-stroke-val');
      if (v) v.textContent = cur + ' px';
    }
    // Items count
    const modSec = document.getElementById('grc-module-section');
    const modCount = document.getElementById('grc-item-count');
    if (modSec) modSec.hidden = info.max <= 1;
    if (modCount) modCount.textContent = `${info.items.length} / ${info.max}`;
    const inc = document.getElementById('grc-item-inc');
    const dec = document.getElementById('grc-item-dec');
    if (inc) inc.disabled = info.items.length >= info.max;
    if (dec) dec.disabled = info.items.length <= 1;
  };
  const __clClosePanel = () => {
    __clSelected = null;
    const right = document.querySelector('.guide-right');
    right?.classList.remove('color-mode');
  };

  // Wire panel controls (once)
  const wirePanel = () => {
    const fill = document.getElementById('grc-fill-input');
    fill?.addEventListener('input', e => {
      if (!__clSelected) return;
      const hex = e.target.value;
      __clSelected.dataset.color = hex;
      const m = __clSelected.querySelector('.cl-meta');
      if (m) delete m.dataset.userEdited;
      __clRefresh(__clSelected);
      document.getElementById('grc-fill-dot').style.background = hex;
      document.getElementById('grc-hex-text').textContent = hex.toUpperCase();
      window.__praiaAutosave?.();
    });
    document.getElementById('grc-copy-hex')?.addEventListener('click', () => {
      if (!__clSelected) return;
      const hex = (__clSelected.dataset.color || '').toUpperCase();
      __copyToClipboard(hex);
      __showCopyToast('Copiado ' + hex);
    });
    const strokeStep = delta => () => {
      if (!__clSelected) return;
      const cur = parseInt(__clSelected.style.getPropertyValue('--cl-stroke'), 10) || 1;
      const nv = Math.min(8, Math.max(0, cur + delta));
      __clSelected.style.setProperty('--cl-stroke', nv + 'px');
      document.getElementById('grc-stroke-val').textContent = nv + ' px';
      window.__praiaAutosave?.();
    };
    document.getElementById('grc-stroke-inc')?.addEventListener('click', strokeStep(+1));
    document.getElementById('grc-stroke-dec')?.addEventListener('click', strokeStep(-1));
    document.getElementById('grc-item-inc')?.addEventListener('click', () => {
      if (!__clSelected) return;
      const info = __clInfo(__clSelected);
      if (!info || info.items.length >= info.max) return;
      const tmpl = info.items[info.items.length - 1];
      const clone = tmpl.cloneNode(true);
      clone.dataset.color = '#3259FF';
      clone.style.background = '#3259FF';
      clone.style.color = __clInk('#3259FF');
      const nm = clone.querySelector('.cl-name');
      if (nm) nm.textContent = 'New\nColor';
      const mt = clone.querySelector('.cl-meta');
      if (mt) {
        delete mt.dataset.userEdited;
        mt.innerHTML = __clMetaHtml('#3259FF');
      }
      info.module.appendChild(clone);
      info.module.style.setProperty('--cl-cols', info.items.length + 1);
      __clOpenPanel(__clSelected);
      window.__praiaAutosave?.();
    });
    document.getElementById('grc-item-dec')?.addEventListener('click', () => {
      if (!__clSelected) return;
      const info = __clInfo(__clSelected);
      if (!info || info.items.length <= 1) return;
      const toRemove = __clSelected;
      // Select another item before removing
      const next = info.items.find(x => x !== toRemove);
      toRemove.remove();
      info.module.style.setProperty('--cl-cols', info.items.length - 1);
      __clSelected = next;
      __clOpenPanel(next);
      window.__praiaAutosave?.();
    });
    document.getElementById('grc-color-close')?.addEventListener('click', __clClosePanel);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wirePanel);
  } else {
    wirePanel();
  }

  // Spacing inspector wiring (.spacer-block) — DS spacing tokens
  const __spaceTokens = [20, 40, 60, 80, 120, 220];
  let __spaceSelected = null;
  const __spaceNormalize = el => {
    // Legacy spacer-blocks were rendered with a <select>; replace with a label span.
    const oldSel = el.querySelector('select.spacer-select, select');
    if (oldSel) oldSel.remove();
    let lbl = el.querySelector('.spacer-label');
    if (!lbl) {
      lbl = document.createElement('span');
      lbl.className = 'spacer-label';
      lbl.style.cssText = 'position:relative;z-index: var(--z-base);background:var(--surface);color:var(--text-2);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font:500 11px/1 var(--font)';
      el.appendChild(lbl);
    }
    const size = parseInt(el.dataset.size, 10) || 40;
    lbl.textContent = size + 'px';
    el.style.height = size + 'px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.position = 'relative';
  };
  const __spaceApply = (el, size) => {
    el.dataset.size = String(size);
    el.style.height = size + 'px';
    __spaceNormalize(el);
    const lbl = el.querySelector('.spacer-label');
    if (lbl) lbl.textContent = size + 'px';
  };
  const __spaceRenderTokens = current => {
    const wrap = document.getElementById('grs-tokens');
    if (!wrap) return;
    const max = __spaceTokens[__spaceTokens.length - 1];
    wrap.innerHTML = __spaceTokens
      .map(
        s => `
      <button type="button" class="grs-token${s === current ? ' active' : ''}" data-size="${s}">
        <span class="grs-token-bar" style="height:${Math.max(3, Math.round((s / max) * 40))}px"></span>
        <span class="grs-token-val">${s}px</span>
      </button>`
      )
      .join('');
    wrap.querySelectorAll('.grs-token').forEach(b =>
      b.addEventListener('click', () => {
        if (!__spaceSelected) return;
        const size = parseInt(b.dataset.size, 10);
        __spaceApply(__spaceSelected, size);
        wrap.querySelectorAll('.grs-token').forEach(x => x.classList.toggle('active', x === b));
        window.__praiaAutosave?.();
      })
    );
  };
  const __spaceOpen = el => {
    __spaceNormalize(el);
    __spaceSelected = el;
    const right = document.querySelector('.guide-right');
    if (!right) return;
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    window.__praiaCloseRightModes?.();
    right.classList.add('spacing-mode');
    el.classList.add('canvas-selected');
    const cur = parseInt(el.dataset.size, 10) || 40;
    __spaceRenderTokens(cur);
  };
  const __spaceClose = () => {
    __spaceSelected = null;
    document.querySelector('.guide-right')?.classList.remove('spacing-mode');
  };
  document.getElementById('grs-close')?.addEventListener('click', __spaceClose);
  document.addEventListener(
    'click',
    e => {
      if (document.body.classList.contains('preview-mode') || document.body.classList.contains('ds-mode')) return;
      const sp = e.target.closest('.spacer-block');
      if (!sp) return;
      e.preventDefault();
      e.stopPropagation();
      __spaceOpen(sp);
    },
    true
  );

  // Video inspector wiring (.video-mod). Autoplay/loop/mute driven by an
  // IntersectionObserver: a video plays only while visible and pauses when
  // offscreen. Listeners are wired ONCE per module and we never call load()
  // in a loop — that repeated load()+play() was what froze the renderer
  // (ERR_ABORTED cascades on the 18MB MP4's byte-range requests).
  let __vidSelected = null;
  const __vidPlaySafe = v => {
    if (v) {
      try {
        v.play?.().catch(() => {});
      } catch {}
    }
  };
  // Videos only PLAY in preview/published mode. While editing, they stay paused
  // on their poster frame (zero decode) so the editor never freezes on heavy
  // (18MB+) clips. The Autoplay toggle = "play when published".
  const __vidLive = () => document.body.classList.contains('preview-mode');
  const __vidUpdateOverlay = mod => {
    if (!mod) return;
    const v = mod.querySelector('video');
    if (!v) return;
    // Show the play affordance whenever it's paused outside live mode.
    mod.dataset.showPlay = !__vidLive() && v.paused ? 'true' : 'false';
  };
  const __vidIO =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          ents => {
            ents.forEach(en => {
              const mod = en.target;
              const v = mod.querySelector('video');
              if (!v) return;
              if (!__vidLive() || mod.dataset.autoplay === 'false') {
                try {
                  v.pause();
                } catch {}
                return;
              }
              if (en.isIntersecting) __vidPlaySafe(v);
              else {
                try {
                  v.pause();
                } catch {}
              }
            });
          },
          { threshold: 0.2 }
        )
      : null;
  const __vidNormalize = mod => {
    if (!mod) return;
    if (!mod.querySelector('.video-mod-play')) {
      const btn = document.createElement('button');
      btn.className = 'video-mod-play';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Play');
      btn.innerHTML = '<span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span>';
      mod.appendChild(btn);
    }
    if (!mod.dataset.autoplay) mod.dataset.autoplay = 'true';
    if (!mod.dataset.loop) mod.dataset.loop = 'true';
    if (!mod.dataset.muted) mod.dataset.muted = 'true';
    const v = mod.querySelector('video');
    if (v) __vidCapRes(mod, v);
    if (v && mod.dataset.vidWired !== '1') {
      mod.dataset.vidWired = '1';
      // We drive playback ourselves (via IO), so drop the HTML autoplay attr.
      v.removeAttribute('autoplay');
      v.muted = true;
      v.playsInline = true;
      // preload="none" by default: decoding several full-res clips at once freezes
      // the page. We only load/decode when a clip actually plays (poster covers it).
      if (!v.getAttribute('preload')) v.setAttribute('preload', 'none');
      ['play', 'pause', 'ended'].forEach(ev => v.addEventListener(ev, () => __vidUpdateOverlay(mod)));
      __vidIO?.observe(mod);
    }
  };
  // Self-heal performance for ANY Cloudinary video (instances saved before this
  // existed, or a pasted raw URL): rewrite the transform to (1) cap resolution to
  // how big it's actually shown — so a 4K source never decodes at 4K in a small
  // box — and (2) force H.264 (vc_h264,f_mp4) so it decodes on HARDWARE instead of
  // VP9 software-decode, which janks when several play at once. We COLLAPSE the
  // whole transform segment (replacing any q_auto/f_auto that would re-pick VP9).
  // Idempotent: skips URLs we already normalized (they carry vc_h264).
  // Processed-once-per-load guard kept in memory (NOT a data-attribute, so it never
  // gets autosaved and every fresh load re-evaluates).
  const __vidCappedSet = new WeakSet();
  const __vidCapRes = (mod, v) => {
    const src = v.getAttribute('src') || '';
    if (!/res\.cloudinary\.com\/.+\/upload\/.*\/v\d+\//.test(src)) return; // Cloudinary w/ version
    if (__vidCappedSet.has(v)) return; // already handled this load
    __vidCappedSet.add(v);
    // Synchronous & one-shot: runs at the TOP of __vidSync, BEFORE the play call,
    // so it never interrupts an already-playing clip. Size by measured width when
    // available; otherwise fall back by aspect so a landscape hero is never floored
    // to a tiny width during an unstable (0-width) measurement.
    const w = mod.getBoundingClientRect().width;
    let target;
    if (w && w >= 80) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      target = Math.min(1600, Math.max(360, Math.round(w * dpr)));
    } else {
      const ar = (getComputedStyle(mod).aspectRatio || '').replace(/\s/g, '');
      target = /(9\/16|3\/4|4\/5)/.test(ar) ? 720 : 1600;
    }
    // Rewrite when the URL lacks our H.264 cap, OR is sized notably smaller than
    // ideal (a stale/undersized instance — e.g. a hero stuck at w_320 looks blurry).
    const cur = +(src.match(/\bw_(\d+)/) || [])[1] || 0;
    const needs = !/\bvc_h264\b/.test(src) || !/\bf_mp4\b/.test(src) || !cur || cur < target * 0.7;
    if (!needs) return;
    const transform = `w_${target},c_limit,vc_h264,q_auto,f_mp4`;
    const capped = src.replace(/\/upload\/.*\/(v\d+\/)/, `/upload/${transform}/$1`);
    if (capped !== src) {
      v.setAttribute('src', capped);
      try {
        v.load();
      } catch {}
    }
  };
  const __vidSync = mod => {
    if (!mod) return;
    __vidNormalize(mod);
    const v = mod.querySelector('video');
    if (!v) return;
    const ap = mod.dataset.autoplay !== 'false';
    v.loop = mod.dataset.loop !== 'false';
    v.muted = mod.dataset.muted !== 'false';
    // Play when autoplay is on AND either we're in live/preview mode OR this is
    // the currently-selected module in edit mode — so the inspector controls
    // (autoplay/loop/sound) have an immediate, visible effect while editing.
    // Only ONE video (the selected one) ever plays in edit mode, so there's no
    // multi-decode freeze.
    const isSelected = __vidSelected === mod;
    if (ap && (__vidLive() || isSelected)) {
      const r = mod.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < (window.innerHeight || 9999);
      if (visible || isSelected) __vidPlaySafe(v);
    } else {
      try {
        v.pause();
      } catch {}
    }
    __vidUpdateOverlay(mod);
  };
  const __vidOpen = mod => {
    // Selecting a different video in edit mode: pause the previously-selected one
    // so only the active module decodes/plays.
    const prev = __vidSelected;
    if (prev && prev !== mod && !__vidLive()) {
      try {
        prev.querySelector('video')?.pause();
      } catch {}
    }
    __vidSelected = mod;
    const right = document.querySelector('.guide-right');
    if (!right) return;
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    window.__praiaCloseRightModes?.();
    right.classList.add('video-mode');
    mod.classList.add('canvas-selected');
    window.__praiaRenderVideoGallery?.();
    const ap = mod.dataset.autoplay !== 'false';
    const lp = mod.dataset.loop !== 'false';
    const mt = mod.dataset.muted !== 'false';
    document.getElementById('grv-autoplay')?.setAttribute('aria-pressed', String(ap));
    document.getElementById('grv-loop')?.setAttribute('aria-pressed', String(lp));
    document.getElementById('grv-sound')?.setAttribute('aria-pressed', String(!mt));
    // Show the current source in the URL field (blank for blob/IDB sources).
    const urlField = document.getElementById('grv-url');
    if (urlField) {
      const src = mod.querySelector('video')?.getAttribute('src') || '';
      urlField.value = src.startsWith('blob:') ? '' : src;
    }
    // Reflect the current state immediately: an autoplay-on video starts playing
    // the moment it's selected in edit mode.
    __vidSync(mod);
  };
  const __vidClose = () => {
    // Pause the video we're deselecting so it stops decoding in edit mode.
    const mod = __vidSelected;
    if (mod && !__vidLive()) {
      try {
        mod.querySelector('video')?.pause();
      } catch {}
    }
    __vidSelected = null;
    document.querySelector('.guide-right')?.classList.remove('video-mode');
  };
  const __vidToggle = (id, key, invert = false) => {
    document.getElementById(id)?.addEventListener('click', () => {
      if (!__vidSelected) return;
      const cur = __vidSelected.dataset[key] !== 'false';
      const next = !cur;
      __vidSelected.dataset[key] = String(next);
      const pressed = invert ? !next : next;
      document.getElementById(id).setAttribute('aria-pressed', String(pressed));
      __vidSync(__vidSelected);
      window.__praiaAutosave?.();
    });
  };
  __vidToggle('grv-autoplay', 'autoplay');
  __vidToggle('grv-loop', 'loop');
  // Sound icon: pressed = unmuted; data-muted true means sound off
  document.getElementById('grv-sound')?.addEventListener('click', () => {
    if (!__vidSelected) return;
    const curMuted = __vidSelected.dataset.muted !== 'false';
    const nextMuted = !curMuted;
    __vidSelected.dataset.muted = String(nextMuted);
    document.getElementById('grv-sound').setAttribute('aria-pressed', String(!nextMuted));
    __vidSync(__vidSelected);
    window.__praiaAutosave?.();
  });
  document.getElementById('grv-close')?.addEventListener('click', __vidClose);
  // Note: the "Substituir vídeo" button is a <label for="grv-file-input">, so it
  // opens the native picker on its own (no JS .click()). The file is handled by
  // the #grv-file-input change listener (in the video-replace IIFE).
  // Replace by URL/path — works without a native file dialog (e.g. in the
  // embedded preview). A plain URL persists via the autosaved <video src>.
  const __grvUrl = document.getElementById('grv-url');
  const __applyUrl = rawUrl => {
    const mod = __vidSelected || document.querySelector('.guide-page.active .video-mod.canvas-selected') || document.querySelector('.video-mod.canvas-selected');
    const url = ((rawUrl != null ? rawUrl : __grvUrl?.value) || '').trim();
    if (!mod || !url) return;
    const v = mod.querySelector('video');
    if (!v) return;
    delete mod.dataset.vidId; // a URL source isn't an IDB blob
    v.removeAttribute('poster'); // show the new clip, not the old poster
    v.src = url;
    v.muted = mod.dataset.muted !== 'false';
    v.loop = mod.dataset.loop !== 'false';
    try {
      v.load();
    } catch {}
    if (__vidLive()) {
      if (mod.dataset.autoplay !== 'false') __vidPlaySafe(v);
    } else {
      // Editing: play briefly to reveal the new clip's frame, then pause so we
      // don't keep decoding (avoids the multi-video freeze).
      __vidPlaySafe(v);
      setTimeout(() => {
        try {
          if (!__vidLive()) v.pause();
        } catch {}
      }, 500);
    }
    if (__grvUrl) __grvUrl.value = url;
    __vidUpdateOverlay(mod);
    window.__praiaAutosave?.();
  };
  __grvUrl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      __applyUrl();
      __grvUrl.blur();
    }
  });
  __grvUrl?.addEventListener('change', () => __applyUrl());

  // Color spec cards: in PREVIEW, click copies the HEX to the clipboard (paste
  // into Figma). A tiny toast confirms. In edit mode the text stays editable.
  let __cspecToast = null;
  document.addEventListener(
    'click',
    e => {
      if (!document.body.classList.contains('preview-mode')) return;
      const card = e.target.closest('.cspec-card, .ccon-card');
      if (!card) return;
      const hex = card.dataset.hex;
      if (!hex) return;
      e.preventDefault();
      e.stopPropagation();
      const done = () => {
        if (!__cspecToast) {
          __cspecToast = document.createElement('div');
          __cspecToast.style.cssText =
            'position:fixed;z-index:9999;bottom:28px;left:50%;transform:translateX(-50%);background:var(--bs-navy,#061833);color:#fff;font:600 13px/1 var(--font);padding:10px 16px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,0.35);pointer-events:none;opacity:0;transition:opacity .15s';
          document.body.appendChild(__cspecToast);
        }
        __cspecToast.textContent = hex + ' copiado';
        __cspecToast.style.opacity = '1';
        clearTimeout(__cspecToast._t);
        __cspecToast._t = setTimeout(() => {
          __cspecToast.style.opacity = '0';
        }, 1400);
      };
      if (navigator.clipboard?.writeText)
        navigator.clipboard
          .writeText(hex)
          .then(done)
          .catch(() => {
            // Fallback: legacy copy
            const ta = document.createElement('textarea');
            ta.value = hex;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand('copy');
            } catch {}
            ta.remove();
            done();
          });
      else {
        const ta = document.createElement('textarea');
        ta.value = hex;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch {}
        ta.remove();
        done();
      }
    },
    true
  );

  document.addEventListener(
    'click',
    e => {
      if (document.body.classList.contains('preview-mode')) return;
      const mod = e.target.closest('.video-mod');
      if (!mod) return;
      e.preventDefault();
      e.stopPropagation();
      // Play overlay → just play; don't open inspector
      if (e.target.closest('.video-mod-play')) {
        __vidPlaySafe(mod.querySelector('video'));
        __vidUpdateOverlay(mod);
        return;
      }
      __vidOpen(mod);
    },
    true
  );

  // Re-sync any video-mod on load (e.g. after autosave restore)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.video-mod').forEach(__vidSync));
  } else {
    document.querySelectorAll('.video-mod').forEach(__vidSync);
  }
  // Auto-sync videos added later (inserted from picker, restored by undo/redo).
  if ('MutationObserver' in window) {
    new MutationObserver(muts => {
      muts.forEach(m =>
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          if (n.matches?.('.video-mod')) __vidSync(n);
          n.querySelectorAll?.('.video-mod').forEach(__vidSync);
        })
      );
    }).observe(document.body, { childList: true, subtree: true });
    // Entering/leaving preview-mode flips playback: play all in preview, pause
    // (back to poster) when editing. Watch the body class.
    new MutationObserver(() => document.querySelectorAll('.video-mod').forEach(__vidSync)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // Theme palettes (.tp-block) — tabbed multi-theme color picker, each theme stores
  // a multi-select array of palette indices.
  let __tpSelected = null;
  const __tpRead = block => {
    try {
      return JSON.parse(block.dataset.themes);
    } catch {
      return [];
    }
  };
  // Back-compat: turn legacy `selectedIdx` into `selected` array
  const __tpSel = t => (Array.isArray(t.selected) ? t.selected : typeof t.selectedIdx === 'number' ? [t.selectedIdx] : []);
  const __tpWrite = (block, themes) => {
    block.dataset.themes = JSON.stringify(themes);
    window.__praiaAutosave?.();
    // Flush history right away so Cmd+Z immediately after the action works.
    // Defer to a microtask so the MO-driven render completes first.
    queueMicrotask(() => window.__praiaRecordNow?.());
  };
  const __tpRenderBlock = block => {
    const themes = __tpRead(block);
    const activeId = block.dataset.active;
    const t = themes.find(x => x.id === activeId) || themes[0];
    const sel = new Set(activeId ? __tpSel(t) : []);
    // No active theme → no dimming (all swatches at full opacity on canvas).
    block.dataset.hasSel = activeId && sel.size > 0 ? 'true' : 'false';
    const cols = Math.min(17, Math.max(8, Math.ceil(Math.sqrt(t.palette.length * 1.8))));
    block.innerHTML = `
      <div class="tp-tabs">
        ${themes.map(x => `<button type="button" class="tp-tab${x.id === activeId ? ' active' : ''}" data-theme="${x.id}">${x.label}</button>`).join('')}
      </div>
      <div class="tp-canvas">
        <div class="tp-grid" style="--tp-cols:${cols}">
          ${t.palette.map((hex, i) => `<button type="button" class="tp-sw${sel.has(i) ? ' selected' : ''}" data-i="${i}" aria-label="${hex}" style="--tp-bg:${hex}"></button>`).join('')}
        </div>
      </div>`;
  };
  const __tpRenderPanel = () => {
    if (!__tpSelected) return;
    const themes = __tpRead(__tpSelected);
    const activeId = __tpSelected.dataset.active;
    const t = themes.find(x => x.id === activeId) || themes[0];
    const sel = __tpSel(t);
    const selSet = new Set(sel);
    const dots = (palette, idxs) => idxs.map(i => `<span class="tpi-dot tpi-dot-sm" style="--tp-bg:${(palette[i] || '').toUpperCase()}"></span>`).join('');
    const hint = document.getElementById('grtp-active-name');
    if (hint) hint.textContent = `${t.label} · ${sel.length} ${sel.length === 1 ? 'cor' : 'cores'}`;
    const pal = document.getElementById('grtp-palette');
    if (pal) {
      const focusIdx = parseInt(__tpSelected.dataset.palFocus, 10);
      pal.innerHTML = t.palette.map((hex, i) => `<button type="button" class="tpi-pal-sw${i === focusIdx ? ' focused' : ''}" data-i="${i}" aria-label="${hex}" title="${hex}" style="--tp-bg:${hex}"><input type="color" value="${hex}" tabindex="-1" /></button>`).join('');
    }
    const palDel = document.getElementById('grtp-pal-del');
    if (palDel) palDel.disabled = t.palette.length <= 1;
    const list = document.getElementById('grtp-themes');
    if (list) {
      const canDel = themes.length > 1;
      list.innerHTML = themes
        .map(x => {
          const xs = __tpSel(x);
          const xsSet = new Set(xs);
          const isActive = x.id === activeId;
          const themePal = isActive
            ? `<div class="tpi-theme-palette" data-theme="${x.id}">
              ${x.palette.map((hex, i) => `<button type="button" class="tpi-pal-sw${xsSet.has(i) ? ' selected' : ''}" data-i="${i}" aria-label="${hex}" title="${hex}" style="--tp-bg:${hex}"></button>`).join('')}
            </div>`
            : '';
          return `<div class="tpi-theme-wrap${isActive ? ' active' : ''}">
          <div class="tpi-theme${isActive ? ' active' : ''}" data-theme="${x.id}">
            <button type="button" class="tpi-theme-caret" aria-label="${isActive ? 'Recolher' : 'Expandir'}" aria-expanded="${isActive}">
              <span class="bs-icon" style="--bs-icon-size:16px">chevron_right</span>
            </button>
            <span class="tpi-theme-name" contenteditable="true" spellcheck="false">${x.label}</span>
            <button type="button" class="tpi-theme-del" aria-label="Remover tema" ${canDel ? '' : 'disabled'}>
              <span class="bs-icon" style="--bs-icon-size:16px">close</span>
            </button>
          </div>
          ${themePal}
        </div>`;
        })
        .join('');
    }
  };
  // Assign a stable id to each tp-block so we can re-resolve it after undo/redo
  // (applySnapshot destroys & rebuilds the DOM nodes).
  const __tpEnsureId = block => {
    if (!block.dataset.tpId) block.dataset.tpId = 'tp-' + Math.random().toString(36).slice(2, 9);
    return block.dataset.tpId;
  };
  const __tpOpen = block => {
    __tpEnsureId(block);
    __tpSelected = block;
    const right = document.querySelector('.guide-right');
    if (!right) return;
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    window.__praiaCloseRightModes?.();
    right.classList.add('themepal-mode');
    block.classList.add('canvas-selected');
    __tpRenderPanel();
  };
  const __tpClose = () => {
    __tpSelected = null;
    document.querySelector('.guide-right')?.classList.remove('themepal-mode');
  };
  document.getElementById('grtp-close')?.addEventListener('click', __tpClose);
  // After Cmd+Z / Cmd+Shift+Z restores the DOM, the previously selected tp-block
  // is a stale detached node. Re-resolve by id and refresh the inspector.
  const __tpAfterSnapshot = () => {
    if (!__tpSelected) return;
    const id = __tpSelected.dataset.tpId;
    if (!id) {
      __tpClose();
      return;
    }
    const fresh = document.querySelector(`.tp-block[data-tp-id="${id}"]`);
    if (!fresh) {
      __tpClose();
      return;
    }
    __tpSelected = fresh;
    fresh.classList.add('canvas-selected');
    __tpRenderPanel();
  };
  ['__praiaUndo', '__praiaRedo'].forEach(k => {
    const wait = setInterval(() => {
      if (typeof window[k] !== 'function') return;
      clearInterval(wait);
      const orig = window[k];
      window[k] = function (...args) {
        const r = orig.apply(this, args);
        queueMicrotask(__tpAfterSnapshot);
        return r;
      };
    }, 50);
  });
  // All themes in a block share the same palette array (by reference in storage).
  // Mutations need to apply to every theme.palette so they stay in sync.
  const __tpMutatePalette = (themes, fn) => {
    fn(themes[0].palette);
    const pal = themes[0].palette;
    themes.forEach(t => {
      t.palette = pal;
    });
  };
  // Top palette: a single click focuses the swatch (so `−` knows what to remove)
  // AND opens the native hex picker.
  document.getElementById('grtp-palette')?.addEventListener('click', e => {
    const sw = e.target.closest('.tpi-pal-sw');
    if (!sw || !__tpSelected) return;
    if (e.target.matches('input[type="color"]')) return;
    __tpSelected.dataset.palFocus = sw.dataset.i;
    // Reflect focus immediately without a full re-render (preserves the input we're about to click).
    document.querySelectorAll('#grtp-palette .tpi-pal-sw').forEach(x => x.classList.toggle('focused', x === sw));
    const input = sw.querySelector('input[type="color"]');
    if (!input) return;
    input.style.pointerEvents = 'auto';
    input.click();
    setTimeout(() => {
      input.style.pointerEvents = 'none';
    }, 0);
  });
  document.getElementById('grtp-palette')?.addEventListener('input', e => {
    if (!e.target.matches('input[type="color"]') || !__tpSelected) return;
    const sw = e.target.closest('.tpi-pal-sw');
    const i = parseInt(sw.dataset.i, 10) || 0;
    const themes = __tpRead(__tpSelected);
    const hex = e.target.value.toUpperCase();
    __tpMutatePalette(themes, pal => {
      pal[i] = hex;
    });
    __tpWrite(__tpSelected, themes);
    sw.style.setProperty('--tp-bg', hex);
    sw.title = hex;
    sw.setAttribute('aria-label', hex);
    __tpRenderBlock(__tpSelected);
  });
  document.getElementById('grtp-palette')?.addEventListener('change', () => {
    if (__tpSelected) __tpRenderPanel();
  });
  document.getElementById('grtp-pal-add')?.addEventListener('click', () => {
    if (!__tpSelected) return;
    const themes = __tpRead(__tpSelected);
    __tpMutatePalette(themes, pal => {
      pal.push('#3259FF');
    });
    __tpWrite(__tpSelected, themes);
    __tpRenderBlock(__tpSelected);
    __tpRenderPanel();
  });
  document.getElementById('grtp-pal-del')?.addEventListener('click', () => {
    if (!__tpSelected) return;
    const themes = __tpRead(__tpSelected);
    const lastIdx = themes[0].palette.length - 1;
    if (lastIdx < 1) return;
    let removeIdx = parseInt(__tpSelected.dataset.palFocus, 10);
    if (!Number.isFinite(removeIdx) || removeIdx < 0 || removeIdx > lastIdx) removeIdx = lastIdx;
    __tpMutatePalette(themes, pal => {
      pal.splice(removeIdx, 1);
    });
    // Drop the removed index from every theme's selection and shift higher indices down.
    themes.forEach(t => {
      t.selected = (t.selected || []).filter(i => i !== removeIdx).map(i => (i > removeIdx ? i - 1 : i));
    });
    delete __tpSelected.dataset.palFocus;
    __tpWrite(__tpSelected, themes);
    __tpRenderBlock(__tpSelected);
    __tpRenderPanel();
  });
  document.getElementById('grtp-add-theme')?.addEventListener('click', () => {
    if (!__tpSelected) return;
    const themes = __tpRead(__tpSelected);
    const ref = themes[0] || {};
    const taken = new Set(themes.map(t => t.label.toLowerCase()));
    let n = themes.length + 1;
    let label = 'Tema ' + n;
    while (taken.has(label.toLowerCase())) {
      n++;
      label = 'Tema ' + n;
    }
    const id = 't-' + Math.random().toString(36).slice(2, 8);
    themes.push({ id, label, selected: [], palette: ref.palette || [] });
    __tpSelected.dataset.active = id;
    __tpWrite(__tpSelected, themes);
    __tpRenderBlock(__tpSelected);
    __tpRenderPanel();
    // Focus the new name for immediate rename
    const nameEl = document.querySelector(`#grtp-themes .tpi-theme[data-theme="${id}"] .tpi-theme-name`);
    nameEl?.focus();
    if (nameEl) {
      const r = document.createRange();
      r.selectNodeContents(nameEl);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  });
  // Theme name rename + delete row + row switch + per-theme palette toggle
  document.getElementById('grtp-themes')?.addEventListener('click', e => {
    if (!__tpSelected) return;
    // Per-theme palette swatch → toggle selection for THAT theme
    const palSw = e.target.closest('.tpi-theme-palette .tpi-pal-sw');
    if (palSw) {
      e.stopPropagation();
      const themeId = palSw.closest('.tpi-theme-palette').dataset.theme;
      const themes = __tpRead(__tpSelected);
      const t = themes.find(x => x.id === themeId);
      if (!t) return;
      const i = parseInt(palSw.dataset.i, 10) || 0;
      const cur = new Set(__tpSel(t));
      if (cur.has(i)) cur.delete(i);
      else cur.add(i);
      t.selected = [...cur].sort((a, b) => a - b);
      delete t.selectedIdx;
      __tpWrite(__tpSelected, themes);
      __tpRenderBlock(__tpSelected);
      __tpRenderPanel();
      return;
    }
    const del = e.target.closest('.tpi-theme-del');
    if (del && !del.disabled) {
      e.stopPropagation();
      const row = del.closest('.tpi-theme');
      const themes = __tpRead(__tpSelected);
      if (themes.length <= 1) return;
      const idx = themes.findIndex(t => t.id === row.dataset.theme);
      if (idx < 0) return;
      themes.splice(idx, 1);
      if (__tpSelected.dataset.active === row.dataset.theme) {
        __tpSelected.dataset.active = themes[Math.max(0, idx - 1)].id;
      }
      __tpWrite(__tpSelected, themes);
      __tpRenderBlock(__tpSelected);
      __tpRenderPanel();
      return;
    }
    if (e.target.closest('.tpi-theme-name')) return; // let user edit text
    const row = e.target.closest('.tpi-theme');
    if (!row) return;
    const wasActive = __tpSelected.dataset.active === row.dataset.theme;
    // Clicking the active row toggles it closed; otherwise this row becomes active.
    __tpSelected.dataset.active = wasActive ? '' : row.dataset.theme;
    __tpWrite(__tpSelected, __tpRead(__tpSelected));
    __tpRenderBlock(__tpSelected);
    __tpRenderPanel();
  });
  document.getElementById('grtp-themes')?.addEventListener('keydown', e => {
    if (!e.target.classList.contains('tpi-theme-name')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  });
  document.getElementById('grtp-themes')?.addEventListener('paste', e => {
    if (!e.target.classList.contains('tpi-theme-name')) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text.replace(/\s+/g, ' ').trim());
  });
  document.getElementById('grtp-themes')?.addEventListener(
    'blur',
    e => {
      if (!e.target.classList.contains('tpi-theme-name') || !__tpSelected) return;
      const row = e.target.closest('.tpi-theme');
      const themes = __tpRead(__tpSelected);
      const t = themes.find(x => x.id === row.dataset.theme);
      if (!t) return;
      const newLabel = (e.target.textContent || '').trim() || t.label;
      if (newLabel === t.label) return;
      t.label = newLabel;
      __tpWrite(__tpSelected, themes);
      __tpRenderBlock(__tpSelected);
      __tpRenderPanel();
    },
    true
  );
  document.addEventListener(
    'click',
    e => {
      if (document.body.classList.contains('preview-mode')) return;
      const block = e.target.closest('.tp-block');
      if (!block) return;
      const tab = e.target.closest('.tp-tab');
      const sw = e.target.closest('.tp-sw');
      if (tab) {
        e.stopPropagation();
        e.preventDefault();
        block.dataset.active = tab.dataset.theme;
        __tpWrite(block, __tpRead(block));
        __tpRenderBlock(block);
        __tpOpen(block);
        return;
      }
      if (sw) {
        e.stopPropagation();
        e.preventDefault();
        const themes = __tpRead(block);
        const t = themes.find(x => x.id === block.dataset.active) || themes[0];
        const i = parseInt(sw.dataset.i, 10) || 0;
        const cur = new Set(__tpSel(t));
        if (cur.has(i)) cur.delete(i);
        else cur.add(i);
        t.selected = [...cur].sort((a, b) => a - b);
        delete t.selectedIdx;
        __tpWrite(block, themes);
        __tpRenderBlock(block);
        __tpOpen(block);
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      __tpOpen(block);
    },
    true
  );

  // Click on color container → open panel. Cover skips copy (not a color reference);
  // the swatch-style templates copy hex on click for convenience in Figma.
  document.addEventListener(
    'click',
    e => {
      if (document.body.classList.contains('preview-mode')) return;
      const cont = e.target.closest('.cover-block, .cl-hero, .cl-card, .cl-strip');
      if (!cont) return;
      // Let text-mode claim clicks on any DS-typed text or contenteditable region
      if (e.target.closest('.cl-name, .cl-meta, [contenteditable="true"], [class*="tk-"], h1, h2, h3, h4, h5, h6, p, a, input, select, button')) return;
      e.stopPropagation();
      e.preventDefault();
      __clOpenPanel(cont);
      const info = __clInfo(cont);
      if (info && info.kind !== 'cover') {
        const hex = (cont.dataset.color || '').toUpperCase();
        if (hex) {
          __copyToClipboard(hex);
          __showCopyToast('Copiado ' + hex);
        }
      }
    },
    true
  );

  // Track meta edits to preserve them when color changes
  document.addEventListener('input', e => {
    const m = e.target.closest('.cl-hero .cl-meta, .cl-card .cl-meta, .cl-strip .cl-meta');
    if (m) {
      m.dataset.userEdited = 'true';
    }
  });

  // Color pairing tool — single palette, foreground auto-computed for contrast
  const __pairFg = hex => {
    const x = hex.replace('#', '');
    const r = parseInt(x.slice(0, 2), 16),
      g = parseInt(x.slice(2, 4), 16),
      b = parseInt(x.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? '#061833' : '#ffffff';
  };
  document.addEventListener(
    'click',
    e => {
      const sw = e.target.closest('.cl-pair-swatch');
      if (!sw) return;
      e.preventDefault();
      e.stopPropagation();
      const root = sw.closest('.cl-pair');
      if (!root) return;
      const hex = sw.dataset.hex;
      const nm = sw.dataset.name;
      const fg = __pairFg(hex);
      root.querySelectorAll('.cl-pair-swatch').forEach(s => s.classList.toggle('selected', s === sw));
      root.dataset.bg = hex;
      root.dataset.bgName = nm;
      const nameEl = root.querySelector('[data-role="bg-name"]');
      const hexEl = root.querySelector('[data-role="bg-hex"]');
      if (nameEl) nameEl.textContent = nm;
      if (hexEl) hexEl.textContent = hex.toUpperCase();
      const poster = root.querySelector('.cl-pair-poster');
      const cta = root.querySelector('.cl-pair-cta');
      if (poster) {
        poster.style.background = hex;
        poster.style.color = fg;
      }
      if (cta) {
        cta.style.background = fg;
        cta.style.color = hex;
      }
      window.__praiaAutosave?.();
    },
    true
  );

  // Tab switching — replaces the palette based on theme
  document.addEventListener(
    'click',
    e => {
      const tab = e.target.closest('.cl-pair-tab');
      if (!tab) return;
      e.preventDefault();
      e.stopPropagation();
      const root = tab.closest('.cl-pair');
      if (!root) return;
      const tabId = tab.dataset.tab;
      let palettes = {};
      try {
        palettes = JSON.parse(root.dataset.palettes.replace(/&#39;/g, "'"));
      } catch {}
      const palette = palettes[tabId];
      if (!palette) return;
      root.querySelectorAll('.cl-pair-tab').forEach(t => t.classList.toggle('active', t === tab));
      root.dataset.tab = tabId;
      // Rebuild swatches
      const sw = root.querySelector('.cl-pair-swatches');
      const sel = palette.find(p => p.hex.toLowerCase() === (root.dataset.bg || '').toLowerCase()) || palette[Math.min(4, palette.length - 1)];
      const fg = __pairFg(sel.hex);
      sw.innerHTML = palette.map(p => `<button type="button" class="cl-pair-swatch${p.hex === sel.hex ? ' selected' : ''}" data-hex="${p.hex}" data-name="${p.name}" aria-label="${p.name}"><span class="dot" style="background:${p.hex}"></span><span class="label">${p.name}</span></button>`).join('');
      // Update selected info + poster
      root.dataset.bg = sel.hex;
      root.dataset.bgName = sel.name;
      const nm = root.querySelector('[data-role="bg-name"]');
      if (nm) nm.textContent = sel.name;
      const hx = root.querySelector('[data-role="bg-hex"]');
      if (hx) hx.textContent = sel.hex.toUpperCase();
      const poster = root.querySelector('.cl-pair-poster');
      const cta = root.querySelector('.cl-pair-cta');
      if (poster) {
        poster.style.background = sel.hex;
        poster.style.color = fg;
      }
      if (cta) {
        cta.style.background = fg;
        cta.style.color = sel.hex;
      }
      window.__praiaAutosave?.();
    },
    true
  );

  // Copy SVG to clipboard — generates a vector snapshot of the poster for Figma,
  // mirroring the live layout pixel-for-pixel using computed positions.
  const __pairLogoSvg = `<polygon points="858.18 119.48 832.79 221.29 873.43 221.29 893.45 141.04 858.18 119.48"/><polygon points="980.75 109.23 954.92 5.65 886.57 5.65 860.74 109.23 901.39 109.23 920.74 31.67 940.1 109.23 980.75 109.23"/><polygon points="983.3 119.48 948.03 141.04 968.06 221.29 1008.69 221.29 983.3 119.48"/><path d="M120.59,105.92c6.75-6.83,17.69-21.09,17.69-41.82,0-27.81-20.95-56.83-61.16-58.48H0v215.06h80.21c44.06,0,67.83-32.39,67.83-62.86,0-24.36-13.83-42.37-27.46-51.9ZM40.07,125.69h40.55c15.59.21,27.35,14.02,27.35,32.12,0,16.45-11.84,28.93-27.52,29.03h-40.38v-61.16ZM75.84,91.88l-35.77-.02v-52.43h35.24c11.1.2,22.9,8.92,22.9,24.67s-9.47,27.33-22.38,27.77Z"/><polygon points="218.6 5.64 178.53 5.64 178.53 220.67 304.56 220.67 304.56 186.84 218.6 186.84 218.6 5.64"/><path d="M430.74,149.68c0,27.21-13.1,42.82-35.94,42.82s-32.99-15.61-32.99-42.82V5.61h-40.07v143.76c.29,46.78,27.18,77.01,73.07,77.01s75.73-30.23,76.01-77.04V5.61h-40.07v144.07Z"/><path d="M603.86,95.74l-24.13-7.19c-17-4.04-25.61-13.57-25.61-28.32,0-16.5,10.59-26.35,33.26-26.35,24.7,0,33.26,21.87,33.26,36.65v4.42h40.07v-4.42c0-32.54-17.03-70.54-73.33-70.54-44.2,0-73.34,25.41-73.34,60.42s19.85,54.9,58.99,64.25l27.15,7.2c13.38,3.15,26.39,11.2,26.39,31.61,0,6.94-2.62,12.98-7.78,17.96-7.9,7.61-17.76,11.7-32.22,11.15-26.05-.96-39.23-22.97-39.23-42.81v-4.42h-40.28s0,4.41,0,4.41c0,36.23,26.02,75.39,79.7,76.59.81.02,1.63.03,2.44.03,24.64,0,44.37-8.41,59.56-23.27,11.54-11.29,17.9-25.37,17.9-39.65,0-36.04-19.96-57.56-62.79-67.72Z"/><polygon points="835.62 5.61 682.08 5.61 682.08 39.44 738.82 39.44 738.82 220.67 778.89 220.67 778.89 39.44 835.62 39.44 835.62 5.61"/><path d="M1140.67,132.57c26.75-9.49,43.73-32.95,43.73-61.18,0-38.11-30.16-65.77-71.71-65.77h-72.69v215.06h40.07v-83.52h20s47.46,83.52,47.46,83.52h43.22l-50.08-88.11ZM1080.06,39.45h32.59c18.35.12,31.67,13.55,31.67,31.94s-13.23,31.69-31.41,31.94h-32.85v-63.88Z"/>`;

  // Convert text to SVG path using opentype.js so the pasted SVG keeps the exact
  // Versos typography regardless of fonts available in Figma.
  let __opentypePromise = null;
  const __loadOpentype = () => {
    if (window.opentype) return Promise.resolve(window.opentype);
    if (__opentypePromise) return __opentypePromise;
    __opentypePromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/opentype.js@1.3.4/dist/opentype.min.js';
      s.onload = () => res(window.opentype);
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return __opentypePromise;
  };
  const __fontCache = {};
  const __loadFont = async url => {
    if (__fontCache[url]) return __fontCache[url];
    const ot = await __loadOpentype();
    const buf = await (await fetch(url)).arrayBuffer();
    const font = ot.parse(buf);
    __fontCache[url] = font;
    return font;
  };

  const __pairImgCache = {};
  const __pairImgToDataUrl = async (url, maxDim = 1200) => {
    if (__pairImgCache[url]) return __pairImgCache[url];
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        try {
          const data = c.toDataURL('image/jpeg', 0.85);
          __pairImgCache[url] = data;
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const __escapeXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const __pairBuildSvg = async root => {
    const bg = root.dataset.bg || '#0FC4D5';
    const fg = __pairFg(bg);
    const poster = root.querySelector('.cl-pair-poster');
    const titleEl = root.querySelector('.cl-pair-poster-title');
    const ctaEl = root.querySelector('.cl-pair-cta');
    const photoEl = root.querySelector('.cl-pair-poster-photo');
    const logoEl = root.querySelector('.cl-pair-poster-logo');
    if (!poster) return null;
    const pr = poster.getBoundingClientRect();
    const W = 600;
    const scale = W / pr.width;
    const H = Math.round(pr.height * scale);
    const local = el => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - pr.left) * scale, y: (r.top - pr.top) * scale, w: r.width * scale, h: r.height * scale };
    };
    const cs = el => getComputedStyle(el);
    const titleR = local(titleEl);
    const ctaR = local(ctaEl);
    const photoR = local(photoEl);
    const logoR = logoEl ? local(logoEl) : null;
    const titleCs = cs(titleEl);
    const titleSize = parseFloat(titleCs.fontSize) * scale;
    const titleLh = parseFloat(titleCs.lineHeight) * scale || titleSize * 0.98;
    const titleLines = (titleEl.innerHTML || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const ctaCs = cs(ctaEl);
    const ctaSize = parseFloat(ctaCs.fontSize) * scale;
    const ctaText = (ctaEl.textContent || '').trim();
    const ctaRadius = ctaR.h / 2;
    const posterRadius = parseFloat(cs(poster).borderTopLeftRadius) * scale || 20;
    // Convert title + CTA text to glyph paths so the SVG renders pixel-perfect in Figma
    let titlePaths = '';
    let ctaTextPath = '';
    try {
      const [titleFont, ctaFont] = await Promise.all([__loadFont(new URL('fonts/VersosTest-SemiBold.ttf', location.href).href), __loadFont(new URL('fonts/VersosTest-Bold.ttf', location.href).href)]);
      const titleBaseline0 = titleR.y + titleSize * 0.82;
      titlePaths = titleLines
        .map((line, i) => {
          const path = titleFont.getPath(line, titleR.x, titleBaseline0 + i * titleLh, titleSize, { letterSpacing: -0.02 });
          return `<path d="${path.toPathData(2)}" fill="${fg}"/>`;
        })
        .join('');
      const ctaAdvance = ctaFont.getAdvanceWidth(ctaText, ctaSize);
      const ctaTextX = ctaR.x + (ctaR.w - ctaAdvance) / 2;
      const ctaTextBaseline = ctaR.y + ctaR.h / 2 + ctaSize * 0.34;
      const ctaPath = ctaFont.getPath(ctaText, ctaTextX, ctaTextBaseline, ctaSize);
      ctaTextPath = `<path d="${ctaPath.toPathData(2)}" fill="${bg}"/>`;
    } catch (e) {
      // Fallback to <text> if font load fails (CORS, offline, etc.)
      const titleFontFam = titleCs.fontFamily.replace(/"/g, "'");
      const ctaFontFam = ctaCs.fontFamily.replace(/"/g, "'");
      const tspans = titleLines.map((l, i) => `<tspan x="${titleR.x}" dy="${i === 0 ? 0 : titleLh}">${__escapeXml(l)}</tspan>`).join('');
      titlePaths = `<text x="${titleR.x}" y="${titleR.y + titleSize * 0.82}" font-family="${titleFontFam}" font-size="${titleSize}" font-weight="${titleCs.fontWeight}" letter-spacing="${(-0.02 * titleSize).toFixed(2)}" fill="${fg}">${tspans}</text>`;
      ctaTextPath = `<text x="${ctaR.x + ctaR.w / 2}" y="${ctaR.y + ctaR.h / 2 + ctaSize * 0.36}" font-family="${ctaFontFam}" font-size="${ctaSize}" font-weight="500" fill="${bg}" text-anchor="middle">${__escapeXml(ctaText)}</text>`;
    }
    let photoDataUrl = '';
    try {
      photoDataUrl = await __pairImgToDataUrl(new URL('assets/Moto.png', location.href).href, 1200);
    } catch {}
    let logoBlock = '';
    if (logoR) {
      logoBlock = `<g transform="translate(${logoR.x} ${logoR.y})"><svg width="${logoR.w}" height="${logoR.h}" viewBox="0 0 1190.75 226.38" fill="${fg}">${__pairLogoSvg}</svg></g>`;
    }
    const photoTag = photoDataUrl
      ? `<image href="${photoDataUrl}" x="${photoR.x}" y="${photoR.y}" width="${photoR.w}" height="${photoR.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
      : `<rect x="${photoR.x}" y="${photoR.y}" width="${photoR.w}" height="${photoR.h}" rx="10" fill="${fg}" opacity="0.1"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="photoClip"><rect x="${photoR.x}" y="${photoR.y}" width="${photoR.w}" height="${photoR.h}" rx="10"/></clipPath></defs>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${posterRadius}" fill="${bg}"/>
  ${titlePaths}
  <rect x="${ctaR.x}" y="${ctaR.y}" width="${ctaR.w}" height="${ctaR.h}" rx="${ctaRadius}" fill="${fg}"/>
  ${ctaTextPath}
  ${photoTag}
  ${logoBlock}
</svg>`;
  };

  document.addEventListener(
    'click',
    async e => {
      const btn = e.target.closest('.cl-pair-copy[data-role="copy-svg"]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const root = btn.closest('.cl-pair');
      if (!root) return;
      btn.disabled = true;
      const orig = btn.querySelector('span')?.textContent;
      if (orig) btn.querySelector('span').textContent = 'Gerando…';
      try {
        const svg = await __pairBuildSvg(root);
        if (svg) {
          __copyToClipboard(svg);
          __showCopyToast('SVG copiado — cole no Figma');
        }
      } catch (err) {
        __showCopyToast('Falha ao gerar SVG');
      } finally {
        btn.disabled = false;
        if (orig) btn.querySelector('span').textContent = orig;
      }
    },
    true
  );

  // Close color-mode when clicking elsewhere in canvas
  document.addEventListener('click', e => {
    if (!document.querySelector('.guide-right.color-mode')) return;
    if (e.target.closest('.cover-block, .cl-hero, .cl-card, .cl-strip, .gr-color-insp, .guide-right')) return;
    __clClosePanel();
  });

  function buildModule(name) {
    const wrap = document.createElement('div');
    if (name === 'Heading') {
      const linkIcon = '<span class="bs-icon" style="--bs-icon-size:16px">link</span>';
      wrap.innerHTML = `<div class="heading-mod">
        <h2 class="tk-xl" style="margin:0">New heading</h2>
        <button type="button" class="heading-anchor-btn" aria-label="Copiar link da seção" title="Copiar link">${linkIcon}</button>
      </div>`;
      return wrap.firstChild;
    }
    if (name === 'Text') {
      wrap.innerHTML = '<p class="tk-m" style="margin:0;color:var(--text-2);max-width:680px">New text block. Edit me.</p>';
      return wrap.firstChild;
    }
    if (name === 'Text & Image') {
      wrap.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center"><div><h4 class="tk-mb" style="margin:0;color:#fff">Title here</h4><p class="tk-m" style="margin:12px 0 0;color:var(--text-2)">Short description for this module.</p></div><div style="background:var(--surface-2);border-radius:var(--r-md);aspect-ratio:4/3"></div></div>';
      return wrap.firstChild;
    }
    if (name === 'Video full screen 16:9') {
      // Autoplay + muted + loop by default. Playback is driven by an
      // IntersectionObserver (see __vidSync) so it only plays while on screen —
      // this avoids the byte-range thrashing that used to freeze the renderer.
      // Vídeo servido pelo CDN (Cloudinary, q_auto/f_auto = compressão e formato
      // adaptativos). Não usamos mais arquivos locais. Poster = frame gerado pelo
      // próprio Cloudinary (troca .mp4 por .jpg).
      // Performance (preview tipo YouTube): o source é 4K e o f_auto entregava VP9,
      // que decodifica por SOFTWARE em muitas máquinas — com vários vídeos juntos
      // isso trava. Forçamos H.264 (vc_h264,f_mp4 = decode por HARDWARE em qualquer
      // máquina) + cap de resolução (w_1600,c_limit) + preload="none".
      const cdn169 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_1600,c_limit,vc_h264,q_auto,f_mp4/v1780335241/16_09_fjzgdc.mp4';
      const cdn169Poster = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_1280,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg';
      wrap.innerHTML = `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${cdn169}" poster="${cdn169Poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
      return wrap.firstChild;
    }
    if (name === 'Video 4× 9:16') {
      // 4 vídeos 9:16 lado a lado (nosso grid: 4 col = 3 colunas DS cada). Cada um
      // é seu próprio .video-mod, com inspector e controles INDEPENDENTES
      // (autoplay / loop / mute / URL). Servidos pelo CDN (Cloudinary), sem locais.
      // Performance: cada vídeo ocupa ~1/4 da largura, então não precisa de Full HD.
      // Limitamos a ~640px pelo Cloudinary (w_640,c_limit) e preload="none" para
      // não decodificar 4 vídeos ao mesmo tempo antes de tocar.
      const cdn916 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,vc_h264,q_auto,f_mp4/v1780335253/9_16_ukmboo.mp4';
      const cdn916Poster = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_480,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg';
      const one = `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="aspect-ratio:9/16;background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${cdn916}" poster="${cdn916Poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--ds-gap, 16px)">${one.repeat(4)}</div>`;
      return wrap.firstChild;
    }
    if (name === 'Video 16:9 + 9:16') {
      // 16:9 menor à esquerda + 9:16 maior à direita (portrait = mais alto). Duas
      // colunas (6 col DS cada), cada vídeo com legenda pequena (token tk-s) embaixo.
      // Cada vídeo é seu próprio .video-mod (controles independentes), H.264 + cap.
      const v169 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_900,c_limit,vc_h264,q_auto,f_mp4/v1780335241/16_09_fjzgdc.mp4';
      const p169 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg';
      const v916 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,vc_h264,q_auto,f_mp4/v1780335253/9_16_ukmboo.mp4';
      const p916 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_480,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg';
      const vmod = (ar, src, poster) =>
        `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="aspect-ratio:${ar};background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${src}" poster="${poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
      const cap = t => `<div class="tk-s" contenteditable="true" style="margin-top:10px;color:var(--text-2)">${t}</div>`;
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ds-gap, 16px);align-items:start"><div>${vmod('16/9', v169, p169)}${cap('Legenda do vídeo')}</div><div>${vmod('9/16', v916, p916)}${cap('Legenda do vídeo')}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Video editorial 4:3 + 9:16') {
      // Layout editorial assimétrico (nosso grid de 12 col): vídeo landscape 4:3
      // menor nas colunas 1-5, deslocado pra baixo; vídeo 9:16 alto nas colunas
      // 9-12, flush no topo; respiro no meio. Legenda pequena (tk-s, cinza) embaixo
      // de cada um. Cada vídeo é um .video-mod independente, H.264 + cap.
      const v43 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_900,c_limit,vc_h264,q_auto,f_mp4/v1780335241/16_09_fjzgdc.mp4';
      const p43 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg';
      const v916b = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,vc_h264,q_auto,f_mp4/v1780335253/9_16_ukmboo.mp4';
      const p916b = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_480,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg';
      const vmod = (ar, src, poster) =>
        `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="aspect-ratio:${ar};background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${src}" poster="${poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
      const cap = t => `<div class="tk-s" contenteditable="true" style="margin-top:12px;color:var(--text-3)">${t}</div>`;
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:var(--ds-gap, 16px);align-items:start"><div style="grid-column:1 / 6;margin-top:7%">${vmod('4/3', v43, p43)}${cap('Domains')}</div><div style="grid-column:9 / 13">${vmod('9/16', v916b, p916b)}${cap('Conversion Campaign, Social')}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Video editorial 9:16 + 16:9') {
      // Layout editorial espelhado (grid de 12 col): vídeo 9:16 alto nas colunas
      // 1-5, flush no topo (esquerda); vídeo 16:9 menor nas colunas 7-12,
      // deslocado pra baixo (direita). Legenda pequena (tk-s, cinza) embaixo de
      // cada um. Cada vídeo é um .video-mod independente, H.264 + cap.
      const v916c = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,vc_h264,q_auto,f_mp4/v1780335253/9_16_ukmboo.mp4';
      const p916c = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_480,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg';
      const v169c = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_900,c_limit,vc_h264,q_auto,f_mp4/v1780335241/16_09_fjzgdc.mp4';
      const p169c = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg';
      const vmod = (ar, src, poster) =>
        `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="aspect-ratio:${ar};background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${src}" poster="${poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
      const cap = t => `<div class="tk-s" contenteditable="true" style="margin-top:12px;color:var(--text-3)">${t}</div>`;
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:var(--ds-gap, 16px);align-items:start"><div style="grid-column:1 / 6">${vmod('9/16', v916c, p916c)}${cap('Design Trends, Social')}</div><div style="grid-column:7 / 13;margin-top:10%">${vmod('16/9', v169c, p169c)}${cap('Design Trends, Social')}</div></div>`;
      return wrap.firstChild;
    }
    // Shared markup helpers for the editorial video duos below.
    const __vmodHtml = (ar, src, poster) =>
      `<div class="video-mod" data-ds-item-kind="video" data-autoplay="true" data-loop="true" data-muted="true" style="aspect-ratio:${ar};background:#000;border-radius:var(--r-md);overflow:hidden"><video src="${src}" poster="${poster}" loop muted playsinline preload="none" style="width:100%;height:100%;object-fit:cover;display:block"></video><button class="video-mod-play" type="button" aria-label="Play"><span class="bs-icon" data-fill="1" style="--bs-icon-size:22px">play_arrow</span></button></div>`;
    const __V169 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_900,c_limit,vc_h264,q_auto,f_mp4/v1780335241/16_09_fjzgdc.mp4';
    const __P169 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,q_auto,f_auto/v1780335241/16_09_fjzgdc.jpg';
    const __V916 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_640,c_limit,vc_h264,q_auto,f_mp4/v1780335253/9_16_ukmboo.mp4';
    const __P916 = 'https://res.cloudinary.com/dq0tnoaye/video/upload/w_480,c_limit,q_auto,f_auto/v1780335253/9_16_ukmboo.jpg';
    const __capS = t => `<div class="tk-s" contenteditable="true" style="margin-top:12px;color:var(--text-3)">${t}</div>`;
    const __capM = t => `<div class="tk-m" contenteditable="true" style="margin-top:16px;color:var(--text-2);max-width:92%">${t}</div>`;
    if (name === 'Video duo 16:9 (diagonal)') {
      // Diagonal (grid 12 col): dois 16:9 do MESMO tamanho (5 col cada), um pouco
      // menores, com bastante respiro no meio (col 6-7). Direita deslocada pra
      // baixo. Legendas pequenas (tk-s). H.264 + cap.
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:var(--ds-gap, 16px);align-items:start"><div style="grid-column:1 / 6">${__vmodHtml('16/9', __V169, __P169)}${__capS('Product Updates')}</div><div style="grid-column:8 / 13;margin-top:18%">${__vmodHtml('16/9', __V169, __P169)}${__capS('Fluid Engine')}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Video 9:16 + 16:9 (alto)') {
      // Esquerda 9:16 alto, flush no topo (1-5); direita 16:9 grande na área
      // superior, leve deslocamento (7-13). Legendas pequenas (tk-s). H.264 + cap.
      wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:var(--ds-gap, 16px);align-items:start"><div style="grid-column:1 / 6">${__vmodHtml('9/16', __V916, __P916)}${__capS('Ideas Are Weird, Social')}</div><div style="grid-column:7 / 13;margin-top:5%">${__vmodHtml('16/9', __V169, __P169)}${__capS('Product Updates, Social')}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Colors') {
      wrap.innerHTML = `<div class="color-grid">
        <div class="swatch"><div class="swatch-chip" style="background:var(--bs-navy)"></div><div class="swatch-info"><div class="swatch-name">BluStar Navy</div><div class="swatch-hex">#061833</div></div></div>
        <div class="swatch"><div class="swatch-chip" style="background:var(--bs-cyan)"></div><div class="swatch-info"><div class="swatch-name">BluStar Cyan</div><div class="swatch-hex">#0FC4D5</div></div></div>
        <div class="swatch"><div class="swatch-chip" style="background:var(--bs-blue)"></div><div class="swatch-info"><div class="swatch-name">Royal Blue</div><div class="swatch-hex">#3259FF</div></div></div>
        <div class="swatch"><div class="swatch-chip" style="background:var(--bs-white)"></div><div class="swatch-info"><div class="swatch-name">White</div><div class="swatch-hex">#FFFFFF</div></div></div>
      </div>`;
      return wrap.firstChild;
    }
    if (name === 'Color specs') {
      // Spec cards (name + HEX/RGB/CMYK/PMS). In preview, clicking a card copies
      // its HEX to the clipboard (paste straight into Figma). 3 columns: one big
      // featured swatch + two stacked columns of cards.
      const SPEC = [
        { col: 1, name: 'Azul Turquesa', bg: '#0FC4D5', ink: '#061833', hex: '#0FC4D5', rgb: 'R15 G196 B213', cmyk: 'C73 M0 Y10 K0', pms: 'PMS 320 C', flex: 1 },
        { col: 2, name: 'BluStar Navy', bg: '#061833', ink: '#FFFFFF', hex: '#061833', rgb: 'R6 G24 B51', cmyk: 'C100 M85 Y45 K55', pms: 'PMS 5395 C', flex: 2 },
        { col: 2, name: 'Royal Blue', bg: '#3259FF', ink: '#FFFFFF', hex: '#3259FF', rgb: 'R50 G89 B255', cmyk: 'C80 M65 Y0 K0', pms: 'PMS 2727 C', flex: 1.5 },
        { col: 2, name: 'Branco', bg: '#FFFFFF', ink: '#061833', hex: '#FFFFFF', rgb: 'R255 G255 B255', cmyk: 'C0 M0 Y0 K0', pms: '—', flex: 1.5, light: true },
        { col: 3, name: 'Preto', bg: '#000000', ink: '#FFFFFF', hex: '#000000', rgb: 'R0 G0 B0', cmyk: 'C0 M0 Y0 K100', pms: 'Black 6 C', flex: 1 },
        { col: 3, name: 'Navy Deep', bg: '#04001E', ink: '#FFFFFF', hex: '#04001E', rgb: 'R4 G0 B30', cmyk: 'C100 M100 Y40 K65', pms: 'PMS 2766 C', flex: 1 },
        { col: 3, name: 'Royal Blue', bg: '#3259FF', ink: '#FFFFFF', hex: '#3259FF', rgb: 'R50 G89 B255', cmyk: 'C80 M65 Y0 K0', pms: 'PMS 2727 C', flex: 1.5 },
        { col: 3, name: 'Cyan 200', bg: '#A6D9DE', ink: '#061833', hex: '#A6D9DE', rgb: 'R166 G217 B222', cmyk: 'C32 M2 Y12 K0', pms: 'PMS 5523 C', flex: 1 },
        { col: 3, name: 'Cyan 100', bg: '#BFFAFF', ink: '#061833', hex: '#BFFAFF', rgb: 'R191 G250 B255', cmyk: 'C22 M0 Y3 K0', pms: '—', flex: 1 },
        { col: 3, name: 'Cyan 50', bg: '#DFFCFF', ink: '#061833', hex: '#DFFCFF', rgb: 'R223 G252 B255', cmyk: 'C10 M0 Y1 K0', pms: '—', flex: 1 },
      ];
      // Rendered on a fixed 1920×1080 (16:9) canvas and scaled to fit the column
      // width (praia mirror) — so it matches the reference exactly at any size:
      // every card shows its full name + HEX/RGB/CMYK/PMS, white page background,
      // equal card heights (col1 = one tall card, col2 = 3, col3 = 6). Text uses
      // DS tokens (Body name, Body Small meta), name top-left + meta below it.
      const card =
        c => `<div class="cspec-card" data-hex="${c.hex}" title="Clique para copiar o HEX (preview)" style="background:${c.bg};color:${c.ink};border-radius:16px;padding:14px 20px;cursor:pointer;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;overflow:hidden;${c.light ? 'border:2px solid #D9D9D9;' : ''}">
            <div class="tk-m" style="margin:0;color:inherit;line-height:1.2;white-space:nowrap">${c.name}</div>
            <div class="tk-m" style="margin:0;color:inherit;line-height:1.25;white-space:pre-line">HEX ${c.hex}
${c.rgb}
${c.cmyk}
${c.pms}</div>
          </div>`;
      const c1 = SPEC.filter(c => c.col === 1);
      const c2 = SPEC.filter(c => c.col === 2);
      const c3 = SPEC.filter(c => c.col === 3);
      const colWrap = cards => `<div style="flex:1;display:flex;flex-direction:column;gap:16px;min-height:0">${cards.map(card).join('')}</div>`;
      const inner = `<div style="width:1920px;height:1080px;box-sizing:border-box;background:#fff;padding:24px;display:flex;gap:16px;align-items:stretch">${colWrap(c1)}${colWrap(c2)}${colWrap(c3)}</div>`;
      wrap.innerHTML = `<div class="praia-frame" style="aspect-ratio:1920/1080;width:100%;background:#fff;border-radius:var(--r-md);overflow:hidden"><div class="praia-mirror" data-edit-w="1920" data-edit-h="1080" style="width:1920px;height:1080px">${inner}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Color contrast') {
      // Contrast matrix: each column is a background color, each row a text (Aa)
      // color — every cell pairs "{fg} no {bg}". Rendered on a fixed 1920×1080
      // canvas and scaled to fit (praia mirror). In preview, clicking a cell
      // copies that cell's background HEX (paste straight into Figma).
      const BGS = [
        { n: 'branco', hex: '#FFFFFF', light: true },
        { n: 'cyan 50', hex: '#DFFCFF', light: true },
        { n: 'cyan 100', hex: '#BFFAFF', light: true },
        { n: 'cyan 200', hex: '#A6D9DE', light: true },
        { n: 'turquesa', hex: '#0FC4D5' },
        { n: 'royal 300', hex: '#4D8BFE' },
        { n: 'royal', hex: '#3259FF' },
        { n: 'navy', hex: '#061833' },
        { n: 'navy deep', hex: '#04001E' },
        { n: 'preto', hex: '#000000' },
      ];
      // Foregrounds mirror the full background palette so every brand color is
      // paired against every other (10×10 matrix), matching the reference sheet.
      const FGS = BGS.map(c => ({ n: c.n, hex: c.hex }));
      // Square cells: derive canvas height from the column cell width so rows and
      // columns stay proportional regardless of how many foregrounds exist.
      const PAD = 24,
        GAP = 16,
        CW = (1920 - PAD * 2 - GAP * (BGS.length - 1)) / BGS.length;
      const H = Math.round(PAD * 2 + GAP * (FGS.length - 1) + CW * FGS.length);
      const cell = (
        fg,
        bg
      ) => `<div class="ccon-card" data-hex="${bg.hex}" title="Clique para copiar o HEX (preview)" style="background:${bg.hex};border-radius:12px;padding:18px;cursor:pointer;min-height:0;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;${bg.light ? 'box-shadow:inset 0 0 0 1px #D9D9D9;' : ''}">
            <div class="tk-xl" style="margin:0;color:${fg.hex}">Aa</div>
            <div class="tk-m" style="margin:0;color:${fg.hex};white-space:pre-line">${fg.n}\nno ${bg.n}</div>
          </div>`;
      const rows = FGS.map(fg => `<div style="display:grid;grid-template-columns:repeat(${BGS.length},1fr);gap:${GAP}px">${BGS.map(bg => cell(fg, bg)).join('')}</div>`).join('');
      const inner = `<div style="width:1920px;height:${H}px;box-sizing:border-box;background:#fff;padding:${PAD}px;display:grid;grid-template-rows:repeat(${FGS.length},1fr);gap:${GAP}px">${rows}</div>`;
      wrap.innerHTML = `<div class="praia-frame" style="aspect-ratio:1920/${H};width:100%;background:#fff;border-radius:var(--r-md);overflow:hidden"><div class="praia-mirror" data-edit-w="1920" data-edit-h="${H}" style="width:1920px;height:${H}px">${inner}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Color accents') {
      // Extended/accent palette: two columns of wide color bars, each with its
      // name + HEX/RGB/CMYK/PMS. Rendered on a fixed 1920×1080 canvas, scaled to
      // fit (praia mirror). In preview, clicking a bar copies its HEX (reuses the
      // .cspec-card click-to-copy handler).
      const hx = h => h.replace('#', '');
      const rgbOf = h => {
        const n = parseInt(hx(h), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const inkOf = h => {
        const [r, g, b] = rgbOf(h);
        const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return L > 0.6 ? '#061833' : '#FFFFFF';
      };
      const COLORS = [
        { col: 1, name: 'Midnight', hex: '#0A1726', pms: 'PMS 5395 C' },
        { col: 1, name: 'Gray', hex: '#A6A6A6', pms: 'Cool Gray 7 C' },
        { col: 1, name: 'Green', hex: '#7CE56F', pms: 'PMS 7488 C' },
        { col: 1, name: 'Sand', hex: '#F5DB87', pms: 'PMS 7401 C' },
        { col: 1, name: 'Peach', hex: '#F5B888', pms: 'PMS 1565 C' },
        { col: 1, name: 'Salmon', hex: '#F58C82', pms: 'PMS 7416 C' },
        { col: 2, name: 'Slate', hex: '#1C2430', pms: 'PMS 432 C' },
        { col: 2, name: 'Orange', hex: '#ED5A1F', pms: 'PMS 1655 C' },
        { col: 2, name: 'Forest', hex: '#1E3A1B', pms: 'PMS 5535 C' },
        { col: 2, name: 'Olive', hex: '#6E6E12', pms: 'PMS 384 C' },
        { col: 2, name: 'Rust', hex: '#7A3A12', pms: 'PMS 1545 C' },
        { col: 2, name: 'Maroon', hex: '#4A1410', pms: 'PMS 490 C' },
      ];
      const bar = c => {
        const ink = inkOf(c.hex);
        const [r, g, b] = rgbOf(c.hex);
        return `<div class="cspec-card" data-hex="${c.hex}" title="Clique para copiar o HEX (preview)" style="background:${c.hex};color:${ink};border-radius:16px;padding:20px 28px;cursor:pointer;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;gap:10px;overflow:hidden">
            <div class="tk-m" style="margin:0;color:inherit;line-height:1.2;white-space:nowrap">${c.name}</div>
            <div class="tk-m" style="margin:0;color:inherit;line-height:1.3;white-space:pre-line">HEX ${c.hex}
R${r} G${g} B${b}
${c.pms}</div>
          </div>`;
      };
      const col = n =>
        `<div style="flex:1;display:flex;flex-direction:column;gap:20px;min-height:0">${COLORS.filter(c => c.col === n)
          .map(bar)
          .join('')}</div>`;
      const inner = `<div style="width:1920px;height:1080px;box-sizing:border-box;background:#fff;padding:24px;display:flex;gap:20px;align-items:stretch">${col(1)}${col(2)}</div>`;
      wrap.innerHTML = `<div class="praia-frame" style="aspect-ratio:1920/1080;width:100%;background:#fff;border-radius:var(--r-md);overflow:hidden"><div class="praia-mirror" data-edit-w="1920" data-edit-h="1080" style="width:1920px;height:1080px">${inner}</div></div>`;
      return wrap.firstChild;
    }
    if (name === 'Paleta de cores') {
      // Fixed Blustar palette: 8 primárias + 9 neutros + 6 terciárias = 23 cores
      const FIXED_PALETTE = ['#000000', '#04001E', '#0A1F3B', '#3259FF', '#0FC4D5', '#A6D9DE', '#BFFAFF', '#DFFCFF', '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#0A1018', '#1B8FA8', '#235789', '#0A1F3B', '#F5B888', '#ED5A1F', '#7CE56F'];
      const themes = [
        { id: 'illustration', label: 'Illustration', selected: [4, 5, 6, 17, 20, 22], palette: FIXED_PALETTE },
        { id: 'marketing', label: 'Marketing', selected: [3, 4, 8, 21], palette: FIXED_PALETTE },
        { id: 'product', label: 'Product', selected: [2, 3, 8, 10, 16], palette: FIXED_PALETTE },
        { id: 'brand', label: 'Brand', selected: [1, 2, 3, 4], palette: FIXED_PALETTE },
      ];
      const activeId = 'illustration';
      const render = (themes, activeId) => {
        const t = themes.find(x => x.id === activeId);
        const sel = new Set(t.selected || []);
        const cols = Math.min(17, Math.max(8, Math.ceil(Math.sqrt(t.palette.length * 1.8))));
        return `
          <div class="tp-tabs">
            ${themes.map(x => `<button type="button" class="tp-tab${x.id === activeId ? ' active' : ''}" data-theme="${x.id}">${x.label}</button>`).join('')}
          </div>
          <div class="tp-canvas">
            <div class="tp-grid" style="--tp-cols:${cols}">
              ${t.palette.map((hex, i) => `<button type="button" class="tp-sw${sel.has(i) ? ' selected' : ''}" data-i="${i}" aria-label="${hex}" style="--tp-bg:${hex}"></button>`).join('')}
            </div>
          </div>`;
      };
      const initSel = (themes.find(x => x.id === activeId).selected || []).length > 0;
      wrap.innerHTML = `<div class="tp-block" data-active="${activeId}" data-has-sel="${initSel}" data-themes='${JSON.stringify(themes).replace(/'/g, '&#39;')}'>${render(themes, activeId)}</div>`;
      return wrap.firstChild;
    }
    if (name === 'Color pairing') {
      const palettes = {
        brand: [
          { name: 'Azul Asfalto', hex: '#061833' },
          { name: 'Azul Noturno', hex: '#04001E' },
          { name: 'Azul Profundo', hex: '#0A1F3B' },
          { name: 'Azul Céu', hex: '#3259FF' },
          { name: 'Azul Turquesa', hex: '#0FC4D5' },
          { name: 'Azul Horizonte', hex: '#A6D9DE' },
          { name: 'Azul Aberto', hex: '#BFFAFF' },
          { name: 'Azul Nuvem', hex: '#DFFCFF' },
        ],
        marketing: [
          { name: 'Royal Blue', hex: '#3259FF' },
          { name: 'Cyan', hex: '#0FC4D5' },
          { name: 'Sun', hex: '#F59F3A' },
          { name: 'Coral', hex: '#E63946' },
          { name: 'Mint', hex: '#7CB342' },
          { name: 'Yellow', hex: '#FFD166' },
          { name: 'Magenta', hex: '#D946EF' },
          { name: 'Cloud', hex: '#BFFAFF' },
        ],
        app: [
          { name: 'Navy', hex: '#061833' },
          { name: 'Navy Deep', hex: '#04001E' },
          { name: 'Surface', hex: '#0B1F3F' },
          { name: 'Mid', hex: '#1F3A66' },
          { name: 'Cyan', hex: '#0FC4D5' },
          { name: 'Cyan 100', hex: '#BFFAFF' },
          { name: 'Gray 300', hex: '#9CA3AF' },
          { name: 'Gray 100', hex: '#E5E7EB' },
        ],
        ilustracao: [
          { name: 'Cyan', hex: '#0FC4D5' },
          { name: 'Royal', hex: '#3259FF' },
          { name: 'Sun', hex: '#F59F3A' },
          { name: 'Coral', hex: '#E63946' },
          { name: 'Pink', hex: '#FF6B9D' },
          { name: 'Purple', hex: '#9D4EDD' },
          { name: 'Mint', hex: '#06A77D' },
          { name: 'Sand', hex: '#FFD166' },
        ],
      };
      const tabs = [
        { id: 'brand', label: 'Brand' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'app', label: 'APP' },
        { id: 'ilustracao', label: 'Ilustração' },
      ];
      const inkFor = hex => {
        const x = hex.replace('#', '');
        const r = parseInt(x.slice(0, 2), 16),
          g = parseInt(x.slice(2, 4), 16),
          b = parseInt(x.slice(4, 6), 16);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? '#061833' : '#ffffff';
      };
      const swatch = (p, sel) => `<button type="button" class="cl-pair-swatch${sel ? ' selected' : ''}" data-hex="${p.hex}" data-name="${p.name}" aria-label="${p.name}"><span class="dot" style="background:${p.hex}"></span><span class="label">${p.name}</span></button>`;
      const activeTab = 'brand';
      const palette = palettes[activeTab];
      const sel = palette[4]; // Turquesa
      const fg = inkFor(sel.hex);
      const logoSvg = `<svg class="cl-pair-poster-logo" viewBox="0 0 1190.75 226.38" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="BluStar"><polygon points="858.18 119.48 832.79 221.29 873.43 221.29 893.45 141.04 858.18 119.48"/><polygon points="980.75 109.23 954.92 5.65 886.57 5.65 860.74 109.23 901.39 109.23 920.74 31.67 940.1 109.23 980.75 109.23"/><polygon points="983.3 119.48 948.03 141.04 968.06 221.29 1008.69 221.29 983.3 119.48"/><path d="M120.59,105.92c6.75-6.83,17.69-21.09,17.69-41.82,0-27.81-20.95-56.83-61.16-58.48H0v215.06h80.21c44.06,0,67.83-32.39,67.83-62.86,0-24.36-13.83-42.37-27.46-51.9ZM40.07,125.69h40.55c15.59.21,27.35,14.02,27.35,32.12,0,16.45-11.84,28.93-27.52,29.03h-40.38v-61.16ZM75.84,91.88l-35.77-.02v-52.43h35.24c11.1.2,22.9,8.92,22.9,24.67s-9.47,27.33-22.38,27.77Z"/><polygon points="218.6 5.64 178.53 5.64 178.53 220.67 304.56 220.67 304.56 186.84 218.6 186.84 218.6 5.64"/><path d="M430.74,149.68c0,27.21-13.1,42.82-35.94,42.82s-32.99-15.61-32.99-42.82V5.61h-40.07v143.76c.29,46.78,27.18,77.01,73.07,77.01s75.73-30.23,76.01-77.04V5.61h-40.07v144.07Z"/><path d="M603.86,95.74l-24.13-7.19c-17-4.04-25.61-13.57-25.61-28.32,0-16.5,10.59-26.35,33.26-26.35,24.7,0,33.26,21.87,33.26,36.65v4.42h40.07v-4.42c0-32.54-17.03-70.54-73.33-70.54-44.2,0-73.34,25.41-73.34,60.42s19.85,54.9,58.99,64.25l27.15,7.2c13.38,3.15,26.39,11.2,26.39,31.61,0,6.94-2.62,12.98-7.78,17.96-7.9,7.61-17.76,11.7-32.22,11.15-26.05-.96-39.23-22.97-39.23-42.81v-4.42h-40.28s0,4.41,0,4.41c0,36.23,26.02,75.39,79.7,76.59.81.02,1.63.03,2.44.03,24.64,0,44.37-8.41,59.56-23.27,11.54-11.29,17.9-25.37,17.9-39.65,0-36.04-19.96-57.56-62.79-67.72Z"/><polygon points="835.62 5.61 682.08 5.61 682.08 39.44 738.82 39.44 738.82 220.67 778.89 220.67 778.89 39.44 835.62 39.44 835.62 5.61"/><path d="M1140.67,132.57c26.75-9.49,43.73-32.95,43.73-61.18,0-38.11-30.16-65.77-71.71-65.77h-72.69v215.06h40.07v-83.52h20s47.46,83.52,47.46,83.52h43.22l-50.08-88.11ZM1080.06,39.45h32.59c18.35.12,31.67,13.55,31.67,31.94s-13.23,31.69-31.41,31.94h-32.85v-63.88Z"/></svg>`;
      wrap.innerHTML = `<div class="cl-pair" data-bg="${sel.hex}" data-bg-name="${sel.name}" data-tab="${activeTab}" data-palettes='${JSON.stringify(palettes).replace(/'/g, '&#39;')}'>
        <div class="cl-pair-tabs">
          ${tabs.map(t => `<button type="button" class="cl-pair-tab${t.id === activeTab ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div class="cl-pair-body">
          <div class="cl-pair-left">
            <div class="cl-pair-swatches">
              ${palette.map(p => swatch(p, p.hex === sel.hex)).join('')}
            </div>
            <div class="cl-pair-active">
              <div>
                <div class="name" data-role="bg-name">${sel.name}</div>
                <div class="hex" data-role="bg-hex">${sel.hex.toUpperCase()}</div>
              </div>
              <button type="button" class="cl-pair-copy" data-role="copy-svg" aria-label="Copiar SVG para o Figma">
                <span class="bs-icon" style="--bs-icon-size:16px">content_copy</span>
                <span>Copy SVG</span>
              </button>
            </div>
          </div>
          <div class="cl-pair-poster" style="background:${sel.hex};color:${fg}">
            <h2 class="cl-pair-poster-title" contenteditable="true">Você roda.<br/>A Yamaha<br/>cuida.</h2>
            <span class="cl-pair-cta" style="background:${fg};color:${sel.hex}" contenteditable="true">Assine agora</span>
            <div class="cl-pair-poster-photo"></div>
            <div class="cl-pair-poster-foot">${logoSvg}</div>
          </div>
        </div>
      </div>`;
      return wrap.firstChild;
    }
    if (name === 'Color card' || name === 'Color cards' || name === 'Color palette') {
      const hexToRgb = h => {
        const x = h.replace('#', '');
        return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
      };
      const rgbToCmyk = (r, g, b) => {
        const R = r / 255,
          G = g / 255,
          B = b / 255;
        const k = 1 - Math.max(R, G, B);
        if (k === 1) return [0, 0, 0, 100];
        const c = (1 - R - k) / (1 - k),
          m = (1 - G - k) / (1 - k),
          y = (1 - B - k) / (1 - k);
        return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
      };
      const luma = h => {
        const [r, g, b] = hexToRgb(h);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      };
      const ink = h => (luma(h) > 0.55 ? '#061833' : '#ffffff');
      const meta = hex => {
        const [r, g, b] = hexToRgb(hex);
        const [c, m, y, k] = rgbToCmyk(r, g, b);
        return `<div class="meta-hex">HEX ${hex.toUpperCase()}</div><div class="meta-rgb">R${r} G${g} B${b}</div><div class="meta-cmyk">C${c} M${m} Y${y} K${k}</div><div class="meta-pms">PMS 4280 C</div>`;
      };

      if (name === 'Color card') {
        const hex = '#0FC4D5';
        wrap.innerHTML = `<div class="cl-hero" data-color="${hex}" style="background:${hex};color:${ink(hex)}">
          <div class="cl-name" contenteditable="true">Azul\nTurquesa</div>
          <div class="cl-meta">${meta(hex)}</div>
        </div>`;
        return wrap.firstChild;
      }

      if (name === 'Color cards') {
        const cards = [
          { hex: '#061833', name: 'Azul\nAsfalto' },
          { hex: '#04001E', name: 'Azul\nNoturno' },
          { hex: '#061833', name: 'Azul\nProfundo' },
        ];
        const cardHtml = c => `<div class="cl-card" data-color="${c.hex}" style="background:${c.hex};color:${ink(c.hex)}">
          <div class="cl-name" contenteditable="true">${c.name}</div>
          <div class="cl-meta">${meta(c.hex)}</div>
        </div>`;
        wrap.innerHTML = `<div class="cl-cards" style="--cl-cols:${cards.length}">${cards.map(cardHtml).join('')}</div>`;
        return wrap.firstChild;
      }

      // Color palette
      const colors = ['#0FC4D5', '#235789', '#0a1f3b', '#f5b888', '#ed5a1f', '#a23a1a', '#7CE56F'];
      const stripHtml = (hex, label) => `<div class="cl-strip" data-color="${hex}" style="background:${hex};color:${ink(hex)}">
        <div class="cl-name" contenteditable="true">${label}</div>
        <div class="cl-meta">${meta(hex)}</div>
      </div>`;
      wrap.innerHTML = `<div class="cl-palette" style="--cl-cols:${colors.length}">${colors.map(c => stripHtml(c, 'Gray\n15')).join('')}</div>`;
      return wrap.firstChild;
    }
    if (name === 'Empty grid') {
      wrap.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div class="card" style="aspect-ratio:4/3"></div><div class="card" style="aspect-ratio:4/3"></div></div>';
      return wrap.firstChild;
    }
    if (name === 'Text cards') {
      wrap.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div class="card"><div class="tile-title">Card title</div><div class="tile-desc" style="margin-top:8px">Short description.</div></div><div class="card"><div class="tile-title">Card title</div><div class="tile-desc" style="margin-top:8px">Short description.</div></div></div>';
      return wrap.firstChild;
    }
    if (name === 'Resources') {
      const lock = '<span class="bs-icon" style="--bs-icon-size:12px;vertical-align:-2px;margin-left:6px;opacity:0.7">lock</span>';
      const chev = '<span class="bs-icon" style="--bs-icon-size:16px">chevron_right</span>';
      const dl = '<span class="bs-icon" style="--bs-icon-size:16px">download</span>';
      const ext = '<span class="bs-icon" style="--bs-icon-size:16px">open_in_new</span>';
      const item = (icon, title, locked, desc, action) => `<a href="#" class="resource-row"><div class="resource-thumb">${icon}</div><div class="resource-body"><div class="resource-title">${title}${locked ? lock : ''}</div><div class="resource-desc">${desc}</div></div><div class="resource-action">${action}</div></a>`;
      wrap.innerHTML = `<section class="resources-block"><h2 class="resources-title">Resources</h2><div class="resources-grid">
        ${item('<div style="width:100%;height:100%;background:#f59f3a;display:grid;place-items:center;color:#fff;font:700 18px/1 var(--font)">▣</div>', 'Composition', false, 'Learn how to build layouts across product and marketing applications.', chev)}
        ${item('<div style="width:100%;height:100%;background:#0a1018;display:grid;place-items:center;color:#fff;font:800 16px/1 var(--font)">ebay</div>', 'Logo package', true, 'Download our official logo asset pack.', dl)}
        ${item('<div style="width:100%;height:100%;background:#fff;display:grid;place-items:center;color:#0a1018;font:800 16px/1 var(--font)">▦</div>', 'Favicon', true, 'Download our favicon assets.', ext)}
      </div></section>`;
      return wrap.firstChild;
    }
    if (name === 'Prev / Next') {
      const arrowL = '<span class="bs-icon" style="--bs-icon-size:20px">arrow_back</span>';
      const arrowR = '<span class="bs-icon" style="--bs-icon-size:20px">arrow_forward</span>';
      wrap.innerHTML = `<nav class="prevnext"><a href="#" class="prevnext-card prev"><span class="prevnext-arrow">${arrowL}</span><span class="prevnext-text"><span class="prevnext-eyebrow">Previous</span><span class="prevnext-title">Foundations: Overview</span></span></a><a href="#" class="prevnext-card next"><span class="prevnext-text"><span class="prevnext-eyebrow">Next</span><span class="prevnext-title">Using our logo</span></span><span class="prevnext-arrow">${arrowR}</span></a></nav>`;
      return wrap.firstChild;
    }
    if (name === 'Spacing') {
      wrap.innerHTML = `<div class="spacer-block" data-size="40" style="height:40px;display:flex;align-items:center;justify-content:center;position:relative"><span class="spacer-label tk-s" style="position:relative;z-index: var(--z-base);background:var(--surface);color:var(--text-2);border:1px solid var(--border);border-radius:6px;padding:3px 10px">40px</span></div>`;
      return wrap.firstChild;
    }
    if (name === 'Divider') {
      wrap.innerHTML = '<div style="height:1px;background:var(--border-strong);margin:0;width:100%"></div>';
      return wrap.firstChild;
    }
    if (name === 'On this page') {
      const arrow = '<span class="bs-icon" style="--bs-icon-size:22px">arrow_forward</span>';
      const links = ['Our color palettes', 'Color with our logo', 'Color pairing tool', 'Color with typography', 'Our color strategy', 'Color with illustration', 'Color with images', 'Neutral backgrounds', 'Color with program badges', 'Resources'];
      const item = t => `<a href="#" class="otp-link"><span>${t}</span>${arrow}</a>`;
      wrap.innerHTML = `<section class="otp-block"><h2 class="otp-title">On this page</h2><div class="otp-grid">${links.map(item).join('')}</div></section>`;
      return wrap.firstChild;
    }
    wrap.innerHTML = '<p>Module</p>';
    return wrap.firstChild;
  }

  // 2026-05-28: thumb dos templates de cor = componente real renderizado.
  // Registramos como override (in-memory) o markup que buildModule produz,
  // wrapped em am-tpl-thumb com edit-w/h. A pipeline praia-mirror escala
  // ao tamanho da célula. Inserir um template continua passando por
  // buildModule diretamente — overrides afetam apenas o thumb.
  (() => {
    try {
      if (!window.__praiaTplOverrides) {
        try {
          window.__praiaTplOverrides = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
        } catch {
          window.__praiaTplOverrides = {};
        }
      }
      const colorModuleNames = ['Colors', 'Color card', 'Color cards', 'Color palette', 'Color pairing', 'Paleta de cores', 'On this page'];
      colorModuleNames.forEach(name => {
        if (window.__praiaTplOverrides[name]) return; // não sobrescreve customização do usuário
        const el = buildModule(name);
        if (!el) return;
        // Tamanho master padrão (1280×800) — mesmo usado pelo edit canvas.
        const tpl = `<div class="am-tpl-thumb" data-ds-edit-w="1280" data-ds-edit-h="800" style="width:1280px;height:800px;padding:64px 80px;display:block;aspect-ratio:auto;background:var(--bs-navy);overflow:hidden">${el.outerHTML}</div>`;
        window.__praiaTplOverrides[name] = tpl;
      });

      // 2026-05-28: text templates — markup canônico em tokens DS + grid 12 col.
      // O override garante que thumb e inserção mostram o mesmo componente.
      const textTemplateHeights = { '01': 110, '02': 780, '03': 147, '04': 224, '05': 300, '06': 380, '07': 620, '08': 60, Cover: 700 };
      const textTemplateMarkups = {
        '01': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);overflow-wrap:anywhere;row-gap:16px;align-items:start">
            <span class="tk-sb" style="grid-column:1 / span 3;grid-row:1;margin:0;color:var(--text-3);font-feature-settings:'ss01' on">(Photography)</span>
            <h2 class="tk-l" style="grid-column:1 / -1;grid-row:2;margin:0;color:var(--bs-white);letter-spacing:-0.02em">Photography is a core expression of BluStar. We ensure every image aligns with our unique brand perspective. Whether showcasing people, objects, or ideas, our imagery reflects the entrepreneurial world our users are building.</h2>
          </section>`.trim(),
        '02': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);overflow-wrap:anywhere;row-gap:64px;align-items:start">
            <h2 class="tk-h0" style="grid-column:1 / span 8;grid-row:1;margin:0;color:var(--bs-white)">Shaping worlds that inspire</h2>
            <p class="tk-mb" style="grid-column:7 / -1;grid-row:2;margin:0;color:var(--bs-white)">Every image we compose serves a clear purpose of showcasing a product, evoking a mood, or infusing personality. While styles may shift, the throughline remains: clarity, craft, and a distinctly individual point of view.</p>
          </section>`.trim(),
        '03': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);overflow-wrap:anywhere;align-items:start">
            <span class="tk-sb" style="grid-column:1 / span 2;grid-row:1;color:var(--text-3);padding-top:18px;position:relative;z-index:2">03</span>
            <span class="tk-sb" style="grid-column:3 / span 2;grid-row:1;color:var(--text-3);padding-top:18px;font-feature-settings:'ss01' on;position:relative;z-index:2">( In Use )</span>
            <h2 class="tk-l" style="grid-column:1 / -1;grid-row:1;margin:0;color:var(--bs-white);letter-spacing:-0.02em;text-indent:calc(33.33% + var(--ds-gap, 24px))">Designed for versatility, our in-house photography graces everything from brand campaigns and product UI to social content and customer stories. Each image reinforces our clean, expressive visual language while remaining adaptable enough to move across surfaces without ever losing impact.</h2>
          </section>`.trim(),
        '04': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);overflow-wrap:anywhere;align-items:start">
            <h2 class="tk-super" style="grid-column:1 / span 8;margin:0;color:var(--bs-white)">At the heart of the identity is our unique typographic voice. Type influences the tone of language and brand expression.</h2>
          </section>`.trim(),
        // 05: page header — big H1 title + Body subtitle + a divider line,
        // mirroring the default new-page header.
        '05': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:16px;align-items:start;overflow-wrap:anywhere">
            <h1 class="tk-super" style="grid-column:1 / 9;grid-row:1;margin:0;color:var(--bs-white);letter-spacing:-0.02em">New page</h1>
            <button type="button" class="am-add" style="grid-column:9 / -1;grid-row:1;justify-self:end;align-self:center;display:inline-flex;align-items:center;gap:8px"><span class="bs-icon" style="--bs-icon-size:14px">download</span>Download</button>
            <h4 class="tk-mb" style="grid-column:1 / -1;grid-row:2;margin:0;color:var(--text-3)">Descrição da página. Clique para editar.</h4>
            <div aria-hidden="true" style="grid-column:1 / -1;grid-row:3;height:1px;background:var(--border-strong);margin-top:16px"></div>
          </section>`.trim(),
        // 06: further reading — eyebrow + big heading on the left, a list of
        // resource links (title + domain↗ + divider) on the right.
        '06': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:32px;align-items:start;overflow-wrap:anywhere">
            <span class="tk-sb" style="grid-column:1 / -1;grid-row:1;margin:0;color:var(--text-3);letter-spacing:0.08em;text-transform:uppercase;font-feature-settings:'ss01' on">Further reading</span>
            <h2 class="tk-xl" style="grid-column:1 / span 5;grid-row:2;margin:0;color:var(--bs-white);letter-spacing:-0.02em">Relevant posts &amp; resources</h2>
            <div style="grid-column:7 / -1;grid-row:2">
              <div style="padding:0 0 20px;border-bottom:1px solid var(--border-strong)">
                <h4 class="tk-mb" style="margin:0;color:var(--bs-white)">“Output Isn’t Design” — Karri Saarinen</h4>
                <p class="tk-m" style="margin:10px 0 0;color:var(--text-3)">linear.app ↗</p>
              </div>
              <div style="padding:20px 0;border-bottom:1px solid var(--border-strong)">
                <h4 class="tk-mb" style="margin:0;color:var(--bs-white)">“Beyond Prototyping” — Nate Parrott</h4>
                <p class="tk-m" style="margin:10px 0 0;color:var(--text-3)">aidesignfieldguide.com ↗</p>
              </div>
            </div>
          </section>`.trim(),
        // 07: made-by / credits — eyebrow + statement on the right, then a
        // Role/Credits table with divided rows.
        '07': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:96px;align-items:start;overflow-wrap:anywhere">
            <span class="tk-sb" style="grid-column:1 / span 3;grid-row:1;margin:0;color:var(--text-3);letter-spacing:0.08em;font-feature-settings:'ss01' on">Made by</span>
            <h2 class="tk-xl" style="grid-column:6 / -1;grid-row:1;margin:0;color:var(--bs-white);letter-spacing:-0.02em">This project was created through collaboration between researchers, writers, and designers across multiple teams.</h2>
            <div style="grid-column:6 / -1;grid-row:2;display:flex;flex-direction:column">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-bottom:16px;border-bottom:1px solid var(--border-strong)">
                <span class="tk-sb" style="margin:0;color:var(--text-3);letter-spacing:0.08em;font-feature-settings:'ss01' on">Role</span>
                <span class="tk-sb" style="margin:0;color:var(--text-3);letter-spacing:0.08em;font-feature-settings:'ss01' on">Credits</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--border-strong)">
                <h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Project lead</h4>
                <p class="tk-m" style="margin:0;color:var(--text-3)">Robyn Park</p>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--border-strong)">
                <h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Executive producers</h4>
                <p class="tk-m" style="margin:0;color:var(--text-3)">Ben Blumenrose, Steve Vassallo</p>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--border-strong)">
                <h4 class="tk-mb" style="margin:0;color:var(--bs-white)">Editorial</h4>
                <p class="tk-m" style="margin:0;color:var(--text-3)">Nathalie Arbel</p>
              </div>
            </div>
          </section>`.trim(),
        // 08: só um botão (mesmo CTA do template 05), alinhado à esquerda.
        '08': `
          <section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);align-items:start;overflow-wrap:anywhere">
            <button type="button" class="am-add" style="grid-column:1 / span 3;grid-row:1;justify-self:start;align-self:center;display:inline-flex;align-items:center;gap:8px"><span class="bs-icon" style="--bs-icon-size:14px">download</span>Download</button>
          </section>`.trim(),
        // Cover: full-bleed cover (edge-to-edge), NOT the 12-col content grid.
        // BluStar Cyan background; dark (navy) type. Eyebrow on top, big title at
        // the bottom-left with a reading-time caption bottom-right.
        Cover: `
          <section data-cover="05" style="background:var(--bs-cyan);padding:80px;box-sizing:border-box;display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:24px;align-content:end;align-items:end;overflow-wrap:anywhere">
            <h4 class="tk-mb" style="grid-column:1 / -1;grid-row:1;margin:0;color:var(--bs-navy);letter-spacing:0.04em;font-feature-settings:'ss01' on">02.CRAFT</h4>
            <h1 class="tk-super" style="grid-column:1 / span 11;grid-row:2;margin:0;color:var(--bs-navy);letter-spacing:-0.02em">Craft in an age of infinite output</h1>
          </section>`.trim(),
      };
      // Rule: a template's frame height is ALWAYS flush ("rente") to its
      // content — measured from the rendered markup at the locked 1280px width,
      // never a fixed guess. Markup that defines its own min-height (e.g. 02)
      // keeps it, since the measurement includes it; pure text blocks shrink to
      // exactly the text. Applies to every text template (01–04 and any new one).
      const FIT_TO_TEXT = new Set(Object.keys(textTemplateMarkups));
      // Per-template native canvas width. Most templates author at 1280; the
      // full-bleed cover (05) authors at a wider 2000px canvas so the big H0
      // title scales DOWN to a banner-appropriate size when fit to the page
      // width (instead of rendering at its raw 220px and overflowing).
      const TEXT_TPL_EDITW = {};
      const editWFor = name => TEXT_TPL_EDITW[name] || 1280;
      // Measure the natural content height of a template's markup at its native
      // canvas width. Returns null if measurement isn't reliable yet (fonts).
      const measureTextHeight = (html, ew = 1280) => {
        const probe = document.createElement('div');
        probe.style.cssText = `position:absolute;left:-99999px;top:0;width:${ew}px;padding:0;visibility:hidden;pointer-events:none`;
        probe.innerHTML = html;
        document.body.appendChild(probe);
        const inner = probe.firstElementChild || probe;
        const h = Math.ceil(inner.getBoundingClientRect().height);
        probe.remove();
        return h > 0 ? h : null;
      };
      // Per-template thumb canvas background. The cover (05) uses cyan so the
      // preview cell's letterbox area blends with the cover instead of showing
      // a dark band.
      const TEXT_TPL_BG = { Cover: 'var(--bs-cyan)' };
      const buildOverride = (name, html, h) => {
        const ew = editWFor(name);
        const bg = TEXT_TPL_BG[name] || 'var(--bs-navy)';
        return `<div class="am-tpl-thumb" data-ds-edit-w="${ew}" data-ds-edit-h="${h}" style="width:${ew}px;height:${h}px;padding:0;display:block;aspect-ratio:auto;background:${bg};overflow:hidden">${html}</div>`;
      };
      // Version gate: bump TEXT_TPL_GEN_VER whenever the canonical markup above
      // changes so stale generated overrides (persisted in localStorage) are
      // discarded and rebuilt. User edits in DS persist the override AND set a
      // separate flag, so they survive — only untouched generated ones reset.
      const TEXT_TPL_GEN_VER = '2026-06-03-tpl08-button-left';
      try {
        if (localStorage.getItem('praia.tpl.textgen.ver') !== TEXT_TPL_GEN_VER) {
          Object.keys(textTemplateMarkups).forEach(name => {
            if (!window.__praiaTplOverrides['edited:' + name]) delete window.__praiaTplOverrides[name];
          });
          localStorage.setItem('praia.tpl.textgen.ver', TEXT_TPL_GEN_VER);
        }
      } catch {}
      Object.entries(textTemplateMarkups).forEach(([name, html]) => {
        if (window.__praiaTplOverrides[name]) return;
        let h = textTemplateHeights[name] || 800;
        if (FIT_TO_TEXT.has(name)) h = measureTextHeight(html, editWFor(name)) || h;
        window.__praiaTplOverrides[name] = buildOverride(name, html, h);
      });
      // Fonts may not have loaded when the first (synchronous) measurement ran,
      // which would leave a slightly-off height. Re-measure once fonts are ready
      // and refresh any already-rendered cells/instances so 01 + 03 stay flush.
      const refreshFitTemplate = name => {
        const ov = window.__praiaTplOverrides[name];
        if (!ov) return;
        window.__praiaPropagateTemplate?.(name, ov);
        document.querySelectorAll(`.ds-tpl-cell[data-tpl-name="${CSS.escape(name)}"] .praia-frame`).forEach(frame => {
          if (!window.__praiaWrapMasterInMirror) return;
          const r = window.__praiaWrapMasterInMirror(ov, { transparentBg: false });
          const actions = frame.querySelector('.ds-tpl-actions');
          frame.style.aspectRatio = `${r.editW}/${r.editH}`;
          frame.innerHTML = r.html + (actions ? actions.outerHTML : '');
        });
        window.__praiaApplyMirrorScale?.();
      };
      document.fonts?.ready?.then(() => {
        FIT_TO_TEXT.forEach(name => {
          if (!textTemplateMarkups[name]) return;
          // Skip if the user has edited this template (their override wins).
          if (window.__praiaTplOverrides['edited:' + name]) return;
          const h = measureTextHeight(textTemplateMarkups[name], editWFor(name));
          if (!h) return;
          window.__praiaTplOverrides[name] = buildOverride(name, textTemplateMarkups[name], h);
          refreshFitTemplate(name);
        });
      });
      // Mudar um token de Type (size/line/tracking/weight/family) altera a altura
      // natural dos templates de texto. Re-mede TODOS os templates fit-to-text a
      // partir do markup ATUAL de cada override (preservando edições do usuário) e
      // propaga a nova altura para células + instâncias. Sem isso o frame fica na
      // altura medida com a type antiga e o conteúdo "desconfigura".
      window.__praiaRemeasureTextTemplates = function () {
        Object.keys(textTemplateMarkups).forEach(name => {
          if (!FIT_TO_TEXT.has(name)) return;
          const ov = window.__praiaTplOverrides[name];
          if (!ov) return;
          const probe = document.createElement('div');
          probe.innerHTML = ov;
          const thumb = probe.querySelector('.am-tpl-thumb');
          if (!thumb) return;
          const ew = parseFloat(thumb.getAttribute('data-ds-edit-w')) || editWFor(name);
          const h = measureTextHeight(thumb.innerHTML, ew);
          if (!h) return;
          thumb.setAttribute('data-ds-edit-h', h);
          thumb.style.height = h + 'px';
          window.__praiaTplOverrides[name] = thumb.outerHTML;
          refreshFitTemplate(name);
        });
        try {
          localStorage.setItem('praia.tpl.overrides', JSON.stringify(window.__praiaTplOverrides));
        } catch {}
        window.__praiaApplyMirrorScale?.();
      };
    } catch (e) {
      /* não bloqueia render se algo falhar */
    }
  })();

  function makeSlot() {
    const slot = document.createElement('div');
    slot.className = 'add-module-slot';
    slot.innerHTML = '<button class="add-module-btn" type="button">Add template</button>';
    return slot;
  }
  // Migration: persisted (older) snapshots may still carry "Add module" text on
  // existing slot buttons. Rewrite them on load so the label is consistent.
  function relabelSlots() {
    document.querySelectorAll('.add-module-btn').forEach(b => {
      if ((b.textContent || '').trim() === 'Add module') b.textContent = 'Add template';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', relabelSlots);
  } else {
    relabelSlots();
  }
  // Also relabel after any DOM swap (autosave restore, undo/redo, etc.)
  new MutationObserver(relabelSlots).observe(document.body, { childList: true, subtree: true });
  // Delegated: survives innerHTML restore from autosave
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-module-btn');
    if (!btn) return;
    const slot = btn.closest('.add-module-slot');
    if (!slot) return;
    e.stopPropagation();
    e.preventDefault();
    open(slot);
  });

  function isEmptyBlock(el) {
    if (!el || el.classList.contains('add-module-slot')) return false;
    // Real visible modules keep their height even when empty (spacer-block, page-hero, etc.)
    // We only treat truly invisible/zero-content wrappers as removable.
    if (el.classList.contains('spacer-block')) return false;
    const text = (el.textContent || '').trim();
    if (text.length > 0) return false;
    if (el.querySelector('img, svg, video, canvas, .tpl-img')) return false;
    return el.offsetHeight < 8 && el.offsetWidth < 8;
  }

  function injectSlotsIn(container) {
    // Slots only ever live as DIRECT children of a page. Strip any that leaked
    // into a nested block (e.g. restored from older state).
    container.querySelectorAll(':scope > :not(.add-module-slot) .add-module-slot').forEach(s => s.remove());
    // Strip truly empty wrapper elements (artifacts of deletes / legacy state).
    [...container.children].forEach(c => {
      if (isEmptyBlock(c)) c.remove();
    });
    // Deterministic, idempotent rule: enforce exactly the pattern
    //   slot, block, slot, block, … , slot
    // i.e. ONE add-template slot before every block and ONE trailing slot, never
    // two in a row — no matter what inserting/deleting left behind. A second pass
    // over an already-correct page makes zero mutations (so the MutationObserver
    // that calls this doesn't loop).
    let wantSlot = true; // the next element we expect is a slot
    let node = container.firstElementChild;
    while (node) {
      const next = node.nextElementSibling;
      const isSlot = node.classList.contains('add-module-slot');
      if (isSlot) {
        if (wantSlot)
          wantSlot = false; // good — this slot fills the gap
        else node.remove(); // duplicate slot in a row → drop it
      } else {
        if (wantSlot) container.insertBefore(makeSlot(), node); // missing slot → add
        wantSlot = true; // after a block we again expect a slot
      }
      node = next;
    }
    // Trailing slot: if we ended expecting a slot (last was a block, or page was
    // empty), append exactly one.
    if (wantSlot) container.appendChild(makeSlot());
    container.dataset.slotsInjected = 'true';
  }
  function injectSlots() {
    // Guide + Home: between every block of every page — EXCEPT the Design System
    // canvas (data-ds-canvas). Templates belong only on content pages, never in
    // the DS (which holds tokens/sections). So no "Add template" slots there.
    document.querySelectorAll(':is([data-world="guide"], [data-world="home"]) .guide-page:not([data-ds-canvas])').forEach(page => {
      injectSlotsIn(page);
    });
    // Defensive: strip any add-template slots that leaked into the DS canvas
    // (e.g. restored from older state) so templates can't be added inside it.
    document.querySelectorAll('.guide-page[data-ds-canvas] .add-module-slot').forEach(s => s.remove());
    // Strip any slots that ended up inside multi-column containers (defensive cleanup
    // for state restored from older versions of this template).
    document
      .querySelectorAll(
        '[data-world="guide"] .color-grid .add-module-slot, ' +
          '[data-world="guide"] .type-grid .add-module-slot, ' +
          '[data-world="guide"] .card .add-module-slot, ' +
          '[data-world="home"] .color-grid .add-module-slot, ' +
          '[data-world="home"] .type-grid .add-module-slot, ' +
          '[data-world="home"] .card .add-module-slot'
      )
      .forEach(s => s.remove());
  }

  function open(slot) {
    currentInsertBefore = slot;
    // Guarantee the DS Templates section exists before we mirror it, so the
    // picker is identical from Home or Guide even if DS was never opened.
    window.__praiaEnsureDsTemplates?.();
    document.querySelectorAll('.am-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === 'templates'));
    renderGrid('templates');
    overlay.classList.add('open');
    // Mirror any edits made in DS Templates into the Add Module cards. The
    // applyScaledThumbs pass needs visible parents to measure correctly, so
    // it has to run AFTER the overlay opens.
    requestAnimationFrame(() => window.__praiaApplyScaledThumbs?.());
    // Mirror the DS Templates section (filters + grid) into the modal body
    // so the picker shows EXACTLY what the DS section shows. Any template
    // added/edited in the DS section reflects here on the next open.
    requestAnimationFrame(() => {
      const body = document.getElementById('am-body-mirror');
      const dsSec = document.querySelector('section[data-ds-section="templates"]');
      if (!body || !dsSec) return;
      body.innerHTML = '';
      const filters = dsSec.querySelector('.ds-tpl-filters')?.cloneNode(true);
      const grid = dsSec.querySelector('.ds-cat-grid')?.cloneNode(true);
      if (filters) {
        filters.querySelectorAll('.ds-tpl-filter').forEach(b => b.classList.toggle('is-active', b.dataset.tplFilter === 'all'));
        body.appendChild(filters);
      }
      if (grid) {
        grid.removeAttribute('data-filter');
        body.appendChild(grid);
      }
      // The cloned cells contain .praia-mirror children; bind the
      // ResizeObserver to the new .praia-frame wraps and scale on next frame
      // so the modal preview matches the DS cells.
      window.__praiaEnsureMirrorObserver?.();
      requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
    });
  }
  function close() {
    overlay.classList.remove('open');
    currentInsertBefore = null;
  }

  document.querySelectorAll('.am-tab').forEach(t =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.am-tab').forEach(x => x.classList.toggle('active', x === t));
      renderGrid(t.dataset.cat);
      requestAnimationFrame(() => window.__praiaApplyScaledThumbs?.());
    })
  );
  document.getElementById('am-cancel').addEventListener('click', close);
  document.getElementById('am-add').addEventListener('click', () => {
    if (selectedModuleName) insertModule(selectedModuleName);
    else if (selectedTplId) insertTemplate(selectedTplId);
  });
  // Mirror grid: click selects, double-click inserts. Cells store data-tpl-name;
  // we resolve to a template id (or fall back to module insertion by name) by
  // looking the name up across the in-scope registries.
  function resolveByName(name) {
    if (!name) return null;
    const t1 = templates.find(t => t.name === name);
    if (t1) return { kind: 'template', id: t1.id };
    const t2 = textTemplates.find(t => t.name === name);
    if (t2) return { kind: 'template', id: t2.id };
    for (const cat of Object.keys(modules)) {
      const list = modules[cat];
      if (!Array.isArray(list)) continue;
      const m = list.find(x => x && x.name === name);
      if (m) return { kind: 'module', name };
    }
    return { kind: 'module', name };
  }
  overlay.addEventListener('click', e => {
    const cell = e.target.closest('#am-body-mirror .ds-tpl-cell');
    if (!cell) return;
    overlay.querySelectorAll('#am-body-mirror .ds-tpl-cell').forEach(c => c.classList.toggle('is-selected', c === cell));
    const name = cell.dataset.tplName;
    selectedName = name;
    const r = resolveByName(name);
    if (r?.kind === 'template') {
      selectedTplId = r.id;
      selectedModuleName = null;
    } else {
      selectedModuleName = name;
      selectedTplId = null;
    }
  });
  overlay.addEventListener('dblclick', e => {
    const cell = e.target.closest('#am-body-mirror .ds-tpl-cell');
    if (!cell) return;
    const r = resolveByName(cell.dataset.tplName);
    if (r?.kind === 'template') insertTemplate(r.id);
    else if (r?.kind === 'module') insertModule(r.name);
  });
  document.getElementById('am-ds')?.addEventListener('click', () => {
    close();
    document.getElementById('ds-canvas-btn')?.click();
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
  // Re-inject when new pages get cloned (Duplicate); also after the menu actions
  injectSlots();
  // Watch for cloned pages
  new MutationObserver(injectSlots).observe(document.body, { childList: true, subtree: true });

  // Auto-remove empty module blocks: when the user deletes all content from an
  // editable inside a guide module and the top-level block has no remaining
  // text or media, drop the wrapper so empty outlined boxes don't pile up.
  document.addEventListener('input', e => {
    const ed = e.target.closest('[contenteditable="true"]');
    if (!ed) return;
    const page = ed.closest('[data-world="guide"] .guide-page');
    if (!page) return;
    let block = ed;
    while (block.parentElement && block.parentElement !== page) block = block.parentElement;
    if (!block || block === page) return;
    if (block.classList.contains('add-module-slot')) return;
    if (block.classList.contains('spacer-block')) return;
    const text = (block.textContent || '').replace(/​/g, '').trim();
    if (text.length > 0) return;
    if (block.querySelector('img, svg, video, canvas, .tpl-img, input, select')) return;
    block.remove();
    window.__praiaAutosave?.();
  });
})();
