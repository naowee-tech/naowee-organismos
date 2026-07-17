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
            base transparente + hover fill orange-100, pipe full-width 3px accent, height 48).
   v0.5.5 — Bandeja (feedback Doug): (1) detalle muestra "Documentos de soporte"
            (reconocimiento deportivo IVC + aval + RUT + personería) — el peso legal que
            frena aprobar cualquier cosa; aviso si faltan; (2) Aprobar = verde (positive),
            Rechazar = rojo (semántico); (3) × del modal ya no se pone accent en hover
            (canónico, solo bg) — aplica a todos los modales; (4) tabs con aire lateral
            (no pegados al borde del container en hover). Auditado cross-página: searchbox
            de jerarquía ya era canónico; sin clases inventadas sueltas.
   v0.5.6 — Modales bandeja (feedback Doug): (1) NO se apilan — al abrir el motivo se
            cierra el detalle; cancelar/cerrar el motivo reabre el detalle; (2) animación
            enter/exit en todos los modales (helper openModal/closeModal usa el easing del
            .reg-modal); (3) el selector de motivo ahora es .naowee-dropdown CANÓNICO (no
            <select> nativo); (4) el comentario usa el .naowee-textfield__input-wrap del DS
            (no textarea suelto).
   v0.5.7 — fix(bandeja): el .naowee-message de "Documentos de soporte" mostraba "efi"
            (texto "undefined" recortado) en el círculo del ícono porque el objeto de íconos
            `I` no tenía la clave `alert` que la vista referenciaba. Añadido el glifo SVG
            canónico (triángulo de advertencia, stroke currentColor).
   v0.6.0 — T6 Perfil del organismo: organismo-detalle.html deja de ser stub → ficha 360°
            SOLO LECTURA. Botón Volver (referrer/?from → jerarquía) + breadcrumb ascendente
            (ancestorsOf; crumbs fuera de jurisdicción como texto estático) + header de ficha
            (emoji · nombre · badge de estado con estadoBadgeVariant · meta NIT/deporte/sector)
            + .naowee-tabs canónicas (--selected) con 5 paneles: Información (pares etiqueta/valor),
            Representante legal (anonimizado), Documentos (soportes IVC/aval/RUT/personería; sin
            adjuntos → .naowee-message--caution con ícono SVG correcto — no repite el bug v0.5.7),
            Jerarquía (childrenOf + contadores countDescendants con enlace a cada hijo; club →
            deportistasOf; empty-state si vacío), Historial (allAudit → timeline; empty-state si
            vacío). RBAC §11: fuera de subtreeOf(scopeFor) → "Sin acceso"; id inexistente →
            "Organismo no encontrado"; enlace "Gestionar en la Bandeja" si el organismo es
            accionable por el rol. Nuevos shared/ detalle.css (port .naowee-tabs de forms.css +
            .naowee-breadcrumb del DS + .od-* timeline/kv/doc) y detalle.js. Solo .naowee-*
            verificados por grep contra dist/design-system.css.
   v0.7.0 — T7 Afiliación del deportista (ORG-05, cierra el ciclo ascendente). LADO A:
            afiliacion.html deja de ser stub → home del DEPORTISTA (shared/afiliacion.js). Estado
            arriba (Autodeclarado informative / Solicitud pendiente caution / Vinculado positive) +
            datos precargados NO editables (§5.2) + buscador de clubes (searchbox del DS + tarjetas
            de resultado .af-result): SOLO clubes Activos, por nombre/NIT, mín. 3 caracteres, sin
            texto libre; sin coincidencias → .naowee-message--caution "Club no encontrado". Enviar →
            Enviada (toast). Vinculado muestra la cadena heredada (club·liga·federación·comité) +
            cambiar/retirar; pendiente → retirar; rechazada → motivo + reintentar. LADO B: bandeja
            del CLUB (bandeja.html?role=CLUB) reemplaza el empty-state por la bandeja de solicitudes
            de deportistas (searchbox + tabs por estado + .cg-table; detalle en .reg-modal con §5.2 +
            Aprobar/Rechazar; rechazo con MOTIVO obligatorio, patrón modales v0.5.6 sin apilar +
            motivo .naowee-dropdown; message con ícono SVG real, no repite v0.5.7). HERENCIA: al
            aprobar → deportista Vinculado, clubId asignado, hereda ancestorsOf(clubId) (liga+
            federación+comité) reflejado en afiliacion.html, perfil y jerarquía; audita cada acción.
            Nuevos helpers (organismos-data.js): store `solicitudes` + getDeportista/updateDeportista
            (overrides de deportista), crearSolicitud/solicitudesDeClub/solicitudDeDeportista/
            resolverAfiliacion/retirarAfiliacion/buscarClubesActivos/allSolicitudes + seedAfiliacionesDemo
            (2 solicitudes Enviada a CLU-001, solo modo demo). Layout local .af-* en forms.css. */
