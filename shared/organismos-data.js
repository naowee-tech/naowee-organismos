/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Seed de datos + capa de lectura (módulo ES)
   Registro de Organismos — Jerarquía SUID · v0.1.0

   Modelo del organismo:
     { id, tipo:'comite'|'federacion'|'liga'|'club', nombre, nit,
       sector:'Olímpico'|'Paralímpico'|'Sordolímpico', deporte, parentId,
       estado, repLegal:{tipoDoc,numDoc,nombre,apellido,correo},
       ubicacion:{depto,ciudad,zona,direccion}, contacto:{telefono,correo},
       fechaRegistro }
     Campos opcionales por tipo (T3 registro):
       tipoClub:'promotor'|'profesional'|'escuela' (club),
       ambito:'departamental'|'distrital' (liga),
       actoAdministrativo (comité), documentos:{ [docId]:{name,size} },
       aceptaPoliticas:boolean, ficticio:true (todo lo creado en la demo).
   Modelo del deportista:
     { id, nombre, tipoDoc, numDoc, deporte, modalidad, correo,
       clubId|null, estado:'autodeclarado'|'vinculado' }
   Estados de organismo (§3.2 handoff):
     Preinscrito · En revisión · Activo · Rechazado · Suspendido · Inactivo · Cancelado

   PRIVACIDAD (handoff §8.5.4): las 57 federaciones son el caso real del COC.
   Se conserva SOLO dato institucional (nombre, NIT, depto/ciudad/zona/dirección,
   teléfono y correo de CONTACTO institucional). Los datos personales del rep.
   legal (número de documento, nombre/apellido y correo) son FICTICIOS. Los xlsx
   originales NO viven en este repo.
   ═══════════════════════════════════════════════════════════════ */

/* Vocabulario de estados + mapa semántico de badge: fuente única en
   estados.js (T2). Se re-exportan aquí para no romper imports existentes
   (`import { estadoBadgeVariant, ORG_ESTADOS } from './organismos-data.js'`). */
import { ESTADOS, estadoBadgeVariant } from './estados.js';
export { estadoBadgeVariant };
export const ORG_ESTADOS = ESTADOS;

/* ─── 1) Comités / cabezas de sector (nodos raíz, Activos, parentId null) ─── */
const COMITES = [
  { id: 'COC', tipo: 'comite', nombre: 'Comité Olímpico Colombiano', nit: '860028097-1', sector: 'Olímpico', deporte: '—', parentId: null, estado: 'Activo', repLegal: { tipoDoc: 'CC', numDoc: '10000100', nombre: 'Camilo', apellido: 'Duarte', correo: 'presidencia@coc.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Av. Cra. 30 (NQS) # 64-81' }, contacto: { telefono: '6013618888', correo: 'info@coc.org.co' }, fechaRegistro: '2025-11-02' },
  { id: 'CPC', tipo: 'comite', nombre: 'Comité Paralímpico Colombiano', nit: '830500110-4', sector: 'Paralímpico', deporte: '—', parentId: null, estado: 'Activo', repLegal: { tipoDoc: 'CC', numDoc: '10000101', nombre: 'Marcela', apellido: 'Ríos', correo: 'presidencia@cpc.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Calle 63 # 47-06' }, contacto: { telefono: '6014801515', correo: 'contacto@paralimpicocol.demo.co' }, fechaRegistro: '2025-11-05' },
  { id: 'FSC', tipo: 'comite', nombre: 'Federación Sordolímpica de Colombia', nit: '900700221-2', sector: 'Sordolímpico', deporte: '—', parentId: null, estado: 'Activo', repLegal: { tipoDoc: 'CC', numDoc: '10000102', nombre: 'Hernán', apellido: 'Pérez', correo: 'presidencia@sordolimpico.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Cra. 48 # 20-114' }, contacto: { telefono: '6045551020', correo: 'contacto@sordolimpico.demo.co' }, fechaRegistro: '2025-11-08' }
];

