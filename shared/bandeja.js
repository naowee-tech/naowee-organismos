/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Bandeja de aprobaciones (T5)
   Cada rol aprobador gestiona la máquina de estados de su nivel inferior
   (ORG-06/07): aprobar / rechazar / solicitar corrección con MOTIVO obligatorio,
   doble validación de federación (Mindeporte + Comité), regla dura "el superior
   debe estar Activo", y trazabilidad (timeline de auditoría).
   Solo componentes .naowee-* + layout local (.cg-table reusada, .reg-modal reusado).
   ═══════════════════════════════════════════════════════════════ */
import { getRoleFromQuery, ROLES, getDemoMode } from './sidebar.js';
import {
  allOrganismos, getOrganismo, subtreeOf, addOrganismo,
  updateOrganismo, setEstado, auditLog, allAudit,
  solicitudesDeClub, resolverAfiliacion, getDeportista, ancestorsOf, seedAfiliacionesDemo
} from './organismos-data.js';
import { can, scopeFor } from './permissions.js';
import { estadoBadgeVariant, resolverFederacion, puedeTransicionar } from './estados.js';

const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || {};

/* Recurso + tipo que aprueba cada rol (RBAC §11.2). */
const TARGET = {
  MINDEPORTE: { tipo: 'federacion', recurso: 'federaciones', plural: 'federaciones' },
  COMITE:     { tipo: 'federacion', recurso: 'federaciones', plural: 'federaciones' },
  FEDERACION: { tipo: 'liga',       recurso: 'ligas',        plural: 'ligas' },
  LIGA:       { tipo: 'club',       recurso: 'clubes',       plural: 'clubes' }
};
const target = TARGET[roleCode] || null;
const scopeId = scopeFor(roleCode);
const halfOf = { MINDEPORTE: 'mindeporte', COMITE: 'comite' };   // mitad de la doble validación FED

const TIPO_EMOJI = { federacion: '🏅', liga: '🚩', club: '🛡️' };
const TIPO_SING = { federacion: 'Federación', liga: 'Liga', club: 'Club' };
const MOTIVOS = [
  'Documentación incompleta',
  'Reconocimiento deportivo no válido o vencido',
  'Datos del representante legal incorrectos',
  'NIT / RUT inconsistente',
  'Fuera de jurisdicción / sector',
  'Otro (ver comentario)'
];
/* Estados que se muestran en la bandeja (accionables + visibilidad). */
const VISIBLES = ['En revisión', 'Preinscrito', 'Rechazado', 'Activo'];

const root = document.getElementById('bandejaRoot');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const today = () => new Date().toISOString().slice(0, 10);

const I = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

/* State (UI) */
let query = '';
let estadoFiltro = 'Accionables';

/* ── Datos demo: federaciones En revisión con doble validación a medias ── */
function seedBandejaDemo() {
  if (getDemoMode() !== 'demo') return;
  if (allOrganismos().some((o) => o.ficticioBandeja)) return;
  const base = { tipo: 'federacion', sector: 'Olímpico', parentId: 'COC', estado: 'En revisión', ficticioBandeja: true };
  addOrganismo({ ...base, nombre: 'Federación Colombiana de Triatlón', nit: '901620001-1', deporte: 'Triatlón',
    validacion: { mindeporte: 'pendiente', comite: 'pendiente' },
    documentos: { reconocimiento: { name: 'reconocimiento-deportivo-mindeporte.pdf' }, aval: { name: 'aval-comite-olimpico.pdf' }, rut: { name: 'rut-fedetriatlon.pdf' }, personeria: { name: 'personeria-juridica.pdf' } },
    repLegal: { tipoDoc: 'CC', numDoc: '79620001', nombre: 'Andrés', apellido: 'Vélez Mora', correo: 'presidencia@fedetriatlon.demo.co' },
    ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Calle 63 # 47-06' },
    contacto: { telefono: '6014801122', correo: 'contacto@fedetriatlon.demo.co' } });
  addOrganismo({ ...base, nombre: 'Federación Colombiana de Surf', nit: '901620002-2', deporte: 'Surf',
    validacion: { mindeporte: 'aprobado', comite: 'pendiente' },
    documentos: { reconocimiento: { name: 'reconocimiento-deportivo-mindeporte.pdf' }, aval: { name: 'aval-comite-olimpico.pdf' }, rut: { name: 'rut-fedesurf.pdf' }, personeria: { name: 'personeria-juridica.pdf' } },
    repLegal: { tipoDoc: 'CC', numDoc: '79620002', nombre: 'Laura', apellido: 'Peña Gil', correo: 'presidencia@fedesurf.demo.co' },
    ubicacion: { depto: 'Valle del Cauca', ciudad: 'Buenaventura', zona: 'Urbana', direccion: 'Cra 2 # 1-40' },
    contacto: { telefono: '6022410033', correo: 'contacto@fedesurf.demo.co' } });
}