/* v0.7.1 — T7 Lado A elevado a PERFIL DEL DEPORTISTA (clon 1:1 del perfil de Eventos, feedback
            Doug). afiliacion.html deja de ser la tarjeta corta → perfil 360°: hero (avatar por tier +
            bandera + ribbon + badges de la cadena DERIVADA de la jerarquía) + grid 3 col
            [nav agrupado | panel con tabs | aside biometría/completitud]. Nuevo grupo "Afiliación"
            en el nav: "Mi club" (tarjeta del club + CADENA HEREDADA ORG-05 club→liga→federación→
            comité + cambiar/retirar) y "Solicitudes" (historial). Estado de afiliación reflejado en
            el hero (Vinculado/Solicitud enviada/Autodeclarado) + CTA "Asociar a club" (autodeclarado/
            rechazada) → modal registro corto §5.2 (precargados NO editables en resumen compacto +
            buscador de clubes Activos ≥3 chars acento-insensible + preview de herencia + alerta
            "club no encontrado"). Secciones Resumen (tabs Datos/Ubicación/Adicionales/Contacto),
            Documentos (file-uploader mock), Eventos e Historial (trayectoria/medallería/resultados,
            empty-states para autodeclarados), Config/Notif/Seguridad. Modal Editar datos (identidad+
            afiliación read-only con candado). Nuevos shared/: deportista-detalle.js
            (buildDeportistaDetalle: identidad + cadena derivada de ancestorsOf + biometría/tier/
            medallería demo) y perfil.css (prefijos pf- y af- + keyframes fadeInUp/fadeIn). Rol DEPORTISTA gana
            deportistaId (DEP-001, ?id= para vista puntual). Bloque .af-* movido de forms.css a
            perfil.css. Lado B (bandeja del club) y helpers de datos = v0.7.0 sin cambios. */
/* v0.7.2 — fix(afiliacion): el botón "Buscar un club" del empty state de "Mi club" no lanzaba
            el modal — había DOS botones con id="miclubAsociar" (el CTA del header y el del empty
            state) y getElementById solo ataba el primero. Migrados los CTA de asociación
            (Asociar a club / Buscar un club / Enviar nueva solicitud) a binding por atributo
            `[data-asociar]` con querySelectorAll → todos disparan openAsociarModal. */
