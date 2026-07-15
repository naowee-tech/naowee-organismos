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
  updateOrganismo, setEstado, auditLog, allAudit
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
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
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
    repLegal: { tipoDoc: 'CC', numDoc: '79620001', nombre: 'Andrés', apellido: 'Vélez Mora', correo: 'presidencia@fedetriatlon.demo.co' },
    ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Calle 63 # 47-06' },
    contacto: { telefono: '6014801122', correo: 'contacto@fedetriatlon.demo.co' } });
  addOrganismo({ ...base, nombre: 'Federación Colombiana de Surf', nit: '901620002-2', deporte: 'Surf',
    validacion: { mindeporte: 'aprobado', comite: 'pendiente' },
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
  if (!target) return renderNoBandeja();
  const all = bandejaOrgs();
  const rows = filtered(all);
  const pend = all.filter((o) => o.estado === 'En revisión').length;
  const anchor = scopeId ? getOrganismo(scopeId) : null;

  root.innerHTML = `
    ${msg('informative', I.info, puedeAccionar
      ? `Bandeja de <strong>${target.plural}</strong> ${anchor ? `de <strong>${esc(anchor.nombre)}</strong>` : 'del SND'}. Aprueba, rechaza o solicita corrección (motivo obligatorio). ${target.tipo === 'federacion' ? 'La federación requiere <strong>doble validación</strong>: Ministerio + Comité.' : ''}`
      : `Vista de <strong>oversight</strong> (solo lectura) de ${target.plural}.`)}

    <div class="naowee-card bj-toolbar">
      <div class="naowee-searchbox bj-search">
        <span class="naowee-searchbox__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input class="naowee-searchbox__input" id="bjSearch" placeholder="Buscar por nombre o NIT…" value="${esc(query)}">
      </div>
      <div class="bj-filters" id="bjFilters">
        ${['Accionables', 'En revisión', 'Rechazado', 'Activo', 'Todos'].map((f) => `<button type="button" class="bj-chip-filter ${estadoFiltro === f ? 'is-active' : ''}" data-f="${f}">${f}</button>`).join('')}
      </div>
      <span class="bj-count">${rows.length} de ${all.length} · <strong>${pend}</strong> pendientes</span>
    </div>

    <div class="naowee-card bj-list">
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
    roleCode === 'CLUB' ? 'Bandeja de afiliaciones (próximamente)' : 'Sin bandeja',
    roleCode === 'CLUB'
      ? 'Las solicitudes de afiliación de deportistas a tu club se aprobarán aquí en la siguiente entrega (T7).'
      : 'Tu rol no gestiona aprobaciones de organismos.')}</div>`;
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

  const ov = document.createElement('div');
  ov.className = 'reg-modal-overlay is-open bj-modal-ov';
  ov.innerHTML = `
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
        <button type="button" class="naowee-btn naowee-btn--mute" id="bjCancel">Cerrar</button>
        ${accionable ? `
          <button type="button" class="naowee-btn naowee-btn--mute" id="bjCorr">Solicitar corrección</button>
          <button type="button" class="naowee-btn bj-btn-danger" id="bjRej">Rechazar</button>
          <button type="button" class="naowee-btn naowee-btn--loud" id="bjApr">${esFed ? 'Aprobar mi mitad' : 'Aprobar'}</button>` : ''}
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('#bjClose').addEventListener('click', close);
  ov.querySelector('#bjCancel').addEventListener('click', close);
  if (accionable) {
    ov.querySelector('#bjApr').addEventListener('click', () => { doApprove(id); close(); });
    ov.querySelector('#bjRej').addEventListener('click', () => openMotivo(id, 'Rechazado', close));
    ov.querySelector('#bjCorr').addEventListener('click', () => openMotivo(id, 'Corrección solicitada', close));
  }
}
function kv(k, val) { return `<div class="bj-kv__row"><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`; }

/* ── Aprobar ── */
function doApprove(id) {
  const o = getOrganismo(id);
  const meta = { rol: roleCode, responsable: role.name || roleCode, fecha: today() };
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
function openMotivo(id, tipoAccion, closeDetail) {
  const o = getOrganismo(id);
  const ov = document.createElement('div');
  ov.className = 'reg-modal-overlay is-open bj-modal-ov';
  ov.innerHTML = `
    <div class="reg-modal bj-modal bj-modal--sm" role="dialog" aria-modal="true">
      <div class="reg-modal__head"><h3 class="reg-modal__title">${tipoAccion} · ${esc(o.nombre)}</h3><button type="button" class="reg-modal__close" id="mtClose" aria-label="Cerrar">${I.x}</button></div>
      <div class="reg-modal__body">
        <label class="bj-label">Motivo <span class="bj-req">*</span></label>
        <select class="bj-select" id="mtSel"><option value="">Selecciona un motivo…</option>${MOTIVOS.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select>
        <label class="bj-label" style="margin-top:12px">Comentario</label>
        <textarea class="bj-textarea" id="mtTxt" rows="3" placeholder="Detalle para el organismo…"></textarea>
        <p class="bj-err" id="mtErr" style="display:none">Selecciona un motivo para continuar.</p>
      </div>
      <div class="reg-modal__foot bj-modal__foot"><button type="button" class="naowee-btn naowee-btn--mute" id="mtCancel">Cancelar</button><button type="button" class="naowee-btn bj-btn-danger" id="mtOk">Confirmar ${tipoAccion.toLowerCase()}</button></div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('#mtClose').addEventListener('click', close);
  ov.querySelector('#mtCancel').addEventListener('click', close);
  ov.querySelector('#mtOk').addEventListener('click', () => {
    const sel = ov.querySelector('#mtSel').value;
    const txt = ov.querySelector('#mtTxt').value.trim();
    if (!sel) { ov.querySelector('#mtErr').style.display = 'block'; ov.querySelector('#mtSel').classList.add('bj-select--err'); return; }
    doReject(id, tipoAccion, txt ? `${sel} — ${txt}` : sel);
    close(); if (closeDetail) closeDetail(); render();
  });
}
function doReject(id, tipoAccion, motivo) {
  const o = getOrganismo(id);
  const meta = { rol: roleCode, responsable: role.name || roleCode, fecha: today(), accion: tipoAccion, motivo };
  const patch = o.tipo === 'federacion' ? { validacion: { mindeporte: 'pendiente', comite: 'pendiente', ...(o.validacion || {}), [halfOf[roleCode]]: 'rechazado' } } : {};
  setEstado(id, 'Rechazado', { ...meta, patch });
  toast(`${tipoAccion} registrada`, 'success');
}

/* ── Wiring ── */
function wire() {
  const s = document.getElementById('bjSearch');
  if (s) s.addEventListener('input', (e) => { query = e.target.value; const p = s.selectionStart; render(); const n = document.getElementById('bjSearch'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (_) {} } });
  const f = document.getElementById('bjFilters');
  if (f) f.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { estadoFiltro = b.dataset.f; render(); }));
  root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.open)));
}
function toast(text, variant) { window.naoweeToast && window.naoweeToast(text, variant === 'negative' ? 'error' : 'success'); }

seedBandejaDemo();
render();
