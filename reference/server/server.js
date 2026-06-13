// ============================================================================
// BluStar Gen Studio — proxy de análise (IA)
// A API key do Claude fica SÓ aqui, lida de ANTHROPIC_API_KEY (env). Nunca no
// front. O front manda as peças (imagens base64) e recebe o DS estruturado.
// ============================================================================
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

// Carrega variáveis do server/.env automaticamente (Node ≥20.6).
// Mantém as chaves fora do código e do git (.env está no .gitignore).
try { process.loadEnvFile(new URL('./.env', import.meta.url)); } catch (e) { /* .env opcional */ }

const PORT = process.env.PORT || 8787;
// ANTHROPIC_API_KEY é OPCIONAL: só é usada na análise de DS (/api/analyze).
// Sem ela o servidor sobe normal e a geração de imagem (Gemini) funciona;
// apenas /api/analyze responde 503.
const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

// Nano Banana 2 (Google Gemini 3 Pro Image) — chave OPCIONAL, lida do ambiente.
// Não derruba o servidor se faltar; o endpoint responde 503 até ela existir.
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
// Faixa de resolução cobrada pelo modelo. 1K = mais barata (padrão p/ economizar
// crédito). Aceita '1K', '2K', '4K'. Ajustável por env GEMINI_IMAGE_SIZE.
const GEMINI_IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE || '1K';

const app = express();
app.use(cors());
app.use(express.json({ limit: '40mb' }));

// Esquema do DS que a IA deve devolver
const DS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    fontName: { type: 'string', description: 'Nome da família tipográfica predominante' },
    type: {
      type: 'array',
      description: 'Escala tipográfica, do maior para o menor',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'Display, H1, H2, Subtítulo, Corpo, Legenda…' },
          size: { type: 'integer', description: 'Tamanho em px no espaço do layout' },
          weight: { type: 'integer', description: 'Peso (100–900)' },
          lineHeight: { type: 'number' }
        },
        required: ['name', 'size', 'weight', 'lineHeight']
      }
    },
    colorsPrimary: { type: 'array', items: { type: 'string', description: 'Hex #RRGGBB' } },
    colorsSecondary: { type: 'array', items: { type: 'string', description: 'Hex #RRGGBB' } },
    colorRoles: {
      type: 'object',
      description: 'Papéis de cor no estilo Material 3 (primary/secondary/tertiary, cada um com base, on, container e onContainer)',
      additionalProperties: false,
      properties: {
        primary: { $ref: '#/$defs/role' },
        secondary: { $ref: '#/$defs/role' },
        tertiary: { $ref: '#/$defs/role' }
      },
      required: ['primary', 'secondary', 'tertiary']
    },
    spacing: {
      type: 'array',
      description: 'Escala de espaçamento (do menor ao maior)',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'ex.: spacing-01' },
          rem: { type: 'number' },
          px: { type: 'integer' }
        },
        required: ['name', 'rem', 'px']
      }
    },
    formats: {
      type: 'array',
      description: 'Proporções (aspect ratios) usadas/recomendadas',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ratio: { type: 'string', description: 'ex.: 1:1, 4:5, 9:16' },
          orientation: { type: 'string', description: 'Landscape, Portrait ou Square' }
        },
        required: ['ratio', 'orientation']
      }
    },
    grid: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cols: { type: 'integer' },
        marginPct: { type: 'number', description: '% do menor lado' },
        w: { type: 'integer' },
        h: { type: 'integer' }
      },
      required: ['cols', 'marginPct', 'w', 'h']
    }
  },
  required: ['fontName', 'type', 'colorsPrimary', 'colorsSecondary', 'colorRoles', 'spacing', 'formats', 'grid'],
  $defs: {
    role: {
      type: 'object',
      additionalProperties: false,
      properties: {
        base: { type: 'string', description: 'Hex #RRGGBB' },
        on: { type: 'string', description: 'Cor do texto/ícone sobre base' },
        container: { type: 'string', description: 'Variante clara/de container' },
        onContainer: { type: 'string', description: 'Cor sobre o container' }
      },
      required: ['base', 'on', 'container', 'onContainer']
    }
  }
};

