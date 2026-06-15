// media-cloudinary.js — cluster de mídia acoplado (Fase 3, regra: NÃO separar).
// 3 IIFEs que compartilham os helpers Cloudinary (__praiaCld*):
//   1) Replace video (.video-mod) — upload/troca + persistência via IndexedDB;
//   2) Foto (.tpl-img) — painel + galeria do servidor (Cloudinary);
//   3) Galeria de fotos do servidor (espelha a de vídeo, #grp-gallery).
// Expõe __praiaCld/CldReady/CldImageSrc/CldUploadImage/RehydrateVideos/
// RenderVideoGallery/ReplaceVideo/ActivePhoto/ClearPhoto/OpenPhotoPanel/
// ReplacePhoto/SetPhotoBg/RenderPhotoGallery. Consumidores: self (no cluster)
// ou handlers ?.() (hover-toolbar/AddModule). Carregado ANTES do state.js para
// preservar a ordem original (o bloco rodava no main, antes do restore).
/* Replace video on .video-mod hover-toolbar action — persists via IndexedDB so videos survive reload */
(() => {
  // Minimal IndexedDB helper for storing video Blobs keyed by an id
  const DB = 'praia-videos',
    STORE = 'blobs';
  const openDB = () =>
    new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  const idbPut = async (key, blob) => {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  };
  const idbGet = async key => {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  };

  // ---- Cloudinary: servidor de vídeo compartilhado (upload "unsigned") ----
  // PASSO ÚNICO: cole o nome do upload preset unsigned abaixo (Cloudinary →
  // Settings ⚙️ → Upload → Add upload preset → Signing Mode: Unsigned).
  // E ative "Resource list" em Settings → Security p/ a galeria listar a tag.
  // Com o preset vazio, o upload cai no armazenamento local (IndexedDB).
  const CLOUDINARY = {
    cloud: 'deov8cbbr',
    uploadPreset: 'blustar_unsigned', // unsigned preset (Pedro/deov8cbbr)
    tag: 'blustar_ds', // tag dos vídeos
    tagPhoto: 'blustar_ds_photo', // tag das fotos
  };
  const cldReady = () => !!CLOUDINARY.uploadPreset;
  const cldVideoSrc = (publicId, version) => `https://res.cloudinary.com/${CLOUDINARY.cloud}/video/upload/w_1600,c_limit,vc_h264,q_auto,f_mp4/v${version}/${publicId}.mp4`;
  const cldPoster = (publicId, version) => `https://res.cloudinary.com/${CLOUDINARY.cloud}/video/upload/w_640,c_limit,q_auto,f_auto/v${version}/${publicId}.jpg`;
  const cldUpload = async file => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY.uploadPreset);
    fd.append('tags', CLOUDINARY.tag);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/video/upload`, { method: 'POST', body: fd });
    const data = await r.json();
    if (!data || !data.public_id) throw new Error((data && data.error && data.error.message) || 'Falha no upload');
    return data; // { public_id, version, secure_url, ... }
  };
  const cldList = async () => {
    try {
      const r = await fetch(`https://res.cloudinary.com/${CLOUDINARY.cloud}/video/list/${CLOUDINARY.tag}.json`, { cache: 'no-store' });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.resources || []).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    } catch {
      return [];
    }
  };
  // ---- Imagens: mesma lógica do vídeo (upload unsigned + listagem por tag) ----
  const cldImageSrc = (publicId, version) => `https://res.cloudinary.com/${CLOUDINARY.cloud}/image/upload/w_1600,c_limit,q_auto,f_auto/v${version}/${publicId}`;
  const cldImageThumb = (publicId, version) => `https://res.cloudinary.com/${CLOUDINARY.cloud}/image/upload/w_400,c_limit,q_auto,f_auto/v${version}/${publicId}`;
  const cldUploadImage = async file => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY.uploadPreset);
    fd.append('tags', CLOUDINARY.tagPhoto);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/image/upload`, { method: 'POST', body: fd });
    const data = await r.json();
    if (!data || !data.public_id) throw new Error((data && data.error && data.error.message) || 'Falha no upload');
    return data;
  };
  const cldListImages = async () => {
    try {
      const r = await fetch(`https://res.cloudinary.com/${CLOUDINARY.cloud}/image/list/${CLOUDINARY.tagPhoto}.json`, { cache: 'no-store' });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.resources || []).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    } catch {
      return [];
    }
  };
  // Expõe os helpers de imagem para o IIFE de foto (escopo separado).
  window.__praiaCldReady = cldReady;
  window.__praiaCldUploadImage = cldUploadImage;
  window.__praiaCldImageSrc = cldImageSrc;
  window.__praiaCld = { ready: cldReady, listImages: cldListImages, imageSrc: cldImageSrc, imageThumb: cldImageThumb, uploadImage: cldUploadImage };

  const applyVideoSrc = (mod, url) => {
    const v = mod.querySelector('video');
    if (!v) return;
    v.src = url;
    v.muted = mod.dataset.muted !== 'false';
    v.loop = mod.dataset.loop !== 'false';
    v.autoplay = mod.dataset.autoplay !== 'false';
    v.load();
    const playWhenReady = () => v.play?.().catch(() => {});
    v.addEventListener('loadeddata', playWhenReady, { once: true });
    if (v.autoplay) playWhenReady();
  };

  const selectedVideoMod = () => document.querySelector('.guide-page.active .video-mod.canvas-selected') || document.querySelector('.video-mod.canvas-selected');

  // Recebe um arquivo escolhido e aplica ao módulo. Sobe pro servidor (Cloudinary)
  // quando o preset está configurado; senão guarda local (IndexedDB) como fallback.
  const handlePickedVideo = async (mod, file) => {
    if (!mod || !file) return;
    if (cldReady()) {
      try {
        window.__praiaToast?.('Enviando vídeo ao servidor…');
        const up = await cldUpload(file);
        delete mod.dataset.vidId;
        const v = mod.querySelector('video');
        if (v) v.removeAttribute('poster');
        applyVideoSrc(mod, cldVideoSrc(up.public_id, up.version));
        window.__praiaToast?.('Vídeo publicado no servidor ✓');
        renderVideoGallery();
        window.__praiaAutosave?.();
        return;
      } catch (err) {
        console.warn('Cloudinary upload falhou — usando armazenamento local', err);
        window.__praiaToast?.('Servidor indisponível — salvo localmente');
      }
    }
    const id = mod.dataset.vidId || 'vid-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    mod.dataset.vidId = id;
    try {
      await idbPut(id, file);
    } catch (e) {
      console.warn('Video persist failed', e);
    }
    applyVideoSrc(mod, URL.createObjectURL(file));
    window.__praiaAutosave?.();
  };

  // Galeria de vídeos do servidor no inspector (+ tile "Subir novo").
  let __galleryBusy = false;
  const renderVideoGallery = async () => {
    const host = document.getElementById('grv-gallery');
    if (!host) return;
    const uploadBtn = `<button type="button" class="grv-upload-btn" id="grv-gupload" title="Subir novo vídeo"><span class="bs-icon" style="--bs-icon-size:16px">upload</span><span>Subir novo</span></button>`;
    // Rótulo de formato a partir das dimensões (16:9, 9:16, 1:1…) + container.
    const ratioLabel = (w, h) => {
      if (!w || !h) return '';
      const r = w / h;
      const known = [
        [16 / 9, '16:9'],
        [9 / 16, '9:16'],
        [1, '1:1'],
        [4 / 3, '4:3'],
        [3 / 4, '3:4'],
        [4 / 5, '4:5'],
        [21 / 9, '21:9'],
      ];
      let best = known[0],
        bd = Infinity;
      for (const k of known) {
        const d = Math.abs(k[0] - r);
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return bd < 0.06 ? best[1] : `${w}×${h}`;
    };
    const wireUpload = () => {
      document.getElementById('grv-gupload')?.addEventListener('click', () => {
        const mod = selectedVideoMod();
        if (mod) window.__praiaReplaceVideo(mod);
      });
    };
    const applyToMod = src => {
      const mod = selectedVideoMod();
      if (!mod || !src) return;
      delete mod.dataset.vidId;
      const v = mod.querySelector('video');
      if (v) v.removeAttribute('poster');
      applyVideoSrc(mod, src);
      window.__praiaAutosave?.();
    };
    // "Tirar do bloco": limpa o vídeo do módulo selecionado (volta ao vazio).
    const clearMod = () => {
      const mod = selectedVideoMod();
      if (!mod) return;
      delete mod.dataset.vidId;
      const v = mod.querySelector('video');
      if (v) {
        try {
          v.pause();
        } catch {}
        v.removeAttribute('poster');
        v.removeAttribute('src');
        try {
          v.load();
        } catch {}
      }
      window.__praiaAutosave?.();
    };
    const wireTiles = () => {
      host.querySelectorAll('.grv-gtile[data-src]').forEach(b => b.addEventListener('click', () => applyToMod(b.dataset.src)));
      host.querySelectorAll('.grv-rep[data-src]').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          applyToMod(b.dataset.src);
        })
      );
      host.querySelectorAll('.grv-del').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          clearMod();
        })
      );
    };
    if (!cldReady()) {
      host.innerHTML = uploadBtn + `<div class="grv-grid"><div class="grv-ghint">Configure o Cloudinary (preset) p/ publicar e listar os vídeos do servidor.</div></div>`;
      wireUpload();
      return;
    }
    if (__galleryBusy) return;
    __galleryBusy = true;
    host.innerHTML = uploadBtn + `<div class="grv-grid"><div class="grv-ghint">Carregando vídeos do servidor…</div></div>`;
    wireUpload();
    const items = await cldList();
    __galleryBusy = false;
    const cards = items
      .map(it => {
        const cap = [ratioLabel(it.width, it.height), String(it.format || '').toUpperCase()].filter(Boolean).join(' · ');
        const src = cldVideoSrc(it.public_id, it.version);
        return `<div class="grv-card"><div class="grv-tile-wrap"><button type="button" class="grv-gtile" data-src="${src}" style="background-image:url('${cldPoster(it.public_id, it.version)}')" title="${it.public_id}"></button><div class="grv-card-actions"><button type="button" class="grv-rep" data-src="${src}" title="Aplicar no bloco" aria-label="Aplicar no bloco"><span class="bs-icon" style="--bs-icon-size:15px">cached</span></button><button type="button" class="grv-del" title="Tirar do bloco" aria-label="Tirar do bloco"><span class="bs-icon" style="--bs-icon-size:15px">delete</span></button></div></div><span class="grv-cap">${cap}</span></div>`;
      })
      .join('');
    host.innerHTML = uploadBtn + `<div class="grv-grid">${cards || `<div class="grv-ghint">Nenhum vídeo no servidor ainda — suba o primeiro.</div>`}</div>`;
    wireUpload();
    wireTiles();
  };
  window.__praiaRenderVideoGallery = renderVideoGallery;

  window.__praiaRehydrateVideos = async () => {
    const mods = document.querySelectorAll('.video-mod[data-vid-id]');
    for (const mod of mods) {
      const id = mod.dataset.vidId;
      try {
        const blob = await idbGet(id);
        if (blob) applyVideoSrc(mod, URL.createObjectURL(blob));
      } catch {}
    }
  };

  // Inspector "Substituir vídeo" = a <label for="grv-file-input"> that opens the
  // native picker directly. Here we receive the chosen file and apply it to the
  // currently-selected video (persisted as a blob in IndexedDB).
  document.getElementById('grv-file-input')?.addEventListener('change', async e => {
    const input = e.target;
    const f = input.files && input.files[0];
    const mod = selectedVideoMod();
    if (f && mod) await handlePickedVideo(mod, f);
    input.value = '';
  });

  // Replace the video file. Create a FRESH <input> on every call and click it
  // synchronously inside the user gesture — the most reliable way to open the
  // native file picker (a persistent/hidden reused input was unreliable across
  // browsers). The input is removed after a pick or when focus returns.
  window.__praiaReplaceVideo = mod => {
    if (!mod) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(input);
    let done = false;
    const cleanup = () => {
      if (!input.isConnected) return;
      setTimeout(() => input.remove(), 0);
    };
    input.addEventListener('change', async () => {
      done = true;
      const f = input.files && input.files[0];
      if (f) await handlePickedVideo(mod, f);
      cleanup();
    });
    // If the user cancels the picker, clean up the orphan input on focus return.
    window.addEventListener('focus', function onFocus() {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!done) cleanup();
      }, 300);
    });
    input.click();
  };

  // Rehydrate on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.__praiaRehydrateVideos());
  } else {
    window.__praiaRehydrateVideos();
  }
})();

