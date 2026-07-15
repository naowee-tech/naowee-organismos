/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Perfil del organismo (T6)
   Ficha 360° SOLO LECTURA de un organismo. Recibe ?id=<orgId>&role=<ROLE>
   (desde la jerarquía T2 y, a futuro, la bandeja T5).

   Estructura: botón Volver + breadcrumb ascendente (ancestorsOf) + header de
   ficha (emoji · nombre · badge de estado · meta) + .naowee-tabs canónicas con
   5 paneles (Información / Representante legal / Documentos / Jerarquía /
   Historial). Las acciones de estado NO viven aquí (viven en la Bandeja): si el
   organismo es accionable por el rol, se ofrece un enlace "Gestionar en la Bandeja".

   RBAC (§11): un rol solo abre organismos dentro de su jurisdicción
   (subtreeOf(scopeFor(role))); MINDEPORTE ve todo. Fuera de jurisdicción →
   "Sin acceso"; id inexistente → "Organismo no encontrado".

   Solo componentes .naowee-* (badge/message/card/empty-state/btn/tabs/breadcrumb)
   + layout page-scoped .od-* (shared/detalle.css).
   ═══════════════════════════════════════════════════════════════ */
import { getRoleFromQuery, ROLES, homeForRole } from './sidebar.js';
import {
  getOrganismo, childrenOf, subtreeOf, ancestorsOf,
  countDescendants, deportistasOf, allAudit, allDeportistas
} from './organismos-data.js';
import { can, scopeFor, isGlobalScope } from './permissions.js';
import { estadoBadgeVariant } from './estados.js';

const params = new URLSearchParams(window.location.search);
const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || {};
const id = params.get('id') || '';
const fromParam = params.get('from') || '';
const root = document.getElementById('detalleRoot');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const EMOJI = { comite: '🏛️', federacion: '🏅', liga: '🚩', club: '🛡️', deportista: '🏃' };
const TYPE_LABEL = { comite: 'Comité', federacion: 'Federación', liga: 'Liga', club: 'Club', deportista: 'Deportista' };
const RECURSO_BY_TIPO = { comite: 'comites', federacion: 'federaciones', liga: 'ligas', club: 'clubes' };
const COBERTURA_BY_TIPO = { comite: 'Nacional', federacion: 'Nacional', liga: 'Departamental', club: 'Municipal' };

/* Documentos de soporte por clave (mismo vocabulario que la bandeja T5). */
const DOC_LABELS = {
  actoAdministrativo: 'Acto administrativo de reconocimiento',
  reconocimiento: 'Reconocimiento deportivo (trámite IVC)',
  reconocimientoMunicipal: 'Reconocimiento del ente municipal',
  aval: 'Aval del Comité',
  rut: 'RUT',
  personeria: 'Certificado de personería jurídica'
};

/* Íconos inline (stroke currentColor). REGLA DURA (bug v0.5.7): cada clave que se
   referencie DEBE existir aquí — el círculo/ícono nunca debe renderizar "undefined". */
