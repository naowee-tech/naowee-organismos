/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Perfil del deportista (detalle 360°) · T7
   Análogo al buildAtletaDetalle de Eventos, pero adaptado al dominio
   de Organismos: la cadena club·liga·federación·comité NO está
   hardcodeada — se DERIVA de la jerarquía real (getOrganismo +
   ancestorsOf), que es justo lo que este módulo modela (herencia
   ORG-05). La semilla de deportistas es delgada (identidad + clubId
   + estado); aquí se enriquece con biometría/tier/medallería para el
   clon 1:1 del perfil de Eventos. Los datos deportivos (medallería,
   eventos) son demo: los vinculados tienen historial; los
   autodeclarados quedan sin historial (coherente — el que compite
   debe estar en un club, §2 handoff) y ejercitan los empty states.
   ═══════════════════════════════════════════════════════════════ */
import { getOrganismo, ancestorsOf } from './organismos-data.js';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TIER_LABEL = { olimpico: 'Olímpico', profesional: 'Profesional', juvenil: 'Juvenil', amateur: 'Amateur' };
const DOC_LABEL = { CC: 'Cédula de ciudadanía', TI: 'Tarjeta de identidad', CE: 'Cédula de extranjería', PA: 'Pasaporte' };
const DEPORTE_EMOJI = { Patinaje: '🛼', Natación: '🏊', Fútbol: '⚽', Ciclismo: '🚴', Atletismo: '🏃', Baloncesto: '🏀' };
const SANGRES = ['O+', 'A+', 'B+', 'O-', 'A-', 'AB+'];

/* Enriquecimiento demo por deportista (biometría/tier/historial). Solo los
   vinculados con narrativa tienen medallería/eventos; el resto se deriva por
   defecto (autodeclarados sin historial). numDoc siembra la biometría faltante. */
