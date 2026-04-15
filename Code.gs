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

// ─── SHEET CONFIG ────────────────────────────────────────────────
var SPREADSHEET_ID = '197EOO8Sw_RYmknEyIrQ8WcBUGHR5IIYQmemqcJyeE4A';
var HOJA_ESCRITOS      = '.ESCRITOS';
var HOJA_SOLICITUDES   = '.SOLICITUDES';

// Hojas del módulo Agenda (ya existen en el Sheet)
var HOJA_ESC_PENDIENTES = 'ESC_PENDIENTES';
var HOJA_SOL_PENDIENTES = 'SOL_PENDIENTES';
var HOJA_ESC_AGENDADOS  = 'ESC_AGENDADOS';
var HOJA_SOL_AGENDADOS  = 'SOL_AGENDADOS';

/**
 * Lee toda la hoja .ESCRITOS y devuelve escritos + estados únicos + destinos únicos.
 * Columnas reales: A:USUARIO, B:ID, C:FECHA INGRESO, D:HORA INGRESO, E:ORIGEN, F:CUIJ, G:CARATULA,
 *                 I:TIPO SOLICITANTE, K:TIPO SOLICITUD, L:INFO ADICIONAL, M:ESTADO LEGAJO,
 *                 N:USUARIO TRAMITE, O:TRAMITE, P:DESTINO, Q:VIA, R:OBSERVACIONES, S:ESTADO, T:TIMESTAMP TRAMITE
 * (H:SOLICITANTE se omite)
 */
function getEscritosData() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(HOJA_ESCRITOS);
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return { escritos: [], estados: ['Pendientes', 'Finalizada'], destinos: [] };
    }

    // Columnas A:T (20 cols) - se salta H (posición 8)
    var raw = sheet.getRange(2, 1, lastRow - 1, 20).getDisplayValues();

    var estadosSet  = [];
    var destinosSet = [];

    var escritos = raw
      .map(function(row) {
        return {
          usuario:           row[0],   // A - USUARIO
          id:                row[1],   // B - ID
          fecha:             row[2],   // C - FECHA INGRESO
          hora:              row[3],   // D - HORA INGRESO
          origen:            row[4],   // E - ORIGEN
          cuij:              row[5],   // F - CUIJ
          caratula:          row[6],   // G - CARATULA
          // H - SOLICITANTE (omitido)
          tipoSolicitante:   row[8],   // I - TIPO SOLICITANTE
          tipoSolicitud:     row[10],  // K - TIPO SOLICITUD
          infoAdicional:     row[11],  // L - INFO ADICIONAL
          estadoLegajo:      row[12],  // M - ESTADO LEGAJO
          usuarioTramite:    row[13],  // N - USUARIO TRAMITE
          tramite:           row[14],  // O - TRAMITE
          destino:           row[15],  // P - DESTINO
          via:               row[16],  // Q - VIA
          obs:               row[17],  // R - OBSERVACIONES
          estado:            row[18],  // S - ESTADO
          timestampTramite:  row[19]   // T - TIMESTAMP TRAMITE
        };
      })
      .filter(function(e) { return e.id && e.id.trim(); }); // omite filas vacías

    // Extraer únicos
    escritos.forEach(function(e) {
      if (e.estado  && estadosSet.indexOf(e.estado)   === -1) estadosSet.push(e.estado);
      if (e.destino && destinosSet.indexOf(e.destino) === -1) destinosSet.push(e.destino);
    });

    if (estadosSet.length === 0) estadosSet = ['Pendientes', 'Finalizada'];

    return { escritos: escritos, estados: estadosSet, destinos: destinosSet };
  } catch(err) {
    return { error: err.message, escritos: [], estados: ['Pendientes', 'Finalizada'], destinos: [] };
  }
}

/**
 * Lee la hoja .SOLICITUDES 
 * Columnas: A(usuario) B(id) C(fechaYHora) D(cuij) E(caratula) F(vencimiento) 
 *          G(observaciones) H(estado) I(motivoRechazo) J(timestamp)
 */
