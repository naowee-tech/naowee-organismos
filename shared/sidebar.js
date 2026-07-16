/* ═══════════════════════════════════════════════════════════════
   NAOWEE ORGANISMOS — Shell: sidebar + header (profile-switcher)
   Port de Eventos/demo/shared/sidebar.js, adaptado al módulo Registro
   de Organismos — Jerarquía SUID:
     - 6 roles de la jerarquía SND (Mindeporte · Comité · Federación ·
       Liga · Club · Deportista).
     - Menú por rol. Ítems sin sub-niveles (scaffolding T1).
     - Colapsar sidebar + persistencia localStorage.
     - Drawer off-canvas en mobile (<1024px).
     - Navegación full-page-reload entre roles (NO SPA — decisión Naowee).
     - Cambio de perfil = homeForRole(next) + '?role=' + next.
   ═══════════════════════════════════════════════════════════════ */

const COLLAPSED_KEY = 'naowee-organismos-sidebar-collapsed';

/* ─── Iconos inline (stroke currentColor, paridad shell canónico) ─── */
const ICONS = {
  sitemap:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v4M5 17v-2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2M12 11v3"/></svg>',
  inbox:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  upload:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  filePlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  link:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  chevron:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  refresh:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  id:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-1.5 1.5-2.2 3-2.2s3 .7 3 2.2"/><line x1="15" y1="10" x2="18" y2="10"/><line x1="15" y1="13" x2="18" y2="13"/></svg>'
};
export function getIcon(name) { return ICONS[name] || ''; }

/* ─── Roles del módulo (6 niveles de la jerarquía SND) ───
   Los datos personales (doc/correo) son ficticios (demo público).
   Cadena demo (hilo conductor): Fed. Patinaje → Liga Patinaje del Valle →
   Club Patín Cali → Valentina Ortiz. */
export const ROLES = {
  MINDEPORTE: {
    code: 'MINDEPORTE', label: 'Admin Mindeporte',
    userName: 'María F. Rojas', userEmail: 'maria.rojas@mindeporte.demo.co',
    userDoc: 'CC 41.234.567', org: 'Ministerio del Deporte', avatar: 'MR',
    color: '#002B5B', short: 'Rectoría del SND · registra comités, ve toda la jerarquía y aprueba federaciones',
    group: 'Rectoría'
  },
  COMITE: {
    code: 'COMITE', label: 'Comité (COC)',
    userName: 'Camilo Duarte', userEmail: 'cduarte@coc.demo.co',
    userDoc: 'CC 79.456.123', org: 'Comité Olímpico Colombiano', avatar: 'CD',
    color: '#d74009', short: 'Cabeza de sector · pre-registra y avala las federaciones de su sector',
    group: 'Cabezas de sector'
  },
  FEDERACION: {
    code: 'FEDERACION', label: 'Federación',
    userName: 'Alberto Herrera', userEmail: 'presidencia@fedepatinaje.demo.co',
    userDoc: 'CC 16.789.234', org: 'Fed. Colombiana de Patinaje', avatar: 'AH',
    color: '#1f78d1', short: 'Aprueba sus ligas · cargue masivo de ligas de su deporte',
    group: 'Organismos'
  },
  LIGA: {
    code: 'LIGA', label: 'Liga',
    userName: 'Sandra Mejía', userEmail: 'direccion@ligapatinajevalle.demo.co',
    userDoc: 'CC 31.567.890', org: 'Liga de Patinaje del Valle', avatar: 'SM',
    color: '#7c3aed', short: 'Aprueba sus clubes · cargue masivo de clubes de su liga',
    group: 'Organismos'
  },
  CLUB: {
    code: 'CLUB', label: 'Club',
    userName: 'Óscar Cardona', userEmail: 'admin@clubpatincali.demo.co',
    userDoc: 'CC 94.321.678', org: 'Club Patín Cali', avatar: 'OC',
    color: '#1f8923', short: 'Confirma la afiliación de sus deportistas',
    group: 'Organismos'
  },
  DEPORTISTA: {
    code: 'DEPORTISTA', label: 'Deportista',
    userName: 'Valentina Ortiz', userEmail: 'valentina.ortiz@correo.demo.co',
    userDoc: 'CC 1.144.556.778', org: '—', avatar: 'VO',
    color: '#0e7490', short: 'Gestiona su afiliación a un club deportivo',
    group: 'Personas', deportistaId: 'DEP-001'
  }
};

