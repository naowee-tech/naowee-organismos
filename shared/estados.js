/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Estados del organismo + mapeo semántico de badge
   Registro de Organismos — Jerarquía SUID · v0.2.0

   Módulo HOJA (sin dependencias) — fuente ÚNICA del vocabulario de estados
   del ciclo de vida (handoff §3.2 / §11.3). `organismos-data.js` importa de
   aquí y re-exporta `estadoBadgeVariant` para compatibilidad.

   Mapa estado → variante de badge del DS (aprobado, T2):
     Preinscrito  → neutral   (gris — pre-registro, aún sin enviar)
     En revisión  → caution   (ámbar — en trámite / esperando validación)
     Activo       → positive  (verde — habilitado)
     Rechazado    → negative  (rojo — reingresa al flujo)
     Suspendido   → caution   (ámbar — sanción temporal)
     Inactivo     → neutral   (gris — sin uso / sin vínculos)
     Cancelado    → negative  (rojo — pierde reconocimiento, NO reingresa)
   Render canónico SIEMPRE: .naowee-badge --quiet --small con esa variante.
   ═══════════════════════════════════════════════════════════════ */

export const ESTADOS = [
  'Preinscrito', 'En revisión', 'Activo', 'Rechazado', 'Suspendido', 'Inactivo', 'Cancelado'
];

const BADGE_VARIANT = {
  'Preinscrito': 'neutral',
  'En revisión': 'caution',
  'Activo': 'positive',
  'Rechazado': 'negative',
  'Suspendido': 'caution',
  'Inactivo': 'neutral',
  'Cancelado': 'negative'
};

/* Variante de badge del DS para un estado de organismo. */
export function estadoBadgeVariant(estado) {
  return BADGE_VARIANT[estado] || 'neutral';
}

/* Descripción corta por estado (tooltips / ayudas de la demo). */
export const ESTADO_DESC = {
  'Preinscrito': 'Pre-registro creado; aún debe completar y enviar su registro.',
  'En revisión': 'Registro enviado; en validación por el nivel superior.',
  'Activo': 'Habilitado en el SUID; puede operar y aprobar a su nivel inferior.',
  'Rechazado': 'Rechazado con motivo; puede corregir y reingresar al flujo.',
  'Suspendido': 'Habilitación suspendida temporalmente por el Ministerio.',
  'Inactivo': 'Sin actividad o sin vínculos activos.',
  'Cancelado': 'Pierde reconocimiento / condición jurídica; no reingresa.'
};

/* ─── Máquina de estados (§11.3) — DATOS centralizados para T5 ───
   Se declara aquí para que la Bandeja (T5) construya la lógica de
   transición y la doble validación de federación sobre una única fuente.
   T2 (explorador) es SOLO lectura: no ejecuta transiciones. */
export const TRANSICIONES = [
  { de: 'Preinscrito', a: 'En revisión', quien: 'organismo',  regla: 'El propio organismo completa y envía su registro.' },
  { de: 'En revisión', a: 'Activo',       quien: 'superior',   regla: 'Nivel superior inmediato (federación: doble validación Mindeporte + Comité). El padre debe estar Activo.' },
  { de: 'En revisión', a: 'Rechazado',    quien: 'superior',   regla: 'Motivo obligatorio.' },
  { de: 'Rechazado',   a: 'En revisión',  quien: 'organismo',  regla: 'Corrige y reenvía; reingresa al mismo flujo.' },
  { de: 'Activo',      a: 'Suspendido',   quien: 'MINDEPORTE', regla: 'Sanción temporal (supuesto de demo).' },
  { de: 'Activo',      a: 'Inactivo',     quien: 'MINDEPORTE', regla: 'Sin uso / pérdida de vínculos (condición pendiente de definir).' },
  { de: '*',           a: 'Cancelado',    quien: 'MINDEPORTE', regla: 'Pérdida de reconocimiento; NO reingresa.' }
];

/* Estados de la solicitud de afiliación deportista→club (§3.3) — para T7. */
export const ESTADOS_SOLICITUD = ['Enviada', 'Aprobada', 'Rechazada', 'Retirada'];
