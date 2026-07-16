/* ============================================================================
   NAOWEE ORGANISMOS — RECORRIDO GUIADO por HU (ORG-01..ORG-08)            v1.0.0
   Capa de ayuda ADITIVA (no toca la lógica de las páginas): por cada historia
   de usuario muestra TAREA + PROPÓSITO + spotlight de dónde hacer clic + "Paso
   N de M". Un lanzador flotante indexa las HU por FASE del flujo; al elegir una,
   navega a su pantalla+rol (full reload, patrón Naowee) y corre los pasos.
   Auto-arranque por ?tour=ORG-NN. Verificación de cumplimiento de HU con Diego.
   Portado del patrón canónico suite-web-territorio/shared/tour.js (naowee-guided-tour).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__orgTour) return; window.__orgTour = true;

  function qs(k) { return new URLSearchParams(location.search).get(k); }
  /* No montar dentro del iframe del hub (variante embed). */
  if (qs('embed') === '1' || document.body.getAttribute('data-embed') === '1') return;

  var MODE_KEY = 'naowee-organismos-demo-mode';
  var ROLE = qs('role') || 'MINDEPORTE';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase() || 'jerarquia.html';

  /* ── Catálogo de tours por HU (las 8 historias del visual mapping) ── */
  var TOURS = {
    'ORG-01': {
      ph: '1 · Registro y jerarquía', page: 'registro.html', role: 'MINDEPORTE',
      title: 'Registrar un Comité (cabeza de sector)',
      purpose: 'Solo el Ministerio crea los Comités; son el nivel raíz del SND y quedan Activos sin aprobación superior.',
      steps: [
        { sel: '.reg-tipo-card[data-tipo="comite"]', body: 'Como Ministerio, el único tipo que registras es <b>Comité</b>. Selecciónalo para empezar.' },
        { sel: '#regStepper', body: 'El <b>flujo por pasos</b> se adapta al tipo elegido: datos del comité, representante legal, sede y documentos.' },
        { sel: '#regFooter', body: 'Avanza con <b>Comenzar</b> y al final <b>Enviar registro</b>: el comité queda <b>Activo</b> y aparece como raíz en la jerarquía.' }
      ]
    },
    'ORG-02': {
      ph: '1 · Registro y jerarquía', page: 'cargue.html', role: 'COMITE', demo: true,
      title: 'Pre-registrar federaciones (cargue masivo)',
      purpose: 'Cada Comité pre-registra por plantilla a las federaciones de su sector; quedan Preinscritas para completar su registro (cascada del Ministerio).',
      steps: [
        { sel: '#cgTpl', body: 'Descarga la <b>plantilla oficial</b> (.xlsx, 22 columnas). No cambies los encabezados ni el nombre de las hojas.' },
        { sel: '#cgDrop', body: 'Arrastra el archivo diligenciado: se valida <b>fila por fila</b> con vista previa; las filas con error no se crean (carga parcial).' }
      ]
    },
    'ORG-03': {
      ph: '1 · Registro y jerarquía', page: 'cargue.html', role: 'FEDERACION', demo: true,
      title: 'Pre-registrar ligas (cargue masivo)',
      purpose: 'La Federación pre-registra por plantilla a sus ligas por deporte; quedan Preinscritas bajo su jurisdicción y ella misma las validará.',
      steps: [
        { sel: '#cgTpl', body: 'Descarga la <b>plantilla</b> de ligas. Cada nivel carga masivamente al que depende de él.' },
        { sel: '#cgDrop', body: 'Carga el archivo: las filas válidas quedan <b>Preinscritas</b> como ligas de tu federación y aparecen en la jerarquía.' }
      ]
    },
    'ORG-04': {
      ph: '1 · Registro y jerarquía', page: 'registro.html', role: 'LIGA', demo: true,
      title: 'Registrar un Club deportivo',
      purpose: 'El club se registra bajo su liga adjuntando el reconocimiento del ente municipal; queda Preinscrito hasta que la Liga lo valide.',
      steps: [
        { sel: '.reg-tipo-card[data-tipo="club"]', body: 'Elige el tipo <b>Club</b>. El formulario pedirá su <b>liga</b>, el tipo de club y la sede con geolocalización.' },
        { sel: '#regStepper', body: 'Recorre los pasos del <b>club</b>: datos, representante legal, sede y documentos (reconocimiento del ente municipal).' },
        { sel: '#regFooter', body: 'Al enviar, el club queda <b>Preinscrito</b> bajo su liga; desde ahí la Liga lo aprueba y podrá inscribir deportistas.' }
      ]
    },
    'ORG-05': {
      ph: '2 · Afiliación del deportista', page: 'afiliacion.html', role: 'DEPORTISTA', demo: true, q: { id: 'DEP-009' },
      title: 'Solicitar afiliación a un club',
      purpose: 'Un deportista autodeclarado busca un club Activo y envía su solicitud; al aprobarla el club, hereda automáticamente su liga y federación (ORG-05).',
      steps: [
        { sel: '#heroAsociar', body: 'Estás <b>autodeclarado</b> (sin club). Pulsa <b>Asociar a club</b> para iniciar tu solicitud.', click: true },
        { sel: '#afSearch', body: 'Escribe al menos <b>3 letras</b> del nombre o el NIT del club (prueba con <b>“cali”</b>). Solo aparecen clubes en estado <b>Activo</b>.' },
        { sel: '#afResults, #afBody', body: 'Elige un club del resultado: se muestra la <b>vista previa de la herencia</b> (liga y federación que recibirás). Si no aparece, se avisa “club no encontrado”.' },
        { sel: '#afSend', body: 'Envía la solicitud: queda <b>pendiente de confirmación</b> del club, con notificación por email y app en cada cambio.' }
      ]
    },
    'ORG-06': {
      ph: '3 · Aprobación y delegación', page: 'bandeja.html', role: 'COMITE', demo: true,
      title: 'Aprobar una federación (doble validación)',
      purpose: 'Cada organismo aprueba a su nivel inmediato inferior; la federación exige doble validación (Ministerio + Comité) y nadie aprueba si no está Activo.',
      steps: [
        { sel: '#bjFilters', body: 'La pestaña <b>Accionables</b> filtra las federaciones <b>En revisión</b> pendientes de tu decisión.' },
        { sel: 'button[data-open]', body: 'Abre una federación para <b>revisar</b> sus documentos y el estado de la <b>doble validación</b> (Ministerio + Comité).', click: true },
        { sel: '#bjApr', body: 'Confirma con <b>Aprobar</b> (o Rechazar / Solicitar corrección con motivo). Al completarse ambas validaciones, la federación queda <b>Activa</b>.' }
      ]
    },
    'ORG-08': {
      ph: '3 · Aprobación y delegación', page: 'bandeja.html', role: 'CLUB', demo: true,
      title: 'Confirmar la afiliación de un deportista',
      purpose: 'El Club es un organismo delegado: es el único que confirma la afiliación de sus deportistas y solo gestiona lo de su jurisdicción (gestión descentralizada).',
      steps: [
        { sel: '#bjFilters', body: 'Tus solicitudes llegan agrupadas. <b>Pendientes</b> son las que esperan tu confirmación.' },
        { sel: 'button[data-openafil]', body: 'Abre una solicitud para ver el <b>perfil del deportista</b> y decidir.', click: true },
        { sel: '#afApr', body: 'Al <b>Aprobar</b>, el deportista queda <b>Vinculado</b> y hereda automáticamente tu liga y federación. Toda acción queda trazada.' }
      ]
    },
    'ORG-07': {
      ph: '4 · Estados y trazabilidad', page: 'organismo-detalle.html', role: 'MINDEPORTE', demo: true, q: { id: 'FED-040' },
      title: 'Estados del organismo y trazabilidad',
      purpose: 'Cada organismo tiene un ciclo de vida de estados con auditoría completa: quién, cuándo, de qué estado a cuál y con qué motivo.',
      steps: [
        { sel: '#odTabs', body: 'El perfil del organismo agrupa su información en pestañas. Su <b>estado</b> vigente se ve en el encabezado y en <b>Información</b>.' },
        { sel: '#odTabs .naowee-tab[data-tab="hist"]', body: 'Abre <b>Historial</b>: la <b>trazabilidad</b> lista cada cambio de estado con responsable, fecha y motivo.', click: true },
        { sel: '#odPanel', body: 'Cada línea registra la <b>transición</b> (estado anterior → nuevo). Todo cambio genera notificación al organismo (email + app).' }
      ]
    }
  };
  var ORDER = ['ORG-01', 'ORG-02', 'ORG-03', 'ORG-04', 'ORG-05', 'ORG-06', 'ORG-08', 'ORG-07'];

  /* ── Estado ── */
  var curHu = null, curStep = 0, _retry = null, _stepActed = false, _curEl = null, _spotFresh = false;

  /* ── CSS (glass Naowee · Inter · acento naranja del módulo) ── */
  function injectCSS() {
    if (document.getElementById('orgTourCSS')) return;
    var st = document.createElement('style'); st.id = 'orgTourCSS';
    st.textContent =
      '.tt-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(20,22,38,.52);z-index:9000;pointer-events:none;transition:top .25s,left .25s,width .25s,height .25s;border:2px solid var(--accent,#d74009);}' +
      '.tt-coach{position:fixed;z-index:9002;width:346px;max-width:calc(100vw - 28px);background:#fff;border-radius:18px;box-shadow:0 24px 60px -16px rgba(20,22,38,.42);pointer-events:auto;overflow:hidden;font-family:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;}' +
      '.tt-coach-h{display:flex;align-items:center;gap:8px;padding:14px 16px 0;}' +
      '.tt-chip{font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--accent,#d74009);background:var(--accent-bg,#fff3e6);padding:3px 9px;border-radius:999px;text-transform:uppercase;}' +
      '.tt-phase{font-size:10.5px;font-weight:600;color:var(--text-secondary,#8a8ba3);}' +
      '.tt-x{margin-left:auto;background:none;border:0;cursor:pointer;color:#9aa3af;font-size:20px;line-height:1;padding:2px 4px;border-radius:8px;}' +
      '.tt-x:hover{color:var(--text-primary,#282834);background:#f3f4f8;}' +
      '.tt-title{font-size:16.5px;font-weight:800;color:var(--text-primary,#282834);padding:9px 16px 0;letter-spacing:-.2px;line-height:1.25;}' +
      '.tt-purpose{font-size:12px;color:var(--text-secondary,#646587);padding:5px 16px 0;line-height:1.45;}' +
      '.tt-body{font-size:13.5px;color:var(--text-primary,#282834);padding:12px 16px 0;line-height:1.5;}' +
      '.tt-body b{color:var(--accent,#d74009);font-weight:700;}' +
      '.tt-f{display:flex;align-items:center;gap:8px;padding:14px 16px 16px;margin-top:10px;border-top:1px solid var(--border,#e7e9f3);}' +
      '.tt-count{font-size:11.5px;font-weight:700;color:var(--text-secondary,#9aa3af);}' +
      '.tt-btns{margin-left:auto;display:flex;gap:8px;}' +
      '.tt-btn{font-family:inherit;font-size:12.5px;font-weight:700;border-radius:10px;padding:8px 15px;cursor:pointer;color:var(--text-primary,#282834);background:#fff;border:1px solid var(--border-dark,#d0d4e6);transition:background .14s,border-color .14s,box-shadow .14s;}' +
      '.tt-btn:hover{background:#f6f7fb;border-color:#bcc2d8;}' +
      '.tt-btn--p{color:#fff;border:1px solid transparent;background:var(--accent,#d74009);box-shadow:0 6px 16px -6px rgba(215,64,9,.5);}' +
      '.tt-btn--p:hover{background:var(--accent,#d74009);box-shadow:0 10px 24px -6px rgba(215,64,9,.55);}' +
      '.tt-launch{position:fixed;right:20px;bottom:62px;z-index:8000;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border,#e7e9f3);border-radius:999px;padding:9px 16px;font-family:"Inter",sans-serif;font-size:12.5px;font-weight:700;color:var(--accent,#d74009);cursor:pointer;box-shadow:0 8px 24px -10px rgba(20,22,38,.28);transition:box-shadow .16s,transform .16s;}' +
      '.tt-launch:hover{box-shadow:0 12px 30px -10px rgba(20,22,38,.38);transform:translateY(-1px);}' +
      '.tt-launch svg{color:var(--accent,#d74009);}' +
      '.tt-panel{position:fixed;right:20px;bottom:110px;z-index:8001;width:320px;max-height:70vh;overflow:auto;background:#fff;border:1px solid var(--border,#e7e9f3);border-radius:16px;box-shadow:0 20px 50px -14px rgba(20,22,38,.34);padding:8px;display:none;font-family:"Inter",sans-serif;}' +
      '.tt-panel.open{display:block;}' +
      '.tt-panel-h{font-size:13px;font-weight:800;color:var(--text-primary,#282834);padding:8px 10px 2px;}' +
      '.tt-panel-sub{font-size:11px;color:var(--text-secondary,#646587);padding:0 10px 8px;line-height:1.4;}' +
      '.tt-grp{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary,#9aa3af);padding:12px 10px 4px;}' +
      '.tt-item{width:100%;display:flex;align-items:center;gap:9px;background:none;border:0;cursor:pointer;padding:8px 10px;border-radius:10px;text-align:left;font-family:inherit;}' +
      '.tt-item:hover{background:var(--accent-bg,#fff3e6);}' +
      '.tt-item-code{font-size:9.5px;font-weight:800;color:var(--accent,#d74009);background:var(--accent-bg,#fff3e6);border-radius:6px;padding:3px 6px;flex-shrink:0;min-width:52px;text-align:center;letter-spacing:.02em;}' +
      '.tt-item-t{font-size:12.5px;font-weight:600;color:var(--text-primary,#282834);line-height:1.3;}' +
      '@media (prefers-reduced-motion:reduce){.tt-spot{transition:none;}.tt-launch:hover{transform:none;}}' +
      '@media (max-width:760px){.tt-launch{left:14px;right:auto;bottom:16px;}.tt-panel{left:14px;right:auto;bottom:64px;width:calc(100vw - 28px);max-width:320px;}.tt-coach{left:50%!important;transform:translateX(-50%);bottom:14px!important;top:auto!important;}}';
    document.head.appendChild(st);
  }

  /* ── Lanzador + panel (índice de HU por fase del flujo) ── */
  function renderLauncher() {
    if (document.getElementById('ttLaunch')) return;
    var b = document.createElement('button'); b.id = 'ttLaunch'; b.className = 'tt-launch'; b.type = 'button';
    b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5" fill="currentColor" stroke="none"/></svg>Recorrido por HU';
    b.onclick = function (e) { e.stopPropagation(); togglePanel(); };
    var p = document.createElement('div'); p.id = 'ttPanel'; p.className = 'tt-panel'; p.setAttribute('role', 'menu');
    var groups = {}, gOrder = [];
    ORDER.forEach(function (h) { var t = TOURS[h]; if (!groups[t.ph]) { groups[t.ph] = []; gOrder.push(t.ph); } groups[t.ph].push(h); });
    var html = '<div class="tt-panel-h">Recorrido guiado por historia de usuario</div>'
      + '<div class="tt-panel-sub">Cada paso indica la tarea, su propósito y dónde hacer clic. Cambia de rol y de pantalla solo.</div>';
    gOrder.forEach(function (ph) {
      html += '<div class="tt-grp">' + ph + '</div>';
      groups[ph].forEach(function (h) {
        html += '<button class="tt-item" data-hu="' + h + '" role="menuitem"><span class="tt-item-code">' + h + '</span><span class="tt-item-t">' + TOURS[h].title + '</span></button>';
      });
    });
    p.innerHTML = html;
    document.body.appendChild(b); document.body.appendChild(p);
    p.querySelectorAll('.tt-item').forEach(function (it) {
      it.onclick = function (e) { e.stopPropagation(); togglePanel(false); start(it.dataset.hu); };
    });
    document.addEventListener('click', function (e) {
      var pan = document.getElementById('ttPanel');
      if (pan && pan.classList.contains('open') && !pan.contains(e.target) && e.target.id !== 'ttLaunch' && !(e.target.closest && e.target.closest('#ttLaunch'))) { pan.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }
    });
  }
  function togglePanel(force) {
    var p = document.getElementById('ttPanel'), b = document.getElementById('ttLaunch'); if (!p) return;
    var open = force === false ? false : (force === true ? true : !p.classList.contains('open'));
    p.classList.toggle('open', open);
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* ── Arranque de un tour (navega si hace falta) ── */
  function buildUrl(t, hu) {
    var p = new URLSearchParams();
    p.set('role', t.role);
    if (t.q) Object.keys(t.q).forEach(function (k) { p.set(k, t.q[k]); });
    p.set('tour', hu);
    return t.page + '?' + p.toString();
  }
  function runTour(hu) { var t = TOURS[hu]; if (!t) return; curHu = hu; curStep = 0; _stepActed = false; _spotFresh = true; renderStep(); }
  function start(hu) {
    var t = TOURS[hu]; if (!t) return;
    /* Los tours con datos corren en modo demo (siembra) para que los targets existan. */
    if (t.demo) { try { localStorage.setItem(MODE_KEY, 'demo'); } catch (e) {} }
    var needNav = PAGE !== t.page || t.demo || ROLE !== t.role || (t.q && Object.keys(t.q).length);
    if (needNav) { location.href = buildUrl(t, hu); return; }
    runTour(hu);
  }

  /* ── Render de un paso (con reintento para targets dentro de modales) ── */
  function findTarget(sel) {
    var els = sel.split(',').map(function (s) { return s.trim(); });
    for (var i = 0; i < els.length; i++) {
      var el = document.querySelector(els[i]);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }
  function renderStep() {
    var t = TOURS[curHu]; if (!t) return; var step = t.steps[curStep];
    clearTimeout(_retry);
    var tries = 0;
    (function locate() {
      var el = findTarget(step.sel);
      if (el || tries > 14) { paint(t, step, el); return; }
      tries++; _retry = setTimeout(locate, 110);
    })();
  }
  function paint(t, step, el) {
    var spot = document.getElementById('ttSpot') || mk('div', 'tt-spot', 'ttSpot');
    var coach = document.getElementById('ttCoach') || mk('div', 'tt-coach', 'ttCoach');
    var last = curStep === t.steps.length - 1;
    _curEl = el || null;
    if (el) {
      placeSpot(spot, el);
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      setTimeout(function () { if (curHu && _curEl === el && document.body.contains(el)) { placeSpot(spot, el); positionCoach(coach, el); } }, 280);
      if (step.click) { el.addEventListener('click', function onc() { _stepActed = true; }, { once: true }); }
    } else {
      spot.style.display = 'none';
    }
    coach.innerHTML =
      '<div class="tt-coach-h"><span class="tt-chip">' + curHu + '</span><span class="tt-phase">' + t.ph + '</span><button class="tt-x" aria-label="Cerrar recorrido">&times;</button></div>'
      + '<div class="tt-title">' + t.title + '</div>'
      + '<div class="tt-purpose">' + t.purpose + '</div>'
      + '<div class="tt-body">' + step.body + '</div>'
      + '<div class="tt-f"><span class="tt-count">Paso ' + (curStep + 1) + ' de ' + t.steps.length + '</span>'
      + '<div class="tt-btns">'
      + (curStep > 0 ? '<button class="tt-btn" data-a="prev">Anterior</button>' : '')
      + '<button class="tt-btn tt-btn--p" data-a="' + (last ? 'done' : 'next') + '">' + (last ? 'Finalizar' : 'Siguiente') + '</button>'
      + '</div></div>';
    positionCoach(coach, el);
    coach.querySelector('.tt-x').onclick = endTour;
    coach.querySelectorAll('[data-a]').forEach(function (btn) {
      btn.onclick = function () {
        var a = btn.dataset.a;
        if (a === 'prev') { _stepActed = false; curStep = Math.max(0, curStep - 1); renderStep(); return; }
        if (a === 'done') { endTour(); return; }
        var s = t.steps[curStep];
        if (s.click && !_stepActed) {
          var tgt = findTarget(s.sel);
          if (tgt) { _stepActed = true; try { tgt.click(); } catch (e) {} setTimeout(function () { _stepActed = false; curStep = Math.min(t.steps.length - 1, curStep + 1); renderStep(); }, 420); return; }
        }
        _stepActed = false; curStep = Math.min(t.steps.length - 1, curStep + 1); renderStep();
      };
    });
  }
  function placeSpot(spot, el) {
    /* Resalta la caja VISIBLE del control (input-wrap/dropdown/tab), no el <input> crudo → calza el ancho. */
    var box = el.closest('.naowee-searchbox__input-wrap, .naowee-searchbox, .naowee-textfield__input-wrap, .naowee-textfield, .naowee-dropdown') || el;
    var r = box.getBoundingClientRect(), pad = 4;
    var br = getComputedStyle(box).borderTopLeftRadius || '8px', radius;
    if (br.indexOf('%') >= 0) radius = '50%';
    else { var n = parseFloat(br) || 0; radius = (n > 0 ? n + pad : 8) + 'px'; }
    spot.style.display = 'block';
    /* Primera aparición del tour: colocar SIN transición (no "vuela" desde la esquina);
       los pasos siguientes sí deslizan suavemente entre controles. */
    if (_spotFresh) spot.style.transition = 'none';
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
    spot.style.borderRadius = radius;
    if (_spotFresh) { void spot.offsetWidth; spot.style.transition = ''; _spotFresh = false; }
  }
  function reposition() {
    if (!curHu) return;
    var coach = document.getElementById('ttCoach'), spot = document.getElementById('ttSpot');
    if (!coach) return;
    if (_curEl && document.body.contains(_curEl) && _curEl.offsetParent !== null) {
      if (spot) placeSpot(spot, _curEl);
      positionCoach(coach, _curEl);
    } else if (spot) { spot.style.display = 'none'; positionCoach(coach, null); }
  }
  function positionCoach(coach, el) {
    coach.style.display = 'block';
    var cw = 346, ch = coach.offsetHeight || 260, m = 14;
    var top, left;
    if (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom + ch + m < window.innerHeight) top = r.bottom + m;
      else if (r.top - ch - m > 0) top = r.top - ch - m;
      else top = Math.max(m, (window.innerHeight - ch) / 2);
      left = Math.min(Math.max(m, r.left), window.innerWidth - cw - m);
    } else {
      top = (window.innerHeight - ch) / 2; left = (window.innerWidth - cw) / 2;
    }
    coach.style.top = top + 'px'; coach.style.left = left + 'px';
  }
  function mk(tag, cls, id) { var e = document.createElement(tag); e.className = cls; e.id = id; document.body.appendChild(e); return e; }
  function endTour() {
    clearTimeout(_retry); curHu = null; _curEl = null; _spotFresh = false;
    ['ttSpot', 'ttCoach'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    if (qs('tour')) { var u = new URL(location.href); u.searchParams.delete('tour'); history.replaceState(null, '', u); }
  }
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && curHu) endTour(); });

  /* ── Boot ── */
  function boot() {
    injectCSS(); renderLauncher();
    var auto = qs('tour');
    if (auto && TOURS[auto]) setTimeout(function () { runTour(auto); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