/* Foto (.tpl-img): mesma lógica do vídeo — painel + galeria do servidor (Cloudinary),
   upload ao servidor com fallback local, e troca por thumb/URL. */
(() => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  let activeImg = null;

  const setPhotoBg = (img, url) => {
    img.style.background = `url('${url}') center/cover no-repeat`;
    window.__praiaAutosave?.();
  };

  // Aplica um arquivo: sobe ao servidor (se configurado) ou cai no data URL local.
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    const img = activeImg;
    fileInput.value = '';
    if (!f || !img) return;
    if (window.__praiaCldReady?.()) {
      try {
        window.__praiaToast?.('Enviando foto ao servidor…');
        const up = await window.__praiaCldUploadImage(f);
        setPhotoBg(img, window.__praiaCldImageSrc(up.public_id, up.version));
        window.__praiaToast?.('Foto publicada no servidor ✓');
        window.__praiaRenderPhotoGallery?.();
        return;
      } catch (err) {
        console.warn('Cloudinary image upload falhou — usando local', err);
        window.__praiaToast?.('Servidor indisponível — salvo localmente');
      }
    }
    const reader = new FileReader();
    reader.onload = e => setPhotoBg(img, e.target.result);
    reader.readAsDataURL(f);
  });

  // Abre o picker para a foto ativa (usado pelo botão "Subir novo" da galeria).
  window.__praiaReplacePhoto = img => {
    activeImg = img || activeImg;
    if (activeImg) fileInput.click();
  };
  window.__praiaSetPhotoBg = setPhotoBg;
  window.__praiaActivePhoto = () => activeImg;
  // "Tirar do bloco": volta a foto ao placeholder vazio (sem imagem).
  window.__praiaClearPhoto = img => {
    const t = img || activeImg;
    if (!t) return;
    t.style.background = 'var(--surface-2)';
    window.__praiaAutosave?.();
  };

  const openPhotoPanel = img => {
    const right = document.querySelector('.guide-right');
    if (!right) return;
    activeImg = img;
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    window.__praiaCloseRightModes?.();
    right.classList.add('photo-mode');
    img.classList.add('canvas-selected');
    // URL atual (vazio se for data:/blob local)
    const urlField = document.getElementById('grp-url');
    if (urlField) {
      const m = (img.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
      const cur = m ? m[1] : '';
      urlField.value = /^https?:\/\//.test(cur) ? cur : '';
    }
    window.__praiaRenderPhotoGallery?.();
  };
  window.__praiaOpenPhotoPanel = openPhotoPanel;

  document.getElementById('grp-close')?.addEventListener('click', () => {
    document.querySelector('.guide-right')?.classList.remove('photo-mode');
    document.querySelectorAll('.tpl-img.canvas-selected').forEach(x => x.classList.remove('canvas-selected'));
    activeImg = null;
  });

  // Aplicar por URL/caminho digitado.
  const urlField = document.getElementById('grp-url');
  const applyUrl = () => {
    const v = urlField.value.trim();
    if (v && activeImg) setPhotoBg(activeImg, v);
  };
  urlField?.addEventListener('change', applyUrl);
  urlField?.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      applyUrl();
    }
  });
  urlField?.addEventListener('click', e => e.stopPropagation());

  // Clicar numa foto abre o painel (em vez de abrir o picker direto).
  document.addEventListener('click', e => {
    if (document.body.classList.contains('preview-mode') || document.body.classList.contains('ds-mode')) return;
    const img = e.target.closest('[data-world="guide"] .guide-page .tpl-img');
    if (!img) return;
    e.stopPropagation();
    openPhotoPanel(img);
  });
})();