/* v0.7.3 — T7 refinamientos (feedback Doug):
   (1) DEDUP: en "Mi club" autodeclarado se quitó el CTA duplicado del header (quedaba
       "Asociar a club" 2 veces); el CTA vive en el hero + "Buscar un club" en el empty state.
   (2) RETIRO CON ACEPTACIÓN DEL CLUB: "Retirar afiliación"/"Cambiar de club" ya NO son
       inmediatos → abren un MODAL DE ADVERTENCIA intermedio y crean una SOLICITUD DE BAJA
       (tipo 'retiro') que el CLUB debe CONFIRMAR en su bandeja. Mientras: estado "Baja en
       trámite" (sigue vinculado, con aviso + "Cancelar solicitud de baja"). El club ve la baja
       etiquetada en su bandeja (chip "Baja") y Confirma/Rechaza (rechazo con motivo). Al
       confirmar → autodeclarado (pierde herencia); al rechazar → sigue vinculado. Nuevos
       helpers organismos-data.js: crearSolicitudRetiro/retiroPendienteDe/cancelarRetiro +
       resolverAfiliacion tipo-aware. "Retirar solicitud" (afiliación aún Enviada) usa confirm.
   (3) REDISEÑO UI (skill ui-ux-pro-max + panel de diseño 3 direcciones + juez): "Club afiliado"
       con sello escudo+check SVG (adiós emoji), NIT tabular con divisor y badge "Vínculo
       confirmado"; "Cadena heredada" como escalera con numeral editorial 01·02·03 (CSS counter)
       + color-por-tipo (liga verde / federación naranja / comité azul). CSS en perfil.css;
       forward-port de .naowee-btn--danger (token negative-loud).
   v1.0.0 — T8 Release 1.0: RECORRIDO GUIADO por HU (shared/tour.js, patrón
            canónico naowee-guided-tour). Catálogo de las 8 HU (ORG-01..08)
            cross-rol agrupadas por fase del flujo, lanzador flotante + índice,
            spotlight glass con tokens del módulo + coach (tarea · propósito ·
            "Paso N de M"), pasos de acción que abren modal/pestaña, auto-arranque
            ?tour= y navegación cross-pantalla+rol; enganchado en las 6 páginas con
            shell. Trazabilidad demo del hilo conductor (seedTrazabilidadDemo:
            Fed. Patinaje → Liga del Valle → Club Patín Cali con su ciclo de
            estados real) para el Historial del perfil (ORG-07). QA por rol
            Funcional/UI/Responsive en verde + README del repo. Cache-busters
            ?v=1.0.0 sincronizados.
   v1.0.1 — T9 refinamientos post-publicación (feedback Doug): (1) hover de las
            tabs del perfil del organismo con aire (padding en .naowee-tabs +
            divisor full-width en #odPanel) para que no toque los bordes del card;
            (2) la card de tipo del wizard ya no se estira a todo el ancho con un
            solo tipo (max-width en .reg-tipo-card); (3) el "Acto administrativo"
            del Comité pasó de textfield a file-uploader canónico con BOTÓN
            (input-wrap + placeholder + action, port del DS), no el drop-zone
            punteado. Cache-busters ?v=1.0.1.
   v1.1.0 — Registro público de usuarios (HURU-01..04) + remediación de auditoría.
            NUEVO: registro-publico.html + shared/registro-publico.js — formulario
            público SIN autenticación con selector de tipo (Deportista propio/tutor ·
            Personal deportivo · Entidad) y wizard adaptativo: validación de documento
            no registrado, detección <18 → tutor, parentesco + firma de consentimiento,
            rol específico + certificaciones, docs de soporte de entidad → Preinscrito,
            checkbox de políticas, notificación email/SMS, nota de API Registraduría,
            responsive; enlazado en la landing (index) y en el tour (HURU-01/03/04).
            FIXES de la auditoría multi-agente: visor de documentos de la bandeja
            (HURU-09, antes roto onclick=return false); auditoría de la CREACIÓN de
            organismos (registro individual + cargue masivo → auditLog con responsable);
            anti-duplicado de NIT en el registro individual y de solicitud de afiliación;
            estado propio "En corrección" (≠ Rechazado, reingresa al flujo); notificaciones
            mock (🔔 email/app) visibles en los timelines (Historial, Solicitudes, bandeja);
            tablas → cards apiladas en móvil (data-label); entrega de credenciales del
            Comité en la pantalla de éxito. Cache-busters ?v=1.1.0. */
