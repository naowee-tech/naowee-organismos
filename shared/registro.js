/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Wizard de registro por tipo (T3) · v0.3.0
   Registro de Organismos — Jerarquía SUID.

   Patrón: wizard-recipe v1.8 del DS (.naowee-stepper --distributed + shake)
   con pasos DINÁMICOS por tipo (STEPS_POR_ORGANISMO, estilo IVC). Autoregistro
   público Federación/Liga/Club (ORG-02/03/04) + creación interna de Comité
   por el Ministerio (ORG-01). Al enviar crea un organismo 'Preinscrito' vía
   addOrganismo() → aparece en la jerarquía bajo su superior.

   Reglas duras aplicadas: solo .naowee-*; dropdowns toggle --open en el
   WRAPPER (verificar por screenshot); validación POR PASO con shake (nunca
   solo on-submit); sin doble backdrop; borradores parciales (ESC-08); loud
   hover no oscurece (CSS); animar solo transform/opacity.
   ═══════════════════════════════════════════════════════════════ */
import {
  seedDemoData, allOrganismos, getOrganismo, activosDeTipo,
  comitePorSector, addOrganismo, readStore, writeStore, clearStore
} from './organismos-data.js';
import { getRoleFromQuery, ROLES } from './sidebar.js';

/* ─── Iconos inline (currentColor) ─── */
const I = {
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  bang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><line x1="14" y1="10" x2="17" y2="10"/><line x1="14" y1="14" x2="17" y2="14"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

/* ─── Catálogos ─── */
const TIPO_META = {
  comite: { emoji: '🏛️', label: 'Comité (cabeza de sector)', desc: 'Nivel raíz del SND. Solo lo crea el Ministerio (ORG-01).' },
  federacion: { emoji: '🏅', label: 'Federación deportiva', desc: 'Se adscribe a su Comité por sector (ORG-02).' },
  liga: { emoji: '🚩', label: 'Liga deportiva', desc: 'Departamental o distrital, bajo su Federación (ORG-03).' },
  club: { emoji: '🛡️', label: 'Club deportivo', desc: 'Promotor, profesional o escuela, bajo su Liga (ORG-04).' }
};
const TIPO_SINGULAR = { comite: 'Comité', federacion: 'Federación', liga: 'Liga', club: 'Club' };
const SECTORES = ['Olímpico', 'Paralímpico', 'Sordolímpico'];
const TIPO_DOC = ['CC', 'CE', 'PA', 'PEP'];
const ZONAS = ['Urbana', 'Rural'];
const AMBITOS = [
  { v: 'departamental', t: 'Departamental', d: 'Cubre un departamento' },
  { v: 'distrital', t: 'Distrital', d: 'Cubre un distrito' }
];
const TIPOS_CLUB = [
  { v: 'promotor', t: 'Promotor', d: 'Fomento y base' },
  { v: 'profesional', t: 'Profesional', d: 'Alto rendimiento' },
  { v: 'escuela', t: 'Escuela', d: 'Formación deportiva' }
];
const TIPOS_VIA = ['Calle', 'Carrera', 'Diagonal', 'Avenida', 'Transversal', 'Autopista'];
const LETRAS_VIA = ['—', ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')];
const DEPARTAMENTOS = ['Amazonas', 'Antioquia', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca'];
/* Deportes: derivados de las federaciones del seed (únicos, ordenados). */
const DEPORTES = [...new Set(allOrganismos().filter((o) => o.tipo === 'federacion' && o.deporte && o.deporte !== '—').map((o) => o.deporte))].sort((a, b) => a.localeCompare(b, 'es'));

/* Tipo coherente precargado según el rol operativo (§11.2 `can`). */
const PRECARGA_TIPO = { MINDEPORTE: 'comite', COMITE: 'federacion', FEDERACION: 'liga', LIGA: 'club' };

/* ─── Pasos (índice ABSOLUTO — no romper el switch) ─── */
const STEP_LABELS = ['Tipo', 'Datos', 'Representante', 'Sede', 'Documentos', 'Confirmar', 'Listo'];
const STEPS_POR_ORGANISMO = {
  federacion: [0, 1, 2, 3, 4, 5, 6],
  liga: [0, 1, 2, 3, 4, 5, 6],
  club: [0, 1, 2, 3, 4, 5, 6],
  comite: [0, 1, 5, 6]     // Tipo · Datos (reducido) · Confirmar · Listo
};
/* Documentos requeridos por tipo (mock, sin backend). */
const DOCS_POR_TIPO = {
  federacion: [
    { id: 'reconocimiento', label: 'Acto de reconocimiento deportivo del Ministerio' },
    { id: 'aval', label: 'Documento de aval del Comité de su sector' }
  ],
  liga: [{ id: 'reconocimiento', label: 'Reconocimiento deportivo (trámite IVC ante el Ministerio)' }],
  club: [{ id: 'reconocimiento', label: 'Reconocimiento deportivo del ente municipal' }]
};

/* ═══ Estado del wizard ═══ */
const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || ROLES.DEPORTISTA;
const DRAFT_KEY = 'registro-draft';

function freshData() {
  return {
    nombre: '', nit: '', deporte: '', sector: '', tipoClub: '', ambito: '',
    superiorId: '', actoAdministrativo: '',
    repLegal: { tipoDoc: 'CC', numDoc: '', nombre: '', apellido: '', correo: '' },
    ubicacion: { depto: '', ciudad: '', zona: 'Urbana', direccion: '' },
    dirEstruct: { tipoVia: '', numero: '', letra: '—', bis: false, numeroCruce: '', letraCruce: '—', numeroCasa: '', info: '' },
    contacto: { telefono: '', correo: '' },
    documentos: {}, aceptaPoliticas: false
  };
}
let STATE = { tipo: '', step: 0, data: freshData() };
let created = null;   // organismo creado (pantalla de éxito)

/* ─── Utilidades ─── */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function applyMask(type, raw) {
  if (!raw) return '';
  switch (type) {
    case 'tel': return String(raw).replace(/[^0-9+\-()\s]/g, '');
    case 'numeric': return String(raw).replace(/[^0-9]/g, '');
    case 'email': return String(raw).replace(/\s/g, '').toLowerCase();
    default: return String(raw);
  }
}
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setPath(obj, path, val) {
  const keys = path.split('.'); const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
  target[last] = val;
}
function fileSizeFmt(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ─── Pasos aplicables (dinámico por tipo; índice visual continuo) ─── */
function pasosAplicables() { return STATE.tipo ? STEPS_POR_ORGANISMO[STATE.tipo] : [0]; }
function indiceVisual(step) { return pasosAplicables().indexOf(step); }
function docsDelTipo() { return DOCS_POR_TIPO[STATE.tipo] || []; }

/* ═══ Borradores parciales (ESC-08) ═══ */
let saveTimer = null;
function hasContent() {
  if (STATE.tipo) return true;
  const d = STATE.data;
  return !!(d.nombre || d.nit || d.superiorId || d.repLegal.numDoc || d.contacto.correo);
}
function saveDraft() {
  if (created) return;
  writeStore(DRAFT_KEY, { tipo: STATE.tipo, step: STATE.step, data: STATE.data, role: roleCode });
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 500); }
window.addEventListener('beforeunload', () => { if (!created && hasContent()) saveDraft(); });

/* ═══════════════════════════════ Render ═══════════════════════════════ */
const root = document.getElementById('regRoot');

function render() {
  if (created) { renderSuccess(); return; }
  root.innerHTML = `
    <div class="reg-wizard" id="regWizard">
      <div class="reg-stepper-wrap">
        <div class="naowee-stepper naowee-stepper--distributed naowee-stepper--pulse" id="regStepper"></div>
        <div class="reg-stepper-mobile" id="regStepperMobile"></div>
      </div>
      <div class="reg-pane" id="regPane"></div>
      <div class="reg-footer" id="regFooter"></div>
    </div>`;
  renderStepper();
  renderPane();
  renderFooter();
  bindPane();
}

function renderStepper() {
  const wrap = document.getElementById('regStepper');
  const aplicables = pasosAplicables();
  const visualActual = indiceVisual(STATE.step);
  let html = '';
  aplicables.forEach((stepIdx, vi) => {
    if (vi > 0) {
      const done = vi <= visualActual;
      html += `<div class="naowee-stepper__connector ${done ? 'naowee-stepper__connector--done' : ''}"></div>`;
    }
    const isDone = vi < visualActual;
    const isActive = vi === visualActual;
    const cls = isDone ? 'naowee-stepper__step--done' : (isActive ? 'naowee-stepper__step--active' : '');
    const num = isDone ? I.check : (vi + 1);
    html += `<div class="naowee-stepper__step ${cls}" ${isDone ? `data-goto="${stepIdx}"` : ''}>
      <span class="naowee-stepper__number">${num}</span>
      <span class="naowee-stepper__label">${STEP_LABELS[stepIdx]}</span>
    </div>`;
  });
  /* Skeleton dots antes de elegir el tipo (no prometer N pasos). */
  if (!STATE.tipo) {
    for (let i = 0; i < 5; i++) {
      html += '<div class="naowee-stepper__connector naowee-stepper__connector--skeleton"></div>';
      html += '<div class="naowee-stepper__step naowee-stepper__step--skeleton" aria-hidden="true"><span class="naowee-stepper__number"></span></div>';
    }
  }
  wrap.innerHTML = html;
  document.getElementById('regStepperMobile').innerHTML =
    `Paso <strong>${visualActual + 1}</strong> de ${aplicables.length} · ${STEP_LABELS[STATE.step]}`;
}

/* ─── Panel por paso ─── */
function renderPane() {
  const pane = document.getElementById('regPane');
  switch (STATE.step) {
    case 0: pane.innerHTML = paneTipo(); break;
    case 1: pane.innerHTML = STATE.tipo === 'comite' ? paneComite() : paneDatos(); break;
    case 2: pane.innerHTML = paneRepLegal(); break;
    case 3: pane.innerHTML = paneSede(); break;
    case 4: pane.innerHTML = paneDocumentos(); break;
    case 5: pane.innerHTML = paneConfirmar(); break;
  }
}

/* Paso 0 — selector de tipo */
function paneTipo() {
  const tipos = roleCode === 'MINDEPORTE' ? ['comite'] : ['federacion', 'liga', 'club'];
  const cards = tipos.map((t) => {
    const m = TIPO_META[t];
    return `<button type="button" class="reg-tipo-card ${STATE.tipo === t ? 'is-selected' : ''}" data-tipo="${t}">
      <span class="reg-tipo-card__check">${I.check}</span>
      <span class="reg-tipo-card__emoji">${m.emoji}</span>
      <span class="reg-tipo-card__title">${m.label}</span>
      <span class="reg-tipo-card__desc">${m.desc}</span>
    </button>`;
  }).join('');
  const nota = roleCode === 'MINDEPORTE'
    ? 'Como Ministerio del Deporte creas Comités (cabezas de sector), el nivel raíz del SND que reconoce y avala a las federaciones.'
    : 'El registro es público. Se precargó el tipo coherente con tu rol; puedes cambiarlo. El organismo quedará <strong>Preinscrito</strong> hasta que su nivel superior lo valide.';
  return `
    <h2 class="reg-pane__title">¿Qué organismo vas a registrar?</h2>
    <p class="reg-pane__sub">${nota}</p>
    <div class="reg-tipo-grid">${cards}</div>`;
}

/* Paso 1 — datos generales (federación / liga / club) */
function paneDatos() {
  const d = STATE.data;
  let fields = '';
  if (STATE.tipo === 'federacion') {
    fields = `
      ${ddPlaceholder('sector', 'Sector', true)}
      ${ddPlaceholder('deporte', 'Deporte', true)}
      ${tf({ id: 'f-nombre', label: 'Nombre de la federación', required: true, path: 'nombre', value: d.nombre, placeholder: 'Ej: Federación Colombiana de …' })}
      ${tf({ id: 'f-nit', label: 'NIT', required: true, path: 'nit', value: d.nit, placeholder: '800123456-7', mask: 'tel', maxLength: 13 })}`;
  } else if (STATE.tipo === 'liga') {
    fields = `
      ${ddPlaceholder('superior', 'Federación a la que pertenece', true)}
      ${deporteReadonly()}
      ${tf({ id: 'f-nombre', label: 'Nombre de la liga', required: true, path: 'nombre', value: d.nombre, placeholder: 'Ej: Liga de … del Valle' })}
      ${tf({ id: 'f-nit', label: 'NIT / RUT', required: true, path: 'nit', value: d.nit, placeholder: '805010001-1', mask: 'tel', maxLength: 13 })}
      ${choiceGroup('ambito', 'Ámbito', AMBITOS, d.ambito, true)}`;
  } else if (STATE.tipo === 'club') {
    fields = `
      ${ddPlaceholder('superior', 'Liga a la que se afilia', true)}
      ${deporteReadonly()}
      ${tf({ id: 'f-nombre', label: 'Nombre del club', required: true, path: 'nombre', value: d.nombre, placeholder: 'Ej: Club Deportivo …' })}
      ${tf({ id: 'f-nit', label: 'NIT / RUT', required: true, path: 'nit', value: d.nit, placeholder: '805020001-1', mask: 'tel', maxLength: 13 })}
      ${choiceGroup('tipoClub', 'Tipo de club', TIPOS_CLUB, d.tipoClub, true)}`;
  }
  const art = { federacion: 'de la federación', liga: 'de la liga', club: 'del club' }[STATE.tipo] || 'del organismo';
  return `
    <h2 class="reg-pane__title">Datos ${art}</h2>
    <p class="reg-pane__sub">Identifica el organismo y su vínculo con el nivel superior de la jerarquía.</p>
    <form class="reg-form" id="regFormDatos" autocomplete="off">${fields}</form>`;
}

/* Paso 1 (variante) — Comité (ORG-01, reducido) */
function paneComite() {
  const d = STATE.data;
  return `
    <h2 class="reg-pane__title">Datos del Comité</h2>
    <p class="reg-pane__sub">Registro interno del Ministerio. El Comité queda como cabeza de sector (nodo raíz) sin aprobación superior.</p>
    <form class="reg-form" id="regFormDatos" autocomplete="off">
      ${tf({ id: 'f-nombre', label: 'Nombre del Comité', required: true, path: 'nombre', value: d.nombre, placeholder: 'Ej: Comité Olímpico Colombiano' })}
      ${ddPlaceholder('sector', 'Sector', true)}
      ${tf({ id: 'f-nit', label: 'NIT', required: true, path: 'nit', value: d.nit, placeholder: '860028097-1', mask: 'tel', maxLength: 13 })}
      ${tf({ id: 'f-acto', label: 'Acto administrativo de reconocimiento del Ministerio', required: true, path: 'actoAdministrativo', value: d.actoAdministrativo, placeholder: 'Ej: Resolución 001234 de 2026' })}
      <div class="reg-section-label">Aceptación</div>
      ${privacyCheck()}
    </form>`;
}

/* Paso 2 — representante legal */
function paneRepLegal() {
  const r = STATE.data.repLegal;
  return `
    <h2 class="reg-pane__title">Representante legal</h2>
    <p class="reg-pane__sub">Datos de contacto del representante legal del organismo.</p>
    <form class="reg-form" id="regFormRep" autocomplete="off">
      <div class="reg-grid-2">
        ${ddPlaceholder('tipoDoc', 'Tipo de documento', true)}
        ${tf({ id: 'f-numdoc', label: 'Número de documento', required: true, path: 'repLegal.numDoc', value: r.numDoc, placeholder: '10000123', mask: 'numeric', maxLength: 12 })}
        ${tf({ id: 'f-repnombre', label: 'Nombres', required: true, path: 'repLegal.nombre', value: r.nombre, placeholder: 'Ej: María' })}
        ${tf({ id: 'f-repapellido', label: 'Apellidos', required: true, path: 'repLegal.apellido', value: r.apellido, placeholder: 'Ej: Rojas' })}
      </div>
      ${tf({ id: 'f-repcorreo', label: 'Correo electrónico', required: true, path: 'repLegal.correo', value: r.correo, placeholder: 'representante@correo.co', mask: 'email', type: 'email' })}
    </form>`;
}

/* Paso 3 — sede y contacto */
function paneSede() {
  const d = STATE.data;
  const geo = STATE.tipo === 'club'
    ? `<div class="naowee-field-help">Geolocalización simulada: se toma de la dirección estructurada.</div>` : '';
  return `
    <h2 class="reg-pane__title">Sede y contacto</h2>
    <p class="reg-pane__sub">Ubicación de la sede del organismo y datos de contacto institucional.</p>
    <form class="reg-form" id="regFormSede" autocomplete="off">
      ${dirTrigger()}
      ${geo}
      <div class="reg-grid-2">
        ${ddPlaceholder('depto', 'Departamento', true)}
        ${tf({ id: 'f-ciudad', label: 'Ciudad / Municipio', required: true, path: 'ubicacion.ciudad', value: d.ubicacion.ciudad, placeholder: 'Ej: Cali' })}
        ${ddPlaceholder('zona', 'Zona', false)}
        ${tf({ id: 'f-tel', label: 'Teléfono de contacto', required: true, path: 'contacto.telefono', value: d.contacto.telefono, placeholder: '+57 300 123 4567', mask: 'tel', maxLength: 18, type: 'tel' })}
      </div>
      ${tf({ id: 'f-contactocorreo', label: 'Correo de contacto institucional', required: true, path: 'contacto.correo', value: d.contacto.correo, placeholder: 'contacto@organismo.co', mask: 'email', type: 'email' })}
    </form>`;
}

/* Paso 4 — documentos + políticas */
function paneDocumentos() {
  const docs = docsDelTipo().map((doc) => fileField(doc)).join('');
  return `
    <h2 class="reg-pane__title">Documentos y políticas</h2>
    <p class="reg-pane__sub">Adjunta los soportes del organismo. Formatos: PDF, JPG o PNG. (Simulado — no se sube ningún archivo.)</p>
    <form class="reg-form" id="regFormDocs">
      ${docs}
      <div class="reg-section-label">Aceptación</div>
      ${privacyCheck()}
    </form>`;
}

/* Paso 5 — confirmación */
function paneConfirmar() {
  const d = STATE.data;
  const sup = d.superiorId ? getOrganismo(d.superiorId) : null;
  const groups = [];
  const rows = (arr) => arr.filter((r) => r[1]).map((r) => `<div class="reg-kv__k">${esc(r[0])}</div><div class="reg-kv__v">${esc(r[1])}</div>`).join('');

  const general = [
    ['Tipo', TIPO_SINGULAR[STATE.tipo]],
    ['Nombre', d.nombre],
    ['NIT / RUT', d.nit],
    ['Sector', d.sector],
    ['Deporte', d.deporte],
    ['Ámbito', d.ambito],
    ['Tipo de club', d.tipoClub],
    ['Superior', sup ? sup.nombre : ''],
    ['Acto administrativo', d.actoAdministrativo]
  ];
  groups.push(group('Datos generales', 1, rows(general)));

  if (STATE.tipo !== 'comite') {
    const r = d.repLegal;
    groups.push(group('Representante legal', 2, rows([
      ['Documento', r.numDoc ? `${r.tipoDoc} ${r.numDoc}` : ''],
      ['Nombre', [r.nombre, r.apellido].filter(Boolean).join(' ')],
      ['Correo', r.correo]
    ])));
    groups.push(group('Sede y contacto', 3, rows([
      ['Dirección', d.ubicacion.direccion],
      ['Departamento', d.ubicacion.depto],
      ['Ciudad', d.ubicacion.ciudad],
      ['Zona', d.ubicacion.zona],
      ['Teléfono', d.contacto.telefono],
      ['Correo', d.contacto.correo]
    ])));
    const docsList = docsDelTipo().map((doc) => {
      const f = d.documentos[doc.id];
      return [doc.label, f ? f.name : '—'];
    });
    groups.push(group('Documentos', 4, rows(docsList) +
      `<div class="reg-kv__k">Políticas de privacidad</div><div class="reg-kv__v">${d.aceptaPoliticas ? 'Aceptadas' : 'Pendiente'}</div>`));
  }

  return `
    <h2 class="reg-pane__title">Revisa y confirma</h2>
    <p class="reg-pane__sub">Verifica los datos antes de enviar. Al enviar, el organismo se crea en estado <strong>Preinscrito</strong> y aparece en la jerarquía bajo su superior.</p>
    <div class="reg-review">${groups.join('')}</div>`;
}
function group(title, gotoStep, rowsHtml) {
  return `<div class="reg-review__group">
    <div class="reg-review__group-head">
      <span class="reg-review__group-title">${esc(title)}</span>
      <button type="button" class="reg-review__edit" data-goto="${gotoStep}">Editar</button>
    </div>
    <div class="reg-kv">${rowsHtml}</div>
  </div>`;
}

/* ─── Constructores de campo ─── */
function tf(o) {
  const req = o.required ? ' naowee-textfield__label--required' : '';
  const attrs = [
    `id="${o.id}"`, `type="${o.type || 'text'}"`, `class="naowee-textfield__input"`,
    `placeholder="${esc(o.placeholder || '')}"`, `value="${esc(o.value || '')}"`,
    `data-model="${o.path}"`, o.mask ? `data-mask="${o.mask}"` : '',
    o.maxLength ? `maxlength="${o.maxLength}"` : '',
    o.mask === 'numeric' ? 'inputmode="numeric"' : (o.mask === 'tel' ? 'inputmode="tel"' : (o.mask === 'email' ? 'inputmode="email"' : ''))
  ].filter(Boolean).join(' ');
  return `<div class="naowee-textfield" data-field="${o.id}">
    <label class="naowee-textfield__label${req}" for="${o.id}">${esc(o.label)}</label>
    <div class="naowee-textfield__input-wrap"><input ${attrs}></div>
  </div>`;
}
function deporteReadonly() {
  return `<div class="naowee-textfield naowee-textfield--readonly" data-field="f-deporte-ro">
    <label class="naowee-textfield__label">Deporte</label>
    <div class="naowee-textfield__input-wrap">
      <input class="naowee-textfield__input" id="f-deporte-ro" value="${esc(STATE.data.deporte)}" placeholder="Se toma del superior seleccionado" readonly>
    </div>
  </div>`;
}
function ddPlaceholder(key, label, required) {
  const req = required ? ' naowee-dropdown__label--required' : '';
  return `<div class="naowee-dropdown" data-dd="${key}" data-field="dd-${key}" data-required="${required ? 1 : 0}" id="dd-${key}">
    <label class="naowee-dropdown__label${req}">${esc(label)}</label>
    <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="naowee-dropdown__value is-placeholder">Seleccione…</span>
      <span class="naowee-dropdown__chevron">${I.chevron}</span>
    </button>
    <div class="naowee-dropdown__menu" role="listbox"></div>
  </div>`;
}
function choiceGroup(key, label, opts, value, required) {
  const items = opts.map((o) => `
    <label class="reg-choice ${value === o.v ? 'is-selected' : ''}" data-choice="${key}" data-value="${o.v}">
      <input type="radio" name="${key}" value="${o.v}" ${value === o.v ? 'checked' : ''}>
      <span class="reg-choice__dot"></span>
      <span class="reg-choice__body"><span class="reg-choice__title">${esc(o.t)}</span><span class="reg-choice__desc">${esc(o.d)}</span></span>
    </label>`).join('');
  const req = required ? ' naowee-textfield__label--required' : '';
  return `<div class="naowee-textfield" data-field="dd-${key}" style="gap:0">
    <label class="naowee-textfield__label${req}">${esc(label)}</label>
    <div class="reg-choice-group" id="dd-${key}">${items}</div>
  </div>`;
}
function privacyCheck() {
  const c = STATE.data.aceptaPoliticas;
  return `<label class="naowee-checkbox" data-field="f-politicas" id="f-politicas">
    <input type="checkbox" ${c ? 'checked' : ''} data-check="aceptaPoliticas">
    <span class="naowee-checkbox__box">${I.check}</span>
    <span class="naowee-checkbox__label">Acepto las políticas de tratamiento y privacidad de datos del SUID. <strong>(Obligatorio)</strong></span>
  </label>`;
}
function dirTrigger() {
  const v = STATE.data.ubicacion.direccion;
  return `<div class="naowee-textfield naowee-textfield--readonly" data-field="f-dir" id="f-dir">
    <label class="naowee-textfield__label naowee-textfield__label--required">Dirección de la sede</label>
    <div class="naowee-textfield__input-wrap" id="dirTrigger" role="button" tabindex="0">
      <span class="naowee-textfield__prefix">${I.pin}</span>
      <input class="naowee-textfield__input" id="f-dir-input" value="${esc(v)}" placeholder="Diligencie la dirección" readonly style="cursor:pointer">
      <span class="naowee-textfield__prefix" style="color:var(--accent)">${I.edit}</span>
    </div>
  </div>`;
}
function fileField(doc) {
  const f = STATE.data.documentos[doc.id];
  const inner = f
    ? `<div class="naowee-file-uploader__file-tag">
         <span class="file-ico">${I.file}</span>
         <span class="naowee-file-uploader__file-name">${esc(f.name)}</span>
         <span class="naowee-file-uploader__file-size">${esc(f.size)}</span>
         <button type="button" class="naowee-file-uploader__file-dismiss" data-doc-remove="${doc.id}" aria-label="Quitar archivo">${I.x}</button>
       </div>`
    : `<span class="naowee-file-uploader__drop-icon">${I.upload}</span>
       <span class="naowee-file-uploader__drop-title">Cargar archivo (clic o arrastrar)</span>
       <span class="naowee-file-uploader__drop-hint">PDF, JPG o PNG · máx 10 MB</span>
       <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-doc-input="${doc.id}">`;
  return `<div class="naowee-file-uploader ${f ? 'has-file' : ''}" data-field="doc-${doc.id}" id="doc-${doc.id}">
    <label class="naowee-file-uploader__label naowee-file-uploader__label--required">${esc(doc.label)}</label>
    <div class="naowee-file-uploader__drop-zone">${inner}</div>
  </div>`;
}

/* ─── Footer (CTAs) ─── */
function renderFooter() {
  const footer = document.getElementById('regFooter');
  const aplicables = pasosAplicables();
  const vi = indiceVisual(STATE.step);
  const esUltimoFormulario = STATE.step === 5;   // Confirmar → Enviar
  const back = vi > 0
    ? `<button type="button" class="naowee-btn naowee-btn--quiet" id="regBack">Atrás</button>`
    : `<span></span>`;
  const nextLabel = esUltimoFormulario ? 'Enviar registro' : (STATE.step === 0 ? 'Comenzar' : 'Siguiente');
  const nextId = esUltimoFormulario ? 'regSubmit' : 'regNext';
  footer.innerHTML = `${back}<span class="reg-footer__spacer"></span>
    <button type="button" class="naowee-btn naowee-btn--loud" id="${nextId}">${nextLabel}</button>`;
}

/* ═══════════════════════════════ Bind ═══════════════════════════════ */
function bindPane() {
  /* Inputs de texto (data-model + máscara) */
  root.querySelectorAll('input[data-model]').forEach((inp) => {
    inp.addEventListener('input', () => {
      if (inp.dataset.mask) { const p = inp.selectionStart; inp.value = applyMask(inp.dataset.mask, inp.value); try { inp.setSelectionRange(p, p); } catch (_) {} }
      setPath(STATE.data, inp.dataset.model, inp.value);
      clearFieldError(inp.closest('[data-field]'));
      scheduleSave();
    });
  });
  /* Checkbox de políticas */
  root.querySelectorAll('input[data-check]').forEach((cb) => {
    cb.addEventListener('change', () => { STATE.data[cb.dataset.check] = cb.checked; clearFieldError(cb.closest('[data-field]')); scheduleSave(); });
  });
  /* Tarjetas de tipo */
  root.querySelectorAll('.reg-tipo-card').forEach((card) => {
    card.addEventListener('click', () => { selectTipo(card.dataset.tipo); });
  });
  /* Choice groups (ámbito / tipo de club) */
  root.querySelectorAll('.reg-choice').forEach((ch) => {
    ch.addEventListener('click', (e) => {
      e.preventDefault();
      const key = ch.dataset.choice, val = ch.dataset.value;
      STATE.data[key] = val;
      ch.parentElement.querySelectorAll('.reg-choice').forEach((c) => c.classList.toggle('is-selected', c === ch));
      ch.parentElement.classList.remove('is-error');
      ch.querySelector('input').checked = true;
      scheduleSave();
    });
  });
  /* Dropdowns */
  root.querySelectorAll('[data-dd]').forEach((el) => mountDropdown(el));
  /* Documentos (file mock) */
  root.querySelectorAll('[data-doc-input]').forEach((inp) => {
    inp.addEventListener('change', () => onFilePick(inp));
  });
  root.querySelectorAll('[data-doc-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); delete STATE.data.documentos[btn.dataset.docRemove]; scheduleSave(); renderPane(); bindPane(); });
  });
  /* Trigger de dirección */
  const dt = document.getElementById('dirTrigger');
  if (dt) {
    dt.addEventListener('click', openDirModal);
    dt.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDirModal(); } });
  }
  /* Navegación footer + stepper hacia atrás + botón editar */
  document.getElementById('regNext')?.addEventListener('click', next);
  document.getElementById('regSubmit')?.addEventListener('click', submit);
  document.getElementById('regBack')?.addEventListener('click', back);
  root.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => { const s = parseInt(el.dataset.goto, 10); if (s < STATE.step) goToStep(s); });
  });
}

