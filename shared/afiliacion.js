/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Mi afiliación (T7 · ORG-05, home del DEPORTISTA)
   Cierra el ciclo ascendente: el deportista solicita afiliación a un club
   (buscador de clubes SOLO Activos, ≥3 chars, sin texto libre). Al aprobar el
   club (bandeja.js), el deportista queda VINCULADO y hereda automáticamente la
   liga y la federación del club (ancestorsOf). Estados del deportista:
   Autodeclarado (sin club) / Solicitud pendiente (Enviada) / Vinculado.
   Solo componentes .naowee-* + layout local .af-* (tokens del DS). Datos
   precargados NO editables (§5.2). El deportista demo es Valentina (DEP-001);
   "retirar afiliación" la devuelve a autodeclarado para demostrar el buscador.
   ═══════════════════════════════════════════════════════════════ */
import { getRoleFromQuery, ROLES, getDemoMode } from './sidebar.js';
import { scopeFor } from './permissions.js';
import {
  getDeportista, getOrganismo, ancestorsOf, solicitudDeDeportista,
  crearSolicitud, retirarAfiliacion, buscarClubesActivos, seedAfiliacionesDemo
} from './organismos-data.js';

const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || {};
/* La ficha siempre es la del deportista demo (Valentina, DEP-001); el rol
   DEPORTISTA está anclado a ella (scopeFor). */
const depId = scopeFor('DEPORTISTA');

const root = document.getElementById('afilRoot');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const toast = (t, type) => window.naoweeToast && window.naoweeToast(t, type || 'success');

const I = {
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
};
const TIPO_EMOJI = { club: '🛡️', liga: '🚩', federacion: '🏅', comite: '🏛️' };

/* Estado UI del buscador */
let query = '';
let selectedClubId = null;

function msg(variant, icon, html) {
  return `<div class="naowee-message naowee-message--${variant}"><span class="naowee-message__icon">${icon}</span><div class="naowee-message__body"><p class="naowee-message__text">${html}</p></div></div>`;
}
function kvRow(k, v) { return `<div class="af-kv__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`; }

/* ═══════════════ Render ═══════════════ */
function render() {
  const dep = getDeportista(depId);
  if (!dep) { root.innerHTML = `<div class="naowee-card"><p class="af-hint">No se encontró el perfil del deportista.</p></div>`; return; }

  const sol = solicitudDeDeportista(dep.id);
  const vinculado = dep.estado === 'vinculado' && !!dep.clubId;
  const pendiente = !vinculado && sol && sol.estado === 'Enviada';
  const rechazada = !vinculado && !pendiente && sol && sol.estado === 'Rechazada';

  const st = vinculado
    ? { badge: 'positive', icon: I.check, title: 'Vinculado a un club', desc: 'Tu afiliación está confirmada. Heredas la liga y la federación de tu club.' }
    : pendiente
      ? { badge: 'caution', icon: I.clock, title: 'Solicitud pendiente', desc: 'Tu solicitud fue enviada; espera la confirmación del club.' }
      : { badge: 'informative', icon: I.link, title: 'Autodeclarado', desc: 'Estás registrado como deportista sin club. Puedes solicitar afiliación cuando quieras.' };

  root.innerHTML = `
    <div class="naowee-card af-state">
      <span class="af-state__ico af-state__ico--${st.badge}">${st.icon}</span>
      <div class="af-state__body">
        <div class="af-state__head">
          <h2 class="af-state__title">${esc(st.title)}</h2>
          <span class="naowee-badge naowee-badge--${st.badge} naowee-badge--quiet naowee-badge--small">${vinculado ? 'Vinculado' : pendiente ? 'Solicitud pendiente' : 'Autodeclarado'}</span>
        </div>
        <p class="af-state__desc">${esc(st.desc)}</p>
      </div>
    </div>

    <div class="naowee-card af-card">
      <p class="af-section-label">Datos del deportista · precargados (no editables)</p>
      <dl class="af-kv">
        ${kvRow('Nombres y apellidos', dep.nombre)}
        ${kvRow('Documento', `${dep.tipoDoc || ''} ${dep.numDoc || ''}`)}
        ${kvRow('Deporte', dep.deporte)}
        ${kvRow('Modalidad', dep.modalidad || '—')}
        ${kvRow('Correo electrónico', dep.correo || '—')}
      </dl>
      <p class="af-hint">Estos datos provienen de tu registro único en el SUID. Para cambiarlos, edita tu perfil.</p>
    </div>

    ${vinculado ? vinculadoCard(dep) : pendiente ? pendienteCard(dep, sol) : autodeclaradoCard(dep, rechazada ? sol : null)}
  `;
  wire();
}