function getSolicitudesData() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(HOJA_SOLICITUDES);
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return { solicitudes: [], estados: [] };
    }

    // Columnas A:J (10 cols)
    var raw = sheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues();

    var solicitudes = raw
      .map(function(row) {
        return {
          usuario:        row[0],   // A
          id:             row[1],   // B
          fechaYHora:     row[2],   // C (DD/MM/YYYY HH:MM)
          cuij:           row[3],   // D
          caratula:       row[4],   // E
          vencimiento:    row[5],   // F
          observaciones: row[6],   // G
          estado:         row[7],   // H
          motivoRechazo:  row[8],   // I
          timestamp:     row[9]    // J
        };
      })
      .filter(function(s) { return s.id && s.id.trim(); });

    return { solicitudes: solicitudes };
  } catch(err) {
    return { error: err.message, solicitudes: [] };
  }
}

// Devuelve el conteo de items pendientes para el sidebar
function getPendingCounts() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Conteo de escritos pendientes
    var sheetEscritos = ss.getSheetByName(HOJA_ESCRITOS);
    var escritosPendientes = 0;
    if (sheetEscritos && sheetEscritos.getLastRow() > 1) {
      var estadoCol = 15; // Columna O (estado)
      var data = sheetEscritos.getRange(2, estadoCol, sheetEscritos.getLastRow() - 1, 1).getDisplayValues();
      data.forEach(function(row) {
        var est = (row[0] || '').trim().toLowerCase();
        if (est === 'pendientes') {
          escritosPendientes++;
        }
      });
    }
    
    // Conteo de solicitudes pendientes
    var sheetSolicitudes = ss.getSheetByName(HOJA_SOLICITUDES);
    var solicitudesPendientes = 0;
    if (sheetSolicitudes && sheetSolicitudes.getLastRow() > 1) {
      var estadoColS = 8; // Columna H (estado)
      var dataS = sheetSolicitudes.getRange(2, estadoColS, sheetSolicitudes.getLastRow() - 1, 1).getDisplayValues();
      dataS.forEach(function(row) {
        var est = (row[0] || '').trim().toLowerCase();
        if (est === 'pendiente') {
          solicitudesPendientes++;
        }
      });
    }
    
    return {
      escritos: escritosPendientes,
      solicitudes: solicitudesPendientes,
      total: escritosPendientes + solicitudesPendientes
    };
  } catch(err) {
    return { error: err.message, escritos: 0, solicitudes: 0, total: 0 };
  }
}

// Lee las 4 hojas del módulo Agenda directamente
function getAgendaData() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Helper: leer una hoja y devolver array de objetos
    function leerHoja(nombreHoja, tipoItem) {
      var sheet = ss.getSheetByName(nombreHoja);
      if (!sheet || sheet.getLastRow() <= 1) return [];
      
      var lastCol = sheet.getLastColumn();
      var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getDisplayValues();
      
      return data.map(function(row) {
        // Ajustar según las columnas reales de cada hoja
        // Suponiendo: A=ID, B=Fecha, C=Hora, D=CUIJ, E=Carátula, F=Estado
        return {
          tipo:      tipoItem,
          id:        row[0] || '',
          fecha:     row[1] || '',
          hora:      row[2] || '',
          cuij:      row[3] || '',
          caratula:  row[4] || '',
          estado:    row[5] || '',
          rowIndex:  0 // No necesario para solo lectura
        };
      }).filter(function(item) { return item.id && item.id.trim(); });
    }

    var preEscritos    = leerHoja(HOJA_ESC_PENDIENTES,    'escrito');
    var preSolicitudes = leerHoja(HOJA_SOL_PENDIENTES,     'solicitud');
    var agEscritos     = leerHoja(HOJA_ESC_AGENDADOS,     'escrito');
    var agSolicitudes  = leerHoja(HOJA_SOL_AGENDADOS,      'solicitud');

    return {
      preEscritos:    preEscritos,
      preSolicitudes: preSolicitudes,
      agEscritos:     agEscritos,
      agSolicitudes:  agSolicitudes
    };
  } catch(err) {
    return { error: err.message, preEscritos: [], preSolicitudes: [], agEscritos: [], agSolicitudes: [] };
  }
}

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
