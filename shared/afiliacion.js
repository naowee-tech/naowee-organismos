/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Perfil del deportista + afiliación (T7 · ORG-05)
   Clon 1:1 del perfil de Eventos (hero + grid 3 col + tabs + aside)
   reencuadrado al dominio de Organismos, MÁS la capa de afiliación:
   grupo "Afiliación" (Mi club / Solicitudes) en el nav, estado en el
   hero, CTA "Asociar a club" → modal de registro corto (§5.2:
   datos precargados no editables + buscador de clubes Activos ≥3
   chars + alerta club no encontrado → enviar solicitud), y herencia
   automática de la cadena liga/federación/comité (derivada de la
   jerarquía real). Home del rol DEPORTISTA.
   ═══════════════════════════════════════════════════════════════ */
import { mountSidebar, mountHeader, mountBackdrop, mountDemoSwitcher, getRoleFromQuery, getDemoMode, ROLES } from './sidebar.js';
import {
  seedDemoData, seedAfiliacionesDemo, getDeportista,
  buscarClubesActivos, crearSolicitud, retirarAfiliacion,
  solicitudDeDeportista, allSolicitudes, getOrganismo
} from './organismos-data.js';
import { buildDeportistaDetalle } from './deportista-detalle.js';

/* ── Iconos (stroke currentColor) ── */
const I = {
  id:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5 16c.8-1.5 2.3-2.5 4-2.5s3.2 1 4 2.5"/><line x1="15" y1="10" x2="18" y2="10"/><line x1="15" y1="13" x2="18" y2="13"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>',
  ruler:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l13 13 5-5L8 3z"/><path d="M7 7l2 2M11 5l1.5 1.5M11 11l2 2M15 9l1.5 1.5"/></svg>',
  weight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 7h11l2 13H4.5z"/><circle cx="12" cy="5" r="2.2"/></svg>',
  blood:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z"/></svg>',
  award:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  medal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.2 10 5 3M15.8 10 19 3M9 3h6"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  olimpico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="9" r="3.4"/><circle cx="12" cy="9" r="3.4"/><circle cx="18" cy="9" r="3.4"/><circle cx="9" cy="15" r="3.4"/><circle cx="15" cy="15" r="3.4"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  comite:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V10l8-5 8 5v11M9 21v-6h6v6"/></svg>',
  federacion:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 1-1h13l-2.5 4L18 11H5"/></svg>',
  liga:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9.5" r="2.6"/><path d="M15 20a5 5 0 0 1 7-4.6"/></svg>',
  club:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/></svg>'
};

const TIER = { olimpico:{label:'Olímpico',ico:I.olimpico}, profesional:{label:'Profesional',ico:I.medal}, juvenil:{label:'Juvenil',ico:I.user}, amateur:{label:'Amateur',ico:I.shield} };
const MEDAL_EMOJI = { Oro:'🥇', Plata:'🥈', Bronce:'🥉' };
const SOL_EMOJI = { Enviada:I.send, Aprobada:I.check, Rechazada:I.x, Retirada:I.refresh };
const CLUB_EMOJI = '🛡️';

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const toast = (text, type) => { if (window.naoweeToast) window.naoweeToast(text, type || 'success'); };

/* ── Rol + deportista (¿mi perfil o vista por ?id?) ── */
const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || {};
const params = new URLSearchParams(location.search);
const DEP_ID = params.get('id') || role.deportistaId || 'DEP-001';

let ATLETA = buildDeportistaDetalle(getDeportista(DEP_ID));
let activeSec = 'resumen';
let activeTab = 'datos';
let activeHist = 'trayectoria';

/* Estado de afiliación derivado. */
function affState() {
  const sol = solicitudDeDeportista(DEP_ID);
  if (ATLETA.estado === 'vinculado' && ATLETA.clubId) return { key: 'vinculado', sol };
  if (sol && sol.estado === 'Enviada') return { key: 'pendiente', sol };
  if (sol && sol.estado === 'Rechazada') return { key: 'rechazada', sol };
  return { key: 'autodeclarado', sol };
}

function refresh() {
  ATLETA = buildDeportistaDetalle(getDeportista(DEP_ID));
  render();
}

/* ── Medal strip (hero) ── */
function medalStripHTML() {
  const meds = ATLETA.medalleria;
  if (!meds.length) return `<div class="pf-medal-strip"><span class="pf-medal-strip__empty">Sin medallas aún</span></div>`;
  const orden = { Oro:0, Plata:1, Bronce:2 };
  const sorted = [...meds].sort((a, b) => orden[a.medalla] - orden[b.medalla]);
  const chips = sorted.slice(0, 5).map((m) => `<span class="pf-mchip pf-mchip--${m.medalla.toLowerCase()}" title="${esc(m.medalla)} · ${esc(m.evento)}">${MEDAL_EMOJI[m.medalla]}</span>`).join('');
  return `<div class="pf-medal-strip"><div class="pf-medal-strip__items">${chips}</div><span class="pf-medal-strip__count"><strong>${meds.length}</strong> ${meds.length === 1 ? 'medalla' : 'medallas'}</span></div>`;
}

/* ── Nav de secciones (dinámico según estado de afiliación) ── */
function navGroups() {
  const st = affState();
  const solCount = allSolicitudes().filter((s) => s.deportistaId === DEP_ID).length;
  const miclub = { id:'miclub', label:'Mi club', icon:I.club };
  if (st.key === 'pendiente') miclub.badge = '1';
  else if (st.key === 'autodeclarado' || st.key === 'rechazada') miclub.alert = true;
  const sol = { id:'solicitudes', label:'Solicitudes', icon:I.link };
  if (solCount) sol.badge = String(solCount);
  return [
    { label:'Perfil', items:[ { id:'resumen', label:'Resumen', icon:I.id }, { id:'documentos', label:'Documentos', icon:I.doc, badge:'1' } ] },
    { label:'Afiliación', items:[ miclub, sol ] },
    { label:'Deportivo', items:[ { id:'eventos', label:'Eventos', icon:I.cal }, { id:'historial', label:'Historial', icon:I.award } ] },
    { label:'Cuenta', items:[ { id:'config', label:'Configuraciones', icon:I.gear }, { id:'notif', label:'Notificaciones', icon:I.bell }, { id:'seguridad', label:'Seguridad', icon:I.shield, alert:true } ] }
  ];
}

