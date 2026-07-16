/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — FORMULARIO PÚBLICO DE REGISTRO (HURU-01..04)
   Registro SIN autenticación previa. Selector de tipo de usuario y
   wizard adaptativo de 4 pasos: Tipo · Datos · Documentos · Listo.
     · Deportista (registro propio) — HURU-01
     · Deportista vía padre/tutor (menor) — HURU-02
     · Personal deportivo (rol + certificaciones) — HURU-03
     · Entidad deportiva (docs de soporte → Preinscrito) — HURU-04
   Criterios cubiertos: adapta por tipo, valida documento no registrado,
   detecta edad <18 (bloquea registro autónomo → tutor), parentesco +
   firma de consentimiento, rol específico + info profesional, docs de
   soporte de entidad, checkbox de políticas obligatorio, notificación
   email/SMS al éxito, nota de API registraduría, responsive.
   Reusa .naowee-* de forms.css (stepper, textfield, dropdown, choice,
   checkbox, file-uploader botón, message, success/confetti).
   Datos demo efímeros en sessionStorage (prefijo naowee-organismos-).
   ═══════════════════════════════════════════════════════════════ */
import { allDeportistas, allOrganismos, crearPreinscrito } from './organismos-data.js';

/* ─── util ─── */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const norm = (s) => [...String(s == null ? '' : s)].map((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).join('');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function applyMask(type, raw) {
  if (!raw) return '';
  if (type === 'tel') return String(raw).replace(/[^0-9+\-()\s]/g, '');
  if (type === 'numeric') return String(raw).replace(/[^0-9]/g, '');
  if (type === 'email') return String(raw).replace(/\s/g, '').toLowerCase();
  return String(raw);
}
function fileSizeFmt(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
function edadDe(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return null; const hoy = new Date('2026-07-16'); let e = hoy.getFullYear() - (+m[1]); const mo = (hoy.getMonth() + 1) - (+m[2]); if (mo < 0 || (mo === 0 && hoy.getDate() < (+m[3]))) e--; return e; }

const I = {
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  bang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>',
  api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  athlete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M4 17l4-1 2-4 4 2 1 4"/><path d="M10 12l-2 5"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M17 11l2 2 4-4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/></svg>',
  entity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>'
};

/* ─── catálogos ─── */
const TIPOS = [
  { v: 'deportista', emoji: I.athlete, t: 'Deportista', d: 'Registro propio o a través de un padre/tutor (menor de edad).' },
  { v: 'personal', emoji: I.staff, t: 'Personal deportivo', d: 'Entrenador, profesor, médico deportivo, delegado, coordinador, juez…' },
  { v: 'entidad', emoji: I.entity, t: 'Entidad deportiva', d: 'Club, liga, federación o escuela. Queda Preinscrita para aprobación.' }
];
const MODOS = [
  { v: 'propio', t: 'Registro propio', d: 'Soy mayor de edad y me registro yo mismo.' },
  { v: 'tutor', t: 'A través de un padre/tutor', d: 'Registro a un menor de edad bajo mi tutela.' }
];
const VINCULOS = [{ v: 'Padre', t: 'Padre' }, { v: 'Madre', t: 'Madre' }, { v: 'Tutor', t: 'Tutor legal' }];
const ROLES_PERSONAL = ['Entrenador', 'Profesor / Instructor', 'Médico deportivo', 'Fisioterapeuta', 'Delegado', 'Coordinador', 'Juez / Árbitro', 'Otro'];
const ENT_TIPOS = [
  { v: 'club-promotor', t: 'Club promotor', d: 'Club de formación / promoción deportiva.' },
  { v: 'club-profesional', t: 'Club profesional', d: 'Club de rendimiento / profesional.' },
  { v: 'liga', t: 'Liga departamental', d: 'Liga departamental o distrital por deporte.' },
  { v: 'federacion', t: 'Federación', d: 'Federación deportiva nacional.' },
  { v: 'escuela', t: 'Escuela deportiva', d: 'Escuela de formación deportiva.' }
];
const TIPOS_DOC = ['CC', 'TI', 'CE', 'PA'];
const TIPODOC_LABEL = { CC: 'Cédula de ciudadanía (CC)', TI: 'Tarjeta de identidad (TI)', CE: 'Cédula de extranjería (CE)', PA: 'Pasaporte (PA)' };
const DEPORTES = [...new Set(allOrganismos().filter((o) => o.tipo === 'federacion' && o.deporte && o.deporte !== '—').map((o) => o.deporte))].sort((a, b) => a.localeCompare(b, 'es'));

/* Documentos ya registrados (mock) para validar duplicidad por número (HURU-01/03). */
const DOCS_REGISTRADOS = new Set([
  ...allDeportistas().map((d) => String(d.numDoc)),
  ...allOrganismos().map((o) => o.repLegal && o.repLegal.numDoc).filter(Boolean).map(String),
  '1000000001', '79620001'
]);
function docRegistrado(num) { return DOCS_REGISTRADOS.has(String(num || '').trim()); }

/* ─── estado ─── */
const STEP_LABELS = ['Tipo', 'Datos', 'Documentos', 'Listo'];
const STATE = {
  step: 0, created: false, _armedStep: null,
  tipo: null, modo: null, rol: '', entTipo: null,
  d: {
    tipoDoc: '', numDoc: '', nombres: '', apellidos: '', fechaNac: '', sexo: '', correo: '', telefono: '', deporte: '',
    // tutor
    vinculo: '', tutorTipoDoc: '', tutorDoc: '', tutorNombres: '', tutorCorreo: '', tutorTel: '', firma: false,
    // personal
    profesion: '', experiencia: '', tarjetaProf: '',
    // entidad
    nit: '', entNombre: '', repNombre: '', repDoc: '', repCorreo: '', depto: '', ciudad: '',
    // docs (nombre de archivo)
    docs: {},
    aceptaPoliticas: false
  }
};
const root = () => document.getElementById('rpRoot');

/* ═══════════════ Render ═══════════════ */
function render() {
  if (STATE.created) return renderSuccess();
  root().innerHTML = `
    <div class="reg-wizard" id="rpWizard">
      <div class="reg-stepper-wrap">
        <div class="naowee-stepper naowee-stepper--distributed naowee-stepper--pulse" id="rpStepper"></div>
        <div class="reg-stepper-mobile" id="rpStepperMobile"></div>
      </div>
      <div class="reg-pane" id="rpPane"></div>
      <div class="reg-footer" id="rpFooter"></div>
    </div>`;
  renderStepper(); renderPane(); renderFooter(); bindPane();
}

function renderStepper() {
  const wrap = document.getElementById('rpStepper');
  let html = '';
  STEP_LABELS.forEach((lbl, i) => {
    if (i > 0) html += `<div class="naowee-stepper__connector ${i <= STATE.step ? 'naowee-stepper__connector--done' : ''}"></div>`;
    const cls = i < STATE.step ? 'naowee-stepper__step--done' : (i === STATE.step ? 'naowee-stepper__step--active' : '');
    html += `<div class="naowee-stepper__step ${cls}"><span class="naowee-stepper__number">${i < STATE.step ? I.check : (i + 1)}</span><span class="naowee-stepper__label">${lbl}</span></div>`;
  });
  wrap.innerHTML = html;
  document.getElementById('rpStepperMobile').innerHTML = `Paso <strong>${STATE.step + 1}</strong> de ${STEP_LABELS.length} · ${STEP_LABELS[STATE.step]}`;
}

function renderPane() {
  const p = document.getElementById('rpPane');
  if (STATE.step === 0) p.innerHTML = paneTipo();
  else if (STATE.step === 1) p.innerHTML = paneDatos();
  else if (STATE.step === 2) p.innerHTML = paneDocs();
}

/* ── Paso 0 — tipo de usuario ── */
function paneTipo() {
  const cards = TIPOS.map((t) => `
    <button type="button" class="reg-tipo-card ${STATE.tipo === t.v ? 'is-selected' : ''}" data-tipo="${t.v}">
      <span class="reg-tipo-card__check">${I.check}</span>
      <span class="reg-tipo-card__emoji">${t.emoji}</span>
      <span class="reg-tipo-card__title">${t.t}</span>
      <span class="reg-tipo-card__desc">${t.d}</span>
    </button>`).join('');
  const modo = STATE.tipo === 'deportista'
    ? `<div class="rp-subchoice">${choiceGroup('modo', '¿Quién realiza el registro?', MODOS, STATE.modo, true)}</div>` : '';
  return `
    <h2 class="reg-pane__title">¿Qué tipo de usuario eres?</h2>
    <p class="reg-pane__sub">Registro público del SUID — no necesitas iniciar sesión. Elige el tipo y el formulario se adapta a tu caso.</p>
    <div class="reg-tipo-grid">${cards}</div>
    ${modo}`;
}

/* ── Paso 1 — datos (adaptativo) ── */
function paneDatos() {
  const d = STATE.d;
  if (STATE.tipo === 'deportista' && STATE.modo === 'tutor') {
    return `
      <h2 class="reg-pane__title">Datos del padre/tutor y del menor</h2>
      <p class="reg-pane__sub">Un menor de edad no puede registrarse de forma autónoma: lo registra su padre, madre o tutor legal.</p>
      <div class="reg-section-label">Padre / tutor</div>
      <form class="reg-form" id="rpForm">
        ${choiceGroup('vinculo', 'Vínculo con el menor', VINCULOS, d.vinculo, true)}
        <div class="reg-grid-2">
          ${dd('tutorTipoDoc', 'Tipo de documento', TIPOS_DOC.map((v) => ({ v, t: TIPODOC_LABEL[v] })), d.tutorTipoDoc, true)}
          ${tf({ id: 'f-tutorDoc', label: 'Número de documento del tutor', required: true, path: 'tutorDoc', value: d.tutorDoc, mask: 'numeric', maxLength: 12, placeholder: '10000123' })}
          ${tf({ id: 'f-tutorNombres', label: 'Nombres y apellidos del tutor', required: true, path: 'tutorNombres', value: d.tutorNombres, placeholder: 'Ej: María Rojas' })}
          ${tf({ id: 'f-tutorTel', label: 'Teléfono', required: true, path: 'tutorTel', value: d.tutorTel, mask: 'tel', maxLength: 18, type: 'tel', placeholder: '+57 300 123 4567' })}
        </div>
        ${tf({ id: 'f-tutorCorreo', label: 'Correo electrónico', required: true, path: 'tutorCorreo', value: d.tutorCorreo, mask: 'email', type: 'email', placeholder: 'tutor@correo.co' })}
        <div class="reg-section-label">Menor de edad</div>
        <div class="reg-grid-2">
          ${dd('tipoDoc', 'Tipo de documento', TIPOS_DOC.map((v) => ({ v, t: TIPODOC_LABEL[v] })), d.tipoDoc, true)}
          ${tf({ id: 'f-numDoc', label: 'Número de documento del menor', required: true, path: 'numDoc', value: d.numDoc, mask: 'numeric', maxLength: 12, placeholder: '1099887766' })}
          ${tf({ id: 'f-nombres', label: 'Nombres', required: true, path: 'nombres', value: d.nombres, placeholder: 'Ej: Juan David' })}
          ${tf({ id: 'f-apellidos', label: 'Apellidos', required: true, path: 'apellidos', value: d.apellidos, placeholder: 'Ej: Marín' })}
          ${tf({ id: 'f-fechaNac', label: 'Fecha de nacimiento', required: true, path: 'fechaNac', value: d.fechaNac, type: 'date' })}
          ${dd('deporte', 'Deporte', DEPORTES.map((v) => ({ v, t: v })), d.deporte, false, true)}
        </div>
        <div class="rp-agehint" id="rpAgeHint"></div>
      </form>`;
  }
  if (STATE.tipo === 'deportista') {
    return `
      <h2 class="reg-pane__title">Tus datos de deportista</h2>
      <p class="reg-pane__sub">Regístrate con tu documento de identidad. El sistema valida que no exista un registro previo con el mismo número.</p>
      <form class="reg-form" id="rpForm">
        <div class="reg-grid-2">
          ${dd('tipoDoc', 'Tipo de documento', TIPOS_DOC.map((v) => ({ v, t: TIPODOC_LABEL[v] })), d.tipoDoc, true)}
          ${tf({ id: 'f-numDoc', label: 'Número de documento', required: true, path: 'numDoc', value: d.numDoc, mask: 'numeric', maxLength: 12, placeholder: '1099887766' })}
          ${tf({ id: 'f-nombres', label: 'Nombres', required: true, path: 'nombres', value: d.nombres, placeholder: 'Ej: Laura' })}
          ${tf({ id: 'f-apellidos', label: 'Apellidos', required: true, path: 'apellidos', value: d.apellidos, placeholder: 'Ej: Gómez' })}
          ${tf({ id: 'f-fechaNac', label: 'Fecha de nacimiento', required: true, path: 'fechaNac', value: d.fechaNac, type: 'date' })}
          ${dd('deporte', 'Deporte', DEPORTES.map((v) => ({ v, t: v })), d.deporte, false, true)}
          ${tf({ id: 'f-correo', label: 'Correo electrónico', required: true, path: 'correo', value: d.correo, mask: 'email', type: 'email', placeholder: 'correo@correo.co' })}
          ${tf({ id: 'f-telefono', label: 'Teléfono', required: true, path: 'telefono', value: d.telefono, mask: 'tel', maxLength: 18, type: 'tel', placeholder: '+57 300 123 4567' })}
        </div>
        <div class="rp-agehint" id="rpAgeHint"></div>
      </form>`;
  }
  if (STATE.tipo === 'personal') {
    return `
      <h2 class="reg-pane__title">Datos del personal deportivo</h2>
      <p class="reg-pane__sub">Selecciona tu rol e ingresa tu documento. El sistema valida que no exista un registro previo.</p>
      <form class="reg-form" id="rpForm">
        ${dd('rol', 'Rol específico', ROLES_PERSONAL.map((v) => ({ v, t: v })), STATE.rol, true)}
        <div class="reg-grid-2">
          ${dd('tipoDoc', 'Tipo de documento', TIPOS_DOC.map((v) => ({ v, t: TIPODOC_LABEL[v] })), d.tipoDoc, true)}
          ${tf({ id: 'f-numDoc', label: 'Número de documento', required: true, path: 'numDoc', value: d.numDoc, mask: 'numeric', maxLength: 12, placeholder: '79123456' })}
          ${tf({ id: 'f-nombres', label: 'Nombres', required: true, path: 'nombres', value: d.nombres, placeholder: 'Ej: Carlos' })}
          ${tf({ id: 'f-apellidos', label: 'Apellidos', required: true, path: 'apellidos', value: d.apellidos, placeholder: 'Ej: Palacio' })}
          ${tf({ id: 'f-correo', label: 'Correo electrónico', required: true, path: 'correo', value: d.correo, mask: 'email', type: 'email', placeholder: 'correo@correo.co' })}
          ${tf({ id: 'f-telefono', label: 'Teléfono', required: true, path: 'telefono', value: d.telefono, mask: 'tel', maxLength: 18, type: 'tel', placeholder: '+57 300 123 4567' })}
        </div>
      </form>`;
  }
  // entidad
  return `
    <h2 class="reg-pane__title">Datos de la entidad</h2>
    <p class="reg-pane__sub">Registra tu entidad deportiva. Quedará <strong>Preinscrita</strong> para su posterior validación por el ente competente.</p>
    <form class="reg-form" id="rpForm">
      <div class="reg-section-label">Tipo de entidad</div>
      ${choiceGroup('entTipo', 'Tipo de entidad', ENT_TIPOS, STATE.entTipo, true)}
      <div class="reg-grid-2">
        ${tf({ id: 'f-nit', label: 'NIT / RUT', required: true, path: 'nit', value: d.nit, mask: 'tel', maxLength: 13, placeholder: '900123456-7' })}
        ${tf({ id: 'f-entNombre', label: 'Nombre de la entidad', required: true, path: 'entNombre', value: d.entNombre, placeholder: 'Ej: Club Deportivo …' })}
      </div>
      <div class="reg-section-label">Representante legal</div>
      <div class="reg-grid-2">
        ${tf({ id: 'f-repNombre', label: 'Nombres y apellidos', required: true, path: 'repNombre', value: d.repNombre, placeholder: 'Ej: Ana Torres' })}
        ${tf({ id: 'f-repDoc', label: 'Número de documento', required: true, path: 'repDoc', value: d.repDoc, mask: 'numeric', maxLength: 12, placeholder: '10000123' })}
      </div>
      ${tf({ id: 'f-repCorreo', label: 'Correo del representante', required: true, path: 'repCorreo', value: d.repCorreo, mask: 'email', type: 'email', placeholder: 'representante@correo.co' })}
      <div class="reg-section-label">Sede</div>
      <div class="reg-grid-2">
        ${dd('depto', 'Departamento', ['Antioquia','Atlántico','Bogotá D.C.','Bolívar','Boyacá','Caldas','Cundinamarca','Meta','Nariño','Risaralda','Santander','Tolima','Valle del Cauca'].map((v) => ({ v, t: v })), d.depto, true, true)}
        ${tf({ id: 'f-ciudad', label: 'Ciudad / Municipio', required: true, path: 'ciudad', value: d.ciudad, placeholder: 'Ej: Cali' })}
      </div>
    </form>`;
}

/* ── Paso 2 — documentos (adaptativo) + políticas ── */
function docsDelTipo() {
  if (STATE.tipo === 'deportista' && STATE.modo === 'tutor') return [
    { id: 'parentesco', label: 'Documento de parentesco (registro civil / custodia)' }
  ];
  if (STATE.tipo === 'personal') {
    const base = [{ id: 'cert', label: 'Certificaciones profesionales (título, licencia)' }];
    if ((STATE.rol || '').startsWith('Médico') || (STATE.rol || '').startsWith('Fisio')) base.push({ id: 'tarjeta', label: 'Tarjeta profesional vigente' });
    return base;
  }
  if (STATE.tipo === 'entidad') {
    // Documentos DIFERENCIADOS por tipo de entidad (vocabulario canónico de la
    // bandeja): las entidades reconocidas del SND (Federación/Liga) cargan el peso
    // legal (personería, estatutos, reconocimiento IVC, aval); los clubes de base y
    // escuelas van livianos. Matriz validada con negocio.
    const D = {
      existencia: 'Certificado de existencia y representación legal',
      personeria: 'Certificado de personería jurídica',
      estatutos: 'Estatutos vigentes',
      reconocimiento: 'Reconocimiento deportivo (trámite IVC)',
      reconocimientoMunicipal: 'Reconocimiento del ente municipal',
      aval: 'Aval del Comité',
      rut: 'RUT'
    };
    const POR_TIPO = {
      'federacion':       ['personeria', 'estatutos', 'reconocimiento', 'aval', 'rut'],
      'liga':             ['personeria', 'reconocimiento', 'rut'],
      'club-profesional': ['existencia', 'reconocimientoMunicipal', 'rut'],
      'club-promotor':    ['existencia'],
      'escuela':          ['existencia']
    };
    return (POR_TIPO[STATE.entTipo] || ['existencia']).map((id) => ({ id, label: D[id] || id }));
  }
  return []; // deportista propio: sin adjuntos
}
function paneDocs() {
  const d = STATE.d;
  const docs = docsDelTipo();
  let extra = '';
  if (STATE.tipo === 'personal') {
    extra = `<form class="reg-form" id="rpFormPro">
      <div class="reg-section-label">Información profesional</div>
      <div class="reg-grid-2">
        ${tf({ id: 'f-profesion', label: 'Profesión / especialidad', required: true, path: 'profesion', value: d.profesion, placeholder: 'Ej: Entrenador de patinaje' })}
        ${tf({ id: 'f-experiencia', label: 'Años de experiencia', required: false, path: 'experiencia', value: d.experiencia, mask: 'numeric', maxLength: 2, placeholder: '5' })}
      </div>
    </form>`;
  }
  const uploaders = docs.length
    ? `<div class="reg-form">${docs.map(uploader).join('')}</div>`
    : `<div class="naowee-message naowee-message--informative" style="margin:0 0 4px"><span class="naowee-message__icon">${I.bang}</span><div class="naowee-message__body"><p class="naowee-message__text">Tu registro como deportista no requiere documentos de soporte. Revisa el resumen y acepta las políticas para finalizar.</p></div></div>`;
  const firma = (STATE.tipo === 'deportista' && STATE.modo === 'tutor')
    ? `<label class="naowee-checkbox" data-field="f-firma" id="f-firma"><input type="checkbox" ${d.firma ? 'checked' : ''} data-check="firma"><span class="naowee-checkbox__box">${I.check}</span><span class="naowee-checkbox__label">Firmo digitalmente el <strong>consentimiento</strong> como padre/tutor para el registro del menor. <strong>(Obligatorio)</strong></span></label>` : '';
  const api = `<div class="naowee-message naowee-message--informative"><span class="naowee-message__icon">${I.api}</span><div class="naowee-message__body"><p class="naowee-message__text"><strong>Integración externa (demo):</strong> el número de documento se validará contra la Registraduría / entidades externas vía API al procesar el registro.</p></div></div>`;
  return `
    <h2 class="reg-pane__title">${docs.length ? 'Documentos de soporte' : 'Confirmación'}</h2>
    <p class="reg-pane__sub">${docs.length ? 'Adjunta los soportes requeridos. Formatos: PDF, JPG o PNG (simulado — no se sube ningún archivo).' : 'Último paso antes de enviar tu registro.'}</p>
    <div class="reg-form">
      ${extra}
      ${uploaders}
      ${firma}
      ${api}
      <div class="reg-section-label">Aceptación</div>
      ${privacyCheck()}
    </div>`;
}

/* ═══════════════ Helpers de campo (markup canónico) ═══════════════ */
function tf(o) {
  const req = o.required ? ' naowee-textfield__label--required' : '';
  const attrs = [
    `id="${o.id}"`, `type="${o.type || 'text'}"`, 'class="naowee-textfield__input"',
    `placeholder="${esc(o.placeholder || '')}"`, `value="${esc(o.value || '')}"`, `data-model="${o.path}"`,
    o.mask ? `data-mask="${o.mask}"` : '', o.maxLength ? `maxlength="${o.maxLength}"` : '',
    o.mask === 'numeric' ? 'inputmode="numeric"' : (o.mask === 'tel' ? 'inputmode="tel"' : '')
  ].filter(Boolean).join(' ');
  return `<div class="naowee-textfield" data-field="${o.id}">
    <label class="naowee-textfield__label${req}" for="${o.id}">${esc(o.label)}</label>
    <div class="naowee-textfield__input-wrap"><input ${attrs}></div>
  </div>`;
}
function dd(key, label, opts, value, required, searchable) {
  const sel = opts.find((o) => o.v === value);
  return `<div class="naowee-dropdown" data-dd="${key}" data-field="dd-${key}" data-required="${required ? 1 : 0}" data-search="${searchable ? 1 : 0}" id="dd-${key}">
    <label class="naowee-dropdown__label${required ? ' naowee-dropdown__label--required' : ''}">${esc(label)}</label>
    <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="naowee-dropdown__value${sel ? '' : ' is-placeholder'}">${sel ? esc(sel.t) : 'Seleccione…'}</span>
      <span class="naowee-dropdown__chevron">${I.chevron}</span>
    </button>
    <div class="naowee-dropdown__menu" role="listbox" data-opts='${esc(JSON.stringify(opts))}'></div>
  </div>`;
}
function choiceGroup(key, label, opts, value, required) {
  const items = opts.map((o) => `
    <label class="reg-choice ${value === o.v ? 'is-selected' : ''}" data-choice="${key}" data-value="${o.v}">
      <input type="radio" name="${key}" value="${o.v}" ${value === o.v ? 'checked' : ''}>
      <span class="reg-choice__dot"></span>
      <span class="reg-choice__body"><span class="reg-choice__title">${esc(o.t)}</span>${o.d ? `<span class="reg-choice__desc">${esc(o.d)}</span>` : ''}</span>
    </label>`).join('');
  return `<div class="naowee-textfield" data-field="dd-${key}" style="gap:0">
    <label class="naowee-textfield__label${required ? ' naowee-textfield__label--required' : ''}">${esc(label)}</label>
    <div class="reg-choice-group" id="dd-${key}">${items}</div>
  </div>`;
}
function uploader(doc) {
  const f = STATE.d.docs[doc.id];
  const inner = f
    ? `<span class="naowee-file-uploader__placeholder naowee-file-uploader__placeholder--filled">${I.check}${esc(f)}</span>
       <button type="button" class="naowee-file-uploader__action" data-doc-remove="${doc.id}">${I.x} Quitar</button>`
    : `<span class="naowee-file-uploader__placeholder">Ningún archivo seleccionado · PDF, JPG o PNG</span>
       <label class="naowee-file-uploader__action">${I.upload} Subir archivo<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-doc-input="${doc.id}"></label>`;
  return `<div class="naowee-file-uploader" data-field="doc-${doc.id}" id="doc-${doc.id}">
    <label class="naowee-file-uploader__label naowee-file-uploader__label--required">${esc(doc.label)}</label>
    <div class="naowee-file-uploader__input-wrap">${inner}</div>
  </div>`;
}
function privacyCheck() {
  return `<label class="naowee-checkbox" data-field="f-politicas" id="f-politicas">
    <input type="checkbox" ${STATE.d.aceptaPoliticas ? 'checked' : ''} data-check="aceptaPoliticas">
    <span class="naowee-checkbox__box">${I.check}</span>
    <span class="naowee-checkbox__label">Acepto las políticas de tratamiento y privacidad de datos del SUID y el uso de datos gubernamentales. <strong>(Obligatorio)</strong></span>
  </label>`;
}

/* ═══════════════ Footer ═══════════════ */
function renderFooter() {
  const f = document.getElementById('rpFooter');
  const back = STATE.step > 0 ? `<button type="button" class="naowee-btn naowee-btn--quiet" id="rpBack">Atrás</button>` : '<span></span>';
  const last = STATE.step === 2;
  f.innerHTML = `${back}<span class="reg-footer__spacer"></span>
    <button type="button" class="naowee-btn naowee-btn--loud" id="rpNext">${STATE.step === 0 ? 'Comenzar' : (last ? 'Enviar registro' : 'Siguiente')}</button>`;
  document.getElementById('rpNext').addEventListener('click', next);
  document.getElementById('rpBack')?.addEventListener('click', () => { STATE._armedStep = null; STATE.step = Math.max(0, STATE.step - 1); render(); });
}

/* ═══════════════ Bind ═══════════════ */
function bindPane() {
  root().querySelectorAll('input[data-model]').forEach((inp) => {
    inp.addEventListener('input', () => {
      if (inp.dataset.mask) { const p = inp.selectionStart; inp.value = applyMask(inp.dataset.mask, inp.value); try { inp.setSelectionRange(p, p); } catch (_) {} }
      STATE.d[inp.dataset.model] = inp.value;
      clearFieldError(inp.closest('[data-field]'));
      if (inp.dataset.model === 'numDoc') checkDup(inp);
      if (inp.dataset.model === 'fechaNac') ageHint();
    });
  });
  root().querySelectorAll('input[data-check]').forEach((cb) => cb.addEventListener('change', () => { STATE.d[cb.dataset.check] = cb.checked; clearFieldError(cb.closest('[data-field]')); }));
  root().querySelectorAll('.reg-tipo-card').forEach((c) => c.addEventListener('click', () => { STATE.tipo = c.dataset.tipo; if (STATE.tipo !== 'deportista') STATE.modo = null; render(); }));
  root().querySelectorAll('.reg-choice').forEach((ch) => ch.addEventListener('click', (e) => {
    e.preventDefault();
    const key = ch.dataset.choice, val = ch.dataset.value;
    if (key === 'modo') STATE.modo = val; else if (key === 'entTipo') STATE.entTipo = val; else STATE.d[key] = val;
    ch.parentElement.querySelectorAll('.reg-choice').forEach((c) => c.classList.toggle('is-selected', c === ch));
    ch.parentElement.classList.remove('is-error');
    const cb = ch.querySelector('input'); if (cb) cb.checked = true;
  }));
  root().querySelectorAll('[data-dd]').forEach(mountDD);
  root().querySelectorAll('[data-doc-input]').forEach((inp) => inp.addEventListener('change', () => onFilePick(inp)));
  root().querySelectorAll('[data-doc-remove]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); delete STATE.d.docs[b.dataset.docRemove]; renderPane(); bindPane(); }));
  ageHint();
}
function checkDup(inp) {
  const wrap = inp.closest('[data-field]');
  if (inp.value.trim().length >= 6 && docRegistrado(inp.value)) fieldError(wrap, 'Este documento ya está registrado en el SUID.');
}
function ageHint() {
  const box = document.getElementById('rpAgeHint'); if (!box) return;
  const e = edadDe(STATE.d.fechaNac);
  if (e == null) { box.innerHTML = ''; return; }
  if (STATE.tipo === 'deportista' && STATE.modo === 'propio' && e < 18) {
    box.innerHTML = `<div class="naowee-message naowee-message--caution"><span class="naowee-message__icon">${I.bang}</span><div class="naowee-message__body"><p class="naowee-message__text">La fecha indica <strong>${e} años</strong> (menor de edad). Un menor no puede registrarse de forma autónoma: vuelve al paso 1 y elige <strong>“A través de un padre/tutor”</strong>.</p></div></div>`;
  } else if (STATE.tipo === 'deportista' && STATE.modo === 'tutor' && e >= 18) {
    box.innerHTML = `<div class="naowee-message naowee-message--caution"><span class="naowee-message__icon">${I.bang}</span><div class="naowee-message__body"><p class="naowee-message__text">La fecha indica <strong>${e} años</strong> (mayor de edad). El registro por tutor es solo para menores; una persona mayor debe registrarse como <strong>“Registro propio”</strong>.</p></div></div>`;
  } else { box.innerHTML = ''; }
}
function mountDD(el) {
  const key = el.dataset.dd;
  const opts = JSON.parse(el.querySelector('.naowee-dropdown__menu').dataset.opts || '[]');
  const searchable = el.dataset.search === '1';
  const trigger = el.querySelector('.naowee-dropdown__trigger');
  const valueEl = el.querySelector('.naowee-dropdown__value');
  const menu = el.querySelector('.naowee-dropdown__menu');
  const cur = () => (key === 'rol' ? STATE.rol : STATE.d[key]);
  function build(filter) {
    const q = norm(filter || '');
    const list = opts.filter((o) => !q || norm(o.t).includes(q));
    let html = searchable ? `<div class="dd-search-wrap"><input type="text" class="dd-search-input" placeholder="Buscar…" aria-label="Buscar"></div>` : '';
    if (!list.length) html += `<div class="dd-empty">Sin coincidencias</div>`;
    html += list.map((o) => `<div class="naowee-dropdown__opt ${o.v === cur() ? 'is-selected' : ''}" role="option" data-value="${esc(o.v)}"><span class="naowee-dropdown__opt-main"><span class="naowee-dropdown__opt-name">${esc(o.t)}</span></span><span class="naowee-dropdown__opt-check">${I.check}</span></div>`).join('');
    menu.innerHTML = html;
    if (searchable) { const si = menu.querySelector('.dd-search-input'); si.addEventListener('click', (e) => e.stopPropagation()); si.addEventListener('input', () => build(si.value)); setTimeout(() => si.focus(), 40); }
  }
  function open() { document.querySelectorAll('.naowee-dropdown--open').forEach((o) => { if (o !== el) o.classList.remove('naowee-dropdown--open'); }); build(''); el.classList.add('naowee-dropdown--open'); trigger.setAttribute('aria-expanded', 'true'); }
  function close() { el.classList.remove('naowee-dropdown--open'); trigger.setAttribute('aria-expanded', 'false'); }
  trigger.addEventListener('click', (e) => { e.stopPropagation(); el.classList.contains('naowee-dropdown--open') ? close() : open(); });
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.naowee-dropdown__opt'); if (!opt) return;
    const o = opts.find((x) => String(x.v) === opt.dataset.value); if (!o) return;
    if (key === 'rol') STATE.rol = o.v; else STATE.d[key] = o.v;
    valueEl.textContent = o.t; valueEl.classList.remove('is-placeholder');
    el.classList.remove('naowee-dropdown--error'); close();
  });
  document.addEventListener('click', (e) => { if (!el.contains(e.target)) close(); });
}
function onFilePick(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const wrap = inp.closest('.naowee-file-uploader');
  if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { fieldError(wrap, 'Formato no permitido. Usa PDF, JPG o PNG.'); inp.value = ''; return; }
  STATE.d.docs[inp.dataset.docInput] = f.name + ' · ' + fileSizeFmt(f.size);
  clearFieldError(wrap); renderPane(); bindPane();
}

/* ═══════════════ Validación ═══════════════ */
function fieldEl(field) { return field ? document.querySelector(`[data-field="${field}"]`) : null; }
function fieldError(el, msg) {
  if (!el) return;
  el.classList.add(el.classList.contains('naowee-file-uploader') ? 'naowee-file-uploader--error' : 'naowee-textfield--error');
  if (!el.querySelector('.naowee-helper')) {
    const h = document.createElement('div'); h.className = 'naowee-helper naowee-helper--negative';
    h.innerHTML = `<span class="naowee-helper__text"><span class="naowee-helper__badge">${I.bang}</span><span>${esc(msg)}</span></span>`;
    el.appendChild(h);
  }
}
function clearFieldError(el) { if (!el) return; el.classList.remove('naowee-textfield--error', 'naowee-file-uploader--error', 'naowee-checkbox--error', 'naowee-dropdown--error'); el.querySelector('.naowee-helper')?.remove(); el.querySelector('.reg-choice-group')?.classList.remove('is-error'); }

function validate() {
  const d = STATE.d, errs = [];
  const reqTf = (id, ok, msg) => { if (!ok) errs.push({ field: id, kind: 'tf', msg }); };
  const reqDd = (key) => errs.push({ field: 'dd-' + key, kind: 'dd' });
  if (STATE.step === 0) {
    if (!STATE.tipo) return [{ field: null, kind: 'grid' }];
    if (STATE.tipo === 'deportista' && !STATE.modo) errs.push({ field: 'dd-modo', kind: 'choice' });
    return errs;
  }
  if (STATE.step === 1) {
    if (STATE.tipo === 'deportista' && STATE.modo === 'tutor') {
      if (!d.vinculo) errs.push({ field: 'dd-vinculo', kind: 'choice' });
      if (!d.tutorTipoDoc) reqDd('tutorTipoDoc');
      reqTf('f-tutorDoc', d.tutorDoc.trim()); reqTf('f-tutorNombres', d.tutorNombres.trim());
      reqTf('f-tutorTel', d.tutorTel.trim());
      reqTf('f-tutorCorreo', EMAIL_RE.test(d.tutorCorreo), 'Ingresa un correo válido');
      if (!d.tipoDoc) reqDd('tipoDoc');
      reqTf('f-numDoc', d.numDoc.trim());
      if (d.numDoc.trim() && docRegistrado(d.numDoc)) reqTf('f-numDoc', false, 'Este documento ya está registrado en el SUID.');
      reqTf('f-nombres', d.nombres.trim()); reqTf('f-apellidos', d.apellidos.trim());
      reqTf('f-fechaNac', d.fechaNac.trim());
      const e = edadDe(d.fechaNac); if (e != null && e >= 18) reqTf('f-fechaNac', false, 'El menor debe ser menor de 18 años.');
    } else if (STATE.tipo === 'deportista') {
      if (!d.tipoDoc) reqDd('tipoDoc');
      reqTf('f-numDoc', d.numDoc.trim());
      if (d.numDoc.trim() && docRegistrado(d.numDoc)) reqTf('f-numDoc', false, 'Este documento ya está registrado en el SUID.');
      reqTf('f-nombres', d.nombres.trim()); reqTf('f-apellidos', d.apellidos.trim());
      reqTf('f-fechaNac', d.fechaNac.trim());
      const e = edadDe(d.fechaNac); if (e != null && e < 18) reqTf('f-fechaNac', false, 'Menor de edad: usa el registro por padre/tutor.');
      reqTf('f-correo', EMAIL_RE.test(d.correo), 'Ingresa un correo válido'); reqTf('f-telefono', d.telefono.trim());
    } else if (STATE.tipo === 'personal') {
      if (!STATE.rol) reqDd('rol');
      if (!d.tipoDoc) reqDd('tipoDoc');
      reqTf('f-numDoc', d.numDoc.trim());
      if (d.numDoc.trim() && docRegistrado(d.numDoc)) reqTf('f-numDoc', false, 'Este documento ya está registrado en el SUID.');
      reqTf('f-nombres', d.nombres.trim()); reqTf('f-apellidos', d.apellidos.trim());
      reqTf('f-correo', EMAIL_RE.test(d.correo), 'Ingresa un correo válido'); reqTf('f-telefono', d.telefono.trim());
    } else {
      if (!STATE.entTipo) errs.push({ field: 'dd-entTipo', kind: 'choice' });
      reqTf('f-nit', d.nit.trim()); reqTf('f-entNombre', d.entNombre.trim());
      reqTf('f-repNombre', d.repNombre.trim()); reqTf('f-repDoc', d.repDoc.trim());
      reqTf('f-repCorreo', EMAIL_RE.test(d.repCorreo), 'Ingresa un correo válido');
      if (!d.depto) reqDd('depto'); reqTf('f-ciudad', d.ciudad.trim());
    }
    return errs;
  }
  if (STATE.step === 2) {
    if (STATE.tipo === 'personal') reqTf('f-profesion', d.profesion.trim());
    docsDelTipo().forEach((doc) => { if (!d.docs[doc.id]) errs.push({ field: 'doc-' + doc.id, kind: 'file' }); });
    if (STATE.tipo === 'deportista' && STATE.modo === 'tutor' && !d.firma) errs.push({ field: 'f-firma', kind: 'check' });
    if (!d.aceptaPoliticas) errs.push({ field: 'f-politicas', kind: 'check' });
    return errs;
  }
  return errs;
}
function shakeErrors(errs) {
  let first = null;
  errs.forEach((e) => {
    const el = e.field ? fieldEl(e.field) : document.querySelector('.reg-tipo-grid');
    if (!el) return; if (!first) first = el;
    if (e.kind === 'dd') el.classList.add('naowee-dropdown--error');
    else if (e.kind === 'choice') el.querySelector('.reg-choice-group')?.classList.add('is-error');
    else if (e.kind === 'tf') fieldError(el, e.msg || 'Este campo es obligatorio');
    else if (e.kind === 'file') fieldError(el, 'Adjunta este documento');
    else if (e.kind === 'check') el.classList.add('naowee-checkbox--error');
    el.classList.remove('naowee-shake'); void el.offsetWidth; el.classList.add('naowee-shake');
    setTimeout(() => el.classList.remove('naowee-shake'), 500);
  });
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function next() {
  const errs = validate();
  if (errs.length) {
    // Conveniencia demo: al SEGUNDO "Siguiente" en el mismo paso se omite la
    // validación de obligatorios y se avanza igual (recorrer el flujo sin llenar todo).
    if (STATE._armedStep === STATE.step) { STATE._armedStep = null; advance(); return; }
    STATE._armedStep = STATE.step;
    shakeErrors(errs);
    showBypassHint();
    return;
  }
  STATE._armedStep = null;
  advance();
}
function advance() {
  if (STATE.step < 2) { STATE.step++; render(); return; }
  submit();
}
function showBypassHint() {
  const footer = document.getElementById('rpFooter'); if (!footer) return;
  if (document.getElementById('rpBypassHint')) return;
  const hint = document.createElement('div');
  hint.id = 'rpBypassHint'; hint.className = 'reg-footer__hint';
  hint.innerHTML = `${I.bang}<span>Faltan campos obligatorios — presiona <strong>“Siguiente”</strong> de nuevo para omitir (demo).</span>`;
  footer.insertBefore(hint, footer.firstChild);
}

/* ═══════════════ Envío + éxito ═══════════════ */
function submit() {
  persistPreinscrito();
  STATE.created = true;
  try { window.naoweeToast && window.naoweeToast('Registro enviado — notificación por email/SMS', 'success'); } catch (_) {}
  render();
}

/* HURU-09: encola el registro en la cola de validación de la bandeja. Solo
   personal + entidad requieren validación (los que la propia demo marca
   "pendiente de validación" / "preinscrito"); el deportista queda de alta
   autónoma (autodeclarado). Los documentos guardan solo el nombre de archivo
   (mock, sin subida real). */
function persistPreinscrito() {
  if (STATE.tipo !== 'personal' && STATE.tipo !== 'entidad') return;
  const d = STATE.d;
  const docs = {};
  Object.keys(d.docs || {}).forEach((k) => { docs[k] = { name: String(d.docs[k]).split(' · ')[0] }; });
  if (STATE.tipo === 'personal') {
    crearPreinscrito({
      tipo: 'personal', subtipo: STATE.rol || 'Personal deportivo', rol: STATE.rol || '',
      nombre: `${d.nombres} ${d.apellidos}`.trim() || 'Personal deportivo',
      tipoDoc: d.tipoDoc, numDoc: d.numDoc, correo: d.correo, telefono: d.telefono,
      profesion: d.profesion, experiencia: d.experiencia, deporte: d.deporte,
      documentos: docs
    });
  } else {
    const entLabel = (ENT_TIPOS.find((e) => e.v === STATE.entTipo) || {}).t || 'Entidad deportiva';
    crearPreinscrito({
      tipo: 'entidad', subtipo: entLabel, entTipo: STATE.entTipo,
      nombre: d.entNombre || 'Entidad deportiva',
      nit: d.nit, correo: d.repCorreo,
      depto: d.depto, ciudad: d.ciudad,
      repLegal: { nombre: d.repNombre, doc: d.repDoc, correo: d.repCorreo },
      documentos: docs
    });
  }
}
const TIPO_TXT = {
  deportista: 'Deportista', personal: 'Personal deportivo', entidad: 'Entidad deportiva'
};
function resumenRegistro() {
  const d = STATE.d;
  if (STATE.tipo === 'entidad') return { nombre: d.entNombre || 'Entidad', meta: (ENT_TIPOS.find((e) => e.v === STATE.entTipo) || {}).t || 'Entidad', estado: 'Preinscrito' };
  if (STATE.tipo === 'personal') return { nombre: `${d.nombres} ${d.apellidos}`.trim() || 'Personal', meta: STATE.rol || 'Personal deportivo', estado: 'Pendiente de validación' };
  if (STATE.modo === 'tutor') return { nombre: `${d.nombres} ${d.apellidos}`.trim() || 'Menor', meta: `Deportista (menor) · tutor: ${d.tutorNombres || '—'}`, estado: 'Activo (registrado)' };
  return { nombre: `${d.nombres} ${d.apellidos}`.trim() || 'Deportista', meta: 'Deportista · registro propio', estado: 'Activo (registrado)' };
}
function renderSuccess() {
  const r = resumenRegistro();
  const correo = STATE.d.correo || STATE.d.tutorCorreo || STATE.d.repCorreo || 'tu correo';
  const esEntidad = STATE.tipo === 'entidad';
  root().innerHTML = `
    <div class="reg-wizard">
      <div class="reg-stepper-wrap"><div class="naowee-stepper naowee-stepper--distributed" id="rpStepper"></div><div class="reg-stepper-mobile" id="rpStepperMobile"></div></div>
      <div class="reg-success" id="rpSuccess">
        <div class="reg-confetti" id="rpConfetti"></div>
        <div class="reg-success__hero">
          <div class="reg-success__check">${I.check}</div>
          <h2 class="reg-success__title">¡Registro enviado con éxito!</h2>
          <p class="reg-success__lead"><strong>${esc(r.nombre)}</strong> quedó en estado <strong>${esc(r.estado)}</strong>. ${esEntidad ? 'Un ente competente validará tu entidad; una vez aprobada podrás <strong>inscribir tu personal y deportistas</strong>.' : 'Tu registro fue creado en el Registro Único del SUID.'}</p>
          <div class="naowee-message naowee-message--positive" style="max-width:480px;margin:0 auto">
            <span class="naowee-message__icon">${I.mail}</span>
            <div class="naowee-message__body"><p class="naowee-message__text">Enviamos una <strong>notificación por email/SMS</strong> a ${esc(correo)} confirmando el registro y los siguientes pasos.</p></div>
          </div>
          <div class="reg-receipt">
            <div class="reg-receipt__head"><span class="reg-receipt__ava">${STATE.tipo === 'entidad' ? I.entity : STATE.tipo === 'personal' ? I.staff : I.athlete}</span>
              <div><div class="reg-receipt__name">${esc(r.nombre)}</div><div class="reg-receipt__meta">${esc(r.meta)}</div></div></div>
            <div class="reg-receipt__rows">
              ${receiptRow(I.check, 'Tipo', TIPO_TXT[STATE.tipo])}
              ${receiptRow(I.bang, 'Estado', r.estado)}
              ${receiptRow(I.mail, 'Notificación', 'Email / SMS enviada')}
            </div>
          </div>
          <div class="reg-success__actions">
            <a class="naowee-btn naowee-btn--loud" href="index.html">Volver al inicio</a>
            <button type="button" class="naowee-btn naowee-btn--mute" id="rpAnother">Registrar otro</button>
          </div>
        </div>
      </div>
    </div>`;
  const wrap = document.getElementById('rpStepper');
  wrap.innerHTML = STEP_LABELS.map((lbl, i) => `${i > 0 ? '<div class="naowee-stepper__connector naowee-stepper__connector--done"></div>' : ''}<div class="naowee-stepper__step naowee-stepper__step--done"><span class="naowee-stepper__number">${I.check}</span><span class="naowee-stepper__label">${lbl}</span></div>`).join('');
  document.getElementById('rpStepperMobile').innerHTML = 'Registro completado';
  document.getElementById('rpAnother').addEventListener('click', () => { location.reload(); });
  fireConfetti();
}
function receiptRow(ico, k, v) { return `<div class="reg-receipt__row"><span class="reg-receipt__ico">${ico}</span><span class="reg-receipt__k">${esc(k)}</span><span class="reg-receipt__v">${esc(v)}</span></div>`; }
function fireConfetti() {
  const c = document.getElementById('rpConfetti'); if (!c) return;
  const cols = ['#FF7500', '#d74009', '#1f8923', '#1f78d1', '#7c3aed'];
  let html = '';
  for (let i = 0; i < 28; i++) html += `<span class="reg-confetti__bit" style="left:${Math.round((i * 37) % 100)}%;background:${cols[i % cols.length]};animation-delay:${(i % 7) * 60}ms"></span>`;
  c.innerHTML = html;
}

/* ═══════════════ Arranque ═══════════════ */
render();