/* ─── Selección de tipo ─── */
function selectTipo(tipo) {
  STATE.tipo = tipo;
  STATE.data.sector = tipo === 'federacion' || tipo === 'comite' ? STATE.data.sector : '';
  renderPane(); renderStepper(); renderFooter(); bindPane();
  scheduleSave();
}

/* ═══ Dropdown genérico (toggle --open en el WRAPPER) ═══ */
function ddOptions(key) {
  const d = STATE.data;
  switch (key) {
    case 'sector': return SECTORES.map((s) => ({ v: s, t: s }));
    case 'deporte': return DEPORTES.map((s) => ({ v: s, t: s }));
    case 'tipoDoc': return TIPO_DOC.map((s) => ({ v: s, t: s }));
    case 'zona': return ZONAS.map((s) => ({ v: s, t: s }));
    case 'depto': return DEPARTAMENTOS.map((s) => ({ v: s, t: s }));
    case 'superior': {
      const tipoSup = STATE.tipo === 'liga' ? 'federacion' : 'liga';
      return activosDeTipo(tipoSup).map((o) => ({ v: o.id, t: o.nombre, sub: `${o.deporte} · NIT ${o.nit}`, emoji: tipoSup === 'federacion' ? '🏅' : '🚩' }));
    }
    default: return [];
  }
}
function ddCurrentValue(key) {
  const d = STATE.data;
  if (key === 'sector') return d.sector;
  if (key === 'deporte') return d.deporte;
  if (key === 'tipoDoc') return d.repLegal.tipoDoc;
  if (key === 'zona') return d.ubicacion.zona;
  if (key === 'depto') return d.ubicacion.depto;
  if (key === 'superior') return d.superiorId;
  return '';
}
function ddApply(key, opt) {
  const d = STATE.data;
  if (key === 'sector') d.sector = opt.v;
  else if (key === 'deporte') d.deporte = opt.v;
  else if (key === 'tipoDoc') d.repLegal.tipoDoc = opt.v;
  else if (key === 'zona') d.ubicacion.zona = opt.v;
  else if (key === 'depto') d.ubicacion.depto = opt.v;
  else if (key === 'superior') {
    d.superiorId = opt.v;
    const sup = getOrganismo(opt.v);
    if (sup) { d.deporte = sup.deporte; if (sup.sector) d.sector = sup.sector; const ro = document.getElementById('f-deporte-ro'); if (ro) ro.value = sup.deporte; }
  }
}
function mountDropdown(el) {
  const key = el.dataset.dd;
  const searchable = key === 'superior' || key === 'deporte' || key === 'depto';
  const opts = ddOptions(key);
  const current = ddCurrentValue(key);
  const trigger = el.querySelector('.naowee-dropdown__trigger');
  const valueEl = el.querySelector('.naowee-dropdown__value');
  const menu = el.querySelector('.naowee-dropdown__menu');

  const selected = opts.find((o) => o.v === current);
  if (selected) { valueEl.textContent = selected.t; valueEl.classList.remove('is-placeholder'); }

  function buildMenu(filter) {
    const q = norm(filter || '');
    const list = opts.filter((o) => !q || norm(o.t + ' ' + (o.sub || '')).includes(q));
    let html = searchable
      ? `<div class="dd-search-wrap"><input type="text" class="dd-search-input" placeholder="Buscar…" aria-label="Buscar opción"></div>` : '';
    if (!list.length) html += `<div class="dd-empty">Sin coincidencias</div>`;
    html += list.map((o) => `<div class="naowee-dropdown__opt ${o.v === ddCurrentValue(key) ? 'is-selected' : ''}" role="option" data-value="${esc(o.v)}">
      ${o.emoji ? `<span class="naowee-dropdown__opt-emoji">${o.emoji}</span>` : ''}
      <span class="naowee-dropdown__opt-main"><span class="naowee-dropdown__opt-name">${esc(o.t)}</span>${o.sub ? `<span class="naowee-dropdown__opt-sub">${esc(o.sub)}</span>` : ''}</span>
      <span class="naowee-dropdown__opt-check">${I.check}</span>
    </div>`).join('');
    menu.innerHTML = html;
    if (searchable) {
      const si = menu.querySelector('.dd-search-input');
      si.addEventListener('click', (e) => e.stopPropagation());
      si.addEventListener('input', () => buildMenu(si.value));
      setTimeout(() => si.focus(), 40);
    }
  }

  function openDd() {
    document.querySelectorAll('.naowee-dropdown--open').forEach((o) => { if (o !== el) o.classList.remove('naowee-dropdown--open'); });
    buildMenu('');
    el.classList.add('naowee-dropdown--open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closeDd() { el.classList.remove('naowee-dropdown--open'); trigger.setAttribute('aria-expanded', 'false'); }

  trigger.addEventListener('click', (e) => { e.stopPropagation(); el.classList.contains('naowee-dropdown--open') ? closeDd() : openDd(); });
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.naowee-dropdown__opt');
    if (!opt) return;
    const o = opts.find((x) => String(x.v) === opt.dataset.value);
    if (!o) return;
    ddApply(key, o);
    valueEl.textContent = o.t; valueEl.classList.remove('is-placeholder');
    el.classList.remove('naowee-dropdown--error');
    clearFieldError(el);
    closeDd(); scheduleSave();
  });
  document.addEventListener('click', (e) => { if (!el.contains(e.target)) closeDd(); });
}