/* Galeria de fotos do servidor — espelha a de vídeo (#grp-gallery). */
(() => {
  let busy = false;
  const renderPhotoGallery = async () => {
    const host = document.getElementById('grp-gallery');
    if (!host) return;
    const cld = window.__praiaCld;
    if (!cld) return;
    const uploadBtn = `<button type="button" class="grv-upload-btn" id="grp-gupload" title="Subir nova foto"><span class="bs-icon" style="--bs-icon-size:16px">upload</span><span>Subir novo</span></button>`;
    const ratioLabel = (w, h) => {
      if (!w || !h) return '';
      const r = w / h;
      const known = [
        [16 / 9, '16:9'],
        [9 / 16, '9:16'],
        [1, '1:1'],
        [4 / 3, '4:3'],
        [3 / 4, '3:4'],
        [4 / 5, '4:5'],
        [3 / 2, '3:2'],
        [2 / 3, '2:3'],
        [21 / 9, '21:9'],
      ];
      let best = known[0],
        bd = Infinity;
      for (const k of known) {
        const d = Math.abs(k[0] - r);
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return bd < 0.06 ? best[1] : `${w}×${h}`;
    };
    const wireUpload = () => {
      document.getElementById('grp-gupload')?.addEventListener('click', () => window.__praiaReplacePhoto(window.__praiaActivePhoto()));
    };
    const applyToImg = src => {
      const img = window.__praiaActivePhoto();
      if (!img || !src) return;
      window.__praiaSetPhotoBg(img, src);
    };
    const wireTiles = () => {
      host.querySelectorAll('.grv-gtile[data-src]').forEach(b => b.addEventListener('click', () => applyToImg(b.dataset.src)));
      host.querySelectorAll('.grv-rep[data-src]').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          applyToImg(b.dataset.src);
        })
      );
      host.querySelectorAll('.grv-del').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          window.__praiaClearPhoto?.(window.__praiaActivePhoto());
        })
      );
    };
    if (!cld.ready()) {
      host.innerHTML = uploadBtn + `<div class="grv-grid"><div class="grv-ghint">Configure o Cloudinary (preset) p/ publicar e listar as fotos do servidor.</div></div>`;
      wireUpload();
      return;
    }
    if (busy) return;
    busy = true;
    host.innerHTML = uploadBtn + `<div class="grv-grid"><div class="grv-ghint">Carregando fotos do servidor…</div></div>`;
    wireUpload();
    const items = await cld.listImages();
    busy = false;
    const cards = items
      .map(it => {
        const cap = [ratioLabel(it.width, it.height), String(it.format || '').toUpperCase()].filter(Boolean).join(' · ');
        const src = cld.imageSrc(it.public_id, it.version);
        return `<div class="grv-card"><div class="grv-tile-wrap"><button type="button" class="grv-gtile" data-src="${src}" style="background-image:url('${cld.imageThumb(it.public_id, it.version)}')" title="${it.public_id}"></button><div class="grv-card-actions"><button type="button" class="grv-rep" data-src="${src}" title="Aplicar no bloco" aria-label="Aplicar no bloco"><span class="bs-icon" style="--bs-icon-size:15px">cached</span></button><button type="button" class="grv-del" title="Tirar do bloco" aria-label="Tirar do bloco"><span class="bs-icon" style="--bs-icon-size:15px">delete</span></button></div></div><span class="grv-cap">${cap}</span></div>`;
      })
      .join('');
    host.innerHTML = uploadBtn + `<div class="grv-grid">${cards || `<div class="grv-ghint">Nenhuma foto no servidor ainda — suba a primeira.</div>`}</div>`;
    wireUpload();
    wireTiles();
  };
  window.__praiaRenderPhotoGallery = renderPhotoGallery;
})();