const PERFIL_EXTRA = {
  'DEP-001': { // Valentina Ortiz — hilo conductor, Club Patín Cali
    sexo: 'F', tier: 'olimpico', nac: '14 mar 1998', edad: 28, sangre: 'O+', alt: 168, peso: 61,
    ciudad: 'Cali', depto: 'Valle del Cauca',
    inscripciones: [
      { evento: 'Campeonato Nacional de Patinaje 2025', prueba: '500m sprint', fecha: '2025-04-18', estado: 'finalizado' },
      { evento: 'Juegos Regionales Valle 2025', prueba: '1000m', fecha: '2025-07-10', estado: 'finalizado' },
      { evento: 'Copa Panamericana de Patinaje 2026', prueba: '500m sprint', fecha: '2026-03-22', estado: 'activo' }
    ],
    resultados: [
      { evento: 'Campeonato Nacional de Patinaje 2025', prueba: '500m sprint', ranking: 1, fecha: '2025-04-18' },
      { evento: 'Juegos Regionales Valle 2025', prueba: '1000m', ranking: 2, fecha: '2025-07-10' }
    ],
    medalleria: [
      { evento: 'Campeonato Nacional de Patinaje 2025', prueba: '500m sprint', medalla: 'Oro', fecha: '2025-04-18' },
      { evento: 'Juegos Regionales Valle 2025', prueba: '1000m', medalla: 'Plata', fecha: '2025-07-10' }
    ]
  },
  'DEP-002': { // Mateo Restrepo — Club Patín Cali
    sexo: 'M', tier: 'profesional', nac: '02 sep 1999', edad: 26, sangre: 'A+', alt: 176, peso: 72,
    ciudad: 'Cali', depto: 'Valle del Cauca',
    inscripciones: [{ evento: 'Campeonato Nacional de Patinaje 2025', prueba: '1000m', fecha: '2025-04-18', estado: 'finalizado' }],
    resultados: [{ evento: 'Campeonato Nacional de Patinaje 2025', prueba: '1000m', ranking: 3, fecha: '2025-04-18' }],
    medalleria: [{ evento: 'Campeonato Nacional de Patinaje 2025', prueba: '1000m', medalla: 'Bronce', fecha: '2025-04-18' }]
  },
  'DEP-003': { sexo: 'F', tier: 'juvenil', nac: '11 jun 2005', edad: 20, sangre: 'B+', alt: 162, peso: 55, ciudad: 'Pereira', depto: 'Risaralda' },
  'DEP-004': { sexo: 'M', tier: 'juvenil', nac: '30 ene 2008', edad: 17, sangre: 'O+', alt: 170, peso: 60, ciudad: 'Cali', depto: 'Valle del Cauca' },
  'DEP-005': { sexo: 'F', tier: 'profesional', nac: '19 abr 1997', edad: 28, sangre: 'A-', alt: 171, peso: 63, ciudad: 'Medellín', depto: 'Antioquia',
    inscripciones: [{ evento: 'Copa Nacional de Natación 2025', prueba: '100m libre', fecha: '2025-05-12', estado: 'finalizado' }],
    resultados: [{ evento: 'Copa Nacional de Natación 2025', prueba: '100m libre', ranking: 2, fecha: '2025-05-12' }],
    medalleria: [{ evento: 'Copa Nacional de Natación 2025', prueba: '100m libre', medalla: 'Plata', fecha: '2025-05-12' }] },
  'DEP-006': { sexo: 'M', tier: 'amateur', nac: '05 dic 1996', edad: 29, sangre: 'O+', alt: 179, peso: 76, ciudad: 'Bogotá', depto: 'Bogotá D.C.' },
  'DEP-007': { sexo: 'F', tier: 'amateur', nac: '22 oct 2001', edad: 24, sangre: 'A+', alt: 165, peso: 58, ciudad: 'Cali', depto: 'Valle del Cauca' },
  'DEP-008': { sexo: 'M', tier: 'amateur', nac: '14 jul 1999', edad: 26, sangre: 'B+', alt: 177, peso: 70, ciudad: 'Tunja', depto: 'Boyacá' },
  'DEP-009': { sexo: 'F', tier: 'amateur', nac: '03 feb 2000', edad: 25, sangre: 'O-', alt: 169, peso: 60, ciudad: 'Medellín', depto: 'Antioquia' },
  'DEP-010': { sexo: 'M', tier: 'amateur', nac: '28 ago 2002', edad: 23, sangre: 'A+', alt: 174, peso: 68, ciudad: 'Cali', depto: 'Valle del Cauca' },
  'DEP-011': { sexo: 'F', tier: 'juvenil', nac: '16 mar 2007', edad: 18, sangre: 'O+', alt: 160, peso: 54, ciudad: 'Barranquilla', depto: 'Atlántico' },
  'DEP-012': { sexo: 'M', tier: 'profesional', nac: '09 nov 1998', edad: 27, sangre: 'AB+', alt: 178, peso: 73, ciudad: 'Cali', depto: 'Valle del Cauca',
    inscripciones: [{ evento: 'Juegos Regionales Valle 2025', prueba: '500m sprint', fecha: '2025-07-10', estado: 'finalizado' }],
    resultados: [{ evento: 'Juegos Regionales Valle 2025', prueba: '500m sprint', ranking: 4, fecha: '2025-07-10' }],
    medalleria: [] }
};

function seedFromDoc(numDoc) {
  let h = 2166136261 >>> 0;
  const s = String(numDoc || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function fmtFecha(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]} ${MESES[+m[2] - 1]} ${m[1]}` : (iso || '');
}
function anio(iso) { const m = /(\d{4})/.exec(iso || ''); return m ? m[1] : (iso || ''); }
function slugCorreo(n, a) { return `${n}.${a}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z.]/g, ''); }

/* Mapea un deportista (semilla delgada) al shape que consume el perfil.
   La cadena de afiliación se deriva SIEMPRE de la jerarquía (herencia real). */
