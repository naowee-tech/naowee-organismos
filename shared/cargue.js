/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Cargue masivo (T4)
   Pre-registro por plantilla .xlsx: cada rol carga el nivel inferior
   (Comité→federaciones · Federación→ligas · Liga→clubes). Las filas
   válidas crean organismos 'Preinscrito' bajo su superior (aparecen en
   la jerarquía). MINDEPORTE = oversight solo-lectura del historial.
   Patrón portado de Eventos/demo/cargue.html. SheetJS (window.XLSX) por CDN.
   Solo componentes .naowee-* + layout local .cg-*.
   ═══════════════════════════════════════════════════════════════ */
import { getRoleFromQuery, ROLES } from './sidebar.js';
import { allOrganismos, getOrganismo, addOrganismosBulk, recordCargue, allCargues } from './organismos-data.js';
import { scopeFor } from './permissions.js';

const roleCode = getRoleFromQuery();
const role = ROLES[roleCode] || {};
const TARGET = { COMITE: 'federacion', FEDERACION: 'liga', LIGA: 'club' };
const targetTipo = TARGET[roleCode] || null;             // null = sin carga (MINDEPORTE / otros)
const TIPO_PLURAL = { federacion: 'federaciones', liga: 'ligas', club: 'clubes' };
const TIPO_SING = { federacion: 'Federación', liga: 'Liga', club: 'Club' };
const TIPO_EMOJI = { federacion: '🏅', liga: '🚩', club: '🛡️' };

const scopeId = scopeFor(roleCode);
const superior = scopeId ? getOrganismo(scopeId) : null;

const HEADERS = [
  'NIT', 'Tipo de entidad', 'Naturaleza jurídica', 'Cobertura geográfica',
  'Tamaño de la organización', 'Tipo de entidad SND', 'Nombre de la entidad',
  'Tipo de documento (Rep. Legal)', 'Número de documento (Rep. Legal)',
  'Nombre (Rep. Legal)', 'Apellido (Rep. Legal)', 'Correo electrónico (Rep. Legal)',
  'RUT (nombre de archivo)', 'Certificado personería jurídica (nombre de archivo)',
  'Reconocimiento deportivo vigente (nombre de archivo)', 'Acepto políticas de privacidad',
  'Departamento', 'Ciudad', 'Zona', 'Dirección', 'Teléfono', 'Correo electrónico (Contacto)'
];
const COL = {
  nit: 0, sndTipo: 5, nombre: 6, repTipoDoc: 7, repNumDoc: 8, repNombre: 9,
  repApellido: 10, repCorreo: 11, depto: 16, ciudad: 17, zona: 18, direccion: 19,
  telefono: 20, contactoCorreo: 21
};

