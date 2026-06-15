// error-boundary.js — rede de segurança global no boot (Fase 5).
//
// Carregado PRIMEIRO (no <head>, antes de qualquer outro script) para capturar
// erros de auth/router/paste-sanitizer/state/principal. Faz duas coisas:
//   1) LOGA ALTO no console (prefixo destacado + stack) todo erro não tratado
//      e toda promise rejeitada sem catch;
//   2) mostra um fallback DISCRETO (faixa no rodapé) em vez de tela branca,
//      com ações de Recarregar e Resetar estado (?reset=1).
//
// Não interfere no fluxo normal: a faixa só aparece quando há erro de verdade.
(function () {
  var shown = false;
  var BANNER_ID = '__blustar_error_boundary';

  // Log alto e padronizado — fácil de achar no console mesmo no meio do ruído.
  function logLoud(kind, detail, errObj) {
    var line = '═══════════════════════════════════════════════════════════';
    try {
      console.error('%c' + line, 'color:#E63946');
      console.error('%c[BluStar] ⛔ ' + kind, 'color:#E63946;font-weight:bold;font-size:13px', detail || '');
      if (errObj && errObj.stack) console.error(errObj.stack);
      console.error('%c' + line, 'color:#E63946');
    } catch (e) {
      // console pode estar indisponível em ambientes exóticos — nunca relança.
    }
  }

  // Fallback discreto: faixa fixa no rodapé. Estilos 100% inline (não depende do
  // CSS do app, que pode ter sido justamente o que falhou). Mostrada uma vez só.
  function showFallback(summary) {
    if (shown) return;
    shown = true;
    var mount = function () {
      if (!document.body) {
        return setTimeout(mount, 50);
      }
      if (document.getElementById(BANNER_ID)) return;
      var bar = document.createElement('div');
      bar.id = BANNER_ID;
      bar.setAttribute('role', 'alert');
      bar.style.cssText = [
        'position:fixed',
        'left:16px',
        'right:16px',
        'bottom:16px',
        'z-index:2147483647',
        'display:flex',
        'align-items:center',
        'gap:14px',
        'padding:12px 16px',
        'border-radius:12px',
        'background:rgba(20,8,10,0.96)',
        'border:1px solid rgba(230,57,70,0.55)',
        'box-shadow:0 8px 28px rgba(0,0,0,0.5)',
        'font:500 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
        'color:#fff',
        'backdrop-filter:blur(8px)',
      ].join(';');
      var msg = document.createElement('div');
      msg.style.cssText = 'flex:1;min-width:0';
      msg.innerHTML = '<strong style="color:#ff9aa2">Algo deu errado ao carregar o workspace.</strong>' + '<br><span style="color:rgba(255,255,255,0.6)">Seu trabalho salvo está preservado. Detalhes no console (F12).</span>';
      var btnReload = document.createElement('button');
      btnReload.textContent = 'Recarregar';
      btnReload.style.cssText = 'flex:none;padding:8px 14px;border-radius:999px;border:0;background:#fff;color:#111;font:600 13px system-ui;cursor:pointer';
      btnReload.onclick = function () {
        location.reload();
      };
      var btnReset = document.createElement('button');
      btnReset.textContent = 'Resetar estado';
      btnReset.style.cssText = 'flex:none;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);background:transparent;color:#fff;font:500 13px system-ui;cursor:pointer';
      btnReset.onclick = function () {
        var u = location.origin + location.pathname + '?reset=1';
        location.href = u;
      };
      var close = document.createElement('button');
      close.setAttribute('aria-label', 'Dispensar');
      close.textContent = '✕';
      close.style.cssText = 'flex:none;padding:4px 8px;border:0;background:transparent;color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer';
      close.onclick = function () {
        bar.remove();
      };
      bar.appendChild(msg);
      bar.appendChild(btnReload);
      bar.appendChild(btnReset);
      bar.appendChild(close);
      document.body.appendChild(bar);
    };
    mount();
  }

  window.addEventListener(
    'error',
    function (e) {
      // Ignora erros de carregamento de recurso (img/script/link) — não são fatais
      // ao boot e geram muito ruído (ex.: GSI/Cloudinary offline).
      if (e && e.target && e.target !== window && e.target.tagName) {
        logLoud('Falha ao carregar recurso', e.target.src || e.target.href || e.target.tagName);
        return;
      }
      logLoud('Erro não tratado', e && e.message, e && e.error);
      showFallback(e && e.message);
    },
    true
  );

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e && e.reason;
    logLoud('Promise rejeitada sem catch', (reason && reason.message) || reason, reason);
    showFallback(reason && reason.message);
  });

  // Exposto para uso manual em try/catch de inicialização, se desejado.
  window.__blustarReportBootError = function (err, where) {
    logLoud('Erro de boot' + (where ? ' (' + where + ')' : ''), err && err.message, err);
    showFallback(err && err.message);
  };
})();