const SYSTEM = `Você é um especialista em Design Systems. Analisa peças de uma campanha (layouts) e infere o sistema visual completo:
- Tipografia: escala com tamanhos/pesos/entrelinha e papéis (Display/H1/H2/Subtítulo/Corpo/Legenda).
- Cores: paleta separada em PRIMÁRIAS (dominantes, no máx 6) e SECUNDÁRIAS (apoio), no máx 20 no total.
- Papéis de cor (Material 3): primary, secondary e tertiary, cada um com base, on (texto sobre a base, alto contraste), container (variante mais clara) e onContainer.
- Espaçamento: escala coerente (ex.: 2,4,8,12,16,24,32,40,48,64) com nome (spacing-01…), rem e px.
- Formatos: as proporções (aspect ratios) presentes/recomendadas com orientação (Landscape/Portrait/Square).
- Grid: colunas, margem como % do menor lado, e o formato w×h em px.
- Raios (radii): escala de cantos arredondados (sm/md/lg em px).
- Uso de cor (colorUsage): para cada cor, o papel (background, surface, selection, action, text, accent).
- Blocos (blocks): os MÓDULOS que compõem as peças — headline, photo, caption, logo, stat — com fundo (cor ou "image"), âncora do texto, raio e observações.
- Regras de layout (layoutRules): gap do mosaico, alternância de cor entre blocos, âncora de headline e de legenda, tratamento de foto e nível de respiro.
- Regra de headline (headlineRule): se o título usa destaque bicolor (uma frase em cor de destaque), a cor do destaque, a caixa e o alinhamento.
Trate as peças como um SISTEMA DE COMUNICAÇÃO MODULAR (mosaico de blocos), não como tela de app.

REGRAS DE GRID FIXAS do sistema BluStar (aplique em layoutRules):
- Margem = 3% do menor lado da peça, arredondada para múltiplo de 4 (ex.: 1080×1350 → 1080×3% = 32,4 → 32px).
- Gutter = 1× a margem (mesmo valor).
- Gap entre blocos do mosaico = X (= margem). Blocos aninhados = X/2.
- Margem interna (padding do texto dentro do bloco) = 2× a margem.
- Colunas: 6, 8 ou 12 conforme o formato — estreito 6, intermediário 8, amplo/denso 12.
- Headline: bicolor, com uma frase em destaque (cyan) e o resto em branco, sobre fundo navy; alinhado à esquerda; bold (700); cada frase termina com ponto final. Ex.: "Você roda." (cyan) / "A Yamaha cuida." (branco).
Preencha layoutRules com: marginPx, gutterPx, blockGapPx, nestedGapPx, internalPaddingPx, columns.

PALETA OFICIAL BluStar/Yamaha (use estes hex exatos quando as peças usarem estas cores; devolva-os em brandPalette):
- Azul Turquesa (marca/destaque): #0FC4D5 — PMS 4280 C
- Azul Marinho (fundo principal): #061833
- Branco: #FFFFFF
- Apoio: #3259FF (Royal), #4D8BFE (Claro), #3FCCE3 (Turquesa clara), #04001E (Navy profundo)
- Tints: #A6D9DE, #BFFAFF, #DFFCFF · Neutros: #303030, #7F7F7F

COLOR PAIRING OFICIAL (devolva em colorPairing): 3 superfícies, cada uma combina com 2 cores de texto de alto contraste:
- Fundo Branco #FFFFFF → texto Turquesa #0FC4D5 ou Marinho #061833
- Fundo Turquesa #0FC4D5 → texto Marinho #061833 ou Branco #FFFFFF
- Fundo Marinho #061833 → texto Turquesa #0FC4D5 ou Branco #FFFFFF
Nunca use combinações de baixo contraste (ex.: turquesa sobre branco em corpo de texto pequeno).
Responda SEMPRE no JSON do schema. Cores em hex #RRGGBB.`;