/* ── Render principal ── */
function render() {
  const t = TIER[ATLETA.tier];
  const st = affState();
  document.getElementById('pfRoot').innerHTML = `
    <section class="pf-hero">
      <div class="pf-ava-wrap">
        <div class="pf-ava pf-ava--${ATLETA.tier}">${esc(ATLETA.avatar)}</div>
        <span class="pf-flag pf-flag--${ATLETA.nacionalidad.iso}" title="${esc(ATLETA.nacionalidad.pais)}"></span>
        <span class="pf-tier-ribbon pf-tier--${ATLETA.tier}">${t.ico} ${t.label}</span>
      </div>
      <div class="pf-id">
        <h1 class="pf-name">${esc(ATLETA.nombreCompleto)}</h1>
        <p class="pf-doc">${esc(ATLETA.doc.tipoCorto)} ${esc(ATLETA.doc.numero)}</p>
        <div class="pf-badges">
          <span class="pf-badge pf-badge--deporte"><span class="pf-badge__dot"></span>${ATLETA.deporteEmoji} ${esc(ATLETA.deporte)}</span>
          ${st.key === 'vinculado' ? `
            <span class="pf-badge pf-badge--club"><span class="pf-badge__dot"></span>${esc(ATLETA.clubNombre)}</span>
            <span class="pf-badge pf-badge--liga"><span class="pf-badge__dot"></span>${esc(ATLETA.ligaNombre || 'Liga')}</span>
            <span class="pf-badge pf-badge--federacion"><span class="pf-badge__dot"></span>${esc(ATLETA.federacionNombre || 'Federación')}</span>`
          : `<span class="pf-badge"><span class="pf-badge__dot"></span>Sin afiliación</span>`}
        </div>
      </div>
      <div class="pf-side">
        <div class="pf-aff-state">
          ${affStatePillHTML(st)}
          ${st.key !== 'vinculado' && st.key !== 'pendiente'
            ? `<button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" id="heroAsociar">${I.link} Asociar a club</button>`
            : ''}
        </div>
        ${st.key === 'vinculado' ? medalStripHTML() : ''}
      </div>
    </section>

    <div class="pf-grid">
      <nav class="pf-nav" id="pfNav">${navGroups().map((g) => `<div class="pf-nav__group">${g.label}</div>${g.items.map(navItem).join('')}`).join('')}</nav>
      <div class="pf-panel" id="pfPanel"></div>
      <aside class="pf-aside">${asideHTML()}</aside>
    </div>`;

  document.getElementById('pfNav').addEventListener('click', (e) => {
    const b = e.target.closest('.pf-nav__item'); if (!b) return;
    activeSec = b.dataset.sec; syncNav(); renderPanel();
  });
  document.getElementById('heroAsociar')?.addEventListener('click', openAsociarModal);
  renderPanel();
}

function affStatePillHTML(st) {
  const map = {
    vinculado: ['vinculado', I.check, 'Vinculado'],
    pendiente: ['pendiente', I.clock, 'Solicitud enviada'],
    rechazada: ['autodeclarado', I.user, 'Autodeclarado'],
    autodeclarado: ['autodeclarado', I.user, 'Autodeclarado']
  };
  const [cls, ico, label] = map[st.key];
  return `<span class="af-state-pill af-state-pill--${cls}">${ico}${label}</span>`;
}

function navItem(s) {
  const end = s.badge ? `<span class="pf-nav__badge pf-nav__badge--${/^\d+$/.test(s.badge) ? 'count' : 'new'}">${s.badge}</span>` : s.alert ? `<span class="pf-nav__alert">!</span>` : '';
  return `<button type="button" class="pf-nav__item ${s.id === activeSec ? 'is-active' : ''}" data-sec="${s.id}">${s.icon}<span>${s.label}</span>${end}</button>`;
}
function syncNav() { document.querySelectorAll('.pf-nav__item').forEach((b) => b.classList.toggle('is-active', b.dataset.sec === activeSec)); }

function asideHTML() {
  const b = ATLETA.biometria;
  const deg = Math.round(ATLETA.completitud * 3.6);
  const pend = ATLETA.documentos.filter((d) => !d.subido || d.estado === 'pendiente').length;
  return `
    <div class="pf-card">
      <h3 class="pf-card__title">Biometría</h3>
      <div class="pf-bio-grid">
        ${bioTile(I.ruler, 'Altura', b.altura, 'accent')}
        ${bioTile(I.weight, 'Peso', b.peso, 'blue')}
        ${bioTile(I.blood, 'Tipo de sangre', b.sangre, 'red')}
        ${bioTile(I.medal, 'IMC', b.imc, 'green')}
      </div>
    </div>
    <div class="pf-card pf-ring-card">
      <div class="pf-ring" style="background:conic-gradient(var(--accent) ${deg}deg, var(--border) ${deg}deg)"><div class="pf-ring__inner">${ATLETA.completitud}%</div></div>
      <div class="pf-ring-card__txt"><strong>Completitud del perfil</strong><span>${pend} dato${pend === 1 ? '' : 's'} pendiente${pend === 1 ? '' : 's'} por completar</span></div>
    </div>`;
}
function bioTile(ico, l, v, c) { return `<div class="pf-bio-tile pf-bio-tile--${c}"><span class="pf-bio-tile__ico">${ico}</span><span class="pf-bio-tile__v">${esc(v)}</span><span class="pf-bio-tile__l">${l}</span></div>`; }

/* ── Panel central por sección ── */
function renderPanel() {
  const p = document.getElementById('pfPanel');
  const dispatch = { resumen: resumenHTML, documentos: documentosHTML, miclub: miclubHTML, solicitudes: solicitudesHTML, eventos: eventosHTML, historial: historialHTML, config: configHTML, notif: notifHTML, seguridad: seguridadHTML };
  p.innerHTML = (dispatch[activeSec] || resumenHTML)();
  bindPanel();
}
function bindPanel() {
  const tabs = document.getElementById('pfTabs');
  if (tabs) tabs.addEventListener('click', (e) => { const t = e.target.closest('.naowee-tab'); if (!t) return; activeTab = t.dataset.tab; renderPanel(); });
  const ht = document.getElementById('pfHistTabs');
  if (ht) ht.addEventListener('click', (e) => { const t = e.target.closest('.naowee-tab'); if (!t) return; activeHist = t.dataset.tab; renderPanel(); });
  document.querySelectorAll('.pf-sw').forEach((sw) => sw.addEventListener('click', () => sw.classList.toggle('is-on')));
  document.querySelectorAll('#pfPanel .naowee-file-uploader').forEach((up) => {
    const inp = up.querySelector('input[type=file]');
    const dz = up.querySelector('.naowee-file-uploader__drop-zone');
    const handle = (file) => {
      if (!file) return;
      const doc = ATLETA.documentos.find((d) => d.nombre === up.dataset.doc);
      if (doc) { doc.subido = true; doc.estado = 'revision'; doc.sub = `Cargado: ${file.name} · en revisión`; }
      renderPanel();
    };
    if (inp) inp.addEventListener('change', () => handle(inp.files[0]));
    if (dz) {
      ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-drag-over'); }));
      ['dragleave', 'dragend'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('is-drag-over')));
      dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('is-drag-over'); handle(e.dataTransfer.files[0]); });
    }
  });
  if (activeSec === 'resumen') document.querySelector('#pfPanel .pf-edit')?.addEventListener('click', openEditModal);
  // Todos los CTA "asociar/buscar/reintentar" comparten data-asociar (evita ids duplicados).
  document.querySelectorAll('#pfPanel [data-asociar]').forEach((b) => b.addEventListener('click', openAsociarModal));
  document.getElementById('miclubCambiar')?.addEventListener('click', () => { retirarAfiliacion(DEP_ID); openAsociarModal(); });
  document.getElementById('miclubRetirar')?.addEventListener('click', () => { retirarAfiliacion(DEP_ID); toast('Afiliación retirada. Ahora eres un deportista autodeclarado.', 'info'); refresh(); });
  document.getElementById('miclubRetirarSol')?.addEventListener('click', () => { retirarAfiliacion(DEP_ID); toast('Solicitud retirada.', 'info'); refresh(); });
}

const fld = (l, v, full) => `<div class="pf-field ${full ? 'pf-field--full' : ''}"><div class="pf-field__l">${l}</div><div class="pf-field__v">${v || '—'}</div></div>`;
const head = (title, sub, actionHTML) => `<div class="pf-panel__head"><div><h2 class="pf-panel__title">${title}</h2>${sub ? `<p class="pf-panel__sub">${sub}</p>` : ''}</div>${actionHTML || ''}</div>`;

function resumenHTML() {
  const st = affState();
  const TABS = [['datos', 'Datos', I.id], ['ubicacion', 'Ubicación', I.pin], ['adicionales', 'Adicionales', I.medal], ['contacto', 'Contacto', I.phone]];
  const tabsBar = `<div class="pf-tabs-wrap"><div class="naowee-tabs" id="pfTabs" role="tablist">${TABS.map(([id, l, ic]) => `<button class="naowee-tab ${id === activeTab ? 'naowee-tab--selected' : ''}" data-tab="${id}" role="tab">${ic}${l}</button>`).join('')}</div></div>`;
  let body = '';
  if (activeTab === 'datos') body = `
    ${fld('Nombre', ATLETA.nombre)} ${fld('Segundo nombre', ATLETA.segundoNombre)}
    ${fld('Apellido', ATLETA.apellido)} ${fld('Segundo apellido', ATLETA.segundoApellido)}
    ${fld('Tipo de documento', ATLETA.doc.tipo)} ${fld('Número de documento', ATLETA.doc.numero)}
    ${fld('Sexo', ATLETA.sexo)} ${fld('Fecha de nacimiento', ATLETA.nacimiento)}
    ${fld('Edad', ATLETA.edad + ' años')} ${fld('Identidad de género', ATLETA.genero)}
    ${fld('Tipo de sangre', ATLETA.sangre)} ${fld('Nacionalidad', `<span class="pf-flag-chip pf-flag--${ATLETA.nacionalidad.iso}"></span>${esc(ATLETA.nacionalidad.pais)}`)}`;
  else if (activeTab === 'ubicacion') body = `
    ${fld('Departamento', ATLETA.ubicacion.depto)} ${fld('Municipio', ATLETA.ubicacion.municipio)}
    ${fld('Zona', ATLETA.ubicacion.zona)} ${fld('Barrio', ATLETA.ubicacion.barrio)}
    ${fld('Dirección', ATLETA.ubicacion.direccion, true)}`;
  else if (activeTab === 'adicionales') body = `
    ${fld('Deporte principal', ATLETA.deporteEmoji + ' ' + esc(ATLETA.deporte))} ${fld('Modalidad', ATLETA.modalidad)}
    ${fld('Categoría', TIER[ATLETA.tier].label)} ${fld('Estado de afiliación', st.key === 'vinculado' ? 'Vinculado' : st.key === 'pendiente' ? 'Solicitud enviada' : 'Autodeclarado')}
    ${fld('Club', ATLETA.clubNombre || '— (sin afiliación)')} ${fld('Liga', ATLETA.ligaNombre || '—')}
    ${fld('Federación', ATLETA.federacionNombre || '—')} ${fld('Años de práctica', ATLETA.aniosPractica + ' años')}`;
  else body = `
    ${fld('Correo electrónico', ATLETA.contacto.correo)} ${fld('Teléfono', ATLETA.contacto.telefono)}
    ${fld('Contacto de emergencia', ATLETA.contacto.emergenciaNombre)} ${fld('Tel. de emergencia', ATLETA.contacto.emergenciaTel)}`;
  const editBtn = `<button class="pf-edit">${I.pencil} Editar datos</button>`;
  return `${head('Datos personales', '', editBtn)}${tabsBar}<div class="pf-body"><div class="pf-fields">${body}</div></div>`;
}

const DOC_STATUS = { verificado:'Verificado', vigente:'Vigente', pendiente:'Pendiente', requerido:'Requerido', revision:'En revisión' };
const UPLOAD_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
function documentosHTML() {
  const rows = ATLETA.documentos.map((d) => {
    const up = d.subido ? '' : `
      <div class="pf-doc-up">
        <div class="naowee-file-uploader" data-doc="${esc(d.nombre)}">
          <label class="naowee-file-uploader__drop-zone">
            <span class="naowee-file-uploader__drop-icon">${UPLOAD_ICO}</span>
            <span class="naowee-file-uploader__drop-title">Arrastra el archivo o haz clic para subir</span>
            <span class="naowee-file-uploader__drop-hint">PDF, JPG o PNG · máximo 5 MB</span>
            <span class="naowee-file-uploader__drop-filename"></span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png">
          </label>
        </div>
      </div>`;
    return `<div class="pf-doc-item ${d.subido ? '' : 'is-required'}">
      <div class="pf-doc">
        <span class="pf-doc__ico ${d.subido ? '' : 'is-required'}">${I.doc}</span>
        <span class="pf-doc__txt"><span class="pf-doc__nm">${esc(d.nombre)}</span><span class="pf-doc__sub">${esc(d.sub)}</span></span>
        <span class="pf-doc__st st-${d.estado}">${DOC_STATUS[d.estado] || d.estado}</span>
      </div>${up}
    </div>`;
  }).join('');
  return `${head('Documentos', 'Soportes de tu registro único de persona en el SUID.')}<div class="pf-body">${rows}</div>`;
}

/* ══════════ Mi club — sección estrella (T7) ══════════ */
function miclubHTML() {
  const st = affState();
  if (st.key === 'vinculado') {
    const chainNodes = [
      ATLETA.liga && { tipo:'Liga', ico:I.liga, nm:ATLETA.ligaNombre },
      ATLETA.federacion && { tipo:'Federación', ico:I.federacion, nm:ATLETA.federacionNombre },
      ATLETA.comite && { tipo:'Comité / cabeza de sector', ico:I.comite, nm:ATLETA.comiteNombre }
    ].filter(Boolean);
    const chain = chainNodes.map((n) => `
      <div class="af-node">
        <span class="af-node__ico">${n.ico}</span>
        <span class="af-node__body"><span class="af-node__type">${n.tipo}</span><span class="af-node__nm">${esc(n.nm)}</span></span>
      </div>`).join('');
    return `${head('Mi club', 'Estás afiliado a un club. Tu liga y federación se heredan automáticamente de él.')}
      <div class="pf-body">
        <div class="af-club-card">
          <span class="af-club-card__ico">${CLUB_EMOJI}</span>
          <div class="af-club-card__body">
            <div class="af-club-card__lead">Club afiliado</div>
            <div class="af-club-card__nm">${esc(ATLETA.clubNombre)}</div>
            <div class="af-club-card__sub">${esc(ATLETA.deporte)} · ${esc(ATLETA.modalidad)}${ATLETA.club && ATLETA.club.nit ? ' · NIT ' + esc(ATLETA.club.nit) : ''}</div>
          </div>
        </div>
        <div class="af-chain">
          <div class="af-chain__title">Cadena heredada (ORG-05)</div>
          ${chain || '<div class="pf-empty">Sin cadena ascendente registrada.</div>'}
        </div>
        <div class="af-node__actions">
          <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="miclubCambiar">${I.refresh} Cambiar de club</button>
          <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="miclubRetirar">Retirar afiliación</button>
        </div>
      </div>`;
  }
  if (st.key === 'pendiente') {
    const club = getOrganismo(st.sol.clubId);
    return `${head('Mi club', 'Tu solicitud está en espera de confirmación por parte del club.')}
      <div class="pf-body">
        <div class="af-sol-card">
          <div class="af-sol-card__top">
            <span class="af-sol-card__ico">⏳</span>
            <div class="af-sol-card__body">
              <div class="af-sol-card__lead">Solicitud enviada</div>
              <div class="af-sol-card__nm">${esc(club ? club.nombre : st.sol.clubId)}</div>
              <div class="af-sol-card__meta">Enviada el ${esc(st.sol.fecha)} · en espera de confirmación del club</div>
            </div>
          </div>
          <div class="af-sol-card__foot">
            <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="miclubRetirarSol">Retirar solicitud</button>
          </div>
        </div>
      </div>`;
  }
  if (st.key === 'rechazada') {
    const club = getOrganismo(st.sol.clubId);
    return `${head('Mi club', 'Tu última solicitud fue rechazada. Puedes enviar una nueva.')}
      <div class="pf-body">
        <div class="af-sol-card af-sol-card--rechazada">
          <div class="af-sol-card__top">
            <span class="af-sol-card__ico">${I.x}</span>
            <div class="af-sol-card__body">
              <div class="af-sol-card__lead">Solicitud rechazada</div>
              <div class="af-sol-card__nm">${esc(club ? club.nombre : st.sol.clubId)}</div>
              <div class="af-sol-card__meta">${st.sol.motivo ? 'Motivo: ' + esc(st.sol.motivo) : 'Sin motivo registrado'}</div>
            </div>
          </div>
          <div class="af-sol-card__foot">
            <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-asociar>${I.link} Enviar nueva solicitud</button>
          </div>
        </div>
      </div>`;
  }
  const cta = `<button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-asociar>${I.link} Asociar a club</button>`;
  return `${head('Mi club', 'Aún no estás afiliado a un club.', cta)}
    <div class="pf-body">
      <div class="naowee-empty-state">
        <span class="naowee-empty-state__icon">${I.club}</span>
        <p class="naowee-empty-state__title">Eres un deportista autodeclarado</p>
        <p class="naowee-empty-state__description">Estás registrado en el SUID pero sin club. Al afiliarte a un club <strong>Activo</strong> y ser aprobado, heredarás automáticamente su liga y su federación (ORG-05). Podrás cambiar o retirar tu afiliación cuando quieras.</p>
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" data-asociar>${I.link} Buscar un club</button>
      </div>
    </div>`;
}

function solicitudesHTML() {
  const mine = allSolicitudes().filter((s) => s.deportistaId === DEP_ID);
  if (!mine.length) {
    return `${head('Solicitudes de afiliación', 'Historial de tus solicitudes a clubes.')}
      <div class="pf-body"><div class="naowee-empty-state">
        <span class="naowee-empty-state__icon">${I.link}</span>
        <p class="naowee-empty-state__title">Sin solicitudes aún</p>
        <p class="naowee-empty-state__description">Cuando envíes una solicitud de afiliación a un club, aparecerá aquí con su estado y trazabilidad.</p>
      </div></div>`;
  }
  const nodeCls = { Enviada:'enviada', Aprobada:'aprobada', Rechazada:'rechazada', Retirada:'retirada' };
  const rows = mine.map((s) => {
    const club = getOrganismo(s.clubId);
    const fecha = s.resueltaFecha || s.fecha;
    const sub = s.estado === 'Rechazada' && s.motivo ? `Motivo: ${esc(s.motivo)}` : `${s.estado} · ${esc(fecha)}`;
    return `<div class="af-sol-row">
      <span class="af-sol-row__ico pf-tl__node--${nodeCls[s.estado] || 'enviada'}">${SOL_EMOJI[s.estado] || I.send}</span>
      <span class="af-sol-row__body"><span class="af-sol-row__nm">${esc(club ? club.nombre : s.clubId)}</span><span class="af-sol-row__sub">${sub}</span></span>
      <span class="pf-tl__pill pf-tl__pill--${nodeCls[s.estado] || 'enviada'}">${s.estado}</span>
    </div>`;
  }).join('');
  return `${head('Solicitudes de afiliación', 'Historial de tus solicitudes a clubes.')}<div class="pf-body"><div class="af-sol-list">${rows}</div></div>`;
}

function eventosHTML() {
  const activos = ATLETA.inscripciones.filter((e) => e.estado === 'activo');
  const finalizados = ATLETA.inscripciones.filter((e) => e.estado === 'finalizado');
  if (!ATLETA.inscripciones.length) {
    return `${head('Eventos e inscripciones')}<div class="pf-body"><div class="naowee-empty-state">
      <span class="naowee-empty-state__icon">${I.cal}</span>
      <p class="naowee-empty-state__title">Sin inscripciones</p>
      <p class="naowee-empty-state__description">${ATLETA.clubId ? 'Aún no tienes inscripciones a eventos.' : 'Para competir necesitas estar afiliado a un club. Asóciate a uno para inscribirte a eventos.'}</p>
    </div></div>`;
  }
  const row = (e) => { const act = e.estado === 'activo'; return `<div class="pf-ev"><span class="pf-ev__tile ${act ? 'is-active' : ''}">${ATLETA.deporteEmoji}</span><span class="pf-ev__body"><span class="pf-ev__nm">${esc(e.evento)}</span><span class="pf-ev__sub">${esc(e.prueba)}<span class="pf-ev__dot"></span>${esc(e.fecha)}</span></span><span class="pf-ev__st s-${e.estado}">${act ? 'Activo' : 'Finalizado'}</span></div>`; };
  const group = (label, list, active) => list.length ? `<div class="pf-ev-group"><div class="pf-ev-group__h ${active ? 'is-active' : ''}">${label} <span>${list.length}</span></div>${list.map(row).join('')}</div>` : '';
  return `${head('Eventos e inscripciones')}<div class="pf-body">${group('Activos · próximos', activos, true)}${group('Finalizados', finalizados, false)}</div>`;
}

function trayectoriaHTML() {
  const prox = ATLETA.inscripciones.filter((e) => e.estado === 'activo')
    .map((e) => ({ anio: (e.fecha.match(/\d{4}/) || ['2026'])[0], evento: e.evento, meta: `${e.prueba} · inscrito`, cls: 'proximo', node: I.cal, pill: 'Próximo' }));
  const meds = [...ATLETA.medalleria].sort((a, b) => ('' + b.fecha).localeCompare('' + a.fecha))
    .map((m) => ({ anio: '' + m.fecha, evento: m.evento, meta: m.prueba, cls: m.medalla.toLowerCase(), node: MEDAL_EMOJI[m.medalla], pill: m.medalla }));
  const items = [...prox, ...meds];
  if (!items.length) return `<div class="pf-empty">Sin trayectoria deportiva registrada.</div>`;
  return `<div class="pf-tl">${items.map((it) => `
    <div class="pf-tl__item">
      <div class="pf-tl__node pf-tl__node--${it.cls}">${it.node}</div>
      <div class="pf-tl__c">
        <div class="pf-tl__top"><span class="pf-tl__year">${esc(it.anio)}</span><span class="pf-tl__pill pf-tl__pill--${it.cls}">${it.pill}</span></div>
        <div class="pf-tl__ev">${esc(it.evento)}</div>
        <div class="pf-tl__meta">${esc(it.meta)}</div>
      </div>
    </div>`).join('')}</div>`;
}

function historialHTML() {
  const RANK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  const TABS = [['trayectoria', 'Trayectoria', I.clock], ['medalleria', 'Medallería', I.medal], ['resultados', 'Resultados', RANK_ICO]];
  const tabsBar = `<div class="pf-tabs-wrap"><div class="naowee-tabs" id="pfHistTabs" role="tablist">${TABS.map(([id, l, ic]) => `<button class="naowee-tab ${id === activeHist ? 'naowee-tab--selected' : ''}" data-tab="${id}" role="tab">${ic}${l}</button>`).join('')}</div></div>`;
  let body;
  if (activeHist === 'trayectoria') {
    body = trayectoriaHTML();
  } else if (activeHist === 'medalleria') {
    body = ATLETA.medalleria.length ? ATLETA.medalleria.map((m) => `<div class="pf-tr"><span class="pf-tr__medal m-${m.medalla.toLowerCase()}">${MEDAL_EMOJI[m.medalla]}</span><span><span class="pf-tr__nm">${esc(m.evento)}</span><span class="pf-tr__sub">${esc(m.prueba)} · ${esc(m.fecha)}</span></span><span class="pf-tr__rk is-podio">${m.medalla}</span></div>`).join('') : `<div class="pf-empty">Sin medallas registradas.</div>`;
  } else {
    body = ATLETA.resultados.length ? ATLETA.resultados.map((r) => { const cls = r.ranking <= 3 ? r.ranking : 'n'; const tag = r.ranking <= 3 ? '<span class="pf-res__tag">Podio</span>' : ''; return `<div class="pf-res"><span class="pf-res__pos pf-res__pos--${cls}">${r.ranking}°</span><span class="pf-res__body"><span class="pf-res__nm">${esc(r.evento)}</span><span class="pf-res__sub">${esc(r.prueba)} · ${esc(r.fecha)}</span></span>${tag}</div>`; }).join('') : `<div class="pf-empty">Sin resultados registrados.</div>`;
  }
  return `${head('Historial deportivo')}${tabsBar}<div class="pf-body">${body}</div>`;
}

const setRow = (nm, d, on) => `<div class="pf-set"><span class="pf-set__txt"><span class="pf-set__nm">${nm}</span><span class="pf-set__d">${d}</span></span><button class="pf-sw ${on ? 'is-on' : ''}" aria-pressed="${!!on}"></button></div>`;
function configHTML() {
  return `${head('Configuraciones')}<div class="pf-body">
    ${setRow('Idioma de la plataforma', 'Español (Colombia)', false)}
    ${setRow('Unidades métricas', 'Centímetros · kilogramos', true)}
    ${setRow('Perfil visible para organismos', 'Permite que clubes, ligas y federaciones vean tu trazabilidad', true)}
    ${setRow('Compartir datos para recomendaciones', 'Mejora las sugerencias de clubes y eventos', false)}</div>`;
}
function notifHTML() {
  return `${head('Notificaciones')}<div class="pf-body">
    ${setRow('Estado de mis solicitudes de afiliación', 'Avísame cuando un club apruebe o rechace', true)}
    ${setRow('Nuevos eventos de mi deporte', 'Cuando se abran inscripciones', true)}
    ${setRow('Recordatorios de documentos', 'Antes de que venza un documento', true)}
    ${setRow('Boletín mensual', 'Resumen de actividad por correo', false)}</div>`;
}
function seguridadHTML() {
  return `${head('Seguridad')}<div class="pf-body">
    ${setRow('Verificación en dos pasos', 'Recomendado — protege tu cuenta', false)}
    ${setRow('Inicio de sesión biométrico', 'Huella o rostro en el dispositivo', true)}
    ${setRow('Alertas de inicio de sesión', 'Avísame de accesos nuevos', true)}
    <div class="pf-set"><span class="pf-set__txt"><span class="pf-set__nm">Contraseña</span><span class="pf-set__d">Última actualización hace 3 meses</span></span><button class="pf-edit" style="white-space:nowrap">${I.pencil} Cambiar</button></div></div>`;
}

/* ══════════ Modal: Asociar a club (§5.2 — registro corto) ══════════ */
const LOCK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
let selectedClub = null;

function openAsociarModal() {
  selectedClub = null;
  const ov = document.getElementById('afOv');
  const kv = (l, v) => `<dt>${l}</dt><dd>${esc(v)}</dd>`;
  document.getElementById('afBody').innerHTML = `
    <div class="pf-modal__note">${LOCK_ICO}<span>Estos datos vienen de tu registro único de persona en el SUID y no son editables aquí. El club validará que tu deporte corresponda a su oferta.</span></div>
    <dl class="af-precarga">
      ${kv('Nombres y apellidos', ATLETA.nombreCompleto)}
      ${kv('Documento', ATLETA.doc.tipo + ' · ' + ATLETA.doc.numero)}
      ${kv('Deporte · modalidad', ATLETA.deporteEmoji + ' ' + ATLETA.deporte + ' · ' + ATLETA.modalidad)}
      ${kv('Correo electrónico', ATLETA.contacto.correo)}
    </dl>
    <label class="af-search-label">Buscar club (nombre o NIT)</label>
    <div class="naowee-searchbox" id="afSearchbox">
      <div class="naowee-searchbox__input-wrap">
        <span class="naowee-searchbox__icon">${I.search}</span>
        <input type="text" class="naowee-searchbox__input" id="afSearch" placeholder="Busca por nombre o NIT (mín. 3 caracteres)…" autocomplete="off" spellcheck="false">
      </div>
    </div>
    <div id="afResults"></div>`;
  renderAfResults('');
  ov.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  const inp = document.getElementById('afSearch');
  inp.addEventListener('input', () => renderAfResults(inp.value));
  setTimeout(() => inp.focus(), 60);
  syncAfSend();
}

function renderAfResults(q) {
  const box = document.getElementById('afResults');
  const query = String(q || '').trim();
  if (query.length < 3) {
    box.innerHTML = `<p class="af-search-hint">Escribe al menos 3 caracteres para buscar. Solo se muestran clubes en estado <strong>Activo</strong>.</p>`;
    selectedClub = null; syncAfSend(); return;
  }
  const results = buscarClubesActivos(query);
  if (!results.length) {
    box.innerHTML = `<div class="naowee-message naowee-message--caution" style="margin-top:12px" role="status">
      <span class="naowee-message__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
      <div class="naowee-message__content"><p class="naowee-message__text"><strong>Club no registrado / no encontrado.</strong> Verifica el nombre o el NIT. Si crees que tu club debería aparecer, contacta a la liga de tu deporte para confirmar su registro y estado en el SUID.</p></div>
    </div>`;
    selectedClub = null; syncAfSend(); return;
  }
  box.innerHTML = `<div class="af-results">${results.map((c) => {
    const chain = ancestorsChainPreview(c.id);
    return `<button type="button" class="af-result ${selectedClub === c.id ? 'is-selected' : ''}" data-club="${esc(c.id)}">
      <span class="af-result__ico">${CLUB_EMOJI}</span>
      <span class="af-result__body"><span class="af-result__nm">${esc(c.nombre)}</span><span class="af-result__sub">NIT ${esc(c.nit || '—')}${chain ? ' · ' + chain : ''}</span></span>
      <span class="af-result__check">${I.check}</span>
    </button>`;
  }).join('')}</div>${selectedClub ? inheritPreview(selectedClub) : ''}`;
  box.querySelectorAll('.af-result').forEach((b) => b.addEventListener('click', () => { selectedClub = b.dataset.club; renderAfResults(q); syncAfSend(); }));
}

const _stubDep = (clubId) => buildDeportistaDetalle({ id:'_', nombre:'x', numDoc:'0', tipoDoc:'CC', deporte:'', modalidad:'', clubId });
function ancestorsChainPreview(clubId) {
  const dep = _stubDep(clubId);
  return [dep.ligaNombre, dep.federacionNombre].filter(Boolean).join(' · ');
}
function inheritPreview(clubId) {
  const dep = _stubDep(clubId);
  const pill = (dot, l) => `<span class="af-inherit__pill"><span class="pf-badge__dot" style="background:${dot}"></span>${esc(l)}</span>`;
  const parts = [];
  if (dep.ligaNombre) parts.push(pill('#1f8923', dep.ligaNombre));
  if (dep.federacionNombre) parts.push(pill('#d74009', dep.federacionNombre));
  if (dep.comiteNombre) parts.push(pill('#1d4ed8', dep.comiteNombre));
  if (!parts.length) return '';
  return `<div class="af-inherit"><div class="af-inherit__title">Al aprobarse, heredarás automáticamente</div><div class="af-inherit__chain">${parts.join('<span class="af-inherit__arrow">→</span>')}</div></div>`;
}
function syncAfSend() { const b = document.getElementById('afSend'); if (b) b.disabled = !selectedClub; }
function closeAsociarModal() { document.getElementById('afOv').classList.remove('is-open'); document.body.style.overflow = ''; }
function enviarSolicitud() {
  if (!selectedClub) return;
  const club = getOrganismo(selectedClub);
  crearSolicitud(DEP_ID, selectedClub);
  closeAsociarModal();
  toast(`Solicitud enviada a ${club ? club.nombre : 'el club'}. Te avisaremos cuando la confirme.`, 'success');
  activeSec = 'miclub';
  refresh();
}

/* ══════════ Modal: Editar datos ══════════ */
let modalTab = 'datos', editState = {}, editBaseline = '';
function editTabFields(tab) {
  const s = editState;
  const RO = (l, v) => ({ ro: true, l, v });
  const ED = (k, l, v, full) => ({ k, l, v, full });
  return ({
    datos: [
      RO('Nombre', ATLETA.nombre), RO('Segundo nombre', ATLETA.segundoNombre),
      RO('Apellido', ATLETA.apellido), RO('Segundo apellido', ATLETA.segundoApellido),
      RO('Tipo de documento', ATLETA.doc.tipo), RO('Número de documento', ATLETA.doc.numero),
      RO('Sexo', ATLETA.sexo), RO('Fecha de nacimiento', ATLETA.nacimiento),
      RO('Nacionalidad', ATLETA.nacionalidad.pais), RO('Edad', ATLETA.edad + ' años'),
      ED('genero', 'Identidad de género', s.genero), ED('sangre', 'Tipo de sangre', s.sangre)
    ],
    ubicacion: [
      ED('depto', 'Departamento', s.depto), ED('municipio', 'Municipio', s.municipio),
      ED('zona', 'Zona', s.zona), ED('barrio', 'Barrio', s.barrio),
      ED('direccion', 'Dirección', s.direccion, true)
    ],
    adicionales: [
      RO('Deporte principal', ATLETA.deporteEmoji + ' ' + ATLETA.deporte), RO('Modalidad', ATLETA.modalidad),
      RO('Club', ATLETA.clubNombre || '— (sin afiliación)'), RO('Liga', ATLETA.ligaNombre || '—'),
      RO('Federación', ATLETA.federacionNombre || '—'), RO('Categoría', TIER[ATLETA.tier].label),
      ED('manoHabil', 'Mano hábil', s.manoHabil), ED('aniosPractica', 'Años de práctica', s.aniosPractica)
    ],
    contacto: [
      ED('correo', 'Correo electrónico', s.correo, true), ED('telefono', 'Teléfono', s.telefono, true),
      ED('emergenciaNombre', 'Contacto de emergencia', s.emergenciaNombre), ED('emergenciaTel', 'Tel. de emergencia', s.emergenciaTel)
    ]
  })[tab];
}
function renderEditTabs() {
  const T = [['datos', 'Datos', I.id], ['ubicacion', 'Ubicación', I.pin], ['adicionales', 'Adicionales', I.medal], ['contacto', 'Contacto', I.phone]];
  document.getElementById('editTabs').innerHTML = T.map(([id, l, ic]) => `<button class="naowee-tab ${id === modalTab ? 'naowee-tab--selected' : ''}" data-mtab="${id}" type="button">${ic}${l}</button>`).join('');
}
function renderEditBody() {
  const html = editTabFields(modalTab).map((f) => f.ro
    ? `<div class="pf-ro ${f.full ? 'col-2' : ''}"><span class="pf-ro__l">${f.l}</span><div class="pf-ro__v"><span>${esc(f.v) || '—'}</span>${LOCK_ICO}</div></div>`
    : `<div class="naowee-textfield ${f.full ? 'col-2' : ''}"><label class="naowee-textfield__label">${f.l}</label><div class="naowee-textfield__input-wrap"><input class="naowee-textfield__input" data-key="${f.k}" value="${esc(f.v)}" autocomplete="off"></div></div>`
  ).join('');
  const note = `<div class="pf-modal__note">${LOCK_ICO}<span>Los datos con candado los gestiona el administrador de Naowee y tu afiliación se cambia desde "Mi club". Para modificarlos, usa esa sección o contacta al administrador.</span></div>`;
  document.getElementById('editBody').innerHTML = note + `<div class="pf-mgrid">${html}</div>`;
}
function syncEditDirty() { const b = document.getElementById('editSave'); if (b) b.disabled = JSON.stringify(editState) === editBaseline; }
function openEditModal() {
  modalTab = 'datos';
  const u = ATLETA.ubicacion, c = ATLETA.contacto;
  editState = { genero: ATLETA.genero, sangre: ATLETA.sangre, depto: u.depto, municipio: u.municipio, zona: u.zona, barrio: u.barrio, direccion: u.direccion, manoHabil: ATLETA.manoHabil, aniosPractica: '' + ATLETA.aniosPractica, correo: c.correo, telefono: c.telefono, emergenciaNombre: c.emergenciaNombre, emergenciaTel: c.emergenciaTel };
  editBaseline = JSON.stringify(editState);
  renderEditTabs(); renderEditBody(); syncEditDirty();
  document.getElementById('editOv').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeEditModal() { document.getElementById('editOv').classList.remove('is-open'); document.body.style.overflow = ''; }
function saveEdit() {
  const s = editState;
  ATLETA.genero = s.genero; ATLETA.sangre = s.sangre; ATLETA.manoHabil = s.manoHabil; ATLETA.aniosPractica = s.aniosPractica;
  Object.assign(ATLETA.ubicacion, { depto: s.depto, municipio: s.municipio, zona: s.zona, barrio: s.barrio, direccion: s.direccion });
  Object.assign(ATLETA.contacto, { correo: s.correo, telefono: s.telefono, emergenciaNombre: s.emergenciaNombre, emergenciaTel: s.emergenciaTel });
  closeEditModal(); toast('Datos actualizados.', 'success'); renderPanel();
}
function setupModals() {
  document.getElementById('editTabs').addEventListener('click', (e) => { const t = e.target.closest('.naowee-tab'); if (!t) return; modalTab = t.dataset.mtab; renderEditTabs(); renderEditBody(); });
  document.getElementById('editBody').addEventListener('input', (e) => { const inp = e.target.closest('[data-key]'); if (!inp) return; editState[inp.dataset.key] = inp.value; syncEditDirty(); });
  document.getElementById('editClose').addEventListener('click', closeEditModal);
  document.getElementById('editCancel').addEventListener('click', closeEditModal);
  document.getElementById('editSave').addEventListener('click', saveEdit);
  document.getElementById('editOv').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeEditModal(); });
  document.getElementById('afClose').addEventListener('click', closeAsociarModal);
  document.getElementById('afCancel').addEventListener('click', closeAsociarModal);
  document.getElementById('afSend').addEventListener('click', enviarSolicitud);
  document.getElementById('afOv').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeAsociarModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('afOv').classList.contains('is-open')) closeAsociarModal();
    else if (document.getElementById('editOv').classList.contains('is-open')) closeEditModal();
  });
}

/* ── Boot ── */
seedDemoData();
seedAfiliacionesDemo(getDemoMode());
mountSidebar({ rootEl: document.getElementById('sidebarRoot'), roleCode, activeId: 'afiliacion' });
mountHeader({ headerEl: document.getElementById('topHeader'), role });
mountBackdrop();
mountDemoSwitcher({ roleCode });
document.title = `Mi perfil — ${ATLETA.nombreCompleto}`;
render();
setupModals();