/* ─── Menú por rol (label + icono + ruta; sin sub-niveles en T1) ───
   La bandeja (bandeja.html) cambia de etiqueta por rol (Bandeja de
   aprobaciones / Mis federaciones / Mis ligas / Mis clubes / Solicitudes
   de deportistas) pero comparte página. */
const MENU_BY_ROLE = {
  MINDEPORTE: [
    { section: null,        items: [{ id: 'jerarquia', label: 'Jerarquía SND',           icon: 'sitemap',  route: 'jerarquia.html' }] },
    { section: 'GESTIÓN',   items: [
        { id: 'bandeja',   label: 'Bandeja de aprobaciones', icon: 'inbox',    route: 'bandeja.html' },
        { id: 'registro',  label: 'Registro de organismo',   icon: 'filePlus', route: 'registro.html' }
    ] }
  ],
  COMITE: [
    { section: null,        items: [{ id: 'jerarquia', label: 'Jerarquía SND',           icon: 'sitemap',  route: 'jerarquia.html' }] },
    { section: 'MI SECTOR', items: [
        { id: 'bandeja',   label: 'Mis federaciones',        icon: 'inbox',    route: 'bandeja.html' },
        { id: 'cargue',    label: 'Cargue masivo',           icon: 'upload',   route: 'cargue.html' }
    ] }
  ],
  FEDERACION: [
    { section: null,        items: [{ id: 'jerarquia', label: 'Jerarquía SND',           icon: 'sitemap',  route: 'jerarquia.html' }] },
    { section: 'MIS LIGAS', items: [
        { id: 'bandeja',   label: 'Mis ligas',               icon: 'inbox',    route: 'bandeja.html' },
        { id: 'cargue',    label: 'Cargue masivo',           icon: 'upload',   route: 'cargue.html' }
    ] }
  ],
  LIGA: [
    { section: null,          items: [{ id: 'jerarquia', label: 'Jerarquía SND',         icon: 'sitemap',  route: 'jerarquia.html' }] },
    { section: 'MIS CLUBES',  items: [
        { id: 'bandeja',   label: 'Mis clubes',              icon: 'inbox',    route: 'bandeja.html' },
        { id: 'cargue',    label: 'Cargue masivo',           icon: 'upload',   route: 'cargue.html' }
    ] }
  ],
  CLUB: [
    { section: null,          items: [{ id: 'jerarquia', label: 'Jerarquía SND',         icon: 'sitemap',  route: 'jerarquia.html' }] },
    { section: 'DEPORTISTAS', items: [
        { id: 'bandeja',   label: 'Solicitudes de deportistas', icon: 'inbox', route: 'bandeja.html' }
    ] }
  ],
  DEPORTISTA: [
    { section: null,          items: [{ id: 'afiliacion', label: 'Mi afiliación',        icon: 'link',     route: 'afiliacion.html' }] }
  ]
};

export function getRoleFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('role');
  return ROLES[code] ? code : 'MINDEPORTE';
}
export function getMenuForRole(code) { return MENU_BY_ROLE[code] || MENU_BY_ROLE.MINDEPORTE; }

/* Home por rol (handoff §10):
   MINDEPORTE/COMITE/FEDERACION/LIGA → Jerarquía · CLUB → Bandeja
   (Solicitudes) · DEPORTISTA → Mi afiliación. */
export function homeForRole(code) {
  if (code === 'CLUB') return 'bandeja.html';
  if (code === 'DEPORTISTA') return 'afiliacion.html';
  return 'jerarquia.html';
}

function hrefForItem(item, roleCode) {
  if (item.route && item.route.includes('.html')) {
    const sep = item.route.includes('?') ? '&' : '?';
    return `${item.route}${sep}role=${roleCode}`;
  }
  return null; // placeholder — no navega aún
}

/* ─── Sidebar ─── */
export function mountSidebar({ rootEl, roleCode, activeId }) {
  const role = ROLES[roleCode] || ROLES.MINDEPORTE;
  const sections = getMenuForRole(role.code);
  const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1';
  rootEl.innerHTML = renderSidebar({ sections, activeId, isCollapsed, roleCode: role.code });
  bindSidebarEvents(rootEl);
  setupTooltips(rootEl);
  return { role, sections };
}

function renderSection(section, activeId, roleCode) {
  return `
    ${section.section ? `<div class="nav-section">${section.section}</div>` : ''}
    ${section.items.map((it) => renderRow(it, activeId, roleCode)).join('')}
  `;
}