/* ═══ Documentos (mock upload) ═══ */
function onFilePick(inp) {
  const f = inp.files && inp.files[0];
  if (!f) return;
  const ok = /\.(pdf|jpe?g|png)$/i.test(f.name);
  const uploader = inp.closest('.naowee-file-uploader');
  if (!ok) {
    fieldError(uploader, 'Formato no permitido. Usa PDF, JPG o PNG.');
    window.naoweeToast && window.naoweeToast('Formato no permitido (PDF/JPG/PNG)', 'error');
    inp.value = ''; return;
  }
  const id = inp.dataset.docInput;
  STATE.data.documentos[id] = { name: f.name, size: fileSizeFmt(f.size) };
  scheduleSave();
  renderPane(); bindPane();
}

/* ═══ Modal de dirección estructurada (una sola capa de backdrop) ═══ */
function openDirModal() {
  document.getElementById('regDirModal')?.remove();
  const d = STATE.data.dirEstruct;
  const overlay = document.createElement('div');
  overlay.className = 'reg-modal-overlay'; overlay.id = 'regDirModal';
  overlay.innerHTML = `
    <div class="reg-modal" role="dialog" aria-modal="true" aria-labelledby="dirTitle">
      <div class="reg-modal__head">
        <h3 class="reg-modal__title" id="dirTitle">Dirección de la sede</h3>
        <button type="button" class="reg-modal__close" data-close aria-label="Cerrar">${I.x}</button>
      </div>
      <div class="reg-modal__body">
        <div class="reg-grid-2">
          ${dirDd('tipoVia', 'Tipo de vía', TIPOS_VIA, d.tipoVia, true)}
          ${dirTf('numero', 'Número', d.numero, 'numeric', 5, true, '45')}
          ${dirDd('letra', 'Letra', LETRAS_VIA, d.letra, false)}
          <div class="reg-inline-check">
            <label class="naowee-checkbox"><input type="checkbox" id="dir-bis" ${d.bis ? 'checked' : ''}><span class="naowee-checkbox__box">${I.check}</span><span class="naowee-checkbox__label">BIS</span></label>
          </div>
          ${dirTf('numeroCruce', 'Número de cruce', d.numeroCruce, 'numeric', 5, false, '12')}
          ${dirDd('letraCruce', 'Letra de cruce', LETRAS_VIA, d.letraCruce, false)}
          ${dirTf('numeroCasa', 'Número de casa / placa', d.numeroCasa, 'numeric', 5, false, '18')}
          ${dirTf('info', 'Información adicional', d.info, null, 60, false, 'Ej: Torre 2, apto 301')}
        </div>
      </div>
      <div class="reg-modal__foot">
        <button type="button" class="naowee-btn naowee-btn--loud" id="dirSave" ${d.tipoVia && d.numero ? '' : 'disabled'}>Guardar dirección</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  void overlay.offsetWidth; overlay.classList.add('is-open');

  function close() { overlay.classList.remove('is-open'); document.removeEventListener('keydown', onEsc); setTimeout(() => overlay.remove(), 240); }
  function onEsc(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onEsc);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));

  const saveBtn = overlay.querySelector('#dirSave');
  function refreshSave() { saveBtn.disabled = !(d.tipoVia && d.numero); }
  overlay.querySelectorAll('input[data-dir]').forEach((inp) => {
    inp.addEventListener('input', () => { if (inp.dataset.mask) inp.value = applyMask(inp.dataset.mask, inp.value); d[inp.dataset.dir] = inp.value; refreshSave(); });
  });
  overlay.querySelector('#dir-bis').addEventListener('change', (e) => { d.bis = e.target.checked; e.target.closest('.naowee-checkbox').classList.toggle('naowee-checkbox--checked', e.target.checked); });
  overlay.querySelectorAll('[data-dd-dir]').forEach((el) => mountDirDropdown(el, d, refreshSave));

  saveBtn.addEventListener('click', () => {
    STATE.data.ubicacion.direccion = formatDireccion(d);
    close(); scheduleSave();
    renderPane(); bindPane();
  });
}
function dirTf(key, label, value, mask, maxLen, required, ph) {
  const req = required ? ' naowee-textfield__label--required' : '';
  return `<div class="naowee-textfield">
    <label class="naowee-textfield__label${req}">${esc(label)}</label>
    <div class="naowee-textfield__input-wrap"><input class="naowee-textfield__input" data-dir="${key}" ${mask ? `data-mask="${mask}" inputmode="numeric"` : ''} maxlength="${maxLen}" value="${esc(value)}" placeholder="${esc(ph || '')}"></div>
  </div>`;
}
function dirDd(key, label, opts, value, required) {
  const req = required ? ' naowee-dropdown__label--required' : '';
  return `<div class="naowee-dropdown" data-dd-dir="${key}" id="dird-${key}">
    <label class="naowee-dropdown__label${req}">${esc(label)}</label>
    <button type="button" class="naowee-dropdown__trigger"><span class="naowee-dropdown__value ${value && value !== '—' ? '' : 'is-placeholder'}">${value && value !== '—' ? esc(value) : 'Seleccione…'}</span><span class="naowee-dropdown__chevron">${I.chevron}</span></button>
    <div class="naowee-dropdown__menu" role="listbox">${opts.map((o) => `<div class="naowee-dropdown__opt ${o === value ? 'is-selected' : ''}" data-value="${esc(o)}"><span class="naowee-dropdown__opt-name">${esc(o)}</span><span class="naowee-dropdown__opt-check">${I.check}</span></div>`).join('')}</div>
  </div>`;
}
function mountDirDropdown(el, d, refresh) {
  const key = el.dataset.ddDir;
  const trigger = el.querySelector('.naowee-dropdown__trigger');
  const valueEl = el.querySelector('.naowee-dropdown__value');
  const menu = el.querySelector('.naowee-dropdown__menu');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('#regDirModal .naowee-dropdown--open').forEach((o) => { if (o !== el) o.classList.remove('naowee-dropdown--open'); });
    el.classList.toggle('naowee-dropdown--open');
  });
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.naowee-dropdown__opt'); if (!opt) return;
    const v = opt.dataset.value; d[key] = v;
    valueEl.textContent = v === '—' ? 'Seleccione…' : v; valueEl.classList.toggle('is-placeholder', v === '—');
    menu.querySelectorAll('.naowee-dropdown__opt').forEach((o) => o.classList.toggle('is-selected', o === opt));
    el.classList.remove('naowee-dropdown--open'); refresh();
  });
  document.getElementById('regDirModal').addEventListener('click', (e) => { if (!el.contains(e.target)) el.classList.remove('naowee-dropdown--open'); });
}
function formatDireccion(d) {
  if (!d.tipoVia || !d.numero) return '';
  let s = `${d.tipoVia} ${d.numero}`;
  if (d.letra && d.letra !== '—') s += d.letra;
  if (d.bis) s += ' Bis';
  if (d.numeroCruce) { s += ` # ${d.numeroCruce}`; if (d.letraCruce && d.letraCruce !== '—') s += d.letraCruce; }
  if (d.numeroCasa) s += `-${d.numeroCasa}`;
  if (d.info) s += `, ${d.info}`;
  return s;
}