/* ─── 2) 57 federaciones adscritas al COC (caso real, PII ficticia) ─── */
const FEDERACIONES_COC = [
  { id: "FED-001", tipo: "federacion", nombre: "Federación Colombiana de Actividades Subacuáticas", nit: "890315463-9", sector: "Olímpico", deporte: "Actividades Subacuáticas", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000001", nombre: "Andrés", apellido: "Vargas Guzmán", correo: "presidencia@fedeactividadessubac.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 (NQS) # 64-81" }, contacto: { telefono: "3203657611", correo: "fedecas.colombia@gmail.com" }, fechaRegistro: "2026-02-02" },
  { id: "FED-002", tipo: "federacion", nombre: "Federación Colombiana de Ajedrez", nit: "860016595-0", sector: "Olímpico", deporte: "Ajedrez", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000002", nombre: "Carolina", apellido: "Pineda Zuluaga", correo: "presidencia@fedeajedrez.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3227342146", correo: "contacto@fecodaz.org" }, fechaRegistro: "2026-03-03" },
  { id: "FED-003", tipo: "federacion", nombre: "Federación Arqueros de Colombia", nit: "811030815-6", sector: "Olímpico", deporte: "Arqueros de Colombia", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000003", nombre: "Fernando", apellido: "Escobar Cárdenas", correo: "presidencia@fedearquerosdecolomb.demo.co" }, ubicacion: { depto: "Antioquia", ciudad: "Medellín", zona: "Urbana", direccion: "Carrera 66B No. 31A -15" }, contacto: { telefono: "3168775003", correo: "fedearco@gmail.com" }, fechaRegistro: "2026-04-04" },
  { id: "FED-004", tipo: "federacion", nombre: "Federación Colombiana de Atletismo", nit: "860075776-9", sector: "Olímpico", deporte: "Atletismo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000004", nombre: "Diana", apellido: "Cano Reyes", correo: "presidencia@fedeatletismo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3014836269", correo: "fedeatletismo@fecodatle.com" }, fechaRegistro: "2026-05-05" },
  { id: "FED-005", tipo: "federacion", nombre: "Federación Colombiana de Automovilismo Deportivo", nit: "860047439-2", sector: "Olímpico", deporte: "Automovilismo Deportivo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000005", nombre: "Ricardo", apellido: "Ramírez Castro", correo: "presidencia@fedeautomovilismodep.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Calle 102 a No. 49a-24" }, contacto: { telefono: "3118080868", correo: "fedeautos@gmail.com" }, fechaRegistro: "2026-06-06" },
  { id: "FED-006", tipo: "federacion", nombre: "Federación Colombiana de Bádminton", nit: "900094889-8", sector: "Olímpico", deporte: "Bádminton", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000006", nombre: "Marcela", apellido: "Cárdenas Escobar", correo: "presidencia@fedebadminton.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Transv. 21 BIS No. 60-35/39 Barrio San Luis" }, contacto: { telefono: "3106669210", correo: "badmintoncolombia@gmail.com" }, fechaRegistro: "2026-01-07" },
  { id: "FED-007", tipo: "federacion", nombre: "Federación Colombiana de Baile Deportivo", nit: "900856525-3", sector: "Olímpico", deporte: "Baile Deportivo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000007", nombre: "Julián", apellido: "Salazar López", correo: "presidencia@fedebailedeportivo.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Calle 59A #2c-67" }, contacto: { telefono: "3166174942", correo: "fedecolbaile@gmail.com" }, fechaRegistro: "2026-02-08" },
  { id: "FED-008", tipo: "federacion", nombre: "Federación Colombiana de Baloncesto", nit: "860038199-1", sector: "Olímpico", deporte: "Baloncesto", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000008", nombre: "Paola", apellido: "Franco Arango", correo: "presidencia@fedebaloncesto.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Avenida Carrera 30 # 64-81" }, contacto: { telefono: "3023766365", correo: "fecolcesto@hotmail.com" }, fechaRegistro: "2026-03-09" },
  { id: "FED-009", tipo: "federacion", nombre: "Federación Colombiana de Balonmano", nit: "900359754-1", sector: "Olímpico", deporte: "Balonmano", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000009", nombre: "Sebastián", apellido: "Hernández Gómez", correo: "presidencia@fedebalonmano.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Carrera 36 No. 5B3-62 Piso 2 Oficina 201" }, contacto: { telefono: "3154751683", correo: "federacioncolombiabalonmano@gmail.com" }, fechaRegistro: "2026-04-10" },
  { id: "FED-010", tipo: "federacion", nombre: "Federación Colombiana de Béisbol", nit: "890480480-1", sector: "Olímpico", deporte: "Béisbol", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000010", nombre: "Natalia", apellido: "Mejía Suárez", correo: "presidencia@fedebeisbol.demo.co" }, ubicacion: { depto: "Bolivar", ciudad: "Cartagena", zona: "Urbana", direccion: "Centro la Matuna Edificio CONCASA Of. 404" }, contacto: { telefono: "3163843364", correo: "b.col@wbsc.org" }, fechaRegistro: "2026-05-11" },
  { id: "FED-011", tipo: "federacion", nombre: "Federación Colombiana de Billar", nit: "860061869-4", sector: "Olímpico", deporte: "Billar", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000011", nombre: "Camilo", apellido: "Arango Franco", correo: "presidencia@fedebillar.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Oficina 402" }, contacto: { telefono: "3005670307", correo: "fcbillar@hotmail.com" }, fechaRegistro: "2026-06-12" },
  { id: "FED-012", tipo: "federacion", nombre: "Federación Colombiana de Bowling", nit: "860533073-5", sector: "Olímpico", deporte: "Bowling", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000012", nombre: "Adriana", apellido: "Bravo Rojas", correo: "presidencia@fedebowling.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Avda. Calle 63 No. 68-99 2do. Piso Bolera El Salitre" }, contacto: { telefono: "3203443851", correo: "fedecobol@hotmail.com" }, fechaRegistro: "2026-01-13" },
  { id: "FED-013", tipo: "federacion", nombre: "Federación Colombiana de Boxeo", nit: "800231411-7", sector: "Olímpico", deporte: "Boxeo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000013", nombre: "Mauricio", apellido: "Rodríguez Naranjo", correo: "presidencia@fedeboxeo.demo.co" }, ubicacion: { depto: "Atlantico", ciudad: "Barranquilla", zona: "Urbana", direccion: "Cra. 38 No. 52-52 Edificio JT Oficina 1" }, contacto: { telefono: "3106307960", correo: "fecolbox@gmail.com" }, fechaRegistro: "2026-02-14" },
  { id: "FED-014", tipo: "federacion", nombre: "Federación Clubes de Bridge de Colombia", nit: "900572599-8", sector: "Olímpico", deporte: "Bridge", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000014", nombre: "Lucía", apellido: "Castro Ramírez", correo: "presidencia@fedebridge.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Carrera 7 A No. 69 - 07 Barrio Quinta Camacho" }, contacto: { telefono: "3104151423", correo: "federaciondebridge@gmail.com" }, fechaRegistro: "2026-03-15" },
  { id: "FED-015", tipo: "federacion", nombre: "Federación Colombiana de Canotaje", nit: "830083646-4", sector: "Olímpico", deporte: "Canotaje", parentId: "COC", estado: "En revisión", repLegal: { tipoDoc: "CC", numDoc: "10000015", nombre: "Gustavo", apellido: "Quintero Betancur", correo: "presidencia@fedecanotaje.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Transversal 21 bis No. 60-35/39 Teusaquillo" }, contacto: { telefono: "3187870010", correo: "canotajecolombia20@gmail.com" }, fechaRegistro: "2026-04-16" },
  { id: "FED-016", tipo: "federacion", nombre: "Federación Colombiana de Ciclismo", nit: "860020863-5", sector: "Olímpico", deporte: "Ciclismo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000016", nombre: "Ángela", apellido: "Naranjo Rodríguez", correo: "presidencia@fedeciclismo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Carrera 47 No. 106 A - 37 Barrio Estoril" }, contacto: { telefono: "3164472270", correo: "presidencia@federacioncolombianadeciclismo.com" }, fechaRegistro: "2026-05-17" },
  { id: "FED-017", tipo: "federacion", nombre: "Federación Colombiana de Coleo", nit: "822003697-9", sector: "Olímpico", deporte: "Coleo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000017", nombre: "Felipe", apellido: "Zuluaga Pineda", correo: "presidencia@fedecoleo.demo.co" }, ubicacion: { depto: "Meta", ciudad: "Villavicencio", zona: "Urbana", direccion: "Camino Ganadero Parque las Malocas Centro Ecuestre Of. 04" }, contacto: { telefono: "3106232516", correo: "federacioncolombianacoleo@hotmail.com" }, fechaRegistro: "2026-06-18" },
  { id: "FED-018", tipo: "federacion", nombre: "Federación Colombiana de Deportes Aéreos", nit: "830066529-9", sector: "Olímpico", deporte: "Deportes Aéreos", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000018", nombre: "Sandra", apellido: "Torres Duarte", correo: "presidencia@fededeportesaereos.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "carrera 26 # 72-73" }, contacto: { telefono: "3148660361", correo: "fedeasistente@gmail.com" }, fechaRegistro: "2026-01-19" },
  { id: "FED-019", tipo: "federacion", nombre: "Federación Colombiana Deportiva Militar", nit: "800230729-9", sector: "Olímpico", deporte: "Deportiva Militar", parentId: "COC", estado: "En revisión", repLegal: { tipoDoc: "CC", numDoc: "10000019", nombre: "Óscar", apellido: "Suárez Mejía", correo: "presidencia@fededeportivamilitar.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra. 59a # 44b-29 Barrio la Esmeralda" }, contacto: { telefono: "3105584441", correo: "federacion.militar@gmail.com" }, fechaRegistro: "2026-02-20" },
  { id: "FED-020", tipo: "federacion", nombre: "Federación Colombiana de Disco Volador", nit: "901154209-1", sector: "Olímpico", deporte: "Disco Volador", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000020", nombre: "Valeria", apellido: "Molina Cortés", correo: "presidencia@fedediscovolador.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3222897653", correo: "fecodv@gmail.com" }, fechaRegistro: "2026-03-21" },
  { id: "FED-021", tipo: "federacion", nombre: "Federación Ecuestre de Colombia", nit: "860025991-2", sector: "Olímpico", deporte: "Ecuestre", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000021", nombre: "Hernán", apellido: "Duarte Torres", correo: "presidencia@fedeecuestre.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Calle 98 No. 21 - 36 Oficina 602 Edificio Centro 98" }, contacto: { telefono: "3108655335", correo: "secretariageneral@fedecuestre.com" }, fechaRegistro: "2026-04-22" },
  { id: "FED-022", tipo: "federacion", nombre: "Federación Colombiana de Escalada Deportiva", nit: "900645499-4", sector: "Olímpico", deporte: "Escalada Deportiva", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000022", nombre: "Claudia", apellido: "López Salazar", correo: "presidencia@fedeescaladadeportiv.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra 21 # 50-34" }, contacto: { telefono: "3052655345", correo: "federacioncolombianaescalada@gmail.com" }, fechaRegistro: "2026-05-23" },
  { id: "FED-023", tipo: "federacion", nombre: "Federación Colombiana de Esgrima", nit: "830016532-8", sector: "Olímpico", deporte: "Esgrima", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000023", nombre: "Rodrigo", apellido: "Ospina Martínez", correo: "presidencia@fedeesgrima.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Avenida Ciudad de Quito #64-81 oficina 602" }, contacto: { telefono: "3113083337", correo: "fcesgrimacol@gmail.com" }, fechaRegistro: "2026-06-24" },
  { id: "FED-024", tipo: "federacion", nombre: "Federación Colombiana de Esquí Náutico y Wakeboard", nit: "860503520-8", sector: "Olímpico", deporte: "Esquí Náutico y Wakeboard", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000024", nombre: "Patricia", apellido: "Betancur Quintero", correo: "presidencia@fedeesquinauticoywak.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3133665582", correo: "info@fedesqui.com.co" }, fechaRegistro: "2026-01-25" },
  { id: "FED-025", tipo: "federacion", nombre: "Federación Colombiana de Fisicoculturismo", nit: "900134600-1", sector: "Olímpico", deporte: "Fisicoculturismo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000025", nombre: "Iván", apellido: "Reyes Cano", correo: "presidencia@fedefisicoculturismo.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Palmira", zona: "Urbana", direccion: "Calle 12 C No. 24 A - 119 Barrio Las Americas" }, contacto: { telefono: "3013186010", correo: "fedefisicoifbb@gmail.com" }, fechaRegistro: "2026-02-26" },
  { id: "FED-026", tipo: "federacion", nombre: "Federación Colombiana de Fútbol", nit: "860033879-9", sector: "Olímpico", deporte: "Fútbol", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000026", nombre: "Mónica", apellido: "Martínez Ospina", correo: "presidencia@fedefutbol.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra. 45 A No. 94-06 Pisos 6 7 y 8" }, contacto: { telefono: "6015185501", correo: "info@fcf.com.co" }, fechaRegistro: "2026-03-27" },
  { id: "FED-027", tipo: "federacion", nombre: "Federación Colombiana de Fútbol de Salón", nit: "860052688-1", sector: "Olímpico", deporte: "Fútbol de Salón", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000027", nombre: "Alberto", apellido: "Rojas Bravo", correo: "presidencia@fedefutboldesalon.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra 26a #61c-07 Campin" }, contacto: { telefono: "3104044569", correo: "fecolfutsal@gmail.com" }, fechaRegistro: "2026-04-01" },
  { id: "FED-028", tipo: "federacion", nombre: "Federación Colombiana de Gimnasia", nit: "860535259-7", sector: "Olímpico", deporte: "Gimnasia", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000028", nombre: "Liliana", apellido: "Guzmán Vargas", correo: "presidencia@fedegimnasia.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3103535459", correo: "fedecolg@hotmail.com" }, fechaRegistro: "2026-05-02" },
  { id: "FED-029", tipo: "federacion", nombre: "Federación Colombiana de Golf", nit: "860006815-3", sector: "Olímpico", deporte: "Golf", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000029", nombre: "Nicolás", apellido: "Cortés Molina", correo: "presidencia@fedegolf.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Carrera 7a No. 72 - 64 Interior 30 Chapinero" }, contacto: { telefono: "3153490021", correo: "fedegolf@fedegolfcolombia.com" }, fechaRegistro: "2026-06-03" },
  { id: "FED-030", tipo: "federacion", nombre: "Federación Colombiana de Jiu-Jitsu", nit: "900123386-0", sector: "Olímpico", deporte: "Jiu-Jitsu", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000030", nombre: "Beatriz", apellido: "Gómez Hernández", correo: "presidencia@fedejiujitsu.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Piso 7" }, contacto: { telefono: "3184020581", correo: "jiujitsucolombia@hotmail.com" }, fechaRegistro: "2026-01-04" },
  { id: "FED-031", tipo: "federacion", nombre: "Federación Colombiana de Judo", nit: "860532945-8", sector: "Olímpico", deporte: "Judo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000031", nombre: "Andrés", apellido: "Vargas Guzmán", correo: "presidencia@fedejudo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Piso 4 Of. 407" }, contacto: { telefono: "3156083261", correo: "oficina@fecoljudo.org.co" }, fechaRegistro: "2026-02-05" },
  { id: "FED-032", tipo: "federacion", nombre: "Federación Colombiana de Kárate Do", nit: "800101126-5", sector: "Olímpico", deporte: "Kárate Do", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000032", nombre: "Carolina", apellido: "Pineda Zuluaga", correo: "presidencia@fedekaratedo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Piso 4" }, contacto: { telefono: "3152264346", correo: "fckcolombiakarate@gmail.com" }, fechaRegistro: "2026-03-06" },
  { id: "FED-033", tipo: "federacion", nombre: "Federación Colombiana de Karts", nit: "860065896-1", sector: "Olímpico", deporte: "Karts", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000033", nombre: "Fernando", apellido: "Escobar Cárdenas", correo: "presidencia@fedekarts.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3112519729", correo: "info@fedekart.com.co" }, fechaRegistro: "2026-04-07" },
  { id: "FED-034", tipo: "federacion", nombre: "Federación Colombiana de Levantamiento de Pesas", nit: "890480912-1", sector: "Olímpico", deporte: "Levantamiento de Pesas", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000034", nombre: "Diana", apellido: "Cano Reyes", correo: "presidencia@fedelevantamientodep.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Cra. 39 No. 9 - 31 Santiago de Cali" }, contacto: { telefono: "3005261815", correo: "fedepesascolombia@gmail.com" }, fechaRegistro: "2026-05-08" },
  { id: "FED-035", tipo: "federacion", nombre: "Federación Colombiana de Lucha", nit: "890310137-1", sector: "Olímpico", deporte: "Lucha", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000035", nombre: "Ricardo", apellido: "Ramírez Castro", correo: "presidencia@fedelucha.demo.co" }, ubicacion: { depto: "Antioquia", ciudad: "Medellín", zona: "Urbana", direccion: "Calle 45 FF No. 75 - 37" }, contacto: { telefono: "3137083954", correo: "fedeluchacol2@gmail.com" }, fechaRegistro: "2026-06-09" },
  { id: "FED-036", tipo: "federacion", nombre: "Federación Colombiana de Motociclismo", nit: "800176937-3", sector: "Olímpico", deporte: "Motociclismo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000036", nombre: "Marcela", apellido: "Cárdenas Escobar", correo: "presidencia@fedemotociclismo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Oficina 706" }, contacto: { telefono: "3016584540", correo: "fedemoto@fedemoto.org" }, fechaRegistro: "2026-01-10" },
  { id: "FED-037", tipo: "federacion", nombre: "Federación Colombiana de Motonáutica", nit: "811022609-1", sector: "Olímpico", deporte: "Motonáutica", parentId: "COC", estado: "Suspendido", repLegal: { tipoDoc: "CC", numDoc: "10000037", nombre: "Julián", apellido: "Salazar López", correo: "presidencia@fedemotonautica.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Calle 45 # 66B-15 Salitre Greco" }, contacto: { telefono: "3506570121", correo: "fcmpresidencia@hotmail.com" }, fechaRegistro: "2026-02-11" },
  { id: "FED-038", tipo: "federacion", nombre: "Federación Colombiana de Natación", nit: "890308001-0", sector: "Olímpico", deporte: "Natación", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000038", nombre: "Paola", apellido: "Franco Arango", correo: "presidencia@fedenatacion.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Calle 9B No. 27 - 49 Barrio Champana" }, contacto: { telefono: "3104151423", correo: "fecolnat@fecna.com.co" }, fechaRegistro: "2026-03-12" },
  { id: "FED-039", tipo: "federacion", nombre: "Federación Colombiana de Orientación", nit: "804013044-7", sector: "Olímpico", deporte: "Orientación", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000039", nombre: "Sebastián", apellido: "Hernández Gómez", correo: "presidencia@fedeorientacion.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3002799625", correo: "orientacion.co@gmail.com" }, fechaRegistro: "2026-04-13" },
  { id: "FED-040", tipo: "federacion", nombre: "Federación Colombiana de Patinaje", nit: "860077223-7", sector: "Olímpico", deporte: "Patinaje", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000040", nombre: "Alberto", apellido: "Herrera", correo: "presidencia@fedepatinaje.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra. 74 No. 25 F - 10 Barrio Modelia" }, contacto: { telefono: "6012632225", correo: "info@fedepatin.org.co" }, fechaRegistro: "2026-05-14" },
  { id: "FED-041", tipo: "federacion", nombre: "Federación Colombiana de Porrismo", nit: "901057369-6", sector: "Olímpico", deporte: "Porrismo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000041", nombre: "Camilo", apellido: "Arango Franco", correo: "presidencia@fedeporrismo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Cra 11 #146-75 Ed. 147" }, contacto: { telefono: "3042008756", correo: "fedecolcheer@gmail.com" }, fechaRegistro: "2026-06-15" },
  { id: "FED-042", tipo: "federacion", nombre: "Federación Colombiana de Rugby", nit: "900429096-4", sector: "Olímpico", deporte: "Rugby", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000042", nombre: "Adriana", apellido: "Bravo Rojas", correo: "presidencia@federugby.demo.co" }, ubicacion: { depto: "Antioquia", ciudad: "Medellín", zona: "Urbana", direccion: "Calle 59 #70-124" }, contacto: { telefono: "3015682626", correo: "cpalacio@colombia.rugby" }, fechaRegistro: "2026-01-16" },
  { id: "FED-043", tipo: "federacion", nombre: "Federación Colombiana de Sambo", nit: "900262915-2", sector: "Olímpico", deporte: "Sambo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000043", nombre: "Mauricio", apellido: "Rodríguez Naranjo", correo: "presidencia@fedesambo.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Carrera 38A No. 7-05 El Templete" }, contacto: { telefono: "3003890355", correo: "fcsambo@gmail.com" }, fechaRegistro: "2026-02-17" },
  { id: "FED-044", tipo: "federacion", nombre: "Federación Colombiana de Savate", nit: "901239083-7", sector: "Olímpico", deporte: "Savate", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000044", nombre: "Lucía", apellido: "Castro Ramírez", correo: "presidencia@fedesavate.demo.co" }, ubicacion: { depto: "Tolima", ciudad: "Ibagué", zona: "Urbana", direccion: "Urbanizacion La Maria Parte Baja Casa 20" }, contacto: { telefono: "3204633830", correo: "savatecolombia@gmail.com" }, fechaRegistro: "2026-03-18" },
  { id: "FED-045", tipo: "federacion", nombre: "Federación Colombiana de Softbol", nit: "890401221-1", sector: "Olímpico", deporte: "Softbol", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000045", nombre: "Gustavo", apellido: "Quintero Betancur", correo: "presidencia@fedesoftbol.demo.co" }, ubicacion: { depto: "Bolivar", ciudad: "Cartagena", zona: "Urbana", direccion: "Estadio de Softbol de Chiquinquira" }, contacto: { telefono: "3174289338", correo: "presidencia@fedesoftbol.org" }, fechaRegistro: "2026-04-19" },
  { id: "FED-046", tipo: "federacion", nombre: "Federación Colombiana de Squash", nit: "800045466-4", sector: "Olímpico", deporte: "Squash", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000046", nombre: "Ángela", apellido: "Naranjo Rodríguez", correo: "presidencia@fedesquash.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "2455430", correo: "omapentu@hotmail.com" }, fechaRegistro: "2026-05-20" },
  { id: "FED-047", tipo: "federacion", nombre: "Federación Colombiana de Surf", nit: "901091612-5", sector: "Olímpico", deporte: "Surf", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000047", nombre: "Felipe", apellido: "Zuluaga Pineda", correo: "presidencia@fedesurf.demo.co" }, ubicacion: { depto: "Bolivar", ciudad: "Cartagena", zona: "Urbana", direccion: "Isla Tierra Bomba Av. Principal Cabana Vista Hermosa" }, contacto: { telefono: "3006551155", correo: "fedecolsurf@gmail.com" }, fechaRegistro: "2026-06-21" },
  { id: "FED-048", tipo: "federacion", nombre: "Federación Colombiana de Taekwondo", nit: "860524134-8", sector: "Olímpico", deporte: "Taekwondo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000048", nombre: "Sandra", apellido: "Torres Duarte", correo: "presidencia@fedetaekwondo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Oficina 603" }, contacto: { telefono: "3152956699", correo: "tkd_colombia@hotmail.com" }, fechaRegistro: "2026-01-22" },
  { id: "FED-049", tipo: "federacion", nombre: "Federación Colombiana de Tejo", nit: "800078980-0", sector: "Olímpico", deporte: "Tejo", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000049", nombre: "Óscar", apellido: "Suárez Mejía", correo: "presidencia@fedetejo.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3217760951", correo: "fedetejocol@hotmail.com" }, fechaRegistro: "2026-02-23" },
  { id: "FED-050", tipo: "federacion", nombre: "Federación Colombiana de Tenis", nit: "860030468-1", sector: "Olímpico", deporte: "Tenis", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000050", nombre: "Valeria", apellido: "Molina Cortés", correo: "presidencia@fedetenis.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Carrera 30 NQS No. 64A-70 Piso 5 Of. 506" }, contacto: { telefono: "6015635414", correo: "institucional@fedecoltenis.com" }, fechaRegistro: "2026-03-24" },
  { id: "FED-051", tipo: "federacion", nombre: "Federación Colombiana de Tenis de Mesa", nit: "890106273-1", sector: "Olímpico", deporte: "Tenis de Mesa", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000051", nombre: "Hernán", apellido: "Duarte Torres", correo: "presidencia@fedetenisdemesa.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC costado occidental" }, contacto: { telefono: "3103000648", correo: "fctmcolombia@gmail.com" }, fechaRegistro: "2026-04-25" },
  { id: "FED-052", tipo: "federacion", nombre: "Federación Colombiana de Tiro y Caza Deportiva", nit: "860008926-1", sector: "Olímpico", deporte: "Tiro y Caza Deportiva", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000052", nombre: "Claudia", apellido: "López Salazar", correo: "presidencia@fedetiroycazadeporti.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC Oficina 606" }, contacto: { telefono: "3218117162", correo: "asistente@fedetirocol.com" }, fechaRegistro: "2026-05-26" },
  { id: "FED-053", tipo: "federacion", nombre: "Federación Colombiana de Triatlón", nit: "800009065-1", sector: "Olímpico", deporte: "Triatlón", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000053", nombre: "Rodrigo", apellido: "Ospina Martínez", correo: "presidencia@fedetriatlon.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Carrera 27 #5 OESTE - 05" }, contacto: { telefono: "3153002929", correo: "fedecoltri@fedecoltri.com" }, fechaRegistro: "2026-06-27" },
  { id: "FED-054", tipo: "federacion", nombre: "Federación Colombiana de Vela", nit: "860045920-5", sector: "Olímpico", deporte: "Vela", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000054", nombre: "Patricia", apellido: "Betancur Quintero", correo: "presidencia@fedevela.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av. Cra. 30 # 64-81 Edificio COC" }, contacto: { telefono: "3104666835", correo: "info@fedevelacolombia.org" }, fechaRegistro: "2026-01-01" },
  { id: "FED-055", tipo: "federacion", nombre: "Federación Colombiana de Voleibol", nit: "860045666-9", sector: "Olímpico", deporte: "Voleibol", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000055", nombre: "Iván", apellido: "Reyes Cano", correo: "presidencia@fedevoleibol.demo.co" }, ubicacion: { depto: "Cundinamarca", ciudad: "Bogotá", zona: "Urbana", direccion: "Av Cra 30 # 64-81 Oficina 702" }, contacto: { telefono: "3003140673", correo: "fcv@fedevoleicol.com" }, fechaRegistro: "2026-02-02" },
  { id: "FED-056", tipo: "federacion", nombre: "Federación Colombiana de Wushu", nit: "809011909-1", sector: "Olímpico", deporte: "Wushu", parentId: "COC", estado: "Activo", repLegal: { tipoDoc: "CC", numDoc: "10000056", nombre: "Mónica", apellido: "Martínez Ospina", correo: "presidencia@fedewushu.demo.co" }, ubicacion: { depto: "Tolima", ciudad: "Ibagué", zona: "Urbana", direccion: "Calle 18 No 16-30 Urbanizacion la Aurora" }, contacto: { telefono: "3008207072", correo: "federacioncolombianadewushu@gmail.com" }, fechaRegistro: "2026-03-03" },
  { id: "FED-057", tipo: "federacion", nombre: "Federación Colombiana de Remo", nit: "901375567-1", sector: "Olímpico", deporte: "Remo", parentId: "COC", estado: "Preinscrito", repLegal: { tipoDoc: "CC", numDoc: "10000057", nombre: "Alberto", apellido: "Rojas Bravo", correo: "presidencia@federemo.demo.co" }, ubicacion: { depto: "Valle del Cauca", ciudad: "Cali", zona: "Urbana", direccion: "Calle 9 # 37-06 Secretaria de Deportes de Cali" }, contacto: { telefono: "3155505045", correo: "fedecoremo@gmail.com" }, fechaRegistro: "2026-04-04" }
];

/* ─── 3) Federaciones FICTICIAS para Paralímpico y Sordolímpico (ficticio:true) ─── */
const FEDERACIONES_FICTICIAS = [
  { id: 'FED-P01', tipo: 'federacion', nombre: 'Federación Paralímpica de Atletismo', nit: '901500001-1', sector: 'Paralímpico', deporte: 'Atletismo', parentId: 'CPC', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000201', nombre: 'Laura', apellido: 'Mendoza Ríos', correo: 'presidencia@fedeparaatletismo.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Calle 63 # 47-06 Of. 201' }, contacto: { telefono: '6014809090', correo: 'contacto@fedeparaatletismo.demo.co' }, fechaRegistro: '2026-02-18' },
  { id: 'FED-P02', tipo: 'federacion', nombre: 'Federación Colombiana de Natación Paralímpica', nit: '901500002-2', sector: 'Paralímpico', deporte: 'Natación', parentId: 'CPC', estado: 'En revisión', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000202', nombre: 'Diego', apellido: 'Vargas Peña', correo: 'presidencia@fedeparanatacion.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Cra. 36 # 5B-62' }, contacto: { telefono: '6024889090', correo: 'contacto@fedeparanatacion.demo.co' }, fechaRegistro: '2026-05-09' },
  { id: 'FED-S01', tipo: 'federacion', nombre: 'Federación Deportiva de Sordos de Baloncesto', nit: '901500003-3', sector: 'Sordolímpico', deporte: 'Baloncesto', parentId: 'FSC', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000203', nombre: 'Sofía', apellido: 'Guerrero León', correo: 'presidencia@fedesordosbaloncesto.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Cra. 48 # 20-114 Of. 3' }, contacto: { telefono: '6045553030', correo: 'contacto@fedesordosbaloncesto.demo.co' }, fechaRegistro: '2026-03-28' }
];

/* ─── 4) Ligas FICTICIAS (~8, estados variados). LIG-001 = cadena demo ─── */
const LIGAS = [
  { id: 'LIG-001', tipo: 'liga', nombre: 'Liga de Patinaje del Valle', nit: '805010001-1', sector: 'Olímpico', deporte: 'Patinaje', parentId: 'FED-040', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000301', nombre: 'Sandra', apellido: 'Mejía', correo: 'direccion@ligapatinajevalle.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Calle 5 # 42-00 Unidad Deportiva Alberto Galindo' }, contacto: { telefono: '6024010101', correo: 'contacto@ligapatinajevalle.demo.co' }, fechaRegistro: '2026-03-10' },
  { id: 'LIG-002', tipo: 'liga', nombre: 'Liga de Patinaje de Antioquia', nit: '805010002-2', sector: 'Olímpico', deporte: 'Patinaje', parentId: 'FED-040', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000302', nombre: 'Carlos', apellido: 'Estrada Ruiz', correo: 'direccion@ligapatinajeant.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Cra. 70 # 48-70 Estadio Atanasio Girardot' }, contacto: { telefono: '6044020202', correo: 'contacto@ligapatinajeant.demo.co' }, fechaRegistro: '2026-03-14' },
  { id: 'LIG-003', tipo: 'liga', nombre: 'Liga de Patinaje de Bogotá', nit: '805010003-3', sector: 'Olímpico', deporte: 'Patinaje', parentId: 'FED-040', estado: 'En revisión', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000303', nombre: 'Paula', apellido: 'Rincón Díaz', correo: 'direccion@ligapatinajebogota.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Cra. 60 # 63-00 Unidad Deportiva El Salitre' }, contacto: { telefono: '6014030303', correo: 'contacto@ligapatinajebogota.demo.co' }, fechaRegistro: '2026-05-02' },
  { id: 'LIG-004', tipo: 'liga', nombre: 'Liga de Fútbol del Valle', nit: '805010004-4', sector: 'Olímpico', deporte: 'Fútbol', parentId: 'FED-026', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000304', nombre: 'Andrés', apellido: 'Lozano Gil', correo: 'direccion@ligafutbolvalle.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Calle 5 # 50-00' }, contacto: { telefono: '6024040404', correo: 'contacto@ligafutbolvalle.demo.co' }, fechaRegistro: '2026-02-22' },
  { id: 'LIG-005', tipo: 'liga', nombre: 'Liga de Fútbol de Antioquia', nit: '805010005-5', sector: 'Olímpico', deporte: 'Fútbol', parentId: 'FED-026', estado: 'Preinscrito', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000305', nombre: 'Mariana', apellido: 'Ospina Cano', correo: 'direccion@ligafutbolant.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Cra. 74 # 48-10' }, contacto: { telefono: '6044050505', correo: 'contacto@ligafutbolant.demo.co' }, fechaRegistro: '2026-06-01' },
  { id: 'LIG-006', tipo: 'liga', nombre: 'Liga de Natación del Valle', nit: '805010006-6', sector: 'Olímpico', deporte: 'Natación', parentId: 'FED-038', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000306', nombre: 'Diego', apellido: 'Ospina Marín', correo: 'direccion@liganatacionvalle.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Calle 5 # 42-40 Complejo Acuático' }, contacto: { telefono: '6024060606', correo: 'contacto@liganatacionvalle.demo.co' }, fechaRegistro: '2026-02-28' },
  { id: 'LIG-007', tipo: 'liga', nombre: 'Liga de Ciclismo de Antioquia', nit: '805010007-7', sector: 'Olímpico', deporte: 'Ciclismo', parentId: 'FED-016', estado: 'Rechazado', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000307', nombre: 'Julián', apellido: 'Cárdenas Vélez', correo: 'direccion@ligaciclismoant.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Velódromo Martín Emilio Cochise Rodríguez' }, contacto: { telefono: '6044070707', correo: 'contacto@ligaciclismoant.demo.co' }, fechaRegistro: '2026-04-11' },
  { id: 'LIG-008', tipo: 'liga', nombre: 'Liga de Ciclismo de Bogotá', nit: '805010008-8', sector: 'Olímpico', deporte: 'Ciclismo', parentId: 'FED-016', estado: 'Suspendido', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000308', nombre: 'Natalia', apellido: 'Peña Rojas', correo: 'direccion@ligaciclismobogota.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Cra. 60 # 57-00 Unidad Deportiva El Salitre' }, contacto: { telefono: '6014080808', correo: 'contacto@ligaciclismobogota.demo.co' }, fechaRegistro: '2026-01-30' }
];

/* ─── 5) Clubes FICTICIOS (~10, estados variados). CLU-001 = cadena demo ─── */
const CLUBES = [
  { id: 'CLU-001', tipo: 'club', nombre: 'Club Patín Cali', nit: '805020001-1', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'profesional', parentId: 'LIG-001', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000401', nombre: 'Óscar', apellido: 'Cardona', correo: 'admin@clubpatincali.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Cra. 39 # 5-20 Barrio San Fernando' }, contacto: { telefono: '6025010101', correo: 'contacto@clubpatincali.demo.co' }, fechaRegistro: '2026-04-02' },
  { id: 'CLU-002', tipo: 'club', nombre: 'Club Ruedas del Sur', nit: '805020002-2', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'escuela', parentId: 'LIG-001', estado: 'Preinscrito', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000402', nombre: 'Carolina', apellido: 'Zapata Ríos', correo: 'admin@ruedasdelsur.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Palmira', zona: 'Urbana', direccion: 'Calle 30 # 28-15' }, contacto: { telefono: '6025020202', correo: 'contacto@ruedasdelsur.demo.co' }, fechaRegistro: '2026-06-10' },
  { id: 'CLU-003', tipo: 'club', nombre: 'Club Patín Vallecaucano', nit: '805020003-3', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'promotor', parentId: 'LIG-001', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000403', nombre: 'Felipe', apellido: 'Muñoz Cano', correo: 'admin@patinvallecaucano.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Cra. 8 # 20-40' }, contacto: { telefono: '6025030303', correo: 'contacto@patinvallecaucano.demo.co' }, fechaRegistro: '2026-04-15' },
  { id: 'CLU-004', tipo: 'club', nombre: 'Club Patinaje Antioquia Norte', nit: '805020004-4', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'promotor', parentId: 'LIG-002', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000404', nombre: 'Valentina', apellido: 'Ríos Duque', correo: 'admin@patinajeantnorte.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Bello', zona: 'Urbana', direccion: 'Calle 50 # 55-20' }, contacto: { telefono: '6045040404', correo: 'contacto@patinajeantnorte.demo.co' }, fechaRegistro: '2026-04-20' },
  { id: 'CLU-005', tipo: 'club', nombre: 'Club Velocidad Medellín', nit: '805020005-5', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'profesional', parentId: 'LIG-002', estado: 'En revisión', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000405', nombre: 'Santiago', apellido: 'Herrera Cano', correo: 'admin@velocidadmedellin.demo.co' }, ubicacion: { depto: 'Antioquia', ciudad: 'Medellín', zona: 'Urbana', direccion: 'Cra. 65 # 44-50' }, contacto: { telefono: '6045050505', correo: 'contacto@velocidadmedellin.demo.co' }, fechaRegistro: '2026-05-18' },
  { id: 'CLU-006', tipo: 'club', nombre: 'Club Fútbol Cali Junior', nit: '805020006-6', sector: 'Olímpico', deporte: 'Fútbol', tipoClub: 'escuela', parentId: 'LIG-004', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000406', nombre: 'Camila', apellido: 'Rojas Vélez', correo: 'admin@calijunior.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Calle 16 # 100-00' }, contacto: { telefono: '6025060606', correo: 'contacto@calijunior.demo.co' }, fechaRegistro: '2026-03-05' },
  { id: 'CLU-007', tipo: 'club', nombre: 'Club Deportivo Aguas del Valle', nit: '805020007-7', sector: 'Olímpico', deporte: 'Natación', tipoClub: 'profesional', parentId: 'LIG-006', estado: 'Activo', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000407', nombre: 'Isabella', apellido: 'Torres Peña', correo: 'admin@aguasdelvalle.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Cali', zona: 'Urbana', direccion: 'Calle 5 # 42-42' }, contacto: { telefono: '6025070707', correo: 'contacto@aguasdelvalle.demo.co' }, fechaRegistro: '2026-03-16' },
  { id: 'CLU-008', tipo: 'club', nombre: 'Club Natación Pacífico', nit: '805020008-8', sector: 'Olímpico', deporte: 'Natación', tipoClub: 'promotor', parentId: 'LIG-006', estado: 'Rechazado', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000408', nombre: 'Mateo', apellido: 'Angulo Mena', correo: 'admin@natacionpacifico.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Buenaventura', zona: 'Urbana', direccion: 'Cra. 3 # 5-30' }, contacto: { telefono: '6025080808', correo: 'contacto@natacionpacifico.demo.co' }, fechaRegistro: '2026-05-25' },
  { id: 'CLU-009', tipo: 'club', nombre: 'Club Patín Bogotá', nit: '805020009-9', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'promotor', parentId: 'LIG-003', estado: 'En revisión', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000409', nombre: 'Daniela', apellido: 'Suárez Gil', correo: 'admin@patinbogota.demo.co' }, ubicacion: { depto: 'Cundinamarca', ciudad: 'Bogotá', zona: 'Urbana', direccion: 'Cra. 60 # 63-20' }, contacto: { telefono: '6015090909', correo: 'contacto@patinbogota.demo.co' }, fechaRegistro: '2026-05-12' },
  { id: 'CLU-010', tipo: 'club', nombre: 'Club Rueda Libre Palmira', nit: '805020010-0', sector: 'Olímpico', deporte: 'Patinaje', tipoClub: 'escuela', parentId: 'LIG-001', estado: 'Suspendido', ficticio: true, repLegal: { tipoDoc: 'CC', numDoc: '10000410', nombre: 'Andrés', apellido: 'Caicedo Mora', correo: 'admin@ruedalibrepalmira.demo.co' }, ubicacion: { depto: 'Valle del Cauca', ciudad: 'Palmira', zona: 'Urbana', direccion: 'Calle 31 # 29-10' }, contacto: { telefono: '6025101010', correo: 'contacto@ruedalibrepalmira.demo.co' }, fechaRegistro: '2026-01-28' }
];

/* ─── 6) Deportistas FICTICIOS (~12, vinculados + autodeclarados) ─── */
const DEPORTISTAS = [
  { id: 'DEP-001', nombre: 'Valentina Ortiz', tipoDoc: 'CC', numDoc: '1144556778', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'valentina.ortiz@correo.demo.co', clubId: 'CLU-001', estado: 'vinculado' },
  { id: 'DEP-002', nombre: 'Mateo Restrepo', tipoDoc: 'CC', numDoc: '1144200145', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'mateo.restrepo@correo.demo.co', clubId: 'CLU-001', estado: 'vinculado' },
  { id: 'DEP-003', nombre: 'Laura Giraldo', tipoDoc: 'CC', numDoc: '1130987654', deporte: 'Patinaje', modalidad: 'Artístico', correo: 'laura.giraldo@correo.demo.co', clubId: 'CLU-003', estado: 'vinculado' },
  { id: 'DEP-004', nombre: 'Samuel Ruiz', tipoDoc: 'TI', numDoc: '1028445566', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'samuel.ruiz@correo.demo.co', clubId: 'CLU-004', estado: 'vinculado' },
  { id: 'DEP-005', nombre: 'Isabella Núñez', tipoDoc: 'CC', numDoc: '1144778899', deporte: 'Natación', modalidad: 'Estilo libre', correo: 'isabella.nunez@correo.demo.co', clubId: 'CLU-007', estado: 'vinculado' },
  { id: 'DEP-006', nombre: 'Tomás Vélez', tipoDoc: 'CC', numDoc: '1120334455', deporte: 'Fútbol', modalidad: 'Campo', correo: 'tomas.velez@correo.demo.co', clubId: 'CLU-006', estado: 'vinculado' },
  { id: 'DEP-007', nombre: 'Daniela Cárdenas', tipoDoc: 'CC', numDoc: '1144990011', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'daniela.cardenas@correo.demo.co', clubId: null, estado: 'autodeclarado' },
  { id: 'DEP-008', nombre: 'Andrés Lozano', tipoDoc: 'CC', numDoc: '1098223344', deporte: 'Ciclismo', modalidad: 'Ruta', correo: 'andres.lozano@correo.demo.co', clubId: null, estado: 'autodeclarado' },
  { id: 'DEP-009', nombre: 'Camila Suárez', tipoDoc: 'CC', numDoc: '1144556001', deporte: 'Natación', modalidad: 'Mariposa', correo: 'camila.suarez@correo.demo.co', clubId: null, estado: 'autodeclarado' },
  { id: 'DEP-010', nombre: 'Juan D. Marín', tipoDoc: 'CC', numDoc: '1088776655', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'juan.marin@correo.demo.co', clubId: null, estado: 'autodeclarado' },
  { id: 'DEP-011', nombre: 'Sara Betancur', tipoDoc: 'TI', numDoc: '1029887766', deporte: 'Fútbol', modalidad: 'Campo', correo: 'sara.betancur@correo.demo.co', clubId: null, estado: 'autodeclarado' },
  { id: 'DEP-012', nombre: 'Nicolás Ariza', tipoDoc: 'CC', numDoc: '1144667788', deporte: 'Patinaje', modalidad: 'Carreras', correo: 'nicolas.ariza@correo.demo.co', clubId: 'CLU-001', estado: 'vinculado' }
];

/* ─── Seed combinado (orden jerárquico: comités → federaciones → ligas → clubes) ─── */
const SEED_ORGANISMOS = [
  ...COMITES,
  ...FEDERACIONES_COC,
  ...FEDERACIONES_FICTICIAS,
  ...LIGAS,
  ...CLUBES
];
const SEED_DEPORTISTAS = DEPORTISTAS;

/* ═══════════════════════════════════════════════════════════════
   Persistencia sessionStorage — prefijo naowee-organismos-*
   Todo lo creado en la demo vive en session (drafts / overrides /
   nuevos organismos / solicitudes). El seed es inmutable.
   ═══════════════════════════════════════════════════════════════ */
const STORE_PREFIX = 'naowee-organismos-';
const SEED_FLAG = STORE_PREFIX + 'demo-seeded';
export const SEED_VERSION = '0.1.0';

export function readStore(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(STORE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) { return fallback; }
}
export function writeStore(key, value) {
  try { sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(value)); } catch (_) {}
}
export function clearStore(key) {
  try { sessionStorage.removeItem(STORE_PREFIX + key); } catch (_) {}
}

/* Siembra idempotente: si el flag no coincide con la versión, reinicia las
   colecciones de sesión (vacías) y marca la versión. El seed estático NO se
   copia a storage (se lee siempre desde el módulo). */
export function seedDemoData() {
  const seeded = (function () { try { return localStorage.getItem(SEED_FLAG); } catch (_) { return null; } })();
  if (seeded === SEED_VERSION) {
    return { seeded: false, version: SEED_VERSION };
  }
  if (readStore('organismos-nuevos') == null) writeStore('organismos-nuevos', []);
  if (readStore('organismos-overrides') == null) writeStore('organismos-overrides', {});
  if (readStore('deportistas-nuevos') == null) writeStore('deportistas-nuevos', []);
  if (readStore('deportistas-overrides') == null) writeStore('deportistas-overrides', {});
  if (readStore('solicitudes') == null) writeStore('solicitudes', []);
  if (readStore('cargues') == null) writeStore('cargues', []);
  if (readStore('audit') == null) writeStore('audit', []);
  try { localStorage.setItem(SEED_FLAG, SEED_VERSION); } catch (_) {}
  return { seeded: true, version: SEED_VERSION };
}

/* ═══════════════════════════════════════════════════════════════
   Capa de lectura — combinada e INMUTABLE (seed + nuevos + overrides).
   Siempre devuelve copias (spread); nunca expone el seed por referencia.
   ═══════════════════════════════════════════════════════════════ */
function applyOverride(org, overrides) {
  const ov = overrides[org.id];
  return ov ? { ...org, ...ov } : { ...org };
}

export function allOrganismos() {
  const nuevos = readStore('organismos-nuevos', []) || [];
  const overrides = readStore('organismos-overrides', {}) || {};
  const base = SEED_ORGANISMOS.map((o) => applyOverride(o, overrides));
  const extra = nuevos.map((o) => ({ ...o }));
  return [...base, ...extra];
}

export function getOrganismo(id) {
  return allOrganismos().find((o) => o.id === id) || null;
}

export function childrenOf(id) {
  return allOrganismos().filter((o) => o.parentId === id);
}

export function allDeportistas() {
  const nuevos = readStore('deportistas-nuevos', []) || [];
  const ov = readStore('deportistas-overrides', {}) || {};
  const base = SEED_DEPORTISTAS.map((d) => (ov[d.id] ? { ...d, ...ov[d.id] } : { ...d }));
  return [...base, ...nuevos.map((d) => ({ ...d }))];
}

/* Un deportista por id (seed + overrides + nuevos). Copia inmutable. */
export function getDeportista(id) {
  return allDeportistas().find((d) => d.id === id) || null;
}

/* Conteo del seed (para diagnóstico / QA de scaffolding). */
export function seedStats() {
  const byTipo = {}; const byEstado = {};
  SEED_ORGANISMOS.forEach((o) => {
    byTipo[o.tipo] = (byTipo[o.tipo] || 0) + 1;
    byEstado[o.estado] = (byEstado[o.estado] || 0) + 1;
  });
  return { organismos: SEED_ORGANISMOS.length, byTipo, byEstado, deportistas: SEED_DEPORTISTAS.length };
}

/* ═══════════════════════════════════════════════════════════════
   Helpers de jerarquía (T2) — lectura INMUTABLE (siempre copias).
   Construidos sobre allOrganismos()/allDeportistas() para respetar
   seed + nuevos + overrides.
   ═══════════════════════════════════════════════════════════════ */

/* Índice parentId → hijos, calculado una vez por llamada (los datos son
   pequeños; evita O(n²) al recorrer subárboles). */
function indexByParent(orgs) {
  const idx = {};
  orgs.forEach((o) => { (idx[o.parentId] = idx[o.parentId] || []).push(o); });
  return idx;
}

/* Todos los descendientes (organismos) de `id`, en profundidad. NO incluye
   el propio nodo. `id === null` devuelve el árbol completo (todos los
   organismos, útil para la raíz de Mindeporte a partir de los comités). */
export function subtreeOf(id) {
  const orgs = allOrganismos();
  const idx = indexByParent(orgs);
  const out = [];
  const stack = [...(idx[id] || [])];
  while (stack.length) {
    const node = stack.pop();
    out.push({ ...node });
    const kids = idx[node.id];
    if (kids) for (const k of kids) stack.push(k);
  }
  return out;
}

/* Cadena ascendente de `id` hasta la raíz: [padre, abuelo, …]. Vacío si no
   tiene padre o el id no existe. Copias inmutables. */
export function ancestorsOf(id) {
  const orgs = allOrganismos();
  const byId = {};
  orgs.forEach((o) => { byId[o.id] = o; });
  const chain = [];
  let cur = byId[id];
  const guard = new Set();
  while (cur && cur.parentId != null && byId[cur.parentId] && !guard.has(cur.parentId)) {
    guard.add(cur.parentId);
    cur = byId[cur.parentId];
    chain.push({ ...cur });
  }
  return chain;
}

/* Deportistas cuyo club pertenece al subárbol de `orgId` (o al propio
   `orgId` si es un club). Herencia liga/federación/comité (§2 handoff:
   el deportista queda vinculado a toda la cadena de su club). */
export function deportistasOf(orgId) {
  const clubIds = new Set();
  const self = getOrganismo(orgId);
  if (self && self.tipo === 'club') clubIds.add(self.id);
  subtreeOf(orgId).forEach((o) => { if (o.tipo === 'club') clubIds.add(o.id); });
  return allDeportistas()
    .filter((d) => d.clubId && clubIds.has(d.clubId))
    .map((d) => ({ ...d }));
}

/* Contadores heredados del subárbol de `orgId`:
   { federaciones, ligas, clubes, deportistas }. `orgId === null` → totales
   de todo el SND (para la raíz de Mindeporte). */
export function countDescendants(orgId) {
  const sub = subtreeOf(orgId);
  const c = { federaciones: 0, ligas: 0, clubes: 0, deportistas: 0 };
  sub.forEach((o) => {
    if (o.tipo === 'federacion') c.federaciones++;
    else if (o.tipo === 'liga') c.ligas++;
    else if (o.tipo === 'club') c.clubes++;
  });
  c.deportistas = deportistasOf(orgId).length;
  return c;
}

/* ═══════════════════════════════════════════════════════════════
   Escritura — alta de organismo (T3 · registro por tipo).
   Persiste en el store de sesión `organismos-nuevos`, de modo que
   allOrganismos() / childrenOf() / subtreeOf() ya lo incluyan y el
   organismo aparezca en la jerarquía (jerarquia.html) bajo su superior.
   NO muta el seed. Devuelve una COPIA del registro creado.
   ═══════════════════════════════════════════════════════════════ */
const ID_PREFIX = { comite: 'COM', federacion: 'FED', liga: 'LIG', club: 'CLU' };

/* Siguiente id legible por tipo. El sufijo `N###` distingue lo creado en la
   demo de los ids del seed (FED-001…), evitando colisiones. */
export function nextOrgId(tipo) {
  const prefix = ID_PREFIX[tipo] || 'ORG';
  const nuevos = readStore('organismos-nuevos', []) || [];
  const n = nuevos.filter((o) => o.tipo === tipo).length + 1;
  return `${prefix}-N${String(n).padStart(3, '0')}`;
}

/* Crea un organismo nuevo. `org` debe traer al menos { tipo, nombre, parentId }.
   Por defecto queda estado 'Preinscrito' (§3.2) y ficticio:true. */
export function addOrganismo(org) {
  const nuevos = readStore('organismos-nuevos', []) || [];
  const record = {
    estado: 'Preinscrito',
    ficticio: true,
    fechaRegistro: new Date().toISOString().slice(0, 10),
    ...org,
    id: org.id || nextOrgId(org.tipo)
  };
  nuevos.push(record);
  writeStore('organismos-nuevos', nuevos);
  return { ...record };
}

/* Organismos en estado Activo de un tipo, ordenados por nombre. Alimenta los
   dropdowns dependientes de la jerarquía del registro: la Liga elige su
   Federación (Activa) y el Club elige su Liga (Activa) — "pre-registro bajo
   su superior" (ORG-03/04). Copias inmutables. */
export function activosDeTipo(tipo) {
  return allOrganismos()
    .filter((o) => o.tipo === tipo && o.estado === 'Activo')
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((o) => ({ ...o }));
}

/* Comité (cabeza de sector) al que pertenece un sector dado — para derivar el
   parentId de una Federación a partir de su sector (Olímpico→COC, etc.). */
export function comitePorSector(sector) {
  return allOrganismos().find((o) => o.tipo === 'comite' && o.sector === sector) || null;
}

/* ═══════════════════════════════════════════════════════════════
   Cargue masivo (T4) — alta en lote + historial/auditoría.
   ═══════════════════════════════════════════════════════════════ */
/* Alta en lote: crea cada fila como Preinscrito (vía addOrganismo, que persiste
   en organismos-nuevos → ya aparece en la jerarquía bajo su superior). Cada
   addOrganismo lee/escribe el store en secuencia, así que los ids N### no
   colisionan. Devuelve el array de organismos creados (copias). */
export function addOrganismosBulk(rows) {
  return (rows || []).map((r) => addOrganismo(r));
}

/* Historial de cargues (auditoría de la pantalla de cargue masivo). Guarda
   { fecha, responsable, tipo, archivo{nombre,tamano}, totales{filas,cargadas,error}, version }.
   Devuelve el registro creado (con id CG-###). Más reciente primero. */
export function recordCargue(entry) {
  const list = readStore('cargues', []) || [];
  const record = { id: 'CG-' + String(list.length + 1).padStart(3, '0'), ...entry };
  list.unshift(record);
  writeStore('cargues', list);
  return { ...record };
}
export function allCargues() {
  return (readStore('cargues', []) || []).map((c) => ({ ...c }));
}

/* ═══════════════════════════════════════════════════════════════
   Bandeja de aprobaciones (T5) — actualización de estado + auditoría.
   No muta el seed: los organismos del seed se editan vía `organismos-overrides`,
   los creados en la demo directamente en `organismos-nuevos`.
   ═══════════════════════════════════════════════════════════════ */
export function updateOrganismo(id, patch) {
  const nuevos = readStore('organismos-nuevos', []) || [];
  const i = nuevos.findIndex((o) => o.id === id);
  if (i >= 0) {
    nuevos[i] = { ...nuevos[i], ...patch };
    writeStore('organismos-nuevos', nuevos);
  } else {
    const overrides = readStore('organismos-overrides', {}) || {};
    overrides[id] = { ...(overrides[id] || {}), ...patch };
    writeStore('organismos-overrides', overrides);
  }
  return getOrganismo(id);
}

/* Cambia el estado de un organismo y registra la transición en la auditoría.
   `meta`: { responsable, rol, accion, motivo, fecha, patch } (patch = campos extra). */
export function setEstado(id, estado, meta = {}) {
  const prev = getOrganismo(id);
  const updated = updateOrganismo(id, { estado, ...(meta.patch || {}) });
  auditLog({
    orgId: id, fecha: meta.fecha || new Date().toISOString().slice(0, 10),
    responsable: meta.responsable || '', rol: meta.rol || '',
    accion: meta.accion || 'Cambio de estado',
    de: prev ? prev.estado : '', a: estado, motivo: meta.motivo || ''
  });
  return updated;
}

/* Log de auditoría (acciones sobre organismos). Más reciente primero. */
export function auditLog(entry) {
  const list = readStore('audit', []) || [];
  const record = { id: 'AU-' + String(list.length + 1).padStart(4, '0'), ...entry };
  list.unshift(record);
  writeStore('audit', list);
  return { ...record };
}
export function allAudit(orgId) {
  const list = (readStore('audit', []) || []).map((a) => ({ ...a }));
  return orgId ? list.filter((a) => a.orgId === orgId) : list;
}

/* ═══════════════════════════════════════════════════════════════
   Afiliación del deportista (T7 · ORG-05) — solicitudes deportista→club.
   Store `naowee-organismos-solicitudes` (sessionStorage, prefijo del módulo,
   efímero). Estado del deportista (autodeclarado↔vinculado) vía overrides —
   NUNCA muta el seed. Al aprobar, el club hereda su cadena: se asigna clubId al
   deportista y su liga/federación/comité se derivan con ancestorsOf(clubId).
   Estados de solicitud (§3.3, estados.js ESTADOS_SOLICITUD): Enviada → Aprobada
   / Rechazada; Retirada la marca el propio deportista.
   ═══════════════════════════════════════════════════════════════ */
const _todayISO = () => new Date().toISOString().slice(0, 10);
const _norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Persiste un cambio en un deportista (seed vía overrides; nuevos in-place).
   No muta el seed base. Devuelve la copia resultante. */
export function updateDeportista(id, patch) {
  const nuevos = readStore('deportistas-nuevos', []) || [];
  const i = nuevos.findIndex((d) => d.id === id);
  if (i >= 0) {
    nuevos[i] = { ...nuevos[i], ...patch };
    writeStore('deportistas-nuevos', nuevos);
  } else {
    const ov = readStore('deportistas-overrides', {}) || {};
    ov[id] = { ...(ov[id] || {}), ...patch };
    writeStore('deportistas-overrides', ov);
  }
  return getDeportista(id);
}

/* Todas las solicitudes (más reciente primero). Copias inmutables. */
export function allSolicitudes() {
  return (readStore('solicitudes', []) || []).map((s) => ({ ...s }));
}
/* Solicitudes dirigidas a un club (todas las de la vida del club, cualquier estado). */
export function solicitudesDeClub(clubId) {
  return allSolicitudes().filter((s) => s.clubId === clubId);
}
/* La solicitud más reciente de un deportista (la lista se guarda con unshift). */
export function solicitudDeDeportista(deportistaId) {
  return allSolicitudes().find((s) => s.deportistaId === deportistaId) || null;
}

/* Crea una solicitud de afiliación (estado Enviada) y la audita.
   Devuelve la copia creada. NO cambia aún el estado del deportista (queda
   autodeclarado hasta que el club apruebe). */
export function crearSolicitud(deportistaId, clubId) {
  const list = readStore('solicitudes', []) || [];
  const dep = getDeportista(deportistaId);
  const rec = {
    id: 'AF-' + String(list.length + 1).padStart(3, '0'),
    deportistaId, clubId, estado: 'Enviada', fecha: _todayISO()
  };
  list.unshift(rec);
  writeStore('solicitudes', list);
  auditLog({
    orgId: clubId, deportistaId, deportistaNombre: dep ? dep.nombre : '',
    fecha: rec.fecha, responsable: dep ? dep.nombre : '', rol: 'DEPORTISTA',
    accion: 'Solicitud de afiliación enviada', de: '', a: 'Enviada', motivo: ''
  });
  return { ...rec };
}

/* Resuelve una solicitud (por el club). `resultado` ∈ {'aprobada','rechazada'}.
   Al APROBAR: el deportista queda 'vinculado' y se le asigna clubId → hereda
   automáticamente liga + federación + comité (ancestorsOf(clubId)) en toda la
   app (perfil, jerarquía). Al RECHAZAR: motivo obligatorio (lo valida la UI).
   Audita contra el club (orgId=clubId) referenciando al deportista. */
export function resolverAfiliacion(solicitudId, resultado, meta = {}) {
  const list = readStore('solicitudes', []) || [];
  const i = list.findIndex((s) => s.id === solicitudId);
  if (i < 0) return null;
  const s = list[i];
  const estadoSol = resultado === 'aprobada' ? 'Aprobada' : 'Rechazada';
  list[i] = { ...s, estado: estadoSol, motivo: meta.motivo || '', responsable: meta.responsable || '', resueltaFecha: _todayISO() };
  writeStore('solicitudes', list);
  const dep = getDeportista(s.deportistaId);
  if (resultado === 'aprobada') {
    updateDeportista(s.deportistaId, { clubId: s.clubId, estado: 'vinculado' });
  }
  auditLog({
    orgId: s.clubId, deportistaId: s.deportistaId, deportistaNombre: dep ? dep.nombre : '',
    fecha: _todayISO(), responsable: meta.responsable || '', rol: 'CLUB',
    accion: resultado === 'aprobada' ? 'Afiliación aprobada' : 'Afiliación rechazada',
    de: 'Enviada', a: estadoSol, motivo: meta.motivo || ''
  });
  return { ...list[i] };
}

/* Retira la afiliación del deportista: marca como Retirada su solicitud activa
   (Enviada o Aprobada) y lo devuelve a 'autodeclarado' (sin club, sin herencia).
   "Cambiar de club" = retiro + nueva solicitud (§11.3). Audita. */
export function retirarAfiliacion(deportistaId, meta = {}) {
  const dep = getDeportista(deportistaId);
  const eraVinculado = dep && dep.estado === 'vinculado';
  const clubPrev = dep ? dep.clubId : null;
  const list = readStore('solicitudes', []) || [];
  let changed = false;
  const upd = list.map((s) => {
    if (s.deportistaId === deportistaId && (s.estado === 'Enviada' || s.estado === 'Aprobada')) {
      changed = true;
      return { ...s, estado: 'Retirada', resueltaFecha: _todayISO() };
    }
    return s;
  });
  if (changed) writeStore('solicitudes', upd);
  updateDeportista(deportistaId, { clubId: null, estado: 'autodeclarado' });
  auditLog({
    orgId: clubPrev || '', deportistaId, deportistaNombre: dep ? dep.nombre : '',
    fecha: _todayISO(), responsable: dep ? dep.nombre : '', rol: 'DEPORTISTA',
    accion: 'Afiliación retirada', de: eraVinculado ? 'Vinculado' : 'Enviada', a: 'Retirada', motivo: ''
  });
  return getDeportista(deportistaId);
}

/* Buscador de clubes para la afiliación (§5.2): SOLO clubes en estado Activo,
   por nombre o NIT, acento-insensible, MÍNIMO 3 caracteres, sin texto libre.
   <3 chars → array vacío (la UI muestra la pista). Copias inmutables. */
export function buscarClubesActivos(query) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];
  const nq = _norm(q);
  return allOrganismos()
    .filter((o) => o.tipo === 'club' && o.estado === 'Activo')
    .filter((o) => _norm(o.nombre).includes(nq) || _norm(o.nit).includes(nq))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((o) => ({ ...o }));
}

/* Datos demo (solo modo 'demo', no 'blank'): siembra 1-2 solicitudes Enviada
   dirigidas al Club Patín Cali (CLU-001) desde deportistas autodeclarados, para
   que la bandeja del club arranque con algo que aprobar. Idempotente (flag
   demoSeed en la solicitud). Se llama desde afiliacion.js y bandeja.js (CLUB). */
export function seedAfiliacionesDemo(mode) {
  if (mode !== 'demo') return;
  const list = readStore('solicitudes', []) || [];
  if (list.some((s) => s.demoSeed)) return;
  const seeds = [
    { deportistaId: 'DEP-010', clubId: 'CLU-001', fecha: '2026-07-12' },  // Juan D. Marín · Patinaje
    { deportistaId: 'DEP-007', clubId: 'CLU-001', fecha: '2026-07-13' }   // Daniela Cárdenas · Patinaje
  ];
  seeds.forEach((s, idx) => {
    list.unshift({ id: 'AF-D' + (idx + 1), deportistaId: s.deportistaId, clubId: s.clubId, estado: 'Enviada', fecha: s.fecha, demoSeed: true });
  });
  writeStore('solicitudes', list);
}