export function buildDeportistaDetalle(dep) {
  if (!dep) return null;
  const w = dep.nombre.trim().split(/\s+/);
  let nombre = w[0] || '', segundoNombre = '', apellido = '', segundoApellido = '';
  if (w.length >= 4) { segundoNombre = w[1]; apellido = w[2]; segundoApellido = w.slice(3).join(' '); }
  else if (w.length === 3) { segundoNombre = w[1]; apellido = w[2]; }
  else { apellido = w.slice(1).join(' '); }

  const x = PERFIL_EXTRA[dep.id] || {};
  const seed = seedFromDoc(dep.numDoc);
  const sexo = x.sexo || (seed % 2 === 0 ? 'F' : 'M');
  const tier = x.tier || 'amateur';
  const alt = x.alt || (158 + (seed % 32));            // 158–189 cm
  const peso = x.peso || (52 + ((seed >> 3) % 38));    // 52–89 kg
  const sangre = x.sangre || SANGRES[seed % SANGRES.length];
  const edad = x.edad || (16 + ((seed >> 5) % 22));    // 16–37
  const imc = (alt && peso) ? (peso / Math.pow(alt / 100, 2)).toFixed(1) : '—';
  const inscripciones = x.inscripciones || [];
  const resultados = x.resultados || [];
  const medalleria = x.medalleria || [];

  /* ─── Cadena de afiliación DERIVADA de la jerarquía real ─── */
  const club = dep.clubId ? getOrganismo(dep.clubId) : null;
  const chain = dep.clubId ? ancestorsOf(dep.clubId) : [];
  const liga = chain.find((o) => o.tipo === 'liga') || null;
  const federacion = chain.find((o) => o.tipo === 'federacion') || null;
  const comite = chain.find((o) => o.tipo === 'comite') || null;

  const emoji = DEPORTE_EMOJI[dep.deporte] || '🏅';
  const slug = slugCorreo(nombre, apellido);
  const compl = Math.min(96, 60 + medalleria.length * 8 + inscripciones.length * 4 + (dep.clubId ? 10 : 0));

  return {
    id: dep.id, estado: dep.estado, clubId: dep.clubId,
    nombre, segundoNombre, apellido, segundoApellido,
    nombreCompleto: dep.nombre,
    avatar: (nombre[0] || '') + (apellido[0] || ''),
    tier, tierLabel: TIER_LABEL[tier],
    deporte: dep.deporte, deporteEmoji: emoji, modalidad: dep.modalidad,
    doc: { tipo: DOC_LABEL[dep.tipoDoc] || dep.tipoDoc, tipoCorto: dep.tipoDoc, numero: dep.numDoc },
    nacimiento: x.nac || '—', edad,
    sexo: sexo === 'F' ? 'Femenino' : 'Masculino',
    genero: sexo === 'F' ? 'Femenino' : 'Masculino',
    sangre,
    nacionalidad: { pais: 'Colombia', iso: 'co' },
    /* Cadena real (objetos organismo) + nombres para pintar. */
    club, liga, federacion, comite,
    clubNombre: club ? club.nombre : null,
    ligaNombre: liga ? liga.nombre : null,
    federacionNombre: federacion ? federacion.nombre : null,
    comiteNombre: comite ? comite.nombre : null,
    manoHabil: (seed % 5 === 0) ? 'Izquierda' : 'Derecha',
    aniosPractica: Math.max(2, edad - 12),
    ubicacion: { depto: x.depto || 'Valle del Cauca', municipio: x.ciudad || 'Cali', zona: 'Urbana', barrio: 'Centro', direccion: 'Por definir' },
    contacto: {
      correo: dep.correo || `${slug}@correo.demo.co`,
      telefono: `+57 31${(seed % 9)} 555 0${(100 + (seed % 800)).toString().slice(-3)}`,
      emergenciaNombre: 'Contacto familiar', emergenciaTel: '+57 320 555 0142'
    },
    biometria: { altura: alt + ' cm', peso: peso + ' kg', sangre, imc },
    completitud: compl,
    documentos: [
      { nombre: 'Documento de identidad', sub: 'Verificado', estado: 'verificado', subido: true },
      { nombre: 'Certificado médico deportivo', sub: 'Vigente', estado: 'vigente', subido: true },
      { nombre: 'Afiliación EPS', sub: 'Documento requerido — aún no lo has subido', estado: 'requerido', subido: false },
      { nombre: 'Consentimiento de tratamiento de datos', sub: 'Falta firmar', estado: 'pendiente', subido: true }
    ],
    inscripciones: inscripciones.map((e) => ({ evento: e.evento, prueba: e.prueba, fecha: fmtFecha(e.fecha), estado: e.estado })),
    resultados: resultados.map((r) => ({ evento: r.evento, prueba: r.prueba, ranking: r.ranking, fecha: anio(r.fecha) })),
    medalleria: medalleria.map((m) => ({ evento: m.evento, prueba: m.prueba, medalla: m.medalla, fecha: anio(m.fecha), deporte: m.deporte || dep.deporte }))
  };
}