const I = {
  back:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  sep:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
  arrow:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  doc:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  alert:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  lock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  inbox:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01"/></svg>'
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)} ${MESES[Number(m) - 1] || m} ${y}`;
}

/* ─── RBAC / jurisdicción (§11) ─── */
function inJurisdiction(orgId) {
  if (isGlobalScope(roleCode)) return true;              // MINDEPORTE ve todo
  const scopeId = scopeFor(roleCode);
  if (roleCode === 'DEPORTISTA') {                       // solo su cadena heredada
    const dep = allDeportistas().find((d) => d.id === scopeId);
    if (!dep || !dep.clubId) return false;
    const chain = new Set([dep.clubId, ...ancestorsOf(dep.clubId).map((a) => a.id)]);
    return chain.has(orgId);
  }
  if (orgId === scopeId) return true;                    // su propio nodo (raíz de su jurisdicción)
  return subtreeOf(scopeId).some((x) => x.id === orgId); // o su subárbol
}

/* ─── Componentes canónicos reutilizados ─── */
function badge(estado) {
  return `<span class="naowee-badge naowee-badge--${estadoBadgeVariant(estado)} naowee-badge--quiet naowee-badge--small">${esc(estado)}</span>`;
}
function depBadge(estado) {
  return estado === 'vinculado'
    ? `<span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">Vinculado</span>`
    : `<span class="naowee-badge naowee-badge--informative naowee-badge--quiet naowee-badge--small">Autodeclarado</span>`;
}
function msg(variant, icon, html) {
  return `<div class="naowee-message naowee-message--${variant}"><span class="naowee-message__icon">${icon}</span><div class="naowee-message__body"><p class="naowee-message__text">${html}</p></div></div>`;
}
function emptyState(title, desc) {
  return `<div class="naowee-empty-state"><span class="naowee-empty-state__icon">${I.inbox}</span><p class="naowee-empty-state__title">${esc(title)}</p><p class="naowee-empty-state__description">${esc(desc)}</p></div>`;
}
function backBtnHtml() {
  return `<div class="od-back"><button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="odBack">${I.back}Volver</button></div>`;
}
function goBack() {
  const target = fromParam && /^[a-z-]+\.html$/.test(fromParam)
    ? `${fromParam}?role=${roleCode}`
    : `${homeForRole(roleCode)}?role=${roleCode}`;
  const ref = document.referrer;
  if (ref && ref.indexOf(window.location.origin) === 0 && ref !== window.location.href && window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = target;
  }
}

/* ═══════════════ Estados de error (404 / sin acceso) ═══════════════ */
function renderNotFound() {
  root.innerHTML = `${backBtnHtml()}
    <div class="naowee-card">
      <div class="naowee-empty-state">
        <span class="naowee-empty-state__icon">${I.building}</span>
        <span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Sin resultado</span>
        <p class="naowee-empty-state__title">Organismo no encontrado</p>
        <p class="naowee-empty-state__description">${id ? `No existe ningún organismo con el identificador <strong>${esc(id)}</strong> en el SUID.` : 'No se indicó qué organismo abrir.'} Vuelve a la jerarquía y selecciona un organismo.</p>
      </div>
    </div>`;
  wireBack();
}
function renderNoAccess(o) {
  root.innerHTML = `${backBtnHtml()}
    <div class="naowee-card">
      <div class="naowee-empty-state">
        <span class="naowee-empty-state__icon">${I.lock}</span>
        <span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Fuera de tu jurisdicción</span>
        <p class="naowee-empty-state__title">Sin acceso a este organismo</p>
        <p class="naowee-empty-state__description">Como <strong>${esc(role.label || roleCode)}</strong> solo puedes consultar los organismos de tu jurisdicción (tu subárbol del SND). Este organismo está fuera de tu dependencia.</p>
      </div>
    </div>`;
  wireBack();
}

/* ═══════════════ Ficha ═══════════════ */
function breadcrumbHtml(o) {
  const chain = [...ancestorsOf(o.id)].reverse();   // [comité … padre]
  const crumbs = chain.map((a) => inJurisdiction(a.id)
    ? `<a class="naowee-breadcrumb__item" href="organismo-detalle.html?id=${encodeURIComponent(a.id)}&role=${roleCode}">${esc(a.nombre)}</a>`
    : `<span class="naowee-breadcrumb__static" title="Fuera de tu jurisdicción">${esc(a.nombre)}</span>`);
  crumbs.push(`<span class="naowee-breadcrumb__current" aria-current="page">${esc(o.nombre)}</span>`);
  return `<nav class="naowee-breadcrumb od-crumbs" aria-label="Ruta jerárquica ascendente">${crumbs.join(`<span class="naowee-breadcrumb__sep">${I.sep}</span>`)}</nav>`;
}