const I = {
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

const root = document.getElementById('cargueRoot');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

/* State */
let parsed = null;   // { fileName, fileSize, rows: [{row, raw, nombre, nit, valid, errors}] }

/* ── Plantilla: filas de ejemplo (3 válidas + 1 inválida "SIN REP. LEGAL") ── */
const SAMPLES = {
  federacion: [
    ['Federación Colombiana de Ultimate', '901700101-1', { doc: '79800101', nom: 'Andrés', ape: 'Cortés Lara', correo: 'presidencia@fedeultimate.demo.co' }],
    ['Federación Colombiana de Parkour', '901700102-2', { doc: '52800102', nom: 'Diana', ape: 'Ríos Mejía', correo: 'presidencia@fedeparkour.demo.co' }],
    ['Federación Colombiana de Breaking', '901700103-3', { doc: '80800103', nom: 'Julián', ape: 'Ospina Cano', correo: 'presidencia@fedebreaking.demo.co' }],
    ['Federación Colombiana de Remo Demo (SIN REP. LEGAL)', '901700104-4', null]
  ],
  liga: [
    ['Liga de Patinaje de Santander', '805110101-1', { doc: '13500101', nom: 'Marcela', ape: 'Pinto Vega', correo: 'presidencia@ligapatinajesantander.demo.co' }],
    ['Liga de Patinaje de Nariño', '805110102-2', { doc: '27500102', nom: 'Óscar', ape: 'Delgado Ruiz', correo: 'presidencia@ligapatinajenarino.demo.co' }],
    ['Liga de Patinaje de Caldas', '805110103-3', { doc: '17500103', nom: 'Paola', ape: 'Marín Soto', correo: 'presidencia@ligapatinajecaldas.demo.co' }],
    ['Liga de Patinaje Demo (SIN REP. LEGAL)', '805110104-4', null]
  ],
  club: [
    ['Club Ruedas del Cauca', '805220101-1', { doc: '10600101', nom: 'Felipe', ape: 'Muñoz Lara', correo: 'contacto@clubruedascauca.demo.co' }],
    ['Club Patín Norte', '805220102-2', { doc: '31600102', nom: 'Sara', ape: 'Gómez Peña', correo: 'contacto@clubpatinorte.demo.co' }],
    ['Club Velocidad Andina', '805220103-3', { doc: '16600103', nom: 'Camilo', ape: 'Rojas Díaz', correo: 'contacto@clubvelocidadandina.demo.co' }],
    ['Club Demo (SIN REP. LEGAL)', '805220104-4', null]
  ]
};

function sampleRow(nombre, nit, rep) {
  const r = new Array(22).fill('');
  r[COL.nit] = nit;
  r[1] = TIPO_SING[targetTipo]; r[2] = 'Privada'; r[3] = 'Nacional';
  r[4] = 'Organización sin ánimo de lucro'; r[COL.sndTipo] = TIPO_SING[targetTipo];
  r[COL.nombre] = nombre;
  if (rep) { r[COL.repTipoDoc] = 'CC'; r[COL.repNumDoc] = rep.doc; r[COL.repNombre] = rep.nom; r[COL.repApellido] = rep.ape; r[COL.repCorreo] = rep.correo; }
  r[COL.depto] = 'Valle del Cauca'; r[COL.ciudad] = 'Cali'; r[COL.zona] = 'Urbana';
  r[COL.direccion] = 'Calle 5 # 38-25'; r[COL.telefono] = '+57 602 555 0100';
  r[COL.contactoCorreo] = 'contacto@' + nombre.toLowerCase().replace(/[^a-z]/g, '').slice(0, 18) + '.demo.co';
  return r;
}

function downloadTemplate() {
  if (!window.XLSX) { toast('No se pudo cargar SheetJS', 'negative'); return; }
  const aoa = [HEADERS, ...(SAMPLES[targetTipo] || []).map((s) => sampleRow(s[0], s[1], s[2]))];
  const ws = window.XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = HEADERS.map(() => ({ wch: 22 }));
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Organismos');
  window.XLSX.writeFile(wb, `plantilla-cargue-${TIPO_PLURAL[targetTipo]}.xlsx`);
}

/* ── Parseo + validación por fila ── */
function parseFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const body = aoa.slice(1).filter((r) => r.some((c) => String(c).trim() !== ''));
      parsed = { fileName: file.name, fileSize: file.size, rows: validate(body) };
      render();
    } catch (err) {
      toast('No se pudo leer el archivo (.xlsx)', 'negative');
    }
  };
  reader.readAsArrayBuffer(file);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function validate(body) {
  const existingNits = new Set(allOrganismos().map((o) => String(o.nit || '').trim()));
  const seen = new Set();
  return body.map((raw, i) => {
    const cell = (k) => String(raw[COL[k]] == null ? '' : raw[COL[k]]).trim();
    const nit = cell('nit'), nombre = cell('nombre'), snd = cell('sndTipo').toLowerCase();
    const errors = [];
    if (!nit) errors.push('NIT vacío');
    else if (existingNits.has(nit)) errors.push('NIT ya registrado en el SUID');
    else if (seen.has(nit)) errors.push('NIT duplicado en el archivo');
    if (!nombre) errors.push('Nombre de la entidad vacío');
    if (snd && snd !== TIPO_SING[targetTipo].toLowerCase()) errors.push(`Tipo SND ≠ ${TIPO_SING[targetTipo]}`);
    if (!cell('repNumDoc') || !cell('repNombre') || !cell('repApellido')) errors.push('Representante legal incompleto');
    if (cell('repCorreo') && !EMAIL_RE.test(cell('repCorreo'))) errors.push('Correo del rep. legal inválido');
    if (!cell('depto') || !cell('ciudad')) errors.push('Departamento/Ciudad vacíos');
    if (nit) seen.add(nit);
    return { row: i + 2, raw, nombre: nombre || '(sin nombre)', nit: nit || '—', valid: errors.length === 0, errors };
  });
}