function renderRow(item, activeId, roleCode) {
  const isActive = item.id === activeId;
  const href = hrefForItem(item, roleCode);
  const tag = href ? 'a' : 'div';
  const hrefAttr = href ? ` href="${href}"` : '';
  return `
    <${tag} class="nav-row ${item.child ? 'nav-row--child' : ''} ${isActive ? 'active' : ''}" data-id="${item.id}"${hrefAttr}>
      ${isActive && !item.child ? '<span class="active-bar" aria-hidden="true"></span>' : ''}
      <span class="icon">${getIcon(item.icon)}</span>
      <span class="lbl">${item.label}</span>
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </${tag}>
  `;
}

function renderSidebar({ sections, activeId, isCollapsed, roleCode }) {
  return `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="naoweeSidebar">
      <div class="sidebar-logo">
        <button class="burger-btn" id="sidebarToggle" type="button" aria-label="Colapsar menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#282834" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <img src="shared/logos/ministerio.svg" alt="Ministerio del Deporte" class="sb-logo-img"/>
        <div class="logo-sep"></div>
        <img src="shared/logos/suid.png" alt="SUID" class="sb-logo-img"/>
      </div>
      <nav class="sidebar-nav" id="sidebarNav" role="navigation" aria-label="Menú principal">
        ${sections.map((s) => renderSection(s, activeId, roleCode)).join('')}
      </nav>
    </aside>
  `;
}

function bindSidebarEvents(rootEl) {
  const sidebar = rootEl.querySelector('.sidebar');
  const toggle = rootEl.querySelector('#sidebarToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem(COLLAPSED_KEY, sidebar.classList.contains('collapsed') ? '1' : '0');
    });
  }
  /* Placeholders (div sin href): feedback "próximamente" sin navegar */
  rootEl.querySelectorAll('.nav-row:not([href])').forEach((row) => {
    row.addEventListener('click', () => {
      if (row.classList.contains('active')) return;
      flashPlaceholder(row.querySelector('.lbl')?.textContent || 'Esta sección');
      closeDrawer();
    });
  });
  /* Links reales: cerrar drawer antes de navegar */
  rootEl.querySelectorAll('.nav-row[href]').forEach((row) => {
    row.addEventListener('click', closeDrawer);
  });
}