function heroHtml(o) {
  const metaParts = [`NIT <b>${esc(o.nit)}</b>`];
  if (o.deporte && o.deporte !== '—') metaParts.push(esc(o.deporte));
  if (o.sector) metaParts.push(`Sector ${esc(o.sector)}`);
  /* Enlace a la Bandeja si el organismo es accionable por el rol (solo lectura acá). */
  const recurso = RECURSO_BY_TIPO[o.tipo];
  const accionable = recurso && can(roleCode, 'A', recurso) && o.estado === 'En revisión';
  const bandejaLink = accionable
    ? `<a class="naowee-btn naowee-btn--mute naowee-btn--small" href="bandeja.html?role=${roleCode}">${I.inbox}Gestionar en la Bandeja</a>`
    : '';
  return `
    <div class="od-hero">
      <div class="od-hero__emoji">${EMOJI[o.tipo] || '🏛️'}</div>
      <div class="od-hero__main">
        <div class="od-hero__title-row">
          <h1 class="od-hero__name">${esc(o.nombre)}</h1>
          ${badge(o.estado)}
        </div>
        <p class="od-hero__meta">${metaParts.join('<span class="od-dot">·</span>')}</p>
      </div>
      <div class="od-hero__actions">
        <span class="od-ro" title="Perfil de solo lectura — las acciones viven en la Bandeja">${I.lock} Solo lectura</span>
        ${bandejaLink}
      </div>
    </div>`;
}

/* ─── Paneles ─── */
function kvRow(k, v) { return v == null || v === '' ? '' : `<div class="od-kv__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`; }

function infoPanel(o) {
  const u = o.ubicacion || {};
  const sede = [u.direccion, u.ciudad, u.depto].filter(Boolean).join(', ') + (u.zona ? ` (${u.zona})` : '');
  const c = o.contacto || {};
  const contacto = [c.telefono, c.correo].filter(Boolean).join(' · ');
  const rows = [
    kvRow('Tipo de organismo', TYPE_LABEL[o.tipo]),
    o.tipo === 'club' && o.tipoClub ? kvRow('Tipo de club', cap(o.tipoClub)) : '',
    o.tipo === 'liga' ? kvRow('Ámbito', cap(o.ambito || 'Departamental')) : '',
    kvRow('NIT / RUT', o.nit),
    kvRow('Naturaleza jurídica', o.naturaleza || 'Privada, sin ánimo de lucro'),
    kvRow('Cobertura geográfica', o.cobertura || COBERTURA_BY_TIPO[o.tipo] || '—'),
    o.sector && o.sector !== '—' ? kvRow('Sector SND', o.sector) : '',
    o.deporte && o.deporte !== '—' ? kvRow('Deporte', o.deporte) : '',
    kvRow('Sede / dirección', sede.trim().replace(/^,\s*/, '') || '—'),
    kvRow('Contacto institucional', contacto || '—'),
    kvRow('Fecha de registro', fmtDate(o.fechaRegistro))
  ].join('');
  return `<div class="od-block"><dl class="od-kv">${rows}</dl></div>`;
}

function repPanel(o) {
  const r = o.repLegal;
  if (!r) return emptyState('Sin representante legal', 'Este organismo aún no registra los datos de su representante legal.');
  const rows = [
    kvRow('Nombre', `${r.nombre || ''} ${r.apellido || ''}`.trim() || '—'),
    kvRow('Documento', `${r.tipoDoc || ''} ${r.numDoc || ''}`.trim() || '—'),
    kvRow('Correo electrónico', r.correo || '—')
  ].join('');
  return `<div class="od-block"><dl class="od-kv">${rows}</dl></div>
    <div class="od-block">${msg('informative', I.info, 'Los datos del representante legal son <strong>demostrativos y anonimizados</strong> (el caso real del COC se mantiene sin datos personales, handoff §8.5.4).')}</div>`;
}