// Forma de exemplo enviada no prompt (guia o modelo sem depender de output_config)
const SHAPE_HINT = {
  fontName: 'string',
  type: [{ name: 'Display', size: 96, weight: 700, lineHeight: 1.0 }],
  colorsPrimary: ['#RRGGBB'],
  colorsSecondary: ['#RRGGBB'],
  colorRoles: {
    primary: { base: '#RRGGBB', on: '#RRGGBB', container: '#RRGGBB', onContainer: '#RRGGBB' },
    secondary: { base: '#RRGGBB', on: '#RRGGBB', container: '#RRGGBB', onContainer: '#RRGGBB' },
    tertiary: { base: '#RRGGBB', on: '#RRGGBB', container: '#RRGGBB', onContainer: '#RRGGBB' }
  },
  spacing: [{ name: 'spacing-01', rem: 0.125, px: 2 }],
  formats: [{ ratio: '4:5', orientation: 'Portrait' }],
  radii: [{ name: 'sm', px: 8 }, { name: 'md', px: 24 }, { name: 'lg', px: 40 }],
  colorUsage: [{ hex: '#RRGGBB', role: 'background | surface | selection | action | text | accent' }],
  blocks: [{ type: 'headline | photo | caption | logo | stat', bg: '#RRGGBB ou "image"', textAnchor: 'top-left | bottom-left | center', radiusPx: 24, notes: 'string' }],
  layoutRules: { marginPx: 32, gutterPx: 32, blockGapPx: 32, nestedGapPx: 16, internalPaddingPx: 64, columns: 6, colorAlternation: 'alternar cyan/navy, nunca dois navy juntos', headlineAnchor: 'top-left', captionAnchor: 'bottom-left', photoTreatment: 'cantos arredondados; selo de cor atrás do sujeito', whitespace: 'alto | médio | baixo' },
  headlineRule: { pattern: 'bicolor — 1ª frase em destaque, resto em branco', highlightColor: '#0FC4D5', baseColor: '#FFFFFF', bg: '#061833', case: 'sentence', punctuation: 'ponto final em cada frase', weight: 700, align: 'left', example: 'Você roda. / A Yamaha cuida.' },
  brandPalette: [{ hex: '#0FC4D5', name: 'Azul Turquesa', pms: 'PMS 4280 C', role: 'brand / destaque' }, { hex: '#061833', name: 'Azul Marinho', pms: '', role: 'fundo principal' }, { hex: '#FFFFFF', name: 'Branco', pms: '', role: 'texto / fundo claro' }],
  colorPairing: [
    { surface: '#FFFFFF', surfaceName: 'Branco', text: ['#0FC4D5', '#061833'], textNames: ['Turquesa', 'Marinho'] },
    { surface: '#0FC4D5', surfaceName: 'Turquesa', text: ['#061833', '#FFFFFF'], textNames: ['Marinho', 'Branco'] },
    { surface: '#061833', surfaceName: 'Marinho', text: ['#0FC4D5', '#FFFFFF'], textNames: ['Turquesa', 'Branco'] }
  ],
  grid: { cols: 6, marginPct: 3, w: 1080, h: 1350 }
};

// Parse tolerante: tira cercas ```json e pega o primeiro objeto {...}
function extractJSON(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch (e) {} }
  return null;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/analyze', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ error: 'ANTHROPIC_API_KEY não configurada (análise de DS indisponível).' });
    }
    const { images = [], fontHint = '' } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Envie ao menos 1 imagem (base64).' });
    }
    // Monta blocos de imagem (até 10 peças)
    const imageBlocks = images.slice(0, 10).map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType || 'image/png', data: img.data }
    }));

    const userText = 'Analise estas ' + imageBlocks.length + ' peça(s) da campanha e gere o Design System.'
      + (fontHint ? ' A família tipográfica é "' + fontHint + '".' : '')
      + '\n\nResponda SOMENTE com um objeto JSON válido (sem markdown, sem comentários) com esta forma exata:\n'
      + JSON.stringify(SHAPE_HINT);

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: userText }] }]
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'Resposta sem conteúdo.' });
    const ds = extractJSON(textBlock.text);
    if (!ds) return res.status(502).json({ error: 'Resposta não-JSON do modelo.' });
    res.json({ ds });
  } catch (err) {
    console.error('[analyze] erro:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Falha na análise' });
  }
});