/* ── Vinculado: cadena heredada + cambiar / retirar ── */
function vinculadoCard(dep) {
  const club = getOrganismo(dep.clubId);
  const chain = ancestorsOf(dep.clubId);              // [liga, federación, comité] ascendente
  const liga = chain.find((c) => c.tipo === 'liga');
  const fed = chain.find((c) => c.tipo === 'federacion');
  const comite = chain.find((c) => c.tipo === 'comite');
  const chainRow = (tipo, label, org) => `
    <div class="af-chain__row">
      <span class="af-chain__emoji">${TIPO_EMOJI[tipo]}</span>
      <div class="af-chain__meta"><span class="af-chain__label">${esc(label)}</span><span class="af-chain__value">${org ? esc(org.nombre) : '—'}</span></div>
    </div>`;
  return `
    <div class="naowee-card af-card">
      <p class="af-section-label">Tu afiliación</p>
      ${msg('positive', I.check, `Estás vinculado a <strong>${esc(club ? club.nombre : 'tu club')}</strong>. Al confirmar el club, heredaste automáticamente su liga y federación (ORG-05).`)}
      <div class="af-chain">
        ${chainRow('club', 'Club', club)}
        ${chainRow('liga', 'Liga', liga)}
        ${chainRow('federacion', 'Federación', fed)}
        ${chainRow('comite', 'Comité', comite)}
      </div>
      <div class="af-actions">
        <button type="button" class="naowee-btn naowee-btn--mute" id="afRetirar">Retirar afiliación</button>
        <button type="button" class="naowee-btn naowee-btn--quiet" id="afCambiar">Cambiar de club</button>
      </div>
    </div>`;
}

/* ── Solicitud pendiente: club destino + retirar ── */
function pendienteCard(dep, sol) {
  const club = getOrganismo(sol.clubId);
  return `
    <div class="naowee-card af-card">
      <p class="af-section-label">Solicitud en curso</p>
      ${msg('caution', I.clock, `Tu solicitud de afiliación a <strong>${esc(club ? club.nombre : 'el club')}</strong> está <strong>en espera de confirmación</strong> del club. Te notificaremos cuando la resuelvan.`)}
      <dl class="af-kv">
        ${kvRow('Club solicitado', club ? club.nombre : '—')}
        ${kvRow('NIT del club', club ? club.nit : '—')}
        ${kvRow('Fecha de la solicitud', sol.fecha || '—')}
        ${kvRow('Estado', 'Enviada')}
      </dl>
      <div class="af-actions">
        <button type="button" class="naowee-btn naowee-btn--mute" id="afRetirarSol">Retirar solicitud</button>
      </div>
    </div>`;
}

/* ── Autodeclarado (o rechazada → reintentar): buscador de clubes Activos ── */
function autodeclaradoCard(dep, solRechazada) {
  return `
    <div class="naowee-card af-card">
      <p class="af-section-label">Solicitar afiliación a un club</p>
      ${solRechazada ? msg('negative', I.alert, `Tu solicitud anterior fue <strong>rechazada</strong>${solRechazada.motivo ? `: ${esc(solRechazada.motivo)}` : ''}. Puedes buscar otro club y enviar una nueva solicitud.`) : ''}
      <div class="naowee-searchbox af-search" id="afSb">
        <div class="naowee-searchbox__input-wrap">
          <span class="naowee-searchbox__icon">${I.search}</span>
          <input class="naowee-searchbox__input" id="afSearch" placeholder="Busca tu club por nombre o NIT (mín. 3 caracteres)…" value="${esc(query)}" autocomplete="off">
        </div>
      </div>
      <div class="af-results" id="afResults">${resultsHtml()}</div>
      <div class="af-actions">
        <button type="button" class="naowee-btn naowee-btn--loud" id="afSend" ${selectedClubId ? '' : 'disabled'}>Enviar solicitud</button>
      </div>
    </div>`;
}

