/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Footer flotante canónico (mount + scroll-hide)
   Port 1:1 de Eventos/demo/shared/naowee-footer.js.
   Formato canónico (paridad naowee-ivc / Project v2.0.3):
     [logo naowee] | Todos los derechos reservados © 2026 | Organismos v0.1.0
   La versión va en ROJO/accent. Scroll-hide: el host de scroll real es
   .page (creado por el shell) y el evento scroll NO bubblea — por eso
   escuchamos en capture sobre document. Patrón DESIGN-PATTERNS §3.8.
   ═══════════════════════════════════════════════════════════════ */

const MODULE_NAME = 'Organismos';
/* Versión del módulo mostrada en la pill del footer. Es una CONSTANTE: hay que
   subirla aquí en cada release (no se deriva sola). Sincronizar con los
   cache-busters ?v=X.Y.Z de todas las páginas.
   ── Changelog ──
   v0.1.0 — scaffolding: shell (sidebar + header + footer pill), 6 roles de la
            jerarquía SND + demo switcher agrupado, seed de datos (3 comités +
            57 federaciones COC reales + ficticias Paralímpico/Sordolímpico +
            ligas/clubes/deportistas de la cadena demo) y 6 páginas stub con
            empty state canónico.
   v0.2.0 — T2 Explorador de jerarquía: árbol SND interactivo con jurisdicción
            por rol (RBAC), contadores heredados, búsqueda acento-insensible y
            filtro por estado. Nuevos módulos shared/ permissions.js (matriz
            §11.2 + scopeFor) y estados.js (ESTADOS + mapa de badge). Helpers de
            datos subtreeOf/countDescendants/deportistasOf/ancestorsOf. Ports DS
            searchbox/dropdown/message/card. Fixes T1: btn--ghost→--mute,
            ellipsis en labels del sidebar, copy de bandeja unificado por rol.
   v0.3.0 — T3 Registro de organismo (wizard por tipo): registro.html deja de
            ser stub. Wizard-recipe v1.8 (.naowee-stepper --distributed --pulse
            + shake) con pasos DINÁMICOS por tipo (STEPS_POR_ORGANISMO estilo
            IVC): Federación/Liga/Club (autoregistro ORG-02/03/04) + Comité
            reducido para MINDEPORTE (ORG-01). Máscaras NIT/tel, dropdowns
            dependientes de la jerarquía (Liga→federación Activa, Club→liga
            Activa) con buscador acento-insensible, modal de dirección
            estructurada, adjuntos simulados (PDF/JPG/PNG), checkbox de políticas,
            validación por paso con shake y borradores parciales (ESC-08). Al
            enviar crea un organismo 'Preinscrito' vía addOrganismo() que ya
            aparece en la jerarquía; pantalla de éxito con confetti + recibo +
            CTA "Ver en la jerarquía". Nuevos shared/ forms.css + registro.js;
            data: helpers addOrganismo/nextOrgId/activosDeTipo/comitePorSector.
   v0.3.1 — Fix (review T3 de Fable): (1) dropdowns del wizard rotos en móvil
            ≤760px — el bottom-sheet position:fixed quedaba atrapado por el
            transform residual de .reg-pane (animation regPaneIn con fill-mode:both);
            regPaneIn pasa a opacity-only. (2) El Comité (ORG-01) se crea 'Activo'
            (nodo raíz sin aprobación superior) en vez de 'Preinscrito';
            renderSuccess() deja de hardcodear "Preinscrito" y usa org.estado.
   v0.3.2 — Barrido de fidelidad al DS canónico (pre-T4): Message re-portado 1:1
            (ícono = círculo de color con glifo blanco, backgrounds con tokens
            --naowee-color-feedback-fill-*-quiet/loud canónicos, tipografía 16/14,
            radius 20) + tokens de feedback añadidos a tokens.css; dropdown trigger
            text-align:left (el <button> heredaba center → valor centrado); containers
            SIN box-shadow inventado (.naowee-card/.stub-card/.reg-wizard flat, como el
            .naowee-card base del DS); estilos inline inventados removidos de mensajes;
            badges re-portados a tokens canónicos (feedback-fill-* + feedback-text-*-
            quiet-on-fill) — informative loud #1f78d1→#006aff, caution #d98a00→#d74009,
            negative #c0392b→#da1630, y quiet con tints canónicos.
   v0.4.0 — T4 Cargue masivo (cargue.html deja de ser stub): pre-registro por
            plantilla .xlsx (22 columnas §5.1) vía SheetJS, dropzone, validación
            por fila con Nº de fila + motivos, carga parcial (válidas → Preinscrito
            bajo el superior del rol; inválidas se reportan), historial + auditoría
            (recordCargue/allCargues), oversight solo-lectura para Mindeporte.
            Target por rol: Comité→federaciones · Federación→ligas · Liga→clubes.
            Nuevos: shared/cargue.js + helpers addOrganismosBulk.
   v0.4.1 — T4 refinamiento: el historial de cargues vacío usa el componente
            canónico .naowee-empty-state (antes texto plano); en modo demo se
            siembra un historial real (un cargue por rol, el del Comité = 57
            federaciones COC), filtrado por rol y oculto en modo blank.
   v0.4.2 — T4 pulido tabla: header de cargues como barra gris redondeada SIN
            divisor pegado (border-collapse:separate + radius en thead; filas con
            border-bottom, patrón table-card canónico); se quita el (ROL) redundante
            del responsable en la vista propia (se muestra como sufijo solo en el
            oversight global de Mindeporte).
   v0.5.0 — T5 Bandeja de aprobaciones (bandeja.html deja de ser stub): máquina de
            estados por rol (Comité/Mindeporte→federaciones con DOBLE validación,
            Federación→ligas, Liga→clubes). Aprobar / rechazar / solicitar corrección
            con MOTIVO obligatorio; regla dura "el superior debe estar Activo" (ORG-06);
            trazabilidad (timeline de auditoría) por organismo; oversight solo-lectura;
            Club → empty-state (afiliaciones = T7). Nuevos: shared/bandeja.js + helpers
            updateOrganismo/setEstado/auditLog (data) + puedeTransicionar/resolverFederacion
            (estados). Componentes canónicos (.cg-table, .reg-modal, badges quiet).
   v0.5.1 — Fix: el responsable de la auditoría (bandeja) y del cargue usa
            role.userName (nombre real) en vez de role.name (inexistente → caía al code).
   v0.5.2 — T5 refinamiento UI (feedback Doug): searchbox canónico (faltaba
            .naowee-searchbox__input-wrap); filtros = .naowee-tabs canónico (port,
            indicador subrayado) en panel unificado (search + tabs + tabla en una
            card); modal: resumen en grid limpio sobre panel suave (sin divisores por
            fila, NIT tabular) y footer con jerarquía (corrección izquierda, Rechazar +
            Aprobar agrupadas a la derecha, sin "Cerrar" redundante — la × cierra).
   v0.5.3 — Fix UI: el header gris de la tabla dentro del panel unificado (bandeja) y
            del preview de cargue estaba pegado al divisor de arriba; se le da padding
            al área de tabla para que el header table-card respire.
   v0.5.4 — Fix DS: los tabs usaban una clase inventada (.naowee-tab--active) y estilos
            aproximados; re-portados FIEL al DS §Tabs (clase canónica .naowee-tab--selected,
            base transparente + hover fill orange-100, pipe full-width 3px accent, height 48). */