/* v1.2.0 — HURU-09 · Encolado del REGISTRO PÚBLICO en la bandeja de validación.
            El formulario público (registro-publico.html) deja de cerrar solo con éxito
            mock: al enviar, PERSISTE el registro (personal deportivo + entidad — los que
            requieren validación; el deportista sigue de alta autónoma) en el nuevo store
            `preinscritos` como 'En revisión'. El Admin Mindeporte (validador central del
            Registro Único) gana en la bandeja un switch de sub-vista 'Federaciones |
            Registro público · N' con la cola de usuarios/entidades autoinscritos:
            buscador + filtros (Accionables/Validados/En corrección/Rechazado/Todos),
            detalle en modal (datos + documentos de soporte + visor sin descarga, sin
            doble backdrop) y acciones Validar y activar (→ Activo) / Rechazar / Solicitar
            corrección (MOTIVO obligatorio) → notificación mock (🔔 email/app) + traza
            autocontenida por registro. Reusa 100% los componentes de la bandeja
            (.cg-table, .reg-modal, .bj-*, visor, motivo, timeline) y la máquina de
            estados (estados.js). La materialización del usuario/organismo en el roster/
            jerarquía queda para HURU-05/06 (creación automática). Nuevos helpers
            organismos-data.js: allPreinscritos/getPreinscrito/crearPreinscrito/
            resolverPreinscrito/seedPreinscritosDemo (+ store `preinscritos` en el seed);
            openDocViewer parametrizado (callback de retorno) para servir a organismo y
            preinscrito. **Refinamiento UI del form público** (feedback Doug): cards de
            tipo de usuario con ícono en CHIP tintado 44px (los SVG no traían width/height
            → salían enormes) + estado seleccionado (chip accent sólido, ícono blanco);
            fix del menú de los dropdowns que salía LEJOS del trigger (la celda del
            `.reg-grid-2` se estiraba a la altura de la fila cuando la celda vecina mostraba
            su helper de error → el menú `top:100%` caía al fondo; fix `align-items:start`);
            y conveniencia demo: al SEGUNDO «Siguiente» en un paso se omiten los campos
            obligatorios y se avanza (con aviso en el footer). Cache-busters ?v=1.2.0. */
/* v1.2.1 — Fixes UI post-v1.2.0 (feedback Doug): (1) paso «Listo» (pantalla de éxito):
            las filas del recibo salían con ICONOS enormes y clave/valor pegados
            ("TipoEntidad deportiva") porque faltaban las clases .reg-receipt__row/__ico/
            __k/__v en forms.css → agregadas (ícono acotado a 16px + fila flex con clave
            muted y valor a la derecha) + `.reg-receipt__ava svg` acotado. (2) Paso
            Documentos: el message azul, la etiqueta «Aceptación» y el checkbox quedaban
            FUERA del `.reg-form` (hijos sueltos de `.reg-pane` block, sin ritmo) y el
            `margin-bottom:-4px` de `.reg-section-label` SOLAPABA el checkbox → todo el
            cuerpo del pane se envuelve en un solo `.reg-form` (gap 18px uniforme).
            Cache-busters ?v=1.2.1. */
/* v1.2.2 — Pulido del recibo del paso «Listo» (feedback Doug): los iconos del
            recibo (fila ✓/!/✉ y el avatar del header) pasan de naranja (accent) a
            GRIS (--text-secondary; avatar sobre --bg-soft), y se quita la elevación
            (box-shadow) del container .reg-receipt — queda plano con solo su borde.
            Cache-busters ?v=1.2.2. */
/* v1.2.3 — Documentos DIFERENCIADOS por tipo de entidad en el registro público
            (feedback Doug: un club de base no tiene la carga legal de una federación).
            `docsDelTipo()` deja de pedir los mismos 3 docs a las 5 entidades y usa una
            matriz por `entTipo` con el vocabulario canónico de la bandeja:
            Federación = personería + estatutos + reconocimiento (IVC) + aval del Comité +
            RUT · Liga = personería + reconocimiento (IVC) + RUT · Club profesional =
            existencia + reconocimiento municipal + RUT · Club promotor / Escuela =
            existencia y representación legal. `PRE_DOC_LABELS` (bandeja) ampliado con los
            nuevos ids; seeds de entidad del registro público alineados a la matriz.
            Cache-busters ?v=1.2.3. */