function toRecord(v) {
  const raw = v.raw, cell = (k) => String(raw[COL[k]] == null ? '' : raw[COL[k]]).trim();
  return {
    tipo: targetTipo, nombre: v.nombre, nit: v.nit, sector: superior.sector,
    deporte: targetTipo === 'federacion' ? '—' : (superior.deporte || '—'),
    parentId: superior.id,
    repLegal: { tipoDoc: cell('repTipoDoc') || 'CC', numDoc: cell('repNumDoc'), nombre: cell('repNombre'), apellido: cell('repApellido'), correo: cell('repCorreo') },
    ubicacion: { depto: cell('depto'), ciudad: cell('ciudad'), zona: cell('zona') || 'Urbana', direccion: cell('direccion') },
    contacto: { telefono: cell('telefono'), correo: cell('contactoCorreo') }
  };
}

let created = null;
function commit() {
  const valids = parsed.rows.filter((r) => r.valid);
  if (!valids.length) return;
  created = addOrganismosBulk(valids.map(toRecord));
  recordCargue({
    fecha: today(), responsable: `${role.name || roleCode} (${roleCode})`, tipo: targetTipo,
    archivo: { nombre: parsed.fileName, tamano: parsed.fileSize },
    totales: { filas: parsed.rows.length, cargadas: created.length, error: parsed.rows.length - created.length },
    version: 'v0.4.0'
  });
  toast(`${created.length} ${TIPO_PLURAL[targetTipo]} cargadas como Preinscrito`, 'positive');
  parsed = null;
  render();
}

/* ═══════════════ Render ═══════════════ */
function render() {
  if (!targetTipo) return renderOversight();
  if (created) return renderSuccess();
  const rows = parsed ? parsed.rows : null;
  const valid = rows ? rows.filter((r) => r.valid).length : 0;
  const invalid = rows ? rows.length - valid : 0;
  const supActivo = superior && superior.estado === 'Activo';

  root.innerHTML = `
    ${msg('informative', I.info, `Como <strong>${esc(role.label || roleCode)}</strong> cargas <strong>${TIPO_PLURAL[targetTipo]}</strong> bajo <strong>${esc(superior ? superior.nombre : '—')}</strong>. Cada fila válida queda <strong>Preinscrito</strong> y aparece en la jerarquía; su registro se completa después.`)}
    ${!supActivo ? msg('caution', I.alert, 'Tu organismo no está <strong>Activo</strong>: no puedes cargar hasta que tu nivel superior te habilite.') : ''}

    <div class="naowee-card cg-template">
      <div class="cg-template__body">
        <span class="cg-template__ico">${I.file}</span>
        <div>
          <p class="cg-template__title">Plantilla de cargue · ${esc(TIPO_SING[targetTipo])} (22 columnas)</p>
          <p class="cg-template__sub">Descarga el .xlsx con los encabezados y filas de ejemplo. Los 3 adjuntos y la aceptación de políticas se completan al registrarse.</p>
        </div>
      </div>
      <button class="naowee-btn naowee-btn--mute naowee-btn--small" id="cgTpl" ${!supActivo ? 'disabled' : ''}><span class="naowee-btn__ico">${I.download}</span>Descargar plantilla</button>
    </div>

    <label class="naowee-file-uploader__drop-zone cg-drop ${!supActivo ? 'is-disabled' : ''}" id="cgDrop">
      <input type="file" accept=".xlsx,.xls" id="cgInput" ${!supActivo ? 'disabled' : ''}>
      <span class="cg-drop__ico">${I.upload}</span>
      <span class="cg-drop__title">Arrastra tu archivo o haz clic para elegirlo</span>
      <span class="cg-drop__sub">Formato .xlsx o .xls · máx 5 MB</span>
    </label>

    ${rows ? `
      <div class="naowee-card cg-preview">
        <div class="cg-preview__head">
          <div class="cg-preview__file">${I.file}<span>${esc(parsed.fileName)}</span><span class="cg-preview__size">${fmtSize(parsed.fileSize)}</span></div>
          <div class="cg-preview__counts">
            <span class="naowee-badge naowee-badge--positive naowee-badge--quiet">${valid} listas</span>
            <span class="naowee-badge naowee-badge--negative naowee-badge--quiet">${invalid} con error</span>
          </div>
        </div>
        <div class="cg-table-wrap">
          <table class="cg-table">
            <thead><tr><th>Fila</th><th>Entidad</th><th>NIT</th><th>Estado</th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr class="${r.valid ? '' : 'is-error'}">
                  <td class="cg-table__row">${r.row}</td>
                  <td>${esc(r.nombre)}</td>
                  <td class="cg-table__nit">${esc(r.nit)}</td>
                  <td>${r.valid
                    ? '<span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">Lista</span>'
                    : `<span class="naowee-badge naowee-badge--negative naowee-badge--quiet naowee-badge--small">Error</span><span class="cg-errs">${esc(r.errors.join(' · '))}</span>`}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="cg-preview__foot">
          <button class="naowee-btn naowee-btn--mute naowee-btn--small" id="cgCancel">Cancelar</button>
          <button class="naowee-btn naowee-btn--loud" id="cgCommit" ${valid ? '' : 'disabled'}>Cargar ${valid} ${valid === 1 ? TIPO_SING[targetTipo].toLowerCase() : TIPO_PLURAL[targetTipo]}</button>
        </div>
      </div>` : ''}

    ${renderHistory()}
  `;
  wire(supActivo);
}