const MODULE_VERSION = 'v0.5.4';

(function () {
  function mount() {
    if (document.querySelector('.naowee-footer')) return;
    const year = new Date().getFullYear();
    const el = document.createElement('div');
    el.className = 'naowee-footer';
    el.setAttribute('role', 'contentinfo');
    el.setAttribute('aria-label', 'Pie de página Naowee');
    el.innerHTML = `
      <img src="shared/logos/naowee.svg" alt="Naowee" class="naowee-footer__logo" onerror="this.style.display='none'"/>
      <div class="naowee-footer__sep"></div>
      <span class="naowee-footer__text">Todos los derechos reservados <strong>&copy; ${year}</strong></span>
      <div class="naowee-footer__sep"></div>
      <span class="naowee-footer__version" aria-label="Versión del módulo: ${MODULE_NAME} ${MODULE_VERSION}">
        ${MODULE_NAME} <strong>${MODULE_VERSION}</strong>
      </span>`;
    document.body.appendChild(el);
    setupScrollHide(el);
  }

  function setupScrollHide(footer) {
    let lastY = null;
    /* Capture phase sobre document: el scroll de .page no bubblea. */
    document.addEventListener('scroll', (e) => {
      const target = e.target;
      const y = (target && typeof target.scrollTop === 'number')
        ? target.scrollTop
        : (window.scrollY || window.pageYOffset || 0);
      if (lastY === null) { lastY = y; return; }
      const dy = y - lastY;
      if (Math.abs(dy) < 60 && y > 0) { return; } // threshold 60px (scroll down>60 oculta)
      if (dy > 0 && y > 60) footer.classList.add('is-hidden');
      else footer.classList.remove('is-hidden');
      lastY = y;
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* ═══════════════════════════════════════════════════════════════
   Snackbar canónico (DS .naowee-snackbar): pill navy con BADGE de icono
   semántico — verde=éxito, rojo=error, azul=info, ámbar=aviso. Global
   reusado por todas las pantallas. Estilos en naowee-footer.css (#evToast).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.5" r="1.15" fill="currentColor" stroke="none"/></svg>',
    caution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="1.15" fill="currentColor" stroke="none"/></svg>'
  };
  var timer = null;
  window.naoweeToast = function (msg, type) {
    type = ICONS[type] ? type : 'success';
    var el = document.getElementById('evToast');
    if (!el) { el = document.createElement('div'); el.id = 'evToast'; document.body.appendChild(el); }
    el.className = 'evtoast evtoast--' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    var text = (msg == null ? '' : String(msg)).replace(/^\s*[✓✔]\s*/, '');
    el.innerHTML = '<span class="evtoast__badge">' + ICONS[type] + '</span><span class="evtoast__text"></span>';
    el.querySelector('.evtoast__text').textContent = text;
    void el.offsetWidth;                 /* reinicia la animación si ya estaba visible */
    el.classList.add('is-visible');
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  };
})();