/* v1.2.4 — Fixes de QA de requerimientos (auditoría multi-agente vs HU del xlsx):
            (1) MATRIZ DE DOCS corregida (ORG-04/HURU-04): TODO club y escuela ahora exige
                'reconocimiento del ente municipal' (antes club-promotor/escuela quedaban
                Preinscritos solo con existencia — contradecía el requerimiento).
            (2) BYPASS gateado: el atajo demo del 2º «Siguiente» ya NO omite reglas DURAS de
                negocio (documento ya registrado, edad, aceptación de políticas, firma de
                consentimiento) — solo salta campos vacíos; aviso rojo cuando hay regla dura.
            (3) 'En corrección' visible en la bandeja de organismos (estaba fuera de VISIBLES y
                de los filtros → un organismo en corrección desaparecía de todas las vistas).
            (4) AUTOREGISTRO de organismo (registro.js) crea en 'En revisión' (antes 'Preinscrito'
                sin transición → nunca era accionable en la bandeja; ORG-07).
            (5) DEDUP por NIT (HURU-05): el registro público de entidad rechaza un NIT ya
                registrado (en jerarquía o en la cola de preinscritos), como regla dura.
            Cache-busters ?v=1.2.4. */
/* v1.2.5 — Enrutamiento DESCENDENTE de la validación del registro público (QA fase 2,
            ORG-06/ORG-02): antes TODO preinscrito lo validaba Mindeporte; ahora cada uno
            lo valida el rol del nivel superior, dentro de su jurisdicción.
            · El FORM público de entidad captura el organismo SUPERIOR (dependiente del
              tipo: federación→sector+deporte · liga→su federación Activa · club/escuela→
              su liga Activa), del que se derivan deporte/sector/parentId. Re-render al
              cambiar el tipo.
            · La BANDEJA enruta: personal→Mindeporte (Registro Único) · club/escuela→su
              Liga · liga→su Federación · federación→Ministerio+Comité (doble validación).
              El switch «[nivel] | Registro público» aparece para Mindeporte/Comité/
              Federación/Liga; cada rol ve solo lo de su scope. Aprobar aplica ORG-06
              (superior Activo) y, para federación, la doble validación completa antes de
              Activo. Nuevos helpers: registro-publico (superior + orgTipo/parentId),
              organismos-data (updatePreinscrito + resolverPreinscrito con patch), seeds de
              preinscritos con jerarquía + seed de federación pública.
            · Al APROBAR una entidad pública se MATERIALIZA en la jerarquía (addOrganismo,
              Activo) bajo su superior → queda seleccionable como superior del siguiente
              nivel (cierra la cadena Comité→Federación→Liga→Club); Mindeporte (Registro
              Único) es fallback para huérfanos sin validador de nivel; superior/sector
              obligatorios (regla dura); el rechazo de federación marca su mitad.
            · UX del form público: dropdowns con menú `position:fixed` anclado por JS
              (escapan el overflow:hidden del card que los recortaba en desktop + z-index
              correcto), «Ciudad/Municipio» dependiente del Departamento (carga por
              selección), spacing de los section-labels corregido. El datepicker de fecha
              de nacimiento sigue siendo el nativo (`type=date`). Cache-busters ?v=1.2.5. */
/* v1.2.6 — Datepicker CANÓNICO del DS (feedback Doug): la fecha de nacimiento del
            registro público deja de usar el `<input type=date>` nativo y usa el
            componente `.naowee-datepicker` portado del Design System (tokens locales):
            campo con ícono + popover fijo anclado al campo (escapa el overflow del card)
            con navegación en 3 vistas — días → meses → años — para elegir fechas de
            nacimiento rápido; deshabilita fechas futuras; valor en 'YYYY-MM-DD'
            (compatible con edadDe/validación de edad). Cache-busters ?v=1.2.6. */
/* v1.2.7 — Reorden del flujo por TUTOR (HURU-02, QA fase 3): el registro de un
            menor deja de fundir "datos del tutor" y "datos del menor" en un solo
            paso. Ahora sigue la secuencia EXIGIDA en 3 pasos separados —
            (1) Padre/tutor → (2) Parentesco (documento + firma de consentimiento)
            → (3) Menor — con stepper dinámico (Tipo · Padre/tutor · Parentesco ·
            Menor · Listo). La documentación de parentesco queda ENTRE el tutor y
            el menor (antes iba al final). Reglas duras intactas: firma de
            consentimiento, edad <18 y aceptación de políticas no se omiten.
            El flujo estándar (deportista propio · personal · entidad) queda igual
            (Tipo · Datos · Documentos · Listo). Cache-busters ?v=1.2.7. */