function renderSuccess() {
  root.innerHTML = `
    <div class="naowee-card cg-success">
      <div class="cg-success__check">${I.check}</div>
      <h2 class="cg-success__title">Cargue completado</h2>
      <p class="cg-success__lead">Se cargaron <strong>${created.length} ${TIPO_PLURAL[targetTipo]}</strong> en estado <strong>Preinscrito</strong> bajo ${esc(superior.nombre)}. Ya aparecen en la jerarquía; su registro se completa después.</p>
      <div class="cg-success__actions">
        <a class="naowee-btn naowee-btn--loud" href="jerarquia.html?role=${encodeURIComponent(roleCode)}">Ver en la jerarquía</a>
        <button class="naowee-btn naowee-btn--mute" id="cgAgain">Cargar otro archivo</button>
      </div>
    </div>
    ${renderHistory()}`;
  document.getElementById('cgAgain').addEventListener('click', () => { created = null; render(); });
}

function renderOversight() {
  root.innerHTML = `
    ${msg('informative', I.info, 'Vista de <strong>oversight</strong>: como Ministerio consultas el historial global de cargues de todos los niveles. Los comités se crean uno a uno en <strong>Registro de organismo</strong>, no por cargue.')}
    ${renderHistory(true)}`;
}

function renderHistory(oversight) {
  const list = allCargues();
  const title = oversight ? 'Historial global de cargues' : 'Historial de cargues';
  if (!list.length) {
    return `<div class="naowee-card"><div class="cg-hist__head"><h3 class="cg-hist__title">${title}</h3>${oversight ? '<span class="oversight-badge">Solo lectura</span>' : ''}</div><p class="cg-hist__empty">Aún no hay cargues registrados.</p></div>`;
  }
  return `
    <div class="naowee-card">
      <div class="cg-hist__head"><h3 class="cg-hist__title">${title}</h3>${oversight ? '<span class="oversight-badge">Solo lectura</span>' : ''}</div>
      <div class="cg-table-wrap">
        <table class="cg-table">
          <thead><tr><th>Radicado</th><th>Fecha</th><th>Responsable</th><th>Archivo</th><th>Resultado</th></tr></thead>
          <tbody>
            ${list.map((c) => `
              <tr>
                <td class="cg-table__row">${esc(c.id)}</td>
                <td>${esc(c.fecha)}</td>
                <td>${esc(c.responsable)}</td>
                <td class="cg-table__nit">${esc(c.archivo && c.archivo.nombre || '—')}</td>
                <td><span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">${c.totales.cargadas} cargadas</span>${c.totales.error ? ` <span class="naowee-badge naowee-badge--negative naowee-badge--quiet naowee-badge--small">${c.totales.error} error</span>` : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── Wiring ── */
function wire(supActivo) {
  const tpl = document.getElementById('cgTpl');
  if (tpl) tpl.addEventListener('click', downloadTemplate);
  const input = document.getElementById('cgInput');
  const drop = document.getElementById('cgDrop');
  if (input && supActivo) {
    input.addEventListener('change', (e) => { if (e.target.files[0]) parseFile(e.target.files[0]); });
    ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]); });
  }
  const commitBtn = document.getElementById('cgCommit');
  if (commitBtn) commitBtn.addEventListener('click', commit);
  const cancel = document.getElementById('cgCancel');
  if (cancel) cancel.addEventListener('click', () => { parsed = null; render(); });
}

function msg(variant, icon, html) {
  return `<div class="naowee-message naowee-message--${variant}" style="margin-bottom:16px"><span class="naowee-message__icon">${icon}</span><div class="naowee-message__body"><p class="naowee-message__text">${html}</p></div></div>`;
}
function toast(text, variant) { window.naoweeToast && window.naoweeToast(text, variant === 'negative' ? 'error' : 'success'); }

render();