let _toastTimer = null;
function flashPlaceholder(label) {
  let toast = document.getElementById('evToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'evToast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = `${label}: pantalla disponible en una próxima fase de la demo.`;
  toast.classList.add('is-visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* ─── Tooltips para sidebar colapsado ─── */
let _tooltipEl = null;
function setupTooltips(rootEl) {
  const sidebar = rootEl.querySelector('.sidebar');
  if (!sidebar) return;
  if (!_tooltipEl) {
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'nav-tooltip';
    document.body.appendChild(_tooltipEl);
  }
  function show(row) {
    if (!sidebar.classList.contains('collapsed') || window.innerWidth < 1024) return;
    const lbl = row.querySelector('.lbl');
    if (!lbl) return;
    _tooltipEl.textContent = lbl.textContent.trim();
    const r = row.getBoundingClientRect();
    _tooltipEl.style.left = `${r.right + 12}px`;
    _tooltipEl.style.top = `${r.top + r.height / 2}px`;
    _tooltipEl.classList.add('is-visible');
  }
  function hide() { if (_tooltipEl) _tooltipEl.classList.remove('is-visible'); }
  rootEl.querySelectorAll('.nav-row').forEach((row) => {
    row.addEventListener('mouseenter', () => show(row));
    row.addEventListener('mouseleave', hide);
  });
  new MutationObserver(hide).observe(sidebar, { attributes: true, attributeFilter: ['class'] });
}

/* ─── Drawer (mobile) ─── */
function openDrawer() { document.body.classList.add('has-mobile-drawer-open'); }
function closeDrawer() { document.body.classList.remove('has-mobile-drawer-open'); }

/* ─── Header (branding/burger + chip de identidad) ────────────────
   La barra superior lleva branding/burger a la izquierda (en mobile) y el
   chip de identidad a la derecha. El título de cada página vive en el H1
   del contenido. El chip es SOLO identidad (nombre + CC + rol). NO cambia
   de rol — eso vive en el pill demo inferior (mountDemoSwitcher). */
export function mountHeader({ headerEl, role }) {
  const initials = role.avatar || (role.userName || role.label).split(/\s+/).filter(Boolean)
    .slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  headerEl.innerHTML = `
    <button class="header-burger" id="headerBurger" type="button" aria-label="Abrir menú">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
    <div class="profile-switcher" id="profileSwitcher">
      <div class="user-chip" id="userChipTrigger" role="button" tabindex="0" aria-haspopup="menu" aria-label="Mi cuenta">
        <div class="ava">
          <div class="ava-ring" style="background:${role.color}22;color:${role.color}">${initials}</div>
          <div class="ava-dot"></div>
        </div>
        <div class="user-info">
          <span class="user-name">${role.userName}</span>
          <span class="user-role">${role.label}</span>
        </div>
        <button class="user-chip__chevron" type="button" tabindex="-1" aria-hidden="true">${getIcon('chevron')}</button>
      </div>
      <div class="profile-dd profile-dd--identity-only" role="menu">
        <div class="profile-dd__header">
          <span class="ava-ring" style="width:42px;height:42px;font-size:14px;background:${role.color}22;color:${role.color}">${initials}</span>
          <div class="profile-dd__user">
            <strong>${role.userName}</strong>
            <span class="profile-dd__doc">${getIcon('id')}${role.userDoc || '—'}</span>
            <span class="profile-dd__current-role" style="color:${role.color}">
              <span class="profile-dd__check-ico">${getIcon('check')}</span>${role.label}${role.org && role.org !== '—' ? ` · ${role.org}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  bindHeaderEvents(headerEl);
}

function bindHeaderEvents(headerEl) {
  const switcher = headerEl.querySelector('#profileSwitcher');
  const trigger = headerEl.querySelector('#userChipTrigger');
  const burger = headerEl.querySelector('#headerBurger');
  if (burger) burger.addEventListener('click', openDrawer);
  if (!switcher || !trigger) return;
  const toggle = (e) => { e.stopPropagation(); switcher.classList.toggle('open'); };
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  document.addEventListener('click', (e) => { if (!switcher.contains(e.target)) switcher.classList.remove('open'); });
}

/* ─── Backdrop del drawer: click cierra. ESC cierra todo. ─── */
export function mountBackdrop() {
  let bd = document.querySelector('.shell-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.className = 'shell-backdrop';
    document.body.appendChild(bd);
  }
  bd.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      document.getElementById('profileSwitcher')?.classList.remove('open');
      document.getElementById('demoSwitcher')?.classList.remove('is-open');
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   DEMO ROLE SWITCHER — pill flotante INFERIOR centrada (solo sandbox)
   Patrón canónico IVC #1. Contiene: 6 roles AGRUPADOS por nivel de la
   jerarquía + toggle MODO DEMO + Reiniciar tour / Reiniciar demo.
   Cambiar de rol recarga con homeForRole(next)+'?role='+next.
   ═══════════════════════════════════════════════════════════════════ */
const MODE_KEY = 'naowee-organismos-demo-mode';   // 'blank' | 'demo'
const TOUR_KEY = 'naowee-organismos-tour-seen';

export function getDemoMode() {
  const m = localStorage.getItem(MODE_KEY);
  return m === 'blank' || m === 'demo' ? m : 'demo';
}

/* Roles agrupados por nivel de la jerarquía SND (handoff). */
const ROLE_GROUPS = [
  { label: 'Rectoría',          codes: ['MINDEPORTE'] },
  { label: 'Cabezas de sector', codes: ['COMITE'] },
  { label: 'Organismos',        codes: ['FEDERACION', 'LIGA', 'CLUB'] },
  { label: 'Personas',          codes: ['DEPORTISTA'] }
];

function demoToast(msg) {
  let toast = document.getElementById('evToast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'evToast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

export function mountDemoSwitcher({ roleCode }) {
  const current = ROLES[roleCode] || ROLES.MINDEPORTE;

  const renderItem = (p) => {
    const isActive = p.code === current.code;
    const ini = p.avatar || (p.userName || p.label).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return `
      <a class="demo-role-switcher__item ${isActive ? 'is-active' : ''}"
         href="#" data-perfil="${p.code}">
        <span class="demo-role-switcher__item-avatar" style="background:${p.color}22;color:${p.color}">${ini}</span>
        <span class="demo-role-switcher__item-meta">
          <span class="demo-role-switcher__item-name">${p.userName || p.label}</span>
          <span class="demo-role-switcher__item-role">${p.label}${p.org && p.org !== '—' ? ` · ${p.org}` : ''}</span>
        </span>
        ${isActive ? `<span class="demo-role-switcher__check">${getIcon('check')}</span>` : ''}
      </a>`;
  };

  const listHtml = ROLE_GROUPS.map((g) => {
    const items = g.codes.map((c) => ROLES[c]).filter(Boolean).map(renderItem).join('');
    if (!items) return '';
    return `<div class="demo-role-switcher__group-label">${g.label}</div>${items}`;
  }).join('');

  const root = document.createElement('div');
  root.className = 'demo-role-switcher';
  root.id = 'demoSwitcher';
  root.innerHTML = `
    <button class="demo-role-switcher__toggle" id="demoSwitcherToggle" type="button" aria-haspopup="true" aria-expanded="false">
      <span class="demo-role-switcher__badge">DEMO</span>
      <span class="demo-role-switcher__avatar" style="background:${current.color}22;color:${current.color}">${current.avatar || 'OR'}</span>
      <span>Cambiar perfil</span>
      <span class="demo-role-switcher__chev">${getIcon('chevron')}</span>
    </button>
    <div class="demo-role-switcher__panel" id="demoSwitcherPanel" role="menu">
      <div class="demo-role-switcher__panel-label">CAMBIAR DE PERFIL (SIMULADO)</div>
      <div class="demo-role-switcher__list">${listHtml}</div>
      <div class="demo-role-switcher__mode-section">
        <div class="demo-role-switcher__mode-label">MODO DEMO</div>
        <div class="demo-role-switcher__mode-switch" role="group" aria-label="Modo demo">
          <button type="button" class="demo-role-switcher__mode-btn" data-mode="blank" title="Estado vacío — para recorrer el flujo paso a paso">Guiado · vacío</button>
          <button type="button" class="demo-role-switcher__mode-btn" data-mode="demo" title="Datos de ejemplo cargados para explorar">Libre · con datos</button>
        </div>
      </div>
      <div class="demo-role-switcher__panel-footer">
        <button type="button" class="demo-role-switcher__action" id="demoRestartTourBtn">${getIcon('refresh')}<span>Reiniciar tour</span></button>
        <button type="button" class="demo-role-switcher__action demo-role-switcher__action--quiet" id="demoResetBtn" title="Limpia el state de la demo">Reiniciar demo</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  bindDemoSwitcher(root);
}

function bindDemoSwitcher(root) {
  const toggle = root.querySelector('#demoSwitcherToggle');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = root.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) root.classList.remove('is-open'); });

  /* Cambio de perfil → recarga con homeForRole(next)+'?role='+next. */
  root.querySelectorAll('[data-perfil]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const next = item.getAttribute('data-perfil');
      if (!ROLES[next]) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === next) { root.classList.remove('is-open'); return; }
      window.location.href = `${homeForRole(next)}?role=${next}`;
    });
  });

  /* MODO DEMO (Guiado·vacío / Libre·con datos) — persiste en localStorage.
     En T1 es scaffolding para el tour (T8); dispara un evento consumible. */
  const syncMode = () => {
    const cur = getDemoMode();
    root.querySelectorAll('.demo-role-switcher__mode-btn').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.mode === cur ? 'true' : 'false');
    });
  };
  syncMode();
  root.querySelectorAll('.demo-role-switcher__mode-btn').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = b.dataset.mode;
      if (mode === getDemoMode()) return;
      localStorage.setItem(MODE_KEY, mode);
      syncMode();
      root.classList.remove('is-open');
      window.dispatchEvent(new CustomEvent('organismos:demo-mode', { detail: { mode } }));
      setTimeout(() => demoToast(
        mode === 'demo'
          ? 'Modo libre: datos de ejemplo cargados.'
          : 'Modo guiado: estado vacío para recorrer el flujo.'
      ), 160);
    });
  });

  /* Reiniciar tour */
  root.querySelector('#demoRestartTourBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.removeItem(TOUR_KEY);
    root.classList.remove('is-open');
    demoToast('Tour reiniciado — se mostrará en tu próxima visita.');
  });

  /* Reiniciar demo (full reset → barre TODO el state 'naowee-organismos-*'
     en ambos storages y vuelve al selector de perfil). */
  root.querySelector('#demoResetBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.confirm('¿Reiniciar la demo? Se borran los organismos, solicitudes y datos que creaste y se restablecen el modo y el tour.')) {
      [sessionStorage, localStorage].forEach((store) => {
        for (let i = store.length - 1; i >= 0; i--) {
          const k = store.key(i);
          if (k && k.startsWith('naowee-organismos-')) store.removeItem(k);
        }
      });
      window.location.href = 'index.html';
    }
  });
}
