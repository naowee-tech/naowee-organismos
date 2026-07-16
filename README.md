# Naowee · Registro de Organismos — Jerarquía SUID

Demo del módulo que establece en el **SUID** (Sistema Único de Información del Deporte)
las reglas y jerarquías del **Sistema Nacional del Deporte (SND)**: registra los
organismos deportivos, los encadena jerárquicamente y valida su habilitación en
cascada por el nivel inmediatamente superior.

> HTML + CSS + JS **vanilla** (sin build tools), Google Fonts Inter y el Design
> System Naowee portado localmente. Todo el estado de la demo vive en
> `sessionStorage` (efímero) — se reinicia desde el switcher de perfil.

**Versión:** v1.0.0 · **Puerto local:** 4320

---

## La jerarquía (el corazón del módulo)

```
Ministerio del Deporte (rectoría — admin central)
└── Comités / cabezas de sector        (Olímpico · Paralímpico · Sordolímpico)
    └── Federaciones                    (adscritas a su comité/sector)
        └── Ligas                       (departamentales/distritales, por deporte)
            └── Clubes                   (promotor / profesional / escuela)
                └── Deportistas          (afiliación a club OPCIONAL)
```

- **Ascendente = afiliaciones:** deportista → club → liga → federación → comité.
- **Descendente = aprobaciones:** cada nivel aprueba al inferior. *Nadie aprueba si
  él mismo no está **Activo**.*
- **Herencia:** al aprobarse la afiliación de un deportista a un club, hereda
  **automáticamente** la liga y la federación del club.

## Roles de la demo (profile switcher)

| Rol | Home | Rol en la jerarquía |
|---|---|---|
| **Admin Mindeporte** | Jerarquía SND | Rectoría · registra comités, ve todo, aprueba federaciones |
| **Comité (COC)** | Jerarquía SND | Cabeza de sector · pre-registra y avala federaciones |
| **Federación** | Jerarquía SND | Aprueba sus ligas · cargue masivo de ligas |
| **Liga** | Jerarquía SND | Aprueba sus clubes · cargue masivo de clubes |
| **Club** | Solicitudes de deportistas | Confirma la afiliación de sus deportistas |
| **Deportista** | Mi afiliación | Gestiona su afiliación a un club |

Cambio de rol = recarga completa vía `?role=CODE` (no SPA — decisión Naowee).

## Pantallas e historias de usuario (ORG-01 … ORG-08)

| Pantalla | HU | Descripción |
|---|---|---|
| `jerarquia.html` | ORG-06/07/08 | Árbol SND con jurisdicción por rol (RBAC), contadores heredados, búsqueda acento-insensible y filtro por estado |
| `registro.html` | ORG-01/02/03/04 | Wizard por tipo de organismo (comité/federación/liga/club) con máscaras, dropdowns dependientes, borradores parciales |
| `cargue.html` | ORG-02/03/04 | Cargue masivo por plantilla `.xlsx` (SheetJS): validación por fila, carga parcial e historial |
| `bandeja.html` | ORG-06/08 | Bandeja de aprobaciones por rol: aprobar/rechazar/corrección (motivo obligatorio); federaciones con doble validación; el club confirma afiliaciones |
| `organismo-detalle.html` | ORG-07 | Perfil 360° del organismo con tabs (Información · Rep. legal · Documentos · Jerarquía · **Historial/trazabilidad**) |
| `afiliacion.html` | ORG-05 | Perfil del deportista + flujo *Asociar a club* (buscar club Activo → enviar solicitud → herencia) |
| `registro-publico.html` | HURU-01..04 | **Registro público de usuarios** (sin login): selector de tipo (deportista propio/tutor · personal deportivo · entidad) + wizard adaptativo con validación de documento no registrado, detección <18 → tutor, parentesco + firma, rol + certificaciones, docs de soporte → Preinscrito, políticas y notificación email/SMS |

## Recorrido guiado por HU 🧭

Cada pantalla monta un **lanzador flotante “Recorrido por HU”** (patrón
`naowee-guided-tour`, `shared/tour.js`). Al elegir una HU, navega a su pantalla y
rol, resalta con *spotlight* dónde hacer clic y muestra tarea + propósito + “Paso
N de M”. Sirve para **verificar en vivo** el cumplimiento de cada HU con el negocio.
También se auto-arranca con `?tour=ORG-NN`.

## Cómo correr

```bash
cd naowee-organismos
python3 -m http.server 4320
# abrir http://localhost:4320/index.html
```

`index.html` es el selector de perfil (landing sin shell). Desde ahí se entra a
cada rol; el switcher inferior permite cambiar de perfil, alternar **modo demo**
(Guiado·vacío / Libre·con datos), reiniciar el tour y reiniciar la demo.

## Datos demo

Semilla estática: **3 comités** + **57 federaciones reales del COC** (+ ficticias
de Paralímpico/Sordolímpico) y la **cadena hilo conductor**: Fed. Colombiana de
Patinaje → Liga del Valle → Club Patín Cali → Valentina Ortiz. Deportista
autodeclarada de ejemplo: Camila Suárez (`afiliacion.html?id=DEP-009`).

## Estructura

```
*.html                     páginas (shell + montaje por rol)
shared/
  tokens.css shell.css components.css   base (puente al DS + shell canónico)
  forms.css detalle.css perfil.css jerarquia.css   estilos por dominio
  sidebar.js                shell: roles, menú por rol, header, demo switcher
  organismos-data.js        capa de datos (seed + sessionStorage, inmutable)
  permissions.js estados.js  RBAC (§11) + máquina de estados + badges
  registro.js cargue.js bandeja.js detalle.js afiliacion.js   lógica por pantalla
  deportista-detalle.js     perfil 360° del deportista
  registro-publico.js       formulario público de registro de usuarios (HURU-01..04)
  tour.js                   recorrido guiado por HU
  naowee-footer.{css,js}    pill de versión + demo switcher (MODULE_VERSION)
  logos/                    branding dual (Ministerio + SUID + Naowee)
```

## Stack y convenciones

- **Design System Naowee** (componentes `.naowee-*`); overrides sólo con el *override
  pattern* (CSS después del DS). Sin clases paralelas, sin hex sueltos.
- **Mobile-first**: sidebar drawer, tablas → cards, popovers = bottom-sheet.
- **Versionado**: `MODULE_VERSION` en `shared/naowee-footer.js` + cache-busters
  `?v=X.Y.Z` sincronizados en todas las páginas.

---

*Naowee · Ministerio del Deporte de Colombia — demo interna. Los nombres, NIT y sector
de las 57 federaciones del COC son información pública real; los datos de personas
(representantes legales, deportistas) y de contacto (correos y teléfonos) son ficticios
—dominio `.demo.co`— para fines de demostración.*
