/**
 * Unificación — Portal Jurídico OGJ
 * Code.gs — Lógica server-side principal
 */

// ─── ENTRY POINT ────────────────────────────────────────────────
function doGet() {
  return HtmlService.createTemplateFromFile('src/html/Sidebar')
    .evaluate()
    .setTitle('Portal OGJ — Unificación')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper para incluir archivos HTML/CSS/JS como templates.
 * Uso en HTML: <?!= include('src/html/Dashboard'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── MOCK DATA ───────────────────────────────────────────────────

function getDashboardData() {
  return {
    kpis: {
      expedientesActivos: 142,
      audienciasProgramadas: 18,
      escritosPendientes: 7,
      casosNuevosHoy: 3
    },
    alertas: [
      { tipo: 'urgente', texto: 'Audiencia programada para hoy — Exp. 2024-0451', hora: '10:00' },
      { tipo: 'aviso',   texto: 'Vencimiento de plazo — Exp. 2024-0388', hora: 'mañana' },
      { tipo: 'info',    texto: '3 escritos sin asignar en Mesa de Entradas', hora: '' }
    ]
  };
}

function getMesaEntradasData() {
  return {
    escritos: [
      { id: 'ESC-2024-001', fecha: '14/04/2024', remitente: 'Dr. García',     asunto: 'Solicitud de prórroga',       estado: 'pendiente' },
      { id: 'ESC-2024-002', fecha: '14/04/2024', remitente: 'Dra. Martínez',  asunto: 'Presentación de pruebas',     estado: 'asignado'  },
      { id: 'ESC-2024-003', fecha: '13/04/2024', remitente: 'Dr. López',      asunto: 'Recurso de apelación',        estado: 'resuelto'  },
      { id: 'ESC-2024-004', fecha: '13/04/2024', remitente: 'Dra. Rodríguez', asunto: 'Informe pericial',            estado: 'pendiente' },
      { id: 'ESC-2024-005', fecha: '12/04/2024', remitente: 'Dr. Torres',     asunto: 'Notificación de sentencia',   estado: 'asignado'  }
    ],
    audiencias: [
      { id: 'AUD-2024-018', fecha: '15/04/2024', hora: '09:00', causa: 'Exp. 2024-0312', tipo: 'Preliminar',   sala: '3', estado: 'confirmada' },
      { id: 'AUD-2024-019', fecha: '15/04/2024', hora: '10:30', causa: 'Exp. 2024-0451', tipo: 'Oral',         sala: '1', estado: 'confirmada' },
      { id: 'AUD-2024-020', fecha: '16/04/2024', hora: '11:00', causa: 'Exp. 2024-0280', tipo: 'Sentencia',    sala: '2', estado: 'pendiente'  },
      { id: 'AUD-2024-021', fecha: '17/04/2024', hora: '09:30', causa: 'Exp. 2024-0499', tipo: 'Preliminar',   sala: '4', estado: 'pendiente'  },
      { id: 'AUD-2024-022', fecha: '18/04/2024', hora: '14:00', causa: 'Exp. 2024-0355', tipo: 'Apelación',    sala: '1', estado: 'pendiente'  }
    ]
  };
}

function getAgendaData() {
  return [
    { fecha: '14/04/2024', hora: '09:00', evento: 'Audiencia preliminar',    expediente: '2024-0312', responsable: 'Juez Fernández' },
    { fecha: '14/04/2024', hora: '11:30', evento: 'Vencimiento de plazo',    expediente: '2024-0388', responsable: 'Sec. López' },
    { fecha: '15/04/2024', hora: '09:00', evento: 'Audiencia oral',          expediente: '2024-0451', responsable: 'Juez Fernández' },
    { fecha: '16/04/2024', hora: '10:00', evento: 'Dictado de sentencia',    expediente: '2024-0280', responsable: 'Juez Castro' },
    { fecha: '17/04/2024', hora: '15:00', evento: 'Pericia psicológica',     expediente: '2024-0499', responsable: 'Perito Gómez' }
  ];
}

function getNotificacionesData() {
  return [
    { id: 'N-001', tipo: 'urgente', titulo: 'Audiencia hoy a las 10:00',         descripcion: 'Exp. 2024-0451 — Sala 1',   fecha: 'hace 1h',   leida: false },
    { id: 'N-002', tipo: 'aviso',   titulo: 'Plazo vence mañana',                descripcion: 'Exp. 2024-0388 — Art. 208', fecha: 'hace 3h',   leida: false },
    { id: 'N-003', tipo: 'info',    titulo: 'Nuevo escrito recibido',            descripcion: 'ESC-2024-005 de Dr. Torres',fecha: 'hace 5h',   leida: false },
    { id: 'N-004', tipo: 'sistema', titulo: 'Backup completado',                 descripcion: 'Sistema sincronizado',       fecha: 'ayer',      leida: true  },
    { id: 'N-005', tipo: 'info',    titulo: 'Licencia aprobada',                 descripcion: 'Sec. Ramírez — 3 días',     fecha: 'ayer',      leida: true  }
  ];
}

function getExpedientesData() {
  return {
    expedientes: [
      { id: '2024-0312', imputado: 'Juan Pérez',        delito: 'Robo calificado',     estado: 'activo',   juez: 'Fernández', fecha: '10/01/2024' },
      { id: '2024-0355', imputado: 'Carlos Sánchez',    delito: 'Estafa',              estado: 'activo',   juez: 'Castro',    fecha: '15/01/2024' },
      { id: '2024-0388', imputado: 'Ana González',      delito: 'Lesiones graves',     estado: 'activo',   juez: 'López',     fecha: '22/01/2024' },
      { id: '2024-0451', imputado: 'Roberto Díaz',      delito: 'Homicidio culposo',   estado: 'activo',   juez: 'Fernández', fecha: '05/02/2024' },
      { id: '2024-0499', imputado: 'María Rodríguez',   delito: 'Encubrimiento',       estado: 'pendiente',juez: 'Morales',   fecha: '12/02/2024' }
    ]
  };
}

function getCronogramaData() {
  return [
    { semana: '14 - 18 Abr', lunes: 'AUD-0312 09:00', martes: '', miercoles: 'AUD-0451 10:30', jueves: 'AUD-0499 09:30', viernes: '' },
    { semana: '21 - 25 Abr', lunes: '', martes: 'AUD-0355 14:00', miercoles: '', jueves: '', viernes: 'Feria' }
  ];
}

function getLicenciasData() {
  return [
    { agente: 'Sec. Ramírez',    tipo: 'Anual',     desde: '14/04/2024', hasta: '16/04/2024', dias: 3,  estado: 'aprobada' },
    { agente: 'Dr. Morales',     tipo: 'Médica',    desde: '10/04/2024', hasta: '11/04/2024', dias: 2,  estado: 'aprobada' },
    { agente: 'Dra. Castro',     tipo: 'Anual',     desde: '21/04/2024', hasta: '30/04/2024', dias: 10, estado: 'pendiente' },
    { agente: 'Sec. Gutierrez',  tipo: 'Por examen',desde: '18/04/2024', hasta: '18/04/2024', dias: 1,  estado: 'aprobada' }
  ];
}