// ── Nano Banana 2 — gera a peça inteira (arte + texto) on-brand ──────────────
// Monta um prompt com a marca BluStar e a copy do usuário; pede 1 imagem no
// formato pedido. brand{} pode sobrescrever palette/headline vindos do DS.
function buildPiecePrompt(copy, format, brand, variant, category, context) {
  const navy = (brand && brand.navy) || '#061833';
  const cyan = (brand && brand.cyan) || '#0FC4D5';
  const white = (brand && brand.white) || '#FFFFFF';
  const variants = {
    hero: 'Composição hero: headline grande dominando a peça, muito respiro, sem foto ou com foto sutil ao fundo.',
    split: 'Composição dividida: headline em um bloco e uma foto do produto/uso (moto/pessoa) em bloco turquesa com cantos arredondados.',
    bold: 'Composição tipográfica ousada: tipografia muito grande ocupando a peça, mínima imagem.'
  };

  // ── Contexto do usuário (Stitch-style): regras de design, tipografia e
  // layouts de referência. Quando há layouts, o modelo deve REPLICAR a
  // estrutura — não a variante padrão.
  const ctx = context || {};
  const hasLayouts = Array.isArray(ctx.layouts) && ctx.layouts.length > 0;
  const ctxLines = [];
  if (ctx.rules && String(ctx.rules).trim()) {
    ctxLines.push('REGRAS DE DESIGN (obrigatórias — respeite à risca): ' + String(ctx.rules).trim());
  }
  if (ctx.typography && (ctx.typography.family || (ctx.typography.weights || []).length)) {
    const fam = ctx.typography.family ? ('família "' + ctx.typography.family + '"') : 'família fornecida';
    const w = (ctx.typography.weights || []).filter(Boolean);
    ctxLines.push('TIPOGRAFIA DE REFERÊNCIA: use a ' + fam
      + (w.length ? (' com os pesos: ' + w.join(', ') + '.') : '.')
      + ' Reproduza o caráter tipográfico (proporção, peso, espaçamento) dessa família.');
  }
  if (hasLayouts) {
    ctxLines.push(
      'LAYOUTS DE REFERÊNCIA: as ' + ctx.layouts.length + ' imagem(ns) anexada(s) a seguir são gabaritos de layout (wireframes/estruturas) no mesmo formato Stories. '
      + 'Estude com atenção a estrutura de cada uma: grid, margens, posição e ordem dos blocos, hierarquia visual, áreas de título, corpo, imagem, logo e CTA, alinhamentos e proporções. '
      + 'REPLIQUE essa estrutura de composição na nova peça, adaptando o conteúdo ao pedido do usuário abaixo. '
      + 'NÃO copie o texto nem as imagens das referências — use-as somente como gabarito de posicionamento e proporção. '
      + 'Se houver mais de uma referência, escolha a estrutura mais adequada ao pedido (ou combine de forma coerente).'
    );
  }

  return [
    'Crie uma peça de comunicação publicitária profissional, pronta para publicação, da marca BluStar (aluguel de motos Yamaha).',
    'Proporção da imagem: ' + format + '.',
    'Paleta ESTRITA da marca — use somente estas cores: Azul Marinho ' + navy + ' (fundo principal), Azul Turquesa ' + cyan + ' (destaque), Branco ' + white + '. Nada de outras cores.',
    'Headline bicolor: a primeira frase em ' + cyan + ', o restante em ' + white + ', em negrito, alinhado à esquerda, cada frase terminando com ponto final.',
    'Tom premium, moderno, muito espaço negativo, grid limpo. Sem watermark, sem texto fora da copy fornecida, sem lorem ipsum.',
    // Com layouts de referência, a estrutura vem das referências — não da variante fixa.
    hasLayouts ? '' : (variants[variant] || variants.hero),
    category ? ('Categoria da peça: ' + category + ' — ajuste o tom e a composição a esse tipo de comunicação.') : '',
    ctxLines.length ? ('\n— CONTEXTO DO USUÁRIO —\n' + ctxLines.join('\n')) : '',
    'Copy da peça: "' + (copy || '') + '"'
  ].filter(Boolean).join('\n');
}

app.post('/api/generate-image', async (req, res) => {
  if (!geminiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY não configurada no servidor (Nano Banana 2 indisponível).' });
  }
  try {
    const { prompt = '', format = '4:5', brand = {}, variant = 'hero', category = '', context = null } = req.body || {};
    if (!prompt.trim()) return res.status(400).json({ error: 'Envie a copy da peça.' });
    const fullPrompt = buildPiecePrompt(prompt, format, brand, variant, category, context);

    // Texto + (opcional) imagens de layout de referência como inlineData.
    const reqParts = [{ text: fullPrompt }];
    if (context && Array.isArray(context.layouts)) {
      for (const L of context.layouts.slice(0, 8)) {
        if (L && L.data) reqParts.push({ inlineData: { mimeType: L.mime || 'image/png', data: L.data } });
      }
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
      + encodeURIComponent(GEMINI_IMAGE_MODEL) + ':generateContent';
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({
        contents: [{ parts: reqParts }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: format, imageSize: GEMINI_IMAGE_SIZE } }
      })
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data && data.error && data.error.message) || ('HTTP ' + r.status) });
    }
    const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    const img = parts.find((p) => p.inlineData || p.inline_data);
    const inline = img && (img.inlineData || img.inline_data);
    if (!inline) return res.status(502).json({ error: 'Resposta sem imagem do modelo.' });
    res.json({ image: { data: inline.data, mediaType: inline.mimeType || inline.mime_type || 'image/png' } });
  } catch (err) {
    console.error('[generate-image] erro:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Falha na geração de imagem' });
  }
});

app.listen(PORT, () => {
  console.log('BluStar Gen Studio server em http://localhost:' + PORT);
  console.log('Nano Banana 2 (' + GEMINI_IMAGE_MODEL + '): ' + (geminiKey ? 'ativo' : 'inativo — defina GEMINI_API_KEY'));
});