/* ── Datos de la bandeja del rol ── */
function bandejaOrgs() {
  if (!target) return [];
  const sub = scopeId === null ? allOrganismos() : subtreeOf(scopeId);
  return sub.filter((o) => o.tipo === target.tipo);
}
function filtered(orgs) {
  let out = orgs.filter((o) => VISIBLES.includes(o.estado));
  if (estadoFiltro === 'Accionables') out = out.filter((o) => o.estado === 'En revisión');
  else if (estadoFiltro !== 'Todos') out = out.filter((o) => o.estado === estadoFiltro);
  if (query) { const q = norm(query); out = out.filter((o) => norm(o.nombre).includes(q) || norm(o.nit).includes(q)); }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/* El rol puede accionar (no es oversight de solo lectura). */
const puedeAccionar = target && can(roleCode, 'A', target.recurso);

/* ═══════════════ Render ═══════════════ */
function render() {
  if (roleCode === 'CLUB') return renderAfiliaciones();
  if (!target) return renderNoBandeja();
  const all = bandejaOrgs();
  const rows = filtered(all);
  const pend = all.filter((o) => o.estado === 'En revisión').length;
  const anchor = scopeId ? getOrganismo(scopeId) : null;

  root.innerHTML = `
    ${msg('informative', I.info, puedeAccionar
      ? `Bandeja de <strong>${target.plural}</strong> ${anchor ? `de <strong>${esc(anchor.nombre)}</strong>` : 'del SND'}. Aprueba, rechaza o solicita corrección (motivo obligatorio). ${target.tipo === 'federacion' ? 'La federación requiere <strong>doble validación</strong>: Ministerio + Comité.' : ''}`
      : `Vista de <strong>oversight</strong> (solo lectura) de ${target.plural}.`)}

    <div class="naowee-card bj-panel">
      <div class="bj-panel__bar">
        <div class="naowee-searchbox bj-search">
          <div class="naowee-searchbox__input-wrap">
            <span class="naowee-searchbox__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input class="naowee-searchbox__input" id="bjSearch" placeholder="Buscar por nombre o NIT…" value="${esc(query)}">
          </div>
        </div>
        <span class="bj-count">${rows.length} de ${all.length}${pend ? ` · <strong>${pend}</strong> pendientes` : ''}</span>
      </div>
      <div class="naowee-tabs bj-tabs" id="bjFilters">
        ${['Accionables', 'En revisión', 'Rechazado', 'Activo', 'Todos'].map((f) => `<button type="button" class="naowee-tab ${estadoFiltro === f ? 'naowee-tab--selected' : ''}" data-f="${f}">${f}</button>`).join('')}
      </div>
      ${rows.length ? `
        <div class="cg-table-wrap">
          <table class="cg-table bj-table">
            <thead><tr><th>${TIPO_SING[target.tipo]}</th><th>NIT</th><th>Estado</th>${target.tipo === 'federacion' ? '<th>Validación</th>' : ''}<th></th></tr></thead>
            <tbody>
              ${rows.map((o) => `
                <tr>
                  <td><div class="bj-org"><span class="bj-org__emoji">${TIPO_EMOJI[o.tipo]}</span><div><div class="bj-org__name">${esc(o.nombre)}</div><div class="bj-org__sub">${esc(o.deporte && o.deporte !== '—' ? o.deporte : TIPO_SING[o.tipo])}</div></div></div></td>
                  <td class="cg-table__nit">${esc(o.nit)}</td>
                  <td>${badge(o.estado)}</td>
                  ${target.tipo === 'federacion' ? `<td>${valChips(o)}</td>` : ''}
                  <td class="bj-row-action"><button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" data-open="${esc(o.id)}">${puedeAccionar && o.estado === 'En revisión' ? 'Revisar' : 'Ver'}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : emptyState('Sin organismos', `No hay ${target.plural} ${estadoFiltro === 'Accionables' ? 'pendientes de tu revisión' : 'que coincidan con el filtro'} por ahora.`)}
    </div>`;
  wire();
}

function renderNoBandeja() {
  root.innerHTML = `<div class="naowee-card">${emptyState(
    'Sin bandeja',
    'Tu rol no gestiona aprobaciones de organismos.')}</div>`;
}

/* ═══════════════ Bandeja del CLUB — solicitudes de afiliación (T7) ═══════════════
   El club es el ÚNICO aprobador de la afiliación de un deportista (ORG-05). Al
   aprobar, el deportista queda vinculado y hereda la liga + federación del club. */
let afilFiltro = 'Pendientes';
const AFIL_ESTADO = { Pendientes: 'Enviada', Aprobadas: 'Aprobada', Rechazadas: 'Rechazada' };
const AFIL_SOL_VARIANT = { Enviada: 'caution', Aprobada: 'positive', Rechazada: 'negative', Retirada: 'neutral' };
const MOTIVOS_AFIL = [
  'El deportista no corresponde a la oferta deportiva del club',
  'Datos del deportista inconsistentes',
  'Sin cupo disponible por el momento',
  'Documentación del deportista pendiente',
  'Otro (ver comentario)'
];
const puedeAfil = can(roleCode, 'A', 'solicitudes');

function solBadge(estado) {
  return `<span class="naowee-badge naowee-badge--${AFIL_SOL_VARIANT[estado] || 'neutral'} naowee-badge--quiet naowee-badge--small">${esc(estado)}</span>`;
}

function renderAfiliaciones() {
  const club = scopeId ? getOrganismo(scopeId) : null;
  const rows = solicitudesDeClub(scopeId).map((s) => ({ ...s, dep: getDeportista(s.deportistaId) })).filter((r) => r.dep);
  const pend = rows.filter((r) => r.estado === 'Enviada').length;

  let view = rows;
  if (afilFiltro !== 'Todas') { const est = AFIL_ESTADO[afilFiltro]; if (est) view = rows.filter((r) => r.estado === est); }
  if (query) { const q = norm(query); view = view.filter((r) => norm(r.dep.nombre).includes(q) || norm(r.dep.numDoc).includes(q) || norm(r.dep.deporte).includes(q)); }
  view.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  root.innerHTML = `
    ${msg('informative', I.info, puedeAfil
      ? `Solicitudes de afiliación a <strong>${esc(club ? club.nombre : 'tu club')}</strong>. Al <strong>aprobar</strong>, el deportista queda vinculado y hereda automáticamente tu liga y federación (ORG-05). El club es el único aprobador.`
      : `Vista de <strong>oversight</strong> (solo lectura) de solicitudes de afiliación.`)}

    <div class="naowee-card bj-panel">
      <div class="bj-panel__bar">
        <div class="naowee-searchbox bj-search">
          <div class="naowee-searchbox__input-wrap">
            <span class="naowee-searchbox__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input class="naowee-searchbox__input" id="bjSearch" placeholder="Buscar por nombre, documento o deporte…" value="${esc(query)}">
          </div>
        </div>
        <span class="bj-count">${view.length} de ${rows.length}${pend ? ` · <strong>${pend}</strong> pendientes` : ''}</span>
      </div>
      <div class="naowee-tabs bj-tabs" id="bjFilters">
        ${['Pendientes', 'Aprobadas', 'Rechazadas', 'Todas'].map((f) => `<button type="button" class="naowee-tab ${afilFiltro === f ? 'naowee-tab--selected' : ''}" data-af="${f}">${f}</button>`).join('')}
      </div>
      ${view.length ? `
        <div class="cg-table-wrap">
          <table class="cg-table bj-table">
            <thead><tr><th>Deportista</th><th>Deporte</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              ${view.map((r) => `
                <tr>
                  <td><div class="bj-org"><span class="bj-org__emoji">🏃</span><div><div class="bj-org__name">${esc(r.dep.nombre)}</div><div class="bj-org__sub">${esc(r.dep.tipoDoc)} ${esc(r.dep.numDoc)}</div></div></div></td>
                  <td><div class="bj-org__name" style="font-weight:500">${esc(r.dep.deporte)}</div><div class="bj-org__sub">${esc(r.dep.modalidad || '')}</div></td>
                  <td><div class="bj-sol-cell">${r.tipo === 'retiro' ? '<span class="naowee-badge naowee-badge--caution naowee-badge--quiet naowee-badge--small">Baja</span>' : '<span class="naowee-badge naowee-badge--informative naowee-badge--quiet naowee-badge--small">Afiliación</span>'}${solBadge(r.estado)}</div></td>
                  <td class="cg-table__nit">${esc(r.fecha || '—')}</td>
                  <td class="bj-row-action"><button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" data-openafil="${esc(r.id)}">${puedeAfil && r.estado === 'Enviada' ? 'Revisar' : 'Ver'}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : emptyState('Sin solicitudes', afilFiltro === 'Pendientes' ? 'No hay solicitudes de afiliación pendientes de tu confirmación por ahora.' : 'No hay solicitudes que coincidan con el filtro.')}
    </div>`;
  wire();
}

function afilById(sid) { return solicitudesDeClub(scopeId).find((s) => s.id === sid) || null; }

function openAfilDetail(sid) {
  const sol = afilById(sid);
  if (!sol) return;
  const dep = getDeportista(sol.deportistaId);
  if (!dep) return;
  const accionable = puedeAfil && sol.estado === 'Enviada';
  const esRetiro = sol.tipo === 'retiro';
  const clubNm = esc((getOrganismo(sol.clubId) || {}).nombre || 'tu club');
  const tipoBadge = esRetiro
    ? '<span class="naowee-badge naowee-badge--caution naowee-badge--quiet naowee-badge--small">Solicitud de baja</span>'
    : '<span class="naowee-badge naowee-badge--informative naowee-badge--quiet naowee-badge--small">Solicitud de afiliación</span>';

  const ov = openModal(`
    <div class="reg-modal bj-modal" role="dialog" aria-modal="true">
      <div class="reg-modal__head">
        <h3 class="reg-modal__title">🏃 ${esc(dep.nombre)}</h3>
        <button type="button" class="reg-modal__close" id="afClose" aria-label="Cerrar">${I.x}</button>
      </div>
      <div class="reg-modal__body bj-detail">
        <div class="bj-detail__badges">${tipoBadge}${solBadge(sol.estado)}</div>
        <dl class="bj-kv">
          ${kv('Documento', `${dep.tipoDoc || ''} ${dep.numDoc || ''}`)}
          ${kv('Deporte', dep.deporte)}
          ${kv('Modalidad', dep.modalidad || '—')}
          ${kv('Correo', dep.correo || '—')}
          ${kv(esRetiro ? 'Baja solicitada' : 'Solicitud', sol.fecha || '—')}
        </dl>
        ${sol.estado === 'Rechazada' && sol.motivo ? msg('negative', I.alert, `<strong>Motivo del rechazo:</strong> ${esc(sol.motivo)}`) : ''}
        ${sol.estado === 'Aprobada' ? msg('positive', I.check, esRetiro ? `La baja fue confirmada: el deportista quedó <strong>desvinculado</strong> del club.` : `El deportista quedó <strong>vinculado</strong> a tu club y heredó tu liga y federación.`) : ''}
        ${accionable ? `<p class="bj-detail__note">${esRetiro
          ? `Al confirmar la baja, <strong>${esc(dep.nombre)}</strong> dejará de estar afiliado a <strong>${clubNm}</strong> y perderá la liga y la federación heredadas.`
          : `Al aprobar, <strong>${esc(dep.nombre)}</strong> quedará vinculado a <strong>${clubNm}</strong> y heredará automáticamente la liga y la federación (ORG-05).`}</p>` : ''}
      </div>
      <div class="reg-modal__foot bj-actions">
        ${accionable ? `
          <div class="bj-actions__main">
            <button type="button" class="naowee-btn bj-btn-danger" id="afRej">Rechazar</button>
            <button type="button" class="naowee-btn bj-btn-success" id="afApr">${esRetiro ? 'Confirmar retiro' : 'Aprobar afiliación'}</button>
          </div>`
          : `<button type="button" class="naowee-btn naowee-btn--mute" id="afCancel">Cerrar</button>`}
      </div>
    </div>`);
  const close = () => closeModal(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('#afClose').addEventListener('click', close);
  ov.querySelector('#afCancel')?.addEventListener('click', close);
  if (accionable) {
    ov.querySelector('#afApr').addEventListener('click', () => { doApproveAfil(sid); close(); });
    ov.querySelector('#afRej').addEventListener('click', () => openAfilMotivo(sid, ov));
  }
}

function doApproveAfil(sid) {
  const sol = afilById(sid);
  const dep = sol ? getDeportista(sol.deportistaId) : null;
  const esRetiro = sol && sol.tipo === 'retiro';
  resolverAfiliacion(sid, 'aprobada', { responsable: role.userName || roleCode });
  toast(esRetiro
    ? `Retiro confirmado${dep ? ' — ' + dep.nombre + ' quedó desvinculado' : ''}`
    : `Afiliación aprobada${dep ? ' — ' + dep.nombre + ' quedó vinculado' : ''}`, 'success');
  render();
}

function openAfilMotivo(sid, detailOv) {
  closeModal(detailOv);                      // no apilar: cierra el detalle (con su animación)
  const sol = afilById(sid);
  const dep = sol ? getDeportista(sol.deportistaId) : null;
  const esRetiro = sol && sol.tipo === 'retiro';
  let selMotivo = '';
  const ov = openModal(`
    <div class="reg-modal bj-modal bj-modal--sm bj-modal--overflow" role="dialog" aria-modal="true">
      <div class="reg-modal__head"><h3 class="reg-modal__title">${esRetiro ? 'Rechazar baja' : 'Rechazar afiliación'} · ${esc(dep ? dep.nombre : '')}</h3><button type="button" class="reg-modal__close" id="amClose" aria-label="Cerrar">${I.x}</button></div>
      <div class="reg-modal__body">
        <div class="bj-field">
          <label class="bj-label">Motivo <span class="bj-req">*</span></label>
          <div class="naowee-dropdown" id="amDd">
            <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox"><span class="naowee-dropdown__value is-placeholder">Selecciona un motivo…</span><span class="naowee-dropdown__chevron">${I.chevron}</span></button>
            <div class="naowee-dropdown__menu" role="listbox">${MOTIVOS_AFIL.map((m) => `<div class="naowee-dropdown__opt" role="option" data-value="${esc(m)}">${esc(m)}</div>`).join('')}</div>
          </div>
          <p class="bj-err" id="amErr" style="display:none">Selecciona un motivo para continuar.</p>
        </div>
        <div class="bj-field">
          <label class="bj-label">Comentario</label>
          <div class="naowee-textfield__input-wrap bj-ta-wrap"><textarea id="amTxt" rows="3" placeholder="Detalle para el deportista…"></textarea></div>
        </div>
      </div>
      <div class="reg-modal__foot bj-modal__foot"><button type="button" class="naowee-btn naowee-btn--mute" id="amCancel">Cancelar</button><button type="button" class="naowee-btn bj-btn-danger" id="amOk">Confirmar rechazo</button></div>
    </div>`);
  mountDd(ov, (val) => { selMotivo = val; ov.querySelector('#amErr').style.display = 'none'; });
  const backToDetail = () => closeModal(ov, () => openAfilDetail(sid));
  ov.addEventListener('click', (e) => { if (e.target === ov) backToDetail(); });
  ov.querySelector('#amClose').addEventListener('click', backToDetail);
  ov.querySelector('#amCancel').addEventListener('click', backToDetail);
  ov.querySelector('#amOk').addEventListener('click', () => {
    if (!selMotivo) { ov.querySelector('#amErr').style.display = 'block'; ov.querySelector('#amDd').classList.add('naowee-dropdown--error'); return; }
    const txt = ov.querySelector('#amTxt').value.trim();
    resolverAfiliacion(sid, 'rechazada', { motivo: txt ? `${selMotivo} — ${txt}` : selMotivo, responsable: role.userName || roleCode });
    toast(esRetiro ? 'Baja rechazada — el deportista sigue afiliado' : 'Afiliación rechazada', 'success');
    closeModal(ov); render();
  });
}

function badge(estado) {
  return `<span class="naowee-badge naowee-badge--${estadoBadgeVariant(estado)} naowee-badge--quiet naowee-badge--small">${esc(estado)}</span>`;
}
const VAL_VARIANT = { aprobado: 'positive', rechazado: 'negative', pendiente: 'neutral' };
function valChips(o) {
  const v = o.validacion || { mindeporte: 'pendiente', comite: 'pendiente' };
  const chip = (lbl, st) => `<span class="naowee-badge naowee-badge--${VAL_VARIANT[st] || 'neutral'} naowee-badge--quiet naowee-badge--small bj-val">${lbl}: ${st}</span>`;
  return `<div class="bj-vals">${chip('Min', v.mindeporte)}${chip('Comité', v.comite)}</div>`;
}
function emptyState(title, desc) {
  return `<div class="naowee-empty-state"><span class="naowee-empty-state__icon">${I.inbox}</span><p class="naowee-empty-state__title">${esc(title)}</p><p class="naowee-empty-state__description">${esc(desc)}</p></div>`;
}
function msg(variant, icon, html) {
  return `<div class="naowee-message naowee-message--${variant}" style="margin-bottom:16px"><span class="naowee-message__icon">${icon}</span><div class="naowee-message__body"><p class="naowee-message__text">${html}</p></div></div>`;
}

/* ═══════════════ Detalle + acciones (modal) ═══════════════ */
/* ── Modales con animación enter/exit (el CSS de .reg-modal ya trae el easing). ── */
function openModal(innerHtml) {
  const ov = document.createElement('div');
  ov.className = 'reg-modal-overlay bj-modal-ov';
  ov.innerHTML = innerHtml;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('is-open'));   // dispara la animación de entrada
  return ov;
}
function closeModal(ov, after) {
  if (!ov || ov.__closing) return;
  ov.__closing = true;
  ov.classList.remove('is-open');                              // animación de salida
  setTimeout(() => { ov.remove(); if (after) after(); }, 340);
}
/* Dropdown canónico (.naowee-dropdown): toggle --open en el wrapper + selección con check. */
function mountDd(scope, onSelect) {
  const dd = scope.querySelector('.naowee-dropdown');
  if (!dd) return;
  const valueEl = dd.querySelector('.naowee-dropdown__value');
  dd.querySelector('.naowee-dropdown__trigger').addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('naowee-dropdown--open'); });
  dd.querySelectorAll('.naowee-dropdown__opt').forEach((opt) => opt.addEventListener('click', () => {
    valueEl.textContent = opt.dataset.value; valueEl.classList.remove('is-placeholder');
    dd.querySelectorAll('.naowee-dropdown__opt').forEach((o) => o.classList.remove('naowee-dropdown__opt--selected'));
    opt.classList.add('naowee-dropdown__opt--selected');
    dd.classList.remove('naowee-dropdown--open', 'naowee-dropdown--error');
    onSelect(opt.dataset.value);
  }));
  scope.addEventListener('click', (e) => { if (!dd.contains(e.target)) dd.classList.remove('naowee-dropdown--open'); });
}

function openDetail(id) {
  const o = getOrganismo(id);
  if (!o) return;
  const superior = o.parentId ? getOrganismo(o.parentId) : null;
  const supActivo = !superior || superior.estado === 'Activo';
  const esFed = o.tipo === 'federacion';
  const half = halfOf[roleCode];
  const v = o.validacion || { mindeporte: 'pendiente', comite: 'pendiente' };
  const yaVote = esFed && half && v[half] !== 'pendiente';
  const accionable = puedeAccionar && o.estado === 'En revisión' &&
    puedeTransicionar(roleCode, o, 'Activo', superior) && (!esFed || !yaVote);
  const audit = allAudit(id);

  const ov = openModal(`
    <div class="reg-modal bj-modal" role="dialog" aria-modal="true">
      <div class="reg-modal__head">
        <h3 class="reg-modal__title">${TIPO_EMOJI[o.tipo]} ${esc(o.nombre)}</h3>
        <button type="button" class="reg-modal__close" id="bjClose" aria-label="Cerrar">${I.x}</button>
      </div>
      <div class="reg-modal__body bj-detail">
        <div class="bj-detail__badges">${badge(o.estado)}${esFed ? valChips(o) : ''}</div>
        <dl class="bj-kv">
          ${kv('Tipo', TIPO_SING[o.tipo])}${kv('NIT / RUT', o.nit)}${o.deporte && o.deporte !== '—' ? kv('Deporte', o.deporte) : ''}
          ${o.sector ? kv('Sector', o.sector) : ''}${superior ? kv('Superior', superior.nombre + ' · ' + superior.estado) : ''}
          ${o.repLegal ? kv('Rep. legal', `${o.repLegal.nombre || ''} ${o.repLegal.apellido || ''} · ${o.repLegal.tipoDoc || ''} ${o.repLegal.numDoc || ''}`) : ''}
          ${o.ubicacion ? kv('Sede', `${o.ubicacion.ciudad || ''}, ${o.ubicacion.depto || ''}`) : ''}
          ${o.contacto ? kv('Contacto', o.contacto.correo || '') : ''}
        </dl>
        ${docsBlock(o)}
        ${!supActivo ? msg('caution', I.info, `Su superior (${esc(superior.nombre)}) no está <strong>Activo</strong>: no puede aprobarse hasta que se habilite (ORG-06).`) : ''}
        ${esFed && o.estado === 'En revisión' ? `<p class="bj-detail__note">Doble validación: tú registras la mitad de <strong>${roleCode === 'MINDEPORTE' ? 'Ministerio' : 'Comité'}</strong>. Ambas aprobadas → Activo.</p>` : ''}
        <div class="bj-timeline">
          <p class="bj-timeline__title">Trazabilidad</p>
          ${audit.length ? audit.map((a) => `
            <div class="bj-tl-row"><span class="bj-tl-dot"></span><div><div class="bj-tl-head"><strong>${esc(a.accion)}</strong> · ${esc(a.a)}</div><div class="bj-tl-sub">${esc(a.fecha)} · ${esc(a.responsable || a.rol || '—')}${a.motivo ? ' · ' + esc(a.motivo) : ''}</div></div></div>`).join('')
            : '<p class="bj-tl-empty">Sin movimientos registrados.</p>'}
        </div>
      </div>
      <div class="reg-modal__foot bj-actions">
        ${accionable ? `
          <button type="button" class="naowee-btn naowee-btn--mute" id="bjCorr">Solicitar corrección</button>
          <div class="bj-actions__main">
            <button type="button" class="naowee-btn bj-btn-danger" id="bjRej">Rechazar</button>
            <button type="button" class="naowee-btn bj-btn-success" id="bjApr">${esFed ? 'Aprobar mi mitad' : 'Aprobar'}</button>
          </div>`
          : `<button type="button" class="naowee-btn naowee-btn--mute" id="bjCancel">Cerrar</button>`}
      </div>
    </div>`);
  const close = () => closeModal(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('#bjClose').addEventListener('click', close);
  ov.querySelector('#bjCancel')?.addEventListener('click', close);
  if (accionable) {
    ov.querySelector('#bjApr').addEventListener('click', () => { doApprove(id); close(); });
    ov.querySelector('#bjRej').addEventListener('click', () => openMotivo(id, 'Rechazado', ov));
    ov.querySelector('#bjCorr').addEventListener('click', () => openMotivo(id, 'Corrección solicitada', ov));
  }
}
function kv(k, val) { return `<div class="bj-kv__row"><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`; }

/* Documentos de soporte — el peso legal del trámite (reconocimiento deportivo vía IVC,
   aval del Comité, RUT, personería). Si no hay adjuntos, aviso para el revisor. */
const DOC_LABELS = {
  reconocimiento: 'Reconocimiento deportivo (trámite IVC)',
  reconocimientoMunicipal: 'Reconocimiento del ente municipal',
  aval: 'Aval del Comité',
  rut: 'RUT',
  personeria: 'Certificado de personería jurídica'
};
function docsBlock(o) {
  const docs = o.documentos || {};
  const items = Object.keys(DOC_LABELS).filter((k) => docs[k]).map((k) => ({ label: DOC_LABELS[k], file: (docs[k] && docs[k].name) || docs[k] }));
  return `<div class="bj-docs">
    <p class="bj-docs__title">Documentos de soporte</p>
    ${items.length
      ? items.map((d) => `<div class="bj-doc"><span class="bj-doc__ico">${I.doc}</span><div style="min-width:0"><div class="bj-doc__name">${esc(d.label)}</div><div class="bj-doc__file">${esc(d.file)}</div></div><button type="button" class="bj-doc__view" onclick="return false">Ver</button></div>`).join('')
      : `<div class="naowee-message naowee-message--caution"><span class="naowee-message__icon">${I.alert}</span><div class="naowee-message__body"><p class="naowee-message__text">El organismo aún no adjuntó el <strong>reconocimiento deportivo</strong> ni los soportes requeridos. El reconocimiento es un acto legal externo (IVC) — verifícalo antes de aprobar.</p></div></div>`}
  </div>`;
}

/* ── Aprobar ── */
function doApprove(id) {
  const o = getOrganismo(id);
  const meta = { rol: roleCode, responsable: role.userName || roleCode, fecha: today() };
  if (o.tipo === 'federacion') {
    const half = halfOf[roleCode];
    const v = { mindeporte: 'pendiente', comite: 'pendiente', ...(o.validacion || {}), [half]: 'aprobado' };
    const nuevo = resolverFederacion(v);
    const lbl = roleCode === 'MINDEPORTE' ? 'Ministerio aprobó' : 'Comité aprobó';
    if (nuevo !== o.estado) setEstado(id, nuevo, { ...meta, accion: lbl + (nuevo === 'Activo' ? ' → Activo' : ''), patch: { validacion: v } });
    else { updateOrganismo(id, { validacion: v }); auditLog({ orgId: id, ...meta, accion: lbl, de: o.estado, a: o.estado, motivo: '' }); }
  } else {
    setEstado(id, 'Activo', { ...meta, accion: 'Aprobado → Activo' });
  }
  toast('Aprobación registrada', 'success');
  render();
}

/* ── Rechazar / Corrección (motivo obligatorio) ── */
function openMotivo(id, tipoAccion, detailOv) {
  closeModal(detailOv);                    // no apilar: se cierra el detalle (con su animación de salida)
  const o = getOrganismo(id);
  let selMotivo = '';
  const ov = openModal(`
    <div class="reg-modal bj-modal bj-modal--sm bj-modal--overflow" role="dialog" aria-modal="true">
      <div class="reg-modal__head"><h3 class="reg-modal__title">${esc(tipoAccion)} · ${esc(o.nombre)}</h3><button type="button" class="reg-modal__close" id="mtClose" aria-label="Cerrar">${I.x}</button></div>
      <div class="reg-modal__body">
        <div class="bj-field">
          <label class="bj-label">Motivo <span class="bj-req">*</span></label>
          <div class="naowee-dropdown" id="mtDd">
            <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox"><span class="naowee-dropdown__value is-placeholder">Selecciona un motivo…</span><span class="naowee-dropdown__chevron">${I.chevron}</span></button>
            <div class="naowee-dropdown__menu" role="listbox">${MOTIVOS.map((m) => `<div class="naowee-dropdown__opt" role="option" data-value="${esc(m)}">${esc(m)}</div>`).join('')}</div>
          </div>
          <p class="bj-err" id="mtErr" style="display:none">Selecciona un motivo para continuar.</p>
        </div>
        <div class="bj-field">
          <label class="bj-label">Comentario</label>
          <div class="naowee-textfield__input-wrap bj-ta-wrap"><textarea id="mtTxt" rows="3" placeholder="Detalle para el organismo…"></textarea></div>
        </div>
      </div>
      <div class="reg-modal__foot bj-modal__foot"><button type="button" class="naowee-btn naowee-btn--mute" id="mtCancel">Cancelar</button><button type="button" class="naowee-btn bj-btn-danger" id="mtOk">Confirmar ${esc(tipoAccion.toLowerCase())}</button></div>
    </div>`);
  mountDd(ov, (val) => { selMotivo = val; ov.querySelector('#mtErr').style.display = 'none'; });
  const backToDetail = () => closeModal(ov, () => openDetail(id));   // cancelar/cerrar → vuelve al detalle
  ov.addEventListener('click', (e) => { if (e.target === ov) backToDetail(); });
  ov.querySelector('#mtClose').addEventListener('click', backToDetail);
  ov.querySelector('#mtCancel').addEventListener('click', backToDetail);
  ov.querySelector('#mtOk').addEventListener('click', () => {
    if (!selMotivo) { ov.querySelector('#mtErr').style.display = 'block'; ov.querySelector('#mtDd').classList.add('naowee-dropdown--error'); return; }
    const txt = ov.querySelector('#mtTxt').value.trim();
    doReject(id, tipoAccion, txt ? `${selMotivo} — ${txt}` : selMotivo);
    closeModal(ov); render();
  });
}
function doReject(id, tipoAccion, motivo) {
  const o = getOrganismo(id);
  const meta = { rol: roleCode, responsable: role.userName || roleCode, fecha: today(), accion: tipoAccion, motivo };
  const patch = o.tipo === 'federacion' ? { validacion: { mindeporte: 'pendiente', comite: 'pendiente', ...(o.validacion || {}), [halfOf[roleCode]]: 'rechazado' } } : {};
  setEstado(id, 'Rechazado', { ...meta, patch });
  toast(`${tipoAccion} registrada`, 'success');
}

/* ── Wiring ── */
function wire() {
  const s = document.getElementById('bjSearch');
  if (s) s.addEventListener('input', (e) => { query = e.target.value; const p = s.selectionStart; render(); const n = document.getElementById('bjSearch'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (_) {} } });
  const f = document.getElementById('bjFilters');
  if (f) {
    f.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { estadoFiltro = b.dataset.f; render(); }));
    f.querySelectorAll('[data-af]').forEach((b) => b.addEventListener('click', () => { afilFiltro = b.dataset.af; render(); }));
  }
  root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.open)));
  root.querySelectorAll('[data-openafil]').forEach((b) => b.addEventListener('click', () => openAfilDetail(b.dataset.openafil)));
}
function toast(text, variant) { window.naoweeToast && window.naoweeToast(text, variant === 'negative' ? 'error' : 'success'); }

seedBandejaDemo();
seedAfiliacionesDemo(getDemoMode());
render();