/* Resultados del buscador (SOLO clubes Activos, ≥3 chars, sin texto libre). */
function resultsHtml() {
  const q = query.trim();
  if (q.length < 3) return `<p class="af-hint af-hint--center">Escribe al menos <strong>3 caracteres</strong> para buscar tu club (solo clubes activos).</p>`;
  const results = buscarClubesActivos(q);
  if (!results.length) {
    return msg('caution', I.alert, 'Club no registrado / no encontrado — verifica el nombre o contacta a tu liga del deporte. Puede ser un club aún no habilitado en el SUID.');
  }
  return results.map((c) => `
    <button type="button" class="af-result ${selectedClubId === c.id ? 'af-result--selected' : ''}" data-club="${esc(c.id)}">
      <span class="af-result__emoji">🛡️</span>
      <span class="af-result__meta">
        <span class="af-result__name">${esc(c.nombre)}</span>
        <span class="af-result__sub">NIT ${esc(c.nit)} · ${esc(c.ubicacion ? c.ubicacion.ciudad : '')}${c.deporte ? ' · ' + esc(c.deporte) : ''}</span>
      </span>
      <span class="af-result__check">${I.check}</span>
    </button>`).join('');
}

/* Repinta solo la zona de resultados + estado del botón (sin re-render total,
   para no perder el foco del input mientras se escribe). */
function repaintResults() {
  const box = document.getElementById('afResults');
  if (box) box.innerHTML = resultsHtml();
  const send = document.getElementById('afSend');
  if (send) send.disabled = !selectedClubId;
  wireResults();
}
function wireResults() {
  document.querySelectorAll('#afResults [data-club]').forEach((b) => b.addEventListener('click', () => {
    selectedClubId = b.dataset.club;
    repaintResults();
  }));
}

/* ── Wiring ── */
function wire() {
  const s = document.getElementById('afSearch');
  if (s) s.addEventListener('input', (e) => { query = e.target.value; selectedClubId = null; repaintResults(); });
  wireResults();

  const send = document.getElementById('afSend');
  if (send) send.addEventListener('click', () => {
    if (!selectedClubId) return;
    const club = getOrganismo(selectedClubId);
    crearSolicitud(depId, selectedClubId);
    query = ''; selectedClubId = null;
    toast(`Solicitud enviada a ${club ? club.nombre : 'el club'}`, 'success');
    render();
  });

  const retirar = document.getElementById('afRetirar');
  if (retirar) retirar.addEventListener('click', () => {
    retirarAfiliacion(depId, { responsable: (getDeportista(depId) || {}).nombre });
    query = ''; selectedClubId = null;
    toast('Afiliación retirada. Ahora eres deportista autodeclarado.', 'info');
    render();
  });
  const cambiar = document.getElementById('afCambiar');
  if (cambiar) cambiar.addEventListener('click', () => {
    retirarAfiliacion(depId, { responsable: (getDeportista(depId) || {}).nombre });
    query = ''; selectedClubId = null;
    toast('Afiliación retirada. Busca y solicita tu nuevo club.', 'info');
    render();
  });
  const retirarSol = document.getElementById('afRetirarSol');
  if (retirarSol) retirarSol.addEventListener('click', () => {
    retirarAfiliacion(depId, { responsable: (getDeportista(depId) || {}).nombre });
    query = ''; selectedClubId = null;
    toast('Solicitud retirada.', 'info');
    render();
  });
}

seedAfiliacionesDemo(getDemoMode());
render();