/* v1.2.8 — Carné digital + QR verificable + certificado + medallería tallero
            (HURU-10, QA fase 3). El perfil del deportista gana la sección
            "Carné digital": credencial del Registro Único con datos básicos,
            cadena heredada, contacto de emergencia y CÓDIGO QR REAL escaneable
            (codificador propio sin dependencias, port fiel de Nayuki MIT en
            shared/qr.js) que porta esos datos + enlace de verificación. Dos
            descargas cliente-side: carné (SVG vectorial) y certificado de
            registro (HTML imprimible con QR). La pestaña Medallería suma un
            TALLERO por tipo (Oro/Plata/Bronce + total) y un desglose por
            deporte, sobre el listado de detalle. Cache-busters ?v=1.2.8. */
/* v1.2.9 — Fix del recorrido guiado (feedback Doug): lanzar un tour estando ya
            en su misma página con el wizard AVANZADO (p.ej. HURU-01 en
            registro-publico.html en el paso 2) corría el tour "en sitio" y el
            target del paso 0 no existía → el coach salía flotando SIN overlay y
            en el paso equivocado. Ahora `start()` SIEMPRE recarga a la URL limpia
            del tour (patrón full-reload): la página/wizard se resetea a su estado
            inicial y el ?tour= re-arranca el recorrido con su target presente.
            Fallback defensivo: si un paso no encuentra target, se muestra un
            backdrop atenuado para que el coach siempre lea como modal, nunca como
            caja flotante suelta. Cache-busters ?v=1.2.9. */
/* v1.2.10 — Refinamiento visual del recibo del paso "Listo" (feedback Doug: los
             iconos no tenían fuerza, sobre todo el de tipo de entidad). El avatar
             de identidad deja de ser un círculo gris débil y pasa a un CHIP con
             gradiente por tipo + ícono blanco + sombra tintada (foco visual):
             Entidad = azul institucional, Deportista = naranja marca, Personal =
             azul. Los iconos de fila pasan de líneas grises sueltas a CHIPS
             tintados semánticos: Tipo = azul info, Estado = ámbar (Preinscrito) /
             verde (Activo), Notificación = verde (enviada). Cache-busters ?v=1.2.10. */
/* v1.2.11 — Fix del datepicker + "Volver al inicio" canónico (feedback Doug).
             (1) El datepicker se CERRABA al navegar mes/año o al abrir la vista
             "mes/año": el handler de nav reconstruye el innerHTML del popover
             (draw()) y el botón clicado quedaba detached → al burbujear el 'click'
             a document, `pop.contains(e.target)` daba false y cerraba. El cierre
             por clic-fuera pasa a escuchar 'pointerdown' (el target sigue adjunto
             antes del re-render). (2) "Volver al inicio" deja de ser un link pill
             custom arriba-derecha y pasa al botón canónico `.naowee-btn--mute
             --small` (patrón backBtnHtml del módulo) arriba-IZQUIERDA (ubicación
             convencional de "volver"). Cache-busters ?v=1.2.11. */
/* v1.2.12 — Mejor distribución de las tarjetas de selección (`.reg-choice-group`,
             feedback Doug sobre "Tipo de entidad"): el grid `auto-fit minmax(150px)`
             dejaba el último renglón incompleto con un hueco a la derecha (5 tipos
             → 3+2 con gap). Ahora flexbox con `flex: 1 1 30%` + `justify-content:
             center` + `max-width: 380px`: fuerza ~3 por fila (indep. del ancho del
             contenedor, que está topado ~560px) y ambos renglones LLENAN su ancho
             (3+2 sin hueco); las filas incompletas se centran en vez de estirar una
             tarjeta sola. Aplica también a modo (2→llena) y vínculo (3→llena); en
             móvil (≤560px) se apilan full-width. Cache-busters ?v=1.2.12. */
const MODULE_VERSION = 'v1.2.12';

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