function docsPanel(o) {
  const docs = o.documentos || {};
  const present = Object.keys(DOC_LABELS).filter((k) => docs[k]);
  const acto = o.actoAdministrativo && !docs.actoAdministrativo ? o.actoAdministrativo : '';
  const rows = [];
  present.forEach((k) => {
    const f = docs[k];
    rows.push(docRow(DOC_LABELS[k], (f && f.name) || (typeof f === 'string' ? f : 'documento.pdf')));
  });
  if (acto) rows.push(docRow(DOC_LABELS.actoAdministrativo, esc(acto)));
  if (!rows.length) {
    return `<div class="od-block">${msg('caution', I.alert,
      'Este organismo aún no tiene <strong>soportes documentales</strong> adjuntos en el SUID (reconocimiento deportivo, aval, RUT, personería). El reconocimiento deportivo es un acto legal <strong>externo (IVC)</strong>: el sistema lo valida y registra — no lo otorga.')}</div>`;
  }
  return `<div class="od-block">${rows.join('')}</div>
    <div class="od-block">${msg('informative', I.info, 'El reconocimiento deportivo se tramita ante el <strong>IVC</strong> (Mindeporte / ente territorial). El SUID lo valida y registra como soporte; no lo emite.')}</div>`;
}
function docRow(label, file) {
  return `<div class="od-doc"><span class="od-doc__ico">${I.doc}</span><div style="min-width:0"><div class="od-doc__name">${esc(label)}</div><div class="od-doc__file">${esc(file)}</div></div><span class="od-doc__tag"><span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">Adjunto</span></span></div>`;
}

function countsHtml(o) {
  const c = countDescendants(o.id);
  const parts = [];
  if (o.tipo === 'comite') parts.push(seg(c.federaciones, 'federación', 'federaciones'));
  if (o.tipo === 'comite' || o.tipo === 'federacion') parts.push(seg(c.ligas, 'liga', 'ligas'));
  if (o.tipo !== 'club') parts.push(seg(c.clubes, 'club', 'clubes'));
  parts.push(seg(c.deportistas, 'deportista', 'deportistas'));
  return `<div class="od-counts">${parts.join('')}</div>`;
}
const seg = (n, s, p) => `<span class="od-count"><b>${n}</b> ${n === 1 ? s : p}</span>`;

