/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — RBAC: matriz de permisos + jurisdicción por rol
   Registro de Organismos — Jerarquía SUID · v0.2.0

   Codifica la matriz de accesos §11.2 y la jurisdicción §11.1 del handoff.
   Los 6 roles de la demo (§11.1) están ANCLADOS a un organismo; su
   jurisdicción es el subárbol de ese ancla (scopeFor + subtreeOf).

   Acciones (leyenda §11.2):
     C crear/pre-registrar · R consultar · U editar datos ·
     A aprobar/rechazar/corrección · S sancionar (suspender/inactivar/cancelar) ·
     X retirar (lo propio). NO existe D (borrado duro) para NADIE — el ciclo
     de vida es por estados (ORG-07).
   `*` en el handoff = supuesto pendiente de confirmación del Ministerio (§6);
   en la demo se codifica como permiso real y se marca aquí en comentario.
   ═══════════════════════════════════════════════════════════════ */

export const ACCIONES = Object.freeze({
  CREAR: 'C', LEER: 'R', EDITAR: 'U', APROBAR: 'A', SANCIONAR: 'S', RETIRAR: 'X'
});

export const RECURSOS = Object.freeze([
  'comites', 'federaciones', 'ligas', 'clubes', 'deportistas', 'solicitudes', 'cargue', 'auditoria'
]);

/* Matriz §11.2 — PERMS[recurso][rol] = string con las acciones concedidas.
   Cadena vacía '' = sin acceso (—). */
const PERMS = {
  comites: {
    MINDEPORTE: 'CRUS',  // único creador (ORG-01)
    COMITE: 'RU',        // el propio
    FEDERACION: 'R', LIGA: 'R', CLUB: 'R', DEPORTISTA: 'R'
  },
  federaciones: {
    MINDEPORTE: 'RAS',   // A = su mitad de la doble validación
    COMITE: 'CRA',       // C pre-registro/cargue · A = su mitad — solo su sector
    FEDERACION: 'RU',    // la propia
    LIGA: 'R', CLUB: 'R', DEPORTISTA: 'R'
  },
  ligas: {
    MINDEPORTE: 'RS',    // S* supuesto
    COMITE: 'R',         // su sector
    FEDERACION: 'CRA',   // las suyas
    LIGA: 'RU',          // la propia
    CLUB: 'R', DEPORTISTA: 'R'
  },
  clubes: {
    MINDEPORTE: 'RS',    // S* supuesto
    COMITE: 'R',
    FEDERACION: 'R',     // subárbol
    LIGA: 'CRA',         // los suyos
    CLUB: 'RU',          // el propio
    DEPORTISTA: 'R'      // solo buscar clubes Activos (se acota en la UI de afiliación)
  },
  deportistas: {
    MINDEPORTE: 'R', COMITE: 'R', FEDERACION: 'R', LIGA: 'R',
    CLUB: 'R',           // sus afiliados
    DEPORTISTA: 'RU'     // el propio (nunca documento / fecha nac.)
  },
  solicitudes: {
    MINDEPORTE: 'R',     // auditoría
    COMITE: '', FEDERACION: '', LIGA: '',
    CLUB: 'RA',          // las dirigidas a su club (ORG-05, único aprobador)
    DEPORTISTA: 'CRX'    // crea / ve estado / retira las propias
  },
  cargue: {
    MINDEPORTE: 'R',     // historial global*
    COMITE: 'CR',        // federaciones
    FEDERACION: 'CR',    // ligas
    LIGA: 'CR',          // clubes
    CLUB: '',            // pregunta abierta #1 (quién carga deportistas)
    DEPORTISTA: ''
  },
  auditoria: {
    MINDEPORTE: 'R', COMITE: 'R', FEDERACION: 'R', LIGA: 'R', CLUB: 'R', DEPORTISTA: 'R'
  }
};

/* ¿El rol tiene la acción sobre el recurso? (enforcement en UI). */
export function can(role, accion, recurso) {
  const fila = PERMS[recurso];
  if (!fila) return false;
  const concedidas = fila[role] || '';
  return concedidas.includes(accion);
}

/* Todas las acciones que el rol puede ejecutar sobre el recurso (array). */
export function accionesDe(role, recurso) {
  const concedidas = (PERMS[recurso] && PERMS[recurso][role]) || '';
  return concedidas.split('');
}

/* ─── Jurisdicción (§11.1): orgId ANCLA de cada rol ───
   scopeFor devuelve el nodo raíz de la jurisdicción del rol:
     MINDEPORTE → null (raíz del SND: ve los 3 comités y todo debajo)
     COMITE     → 'COC'      (Comité Olímpico Colombiano)
     FEDERACION → 'FED-040'  (Fed. Col. de Patinaje)
     LIGA       → 'LIG-001'  (Liga de Patinaje del Valle)
     CLUB       → 'CLU-001'  (Club Patín Cali)
     DEPORTISTA → 'DEP-001'  (Valentina Ortiz — persona; su cadena heredada)
   IDs verificados contra el seed de organismos-data.js. */
const SCOPE = {
  MINDEPORTE: null,
  COMITE: 'COC',
  FEDERACION: 'FED-040',
  LIGA: 'LIG-001',
  CLUB: 'CLU-001',
  DEPORTISTA: 'DEP-001'
};

export function scopeFor(role) {
  return role in SCOPE ? SCOPE[role] : null;
}

/* ¿El rol ve TODO el SND? (solo Mindeporte — ancla en la raíz). */
export function isGlobalScope(role) {
  return scopeFor(role) === null && role === 'MINDEPORTE';
}
