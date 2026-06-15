# Gen Studio — servidor de análise (IA)

Proxy seguro entre o Gen Studio AI e o Claude. **A API key fica só aqui** (variável de ambiente), nunca no HTML/front.

## Rodar

```bash
cd server
npm install                       # uma vez
# análise do DS (Claude) + geração de peça (Nano Banana 2 / Gemini)
ANTHROPIC_API_KEY=sk-ant-... GEMINI_API_KEY=AIza... npm start
```

Sobe em `http://localhost:8787`. O `gen-studio.html` chama `/api/analyze` e `/api/generate-image`.

- `ANTHROPIC_API_KEY` é **obrigatória** (análise). `GEMINI_API_KEY` é **opcional**: sem ela o Layout Builder cai no **motor local on-brand** automaticamente — nada quebra.
- Endpoints:
  - `GET /health`
  - `POST /api/analyze` (`{ images:[{data,mediaType}], fontHint }` → `{ ds }`) — Claude `claude-opus-4-8` (visão).
  - `POST /api/generate-image` (`{ prompt, format, brand:{navy,cyan,white}, variant }` → `{ image:{data,mediaType} }`) — **Nano Banana 2** (Gemini, `gemini-3-pro-image-preview`). Gera a peça inteira on-brand.
- Pegue a `GEMINI_API_KEY` em https://aistudio.google.com/apikey . Modelo override via `GEMINI_IMAGE_MODEL`.

## Deploy

Suba este `server/` em qualquer host Node (Render, Railway, Fly, VM) com `ANTHROPIC_API_KEY` (e `GEMINI_API_KEY` p/ imagens) setadas, e ajuste `AI_ENDPOINT`/`NANO_ENDPOINT` no `gen-studio.html` para a URL pública.