function hierPanel(o) {
  const parent = o.parentId ? getOrganismo(o.parentId) : null;
  const parentLine = parent
    ? `<p class="od-parent">Pertenece a: ${inJurisdiction(parent.id)
        ? `<a href="organismo-detalle.html?id=${encodeURIComponent(parent.id)}&role=${roleCode}">${esc(parent.nombre)}</a>`
        : `<strong>${esc(parent.nombre)}</strong>`} · ${TYPE_LABEL[parent.tipo]}</p>`
    : `<p class="od-parent">Nodo raíz del SND (cabeza de sector, sin superior).</p>`;

  let listHtml;
  if (o.tipo === 'club') {
    const deps = deportistasOf(o.id);
    listHtml = deps.length
      ? deps.map((d) => `
        <div class="od-child">
          <span class="od-child__emoji">${EMOJI.deportista}</span>
          <div class="od-child__main">
            <div class="od-child__name">${esc(d.nombre)}</div>
            <div class="od-child__sub">${esc(d.deporte)}${d.modalidad ? ' — ' + esc(d.modalidad) : ''} · ${esc(d.tipoDoc)} ${esc(d.numDoc)}</div>
          </div>
          <span class="od-child__badge">${depBadge(d.estado)}</span>
        </div>`).join('')
      : emptyState('Sin deportistas afiliados', 'Este club aún no tiene deportistas con afiliación confirmada.');
  } else {
    const kids = childrenOf(o.id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    listHtml = kids.length
      ? kids.map((k) => {
          const kc = countDescendants(k.id);
          const sub = k.tipo === 'federacion' ? `${kc.ligas} ${kc.ligas === 1 ? 'liga' : 'ligas'} · ${kc.deportistas} dep.`
            : k.tipo === 'liga' ? `${kc.clubes} ${kc.clubes === 1 ? 'club' : 'clubes'} · ${kc.deportistas} dep.`
            : `${kc.deportistas} ${kc.deportistas === 1 ? 'deportista' : 'deportistas'}`;
          const dep = k.deporte && k.deporte !== '—' ? ` · ${esc(k.deporte)}` : '';
          return `
            <a class="od-child" href="organismo-detalle.html?id=${encodeURIComponent(k.id)}&role=${roleCode}">
              <span class="od-child__emoji">${EMOJI[k.tipo]}</span>
              <div class="od-child__main">
                <div class="od-child__name">${esc(k.nombre)}</div>
                <div class="od-child__sub">${TYPE_LABEL[k.tipo]}${dep} · <b>${esc(sub)}</b></div>
              </div>
              <span class="od-child__badge">${badge(k.estado)}</span>
              <span class="od-child__arrow">${I.arrow}</span>
            </a>`;
        }).join('')
      : emptyState('Sin organismos dependientes', `Este ${TYPE_LABEL[o.tipo].toLowerCase()} aún no tiene organismos de nivel inferior registrados.`);
  }
  return `${countsHtml(o)}${parentLine}<div class="od-children">${listHtml}</div>`;
}

function histPanel(o) {
  const audit = allAudit(o.id);
  if (!audit.length) {
    return emptyState('Sin movimientos registrados',
      'El historial de trazabilidad (aprobaciones, rechazos y solicitudes de corrección con su motivo) aparece aquí cuando el organismo se gestiona desde la Bandeja (ORG-07).');
  }
  const rows = audit.map((a, i) => {
    const trans = a.de && a.a ? `${esc(a.de)} → ${esc(a.a)}` : esc(a.a || '');
    const who = [a.responsable, a.rol && a.rol !== a.responsable ? a.rol : ''].filter(Boolean).join(' · ');
    const sub = [fmtDate(a.fecha), who, a.motivo].filter(Boolean).map(esc).join(' · ');
    return `<div class="od-tl-row"><span class="od-tl-dot"></span><div><div class="od-tl-head"><strong>${esc(a.accion || 'Cambio de estado')}</strong>${trans ? ' · ' + trans : ''}</div><div class="od-tl-sub">${sub}</div></div></div>`;
  }).join('');
  return `<div class="od-block">${rows}</div>`;
}

/* ─── Tabs ─── */
const TABS = [
  ['info', 'Información'],
  ['rep', 'Representante legal'],
  ['docs', 'Documentos'],
  ['hier', 'Jerarquía'],
  ['hist', 'Historial']
];
function panelFor(tab, o) {
  if (tab === 'rep') return repPanel(o);
  if (tab === 'docs') return docsPanel(o);
  if (tab === 'hier') return hierPanel(o);
  if (tab === 'hist') return histPanel(o);
  return infoPanel(o);
}

function renderProfile(o) {
  let active = 'info';
  root.innerHTML = `${backBtnHtml()}
    ${breadcrumbHtml(o)}
    ${heroHtml(o)}
    <div class="naowee-card od-tabs-card">
      <div class="naowee-tabs" id="odTabs" role="tablist">
        ${TABS.map(([t, l]) => `<button type="button" class="naowee-tab ${t === active ? 'naowee-tab--selected' : ''}" role="tab" data-tab="${t}" aria-selected="${t === active}">${esc(l)}</button>`).join('')}
      </div>
      <div id="odPanel"></div>
    </div>`;

  const tabsEl = document.getElementById('odTabs');
  const panelEl = document.getElementById('odPanel');
  const paint = () => { panelEl.innerHTML = `<div class="od-panel" role="tabpanel" tabindex="0">${panelFor(active, o)}</div>`; };
  tabsEl.querySelectorAll('.naowee-tab').forEach((btn) => btn.addEventListener('click', () => {
    active = btn.dataset.tab;
    tabsEl.querySelectorAll('.naowee-tab').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('naowee-tab--selected', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    paint();
  }));
  paint();
  wireBack();
}

/* ─── Wiring común ─── */
function wireBack() {
  document.getElementById('odBack')?.addEventListener('click', goBack);
}

/* ═══════════════ Arranque ═══════════════ */
const o = id ? getOrganismo(id) : null;
if (!o) renderNotFound();
else if (!inJurisdiction(id)) renderNoAccess(o);
else renderProfile(o);
