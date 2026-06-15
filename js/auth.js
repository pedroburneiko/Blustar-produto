// auth.js — gate de login "Entrar com Google" (Gmail). Extraído de index.html (Fase 3).
// IIFE self-contained: lê window.__praiaClient; expõe window.__blustarLogout / __blustarUser.
(function () {
  // >>> COLE AQUI O SEU GOOGLE CLIENT ID (termina em .apps.googleusercontent.com) <<<
  const GOOGLE_CLIENT_ID = '440481101923-goe0aisoqf2ld3e6dammsnre2ft0qr1t.apps.googleusercontent.com';
  const SESSION_KEY = 'blustar.auth.user';
  const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);

  const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
  const setSession = (u) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch {} };
  const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

  // Decodifica o payload do JWT (ID token) do Google p/ pegar nome/email/foto.
  const decodeJwt = (t) => {
    try {
      const b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(atob(b).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch { return null; }
  };

  // ---------- UI do gate ----------
  const gate = document.createElement('div');
  gate.id = 'blustar-auth-gate';
  // Fundo preto; box na cor das divs (--surface); tipografia nos tokens do DS (tk-*).
  gate.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:none;background:#000;font-family:var(--font, system-ui, sans-serif);color:var(--text,#fff)';
  gate.innerHTML = `
    <div class="bs-auth">
      <!-- ESQUERDA — login -->
      <div class="bs-auth-left">
        <div class="bs-auth-brand">
          <span id="blustar-gate-logo" data-ds-logo="full" style="display:inline-flex;align-items:center;color:var(--bs-cyan, #0FC4D5)"></span>
          <span class="bs-auth-lockup-div" aria-hidden="true"></span>
          <img class="bs-auth-lockup-logo" src="assets/PRAIA_BS_logo_White.svg" alt="PRAIA Brand System" />
        </div>
        <div class="bs-auth-body">
          <div class="world-eyebrow">Brand System</div>
          <h1 class="tk-xl bs-auth-h1">Entre no Brand System.</h1>
          <p class="tk-m bs-auth-sub">Nosso brand e design system da BluStar. Acesse com sua conta para começar.</p>
          <button type="button" id="blustar-google-btn" class="bs-auth-gbtn">
            <span class="bs-auth-gbtn-logo" aria-hidden="true"><svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg></span>
            <span>Continuar com Google</span>
          </button>
          <div id="blustar-auth-err" class="tk-xs" style="color:#ff8a8a;margin-top:14px;min-height:0"></div>
          <button type="button" id="blustar-dev-btn" class="bs-auth-dev">Entrar em modo DEV</button>
        </div>
      </div>
      <!-- DIREITA — imagem + carrossel -->
      <div class="bs-auth-right">
        <div class="bs-auth-photo" aria-hidden="true"></div>
      </div>
    </div>`;
  document.body.appendChild(gate);

  // Regra CSS p/ dimensionar o logo — sobrevive à re-injeção do svg que o app faz
  // na init (broadcastAllClient), que apagaria um style inline.
  const logoCss = document.createElement('style');
  logoCss.textContent = `
    #blustar-gate-logo svg{height:20px;width:auto;display:block}
    .bs-auth{display:grid;grid-template-columns:1fr 1fr;width:100vw;height:100vh;overflow:hidden}
    .bs-auth-left{position:relative;display:flex;flex-direction:column;padding:48px 56px;background:#000;min-width:0}
    .bs-auth-brand{display:flex;align-items:center;gap:14px}
    .bs-auth-lockup-div{width:1px;height:18px;background:var(--border-strong,rgba(255,255,255,0.25))}
    .bs-auth-lockup-logo{height:13px;width:auto;display:block;opacity:0.92}
    .bs-auth-body{margin:auto 0;width:100%;max-width:460px}
    .bs-auth-h1{color:var(--text,#fff);margin:0 0 18px;letter-spacing:-0.02em}
    .bs-auth-sub{color:var(--text-3,rgba(255,255,255,0.48));margin:0 0 36px;max-width:400px}
    .bs-auth-gbtn{display:inline-flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:400px;box-sizing:border-box;padding:14px 22px;border:1px solid var(--border-strong,rgba(255,255,255,0.18));border-radius:var(--r-full,999px);background:#0b0b0c;color:#fff;font:var(--type-m-weight,500) var(--type-m-size,16px)/1 var(--font);letter-spacing:-0.01em;cursor:pointer;transition:background .15s var(--ease,ease),border-color .15s,transform .04s}
    .bs-auth-gbtn:hover{background:#1c1c1f;border-color:rgba(255,255,255,0.3)}
    .bs-auth-gbtn:active{transform:translateY(1px)}
    .bs-auth-gbtn-logo{display:inline-flex;width:18px;height:18px}
    .bs-auth-gbtn-logo svg{width:18px;height:18px;display:block}
    .bs-auth-dev{display:inline-block;margin-top:16px;padding:6px 2px;background:none;border:0;color:var(--text-3,rgba(255,255,255,0.48));font:var(--type-s-weight,500) var(--type-s-size,11px)/1 var(--font);letter-spacing:0.04em;text-transform:uppercase;cursor:pointer;transition:color .15s}
    .bs-auth-dev:hover{color:var(--text-2,rgba(255,255,255,0.72))}
    .bs-auth-foot{color:var(--text-3,rgba(255,255,255,0.4));letter-spacing:0.08em;text-transform:uppercase}
    .bs-auth-right{position:relative;overflow:hidden;background:#000}
    .bs-auth-photo{position:absolute;top:20px;right:20px;bottom:20px;left:0;border-radius:var(--r-lg,24px);background:url('assets/Moto.png') center 20%/cover no-repeat}
    @media (max-width:880px){.bs-auth{grid-template-columns:1fr}.bs-auth-right{display:none}.bs-auth-left{padding:36px 28px}}
  `;
  document.head.appendChild(logoCss);

  // Injeta o LOGO REAL da marca (mesmo do sidebar, via client config do DS).
  try {
    if (window.__praiaClient && window.__praiaClient.read) {
      const c = window.__praiaClient.read();
      if (c && c.full) window.__praiaClient.broadcast('full', c.full);
    }
  } catch {}

  // Reflete o usuário logado (nome + foto/iniciais) na sidebar + liga o logout.
  const applyUserToSidebar = () => {
    const u = getSession(); if (!u) return;
    const nameEl = document.getElementById('blustar-user-name');
    const avEl = document.getElementById('blustar-user-avatar');
    if (nameEl && u.name) nameEl.textContent = u.name;
    if (avEl) {
      if (u.picture) { avEl.style.backgroundImage = `url('${u.picture}')`; avEl.textContent = ''; }
      else if (u.name) { avEl.textContent = u.name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase(); }
    }
  };
  const lo = document.getElementById('blustar-logout-btn');
  if (lo) {
    lo.addEventListener('click', () => window.__blustarLogout());
    lo.addEventListener('mouseenter', () => { lo.style.background = 'rgba(255,255,255,0.08)'; lo.style.color = 'var(--text, #fff)'; });
    lo.addEventListener('mouseleave', () => { lo.style.background = 'transparent'; lo.style.color = 'var(--text-3, #8a93a3)'; });
  }

  const showGate = () => { gate.style.display = 'block'; document.documentElement.style.overflow = 'hidden'; };
  const hideGate = () => { gate.style.display = 'none'; document.documentElement.style.overflow = ''; };
  const setErr = (m) => { const e = document.getElementById('blustar-auth-err'); if (e) e.textContent = m || ''; };

  const loginWith = (user) => { setSession(user); applyUserToSidebar(); hideGate(); };

  // Atalho DEV — entra sem Google (útil no preview do Claude / testes).
  document.getElementById('blustar-dev-btn')?.addEventListener('click', () => {
    loginWith({ name: 'Dev', email: 'dev@localhost', picture: '', dev: true });
  });

  // Logout exposto globalmente (chame window.__blustarLogout() p/ sair).
  window.__blustarLogout = () => { clearSession(); location.reload(); };
  window.__blustarUser = getSession;

  // ---------- Já logado? mantém conectado ----------
  if (getSession()) { applyUserToSidebar(); hideGate(); return; }

  // ---------- Fail-safe anti-lockout ----------
  // No site no ar, se o GOOGLE_CLIENT_ID ainda não foi configurado, NÃO bloqueia
  // (deixa aberto como antes) — assim ninguém fica trancado fora por engano.
  // Em localhost o gate aparece mesmo assim (tem o bypass de dev pra testar).
  if (GOOGLE_CLIENT_ID.startsWith('__SET_') && !isLocalhost) {
    console.warn('[BluStar] Login Google desativado: defina GOOGLE_CLIENT_ID para ativar o gate.');
    return;
  }

  // ---------- Não logado: mostra o gate ----------
  showGate();

  // Carrega o Google Identity Services e renderiza o botão "Entrar com Google".
  const initGoogle = () => {
    if (!window.google || !google.accounts || !google.accounts.id) return;
    if (GOOGLE_CLIENT_ID.startsWith('__SET_')) {
      setErr(isLocalhost ? 'Defina o GOOGLE_CLIENT_ID p/ ativar o login Google (use o bypass dev acima).' : 'Login indisponível: GOOGLE_CLIENT_ID não configurado.');
      return;
    }
    // One Tap — reconecta sem clique quem já autorizou (usa ID token / JWT).
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: true,
      callback: (resp) => {
        const p = decodeJwt(resp.credential);
        if (!p || !p.email) { setErr('Não foi possível ler sua conta Google.'); return; }
        loginWith({ name: p.name, email: p.email, picture: p.picture });
      }
    });
    google.accounts.id.prompt();
    // Botão custom "Continuar com Google" → fluxo OAuth token + userinfo.
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (resp) => {
        if (resp.error || !resp.access_token) { setErr('Não foi possível entrar com o Google.'); return; }
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: 'Bearer ' + resp.access_token }
          }).then(r => r.json());
          if (!info || !info.email) { setErr('Não foi possível ler sua conta Google.'); return; }
          loginWith({ name: info.name, email: info.email, picture: info.picture });
        } catch { setErr('Falha ao obter seus dados do Google.'); }
      }
    });
    const gbtn = document.getElementById('blustar-google-btn');
    if (gbtn) gbtn.addEventListener('click', () => { setErr(''); tokenClient.requestAccessToken(); });
  };

  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true; s.defer = true;
  s.onload = initGoogle;
  s.onerror = () => setErr('Falha ao carregar o login do Google (verifique a conexão/rede).');
  document.head.appendChild(s);
})();
