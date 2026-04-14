/**
 * Unificación — Portal OGJ
 * ClientLogic.js — Navegación y lógica del cliente
 */

(function () {
  'use strict';

  // ── NAVEGACIÓN ────────────────────────────────────────────────

  /**
   * Navega a un módulo por su ID.
   * @param {string} moduleId  - ID del módulo (ej: 'dashboard', 'mesa-entradas')
   */
  function navigateTo(moduleId) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module').forEach(function (el) {
      el.classList.remove('active');
    });

    // Mostrar el módulo target
    var target = document.getElementById('module-' + moduleId);
    if (target) {
      target.classList.add('active');
    }

    // Actualizar estado activo del nav
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.remove('active');
    });

    var activeNav = document.querySelector('[data-module="' + moduleId + '"]');
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Scroll al top del contenido
    document.getElementById('content').scrollTop = 0;
  }

  // Exponer globalmente para uso en botones inline
  window.navigateTo = navigateTo;

  // ── TABS ─────────────────────────────────────────────────────

  /**
   * Inicializa el sistema de tabs.
   * Busca todos los .tab-item y registra click handlers.
   */
  function initTabs() {
    document.querySelectorAll('.tab-item').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var tabId = this.getAttribute('data-tab');
        if (!tabId) return;

        // Buscar el contenedor padre de tabs
        var tabsContainer = this.closest('.tabs');
        var moduleEl = this.closest('.module');

        // Desactivar tabs siblings
        tabsContainer.querySelectorAll('.tab-item').forEach(function (t) {
          t.classList.remove('active');
        });
        this.classList.add('active');

        // Ocultar todos los tab-panels del módulo
        moduleEl.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.remove('active');
        });

        // Mostrar el panel correspondiente
        var panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── NAV CLICK HANDLERS ────────────────────────────────────────

  function initNav() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var moduleId = this.getAttribute('data-module');
        if (moduleId) navigateTo(moduleId);
      });
    });
  }

  // ── FILTROS ──────────────────────────────────────────────────

  /**
   * Filtra filas de una tabla según el texto de un input.
   * @param {HTMLInputElement} input
   * @param {string} tableSelector - selector CSS de la tabla a filtrar
   */
  function filterTable(input, tableSelector) {
    var query = input.value.toLowerCase().trim();
    var rows = document.querySelectorAll(tableSelector + ' tbody tr');

    rows.forEach(function (row) {
      var text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function initFilters() {
    // Mesa de Entradas — Escritos
    var escFilter = document.querySelector('#me-escritos .filter-input');
    if (escFilter) {
      escFilter.addEventListener('input', function () {
        filterTable(this, '#me-escritos');
      });
    }

    // Mesa de Entradas — Select estado escritos
    var escSelect = document.querySelector('#me-escritos .filter-select');
    if (escSelect) {
      escSelect.addEventListener('change', function () {
        var val = this.value.toLowerCase();
        document.querySelectorAll('#me-escritos tbody tr').forEach(function (row) {
          if (!val) { row.style.display = ''; return; }
          var badge = row.querySelector('.badge');
          var estado = badge ? badge.textContent.toLowerCase() : '';
          row.style.display = estado.includes(val) ? '' : 'none';
        });
      });
    }

    // Mesa de Entradas — Audiencias búsqueda
    var audFilter = document.querySelector('#me-audiencias .filter-input');
    if (audFilter) {
      audFilter.addEventListener('input', function () {
        filterTable(this, '#me-audiencias');
      });
    }

    // Expedientes
    var expFilter = document.querySelector('#module-expedientes .filter-input');
    if (expFilter) {
      expFilter.addEventListener('input', function () {
        filterTable(this, '#module-expedientes');
      });
    }
  }

  // ── INIT ─────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initTabs();
    initFilters();
  });

})();