/* ═══════════════════════════ Validación por paso ═══════════════════════════ */
function validateStep(step) {
  const d = STATE.data; const errs = [];
  const reqTf = (field, ok, msg) => { if (!ok) errs.push({ field, kind: 'tf', msg }); };
  if (step === 0) { if (!STATE.tipo) errs.push({ field: null, kind: 'none' }); return errs; }
  if (step === 1) {
    if (STATE.tipo === 'comite') {
      reqTf('f-nombre', d.nombre.trim());
      if (!d.sector) errs.push({ field: 'dd-sector', kind: 'dd' });
      reqTf('f-nit', d.nit.trim());
      reqTf('f-acto', d.actoAdministrativo.trim());
      if (!d.aceptaPoliticas) errs.push({ field: 'f-politicas', kind: 'check' });
    } else if (STATE.tipo === 'federacion') {
      if (!d.sector) errs.push({ field: 'dd-sector', kind: 'dd' });
      if (!d.deporte) errs.push({ field: 'dd-deporte', kind: 'dd' });
      reqTf('f-nombre', d.nombre.trim());
      reqTf('f-nit', d.nit.trim());
    } else if (STATE.tipo === 'liga') {
      if (!d.superiorId) errs.push({ field: 'dd-superior', kind: 'dd' });
      reqTf('f-nombre', d.nombre.trim());
      reqTf('f-nit', d.nit.trim());
      if (!d.ambito) errs.push({ field: 'dd-ambito', kind: 'choice' });
    } else if (STATE.tipo === 'club') {
      if (!d.superiorId) errs.push({ field: 'dd-superior', kind: 'dd' });
      reqTf('f-nombre', d.nombre.trim());
      reqTf('f-nit', d.nit.trim());
      if (!d.tipoClub) errs.push({ field: 'dd-tipoClub', kind: 'choice' });
    }
  } else if (step === 2) {
    if (!d.repLegal.tipoDoc) errs.push({ field: 'dd-tipoDoc', kind: 'dd' });
    reqTf('f-numdoc', d.repLegal.numDoc.trim());
    reqTf('f-repnombre', d.repLegal.nombre.trim());
    reqTf('f-repapellido', d.repLegal.apellido.trim());
    if (!EMAIL_RE.test(d.repLegal.correo)) errs.push({ field: 'f-repcorreo', kind: 'tf', msg: 'Ingresa un correo válido' });
  } else if (step === 3) {
    reqTf('f-dir', d.ubicacion.direccion.trim(), 'Diligencia la dirección');
    if (!d.ubicacion.depto) errs.push({ field: 'dd-depto', kind: 'dd' });
    reqTf('f-ciudad', d.ubicacion.ciudad.trim());
    reqTf('f-tel', d.contacto.telefono.trim());
    if (!EMAIL_RE.test(d.contacto.correo)) errs.push({ field: 'f-contactocorreo', kind: 'tf', msg: 'Ingresa un correo válido' });
  } else if (step === 4) {
    docsDelTipo().forEach((doc) => { if (!d.documentos[doc.id]) errs.push({ field: 'doc-' + doc.id, kind: 'file' }); });
    if (!d.aceptaPoliticas) errs.push({ field: 'f-politicas', kind: 'check' });
  }
  return errs;
}
/* Devuelve el wrapper del campo por su data-field (id vive en el <input>). */
function fieldEl(field) { return field ? document.querySelector(`[data-field="${field}"]`) : null; }
function shakeErrors(errs) {
  let first = null;
  errs.forEach((e) => {
    const el = e.field ? fieldEl(e.field) : document.querySelector('.reg-tipo-grid');
    if (!el) return;
    if (!first) first = el;
    if (e.kind === 'dd') { el.classList.add('naowee-dropdown--error'); }
    else if (e.kind === 'choice') { el.querySelector('.reg-choice-group')?.classList.add('is-error'); }
    else if (e.kind === 'tf') { fieldError(el, e.msg || 'Este campo es obligatorio'); }
    else if (e.kind === 'file') { fieldError(el, 'Adjunta este documento'); }
    else if (e.kind === 'check') { el.classList.add('naowee-checkbox--error'); }
    el.classList.remove('naowee-shake'); void el.offsetWidth; el.classList.add('naowee-shake');
    setTimeout(() => el.classList.remove('naowee-shake'), 500);
  });
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
/* Marca error en un textfield / file-uploader (borde + helper negative). */
function fieldError(el, msg) {
  if (!el) return;
  el.classList.add(el.classList.contains('naowee-file-uploader') ? 'naowee-file-uploader--error' : 'naowee-textfield--error');
  if (!el.querySelector('.naowee-helper')) {
    const h = document.createElement('div');
    h.className = 'naowee-helper naowee-helper--negative';
    h.innerHTML = `<span class="naowee-helper__text"><span class="naowee-helper__badge">${I.bang}</span><span>${esc(msg)}</span></span>`;
    el.appendChild(h);
  }
}
function clearFieldError(el) {
  if (!el) return;
  el.classList.remove('naowee-textfield--error', 'naowee-file-uploader--error', 'naowee-checkbox--error', 'naowee-dropdown--error');
  el.querySelector('.naowee-helper')?.remove();
  el.querySelector('.reg-choice-group')?.classList.remove('is-error');
}

/* ═══════════════════════════ Navegación ═══════════════════════════ */
function next() {
  const errs = validateStep(STATE.step);
  if (errs.length) { shakeErrors(errs); return; }
  const aplicables = pasosAplicables();
  const vi = indiceVisual(STATE.step);
  const nextStep = aplicables[Math.min(vi + 1, aplicables.length - 1)];
  if (nextStep === 6) { submit(); return; }   // (comité: Confirmar es el penúltimo)
  STATE.step = nextStep;
  render(); saveDraft();
  document.getElementById('regWizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function back() {
  const aplicables = pasosAplicables();
  const vi = indiceVisual(STATE.step);
  if (vi <= 0) return;
  STATE.step = aplicables[vi - 1];
  render(); saveDraft();
}
function goToStep(step) {
  if (!pasosAplicables().includes(step)) return;
  STATE.step = step; render(); saveDraft();
}

/* ═══════════════════════════ Envío ═══════════════════════════ */
function submit() {
  const errs = validateStep(5);   // por si acaso
  if (errs.length) { shakeErrors(errs); return; }
  const d = STATE.data;
  let parentId = null, sector = d.sector || '';
  if (STATE.tipo === 'federacion') { const c = comitePorSector(d.sector); parentId = c ? c.id : 'COC'; }
  else if (STATE.tipo === 'liga' || STATE.tipo === 'club') {
    parentId = d.superiorId; const sup = getOrganismo(d.superiorId); if (sup) sector = sup.sector;
  } else if (STATE.tipo === 'comite') { parentId = null; }

  const org = {
    tipo: STATE.tipo, nombre: d.nombre.trim(), nit: d.nit.trim(),
    sector, deporte: STATE.tipo === 'comite' ? '—' : (d.deporte || '—'),
    parentId, estado: 'Preinscrito',
    repLegal: { ...d.repLegal }, ubicacion: { ...d.ubicacion }, contacto: { ...d.contacto },
    documentos: { ...d.documentos }, aceptaPoliticas: d.aceptaPoliticas
  };
  if (STATE.tipo === 'club') org.tipoClub = d.tipoClub;
  if (STATE.tipo === 'liga') org.ambito = d.ambito;
  if (STATE.tipo === 'comite') org.actoAdministrativo = d.actoAdministrativo;

  created = addOrganismo(org);
  clearStore(DRAFT_KEY);
  STATE.step = 6;
  window.naoweeToast && window.naoweeToast('Registro enviado — organismo Preinscrito', 'success');
  render();
}

/* ═══════════════════════════ Pantalla de éxito ═══════════════════════════ */
function renderSuccess() {
  const org = created;
  const sup = org.parentId ? getOrganismo(org.parentId) : null;
  root.innerHTML = `
    <div class="reg-wizard">
      <div class="reg-stepper-wrap">
        <div class="naowee-stepper naowee-stepper--distributed" id="regStepper"></div>
        <div class="reg-stepper-mobile" id="regStepperMobile"></div>
      </div>
      <div class="reg-success" id="regSuccess">
        <div class="reg-confetti" id="regConfetti"></div>
        <div class="reg-success__hero">
          <div class="reg-success__check">${I.check}</div>
          <h2 class="reg-success__title">¡Registro enviado con éxito!</h2>
          <p class="reg-success__lead">${esc(TIPO_SINGULAR[org.tipo])} <strong>${esc(org.nombre)}</strong> quedó en estado <strong>Preinscrito</strong>. ${org.tipo === 'comite' ? 'Como cabeza de sector queda activo sin aprobación superior una vez completado.' : 'Su nivel superior la revisará desde la Bandeja de aprobaciones.'}</p>
          <div class="naowee-message naowee-message--informative" style="max-width:460px;margin:0 auto;text-align:left">
            <span class="naowee-message__icon">${I.bang}</span>
            <div class="naowee-message__body"><p class="naowee-message__text">Este registro ya aparece en la jerarquía del SND bajo su superior. La aprobación (Preinscrito → En revisión → Activo) se ejercita en la Bandeja.</p></div>
          </div>
          <div class="reg-receipt">
            <div class="reg-receipt__head">
              <span class="reg-receipt__ava">${TIPO_META[org.tipo].emoji}</span>
              <div><div class="reg-receipt__name">${esc(org.nombre)}</div><div class="reg-receipt__meta">${esc(TIPO_SINGULAR[org.tipo])} · NIT ${esc(org.nit)}</div></div>
            </div>
            <div class="reg-receipt__rows">
              ${receiptRow(I.id, 'Radicado', org.id)}
              ${receiptRow(I.tag, 'Estado', 'Preinscrito')}
              ${org.deporte && org.deporte !== '—' ? receiptRow(I.layers, 'Deporte', org.deporte) : ''}
              ${sup ? receiptRow(I.tree, 'Superior', sup.nombre) : ''}
              ${receiptRow(I.pin, 'Fecha de registro', org.fechaRegistro)}
            </div>
          </div>
          <div class="reg-success__actions">
            <a class="naowee-btn naowee-btn--loud" href="jerarquia.html?role=${encodeURIComponent(roleCode)}">Ver en la jerarquía</a>
            <button type="button" class="naowee-btn naowee-btn--quiet" id="regAnother">Registrar otro organismo</button>
          </div>
        </div>
      </div>
    </div>`;
  spawnConfetti();
  document.getElementById('regAnother').addEventListener('click', () => {
    created = null; STATE = { tipo: precargaTipo(), step: 0, data: freshData() };
    render();
  });
}
function receiptRow(ico, lbl, val) {
  return `<div class="reg-kv-row"><span class="reg-kv-row__ico">${ico}</span><span class="reg-kv-row__lbl">${esc(lbl)}</span><span class="reg-kv-row__val">${esc(val)}</span></div>`;
}
function spawnConfetti() {
  const wrap = document.getElementById('regConfetti');
  if (!wrap || wrap.children.length > 0) return;   // idempotente
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#FF7500', '#d74009', '#1f8923', '#1f78d1', '#ffbf75'];
  for (let i = 0; i < 42; i++) {
    const s = document.createElement('span');
    s.style.left = (Math.random() * 100) + '%';
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = (Math.random() * 0.6) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    s.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
    wrap.appendChild(s);
  }
}

/* ═══════════════════════════ Arranque ═══════════════════════════ */
function precargaTipo() {
  return roleCode === 'MINDEPORTE' ? 'comite' : (PRECARGA_TIPO[roleCode] || '');
}

function offerDraft() {
  const draft = readStore(DRAFT_KEY, null);
  const bar = document.getElementById('regDraftBar');
  if (!draft || (!draft.tipo && !(draft.data && (draft.data.nombre || draft.data.nit)))) {
    startFresh(); return;
  }
  const tipoLbl = draft.tipo ? TIPO_SINGULAR[draft.tipo] : 'sin tipo';
  bar.innerHTML = `
    <div class="naowee-message naowee-message--caution" role="status">
      <span class="naowee-message__icon">${I.bang}</span>
      <div class="naowee-message__body" style="flex:1">
        <p class="naowee-message__title" style="font-size:13px">Tienes un registro sin terminar</p>
        <p class="naowee-message__text">Borrador de <strong>${esc(tipoLbl)}</strong>${draft.data && draft.data.nombre ? ` · ${esc(draft.data.nombre)}` : ''}. ¿Deseas retomarlo?</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" id="draftResume">Retomar borrador</button>
      <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="draftDiscard">Descartar</button>
    </div>`;
  bar.style.display = 'block';
  document.getElementById('draftResume').addEventListener('click', () => {
    STATE = { tipo: draft.tipo || '', step: draft.step || 0, data: { ...freshData(), ...draft.data } };
    bar.style.display = 'none'; bar.innerHTML = '';
    render();
  });
  document.getElementById('draftDiscard').addEventListener('click', () => {
    clearStore(DRAFT_KEY); bar.style.display = 'none'; bar.innerHTML = '';
    startFresh();
  });
  /* Muestra el wizard vacío detrás del aviso para dar contexto. */
  startFresh();
}
function startFresh() {
  STATE = { tipo: precargaTipo(), step: 0, data: freshData() };
  render();
}

seedDemoData();
offerDraft();
